const express = require("express");
const router = express.Router();
const { requireAuth, requireRole } = require("../middleware/auth");
const attendanceController = require("../controllers/attendanceController");

// Admin-only, same pattern as permissionRoutes.js — the "who's in today"
// list isn't something regular users should be able to pull up.
router.use(requireAuth, requireRole("admin"));

router.get("/today", attendanceController.getTodayAttendance);

module.exports = router;
