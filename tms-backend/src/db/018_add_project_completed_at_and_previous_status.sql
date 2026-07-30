-- Mirrors 017_add_task_completed_at_and_previous_status.sql, but for
-- projects. projectController.js sets completed_at and previous_status
-- whenever a project's status becomes "completed" (see updateProject),
-- and reads them back for the Completed Projects log + Undo flow.
-- Safe to run multiple times.

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('tms_projects') AND name = 'completed_at'
)
BEGIN
    ALTER TABLE tms_projects ADD completed_at DATETIME2 NULL;
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('tms_projects') AND name = 'previous_status'
)
BEGIN
    ALTER TABLE tms_projects ADD previous_status NVARCHAR(20) NULL;
END
GO