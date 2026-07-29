-- Adds real contact info for notifications (separate from the login
-- `email`, which is a fake @dnt.local address for HRM-synced users),
-- plus a log so the cron jobs below don't re-send the same reminder
-- every time they tick.
-- Safe to run multiple times.

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('tms_users') AND name = 'phone'
)
BEGIN
    ALTER TABLE tms_users ADD phone NVARCHAR(20) NULL;
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('tms_users') AND name = 'contact_email'
)
BEGIN
    ALTER TABLE tms_users ADD contact_email NVARCHAR(255) NULL;
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.tables WHERE name = 'tms_notification_log'
)
BEGIN
    CREATE TABLE tms_notification_log (
        id              INT IDENTITY(1,1) PRIMARY KEY,
        user_id         INT             NOT NULL FOREIGN KEY REFERENCES tms_users(id),
        task_id         INT             NULL,
        type            NVARCHAR(30)    NOT NULL, -- 'task_assigned' | 'deadline_24h' | 'progress_reminder'
        channel         NVARCHAR(20)    NOT NULL, -- 'email' | 'whatsapp'
        log_date        DATE            NOT NULL DEFAULT CAST(GETDATE() AS DATE),
        status          NVARCHAR(20)    NOT NULL DEFAULT 'sent', -- 'sent' | 'skipped' | 'failed'
        created_at      DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME()
    );
    CREATE INDEX IX_notification_log_lookup
        ON tms_notification_log (user_id, task_id, type, channel, log_date);
END
GO