// tms-backend/src/controllers/monthlyReportController.js
const { sql, getPool } = require("../config/db");
const { logActivity } = require("../services/activityService");
const {
  isReminderWindow,
  currentPeriod,
} = require("../utils/monthlyReportWindow");

// Loads a team and checks the caller is allowed to manage its monthly
// report — same rule already used by setMemberPerformanceRating: that
// team's manager_id, or an admin. Sends the 403/404 itself and returns
// null so callers can just `if (!team) return;`.
async function loadTeamForManager(pool, req, res, teamId) {
  const teamResult = await pool
    .request()
    .input("teamId", sql.Int, teamId)
    .query("SELECT id, name, manager_id FROM tms_teams WHERE id = @teamId");
  const team = teamResult.recordset[0];
  if (!team) {
    res.status(404).json({ message: "Team not found" });
    return null;
  }
  const isManager = team.manager_id === req.user.id;
  if (req.user.role !== "admin" && !isManager) {
    res.status(403).json({
      message: "Only this team's manager can file its monthly report",
    });
    return null;
  }
  return team;
}

// One row per team per period. Get-or-create so opening the reminder /
// roster for the first time in a given month just works, no separate
// "start this month's report" step needed.
async function getOrCreateReport(pool, teamId, period) {
  const existing = await pool
    .request()
    .input("teamId", sql.Int, teamId)
    .input("year", sql.Int, period.year)
    .input("month", sql.Int, period.month).query(`
      SELECT * FROM tms_monthly_reports
      WHERE team_id = @teamId AND period_year = @year AND period_month = @month
    `);
  if (existing.recordset[0]) return existing.recordset[0];

  const inserted = await pool
    .request()
    .input("teamId", sql.Int, teamId)
    .input("year", sql.Int, period.year)
    .input("month", sql.Int, period.month).query(`
      INSERT INTO tms_monthly_reports (team_id, period_year, period_month, status)
      OUTPUT INSERTED.*
      VALUES (@teamId, @year, @month, 'pending')
    `);
  return inserted.recordset[0];
}

// GET /api/monthly-reports/reminders
// Powers the dashboard reminder button for managers/admins: every team
// the caller manages (admins: every team) and where that team's CURRENT
// period report stands. `active` is the single date-gate flag — see
// utils/monthlyReportWindow.js. The frontend hides the widget entirely
// when active is false or teams is empty.
async function getReminders(req, res, next) {
  try {
    const period = currentPeriod();
    const pool = await getPool();

    const teamsResult =
      req.user.role === "admin"
        ? await pool.request().query(`
            SELECT t.id, t.name, t.manager_id FROM tms_teams t ORDER BY t.name ASC
          `)
        : await pool.request().input("managerId", sql.Int, req.user.id).query(`
              SELECT t.id, t.name, t.manager_id FROM tms_teams t
              WHERE t.manager_id = @managerId
              ORDER BY t.name ASC
            `);

    const teams = [];
    for (const team of teamsResult.recordset) {
      const report = await getOrCreateReport(pool, team.id, period);
      if (report.status === "released") continue; // already filed & out — nothing to remind about

      const countsResult = await pool
        .request()
        .input("teamId", sql.Int, team.id)
        .input("managerId", sql.Int, team.manager_id ?? -1)
        .input("reportId", sql.Int, report.id).query(`
          SELECT
            (SELECT COUNT(*) FROM tms_users WHERE team_id = @teamId AND id <> @managerId) AS total,
            (SELECT COUNT(*) FROM tms_monthly_report_ratings WHERE report_id = @reportId) AS rated
        `);
      const { total, rated } = countsResult.recordset[0];

      teams.push({
        teamId: team.id,
        teamName: team.name,
        reportId: report.id,
        status: report.status, // 'pending' | 'submitted'
        ratedCount: rated,
        totalCount: total,
      });
    }

    res.json({ active: isReminderWindow(), period, teams });
  } catch (err) {
    next(err);
  }
}

