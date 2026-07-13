const bcrypt = require("bcryptjs");
const { sql, poolPromise } = require("../config/db");

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

    const pool = await poolPromise;

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

// GET /api/users — used by Admin page and by dropdowns (assignee pickers etc).
async function getAllUsers(req, res, next) {
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .query(
        "SELECT id, name, email, role, status, enroll_no FROM tms_users ORDER BY name ASC",
      );

    res.json(result.recordset);
  } catch (err) {
    next(err);
  }
}

async function updateUser(req, res, next) {
  try {
    const { name, role, status, enroll_no } = req.body;
    const pool = await poolPromise;
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
    const pool = await poolPromise;
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

module.exports = { register, getAllUsers, updateUser, deleteUser };
