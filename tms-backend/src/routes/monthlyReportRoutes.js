// tms-backend/src/routes/monthlyReportRoutes.js
const express = require("express");
const router = express.Router();
const { requireAuth, requireRole } = require("../middleware/auth");
const monthlyReportController = require("../controllers/monthlyReportController");

router.use(requireAuth);

// Any authenticated user — powers the "Reports announced" dashboard banner.
router.get("/announcement", monthlyReportController.getAnnouncement);

// Manager/admin dashboard reminder button. Deliberately not requireRole
// gated — same reasoning as teamRoutes' /managed: a "user" role can
// still be set as a team's manager_id, and this is how they get scoped
// access to that team's report.
router.get("/reminders", monthlyReportController.getReminders);

// Admin-only cross-org view: every team/manager + per-employee marked
// status for the current period. Powers the Performance > Reports tab.
router.get(
  "/overview",
  requireRole("admin"),
  monthlyReportController.getOverview,
);

router.get("/teams/:teamId/current", monthlyReportController.getCurrentReport);

router.put(
  "/teams/:teamId/current/ratings/:memberId",
  monthlyReportController.setReportRating,
);

router.post(
  "/teams/:teamId/current/submit",
  monthlyReportController.submitReport,
);

// Admin-only: force this team's report reminder visible outside the
// normal filing window. Toggled from the Reports overview team modal.
router.put(
  "/teams/:teamId/current/visibility",
  requireRole("admin"),
  monthlyReportController.setForceVisible,
);

// Admin-only manual release — mainly for testing before
// ENFORCE_DATE_WINDOW is switched on in utils/monthlyReportWindow.js.
router.post(
  "/release",
  requireRole("admin"),
  monthlyReportController.releaseReports,
);

module.exports = router;
