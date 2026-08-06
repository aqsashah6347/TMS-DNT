// tms-backend/src/controllers/teamController.js
const { sql, getPool } = require("../config/db");
const { logActivity } = require("../services/activityService");

function formatDate(value) {
  if (!value) return null;
  return new Date(value).toISOString().split("T")[0];
}

async function getAllTeams(req, res, next) {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT t.*, m.name AS managerName, m.id AS managerId, cu.name AS createdByName
      FROM tms_teams t
      LEFT JOIN tms_users m ON t.manager_id = m.id
      LEFT JOIN tms_users cu ON t.created_by = cu.id
      ORDER BY t.created_at DESC
    `);

    const teams = await Promise.all(
      result.recordset.map(attachTeamDetails(pool)),
    );
    res.json(teams);
  } catch (err) {
    next(err);
  }
}

async function getMyTeam(req, res, next) {
  try {
    const pool = await getPool();

    const userResult = await pool
      .request()
      .input("userId", sql.Int, req.user.id)
      .query("SELECT team_id FROM tms_users WHERE id = @userId");

    const teamId = userResult.recordset[0]?.team_id;
    if (!teamId) {
      return res.json({ team: null, projects: [], tasks: [] });
    }

    const teamResult = await pool.request().input("teamId", sql.Int, teamId)
      .query(`
        SELECT t.*, m.name AS managerName, m.id AS managerId, cu.name AS createdByName
        FROM tms_teams t
        LEFT JOIN tms_users m ON t.manager_id = m.id
        LEFT JOIN tms_users cu ON t.created_by = cu.id
        WHERE t.id = @teamId
      `);

    if (teamResult.recordset.length === 0) {
      return res.json({ team: null, projects: [], tasks: [] });
    }

    const team = await attachTeamDetails(pool)(teamResult.recordset[0]);
    const { projects, tasks } = await getTeamProjectsAndTasks(pool, teamId);

    res.json({ team, projects, tasks });
  } catch (err) {
    next(err);
  }
}

async function createTeam(req, res, next) {
  try {
    const {
      name,
      description = null,
      managerId = null,
      members = [],
      color = null,
    } = req.body;
    if (!name)
      return res.status(400).json({ message: "Team name is required" });

    const pool = await getPool();
    const result = await pool
      .request()
      .input("name", sql.NVarChar, name)
      .input("description", sql.NVarChar, description)
      .input("managerId", sql.Int, managerId)
      .input("color", sql.NVarChar, color)
      .input("createdBy", sql.Int, req.user.id).query(`
        INSERT INTO tms_teams (name, description, manager_id, color, created_by)
        OUTPUT INSERTED.*
        VALUES (@name, @description, @managerId, @color, @createdBy)
      `);

    const team = result.recordset[0];
    team.createdByName = req.user.name;

    await assignMembers(pool, team.id, members, managerId);

    await logActivity({
      userId: req.user.id,
      type: "team_created",
      title: "Team created",
      message: `You created the team "${team.name}".`,
    });

    res.status(201).json(await attachTeamDetails(pool)(team));
  } catch (err) {
    next(err);
  }
}

async function updateTeam(req, res, next) {
  try {
    const { name, description, managerId, members, color } = req.body;
    const pool = await getPool();
    const request = pool.request().input("id", sql.Int, req.params.id);
    const setClauses = [];

    if (name !== undefined) {
      request.input("name", sql.NVarChar, name);
      setClauses.push("name = @name");
    }
    if (description !== undefined) {
      request.input("description", sql.NVarChar, description);
      setClauses.push("description = @description");
    }
    if (managerId !== undefined) {
      request.input("managerId", sql.Int, managerId);
      setClauses.push("manager_id = @managerId");
    }
    if (color !== undefined) {
      request.input("color", sql.NVarChar, color);
      setClauses.push("color = @color");
    }

    let team;
    if (setClauses.length > 0) {
      const result = await request.query(`
        UPDATE tms_teams SET ${setClauses.join(", ")}
        OUTPUT INSERTED.*
        WHERE id = @id
      `);
      if (result.recordset.length === 0)
        return res.status(404).json({ message: "Team not found" });
      team = result.recordset[0];
    } else {
      const result = await pool
        .request()
        .input("id", sql.Int, req.params.id)
        .query("SELECT * FROM tms_teams WHERE id = @id");
      if (result.recordset.length === 0)
        return res.status(404).json({ message: "Team not found" });
      team = result.recordset[0];
    }

    if (members !== undefined) {
      await pool
        .request()
        .input("teamId", sql.Int, team.id)
        .query("UPDATE tms_users SET team_id = NULL WHERE team_id = @teamId");

      await assignMembers(pool, team.id, members, team.manager_id);
    }

    res.json(await attachTeamDetails(pool)(team));
  } catch (err) {
    next(err);
  }
}

async function deleteTeam(req, res, next) {
  try {
    const pool = await getPool();
    const id = req.params.id;

    await pool
      .request()
      .input("teamId", sql.Int, id)
      .query("UPDATE tms_users SET team_id = NULL WHERE team_id = @teamId");
    await pool
      .request()
      .input("teamId", sql.Int, id)
      .query("UPDATE tms_projects SET team_id = NULL WHERE team_id = @teamId");

    const result = await pool
      .request()
      .input("id", sql.Int, id)
      .query("DELETE FROM tms_teams OUTPUT DELETED.id WHERE id = @id");

    if (result.recordset.length === 0)
      return res.status(404).json({ message: "Team not found" });
    res.json({ message: "Team deleted" });
  } catch (err) {
    next(err);
  }
}

async function assignMembers(pool, teamId, memberIds, managerId) {
  const ids = new Set(memberIds.map((id) => Number(id)));
  if (managerId) ids.add(Number(managerId));

  for (const userId of ids) {
    await pool
      .request()
      .input("teamId", sql.Int, teamId)
      .input("userId", sql.Int, userId)
      .query("UPDATE tms_users SET team_id = @teamId WHERE id = @userId");
  }
}

function attachTeamDetails(pool) {
  return async (team) => {
    const membersResult = await pool.request().input("teamId", sql.Int, team.id)
      .query(`
        SELECT u.id, u.name, u.role, u.avatar_color AS avatarColor, u.enroll_no AS enrollNo,
               pr.rating AS performanceRating, pr.rated_at AS performanceRatedAt,
               pr.rated_by AS performanceRatedBy, rb.name AS performanceRatedByName
        FROM tms_users u
        LEFT JOIN tms_performance_ratings pr ON pr.employee_id = u.id
        LEFT JOIN tms_users rb ON rb.id = pr.rated_by
        WHERE u.team_id = @teamId
        ORDER BY u.name ASC
      `);

    const projectCountResult = await pool
      .request()
      .input("teamId", sql.Int, team.id)
      .query(
        "SELECT COUNT(*) AS count FROM tms_projects WHERE team_id = @teamId",
      );

    let createdByName = team.createdByName ?? null;
    const createdBy = team.createdBy ?? team.created_by ?? null;
    if (!createdByName && createdBy) {
      const creatorResult = await pool
        .request()
        .input("id", sql.Int, createdBy)
        .query("SELECT name FROM tms_users WHERE id = @id");
      createdByName = creatorResult.recordset[0]?.name || null;
    }

    return {
      id: team.id,
      name: team.name,
      description: team.description,
      managerId: team.managerId ?? team.manager_id ?? null,
      managerName: team.managerName || null,
      color: team.color || null,
      members: membersResult.recordset.map((r) => r.name),
      memberDetails: membersResult.recordset,
      projectCount: projectCountResult.recordset[0].count,
      createdAt: team.created_at,
      createdBy,
      createdByName,
    };
  };
}

async function getTeamProjectsAndTasks(pool, teamId) {
  const projectsResult = await pool.request().input("teamId", sql.Int, teamId)
    .query(`
      SELECT p.* FROM tms_projects p
      WHERE p.team_id = @teamId
      ORDER BY p.created_at DESC
    `);

  const projects = projectsResult.recordset.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    status: p.status,
    progress: p.progress,
    color: p.color,
  }));

  if (projects.length === 0) return { projects: [], tasks: [] };

  const tasksResult = await pool.request().input("teamId", sql.Int, teamId)
    .query(`
      SELECT t.*, u1.name AS assignedToName, p.name AS projectName
      FROM tms_tasks t
      JOIN tms_projects p ON t.project_id = p.id
      LEFT JOIN tms_users u1 ON t.assigned_to = u1.id
      WHERE p.team_id = @teamId AND t.deleted_at IS NULL
      ORDER BY t.created_at DESC
    `);

  const tasks = tasksResult.recordset.map((t) => ({
    id: t.id,
    title: t.title,
    priority: t.priority,
    status: t.status,
    dueDate: formatDate(t.due_date),
    assignedTo: t.assigned_to,
    assignedToName: t.assignedToName || null,
    projectId: t.project_id,
    projectName: t.projectName,
  }));

  return { projects, tasks };
}

// Scoped team list for the Performance page: admins see every team (same
// query as getAllTeams), everyone else only sees teams where they're the
// manager_id — which could be zero teams. Deliberately open to ANY
// authenticated user (not gated by role like GET / is) because becoming a
// team's manager doesn't change a person's tms_users.role — someone with
// role "user" can still be set as a team's manager_id via the Teams page,
// and this is how they get scoped access to that team's performance data.
async function getManagedTeams(req, res, next) {
  try {
    const pool = await getPool();

    if (req.user.role === "admin") {
      const result = await pool.request().query(`
        SELECT t.*, m.name AS managerName, m.id AS managerId, cu.name AS createdByName
        FROM tms_teams t
        LEFT JOIN tms_users m ON t.manager_id = m.id
        LEFT JOIN tms_users cu ON t.created_by = cu.id
        ORDER BY t.created_at DESC
      `);
      const teams = await Promise.all(
        result.recordset.map(attachTeamDetails(pool)),
      );
      return res.json(teams);
    }

    const result = await pool.request().input("managerId", sql.Int, req.user.id)
      .query(`
        SELECT t.*, m.name AS managerName, m.id AS managerId, cu.name AS createdByName
        FROM tms_teams t
        LEFT JOIN tms_users m ON t.manager_id = m.id
        LEFT JOIN tms_users cu ON t.created_by = cu.id
        WHERE t.manager_id = @managerId
        ORDER BY t.created_at DESC
      `);
    const teams = await Promise.all(
      result.recordset.map(attachTeamDetails(pool)),
    );
    res.json(teams);
  } catch (err) {
    next(err);
  }
}

// Sets/updates one employee's manager-given Performance Rating (0-100).
// Only that team's manager, or an admin, can call this — mirrors the
// scoping rule already used in getManagedTeams. Stored separately from
// tms_tasks.quality_rating: quality_rating is a per-task review score,
// this is a holistic per-employee judgment from their manager, and it's
// a distinct weighted input to the efficacy formula (see scoring.js).
async function setMemberPerformanceRating(req, res, next) {
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
    if (ratingValue < 0 || ratingValue > 100) {
      return res
        .status(400)
        .json({ message: "Rating must be between 0 and 100" });
    }

    const pool = await getPool();

    const teamResult = await pool
      .request()
      .input("teamId", sql.Int, teamId)
      .query("SELECT id, manager_id FROM tms_teams WHERE id = @teamId");
    const team = teamResult.recordset[0];
    if (!team) return res.status(404).json({ message: "Team not found" });

    const isManager = team.manager_id === req.user.id;
    if (req.user.role !== "admin" && !isManager) {
      return res
        .status(403)
        .json({
          message: "Only this team's manager can set performance ratings",
        });
    }
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

    await logActivity({
      userId: memberId,
      type: "performance_rated",
      title: "Performance rating updated",
      message: `${req.user.name || "Your manager"} set your performance rating to ${ratingValue}.`,
    });

    res.json({
      employeeId: memberId,
      teamId,
      rating: ratingValue,
      ratedBy: req.user.id,
      ratedByName: req.user.name,
      ratedAt: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllTeams,
  getMyTeam,
  getManagedTeams,
  createTeam,
  updateTeam,
  deleteTeam,
  setMemberPerformanceRating,
};
