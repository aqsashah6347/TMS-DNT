const { sql, poolPromise } = require("../config/db");
const { getIO } = require("../config/socket");

async function logActivity({
  userId,
  type,
  title,
  message,
  taskId = null,
  projectId = null,
}) {
  if (!userId) return null;

  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("userId", sql.Int, userId)
      .input("type", sql.NVarChar, type)
      .input("title", sql.NVarChar, title)
      .input("message", sql.NVarChar, message)
      .input("taskId", sql.Int, taskId)
      .input("projectId", sql.Int, projectId).query(`
        INSERT INTO tms_notifications (user_id, type, title, message, task_id, project_id)
        OUTPUT INSERTED.*
        VALUES (@userId, @type, @title, @message, @taskId, @projectId)
      `);

    const activity = mapActivity(result.recordset[0]);

    // getIO() throws if socket.io hasn't been initialized yet (only happens
    // if this ever gets called from a standalone script) — never let that
    // take down the DB write that already succeeded.
    try {
      getIO().to(`user_${userId}`).emit("new_activity", activity);
    } catch (socketErr) {
      console.error("Couldn't push activity over socket:", socketErr.message);
    }

    return activity;
  } catch (err) {
    // An activity is a side-effect of a real action (task created, task
    // completed, etc.) — it should never be the reason that action fails.
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
  };
}

module.exports = { logActivity, mapActivity };
