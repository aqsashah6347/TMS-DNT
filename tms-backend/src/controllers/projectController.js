const { sql, poolPromise } = require("../config/db");

async function getAllProjects(req, res, next) {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT p.*, t.name AS teamName
      FROM tms_projects p
      LEFT JOIN tms_teams t ON p.team_id = t.id
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

async function getProjectById(req, res, next) {
  try {
    const pool = await poolPromise;
    const result = await pool.request().input("id", sql.Int, req.params.id)
      .query(`
        SELECT p.*, t.name AS teamName
        FROM tms_projects p
        LEFT JOIN tms_teams t ON p.team_id = t.id
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

    const pool = await poolPromise;
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

    for (const userId of members) {
      await pool
        .request()
        .input("projectId", sql.Int, project.id)
        .input("userId", sql.Int, userId)
        .query(
          "INSERT INTO tms_project_members (project_id, user_id) VALUES (@projectId, @userId)",
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

    const pool = await poolPromise;
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

    // Members are a separate join table, so they're replaced wholesale
    // whenever the array is provided (matches how the edit form sends
    // its full comma-separated member list on every save).
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
  } catch (err) {
    next(err);
  }
}

async function deleteProject(req, res, next) {
  try {
    const pool = await poolPromise;
    const id = req.params.id;

    // tms_tasks.project_id has no ON DELETE rule, so SQL Server will
    // reject the project delete with a foreign key error if any tasks
    // still point at it. A project is a container for its tasks, so we
    // delete those first — same as clicking delete on each task.
    await pool
      .request()
      .input("projectId", sql.Int, id)
      .query("DELETE FROM tms_tasks WHERE project_id = @projectId");

    const result = await pool
      .request()
      .input("id", sql.Int, id)
      .query("DELETE FROM tms_projects OUTPUT DELETED.id WHERE id = @id");

    if (result.recordset.length === 0)
      return res.status(404).json({ message: "Project not found" });
    res.json({ message: "Project deleted" });
  } catch (err) {
    next(err);
  }
}

// Small helper: fetches member names for a project and shapes the
// response the way projectStore.js's seed data already looks (so you
// don't have to change any frontend component when you wire this up).
function attachMembers(pool) {
  return async (project) => {
    const membersResult = await pool
      .request()
      .input("projectId", sql.Int, project.id).query(`
        SELECT u.name FROM tms_project_members pm
        JOIN tms_users u ON pm.user_id = u.id
        WHERE pm.project_id = @projectId
      `);

    return {
      id: project.id,
      name: project.name,
      description: project.description,
      teamId: project.team_id,
      teamName: project.teamName,
      members: membersResult.recordset.map((r) => r.name),
      status: project.status,
      progress: project.progress,
      color: project.color,
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
