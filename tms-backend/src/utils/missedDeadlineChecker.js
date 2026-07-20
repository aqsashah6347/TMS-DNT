const { sql, poolPromise } = require("../config/db");
const { logActivity } = require("../services/activityService");

const CHECK_INTERVAL_MS = 60 * 60 * 1000; // hourly is plenty for a due-date check

async function checkMissedDeadlines() {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT t.id, t.title, t.assigned_to, t.due_date
      FROM tms_tasks t
      WHERE t.deleted_at IS NULL
        AND t.status <> 'done'
        AND t.assigned_to IS NOT NULL
        AND t.due_date IS NOT NULL
        AND t.due_date < CAST(GETDATE() AS DATE)
        AND NOT EXISTS (
          SELECT 1 FROM tms_notifications n
          WHERE n.task_id = t.id AND n.type = 'deadline_missed'
        )
    `);

    for (const task of result.recordset) {
      await logActivity({
        userId: task.assigned_to,
        type: "deadline_missed",
        title: "Missed deadline",
        message: `"${task.title}" passed its due date (${new Date(task.due_date).toISOString().split("T")[0]}) without being completed.`,
        taskId: task.id,
      });
    }
  } catch (err) {
    console.error("checkMissedDeadlines failed:", err.message);
  }
}

function startMissedDeadlineChecker() {
  checkMissedDeadlines(); // run once at startup too, not just on the first interval tick
  setInterval(checkMissedDeadlines, CHECK_INTERVAL_MS);
}

module.exports = { startMissedDeadlineChecker };
