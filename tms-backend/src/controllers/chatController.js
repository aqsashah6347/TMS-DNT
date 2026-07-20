const chatService = require("../services/chatService");
const teamChatService = require("../services/teamChatService");

// GET /api/chat/conversations
async function getConversations(req, res, next) {
  try {
    const conversations = await chatService.getConversations(req.user.id);
    res.json(conversations);
  } catch (err) {
    next(err);
  }
}

// GET /api/chat/teams — teams the current user is allowed to group-chat in.
// admin: all teams. manager: teams they manage (+ own team if a member).
// user: only their own team.
async function getTeamsForChat(req, res, next) {
  try {
    const teams = await teamChatService.getTeamsForChat(
      req.user.id,
      req.user.role,
    );
    res.json(teams);
  } catch (err) {
    next(err);
  }
}

// GET /api/chat/teams/:teamId/messages — also marks the team chat read
// for the current user.
async function getTeamMessages(req, res, next) {
  try {
    const teamId = Number(req.params.teamId);
    const allowed = await teamChatService.canAccessTeam(
      req.user.id,
      req.user.role,
      teamId,
    );
    if (!allowed) {
      return res
        .status(403)
        .json({ message: "You don't have access to this team's chat" });
    }

    const messages = await teamChatService.getTeamMessages(teamId);
    await teamChatService.markTeamAsRead(teamId, req.user.id);
    res.json(messages);
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

// PATCH /api/chat/:userId/archive  body: { archived: boolean }
async function setArchived(req, res, next) {
  try {
    const otherUserId = Number(req.params.userId);
    const archived = !!req.body.archived;
    await chatService.setArchived(req.user.id, otherUserId, archived);
    res.json({ success: true, archived });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/chat/:userId — clears this conversation from my own view.
async function deleteConversation(req, res, next) {
  try {
    const otherUserId = Number(req.params.userId);
    await chatService.clearConversation(req.user.id, otherUserId);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getConversations,
  getMessages,
  getTeamsForChat,
  getTeamMessages,
  setArchived,
  deleteConversation,
};