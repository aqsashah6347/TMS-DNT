const { getPool } = require("../config/db");
const { logActivity } = require("../services/activityService");
const {
  sendDeadlineReminderNotification,
} = require("../services/notificationService");

const CHECK_INTERVAL_MS = 60 * 60 * 1000; // hourly is enough for a date-only due_date

async function checkUpcomingDeadlines() {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT t.id, t.title, t.priority, t.due_date, t.assigned_to, t.project_id
      FROM tms_tasks t
      WHERE t.deleted_at IS NULL
        AND t.status <> 'done'
        AND t.assigned_to IS NOT NULL
        AND t.due_date = DATEADD(DAY, 1, CAST(GETDATE() AS DATE))
    `);

    for (const row of result.recordset) {
      await sendDeadlineReminderNotification({ task: row });
      await logActivity({
        userId: row.assigned_to,
        type: "deadline_upcoming",
        title: "Deadline tomorrow",
        message: `"${row.title}" is due tomorrow (${new Date(row.due_date).toISOString().split("T")[0]}).`,
        taskId: row.id,
        projectId: row.project_id,
      });
    }
  } catch (err) {
    console.error("checkUpcomingDeadlines failed:", err.message);
  }
}

function startDeadlineReminderChecker() {
  checkUpcomingDeadlines(); // once at startup
  setInterval(checkUpcomingDeadlines, CHECK_INTERVAL_MS);
}

module.exports = { startDeadlineReminderChecker };
