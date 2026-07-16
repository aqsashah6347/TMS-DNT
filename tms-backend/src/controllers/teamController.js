// tms-backend/src/controllers/teamController.js
const { sql, poolPromise } = require("../config/db");

// Matches taskController.js's formatDate — keeps due_date shaped as a
// plain YYYY-MM-DD string here too instead of a raw SQL DATE/Date object.
function formatDate(value) {
  if (!value) return null;
  return new Date(value).toISOString().split("T")[0];
}

// GET /api/teams — admin/manager collection view (grid of every team).
async function getAllTeams(req, res, next) {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT t.*, m.name AS managerName, m.id AS managerId
      FROM tms_teams t
      LEFT JOIN tms_users m ON t.manager_id = m.id
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

// GET /api/teams/mine — the "My Team" view. Any authenticated user can hit
// this; it always resolves off req.user.id rather than a param so there's
// no way to fetch someone else's team context by guessing an id.
async function getMyTeam(req, res, next) {
  try {
    const pool = await poolPromise;

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
        SELECT t.*, m.name AS managerName, m.id AS managerId
        FROM tms_teams t
        LEFT JOIN tms_users m ON t.manager_id = m.id
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

// POST /api/teams — admin-only (enforced in teamRoutes.js via requireRole).
async function createTeam(req, res, next) {
  try {
    const {
      name,
      description = null,
      managerId = null,
      members = [],
    } = req.body;
    if (!name)
      return res.status(400).json({ message: "Team name is required" });

    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("name", sql.NVarChar, name)
      .input("description", sql.NVarChar, description)
      .input("managerId", sql.Int, managerId)
      .input("createdBy", sql.Int, req.user.id).query(`
        INSERT INTO tms_teams (name, description, manager_id, created_by)
        OUTPUT INSERTED.*
        VALUES (@name, @description, @managerId, @createdBy)
      `);

    const team = result.recordset[0];

    await assignMembers(pool, team.id, members, managerId);

    res.status(201).json(await attachTeamDetails(pool)(team));
  } catch (err) {
    next(err);
  }
}

// PUT /api/teams/:id — admin-only (enforced in teamRoutes.js).
async function updateTeam(req, res, next) {
  try {
    const { name, description, managerId, members } = req.body;
    const pool = await poolPromise;
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

    // Members are replaced wholesale whenever the array is provided —
    // matches how the edit form sends its full member list on every save.
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

// DELETE /api/teams/:id — admin-only (enforced in teamRoutes.js).
async function deleteTeam(req, res, next) {
  try {
    const pool = await poolPromise;
    const id = req.params.id;

    // Unlink members/projects first so the FK constraints added in
    // 005_add_team_manager_and_user_team.sql don't block the delete.
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

// Sets tms_users.team_id for every member (and the manager, if given) so
// the manager always shows up as part of their own team's roster too.
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

// Attaches member list + project count to a raw tms_teams row. Keeps
// `members` as a flat name array (what TeamCard.jsx / TeamWorkload.jsx
// already expect) and adds `memberDetails`/`manager` for the modal and
// the My Team dashboard.
function attachTeamDetails(pool) {
  return async (team) => {
    const membersResult = await pool.request().input("teamId", sql.Int, team.id)
      .query(`
        SELECT id, name, role, avatar_color AS avatarColor FROM tms_users
        WHERE team_id = @teamId
        ORDER BY name ASC
      `);

    const projectCountResult = await pool
      .request()
      .input("teamId", sql.Int, team.id)
      .query(
        "SELECT COUNT(*) AS count FROM tms_projects WHERE team_id = @teamId",
      );

    return {
      id: team.id,
      name: team.name,
      description: team.description,
      managerId: team.managerId ?? team.manager_id ?? null,
      managerName: team.managerName || null,
      members: membersResult.recordset.map((r) => r.name),
      memberDetails: membersResult.recordset,
      projectCount: projectCountResult.recordset[0].count,
      createdAt: team.created_at,
    };
  };
}

// Shared by getMyTeam: every project pointed at this team, plus every
// (non-deleted) task inside those projects — this is what makes the
// dashboard-style "Projects & Tasks" section on the My Team view live
// data instead of another mock array.
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

module.exports = { getAllTeams, getMyTeam, createTeam, updateTeam, deleteTeam };
