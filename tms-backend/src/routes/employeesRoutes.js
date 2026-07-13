const express = require("express");
const router = express.Router();
const { requireAuth, requireRole } = require("../middleware/auth");
const employeesController = require("../controllers/employeesController");

// Admin only, same reasoning as attendanceRoutes.js — live device data.
router.use(requireAuth, requireRole("admin"));

router.get("/roster", employeesController.getRoster);

module.exports = router;
