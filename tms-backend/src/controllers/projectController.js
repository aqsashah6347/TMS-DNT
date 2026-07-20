const { sql, getPool } = require("../config/db");
const { logActivity } = require("../services/activityService");

async function getAllProjects(req, res, next) {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT p.*, t.name AS teamName, cu.name AS createdByName
      FROM tms_projects p
      LEFT JOIN tms_teams t ON p.team_id = t.id
      LEFT JOIN tms_users cu ON p.created_by = cu.id
      ORDER BY p.created_at DESC
    `);

    const projects = await Promise.all(
      result.recordset.map(attachMembers(pool)),
    );
    res.json(projects);
  } catch (err) {
    next(err);
  }
}
async function notifyTeamAssigned(
  pool,
  teamId,
  projectId,
  projectName,
  actorId,
) {
  const members = await pool
    .request()
    .input("teamId", sql.Int, teamId)
    .query("SELECT id FROM tms_users WHERE team_id = @teamId");

  for (const member of members.recordset) {
    if (member.id === actorId) continue;
    await logActivity({
      userId: member.id,
      type: "project_assigned",
      title: "New project for your team",
      message: `Your team was assigned to the project "${projectName}".`,
      projectId,
    });
  }
}

async function getProjectById(req, res, next) {
  try {
    const pool = await getPool();
    const result = await pool.request().input("id", sql.Int, req.params.id)
      .query(`
        SELECT p.*, t.name AS teamName, cu.name AS createdByName
        FROM tms_projects p
        LEFT JOIN tms_teams t ON p.team_id = t.id
        LEFT JOIN tms_users cu ON p.created_by = cu.id
        WHERE p.id = @id
      `);

    const project = result.recordset[0];
    if (!project) return res.status(404).json({ message: "Project not found" });

    res.json(await attachMembers(pool)(project));
  } catch (err) {
    next(err);
  }
}

async function createProject(req, res, next) {
  try {
    const {
      name,
      description = "",
      teamId = null,
      status = "planning",
      color = null,
      members = [],
    } = req.body;
    if (!name)
      return res.status(400).json({ message: "Project name is required" });

    const pool = await getPool();
    const result = await pool
      .request()
      .input("name", sql.NVarChar, name)
      .input("description", sql.NVarChar, description)
      .input("teamId", sql.Int, teamId)
      .input("status", sql.NVarChar, status)
      .input("color", sql.NVarChar, color)
      .input("createdBy", sql.Int, req.user.id).query(`
        INSERT INTO tms_projects (name, description, team_id, status, color, created_by)
        OUTPUT INSERTED.*
        VALUES (@name, @description, @teamId, @status, @color, @createdBy)
      `);

    const project = result.recordset[0];
    // OUTPUT INSERTED.* only has created_by as a raw id — the creator IS
    // the current user, so their name is already on the token, no extra
    // lookup needed.
    project.createdByName = req.user.name;

    await logActivity({
      userId: req.user.id,
      type: "project_created",
      title: "Project created",
      message: `You created the project "${project.name}".`,
      projectId: project.id,
    });

    for (const userId of members) {
      await pool
        .request()
        .input("projectId", sql.Int, project.id)
        .input("userId", sql.Int, userId)
        .query(
          "INSERT INTO tms_project_members (project_id, user_id) VALUES (@projectId, @userId)",
        );
    }
    if (project.team_id) {
      await notifyTeamAssigned(
        pool,
        project.team_id,
        project.id,
        project.name,
        req.user.id,
      );
    }
    res.status(201).json(await attachMembers(pool)(project));
  } catch (err) {
    next(err);
  }
}

async function updateProject(req, res, next) {
  try {
    const id = req.params.id;
    const { name, description, teamId, status, progress, color, members } =
      req.body;

    const pool = await getPool();
    const before = await pool
      .request()
      .input("id", sql.Int, id)
      .query("SELECT team_id FROM tms_projects WHERE id = @id");
    const previousTeamId = before.recordset[0]?.team_id ?? null;
    const request = pool.request().input("id", sql.Int, id);
    const setClauses = [];

    if (name !== undefined) {
      request.input("name", sql.NVarChar, name);
      setClauses.push("name = @name");
    }
    if (description !== undefined) {
      request.input("description", sql.NVarChar, description);
      setClauses.push("description = @description");
    }
    if (teamId !== undefined) {
      request.input("teamId", sql.Int, teamId);
      setClauses.push("team_id = @teamId");
    }
    if (status !== undefined) {
      request.input("status", sql.NVarChar, status);
      setClauses.push("status = @status");
    }
    if (progress !== undefined) {
      request.input("progress", sql.Int, progress);
      setClauses.push("progress = @progress");
    }
    if (color !== undefined) {
      request.input("color", sql.NVarChar, color);
      setClauses.push("color = @color");
    }

    let project;
    if (setClauses.length > 0) {
      const result = await request.query(`
        UPDATE tms_projects SET ${setClauses.join(", ")}
        OUTPUT INSERTED.*
        WHERE id = @id
      `);
      if (result.recordset.length === 0)
        return res.status(404).json({ message: "Project not found" });
      project = result.recordset[0];
    } else {
      const result = await pool
        .request()
        .input("id", sql.Int, id)
        .query("SELECT * FROM tms_projects WHERE id = @id");
      if (result.recordset.length === 0)
        return res.status(404).json({ message: "Project not found" });
      project = result.recordset[0];
    }

    if (members !== undefined) {
      await pool
        .request()
        .input("projectId", sql.Int, id)
        .query("DELETE FROM tms_project_members WHERE project_id = @projectId");

      for (const userId of members) {
        await pool
          .request()
          .input("projectId", sql.Int, id)
          .input("userId", sql.Int, userId)
          .query(
            "INSERT INTO tms_project_members (project_id, user_id) VALUES (@projectId, @userId)",
          );
      }
    }

    res.json(await attachMembers(pool)(project));

    if (
      teamId !== undefined &&
      project.team_id &&
      project.team_id !== previousTeamId
    ) {
      await notifyTeamAssigned(
        pool,
        project.team_id,
        project.id,
        project.name,
        req.user.id,
      );
    }
  } catch (err) {
    next(err);
  }
}

async function deleteProject(req, res, next) {
  try {
    const pool = await getPool();
    const id = req.params.id;
    await pool.request().input("projectId", sql.Int, id).query(`
  UPDATE tms_notifications SET task_id = NULL
  WHERE task_id IN (SELECT id FROM tms_tasks WHERE project_id = @projectId)
`);
    await pool
      .request()
      .input("projectId", sql.Int, id)
      .query(
        "UPDATE tms_notifications SET project_id = NULL WHERE project_id = @projectId",
      );
    await pool
      .request()
      .input("projectId", sql.Int, id)
      .query("DELETE FROM tms_tasks WHERE project_id = @projectId");

    const result = await pool
      .request()
      .input("id", sql.Int, id)
      .query(
        "DELETE FROM tms_projects OUTPUT DELETED.id, DELETED.name WHERE id = @id",
      );

    if (result.recordset.length === 0)
      return res.status(404).json({ message: "Project not found" });

    // projectId omitted — FK_notifications_project references a row that
    // no longer exists after this delete, so the name goes in the message.
    await logActivity({
      userId: req.user.id,
      type: "project_deleted",
      title: "Project deleted",
      message: `You deleted the project "${result.recordset[0].name}".`,
    });

    res.json({ message: "Project deleted" });
  } catch (err) {
    next(err);
  }
}

function attachMembers(pool) {
  return async (project) => {
    const membersResult = await pool
      .request()
      .input("projectId", sql.Int, project.id).query(`
        SELECT u.id, u.name, u.avatar_color AS avatarColor FROM tms_project_members pm
        JOIN tms_users u ON pm.user_id = u.id
        WHERE pm.project_id = @projectId
      `);

    // createdByName already comes back from the SELECT JOIN (list/detail
    // views) or was set manually after INSERT (createProject). updateProject's
    // OUTPUT INSERTED.* doesn't have it though, so fall back to a lookup here.
    let createdByName = project.createdByName ?? null;
    if (!createdByName && project.created_by) {
      const creatorResult = await pool
        .request()
        .input("id", sql.Int, project.created_by)
        .query("SELECT name FROM tms_users WHERE id = @id");
      createdByName = creatorResult.recordset[0]?.name || null;
    }

    return {
      id: project.id,
      name: project.name,
      description: project.description,
      teamId: project.team_id,
      teamName: project.teamName,
      members: membersResult.recordset.map((r) => r.name),
      memberDetails: membersResult.recordset,
      status: project.status,
      progress: project.progress,
      color: project.color,
      createdBy: project.created_by,
      createdByName,
    };
  };
}

module.exports = {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
};