// GET /api/monthly-reports/teams/:teamId/current
// Roster + this period's existing ratings, for the "click the reminder
// button" modal.
async function getCurrentReport(req, res, next) {
  try {
    const teamId = Number(req.params.teamId);
    const pool = await getPool();
    const team = await loadTeamForManager(pool, req, res, teamId);
    if (!team) return;

    const period = currentPeriod();
    const report = await getOrCreateReport(pool, teamId, period);

    const rosterResult = await pool
      .request()
      .input("teamId", sql.Int, teamId)
      .input("managerId", sql.Int, team.manager_id ?? -1)
      .input("reportId", sql.Int, report.id).query(`
        SELECT u.id, u.name, u.role, u.avatar_color AS avatarColor,
               mrr.rating AS rating, mrr.rated_at AS ratedAt
        FROM tms_users u
        LEFT JOIN tms_monthly_report_ratings mrr
          ON mrr.report_id = @reportId AND mrr.employee_id = u.id
        WHERE u.team_id = @teamId AND u.id <> @managerId
        ORDER BY u.name ASC
      `);

    res.json({
      reportId: report.id,
      teamId,
      teamName: team.name,
      period,
      status: report.status,
      members: rosterResult.recordset,
    });
  } catch (err) {
    next(err);
  }
}

