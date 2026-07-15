-- tms-backend/src/db/007_add_chat_attachments.sql
-- Adds file-attachment support to tms_chat_messages. Safe to run multiple times.

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('tms_chat_messages') AND name = 'attachment_url')
BEGIN
    ALTER TABLE tms_chat_messages ADD attachment_url NVARCHAR(500) NULL;
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('tms_chat_messages') AND name = 'attachment_name')
BEGIN
    ALTER TABLE tms_chat_messages ADD attachment_name NVARCHAR(255) NULL;
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('tms_chat_messages') AND name = 'attachment_type')
BEGIN
    ALTER TABLE tms_chat_messages ADD attachment_type NVARCHAR(100) NULL;
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('tms_chat_messages') AND name = 'attachment_size')
BEGIN
    ALTER TABLE tms_chat_messages ADD attachment_size INT NULL;
END
GO

-- `message` was NOT NULL — an attachment-only message has no text, so
-- this needs to allow NULL now. Existing rows are untouched.
IF EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('tms_chat_messages') AND name = 'message' AND is_nullable = 0
)
BEGIN
    ALTER TABLE tms_chat_messages ALTER COLUMN message NVARCHAR(2000) NULL;
END
GO