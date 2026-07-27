-- Adds a manually-editable 0-100 progress value per task, shown in the
-- Task View modal's progress bar/pie chart. Distinct from
-- tms_projects.progress, which is auto-recalculated from task statuses —
-- this one is a plain user-entered number with no derived logic.
-- Safe to run multiple times.
IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('tms_tasks') AND name = 'progress'
)
BEGIN
    ALTER TABLE tms_tasks ADD progress INT NOT NULL DEFAULT 0;
END
GO