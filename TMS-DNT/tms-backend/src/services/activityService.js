const { sql, getPool } = require("../config/db");
const { getIO } = require("../config/socket");

const ACTION_TYPES = [
  "task_created",
  "project_created",
  "team_created",
  "task_edited",
  "due_date_updated",
  "assignment_changed",
  "status_changed",
  "task_completed",
  "task_deleted",
  "project_deleted",
];

async function logActivity({
  userId,
  type,
  title,
  message,
  taskId = null,
  projectId = null,
  changes = null,
}) {
  if (!userId) return null;

  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .input("userId", sql.Int, userId)
      .input("type", sql.NVarChar, type)
      .input("title", sql.NVarChar, title)
      .input("message", sql.NVarChar, message)
      .input("taskId", sql.Int, taskId)
      .input("projectId", sql.Int, projectId)
      .input(
        "changes",
        sql.NVarChar(sql.MAX),
        changes && changes.length ? JSON.stringify(changes) : null,
      ).query(`
        INSERT INTO tms_notifications (user_id, type, title, message, task_id, project_id, changes)
        OUTPUT INSERTED.*
        VALUES (@userId, @type, @title, @message, @taskId, @projectId, @changes)
      `);

    const row = result.recordset[0];

    const nameResult = await pool
      .request()
      .input("userId", sql.Int, userId)
      .query("SELECT name FROM tms_users WHERE id = @userId");
    row.actor_name = nameResult.recordset[0]?.name || null;

    const activity = mapActivity(row);

    try {
      const rooms = [`user_${userId}`];
      if (ACTION_TYPES.includes(type)) rooms.push("admins");
      getIO().to(rooms).emit("new_activity", activity);
    } catch (socketErr) {
      console.error("Couldn't push activity over socket:", socketErr.message);
    }

    return activity;
  } catch (err) {
    console.error("logActivity failed:", err.message);
    return null;
  }
}

function mapActivity(row) {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    message: row.message,
    taskId: row.task_id,
    projectId: row.project_id,
    read: row.is_read,
    createdAt: row.created_at,
    changes: parseChanges(row.changes),
    userId: row.user_id,
    userName: row.actor_name || null,
  };
}

function parseChanges(raw) {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

module.exports = { logActivity, mapActivity, ACTION_TYPES };
