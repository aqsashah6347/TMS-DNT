const { sql, poolPromise } = require("../config/db");
const { getIO } = require("../config/socket");

// The "self-logged action" types shown in Box 1 (Action Activity) on the
// Activity page — as opposed to things that happen *to* a user
// (task_assigned, deadline_missed, project_assigned), which stay out of
// this box. Exported so activityController can reuse the same list when
// building the admin "see everyone's actions" query.
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
  // Optional list of { field, oldValue, newValue } objects — used by
  // task_edited so every field touched in one PUT collapses into a
  // single activity row instead of one row per field. Stored as JSON
  // in the `changes` column and parsed back out in mapActivity below.
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

    // Look up the actor's name so the real-time push carries it too —
    // an admin's Action Activity box needs to label whose action this
    // was without waiting on a second round trip.
    const nameResult = await pool
      .request()
      .input("userId", sql.Int, userId)
      .query("SELECT name FROM tms_users WHERE id = @userId");
    row.actor_name = nameResult.recordset[0]?.name || null;

    const activity = mapActivity(row);

    // getIO() throws if socket.io hasn't been initialized yet (only happens
    // if this ever gets called from a standalone script) — never let that
    // take down the DB write that already succeeded.
    try {
      const rooms = [`user_${userId}`];
      // Admins also sit in a shared "admins" room (see config/socket.js)
      // so any self-logged action — from anyone — reaches their Action
      // Activity box live, not just their own.
      if (ACTION_TYPES.includes(type)) rooms.push("admins");
      getIO().to(rooms).emit("new_activity", activity);
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
    changes: parseChanges(row.changes),
    userId: row.user_id,
    userName: row.actor_name || null,
  };
}

// `changes` is stored as a JSON string (or NULL for activities that don't
// carry a change list, e.g. task_created/task_deleted). Parsed defensively
// so a malformed/legacy value never breaks the whole activities list.
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
