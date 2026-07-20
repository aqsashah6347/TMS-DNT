-- tms-backend/src/db/011_add_team_chat.sql
-- Adds group chat support for teams: one message thread per team, plus a
-- per-user "last read" marker (used to compute unread counts, same idea
-- as is_read on tms_chat_messages but group chat needs a per-user
-- watermark instead of a single flag). Safe to run multiple times.

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'tms_team_chat_messages')
BEGIN
    CREATE TABLE tms_team_chat_messages (
        id              INT IDENTITY(1,1) PRIMARY KEY,
        team_id         INT             NOT NULL FOREIGN KEY REFERENCES tms_teams(id) ON DELETE CASCADE,
        sender_id       INT             NOT NULL FOREIGN KEY REFERENCES tms_users(id),
        message         NVARCHAR(2000)  NULL,
        attachment_url  NVARCHAR(500)   NULL,
        attachment_name NVARCHAR(255)   NULL,
        attachment_type NVARCHAR(100)   NULL,
        attachment_size INT             NULL,
        created_at      DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME()
    );
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'IX_team_chat_messages_team' AND object_id = OBJECT_ID('tms_team_chat_messages')
)
BEGIN
    CREATE INDEX IX_team_chat_messages_team ON tms_team_chat_messages(team_id, created_at);
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'tms_team_chat_reads')
BEGIN
    CREATE TABLE tms_team_chat_reads (
        team_id         INT             NOT NULL FOREIGN KEY REFERENCES tms_teams(id) ON DELETE CASCADE,
        user_id         INT             NOT NULL FOREIGN KEY REFERENCES tms_users(id),
        last_read_at    DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
        PRIMARY KEY (team_id, user_id)
    );
END
GO