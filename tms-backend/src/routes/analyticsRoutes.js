const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const { requirePermission } = require("../middleware/permissions");
const analyticsController = require("../controllers/analyticsController");

router.use(requireAuth);
router.use(requirePermission("analytics", "view"));

router.get("/completion-rate", analyticsController.getCompletionRate);
router.get("/overdue", analyticsController.getOverdue);
router.get("/productivity", analyticsController.getProductivity);
router.get("/workload", analyticsController.getWorkload);

module.exports = router;