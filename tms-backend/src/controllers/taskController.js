// tms-backend/src/controllers/taskController.js — replace the ENTIRE file with this
const { sql, getPool } = require("../config/db");
const { hasPermission } = require("../middleware/permissions");
const { logActivity } = require("../services/activityService");
const {
  sendTaskAssignedNotification,
} = require("../services/notificationService");
const JOIN_QUERY = `
  SELECT t.*, u1.name AS assignedToName, u2.name AS assignedByName, u3.name AS completedByName,
         p.color AS projectColor, p.name AS projectName
  FROM tms_tasks t
  LEFT JOIN tms_users u1 ON t.assigned_to = u1.id
  LEFT JOIN tms_users u2 ON t.assigned_by = u2.id
  LEFT JOIN tms_users u3 ON t.completed_by = u3.id
  LEFT JOIN tms_projects p ON t.project_id = p.id
`;

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

function formatShortDate(date) {
  if (!date) return "—";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function titleCase(value) {
  if (!value) return "—";
  return value.replace(/\b\w/g, (c) => c.toUpperCase());
}

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

async function getAllTasks(req, res, next) {
  try {
    const { priority, assignedTo, search, status, projectId } = req.query;
    // excludeCompleted: drop 'done' tasks from BOTH the data query and the
    // count query below, so the List page's pagination total matches what's
    // actually shown once completed tasks move to the Completed Log.
    const excludeCompleted = req.query.excludeCompleted === "true";
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 25;
    const offset = (page - 1) * pageSize;

    const pool = await getPool();
    const request = pool.request();

    const conditions = ["t.deleted_at IS NULL"];

    if (priority) {
      request.input("priority", priority);
      conditions.push("t.priority = @priority");
    }
    if (assignedTo) {
      request.input("assignedTo", sql.Int, assignedTo);
      conditions.push("t.assigned_to = @assignedTo");
    }
    if (projectId) {
      request.input("projectId", sql.Int, projectId);
      conditions.push("t.project_id = @projectId");
    }
    if (status) {
      request.input("status", status);
      conditions.push("t.status = @status");
    } else if (excludeCompleted) {
      conditions.push("t.status <> 'done'");
    }
    if (search) {
      request.input("search", `%${search}%`);
      conditions.push("(t.title LIKE @search OR t.description LIKE @search)");
    }

    if (req.user.role === "user") {
      conditions.push(
        "(t.assigned_to = @currentUserId OR t.assigned_by = @currentUserId)",
      );
      request.input("currentUserId", sql.Int, req.user.id);
    } else if (req.user.role === "manager") {
      conditions.push(`(
        t.assigned_to = @currentUserId
        OR t.assigned_by = @currentUserId
        OR t.assigned_to IN (
          SELECT id FROM tms_users WHERE team_id IN (
            SELECT id FROM tms_teams WHERE manager_id = @currentUserId
          )
        )
      )`);
      request.input("currentUserId", sql.Int, req.user.id);
    }

    const whereClause = conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

    const countResult = await pool
      .request()
      .query(
        request.parameters
          ? Object.keys(request.parameters).reduce(
              (r, key) => r,
              pool.request(),
            )
          : pool.request(),
      )
      .catch(() => null);

    // Rebuild a fresh request bound with the same params for the count
    // query, since the request object above is single-use once .query()
    // has been called against it.
    const countRequest = pool.request();
    if (priority) countRequest.input("priority", priority);
    if (assignedTo) countRequest.input("assignedTo", sql.Int, assignedTo);
    if (projectId) countRequest.input("projectId", sql.Int, projectId);
    if (status) countRequest.input("status", status);
    if (search) countRequest.input("search", `%${search}%`);
    if (req.user.role === "user" || req.user.role === "manager") {
      countRequest.input("currentUserId", sql.Int, req.user.id);
    }
    const totalResult = await countRequest.query(
      `SELECT COUNT(*) AS total FROM tms_tasks t ${whereClause}`,
    );
    const total = totalResult.recordset[0].total;

    request.input("offset", sql.Int, offset);
    request.input("pageSize", sql.Int, pageSize);

    const result = await request.query(`
      ${JOIN_QUERY}
      ${whereClause}
      ORDER BY t.pinned DESC, t.created_at DESC
      OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY
    `);

    res.json({
      tasks: result.recordset.map(mapTask),
      page,
      pageSize,
      total,
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
    res.json(task);
  } catch (err) {
    next(err);
  }
}

async function getCompletedLog(req, res, next) {
  try {
    const pool = await getPool();
    const request = pool.request();
    const conditions = ["t.deleted_at IS NULL", "t.status = 'done'"];

    if (req.user.role === "user") {
      conditions.push(
        "(t.assigned_to = @currentUserId OR t.assigned_by = @currentUserId)",
      );
      request.input("currentUserId", sql.Int, req.user.id);
    } else if (req.user.role === "manager") {
      conditions.push(`(
        t.assigned_to = @currentUserId
        OR t.assigned_by = @currentUserId
        OR t.assigned_to IN (
          SELECT id FROM tms_users WHERE team_id IN (
            SELECT id FROM tms_teams WHERE manager_id = @currentUserId
          )
        )
      )`);
      request.input("currentUserId", sql.Int, req.user.id);
    }

    const result = await request.query(`
      ${JOIN_QUERY}
      WHERE ${conditions.join(" AND ")}
      ORDER BY t.completed_at DESC
    `);

    res.json(result.recordset.map(mapTask));
  } catch (err) {
    next(err);
  }
}

async function createTask(req, res, next) {
  try {
    const body = req.body;
    const pool = await getPool();

    const request = pool
      .request()
      .input("title", body.title)
      .input("description", body.description || null)
      .input("priority", body.priority || "medium")
      .input("status", body.status || "backlog")
      .input("dueDate", sql.Date, body.dueDate || null)
      .input(
        "assignedTo",
        body.assignedTo ? sql.Int : sql.Int,
        body.assignedTo || null,
      )
      .input("assignedBy", sql.Int, req.user.id)
      .input(
        "projectId",
        body.projectId ? sql.Int : sql.Int,
        body.projectId || null,
      )
      .input("pinned", body.pinned || false)
      .input("color", body.color || null)
      .input("zoomLink", body.zoomLink || null)
      .input("githubLink", body.githubLink || null)
      .input("progress", sql.Int, body.progress || 0)
      .input("difficultyLevel", body.difficultyLevel || null)
      .input("estimatedHours", body.estimatedHours || null);

    const result = await request.query(`
      INSERT INTO tms_tasks (
        title, description, priority, status, due_date, assigned_to, assigned_by,
        project_id, pinned, color, zoom_link, github_link, progress,
        difficulty_level, estimated_hours, created_at, updated_at
      )
      OUTPUT INSERTED.id
      VALUES (
        @title, @description, @priority, @status, @dueDate, @assignedTo, @assignedBy,
        @projectId, @pinned, @color, @zoomLink, @githubLink, @progress,
        @difficultyLevel, @estimatedHours, SYSUTCDATETIME(), SYSUTCDATETIME()
      )
    `);

    const task = await fetchTaskWithJoins(pool, result.recordset[0].id);

    if (task.projectId) {
      await recalcProjectProgress(pool, task.projectId);
    }

    if (task.assignedTo && task.assignedTo !== req.user.id) {
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
      await sendTaskAssignedNotification({
        task,
        assignedByName: req.user.name,
      });
    }

    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
}

const USER_EDITABLE_FIELDS = [
  "status",
  "progress",
  "completedBy",
  "completedAt",
  "previousStatus",
  "actualHours",
  "qualityRating",
];

async function updateTask(req, res, next) {
  try {
    const id = req.params.id;
    const updates = req.body;
    const pool = await getPool();

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

    if (updates.status === "done" && previousStatus !== "done") {
      updates.completedBy = updates.completedBy || previousAssignedTo || null;
      updates.completedAt = new Date();
      // Remember what the status was right before completion so the
      // Completed Log's Undo button can restore it exactly.
      updates.previousStatus = previousStatus || "backlog";
    }

    // Undo: moving a task off "done" clears the stashed previous_status
    // so a future completion doesn't resurrect a stale value.
    if (
      updates.status !== undefined &&
      updates.status !== "done" &&
      previousStatus === "done"
    ) {
      updates.previousStatus = null;
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
      progress: "progress",
      previousStatus: "previous_status",
      difficultyLevel: "difficulty_level",
      estimatedHours: "estimated_hours",
      actualHours: "actual_hours",
      qualityRating: "quality_rating",
    };

    const request = pool.request().input("id", sql.Int, id);
    const setClauses = [];

    for (const [key, column] of Object.entries(fieldMap)) {
      if (updates[key] !== undefined) {
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

    if (updates.progress !== undefined) {
      await pool
        .request()
        .input("taskId", sql.Int, id)
        .input("progress", sql.Int, task.progress).query(`
          MERGE tms_task_progress_log AS target
          USING (SELECT @taskId AS task_id, CAST(SYSUTCDATETIME() AS DATE) AS log_date) AS src
          ON target.task_id = src.task_id AND target.log_date = src.log_date
          WHEN MATCHED THEN
            UPDATE SET progress = @progress
          WHEN NOT MATCHED THEN
            INSERT (task_id, log_date, progress) VALUES (@taskId, src.log_date, @progress);
        `);

      // Separate, never-deduped log — one row per commit — so the
      // Daily Progress bar can show a permanent mark for every edit.
      await pool
        .request()
        .input("taskId", sql.Int, id)
        .input("progress", sql.Int, task.progress).query(`
          INSERT INTO tms_task_progress_events (task_id, progress)
          VALUES (@taskId, @progress);
        `);
    }

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
      await sendTaskAssignedNotification({
        task,
        assignedByName: req.user.name,
      });
    }

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
    const id = req.params.id;
    const pool = await getPool();

    const before = await pool
      .request()
      .input("id", sql.Int, id)
      .query(
        "SELECT project_id FROM tms_tasks WHERE id = @id AND deleted_at IS NULL",
      );
    const projectId = before.recordset[0]?.project_id ?? null;

    // Hard delete — null out any notification references first to avoid
    // the FK constraint violation, then remove the row entirely.
    await pool
      .request()
      .input("id", sql.Int, id)
      .query("UPDATE tms_notifications SET task_id = NULL WHERE task_id = @id");

    await pool
      .request()
      .input("id", sql.Int, id)
      .query("DELETE FROM tms_tasks WHERE id = @id");

    if (projectId) {
      await recalcProjectProgress(pool, projectId);
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
    previousStatus: row.previous_status || null,
    progress: row.progress ?? 0,
    difficultyLevel: row.difficulty_level ?? null,
    estimatedHours: row.estimated_hours ?? null,
    actualHours: row.actual_hours ?? null,
    qualityRating: row.quality_rating ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
async function getTaskProgressHistory(req, res, next) {
  try {
    const taskId = req.params.id;
    const days = parseInt(req.query.days) || 30;
    const pool = await getPool();

    const endDate = new Date();
    const startDate = new Date();
    startDate.setUTCDate(startDate.getUTCDate() - (days - 1));
    const totalDays = days;

    const logResult = await pool
      .request()
      .input("taskId", sql.Int, taskId)
      .input("start", sql.Date, startDate)
      .input("end", sql.Date, endDate).query(`
        SELECT log_date, progress
        FROM tms_task_progress_log
        WHERE task_id = @taskId AND log_date BETWEEN @start AND @end
        ORDER BY log_date ASC
      `);

    const logMap = {};
    logResult.recordset.forEach((r) => {
      logMap[new Date(r.log_date).toISOString().split("T")[0]] = r.progress;
    });

    let carry = 0;
    const days2 = [];
    for (let i = 0; i < totalDays; i++) {
      const d = new Date(startDate);
      d.setUTCDate(d.getUTCDate() + i);
      const key = d.toISOString().split("T")[0];
      const cumulative = logMap[key] !== undefined ? logMap[key] : carry;
      const added = Math.max(0, cumulative - carry);
      carry = cumulative;
      days2.push({
        day: String(d.getUTCDate()),
        date: key,
        progress: added,
      });
    }

    res.json(days2);
  } catch (err) {
    next(err);
  }
}

// Every individual progress commit for a task, oldest first — unlike
// getTaskProgressHistory (which is bucketed to one value per day for the
// trend chart), this is one row per edit so the Daily Progress bar can
// place a permanent mark at the exact time each change was made.
async function getTaskProgressMarks(req, res, next) {
  try {
    const taskId = req.params.id;
    const pool = await getPool();

    const result = await pool.request().input("taskId", sql.Int, taskId).query(`
        SELECT progress, created_at AS createdAt
        FROM tms_task_progress_events
        WHERE task_id = @taskId
        ORDER BY created_at ASC
      `);

    res.json(
      result.recordset.map((r) => ({
        progress: r.progress,
        createdAt: r.createdAt,
      })),
    );
  } catch (err) {
    next(err);
  }
}

// The current user's tasks needing a daily progress update: every
// non-done task assigned to them, plus anything they finished off today
// (a completion still counts as touching the task today). Each row is
// flagged with whether a tms_task_progress_log row exists for today —
// the same table the progress-reminder cron reads from — so the Daily
// Progress page and the reminder cron agree on what "updated today"
// means instead of the page guessing from updated_at.
async function getDailyProgress(req, res, next) {
  try {
    const pool = await getPool();
    const result = await pool.request().input("userId", sql.Int, req.user.id)
      .query(`
        SELECT t.*, u1.name AS assignedToName, u2.name AS assignedByName, u3.name AS completedByName,
               p.color AS projectColor, p.name AS projectName,
               pl.task_id AS progressLoggedTaskId
        FROM tms_tasks t
        LEFT JOIN tms_users u1 ON t.assigned_to = u1.id
        LEFT JOIN tms_users u2 ON t.assigned_by = u2.id
        LEFT JOIN tms_users u3 ON t.completed_by = u3.id
        LEFT JOIN tms_projects p ON t.project_id = p.id
        LEFT JOIN tms_task_progress_log pl
          ON pl.task_id = t.id AND pl.log_date = CAST(SYSUTCDATETIME() AS DATE)
        WHERE t.deleted_at IS NULL
          AND t.assigned_to = @userId
          AND (
            t.status <> 'done'
            OR CAST(t.completed_at AS DATE) = CAST(SYSUTCDATETIME() AS DATE)
          )
        ORDER BY t.created_at DESC
      `);

    const tasks = result.recordset.map((row) => ({
      ...mapTask(row),
      updatedToday: row.progressLoggedTaskId != null,
    }));

    res.json(tasks);
  } catch (err) {
    next(err);
  }
}
// Per-day activity count for the requested calendar month (defaults to the
// current month), scoped to the current user's own tasks — this is what
// feeds the Daily Progress heatmap. "Activity" is counted as the number of
// distinct tasks that got a tms_task_progress_log row that day, i.e. how
// many tasks the user touched, not a raw progress percentage (a task
// going 40% -> 45% and another going 0% -> 100% both count as 1 update).
async function getProgressHeatmap(req, res, next) {
  try {
    const pool = await getPool();

    const now = new Date();
    let year = now.getUTCFullYear();
    let month = now.getUTCMonth(); // 0-indexed

    const monthParam = req.query.month; // expected "YYYY-MM"
    if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
      const [y, m] = monthParam.split("-").map(Number);
      if (y && m >= 1 && m <= 12) {
        year = y;
        month = m - 1;
      }
    }

    const startDate = new Date(Date.UTC(year, month, 1));
    const endDate = new Date(Date.UTC(year, month + 1, 0)); // last day of month

    const result = await pool
      .request()
      .input("userId", sql.Int, req.user.id)
      .input("start", sql.Date, startDate)
      .input("end", sql.Date, endDate).query(`
        SELECT
          CAST(pl.log_date AS DATE) AS logDate,
          COUNT(DISTINCT pl.task_id) AS tasksUpdated
        FROM tms_task_progress_log pl
        INNER JOIN tms_tasks t ON t.id = pl.task_id
        WHERE t.assigned_to = @userId
          AND pl.log_date BETWEEN @start AND @end
        GROUP BY CAST(pl.log_date AS DATE)
        ORDER BY logDate ASC
      `);

    const days = result.recordset.map((row) => ({
      date: new Date(row.logDate).toISOString().split("T")[0],
      count: row.tasksUpdated,
    }));

    res.json({ year, month: month + 1, days });
  } catch (err) {
    next(err);
  }
}
module.exports = {
  getAllTasks,
  getTaskById,
  getCompletedLog,
  createTask,
  updateTask,
  deleteTask,
  getCompletionStats,
  getTaskProgressHistory,
  getTaskProgressMarks,
  getDailyProgress,
  getProgressHeatmap,
};
