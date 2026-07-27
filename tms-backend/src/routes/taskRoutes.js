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
router.get("/completed-log", taskController.getCompletedLog);

router.get("/", requirePermission("tasks", "view"), taskController.getAllTasks);
 router.get("/completed-log", taskController.getCompletedLog);

router.get(
<<<<<<< HEAD
  "/:id",
  requirePermission("tasks", "view"),
  taskController.getTaskById,
=======
  "/:id/progress-history",
  requirePermission("tasks", "view"),
  taskController.getTaskProgressHistory,
>>>>>>> 2d756372ed8b89d5a594bec420b9388e7b28e8cc
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
