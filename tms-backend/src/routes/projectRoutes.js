const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const { requirePermission } = require("../middleware/permissions");
const projectController = require("../controllers/projectController");

router.use(requireAuth);

// Static/specific endpoints MUST come before parameterized /:id routes
router.get(
  "/completed-log",
  requirePermission("projects", "view"),
  projectController.getCompletedLog,
);

router.get(
  "/",
  requirePermission("projects", "view"),
  projectController.getAllProjects,
);
router.get(
  "/:id",
  requirePermission("projects", "view"),
  projectController.getProjectById,
);

router.post(
  "/",
  requirePermission("projects", "create"),
  projectController.createProject,
);
router.put(
  "/:id",
  requirePermission("projects", "edit"),
  projectController.updateProject,
);
router.delete(
  "/:id",
  requirePermission("projects", "delete"),
  projectController.deleteProject,
);

module.exports = router;
