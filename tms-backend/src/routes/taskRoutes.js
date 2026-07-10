const express = require("express");
const router = express.Router();
const { requireAuth, requireRole } = require("../middleware/auth");
const taskController = require("../controllers/taskController");

// Every task route requires you to be logged in.
router.use(requireAuth);

// IMPORTANT: this specific route must come BEFORE "/:id",
// otherwise Express thinks "stats" is a task id.
router.get("/stats/completion", taskController.getCompletionStats);

router.get("/", taskController.getAllTasks);
router.get("/:id", taskController.getTaskById);

// Assigning a task (= creating it) is an admin/manager action.
router.post("/", requireRole("admin", "manager"), taskController.createTask);

// Updating is open to everyone, but taskController.updateTask checks
// internally: regular users may only touch status/pinned on tasks
// assigned to them; only admin/manager can reassign or edit other fields.
router.put("/:id", taskController.updateTask);

router.delete(
  "/:id",
  requireRole("admin", "manager"),
  taskController.deleteTask,
);

module.exports = router;
