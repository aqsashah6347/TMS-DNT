const { getPool } = require("../config/db");
const { logActivity } = require("../services/activityService");
const {
  sendProgressReminderNotification,
} = require("../services/notificationService");

const CHECK_INTERVAL_MS = 15 * 60 * 1000; // poll every 15 min...
const REMINDER_HOUR = Number(process.env.PROGRESS_REMINDER_HOUR) || 20; // ...but only act during this hour (server local time)

async function checkProgressReminders() {
  if (new Date().getHours() !== REMINDER_HOUR) return;

  try {
    const pool = await getPool();

    const result = await pool.request().query(`
      SELECT t.id, t.title, t.assigned_to, t.due_date
      FROM tms_tasks t
      WHERE t.deleted_at IS NULL
        AND t.status <> 'done'
        AND t.assigned_to IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM tms_task_progress_log pl
          WHERE pl.task_id = t.id AND pl.log_date = CAST(GETDATE() AS DATE)
        )
    `);

    const byUser = {};
    for (const row of result.recordset) {
      if (!byUser[row.assigned_to]) byUser[row.assigned_to] = [];
      byUser[row.assigned_to].push(row);
    }

    for (const [userId, tasks] of Object.entries(byUser)) {
      await sendProgressReminderNotification({ userId: Number(userId), tasks });
      await logActivity({
        userId: Number(userId),
        type: "progress_reminder",
        title: "Update your task progress",
        message: `You have ${tasks.length} task${tasks.length > 1 ? "s" : ""} with no progress update logged today.`,
      });
    }
  } catch (err) {
    console.error("checkProgressReminders failed:", err.message);
  }
}

function startProgressReminderChecker() {
  setInterval(checkProgressReminders, CHECK_INTERVAL_MS);
}

module.exports = { startProgressReminderChecker };
