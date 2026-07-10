const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const { requirePermission } = require("../middleware/permissions");
const teamController = require("../controllers/teamController");

router.use(requireAuth);

router.get("/", requirePermission("teams", "view"), teamController.getAllTeams);

router.post(
  "/",
  requirePermission("teams", "create"),
  teamController.createTeam,
);
router.put(
  "/:id",
  requirePermission("teams", "edit"),
  teamController.updateTeam,
);
router.delete(
  "/:id",
  requirePermission("teams", "delete"),
  teamController.deleteTeam,
);

module.exports = router;
