const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { sql, poolPromise } = require("../config/db");

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

// STEP 1 of login: check email + password. If correct, we don't log the
// user in yet — we issue a short-lived tempToken and a 6-digit OTP that
// verify-otp will check next. This matches authApi.login()'s expected
// response shape: { user, requiresTwoFactor, tempToken }.
async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("email", sql.NVarChar, email)
      .query("SELECT * FROM tms_users WHERE email = @email");

    const user = result.recordset[0];
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const passwordMatches = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatches) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (user.status === "inactive") {
      return res.status(403).json({ message: "This account has been deactivated" });
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
      .input("expiresAt", sql.DateTime2, otpExpiryDate())
      .query(`
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
      return res.status(400).json({ message: "tempToken and otp are required" });
    }

    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("tempToken", sql.NVarChar, tempToken)
      .query(`
        SELECT TOP 1 * FROM tms_otp_codes
        WHERE temp_token = @tempToken
        ORDER BY id DESC
      `);

    const record = result.recordset[0];
    if (!record || record.used) {
      return res.status(401).json({ message: "This code is no longer valid, please log in again" });
    }
    if (new Date(record.expires_at) < new Date()) {
      return res.status(401).json({ message: "This code has expired, please log in again" });
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
  };
}

module.exports = { login, verifyOtp, logout, getCurrentUser };
