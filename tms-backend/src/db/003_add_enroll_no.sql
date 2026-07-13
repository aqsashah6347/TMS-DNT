-- Adds enroll_no so attendanceController.js can match ZK biometric
-- device logs back to a tms_users row. Safe to run multiple times.
IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('tms_users') AND name = 'enroll_no'
)
BEGIN
    ALTER TABLE tms_users ADD enroll_no NVARCHAR(50) NULL;
END
GO

-- Optional but recommended: makes lookups by enroll_no fast and
-- prevents two users from accidentally sharing the same enroll_no.
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'UQ_tms_users_enroll_no' AND object_id = OBJECT_ID('tms_users')
)
BEGIN
    CREATE UNIQUE INDEX UQ_tms_users_enroll_no
    ON tms_users(enroll_no)
    WHERE enroll_no IS NOT NULL;
END
GO