const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const { requirePermission } = require("../middleware/permissions");
const taskController = require("../controllers/taskController");

router.use(requireAuth);

router.get(
  "/stats/completion",
  requirePermission("tasks", "view"),
  taskController.getCompletionStats,
);

router.get("/", requirePermission("tasks", "view"), taskController.getAllTasks);
router.get(
  "/:id",
  requirePermission("tasks", "view"),
  taskController.getTaskById,
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
