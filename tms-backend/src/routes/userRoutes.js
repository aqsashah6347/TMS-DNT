const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const { requirePermission } = require("../middleware/permissions");
const userController = require("../controllers/userController");

router.use(requireAuth);

router.get("/", userController.getAllUsers);

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
