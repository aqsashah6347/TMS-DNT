-- Adds color so taskController.js can persist a per-task color swatch.
-- When a task belongs to a project, the frontend should prefer
-- projectColor (returned by the API) over this value — this column only
-- matters for tasks with no project. Safe to run multiple times.
IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('tms_tasks') AND name = 'color'
)
BEGIN
    ALTER TABLE tms_tasks ADD color NVARCHAR(20) NULL;
END
GO