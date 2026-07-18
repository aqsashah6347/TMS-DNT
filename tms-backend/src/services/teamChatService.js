// tms-backend/src/services/teamChatService.js
const { sql, poolPromise } = require("../config/db");

// Visibility rule for team chat:
//   - admin   -> every team
//   - manager -> every team they manage, plus their own team if they
//                also happen to be a member of one
//   - user    -> only their own team
function accessFilterSql(role) {
  if (role === "admin") return "1 = 1";
  if (role === "manager")
    return "(t.manager_id = @userId OR t.id = (SELECT team_id FROM tms_users WHERE id = @userId))";
  return "t.id = (SELECT team_id FROM tms_users WHERE id = @userId)";
}

async function getAccessibleTeamIds(userId, role) {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input("userId", sql.Int, userId)
    .query(`SELECT t.id FROM tms_teams t WHERE ${accessFilterSql(role)}`);
  return result.recordset.map((r) => r.id);
}

async function canAccessTeam(userId, role, teamId) {
  if (role === "admin") return true;
  const ids = await getAccessibleTeamIds(userId, role);
  return ids.includes(Number(teamId));
}

// One row per team the user can see, with the last message preview and
// how many messages since their last visit weren't sent by them.
async function getTeamsForChat(userId, role) {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input("userId", sql.Int, userId).query(`
      SELECT
        t.id, t.name, t.color, t.manager_id AS managerId,
        (SELECT COUNT(*) FROM tms_users WHERE team_id = t.id) AS memberCount,
        lm.message AS lastMessage,
        lm.attachment_name AS lastAttachmentName,
        lm.created_at AS lastMessageAt,
        lm.sender_id AS lastMessageSenderId,
        su.name AS lastMessageSenderName,
        (
          SELECT COUNT(*) FROM tms_team_chat_messages m
          WHERE m.team_id = t.id
            AND m.sender_id != @userId
            AND m.created_at > COALESCE(
              (SELECT last_read_at FROM tms_team_chat_reads WHERE team_id = t.id AND user_id = @userId),
              '1900-01-01'
            )
        ) AS unreadCount
      FROM tms_teams t
      OUTER APPLY (
        SELECT TOP 1 message, attachment_name, created_at, sender_id
        FROM tms_team_chat_messages
        WHERE team_id = t.id
        ORDER BY created_at DESC
      ) lm
      LEFT JOIN tms_users su ON su.id = lm.sender_id
      WHERE ${accessFilterSql(role)}
      ORDER BY lm.created_at DESC
    `);

  const teams = result.recordset;
  if (teams.length === 0) return [];

  const ids = teams.map((t) => Number(t.id)).filter(Number.isFinite);
  const membersResult = await pool.request().query(`
    SELECT id, name, team_id AS teamId, role, avatar_color AS avatarColor
    FROM tms_users
    WHERE team_id IN (${ids.join(",")})
    ORDER BY name ASC
  `);

  const membersByTeam = new Map();
  for (const m of membersResult.recordset) {
    if (!membersByTeam.has(m.teamId)) membersByTeam.set(m.teamId, []);
    membersByTeam.get(m.teamId).push({
      id: m.id,
      name: m.name,
      role: m.role,
      avatarColor: m.avatarColor,
    });
  }

  return teams.map((t) => ({
    id: t.id,
    name: t.name,
    color: t.color,
    managerId: t.managerId,
    memberCount: t.memberCount,
    members: membersByTeam.get(t.id) || [],
    lastMessage: t.lastMessage,
    lastAttachmentName: t.lastAttachmentName,
    lastMessageAt: t.lastMessageAt,
    lastMessageSenderId: t.lastMessageSenderId,
    lastMessageSenderName: t.lastMessageSenderName,
    unreadCount: t.unreadCount,
  }));
}

async function getTeamMessages(teamId) {
  const pool = await poolPromise;
  const result = await pool.request().input("teamId", sql.Int, teamId).query(`
    SELECT
      m.id, m.team_id, m.sender_id, m.message, m.created_at,
      m.attachment_url, m.attachment_name, m.attachment_type, m.attachment_size,
      u.name AS sender_name, u.avatar_color AS sender_avatar_color
    FROM tms_team_chat_messages m
    JOIN tms_users u ON u.id = m.sender_id
    WHERE m.team_id = @teamId
    ORDER BY m.created_at ASC
  `);
  return result.recordset;
}

async function saveTeamMessage(teamId, senderId, message, attachment = null) {
  const pool = await poolPromise;
  const inserted = await pool
    .request()
    .input("teamId", sql.Int, teamId)
    .input("senderId", sql.Int, senderId)
    .input("message", sql.NVarChar, message || null)
    .input("attachmentUrl", sql.NVarChar, attachment?.url || null)
    .input("attachmentName", sql.NVarChar, attachment?.name || null)
    .input("attachmentType", sql.NVarChar, attachment?.type || null)
    .input("attachmentSize", sql.Int, attachment?.size || null).query(`
      INSERT INTO tms_team_chat_messages
        (team_id, sender_id, message, attachment_url, attachment_name, attachment_type, attachment_size)
      OUTPUT INSERTED.id
      VALUES (@teamId, @senderId, @message, @attachmentUrl, @attachmentName, @attachmentType, @attachmentSize)
    `);

  const id = inserted.recordset[0].id;
  const result = await pool.request().input("id", sql.Int, id).query(`
    SELECT
      m.id, m.team_id, m.sender_id, m.message, m.created_at,
      m.attachment_url, m.attachment_name, m.attachment_type, m.attachment_size,
      u.name AS sender_name, u.avatar_color AS sender_avatar_color
    FROM tms_team_chat_messages m
    JOIN tms_users u ON u.id = m.sender_id
    WHERE m.id = @id
  `);
  return result.recordset[0];
}

async function markTeamAsRead(teamId, userId) {
  const pool = await poolPromise;
  await pool
    .request()
    .input("teamId", sql.Int, teamId)
    .input("userId", sql.Int, userId).query(`
      IF EXISTS (SELECT 1 FROM tms_team_chat_reads WHERE team_id = @teamId AND user_id = @userId)
        UPDATE tms_team_chat_reads SET last_read_at = SYSUTCDATETIME()
        WHERE team_id = @teamId AND user_id = @userId
      ELSE
        INSERT INTO tms_team_chat_reads (team_id, user_id, last_read_at)
        VALUES (@teamId, @userId, SYSUTCDATETIME())
    `);
}

module.exports = {
  getAccessibleTeamIds,
  canAccessTeam,
  getTeamsForChat,
  getTeamMessages,
  saveTeamMessage,
  markTeamAsRead,
};