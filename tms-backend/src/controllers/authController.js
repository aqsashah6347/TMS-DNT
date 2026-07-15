const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { sql, poolPromise } = require("../config/db");
const { authenticateEmployee } = require("../services/zkEmployeeService");

// Turn a JS ms duration string like "10m" into minutes for DATEADD.
// Kept simple on purpose since we only ever use "10m" here.
function otpExpiryDate() {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 10);
  return now;
}

function signToken(user) {
  return jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" },
  );
}

// STEP 1 of login: check employeeId (or email) + password. If correct, we
// don't log the user in yet — we issue a short-lived tempToken and a
// 6-digit OTP that verify-otp will check next. This matches
// authApi.login()'s expected response shape: { user, requiresTwoFactor, tempToken }.
//
// Two ways in:
//   1. employeeId + password  -> checked against the HRM /api/employees
//      list (http://103.134.238.50:91/api/employees). On first successful
//      login for a given employee, we auto-create (or link, via
//      enroll_no) a matching row in tms_users so the rest of the app
//      (tasks, projects, permissions, etc.) works exactly like it does today.
//   2. email + password       -> legacy path, checked against the local
//      tms_users.password_hash column. Useful for admin/manual accounts
//      that don't exist in the HRM system.
async function login(req, res, next) {
  try {
    const { employeeId, email, password } = req.body;
    const identifier = employeeId || email;

    if (!identifier || !password) {
      return res
        .status(400)
        .json({ message: "Employee ID and password are required" });
    }

    const pool = await poolPromise;
    let user;

    if (identifier.includes("@")) {
      // ---- Legacy path: email + local password_hash ----
      const result = await pool
        .request()
        .input("email", sql.NVarChar, identifier)
        .query("SELECT * FROM tms_users WHERE email = @email");

      user = result.recordset[0];
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const passwordMatches = await bcrypt.compare(
        password,
        user.password_hash,
      );
      if (!passwordMatches) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
    } else {
      // ---- Employee ID path: verify against the HRM API ----
      const employee = await authenticateEmployee(identifier, password);
      if (!employee) {
        return res
          .status(401)
          .json({ message: "Invalid employee ID or password" });
      }

      const linked = await pool
        .request()
        .input("enrollNo", sql.NVarChar, employee.employeeCode)
        .query("SELECT * FROM tms_users WHERE enroll_no = @enrollNo");

      user = linked.recordset[0];

      if (!user) {
        // First time this employee has logged in — create a local
        // tms_users row for them so tasks/projects/permissions all work.
        // password_hash is never used for this account (login always
        // goes through the HRM API instead), so we just fill it with a
        // random value to satisfy the NOT NULL column.
        const randomHash = await bcrypt.hash(
          crypto.randomBytes(20).toString("hex"),
          10,
        );

        const created = await pool
          .request()
          .input("name", sql.NVarChar, employee.fullName)
          .input("email", sql.NVarChar, `${employee.employeeCode}@dnt.local`)
          .input("passwordHash", sql.NVarChar, randomHash)
          .input("enrollNo", sql.NVarChar, employee.employeeCode).query(`
            INSERT INTO tms_users (name, email, password_hash, enroll_no)
            OUTPUT INSERTED.*
            VALUES (@name, @email, @passwordHash, @enrollNo)
          `);

        user = created.recordset[0];
      } else if (user.name !== employee.fullName) {
        // Keep the display name in sync with the HRM system.
        await pool
          .request()
          .input("id", sql.Int, user.id)
          .input("name", sql.NVarChar, employee.fullName)
          .query("UPDATE tms_users SET name = @name WHERE id = @id");

        user.name = employee.fullName;
      }
    }

    if (user.status === "inactive") {
      return res
        .status(403)
        .json({ message: "This account has been deactivated" });
    }

    // Skip OTP entirely for users who don't have 2FA turned on.
    if (!user.two_factor_enabled) {
      const token = signToken(user);
      return res.json({
        user: publicUser(user),
        requiresTwoFactor: false,
        token,
      });
    }

    const tempToken = crypto.randomBytes(24).toString("hex");
    const otpCode = String(Math.floor(100000 + Math.random() * 900000)); // 6 digits

    await pool
      .request()
      .input("userId", sql.Int, user.id)
      .input("tempToken", sql.NVarChar, tempToken)
      .input("otpCode", sql.NVarChar, otpCode)
      .input("expiresAt", sql.DateTime2, otpExpiryDate()).query(`
        INSERT INTO tms_otp_codes (user_id, temp_token, otp_code, expires_at)
        VALUES (@userId, @tempToken, @otpCode, @expiresAt)
      `);

    // There's no email/SMS service wired up yet, so for now we just log
    // the code to the backend terminal. Once you're ready, swap this for
    // a real email using nodemailer — everything else stays the same.
    console.log(`🔐 OTP for ${user.email}: ${otpCode}`);

    res.json({
      user: publicUser(user),
      requiresTwoFactor: true,
      tempToken,
    });
  } catch (err) {
    next(err);
  }
}

// STEP 2 of login: verify the OTP against the tempToken from step 1.
async function verifyOtp(req, res, next) {
  try {
    const { tempToken, otp } = req.body;
    if (!tempToken || !otp) {
      return res
        .status(400)
        .json({ message: "tempToken and otp are required" });
    }

    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("tempToken", sql.NVarChar, tempToken).query(`
        SELECT TOP 1 * FROM tms_otp_codes
        WHERE temp_token = @tempToken
        ORDER BY id DESC
      `);

    const record = result.recordset[0];
    if (!record || record.used) {
      return res
        .status(401)
        .json({ message: "This code is no longer valid, please log in again" });
    }
    if (new Date(record.expires_at) < new Date()) {
      return res
        .status(401)
        .json({ message: "This code has expired, please log in again" });
    }
    if (record.otp_code !== String(otp)) {
      return res.status(401).json({ message: "Incorrect code" });
    }

    await pool
      .request()
      .input("id", sql.Int, record.id)
      .query("UPDATE tms_otp_codes SET used = 1 WHERE id = @id");

    const userResult = await pool
      .request()
      .input("id", sql.Int, record.user_id)
      .query("SELECT * FROM tms_users WHERE id = @id");

    const user = userResult.recordset[0];
    const token = signToken(user);

    res.json({ user: publicUser(user), token });
  } catch (err) {
    next(err);
  }
}

// JWTs can't be "deleted" server-side without a blocklist, so logout is
// mostly a frontend concern (clear the stored token). This endpoint just
// exists so authApi.logout() has something to call.
async function logout(req, res) {
  res.json({ message: "Logged out" });
}

async function getCurrentUser(req, res, next) {
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("id", sql.Int, req.user.id)
      .query("SELECT * FROM tms_users WHERE id = @id");

    const user = result.recordset[0];
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(publicUser(user));
  } catch (err) {
    next(err);
  }
}

// Never send password_hash back to the frontend.
function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    twoFactorEnabled: user.two_factor_enabled,
    avatarUrl: user.avatar_url,
    avatarColor: user.avatar_color,
  };
}

module.exports = { login, verifyOtp, logout, getCurrentUser };
