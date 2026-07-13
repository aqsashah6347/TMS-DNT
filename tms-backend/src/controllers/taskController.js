const { sql, poolPromise } = require("../config/db");
const { hasPermission } = require("../middleware/permissions");

// GET /api/tasks?priority=&assignedTo=&search=&status=&projectId=
// Matches taskStore.getFilteredTasks() logic, but done in the DB instead
// of in the frontend, since real data will be too big to filter in JS.
async function getAllTasks(req, res, next) {
  try {
    const { priority, assignedTo, search, status, projectId } = req.query;
    const pool = await poolPromise;
    const request = pool.request();

    let query = `
      SELECT t.*, u1.name AS assignedToName, u2.name AS assignedByName, u3.name AS completedByName
      FROM tms_tasks t
      LEFT JOIN tms_users u1 ON t.assigned_to = u1.id
      LEFT JOIN tms_users u2 ON t.assigned_by = u2.id
      LEFT JOIN tms_users u3 ON t.completed_by = u3.id
      WHERE t.deleted_at IS NULL
    `;

    if (priority) {
      query += " AND t.priority = @priority";
      request.input("priority", sql.NVarChar, priority);
    }
    if (status) {
      query += " AND t.status = @status";
      request.input("status", sql.NVarChar, status);
    }
    if (assignedTo) {
      query += " AND t.assigned_to = @assignedTo";
      request.input("assignedTo", sql.Int, Number(assignedTo));
    }
    if (projectId) {
      query += " AND t.project_id = @projectId";
      request.input("projectId", sql.Int, Number(projectId));
    }
    if (search) {
      query += " AND t.title LIKE @search";
      request.input("search", sql.NVarChar, `%${search}%`);
    }

    query += " ORDER BY t.pinned DESC, t.due_date ASC";

    const result = await request.query(query);
    res.json(result.recordset.map(mapTask));
  } catch (err) {
    next(err);
  }
}

async function getTaskById(req, res, next) {
  try {
    const pool = await poolPromise;
    const result = await pool.request().input("id", sql.Int, req.params.id)
      .query(`
        SELECT t.*, u1.name AS assignedToName, u2.name AS assignedByName, u3.name AS completedByName
        FROM tms_tasks t
        LEFT JOIN tms_users u1 ON t.assigned_to = u1.id
        LEFT JOIN tms_users u2 ON t.assigned_by = u2.id
        LEFT JOIN tms_users u3 ON t.completed_by = u3.id
        WHERE t.id = @id AND t.deleted_at IS NULL
      `);

    const task = result.recordset[0];
    if (!task) return res.status(404).json({ message: "Task not found" });

    res.json(mapTask(task));
  } catch (err) {
    next(err);
  }
}

async function createTask(req, res, next) {
  try {
    const {
      title,
      description = "",
      priority = "medium",
      status = "backlog",
      dueDate = null,
      assignedTo = null,
      projectId = null,
      zoomLink = "",
      githubLink = "",
    } = req.body;

    if (!title) return res.status(400).json({ message: "Title is required" });

    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("title", sql.NVarChar, title)
      .input("description", sql.NVarChar, description)
      .input("priority", sql.NVarChar, priority)
      .input("status", sql.NVarChar, status)
      .input("dueDate", sql.Date, dueDate)
      .input("assignedTo", sql.Int, assignedTo)
      .input("assignedBy", sql.Int, req.user.id)
      .input("projectId", sql.Int, projectId)
      .input("zoomLink", sql.NVarChar, zoomLink)
      .input("githubLink", sql.NVarChar, githubLink).query(`
        INSERT INTO tms_tasks
          (title, description, priority, status, due_date, assigned_to, assigned_by, project_id, zoom_link, github_link)
        OUTPUT INSERTED.*
        VALUES
          (@title, @description, @priority, @status, @dueDate, @assignedTo, @assignedBy, @projectId, @zoomLink, @githubLink)
      `);

    res.status(201).json(mapTask(result.recordset[0]));
  } catch (err) {
    next(err);
  }
}

// Fields a plain "user" is allowed to change on their own tasks.
// Everything else (reassigning, changing priority/dates/project, etc.)
// is an admin/manager action.
const USER_EDITABLE_FIELDS = ["status", "pinned", "completedBy"];

