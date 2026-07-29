const express = require("express");
const router = express.Router();
const { requireAuth, requireRole } = require("../middleware/auth");
const permissionController = require("../controllers/permissionController");

// Any authenticated user can check their own effective permissions —
// this is what the frontend uses to decide what to show them. It has
// to be registered before the admin-only gate below, since that gate
// applies to every route defined after it in this file.
router.get("/me", requireAuth, permissionController.getMyPermissions);

// The whole Access page is an admin-only control panel — only admins
// can view or change anyone's permissions.
router.use(requireAuth, requireRole("admin"));

router.get("/", permissionController.getAllPermissions);
router.get("/audit-log", permissionController.getAuditLog);
router.put("/:userId", permissionController.togglePermission);
router.put("/:userId/role", permissionController.setRole);
router.put("/:userId/batch", permissionController.batchUpdate);

module.exports = router;
