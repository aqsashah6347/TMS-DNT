const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const authController = require("../controllers/authController");
const { register } = require("../controllers/userController");

router.post("/login", authController.login);
router.post("/verify-otp", authController.verifyOtp);
router.post("/logout", authController.logout);
router.get("/me", requireAuth, authController.getCurrentUser);

// Not in your original authApi.js, but you need SOME way to create the
// very first user. Call this once (e.g. from Postman) to create yourself,
// then you can log in normally. Consider removing/protecting it later.
router.post("/register", register);

module.exports = router;
