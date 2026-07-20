const express = require("express");
const router = express.Router();
const { requireAuth, requireRole } = require("../middleware/auth");
const authController = require("../controllers/authController");
const { register } = require("../controllers/userController");
const {
  allowFirstUserOrAdmin,
} = require("../middleware/allowFirstUserOrAdmin");

router.post("/login", authController.login);
router.post("/verify-otp", authController.verifyOtp);
router.post("/logout", authController.logout);
router.get("/me", requireAuth, authController.getCurrentUser);

// Open ONLY when tms_users is empty (bootstrap). Once any user exists,
// this route requires a valid admin token.
router.post("/register", allowFirstUserOrAdmin, register);

module.exports = router;
