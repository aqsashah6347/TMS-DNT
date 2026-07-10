const express = require("express");
const router = express.Router();
const { requireAuth, requireRole } = require("../middleware/auth");
const teamController = require("../controllers/teamController");

router.use(requireAuth);

// Everyone logged in can see teams (needed for dropdowns etc).
router.get("/", teamController.getAllTeams);

// Only admins can create, edit, or delete teams.
router.post("/", requireRole("admin"), teamController.createTeam);
router.put("/:id", requireRole("admin"), teamController.updateTeam);
router.delete("/:id", requireRole("admin"), teamController.deleteTeam);

module.exports = router;
