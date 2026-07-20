// tms-backend/src/routes/teamRoutes.js
const express = require("express");
const router = express.Router();
const { requireAuth, requireRole } = require("../middleware/auth");
const teamController = require("../controllers/teamController");

router.use(requireAuth);

// Any authenticated user can see their own team context — this is what
// powers the "My Team" view for non-admin roles.
router.get("/mine", teamController.getMyTeam);

// Seeing the full team roster is admin/manager-only — "user" role can
// only ever see their own team, via GET /mine above. requireRole here
// instead of requirePermission so it can't be opened up for a "user" by
// editing their tms_permissions row on the Access page.
router.get("/", requireRole("admin", "manager"), teamController.getAllTeams);

// Team creation is admin-only, full stop — requireRole here instead of
// requirePermission so it can never be opened up by editing someone's
// tms_permissions row on the Access page.
router.post("/", requireRole("admin"), teamController.createTeam);

// Editing/deleting teams is admin-only too, same reasoning as above —
// managers can view teams but should never be able to edit or delete
// them, regardless of what's toggled on the Access page.
router.put("/:id", requireRole("admin"), teamController.updateTeam);
router.delete("/:id", requireRole("admin"), teamController.deleteTeam);

module.exports = router;
