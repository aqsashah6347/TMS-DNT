-- tms-backend/src/db/006_create_activities.sql
-- tms_notifications already exists (see schema.sql) but only has
-- message/related_entity/related_id. The Activity Log needs a separate
-- `title`, plus dedicated task_id/project_id columns for navigation
-- instead of the generic related_entity/related_id pair. Safe to run
-- multiple times.

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('tms_notifications') AND name = 'title'
)
BEGIN
    ALTER TABLE tms_notifications ADD title NVARCHAR(200) NULL;
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('tms_notifications') AND name = 'task_id'
)
BEGIN
    ALTER TABLE tms_notifications ADD task_id INT NULL
        CONSTRAINT FK_notifications_task FOREIGN KEY REFERENCES tms_tasks(id);
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('tms_notifications') AND name = 'project_id'
)
BEGIN
    ALTER TABLE tms_notifications ADD project_id INT NULL
        CONSTRAINT FK_notifications_project FOREIGN KEY REFERENCES tms_projects(id);
END
GO

-- Widen `type` slightly — the old column was sized for 'assignment' |
-- 'status' | 'overdue'; the new type strings ('deadline_missed',
-- 'project_assigned') are a bit longer.
IF EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('tms_notifications') AND name = 'type' AND max_length < 60
)
BEGIN
    ALTER TABLE tms_notifications ALTER COLUMN type NVARCHAR(40) NOT NULL;
END
GO

-- Lets the missed-deadline background job check "has this task already
-- been flagged?" without scanning the whole table.
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'IX_notifications_task_type' AND object_id = OBJECT_ID('tms_notifications')
)
BEGIN
    CREATE INDEX IX_notifications_task_type ON tms_notifications(task_id, type);
END
GO