async function updateTask(req, res, next) {
  try {
    const id = req.params.id;
    const updates = req.body;

    if (req.user.role === "user") {
      const pool = await poolPromise;
      const existing = await pool
        .request()
        .input("id", sql.Int, id)
        .query(
          "SELECT assigned_to FROM tms_tasks WHERE id = @id AND deleted_at IS NULL",
        );

      const task = existing.recordset[0];
      if (!task) return res.status(404).json({ message: "Task not found" });

      if (task.assigned_to !== req.user.id) {
        return res
          .status(403)
          .json({ message: "You can only update tasks assigned to you" });
      }

      const attemptedFields = Object.keys(updates);
      const disallowed = attemptedFields.filter(
        (f) => !USER_EDITABLE_FIELDS.includes(f),
      );
      if (disallowed.length > 0) {
        return res.status(403).json({
          message: `You're not allowed to change: ${disallowed.join(", ")}. Only status can be updated.`,
        });
      }
    }

    // If a task is being marked done and no completedBy was sent,
    // default to whoever it's assigned to — same rule your taskStore uses.
    if (updates.status === "done" && !updates.completedBy) {
      const pool = await poolPromise;
      const existing = await pool
        .request()
        .input("id", sql.Int, id)
        .query("SELECT assigned_to FROM tms_tasks WHERE id = @id");
      updates.completedBy = existing.recordset[0]?.assigned_to || null;
    }
    if (updates.assignedTo !== undefined && req.user.role !== "admin") {
      const canAssign = await hasPermission(
        req.user.id,
        req.user.role,
        "tasks",
        "assign",
      );
      if (!canAssign) {
        return res
          .status(403)
          .json({ message: "You're not allowed to reassign tasks" });
      }
    }

    const fieldMap = {
      title: "title",
      description: "description",
      priority: "priority",
      status: "status",
      dueDate: "due_date",
      assignedTo: "assigned_to",
      projectId: "project_id",
      pinned: "pinned",
      zoomLink: "zoom_link",
      githubLink: "github_link",
      completedBy: "completed_by",
    };

    const pool = await poolPromise;
    const request = pool.request().input("id", sql.Int, id);
    const setClauses = [];

    for (const [key, column] of Object.entries(fieldMap)) {
      if (updates[key] !== undefined) {
        request.input(key, updates[key]);
        setClauses.push(`${column} = @${key}`);
      }
    }

    if (setClauses.length === 0) {
      return res.status(400).json({ message: "No fields to update" });
    }

    setClauses.push("updated_at = SYSUTCDATETIME()");

    const result = await request.query(`
      UPDATE tms_tasks SET ${setClauses.join(", ")}
      OUTPUT INSERTED.*
      WHERE id = @id AND deleted_at IS NULL
    `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json(mapTask(result.recordset[0]));
  } catch (err) {
    next(err);
  }
}

// Soft delete — per taskApi.js comment, we set deleted_at instead of
// actually removing the row, so nothing else that references this task
// (comments, audit logs, etc.) ever breaks.
async function deleteTask(req, res, next) {
  try {
    const pool = await poolPromise;
    const result = await pool.request().input("id", sql.Int, req.params.id)
      .query(`
        UPDATE tms_tasks SET deleted_at = SYSUTCDATETIME()
        OUTPUT INSERTED.id
        WHERE id = @id AND deleted_at IS NULL
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json({ message: "Task deleted" });
  } catch (err) {
    next(err);
  }
}

// GET /api/tasks/stats/completion?range=7d
async function getCompletionStats(req, res, next) {
  try {
    const range = req.query.range || "7d";
    const days = parseInt(range) || 7;

    const pool = await poolPromise;
    const result = await pool.request().input("days", sql.Int, days).query(`
        SELECT
          CAST(updated_at AS DATE) AS date,
          COUNT(*) AS completedCount
        FROM tms_tasks
        WHERE status = 'done'
          AND deleted_at IS NULL
          AND updated_at >= DATEADD(DAY, -@days, SYSUTCDATETIME())
        GROUP BY CAST(updated_at AS DATE)
        ORDER BY date ASC
      `);

    res.json(result.recordset);
  } catch (err) {
    next(err);
  }
}

function mapTask(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    priority: row.priority,
    status: row.status,
    dueDate: row.due_date,
    assignedTo: row.assignedToName || row.assigned_to,
    assignedBy: row.assignedByName || row.assigned_by,
    projectId: row.project_id,
    pinned: row.pinned,
    zoomLink: row.zoom_link,
    githubLink: row.github_link,
    completedBy: row.completedByName || row.completed_by,
  };
}

module.exports = {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  getCompletionStats,
};
