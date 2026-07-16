-- tms-backend/src/db/009_add_activity_changes.sql
-- Lets a single "task_edited" activity carry the full list of fields
-- that changed (due date, assignment, priority, status, ...) as JSON,
-- instead of logging one separate activity row per field. The Activity
-- page renders this as an expandable "See what changed" section under
-- the single "Edited by <user>" card. Safe to run multiple times.

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('tms_notifications') AND name = 'changes'
)
BEGIN
    ALTER TABLE tms_notifications ADD changes NVARCHAR(MAX) NULL;
END
GO