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

module.exports = router;
