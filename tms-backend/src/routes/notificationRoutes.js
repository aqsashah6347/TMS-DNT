const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const notificationController = require("../controllers/notificationController");

router.use(requireAuth);

router.get("/", notificationController.getAllNotifications);
router.put("/:id/read", notificationController.markAsRead);
router.put("/read-all", notificationController.markAllAsRead);

module.exports = router;
