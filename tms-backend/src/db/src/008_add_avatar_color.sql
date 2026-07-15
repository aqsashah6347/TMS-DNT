-- Adds avatar_color so users can pick their own profile-icon color from
-- Settings/ProfileMenu, and it's persisted + shown for that user everywhere
-- (header, team members, project members, etc). Safe to run multiple times.
IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('tms_users') AND name = 'avatar_color'
)
BEGIN
    ALTER TABLE tms_users ADD avatar_color NVARCHAR(20) NULL;
END
GO