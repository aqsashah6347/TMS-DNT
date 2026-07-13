const { sql, poolPromise } = require("../config/db");
const { hasPermission } = require("../middleware/permissions");

const JOIN_QUERY = `
  SELECT t.*, u1.name AS assignedToName, u2.name AS assignedByName, u3.name AS completedByName
  FROM tms_tasks t
  LEFT JOIN tms_users u1 ON t.assigned_to = u1.id
  LEFT JOIN tms_users u2 ON t.assigned_by = u2.id
  LEFT JOIN tms_users u3 ON t.completed_by = u3.id
`;

// Re-fetches a task WITH its joined names after an insert/update, since
// "OUTPUT INSERTED.*" only returns raw columns (assigned_to as an id,
// no name) — without this, the frontend never sees assignedToName after
// creating/editing a task, only after a full page refresh.
async function fetchTaskWithJoins(pool, id) {
  const result = await pool
    .request()
    .input("id", sql.Int, id)
    .query(`${JOIN_QUERY} WHERE t.id = @id AND t.deleted_at IS NULL`);
  return result.recordset[0] ? mapTask(result.recordset[0]) : null;
}

// GET /api/tasks?priority=&assignedTo=&search=&status=&projectId=
async function getAllTasks(req, res, next) {
  try {
    const { priority, assignedTo, search, status, projectId } = req.query;
    const pool = await poolPromise;
    const request = pool.request();

    let query = `${JOIN_QUERY} WHERE t.deleted_at IS NULL`;

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
    const task = await fetchTaskWithJoins(pool, req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });
    res.json(task);
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
      .input("dueDate", sql.Date, dueDate || null)
      .input("assignedTo", sql.Int, assignedTo || null)
      .input("assignedBy", sql.Int, req.user.id)
      .input("projectId", sql.Int, projectId || null)
      .input("zoomLink", sql.NVarChar, zoomLink)
      .input("githubLink", sql.NVarChar, githubLink).query(`
        INSERT INTO tms_tasks
          (title, description, priority, status, due_date, assigned_to, assigned_by, project_id, zoom_link, github_link)
        OUTPUT INSERTED.id
        VALUES
          (@title, @description, @priority, @status, @dueDate, @assignedTo, @assignedBy, @projectId, @zoomLink, @githubLink)
      `);

    const newId = result.recordset[0].id;
    const task = await fetchTaskWithJoins(pool, newId);
    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
}

const USER_EDITABLE_FIELDS = ["status", "pinned", "completedBy"];

async function updateTask(req, res, next) {
  try {
    const id = req.params.id;
    const updates = req.body;
    const pool = await poolPromise;

    if (req.user.role === "user") {
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

    if (updates.status === "done" && !updates.completedBy) {
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

    const request = pool.request().input("id", sql.Int, id);
    const setClauses = [];

   for (const [key, column] of Object.entries(fieldMap)) {
     if (updates[key] !== undefined) {
       // Empty string ("" from a blank date input) isn't a valid SQL DATE —
       // normalize to null so SQL Server doesn't choke on the conversion.
       const value = updates[key] === "" ? null : updates[key];
       if (key === "dueDate") {
         request.input(key, sql.Date, value);
       } else {
         request.input(key, value);
       }
       setClauses.push(`${column} = @${key}`);
     }
   }

    if (setClauses.length === 0) {
      return res.status(400).json({ message: "No fields to update" });
    }

    setClauses.push("updated_at = SYSUTCDATETIME()");

    const result = await request.query(`
      UPDATE tms_tasks SET ${setClauses.join(", ")}
      OUTPUT INSERTED.id
      WHERE id = @id AND deleted_at IS NULL
    `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "Task not found" });
    }

    const task = await fetchTaskWithJoins(pool, result.recordset[0].id);
    res.json(task);
  } catch (err) {
    next(err);
  }
}

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

// Formats a SQL DATE column (comes back as a JS Date object) down to a
// plain "YYYY-MM-DD" string — the calendar view compares dueDate strings
// directly, and a full ISO datetime string would never match.
function formatDate(value) {
  if (!value) return null;
  return new Date(value).toISOString().split("T")[0];
}

function mapTask(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    priority: row.priority,
    status: row.status,
    dueDate: formatDate(row.due_date),
    assignedTo: row.assigned_to,
    assignedToName: row.assignedToName || null,
    assignedBy: row.assigned_by,
    assignedByName: row.assignedByName || null,
    projectId: row.project_id,
    pinned: row.pinned,
    zoomLink: row.zoom_link,
    githubLink: row.github_link,
    completedBy: row.completed_by,
    completedByName: row.completedByName || null,
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
