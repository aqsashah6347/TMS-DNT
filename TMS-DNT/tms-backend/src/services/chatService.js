const { sql, getPool } = require("../config/db");

async function saveMessage(senderId, receiverId, message, attachment = null) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("senderId", sql.Int, senderId)
    .input("receiverId", sql.Int, receiverId)
    .input("message", sql.NVarChar, message || null)
    .input("attachmentUrl", sql.NVarChar, attachment?.url || null)
    .input("attachmentName", sql.NVarChar, attachment?.name || null)
    .input("attachmentType", sql.NVarChar, attachment?.type || null)
    .input("attachmentSize", sql.Int, attachment?.size || null).query(`
      INSERT INTO tms_chat_messages
        (sender_id, receiver_id, message, attachment_url, attachment_name, attachment_type, attachment_size)
      OUTPUT INSERTED.id, INSERTED.sender_id, INSERTED.receiver_id, INSERTED.message,
             INSERTED.is_read, INSERTED.created_at, INSERTED.attachment_url,
             INSERTED.attachment_name, INSERTED.attachment_type, INSERTED.attachment_size
      VALUES (@senderId, @receiverId, @message, @attachmentUrl, @attachmentName, @attachmentType, @attachmentSize)
    `);
  return result.recordset[0];
}

async function getConversation(userId, otherUserId) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("userId", sql.Int, userId)
    .input("otherUserId", sql.Int, otherUserId).query(`
      SELECT m.id, m.sender_id, m.receiver_id, m.message, m.is_read, m.created_at,
             m.attachment_url, m.attachment_name, m.attachment_type, m.attachment_size
      FROM tms_chat_messages m
      LEFT JOIN tms_chat_conversation_state cs
        ON cs.user_id = @userId AND cs.other_user_id = @otherUserId
      WHERE ((m.sender_id = @userId AND m.receiver_id = @otherUserId)
         OR (m.sender_id = @otherUserId AND m.receiver_id = @userId))
        AND m.created_at > ISNULL(cs.cleared_at, '1900-01-01')
      ORDER BY m.created_at ASC
    `);
  return result.recordset;
}

async function getConversations(userId) {
  const pool = await getPool();
  const result = await pool.request().input("userId", sql.Int, userId).query(`
    SELECT
      u.id AS userId,
      u.name AS userName,
      u.avatar_url AS avatarUrl,
      lm.message AS lastMessage,
      lm.attachment_name AS lastAttachmentName,
      lm.created_at AS lastMessageAt,
      lm.sender_id AS lastMessageSenderId,
      ISNULL(cs.is_archived, 0) AS archived,
      (SELECT COUNT(*) FROM tms_chat_messages
        WHERE sender_id = u.id AND receiver_id = @userId AND is_read = 0
          AND created_at > ISNULL(cs.cleared_at, '1900-01-01')) AS unreadCount
    FROM tms_users u
    LEFT JOIN tms_chat_conversation_state cs
      ON cs.user_id = @userId AND cs.other_user_id = u.id
    CROSS APPLY (
      SELECT TOP 1 message, created_at, sender_id, attachment_name
      FROM tms_chat_messages
      WHERE ((sender_id = u.id AND receiver_id = @userId)
         OR (sender_id = @userId AND receiver_id = u.id))
        AND created_at > ISNULL(cs.cleared_at, '1900-01-01')
      ORDER BY created_at DESC
    ) lm
    WHERE u.id != @userId
    ORDER BY lm.created_at DESC
  `);
  return result.recordset;
}

async function markAsRead(userId, otherUserId) {
  const pool = await getPool();
  await pool
    .request()
    .input("userId", sql.Int, userId)
    .input("otherUserId", sql.Int, otherUserId).query(`
      UPDATE tms_chat_messages
      SET is_read = 1
      WHERE sender_id = @otherUserId AND receiver_id = @userId AND is_read = 0
    `);
}

async function setArchived(userId, otherUserId, archived) {
  const pool = await getPool();
  await pool
    .request()
    .input("userId", sql.Int, userId)
    .input("otherUserId", sql.Int, otherUserId)
    .input("archived", sql.Bit, archived ? 1 : 0).query(`
      MERGE tms_chat_conversation_state AS target
      USING (SELECT @userId AS user_id, @otherUserId AS other_user_id) AS src
        ON target.user_id = src.user_id AND target.other_user_id = src.other_user_id
      WHEN MATCHED THEN
        UPDATE SET is_archived = @archived
      WHEN NOT MATCHED THEN
        INSERT (user_id, other_user_id, is_archived)
        VALUES (@userId, @otherUserId, @archived);
    `);
}

async function clearConversation(userId, otherUserId) {
  const pool = await getPool();
  await pool
    .request()
    .input("userId", sql.Int, userId)
    .input("otherUserId", sql.Int, otherUserId).query(`
      MERGE tms_chat_conversation_state AS target
      USING (SELECT @userId AS user_id, @otherUserId AS other_user_id) AS src
        ON target.user_id = src.user_id AND target.other_user_id = src.other_user_id
      WHEN MATCHED THEN
        UPDATE SET cleared_at = SYSUTCDATETIME()
      WHEN NOT MATCHED THEN
        INSERT (user_id, other_user_id, cleared_at)
        VALUES (@userId, @otherUserId, SYSUTCDATETIME());
    `);
}

module.exports = {
  saveMessage,
  getConversation,
  getConversations,
  markAsRead,
  setArchived,
  clearConversation,
};
