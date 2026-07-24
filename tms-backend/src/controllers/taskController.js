const { sql, getPool } = require("../config/db");
const { hasPermission } = require("../middleware/permissions");
const { logActivity } = require("../services/activityService");

const JOIN_QUERY = `
  SELECT t.*, u1.name AS assignedToName, u2.name AS assignedByName, u3.name AS completedByName,
         p.color AS projectColor, p.name AS projectName
  FROM tms_tasks t
  LEFT JOIN tms_users u1 ON t.assigned_to = u1.id
  LEFT JOIN tms_users u2 ON t.assigned_by = u2.id
  LEFT JOIN tms_users u3 ON t.completed_by = u3.id
  LEFT JOIN tms_projects p ON t.project_id = p.id
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
async function getProjectName(pool, projectId) {
  const result = await pool
    .request()
    .input("projectId", sql.Int, projectId)
    .query("SELECT name FROM tms_projects WHERE id = @projectId");
  return result.recordset[0]?.name || null;
}

async function getUserName(pool, userId) {
  const result = await pool
    .request()
    .input("userId", sql.Int, userId)
    .query("SELECT name FROM tms_users WHERE id = @userId");
  return result.recordset[0]?.name || null;
}

// "15 Jul" style — used for the Due Date row inside the grouped edit
// activity's changes list.
function formatShortDate(date) {
  if (!date) return "—";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

// "in progress" -> "In Progress" — used for Status/Priority rows.
function titleCase(value) {
  if (!value) return "—";
  return value.replace(/\b\w/g, (c) => c.toUpperCase());
}

// Recomputes tms_projects.progress as "% of this project's tasks that
// are done", straight from tms_tasks. Called after any create/update/
// delete that could change a project's task mix, so the number on the
// Projects page is always live instead of a manually-set static value.
async function recalcProjectProgress(pool, projectId) {
  if (!projectId) return;

  const result = await pool.request().input("projectId", sql.Int, projectId)
    .query(`
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) AS doneCount
      FROM tms_tasks
      WHERE project_id = @projectId AND deleted_at IS NULL
    `);

  const { total, doneCount } = result.recordset[0];
  const progress = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  await pool
    .request()
    .input("projectId", sql.Int, projectId)
    .input("progress", sql.Int, progress)
    .query(
      "UPDATE tms_projects SET progress = @progress WHERE id = @projectId",
    );
}

// GET /api/tasks?priority=&assignedTo=&search=&status=&projectId=
// src/controllers/taskController.js — replace getAllTasks
async function getAllTasks(req, res, next) {
  try {
    const { priority, assignedTo, search, status, projectId } = req.query;
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(100, Number(req.query.pageSize) || 25);
    const offset = (page - 1) * pageSize;

    const pool = await getPool();
    const dataRequest = pool.request();
    const countRequest = pool.request();

    let whereClause = "t.deleted_at IS NULL";

    if (priority) {
      whereClause += " AND t.priority = @priority";
      dataRequest.input("priority", sql.NVarChar, priority);
      countRequest.input("priority", sql.NVarChar, priority);
    }
    if (status) {
      whereClause += " AND t.status = @status";
      dataRequest.input("status", sql.NVarChar, status);
      countRequest.input("status", sql.NVarChar, status);
    }
    if (req.user.role === "user") {
      whereClause += " AND t.assigned_to = @scopedAssignedTo";
      dataRequest.input("scopedAssignedTo", sql.Int, req.user.id);
      countRequest.input("scopedAssignedTo", sql.Int, req.user.id);
    } else if (assignedTo) {
      whereClause += " AND t.assigned_to = @assignedTo";
      dataRequest.input("assignedTo", sql.Int, Number(assignedTo));
      countRequest.input("assignedTo", sql.Int, Number(assignedTo));
    }
    if (projectId) {
      whereClause += " AND t.project_id = @projectId";
      dataRequest.input("projectId", sql.Int, Number(projectId));
      countRequest.input("projectId", sql.Int, Number(projectId));
    }
    if (search) {
      whereClause += " AND t.title LIKE @search";
      dataRequest.input("search", sql.NVarChar, `%${search}%`);
      countRequest.input("search", sql.NVarChar, `%${search}%`);
    }

    dataRequest.input("offset", sql.Int, offset);
    dataRequest.input("pageSize", sql.Int, pageSize);

    const dataQuery = `
      ${JOIN_QUERY} WHERE ${whereClause}
      ORDER BY t.pinned DESC, t.due_date ASC
      OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY
    `;
    const countQuery = `SELECT COUNT(*) AS total FROM tms_tasks t WHERE ${whereClause}`;

    const [dataResult, countResult] = await Promise.all([
      dataRequest.query(dataQuery),
      countRequest.query(countQuery),
    ]);

    res.json({
      tasks: dataResult.recordset.map(mapTask),
      page,
      pageSize,
      total: countResult.recordset[0].total,
    });
  } catch (err) {
    next(err);
  }
}

async function getTaskById(req, res, next) {
  try {
    const pool = await getPool();
    const task = await fetchTaskWithJoins(pool, req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    // Regular users can only fetch their own task by id directly — blocks
    // someone from guessing/typing another user's task URL.
    if (req.user.role === "user" && task.assignedTo !== req.user.id) {
      return res
        .status(403)
        .json({ message: "You don't have access to this task" });
    }

    res.json(task);
  } catch (err) {
    next(err);
  }
}

// GET /api/tasks/completed-log — plain completed-tasks log feed for the
// CompletedLogPanel drawer. Placed above any /:id-style route in
// taskRoutes.js so "completed-log" doesn't get swallowed as a param.
async function getCompletedLog(req, res, next) {
  try {
    const pool = await getPool();
    const request = pool.request();

    let query = `
  SELECT t.id, t.title, t.completed_at, t.assigned_to, t.assigned_by,
         u1.name AS assignedToName, u2.name AS assignedByName
  FROM tms_tasks t
  LEFT JOIN tms_users u1 ON t.assigned_to = u1.id
  LEFT JOIN tms_users u2 ON t.assigned_by = u2.id
  WHERE t.deleted_at IS NULL AND t.status = 'done' AND t.completed_at IS NOT NULL
