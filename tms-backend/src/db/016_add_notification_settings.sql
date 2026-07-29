-- tms-backend/src/db/016_add_notification_settings.sql
-- Admin-editable email/WhatsApp templates (with an on/off switch per
-- type+channel) plus richer logging (who + what was actually sent).
-- Safe to run multiple times.

IF NOT EXISTS (
    SELECT 1 FROM sys.tables WHERE name = 'tms_notification_settings'
)
BEGIN
    CREATE TABLE tms_notification_settings (
        id                INT IDENTITY(1,1) PRIMARY KEY,
        type              NVARCHAR(30)  NOT NULL, -- 'task_assigned' | 'deadline_24h' | 'progress_reminder'
        channel           NVARCHAR(20)  NOT NULL, -- 'email' | 'whatsapp'
        enabled           BIT           NOT NULL DEFAULT 1,
        subject_template  NVARCHAR(255) NULL,     -- email only
        body_template     NVARCHAR(MAX) NOT NULL,
        updated_by        INT           NULL FOREIGN KEY REFERENCES tms_users(id),
        updated_at        DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT UQ_notification_settings_type_channel UNIQUE (type, channel)
    );
END
GO

-- Richer log columns — what address/number it went to, and a preview of
-- the actual rendered content (subject for email, message for WhatsApp).
IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('tms_notification_log') AND name = 'recipient'
)
BEGIN
    ALTER TABLE tms_notification_log ADD recipient NVARCHAR(255) NULL;
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('tms_notification_log') AND name = 'message_preview'
)
BEGIN
    ALTER TABLE tms_notification_log ADD message_preview NVARCHAR(500) NULL;
END
GO

-- ---------- Seed defaults (only inserted if missing) ----------

IF NOT EXISTS (SELECT 1 FROM tms_notification_settings WHERE type = 'task_assigned' AND channel = 'email')
INSERT INTO tms_notification_settings (type, channel, enabled, subject_template, body_template)
VALUES (
    'task_assigned', 'email', 1,
    N'New task assigned: "{{taskTitle}}"',
    N'<div style="font-family:Arial,sans-serif;font-size:14px;color:#1f2937;line-height:1.6;">
  <p>Hi {{userName}},</p>
  <p><strong>{{assignedBy}}</strong> assigned you a new task:</p>
  <table style="border-collapse:collapse;margin:16px 0;">
    <tr><td style="padding:4px 12px 4px 0;color:#6b7280;">Task</td><td style="padding:4px 0;"><strong>{{taskTitle}}</strong></td></tr>
    <tr><td style="padding:4px 12px 4px 0;color:#6b7280;">Project</td><td style="padding:4px 0;">{{projectName}}</td></tr>
    <tr><td style="padding:4px 12px 4px 0;color:#6b7280;">Priority</td><td style="padding:4px 0;">{{priority}}</td></tr>
    <tr><td style="padding:4px 12px 4px 0;color:#6b7280;">Due date</td><td style="padding:4px 0;">{{dueDate}}</td></tr>
  </table>
  <p><a href="{{taskLink}}" style="background:#4f46e5;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;display:inline-block;">Open task</a></p>
</div>'
);
GO

IF NOT EXISTS (SELECT 1 FROM tms_notification_settings WHERE type = 'task_assigned' AND channel = 'whatsapp')
INSERT INTO tms_notification_settings (type, channel, enabled, subject_template, body_template)
VALUES (
    'task_assigned', 'whatsapp', 1, NULL,
    N'📌 New task assigned: "{{taskTitle}}"
Project: {{projectName}}
Priority: {{priority}}
Due: {{dueDate}}
Assigned by: {{assignedBy}}

Open it: {{taskLink}}'
);
GO

IF NOT EXISTS (SELECT 1 FROM tms_notification_settings WHERE type = 'deadline_24h' AND channel = 'email')
INSERT INTO tms_notification_settings (type, channel, enabled, subject_template, body_template)
VALUES (
    'deadline_24h', 'email', 1,
    N'Reminder: "{{taskTitle}}" is due tomorrow',
    N'<div style="font-family:Arial,sans-serif;font-size:14px;color:#1f2937;line-height:1.6;">
  <p>Hi {{userName}},</p>
  <p>Just a heads-up — this task is due <strong>tomorrow</strong>:</p>
  <table style="border-collapse:collapse;margin:16px 0;">
    <tr><td style="padding:4px 12px 4px 0;color:#6b7280;">Task</td><td style="padding:4px 0;"><strong>{{taskTitle}}</strong></td></tr>
    <tr><td style="padding:4px 12px 4px 0;color:#6b7280;">Project</td><td style="padding:4px 0;">{{projectName}}</td></tr>
    <tr><td style="padding:4px 12px 4px 0;color:#6b7280;">Priority</td><td style="padding:4px 0;">{{priority}}</td></tr>
    <tr><td style="padding:4px 12px 4px 0;color:#6b7280;">Due date</td><td style="padding:4px 0;">{{dueDate}}</td></tr>
  </table>
  <p><a href="{{taskLink}}" style="background:#f59e0b;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;display:inline-block;">Open task</a></p>
</div>'
);
GO

IF NOT EXISTS (SELECT 1 FROM tms_notification_settings WHERE type = 'deadline_24h' AND channel = 'whatsapp')
INSERT INTO tms_notification_settings (type, channel, enabled, subject_template, body_template)
VALUES (
    'deadline_24h', 'whatsapp', 1, NULL,
    N'⏰ Reminder: "{{taskTitle}}" is due tomorrow ({{dueDate}})
Project: {{projectName}}
Priority: {{priority}}

Open it: {{taskLink}}'
);
GO

IF NOT EXISTS (SELECT 1 FROM tms_notification_settings WHERE type = 'progress_reminder' AND channel = 'email')
INSERT INTO tms_notification_settings (type, channel, enabled, subject_template, body_template)
VALUES (
    'progress_reminder', 'email', 1,
    N'Don''t forget to update your task progress',
    N'<div style="font-family:Arial,sans-serif;font-size:14px;color:#1f2937;line-height:1.6;">
  <p>Hi {{userName}},</p>
  <p>You have <strong>{{taskCount}}</strong> task(s) where today''s progress hasn''t been logged yet:</p>
  <ul style="padding-left:20px;">{{taskListHtml}}</ul>
  <p><a href="{{taskLink}}" style="background:#4f46e5;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;display:inline-block;">Update my tasks</a></p>
</div>'
);
GO

IF NOT EXISTS (SELECT 1 FROM tms_notification_settings WHERE type = 'progress_reminder' AND channel = 'whatsapp')
INSERT INTO tms_notification_settings (type, channel, enabled, subject_template, body_template)
VALUES (
    'progress_reminder', 'whatsapp', 1, NULL,
    N'📝 You have {{taskCount}} task(s) with no progress update today:
{{taskListText}}

Update them here: {{taskLink}}'
);
GO