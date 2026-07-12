const { sql, poolPromise } = require("../config/db");

async function saveMessage(senderId, receiverId, message) {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input("senderId", sql.Int, senderId)
    .input("receiverId", sql.Int, receiverId)
    .input("message", sql.NVarChar, message).query(`
      INSERT INTO tms_chat_messages (sender_id, receiver_id, message)
      OUTPUT INSERTED.id, INSERTED.sender_id, INSERTED.receiver_id,
             INSERTED.message, INSERTED.is_read, INSERTED.created_at
      VALUES (@senderId, @receiverId, @message)
    `);
  return result.recordset[0];
}

async function getConversation(userId, otherUserId) {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input("userId", sql.Int, userId)
    .input("otherUserId", sql.Int, otherUserId).query(`
      SELECT id, sender_id, receiver_id, message, is_read, created_at
      FROM tms_chat_messages
      WHERE (sender_id = @userId AND receiver_id = @otherUserId)
         OR (sender_id = @otherUserId AND receiver_id = @userId)
      ORDER BY created_at ASC
    `);
  return result.recordset;
}

// One row per other user, with their most recent message + how many
// of their messages to me are still unread.
async function getConversations(userId) {
  const pool = await poolPromise;
  const result = await pool.request().input("userId", sql.Int, userId).query(`
    SELECT
      u.id AS userId,
      u.name AS userName,
      u.avatar_url AS avatarUrl,
      lm.message AS lastMessage,
      lm.created_at AS lastMessageAt,
      lm.sender_id AS lastMessageSenderId,
      (SELECT COUNT(*) FROM tms_chat_messages
        WHERE sender_id = u.id AND receiver_id = @userId AND is_read = 0) AS unreadCount
    FROM tms_users u
    CROSS APPLY (
      SELECT TOP 1 message, created_at, sender_id
      FROM tms_chat_messages
      WHERE (sender_id = u.id AND receiver_id = @userId)
         OR (sender_id = @userId AND receiver_id = u.id)
      ORDER BY created_at DESC
    ) lm
    WHERE u.id != @userId
    ORDER BY lm.created_at DESC
  `);
  return result.recordset;
}

async function markAsRead(userId, otherUserId) {
  const pool = await poolPromise;
  await pool
    .request()
    .input("userId", sql.Int, userId)
    .input("otherUserId", sql.Int, otherUserId).query(`
      UPDATE tms_chat_messages
      SET is_read = 1
      WHERE sender_id = @otherUserId AND receiver_id = @userId AND is_read = 0
    `);
}

module.exports = { saveMessage, getConversation, getConversations, markAsRead };