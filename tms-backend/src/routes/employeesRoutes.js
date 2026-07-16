const express = require("express");
const router = express.Router();
const { requireAuth, requireRole } = require("../middleware/auth");
const employeesController = require("../controllers/employeesController");

router.use(requireAuth);

// Any authenticated user — used by member pickers (project/team creation).
// No attendance data goes out here, just name/department/userId.
router.get("/directory", employeesController.getDirectory);

// Admin only — live device data, check-in/out, attendance status.
router.get("/roster", requireRole("admin"), employeesController.getRoster);

module.exports = router;
