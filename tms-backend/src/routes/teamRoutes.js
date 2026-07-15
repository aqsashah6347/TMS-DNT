// tms-backend/src/routes/teamRoutes.js
const express = require("express");
const router = express.Router();
const { requireAuth, requireRole } = require("../middleware/auth");
const { requirePermission } = require("../middleware/permissions");
const teamController = require("../controllers/teamController");

router.use(requireAuth);

// Any authenticated user can see their own team context — this is what
// powers the "My Team" view for non-admin roles.
router.get("/mine", teamController.getMyTeam);

router.get("/", requirePermission("teams", "view"), teamController.getAllTeams);

// Team creation is admin-only, full stop — requireRole here instead of
// requirePermission so it can never be opened up by editing someone's
// tms_permissions row on the Access page.
router.post("/", requireRole("admin"), teamController.createTeam);

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
