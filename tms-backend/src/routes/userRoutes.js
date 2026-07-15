const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const { requirePermission } = require("../middleware/permissions");
const userController = require("../controllers/userController");

router.use(requireAuth);

router.get("/", userController.getAllUsers);

// Self-service — any logged-in user can change their OWN avatar color.
// Placed above "/:id" but doesn't actually need to be (different path
// shape), kept here for readability alongside the other user-facing routes.
router.put("/me/avatar-color", userController.updateMyAvatarColor);

router.post(
  "/from-roster",
  requirePermission("admin", "create"),
  userController.createFromRoster,
);

router.put(
  "/:id",
  requirePermission("admin", "edit"),
  userController.updateUser,
);
router.delete(
  "/:id",
  requirePermission("admin", "delete"),
  userController.deleteUser,
);

module.exports = router;
