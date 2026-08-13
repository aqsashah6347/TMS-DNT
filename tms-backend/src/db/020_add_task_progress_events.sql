-- One row per progress edit (no upsert/dedup), so the progress bar on
-- Daily Progress can show a permanent mark for every commit with the
-- exact timestamp it happened, distinct from tms_task_progress_log
-- (which only keeps one row per task per day for the 7-day trend chart).
-- Safe to run multiple times.
IF NOT EXISTS (
    SELECT 1 FROM sys.tables WHERE name = 'tms_task_progress_events'
)
BEGIN
    CREATE TABLE tms_task_progress_events (
        id          INT IDENTITY(1,1) PRIMARY KEY,
        task_id     INT NOT NULL FOREIGN KEY REFERENCES tms_tasks(id) ON DELETE CASCADE,
        progress    INT NOT NULL,
        created_at  DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
    CREATE INDEX IX_task_progress_events_task_id ON tms_task_progress_events(task_id, created_at);
END
GO