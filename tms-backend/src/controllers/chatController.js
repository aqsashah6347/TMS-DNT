const chatService = require("../services/chatService");

// GET /api/chat/conversations
async function getConversations(req, res, next) {
  try {
    const conversations = await chatService.getConversations(req.user.id);
    res.json(conversations);
  } catch (err) {
    next(err);
  }
}

// GET /api/chat/:userId  — also marks that user's messages to me as read
async function getMessages(req, res, next) {
  try {
    const otherUserId = Number(req.params.userId);
    const messages = await chatService.getConversation(req.user.id, otherUserId);
    await chatService.markAsRead(req.user.id, otherUserId);
    res.json(messages);
  } catch (err) {
    next(err);
  }
}

module.exports = { getConversations, getMessages };