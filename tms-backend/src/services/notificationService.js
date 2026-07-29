// tms-backend/src/services/notificationService.js
const { sql, getPool } = require("../config/db");
const { sendEmail } = require("./emailService");
const { sendWhatsAppMessage } = require("./whatsappService");
const { getSetting, renderTemplate } = require("./notificationSettingsService");

const APP_URL = process.env.FRONTEND_URL || "http://localhost:5173";

async function getUserContact(pool, userId) {
  const result = await pool
    .request()
    .input("userId", sql.Int, userId)
    .query(
      "SELECT id, name, contact_email AS contactEmail, phone FROM tms_users WHERE id = @userId",
    );
  return result.recordset[0] || null;
}

async function getProjectName(pool, projectId) {
  if (!projectId) return null;
  const result = await pool
    .request()
    .input("projectId", sql.Int, projectId)
    .query("SELECT name FROM tms_projects WHERE id = @projectId");
  return result.recordset[0]?.name || null;
}

function formatDate(date) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Used by the two recurring cron jobs (deadline reminder, progress
// reminder) so a job that ticks every 15-60 min doesn't spam the same
// user with the same reminder repeatedly in one day. Assignment
// notifications don't use this — every real (re)assignment should notify.
async function alreadySentToday(pool, { userId, taskId, type, channel }) {
  const request = pool
    .request()
    .input("userId", sql.Int, userId)
    .input("type", sql.NVarChar, type)
    .input("channel", sql.NVarChar, channel);

  let taskClause = "task_id IS NULL";
  if (taskId) {
    request.input("taskId", sql.Int, taskId);
    taskClause = "task_id = @taskId";
  }

  const result = await request.query(`
    SELECT TOP 1 id FROM tms_notification_log
    WHERE user_id = @userId AND type = @type AND channel = @channel
      AND ${taskClause}
      AND log_date = CAST(GETDATE() AS DATE)
  `);
  return result.recordset.length > 0;
}

async function recordSent(
  pool,
  { userId, taskId, type, channel, status, recipient, messagePreview },
) {
  try {
    await pool
      .request()
      .input("userId", sql.Int, userId)
      .input("taskId", sql.Int, taskId || null)
      .input("type", sql.NVarChar, type)
      .input("channel", sql.NVarChar, channel)
      .input("status", sql.NVarChar, status)
      .input("recipient", sql.NVarChar(255), recipient || null)
      .input(
        "messagePreview",
        sql.NVarChar(500),
        messagePreview ? String(messagePreview).slice(0, 500) : null,
      ).query(`
        INSERT INTO tms_notification_log
          (user_id, task_id, type, channel, log_date, status, recipient, message_preview)
        VALUES
          (@userId, @taskId, @type, @channel, CAST(GETDATE() AS DATE), @status, @recipient, @messagePreview)
      `);
  } catch (err) {
    console.error("recordSent failed:", err.message);
  }
}

// Central gate every notification goes through:
//  - looks up the admin-editable setting for this type+channel
//  - skips entirely (no send, no log row) if it's turned off
//  - optionally dedupes so recurring cron jobs don't repeat within a day
//  - renders the admin-editable subject/body template with `vars`
//  - calls `send(subject, body)` and logs what actually went out
async function sendViaChannel(
  pool,
  { type, channel, userId, taskId, recipient, vars, send, dedupe },
) {
  const setting = await getSetting(type, channel);
  if (!setting || !setting.enabled) return;

  if (
    dedupe &&
    (await alreadySentToday(pool, { userId, taskId, type, channel }))
  ) {
    return;
  }

  const subject =
    channel === "email" ? renderTemplate(setting.subject_template, vars) : null;
  const body = renderTemplate(setting.body_template, vars);

  const ok = await send(subject, body);

  await recordSent(pool, {
    userId,
    taskId,
    type,
    channel,
    status: ok ? "sent" : "skipped",
    recipient,
    messagePreview: channel === "email" ? subject : body,
  });
}

// ---------- 1) Task assigned ----------
// Fires immediately whenever a task gets a new assignee (create or reassign).
// Not deduped — every real (re)assignment should notify.

async function sendTaskAssignedNotification({ task, assignedByName }) {
  try {
    const pool = await getPool();
    const user = await getUserContact(pool, task.assignedTo);
    if (!user) return;

    const taskLink = `${APP_URL}/tasks?taskId=${task.id}`;
    const vars = {
      userName: user.name,
      taskTitle: task.title,
      projectName: task.projectName || "—",
      priority: (task.priority || "medium").toUpperCase(),
      dueDate: formatDate(task.dueDate),
      assignedBy: assignedByName || "Someone",
      taskLink,
    };

    await sendViaChannel(pool, {
      type: "task_assigned",
      channel: "email",
      userId: user.id,
      taskId: task.id,
      recipient: user.contactEmail,
      vars,
      send: (subject, body) =>
        sendEmail({ to: user.contactEmail, subject, html: body }),
    });

    await sendViaChannel(pool, {
      type: "task_assigned",
      channel: "whatsapp",
      userId: user.id,
      taskId: task.id,
      recipient: user.phone,
      vars,
      send: (_subject, body) =>
        sendWhatsAppMessage({ to: user.phone, message: body }),
    });
  } catch (err) {
    console.error("sendTaskAssignedNotification failed:", err.message);
  }
}

// ---------- 2) 24h-before-deadline ----------
// `row` here is a raw tms_tasks record (id, title, priority, due_date,
// assigned_to, project_id) as pulled by deadlineReminderChecker.js.

async function sendDeadlineReminderNotification({ task: row }) {
  try {
    const pool = await getPool();
    const user = await getUserContact(pool, row.assigned_to);
    if (!user) return;

    const projectName = await getProjectName(pool, row.project_id);
    const taskLink = `${APP_URL}/tasks?taskId=${row.id}`;
    const vars = {
      userName: user.name,
      taskTitle: row.title,
      projectName: projectName || "—",
      priority: (row.priority || "medium").toUpperCase(),
      dueDate: formatDate(row.due_date),
      taskLink,
    };

    await sendViaChannel(pool, {
      type: "deadline_24h",
      channel: "email",
      userId: user.id,
      taskId: row.id,
      recipient: user.contactEmail,
      vars,
      dedupe: true,
      send: (subject, body) =>
        sendEmail({ to: user.contactEmail, subject, html: body }),
    });

    await sendViaChannel(pool, {
      type: "deadline_24h",
      channel: "whatsapp",
      userId: user.id,
      taskId: row.id,
      recipient: user.phone,
      vars,
      dedupe: true,
      send: (_subject, body) =>
        sendWhatsAppMessage({ to: user.phone, message: body }),
    });
  } catch (err) {
    console.error("sendDeadlineReminderNotification failed:", err.message);
  }
}

// ---------- 3) Forgot to update daily progress ----------
// One digest per user per day, listing every active task with no
// tms_task_progress_log row for today.

async function sendProgressReminderNotification({ userId, tasks }) {
  try {
    const pool = await getPool();
    const user = await getUserContact(pool, userId);
    if (!user || tasks.length === 0) return;

    const taskLink = `${APP_URL}/tasks`;
    const taskListHtml = tasks
      .map(
        (t) =>
          `<li style="margin-bottom:6px;"><strong>${t.title}</strong>${t.due_date ? ` — due ${formatDate(t.due_date)}` : ""}</li>`,
      )
      .join("");
    const taskListText = tasks.map((t) => `• ${t.title}`).join("\n");

    const vars = {
      userName: user.name,
      taskCount: tasks.length,
      taskListHtml,
      taskListText,
      taskLink,
    };

    await sendViaChannel(pool, {
      type: "progress_reminder",
      channel: "email",
      userId: user.id,
      taskId: null,
      recipient: user.contactEmail,
      vars,
      dedupe: true,
      send: (subject, body) =>
        sendEmail({ to: user.contactEmail, subject, html: body }),
    });

    await sendViaChannel(pool, {
      type: "progress_reminder",
      channel: "whatsapp",
      userId: user.id,
      taskId: null,
      recipient: user.phone,
      vars,
      dedupe: true,
      send: (_subject, body) =>
        sendWhatsAppMessage({ to: user.phone, message: body }),
    });
  } catch (err) {
    console.error("sendProgressReminderNotification failed:", err.message);
  }
}

module.exports = {
  sendTaskAssignedNotification,
  sendDeadlineReminderNotification,
  sendProgressReminderNotification,
};
