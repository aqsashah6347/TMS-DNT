const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const { requirePermission } = require("../middleware/permissions");
const taskController = require("../controllers/taskController");

router.use(requireAuth);

// Static/specific endpoints MUST come before parameterized /:id routes
router.get(
  "/stats/completion",
  requirePermission("tasks", "view"),
  taskController.getCompletionStats,
);

router.get(
  "/completed-log",
  requirePermission("tasks", "view"),
  taskController.getCompletedLog,
);

// Must stay above "/:id" — otherwise Express matches "daily-progress"
// as an :id value instead of routing here.
router.get(
  "/daily-progress",
  requirePermission("tasks", "view"),
  taskController.getDailyProgress,
);

router.get("/", requirePermission("tasks", "view"), taskController.getAllTasks);

// Individual task routes
router.get(
  "/:id",
  requirePermission("tasks", "view"),
  taskController.getTaskById,
);

router.get(
  "/:id/progress-history",
  requirePermission("tasks", "view"),
  taskController.getTaskProgressHistory,
);

router.get(
  "/:id/progress-marks",
  requirePermission("tasks", "view"),
  taskController.getTaskProgressMarks,
);

router.post(
  "/",
  requirePermission("tasks", "create"),
  taskController.createTask,
);

router.put(
  "/:id",
  requirePermission("tasks", "edit"),
  taskController.updateTask,
);

router.delete(
  "/:id",
  requirePermission("tasks", "delete"),
  taskController.deleteTask,
);

router.get(
  "/progress-heatmap",
  requirePermission("tasks", "view"),
  taskController.getProgressHeatmap,
);

module.exports = router;