// PUT /api/monthly-reports/teams/:teamId/current/ratings/:memberId
// This IS the "same rating input" — it upserts the per-report rating
// (history, tied to this month's report) AND upserts
// tms_performance_ratings (the live "current rating" table the Teams
// tab / scoring.js already read from), so filing the monthly report is
// how that current rating gets set — no separate step.
async function setReportRating(req, res, next) {
  try {
    const teamId = Number(req.params.teamId);
    const memberId = Number(req.params.memberId);
    const { rating } = req.body;

    if (
      rating === undefined ||
      rating === null ||
      Number.isNaN(Number(rating))
    ) {
      return res.status(400).json({ message: "Rating is required" });
    }
    const ratingValue = Math.round(Number(rating));
    if (ratingValue < 0 || ratingValue > 10) {
      return res
        .status(400)
        .json({ message: "Rating must be between 0 and 10" });
    }

    const pool = await getPool();
    const team = await loadTeamForManager(pool, req, res, teamId);
    if (!team) return;

    if (memberId === team.manager_id) {
      return res
        .status(400)
        .json({ message: "Managers aren't rated on their own roster" });
    }

    const memberResult = await pool
      .request()
      .input("memberId", sql.Int, memberId)
      .query("SELECT id, team_id FROM tms_users WHERE id = @memberId");
    const member = memberResult.recordset[0];
    if (!member || member.team_id !== teamId) {
      return res
        .status(404)
        .json({ message: "That person isn't on this team" });
    }

    const period = currentPeriod();
    const report = await getOrCreateReport(pool, teamId, period);
    if (report.status === "released") {
      return res.status(400).json({
        message: "This month's report is already released and locked",
      });
    }

    await pool
      .request()
      .input("reportId", sql.Int, report.id)
      .input("employeeId", sql.Int, memberId)
      .input("rating", sql.Int, ratingValue)
      .input("ratedBy", sql.Int, req.user.id).query(`
        MERGE tms_monthly_report_ratings AS target
        USING (SELECT @reportId AS report_id, @employeeId AS employee_id) AS src
        ON target.report_id = src.report_id AND target.employee_id = src.employee_id
        WHEN MATCHED THEN
          UPDATE SET rating = @rating, rated_by = @ratedBy, rated_at = GETDATE()
        WHEN NOT MATCHED THEN
          INSERT (report_id, employee_id, rating, rated_by, rated_at)
          VALUES (@reportId, @employeeId, @rating, @ratedBy, GETDATE());
      `);

    await pool
      .request()
      .input("employeeId", sql.Int, memberId)
      .input("teamId", sql.Int, teamId)
      .input("rating", sql.Int, ratingValue)
      .input("ratedBy", sql.Int, req.user.id).query(`
        MERGE tms_performance_ratings AS target
        USING (SELECT @employeeId AS employee_id) AS src
        ON target.employee_id = src.employee_id
        WHEN MATCHED THEN
          UPDATE SET rating = @rating, team_id = @teamId,
                     rated_by = @ratedBy, rated_at = GETDATE()
        WHEN NOT MATCHED THEN
          INSERT (employee_id, team_id, rating, rated_by, rated_at)
          VALUES (@employeeId, @teamId, @rating, @ratedBy, GETDATE());
      `);

    res.json({
      reportId: report.id,
      employeeId: memberId,
      rating: ratingValue,
      ratedAt: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/monthly-reports/teams/:teamId/current/submit
// Marks the report "filed". Ratings can still be edited/added after
// this (status just stays 'submitted') right up until it's released.
async function submitReport(req, res, next) {
  try {
    const teamId = Number(req.params.teamId);
    const pool = await getPool();
    const team = await loadTeamForManager(pool, req, res, teamId);
    if (!team) return;

    const period = currentPeriod();
    const report = await getOrCreateReport(pool, teamId, period);
    if (report.status === "released") {
      return res
        .status(400)
        .json({ message: "This month's report is already released" });
    }

    await pool
      .request()
      .input("reportId", sql.Int, report.id)
      .input("submittedBy", sql.Int, req.user.id).query(`
        UPDATE tms_monthly_reports
        SET status = 'submitted', submitted_by = @submittedBy, submitted_at = GETDATE()
        WHERE id = @reportId
      `);

    res.json({ reportId: report.id, status: "submitted" });
  } catch (err) {
    next(err);
  }
}

// GET /api/monthly-reports/announcement
// Any authenticated user: the latest RELEASED report for their own
// team, plus their own rating out of it. Powers the "Reports announced
// — click to view" dashboard banner.
async function getAnnouncement(req, res, next) {
  try {
    const pool = await getPool();
    const userResult = await pool
      .request()
      .input("userId", sql.Int, req.user.id)
      .query("SELECT team_id FROM tms_users WHERE id = @userId");
    const teamId = userResult.recordset[0]?.team_id;
    if (!teamId) return res.json({ released: false });

    const reportResult = await pool.request().input("teamId", sql.Int, teamId)
      .query(`
        SELECT TOP 1 * FROM tms_monthly_reports
        WHERE team_id = @teamId AND status = 'released'
        ORDER BY released_at DESC
      `);
    const report = reportResult.recordset[0];
    if (!report) return res.json({ released: false });

    const ratingResult = await pool
      .request()
      .input("reportId", sql.Int, report.id)
      .input("employeeId", sql.Int, req.user.id).query(`
        SELECT rating, rated_at AS ratedAt FROM tms_monthly_report_ratings
        WHERE report_id = @reportId AND employee_id = @employeeId
      `);
    const ratingRow = ratingResult.recordset[0] || null;

    res.json({
      released: true,
      period: { year: report.period_year, month: report.period_month },
      releasedAt: report.released_at,
      rating: ratingRow?.rating ?? null,
      ratedAt: ratingRow?.ratedAt ?? null,
    });
  } catch (err) {
    next(err);
  }
}

// Releases every team's report for a given period that's been
// 'submitted' (submitted -> released, stamps released_at, notifies each
// rated employee via the activity feed). Only touches 'submitted' rows,
// so it's safe to call repeatedly — exported so both the manual admin
// endpoint below AND the date-based checker
// (utils/monthlyReportChecker.js) share one code path.
async function releasePeriod(period) {
  const pool = await getPool();
  const toRelease = await pool
    .request()
    .input("year", sql.Int, period.year)
    .input("month", sql.Int, period.month).query(`
      SELECT * FROM tms_monthly_reports
      WHERE period_year = @year AND period_month = @month AND status = 'submitted'
    `);

  const released = [];
  for (const report of toRelease.recordset) {
    await pool.request().input("reportId", sql.Int, report.id).query(`
        UPDATE tms_monthly_reports
        SET status = 'released', released_at = GETDATE()
        WHERE id = @reportId
      `);

    const ratingsResult = await pool
      .request()
      .input("reportId", sql.Int, report.id)
      .query(
        "SELECT employee_id FROM tms_monthly_report_ratings WHERE report_id = @reportId",
      );

    for (const r of ratingsResult.recordset) {
      await logActivity({
        userId: r.employee_id,
        type: "monthly_report_released",
        title: "Monthly report announced",
        message: `Your performance report for ${period.month}/${period.year} is ready to view.`,
      });
    }
    released.push(report.id);
  }
  return released;
}

// POST /api/monthly-reports/release — admin-only manual trigger. This
// is how the release step gets tested right now, while
// ENFORCE_DATE_WINDOW is off in utils/monthlyReportWindow.js — instead
// of waiting for the 31st, an admin can just press a button.
async function releaseReports(req, res, next) {
  try {
    const period = req.body?.period || currentPeriod();
    const released = await releasePeriod(period);
    res.json({ period, releasedReportIds: released });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getReminders,
  getCurrentReport,
  setReportRating,
  submitReport,
  getAnnouncement,
  releaseReports,
  releasePeriod,
};
