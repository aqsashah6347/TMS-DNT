-- One row per task per day it was updated, so the Task View modal can
-- chart a 7-day progress trend starting from the task's creation date.
-- Upserted (not inserted) on every progress edit, so editing progress
-- twice in one day updates that day's row instead of duplicating it.
-- Safe to run multiple times.
IF NOT EXISTS (
    SELECT 1 FROM sys.tables WHERE name = 'tms_task_progress_log'
)
BEGIN
    CREATE TABLE tms_task_progress_log (
        id          INT IDENTITY(1,1) PRIMARY KEY,
        task_id     INT NOT NULL FOREIGN KEY REFERENCES tms_tasks(id) ON DELETE CASCADE,
        log_date    DATE NOT NULL,
        progress    INT NOT NULL,
        created_at  DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT UQ_task_progress_log_task_date UNIQUE (task_id, log_date)
    );
END
GO