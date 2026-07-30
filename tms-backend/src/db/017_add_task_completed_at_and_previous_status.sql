-- taskController.js sets completed_at and previous_status whenever a task
-- is marked "done" (see updateTask), and reads them back in the Completed
-- Log query and the undo flow — but neither column was ever added to
-- tms_tasks, so that UPDATE has been failing with "Invalid column name"
-- (500) every time someone completes a task. Safe to run multiple times.
IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('tms_tasks') AND name = 'completed_at'
)
BEGIN
    ALTER TABLE tms_tasks ADD completed_at DATETIME2 NULL;
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('tms_tasks') AND name = 'previous_status'
)
BEGIN
    ALTER TABLE tms_tasks ADD previous_status NVARCHAR(20) NULL;
END
GO