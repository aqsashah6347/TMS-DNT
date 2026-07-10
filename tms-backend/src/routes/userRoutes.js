const express = require("express");
const router = express.Router();
const { requireAuth, requireRole } = require("../middleware/auth");
const userController = require("../controllers/userController");

router.use(requireAuth);

// Anyone logged in can see the user list (needed for assignee dropdowns etc).
router.get("/", userController.getAllUsers);

// Only admins can edit or remove users.
router.put("/:id", requireRole("admin"), userController.updateUser);
router.delete("/:id", requireRole("admin"), userController.deleteUser);

module.exports = router;
