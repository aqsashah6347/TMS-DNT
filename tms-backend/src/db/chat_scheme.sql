USE tms_db;
GO

CREATE TABLE tms_chat_messages (
    id              INT IDENTITY(1,1) PRIMARY KEY,
    sender_id       INT             NOT NULL FOREIGN KEY REFERENCES tms_users(id),
    receiver_id     INT             NOT NULL FOREIGN KEY REFERENCES tms_users(id),
    message         NVARCHAR(2000)  NOT NULL,
    is_read         BIT             NOT NULL DEFAULT 0,
    created_at      DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

CREATE INDEX IX_chat_messages_conversation
    ON tms_chat_messages(sender_id, receiver_id, created_at);
CREATE INDEX IX_chat_messages_receiver_unread
    ON tms_chat_messages(receiver_id, is_read);
GO