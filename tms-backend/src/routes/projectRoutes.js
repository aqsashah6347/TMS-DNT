const express = require("express");
const router = express.Router();
const { requireAuth, requireRole } = require("../middleware/auth");
const projectController = require("../controllers/projectController");

router.use(requireAuth);

// Everyone logged in can view projects.
router.get("/", projectController.getAllProjects);
router.get("/:id", projectController.getProjectById);

// Only admins and managers can create, edit, or delete projects.
router.post(
  "/",
  requireRole("admin", "manager"),
  projectController.createProject,
);
router.put(
  "/:id",
  requireRole("admin", "manager"),
  projectController.updateProject,
);
router.delete(
  "/:id",
  requireRole("admin", "manager"),
  projectController.deleteProject,
);

module.exports = router;
