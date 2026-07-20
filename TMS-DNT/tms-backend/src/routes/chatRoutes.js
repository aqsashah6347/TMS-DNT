const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const chatController = require("../controllers/chatController");

router.use(requireAuth);

router.get("/conversations", chatController.getConversations);

// These two must come BEFORE "/:userId" below — otherwise Express matches
// "/teams" against the ":userId" param route and it never reaches here.
router.get("/teams", chatController.getTeamsForChat);
router.get("/teams/:teamId/messages", chatController.getTeamMessages);

router.get("/:userId", chatController.getMessages);
router.patch("/:userId/archive", chatController.setArchived);
router.delete("/:userId", chatController.deleteConversation);

module.exports = router;