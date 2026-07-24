const { sql, getPool } = require("../config/db");

// Weekly on-time completion rate: of the tasks that were DUE in a given
// week, what % were marked done by the end of that week.
async function getCompletionRate(weeks = 6) {
  const pool = await getPool();
  const since = new Date();
  since.setDate(since.getDate() - weeks * 7);

  const result = await pool.request().input("since", sql.DateTime2, since)
    .query(`
    SELECT id, status, due_date, updated_at
    FROM tms_tasks
    WHERE deleted_at IS NULL AND due_date >= @since
  `);

  const tasks = result.recordset;
  const buckets = [];

  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - i * 7 - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const dueThisWeek = tasks.filter(
      (t) =>
        t.due_date &&
        new Date(t.due_date) >= weekStart &&
        new Date(t.due_date) < weekEnd,
    );
    const completedOnTime = dueThisWeek.filter(
      (t) => t.status === "done" && new Date(t.updated_at) <= weekEnd,
    );

    buckets.push({
      week: `W${weeks - i}`,
      rate: dueThisWeek.length
        ? Math.round((completedOnTime.length / dueThisWeek.length) * 100)
        : 0,
    });
  }

  return buckets;
}

async function getOverdueMetrics() {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT id, due_date
    FROM tms_tasks
    WHERE deleted_at IS NULL
      AND status != 'done'
      AND due_date IS NOT NULL
      AND due_date < CAST(GETDATE() AS DATE)
  `);

  const overdue = result.recordset;
  const totalOverdue = overdue.length;

  const avgDaysLate = totalOverdue
    ? overdue.reduce((sum, t) => {
        const days = Math.floor(
          (Date.now() - new Date(t.due_date).getTime()) / 86400000,
        );
        return sum + days;
      }, 0) / totalOverdue
    : 0;

  // Trend: tasks that fell due (and are still overdue) in the last 7 days
  // vs the 7 days before that, so the % reflects a real week-over-week shift.
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(now.getDate() - 7);
  const twoWeeksAgo = new Date(now);
  twoWeeksAgo.setDate(now.getDate() - 14);

  const thisWeek = overdue.filter(
    (t) => new Date(t.due_date) >= weekAgo && new Date(t.due_date) < now,
  ).length;
  const lastWeek = overdue.filter(
    (t) =>
      new Date(t.due_date) >= twoWeeksAgo && new Date(t.due_date) < weekAgo,
  ).length;

  const changeFromLastWeek = lastWeek
    ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100)
    : thisWeek > 0
      ? 100
      : 0;

  return {
    totalOverdue,
    avgDaysLate: Math.round(avgDaysLate * 10) / 10,
    changeFromLastWeek,
  };
}

async function getProductivityByUser(limit = 8) {
  const pool = await getPool();
  const result = await pool.request().input("limit", sql.Int, limit).query(`
    SELECT TOP (@limit) u.name AS [user], COUNT(t.id) AS tasks
    FROM tms_tasks t
    JOIN tms_users u ON u.id = t.completed_by
    WHERE t.status = 'done' AND t.deleted_at IS NULL
    GROUP BY u.name
    ORDER BY COUNT(t.id) DESC
  `);
  return result.recordset;
}

async function getWorkloadDistribution() {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT
      ISNULL(tm.name, 'Unassigned') AS name,
      COUNT(t.id) AS value
    FROM tms_tasks t
    LEFT JOIN tms_projects p ON p.id = t.project_id
    LEFT JOIN tms_teams tm ON tm.id = p.team_id
    WHERE t.deleted_at IS NULL AND t.status != 'done'
    GROUP BY tm.name
    ORDER BY COUNT(t.id) DESC
  `);
  return result.recordset;
}

module.exports = {
  getCompletionRate,
  getOverdueMetrics,
  getProductivityByUser,
  getWorkloadDistribution,
};
