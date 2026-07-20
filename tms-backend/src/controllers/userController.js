const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { sql, getPool } = require("../config/db");

// Used both by /auth/register (first-time setup) and by admins adding
// new users from the Admin page.
async function register(req, res, next) {
  try {
    const { name, email, password, role = "user" } = req.body;
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Name, email and password are required" });
    }

    const pool = await getPool();

    const existing = await pool
      .request()
      .input("email", sql.NVarChar, email)
      .query("SELECT id FROM tms_users WHERE email = @email");

    if (existing.recordset.length > 0) {
      return res
        .status(409)
        .json({ message: "An account with this email already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool
      .request()
      .input("name", sql.NVarChar, name)
      .input("email", sql.NVarChar, email)
      .input("passwordHash", sql.NVarChar, passwordHash)
      .input("role", sql.NVarChar, role).query(`
        INSERT INTO tms_users (name, email, password_hash, role)
        OUTPUT INSERTED.id, INSERTED.name, INSERTED.email, INSERTED.role, INSERTED.status
        VALUES (@name, @email, @passwordHash, @role)
      `);

    res.status(201).json(result.recordset[0]);
  } catch (err) {
    next(err);
  }
}

// POST /api/users/from-roster — the Access page's "quick assign" flow.
// Lets an admin give a ZK roster employee a role before they've ever
// logged into TMS, instead of waiting for authController's login-time
// auto-create. Mirrors that exact same creation shape (random unused
// password hash, since real login always goes through the HRM API, plus
// an auto email and enroll_no link) so if this employee later logs in
// with their employee ID, authController finds this same row by
// enroll_no instead of creating a duplicate.
async function createFromRoster(req, res, next) {
  try {
    const { name, employeeCode, role = "user" } = req.body;

    if (!name || !employeeCode) {
      return res
        .status(400)
        .json({ message: "name and employeeCode are required" });
    }
    if (!["admin", "manager", "user"].includes(role)) {
      return res.status(400).json({ message: `Unknown role: ${role}` });
    }

    const pool = await getPool();

    const existing = await pool
      .request()
      .input("enrollNo", sql.NVarChar, employeeCode)
      .query("SELECT * FROM tms_users WHERE enroll_no = @enrollNo");

    let user;
    let created;

    if (existing.recordset[0]) {
      // Already linked (they may have logged in once already) — just
      // apply the role the admin picked rather than making a duplicate.
      const updated = await pool
        .request()
        .input("id", sql.Int, existing.recordset[0].id)
        .input("role", sql.NVarChar, role).query(`
          UPDATE tms_users SET role = @role
          OUTPUT INSERTED.id, INSERTED.name, INSERTED.email, INSERTED.role, INSERTED.status, INSERTED.enroll_no
          WHERE id = @id
        `);
      user = updated.recordset[0];
      created = false;
    } else {
      const randomHash = await bcrypt.hash(
        crypto.randomBytes(20).toString("hex"),
        10,
      );

      const inserted = await pool
        .request()
        .input("name", sql.NVarChar, name)
        .input("email", sql.NVarChar, `${employeeCode}@dnt.local`)
        .input("passwordHash", sql.NVarChar, randomHash)
        .input("role", sql.NVarChar, role)
        .input("enrollNo", sql.NVarChar, employeeCode).query(`
          INSERT INTO tms_users (name, email, password_hash, role, enroll_no)
          OUTPUT INSERTED.id, INSERTED.name, INSERTED.email, INSERTED.role, INSERTED.status, INSERTED.enroll_no
          VALUES (@name, @email, @passwordHash, @role, @enrollNo)
        `);
      user = inserted.recordset[0];
      created = true;
    }

    await pool
      .request()
      .input("actorId", sql.Int, req.user.id)
      .input(
        "action",
        sql.NVarChar,
        `${created ? "Created" : "Linked"} account for ${name}, assigned role '${role}'`,
      )
      .query(
        "INSERT INTO tms_audit_log (actor_id, action) VALUES (@actorId, @action)",
      );

    res.status(created ? 201 : 200).json(user);
  } catch (err) {
    next(err);
  }
}

// GET /api/users — used by Admin page and by dropdowns (assignee pickers etc).
async function getAllUsers(req, res, next) {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
        SELECT id, name, email, role, status, enroll_no, avatar_color AS avatarColor
        FROM tms_users ORDER BY name ASC
      `);

    res.json(result.recordset);
  } catch (err) {
    next(err);
  }
}

// PUT /api/users/me/avatar-color — self-service only. Any logged-in user can
// change their own profile icon color (not anyone else's). Storing it here
// instead of localStorage means it follows them to any device and shows up
// correctly wherever OTHER users see their avatar too (teams, projects...).
const AVATAR_COLOR_RE = /^#[0-9a-fA-F]{6}$/;

async function updateMyAvatarColor(req, res, next) {
  try {
    const { color } = req.body;
    if (!color || !AVATAR_COLOR_RE.test(color)) {
      return res
        .status(400)
        .json({ message: "color must be a hex string like #f97316" });
    }

    const pool = await getPool();
    const result = await pool
      .request()
      .input("id", sql.Int, req.user.id)
      .input("color", sql.NVarChar, color).query(`
        UPDATE tms_users SET avatar_color = @color
        OUTPUT INSERTED.id, INSERTED.name, INSERTED.email, INSERTED.role,
               INSERTED.status, INSERTED.enroll_no, INSERTED.avatar_color AS avatarColor
        WHERE id = @id
      `);

    if (result.recordset.length === 0)
      return res.status(404).json({ message: "User not found" });

    res.json(result.recordset[0]);
  } catch (err) {
    next(err);
  }
}

async function updateUser(req, res, next) {
  try {
    const { name, role, status, enroll_no } = req.body;
    const pool = await getPool();
    const request = pool.request().input("id", sql.Int, req.params.id);
    const setClauses = [];

    if (name !== undefined) {
      request.input("name", sql.NVarChar, name);
      setClauses.push("name = @name");
    }
    if (role !== undefined) {
      request.input("role", sql.NVarChar, role);
      setClauses.push("role = @role");
    }
    if (status !== undefined) {
      request.input("status", sql.NVarChar, status);
      setClauses.push("status = @status");
    }
    if (enroll_no !== undefined) {
      request.input("enrollNo", sql.NVarChar, enroll_no);
      setClauses.push("enroll_no = @enrollNo");
    }

    if (setClauses.length === 0)
      return res.status(400).json({ message: "No fields to update" });

    const result = await request.query(`
      UPDATE tms_users SET ${setClauses.join(", ")}
      OUTPUT INSERTED.id, INSERTED.name, INSERTED.email, INSERTED.role, INSERTED.status, INSERTED.enroll_no
      WHERE id = @id
    `);

    if (result.recordset.length === 0)
      return res.status(404).json({ message: "User not found" });
    res.json(result.recordset[0]);
  } catch (err) {
    next(err);
  }
}

async function deleteUser(req, res, next) {
  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .input("id", sql.Int, req.params.id)
      .query("DELETE FROM tms_users OUTPUT DELETED.id WHERE id = @id");

    if (result.recordset.length === 0)
      return res.status(404).json({ message: "User not found" });
    res.json({ message: "User deleted" });
  } catch (err) {
    next(err);
  }
}
// GET /api/users/assignable — role-aware list for the task modal's
// Assign To dropdown. Admins get everyone (with teamId/teamName so the
// frontend can build department tabs); managers only get the members of
// the team they manage.
async function getAssignableUsers(req, res, next) {
  try {
    const pool = await getPool();

    if (req.user.role === "admin") {
      const result = await pool.request().query(`
        SELECT u.id, u.name, u.email, u.role, u.avatar_color AS avatarColor,
               u.team_id AS teamId, t.name AS teamName
        FROM tms_users u
        LEFT JOIN tms_teams t ON u.team_id = t.id
        WHERE u.status = 'active'
        ORDER BY t.name ASC, u.name ASC
      `);
      return res.json(result.recordset);
    }

    // manager (or anyone else) — only the team they manage
    const teamResult = await pool
      .request()
      .input("managerId", sql.Int, req.user.id)
      .query("SELECT id, name FROM tms_teams WHERE manager_id = @managerId");

    const team = teamResult.recordset[0];
    if (!team) return res.json([]);

    const membersResult = await pool.request().input("teamId", sql.Int, team.id)
      .query(`
        SELECT id, name, email, role, avatar_color AS avatarColor, team_id AS teamId
        FROM tms_users
        WHERE team_id = @teamId AND status = 'active'
        ORDER BY name ASC
      `);

    res.json(
      membersResult.recordset.map((u) => ({ ...u, teamName: team.name })),
    );
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  createFromRoster,
  getAllUsers,
  getAssignableUsers,
  updateUser,
  updateMyAvatarColor,
  deleteUser,
};
