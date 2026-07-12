const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const chatController = require("../controllers/chatController");

router.use(requireAuth);

router.get("/conversations", chatController.getConversations);
router.get("/:userId", chatController.getMessages);

module.exports = router;