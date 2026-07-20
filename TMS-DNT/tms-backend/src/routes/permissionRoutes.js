const express = require("express");
const router = express.Router();
const { requireAuth, requireRole } = require("../middleware/auth");
const permissionController = require("../controllers/permissionController");

// The whole Access page is an admin-only control panel — only admins
// can view or change anyone's permissions.
router.use(requireAuth, requireRole("admin"));

router.get("/", permissionController.getAllPermissions);
router.get("/audit-log", permissionController.getAuditLog);
router.put("/:userId", permissionController.togglePermission);
router.put("/:userId/role", permissionController.setRole);
router.put("/:userId/batch", permissionController.batchUpdate);

module.exports = router;