`;

    // Same visibility rule as getAllTasks — regular users only see their
    // own completed tasks in the log.
    if (req.user.role === "user") {
      query += " AND t.assigned_to = @scopedAssignedTo";
      request.input("scopedAssignedTo", sql.Int, req.user.id);
    }

    query += " ORDER BY t.completed_at DESC";

    const result = await request.query(query);
    res.json(
      result.recordset.map((r) => ({
        id: r.id,
        title: r.title,
        completedAt: r.completed_at,
        assignedTo: r.assigned_to,
        assignedBy: r.assigned_by,
        assignedToName: r.assignedToName,
        assignedByName: r.assignedByName,
      })),
    );
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
      color = null,
      zoomLink = "",
      githubLink = "",
    } = req.body;

    if (!title) return res.status(400).json({ message: "Title is required" });

    const pool = await getPool();
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
      .input("color", sql.NVarChar, color)
      .input("zoomLink", sql.NVarChar, zoomLink)
      .input("githubLink", sql.NVarChar, githubLink).query(`
        INSERT INTO tms_tasks
          (title, description, priority, status, due_date, assigned_to, assigned_by, project_id, color, zoom_link, github_link)
        OUTPUT INSERTED.id
        VALUES
          (@title, @description, @priority, @status, @dueDate, @assignedTo, @assignedBy, @projectId, @color, @zoomLink, @githubLink)
      `);
    const newId = result.recordset[0].id;
    const task = await fetchTaskWithJoins(pool, newId);
    const createProjectName = task.projectId
      ? await getProjectName(pool, task.projectId)
      : null;

    // Self-logged so the creator sees it on their own Activity page
    // (Box 1 / Action Activity — distinct from the task_assigned
    // notification below, which goes to the assignee instead).
    await logActivity({
      userId: req.user.id,
      type: "task_created",
      title: "Task created",
      message: `You created "${task.title}"${createProjectName ? ` in ${createProjectName}` : ""}.`,
      taskId: task.id,
      projectId: task.projectId,
    });

    if (task.assignedTo && task.assignedTo !== req.user.id) {
      const projectName = createProjectName;
      await logActivity({
        userId: task.assignedTo,
        type: "task_assigned",
        title: "New task assigned",
        message: `${task.assignedByName || "Someone"} assigned you "${task.title}"${projectName ? ` in ${projectName}` : ""}.`,
        taskId: task.id,
        projectId: task.projectId,
      });
    }
    if (task.projectId) {
      await recalcProjectProgress(pool, task.projectId);
    }

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
    const pool = await getPool();
    // Grab the current project/status/assignee before we change anything —
    // needed to (a) recalc progress for old + new project, (b) detect a
    // done-transition for the task_completed activity, and (c) detect a
    // reassignment for the task_assigned activity.
    const before = await pool
      .request()
      .input("id", sql.Int, id)
      .query(
        "SELECT project_id, status, assigned_to, assigned_by, due_date, title, priority FROM tms_tasks WHERE id = @id AND deleted_at IS NULL",
      );
    const previousProjectId = before.recordset[0]?.project_id ?? null;
    const previousStatus = before.recordset[0]?.status ?? null;
    const previousAssignedTo = before.recordset[0]?.assigned_to ?? null;
    const previousAssignedBy = before.recordset[0]?.assigned_by ?? null;
    const previousDueDate = before.recordset[0]?.due_date ?? null;
    const previousTitle = before.recordset[0]?.title ?? null;
    const previousPriority = before.recordset[0]?.priority ?? null;

    if (req.user.role === "user") {
      if (!before.recordset[0])
        return res.status(404).json({ message: "Task not found" });

      if (previousAssignedTo !== req.user.id) {
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

    // Marking a task complete is restricted to just the task's creator
    // and its assignee — regardless of role, so even an admin/manager
    // who is neither can't complete someone else's task on their behalf.
    // Only checked on the actual completion transition (not re-saving an
    // already-done task, and not other status moves like backlog ->
    // in progress), so this doesn't affect any other editing ability.
    if (
      updates.status === "done" &&
      previousStatus !== "done" &&
      req.user.id !== previousAssignedTo &&
      req.user.id !== previousAssignedBy
    ) {
      return res.status(403).json({
        message: "Only this task's creator or assignee can mark it complete",
      });
    }

    // Only stamp completedBy/completedAt on the FIRST transition into
    // "done" — guarded by previousStatus !== "done" so re-saving an
    // already-done task (e.g. editing its description later) doesn't
    // keep overwriting the original completion timestamp.
    if (updates.status === "done" && previousStatus !== "done") {
      updates.completedBy = updates.completedBy || previousAssignedTo || null;
      updates.completedAt = new Date();
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
      color: "color",
      zoomLink: "zoom_link",
      githubLink: "github_link",
      completedBy: "completed_by",
      completedAt: "completed_at",
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
        } else if (key === "completedAt") {
          request.input(key, sql.DateTime2, value);
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

    // Any change to status or project_id can shift a project's % done,
    // so recalc both the project it's on now and the one it left (if any).
    if (previousProjectId && previousProjectId !== task.projectId) {
      await recalcProjectProgress(pool, previousProjectId);
    }
    if (task.projectId) {
      await recalcProjectProgress(pool, task.projectId);
    }
    if (
      updates.status === "done" &&
      previousStatus !== "done" &&
      task.assignedBy &&
      task.assignedBy !== task.completedBy
    ) {
      const projectName = task.projectId
        ? await getProjectName(pool, task.projectId)
        : null;
      await logActivity({
        userId: task.assignedBy,
        type: "task_completed",
        title: "Task completed",
        message: `${task.completedByName || task.assignedToName || "Someone"} completed "${task.title}"${projectName ? ` in ${projectName}` : ""}.`,
        taskId: task.id,
        projectId: task.projectId,
      });
    }

    if (
      updates.assignedTo !== undefined &&
      task.assignedTo &&
      task.assignedTo !== previousAssignedTo &&
      task.assignedTo !== req.user.id
    ) {
      const projectName = task.projectId
        ? await getProjectName(pool, task.projectId)
        : null;
      await logActivity({
        userId: task.assignedTo,
        type: "task_assigned",
        title: "New task assigned",
        message: `${req.user.name || "Someone"} assigned you "${task.title}"${projectName ? ` in ${projectName}` : ""}.`,
        taskId: task.id,
        projectId: task.projectId,
      });
    }

    // Self-logged edit trail for Box 1 / Action Activity. Every field
    // touched by a single PUT (due date, assignment, status, priority,
    // title, ...) is collected into one `changes` list and logged as a
    // single "task_edited" activity, instead of a separate activity row
    // per field — the Activity page shows one "Edited by <user>" card with
    // the individual field changes tucked inside an expandable dropdown.
    if (
      updates.dueDate !== undefined ||
      updates.assignedTo !== undefined ||
      (updates.status !== undefined && updates.status !== "done") ||
      [
        "title",
        "description",
        "priority",
        "projectId",
        "zoomLink",
        "githubLink",
      ].some((f) => updates[f] !== undefined)
    ) {
      const projectName = task.projectId
        ? await getProjectName(pool, task.projectId)
        : null;
      const suffix = projectName ? ` in ${projectName}` : "";

      const changes = [];

      if (updates.dueDate !== undefined) {
        changes.push({
          field: "Due Date",
          oldValue: formatShortDate(previousDueDate),
          newValue: formatShortDate(updates.dueDate),
        });
      }

      if (
        updates.assignedTo !== undefined &&
        task.assignedTo !== previousAssignedTo
      ) {
        const previousAssignedToName = previousAssignedTo
          ? await getUserName(pool, previousAssignedTo)
          : null;
        changes.push({
          field: "Assigned To",
          oldValue: previousAssignedToName || "Unassigned",
          newValue: task.assignedToName || "Unassigned",
        });
      }

      // "done" is intentionally excluded here — that transition is already
      // covered by the task_completed activity above, so this only fires
      // for the other status changes (backlog/in progress/review/etc).
      if (updates.status !== undefined && updates.status !== "done") {
        changes.push({
          field: "Status",
          oldValue: titleCase(previousStatus),
          newValue: titleCase(updates.status),
        });
      }

      if (
        updates.priority !== undefined &&
        updates.priority !== previousPriority
      ) {
        changes.push({
          field: "Priority",
          oldValue: titleCase(previousPriority),
          newValue: titleCase(updates.priority),
        });
      }

      if (updates.title !== undefined && updates.title !== previousTitle) {
        changes.push({
          field: "Title",
          oldValue: previousTitle || "—",
          newValue: updates.title,
        });
      }

      if (updates.description !== undefined) {
        changes.push({
          field: "Description",
          oldValue: "Previous version",
          newValue: "Updated",
        });
      }

      if (
        updates.projectId !== undefined &&
        previousProjectId !== task.projectId
      ) {
        const previousProjectName = previousProjectId
          ? await getProjectName(pool, previousProjectId)
          : null;
        changes.push({
          field: "Project",
          oldValue: previousProjectName || "None",
          newValue: projectName || "None",
        });
      }

      if (updates.zoomLink !== undefined) {
        changes.push({
          field: "Zoom Link",
          oldValue: "—",
          newValue: "Updated",
        });
      }

      if (updates.githubLink !== undefined) {
        changes.push({
          field: "GitHub Link",
          oldValue: "—",
          newValue: "Updated",
        });
      }

      if (changes.length > 0) {
        await logActivity({
          userId: req.user.id,
          type: "task_edited",
          title: "Task edited",
          message: `You edited "${task.title}"${suffix}.`,
          taskId: task.id,
          projectId: task.projectId,
          changes,
        });
      }
    }
    res.json(task);
  } catch (err) {
    next(err);
  }
}

async function deleteTask(req, res, next) {
  try {
    const pool = await getPool();

    // tms_notifications.task_id has a FK to tms_tasks(id) with no cascade
    // action, so a hard delete would otherwise throw FK_notifications_task.
    // Notification history is kept — only the now-dangling task pointer is
    // cleared.
    await pool.request().input("id", sql.Int, req.params.id).query(`
      UPDATE tms_notifications SET task_id = NULL WHERE task_id = @id
    `);

    const result = await pool.request().input("id", sql.Int, req.params.id)
      .query(`
        DELETE FROM tms_tasks
        OUTPUT DELETED.id, DELETED.title, DELETED.project_id
        WHERE id = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "Task not found" });
    }

    const { title: deletedTitle, project_id: deletedProjectId } =
      result.recordset[0];
    if (deletedProjectId) {
      await recalcProjectProgress(pool, deletedProjectId);
    }

    // taskId/projectId are intentionally omitted here — both FK columns
    // on tms_notifications reference rows that either no longer exist
    // (the task) or aren't guaranteed still relevant, so the task name
    // is embedded directly in the message instead.
    await logActivity({
      userId: req.user.id,
      type: "task_deleted",
      title: "Task deleted",
      message: `You deleted "${deletedTitle}".`,
    });

    res.json({ message: "Task deleted" });
  } catch (err) {
    next(err);
  }
}

async function getCompletionStats(req, res, next) {
  try {
    const range = req.query.range || "7d";
    const days = parseInt(range) || 7;

    const pool = await getPool();
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
    projectName: row.projectName || null,
    projectColor: row.projectColor || null,
    pinned: row.pinned,
    color: row.color || null,
    zoomLink: row.zoom_link,
    githubLink: row.github_link,
    completedBy: row.completed_by,
    completedByName: row.completedByName || null,
    completedAt: row.completed_at || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

module.exports = {
  getAllTasks,
  getTaskById,
  getCompletedLog,
  createTask,
  updateTask,
  deleteTask,
  getCompletionStats,
};
