const { sql, poolPromise } = require("../config/db");
const { MODULES, ACTIONS, ROLE_PRESETS } = require("../middleware/permissions");

// GET /api/permissions
// Returns exactly the shape accessStore.js's seed data used, so the
// Access page can eventually swap its mock data for this response
// with no changes to PermissionTable.jsx / RolePresets.jsx:
//   [{ userId, userName, role, overrides: { module: [actions] } }, ...]
async function getAllPermissions(req, res, next) {
  try {
    const pool = await poolPromise;

    const usersResult = await pool
      .request()
      .query("SELECT id, name, role FROM tms_users ORDER BY name ASC");

    const permsResult = await pool
      .request()
      .query("SELECT user_id, module, actions FROM tms_permissions");

    // Group explicit override rows by user id: { userId: { module: [actions] } }
    const explicitByUser = {};
    for (const row of permsResult.recordset) {
      if (!explicitByUser[row.user_id]) explicitByUser[row.user_id] = {};
      explicitByUser[row.user_id][row.module] = row.actions
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean);
    }

    const permissions = usersResult.recordset.map((user) => {
      const overrides = {};
      for (const module of MODULES) {
        const explicit = explicitByUser[user.id]?.[module];
        if (explicit) {
          overrides[module] = explicit;
        } else if (user.role === "admin") {
          overrides[module] = [...ACTIONS];
        } else {
          overrides[module] = ROLE_PRESETS[user.role]?.[module] || [];
        }
      }
      return {
        userId: user.id,
        userName: user.name,
        role: user.role,
        overrides,
      };
    });

    res.json({ modules: MODULES, actions: ACTIONS, permissions });
  } catch (err) {
    next(err);
  }
}

// PUT /api/permissions/:userId  body: { module, action }
// Flips one action on/off for one user/module. The first time a user's
// permissions are touched for a given module, we materialize their
// current role-preset defaults into a real row first — otherwise
// toggling one checkbox would silently wipe out every other action
// they had via their role.
async function togglePermission(req, res, next) {
  try {
    const targetUserId = Number(req.params.userId);
    const { module, action } = req.body;

    if (!MODULES.includes(module)) {
      return res.status(400).json({ message: `Unknown module: ${module}` });
    }
    if (!ACTIONS.includes(action)) {
      return res.status(400).json({ message: `Unknown action: ${action}` });
    }

    const pool = await poolPromise;

    const userResult = await pool
      .request()
      .input("id", sql.Int, targetUserId)
      .query("SELECT id, name, role FROM tms_users WHERE id = @id");

    const targetUser = userResult.recordset[0];
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const existingResult = await pool
      .request()
      .input("userId", sql.Int, targetUserId)
      .input("module", sql.NVarChar, module)
      .query(
        "SELECT actions FROM tms_permissions WHERE user_id = @userId AND module = @module",
      );

    const existingRow = existingResult.recordset[0];
    const baseline = existingRow
      ? existingRow.actions
          .split(",")
          .map((a) => a.trim())
          .filter(Boolean)
      : ROLE_PRESETS[targetUser.role]?.[module] || [];

    const updated = baseline.includes(action)
      ? baseline.filter((a) => a !== action)
      : [...baseline, action];

    if (existingRow) {
      await pool
        .request()
        .input("userId", sql.Int, targetUserId)
        .input("module", sql.NVarChar, module)
        .input("actions", sql.NVarChar, updated.join(","))
        .query(
          "UPDATE tms_permissions SET actions = @actions WHERE user_id = @userId AND module = @module",
        );
    } else {
      await pool
        .request()
        .input("userId", sql.Int, targetUserId)
        .input("module", sql.NVarChar, module)
        .input("actions", sql.NVarChar, updated.join(","))
        .query(
          "INSERT INTO tms_permissions (user_id, module, actions) VALUES (@userId, @module, @actions)",
        );
    }

    await logAction(
      pool,
      req.user.id,
      `Toggled '${action}' on '${module}' for ${targetUser.name}`,
    );

    res.json({ userId: targetUserId, module, actions: updated });
  } catch (err) {
    next(err);
  }
}

// PUT /api/permissions/:userId/role  body: { role }
async function setRole(req, res, next) {
  try {
    const targetUserId = Number(req.params.userId);
    const { role } = req.body;

    if (!["admin", "manager", "user"].includes(role)) {
      return res.status(400).json({ message: `Unknown role: ${role}` });
    }

    const pool = await poolPromise;

    const result = await pool
      .request()
      .input("id", sql.Int, targetUserId)
      .input("role", sql.NVarChar, role).query(`
        UPDATE tms_users SET role = @role
        OUTPUT INSERTED.id, INSERTED.name, INSERTED.role
        WHERE id = @id
      `);

    const updatedUser = result.recordset[0];
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    await logAction(
      pool,
      req.user.id,
      `Set role preset '${role}' for ${updatedUser.name}`,
    );

    res.json(updatedUser);
  } catch (err) {
    next(err);
  }
}

// GET /api/permissions/audit-log
async function getAuditLog(req, res, next) {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT TOP 50 a.id, a.action, a.created_at, u.name AS actorName
      FROM tms_audit_log a
      LEFT JOIN tms_users u ON a.actor_id = u.id
      ORDER BY a.created_at DESC
    `);

    res.json(
      result.recordset.map((row) => ({
        id: row.id,
        actor: row.actorName || "System",
        action: row.action,
        time: timeAgo(row.created_at),
      })),
    );
  } catch (err) {
    next(err);
  }
}

async function logAction(pool, actorId, action) {
  await pool
    .request()
    .input("actorId", sql.Int, actorId)
    .input("action", sql.NVarChar, action)
    .query(
      "INSERT INTO tms_audit_log (actor_id, action) VALUES (@actorId, @action)",
    );
}

// Turns a DB timestamp into "2h ago" / "1d ago" style text, matching
// the format accessStore.js's mock data already used.
function timeAgo(date) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

module.exports = { getAllPermissions, togglePermission, setRole, getAuditLog };
