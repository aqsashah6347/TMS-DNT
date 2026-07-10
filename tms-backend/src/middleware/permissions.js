const { sql, poolPromise } = require("../config/db");

// Must match the frontend's accessStore.js exactly — these are the
// module/action names shown (and toggled) on the Access page.
const MODULES = ["tasks", "projects", "teams", "admin", "analytics"];
const ACTIONS = ["view", "create", "edit", "delete", "assign"];

// What a user gets automatically if nobody has explicitly overridden
// their permissions yet (i.e. no row in tms_permissions for that
// user+module). This is what makes the app usable out of the box —
// existing seeded users don't need any tms_permissions rows to work
// exactly as they did before this feature existed.
//
// 'admin' isn't listed here because admins bypass permission checks
// entirely (see hasPermission below).
const ROLE_PRESETS = {
  manager: {
    tasks: ["view", "create", "edit", "delete", "assign"],
    projects: ["view", "create", "edit", "delete"],
    teams: ["view"],
    admin: [],
    analytics: ["view"],
  },
  user: {
    tasks: ["view", "edit"],
    projects: ["view"],
    teams: ["view"],
    admin: [],
    analytics: [],
  },
};

// Returns the list of actions this user is allowed to perform in this
// module: an explicit tms_permissions row wins if one exists, otherwise
// we fall back to their role's preset. Admins always get everything.
async function getEffectiveActions(userId, role, module) {
  if (role === "admin") return [...ACTIONS];

  const pool = await poolPromise;
  const result = await pool
    .request()
    .input("userId", sql.Int, userId)
    .input("module", sql.NVarChar, module)
    .query(
      "SELECT actions FROM tms_permissions WHERE user_id = @userId AND module = @module",
    );

  const row = result.recordset[0];
  if (row) {
    return row.actions
      .split(",")
      .map((a) => a.trim())
      .filter(Boolean);
  }

  return ROLE_PRESETS[role]?.[module] || [];
}

async function hasPermission(userId, role, module, action) {
  const actions = await getEffectiveActions(userId, role, module);
  return actions.includes(action);
}

// Use after requireAuth, e.g.:
//   router.post("/", requirePermission("tasks", "create"), taskController.createTask)
function requirePermission(module, action) {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "No token provided" });
      }

      const allowed = await hasPermission(
        req.user.id,
        req.user.role,
        module,
        action,
      );

      if (!allowed) {
        return res.status(403).json({ message: "Not allowed to do that" });
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = {
  MODULES,
  ACTIONS,
  ROLE_PRESETS,
  getEffectiveActions,
  hasPermission,
  requirePermission,
};
