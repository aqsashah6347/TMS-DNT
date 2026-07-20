USE Task_Management;
GO

-- Per-user view state for a 1:1 conversation. One row per (user, other_user)
-- pair — archiving or deleting a chat only changes how the CURRENT user
-- sees it, never the other person's copy or the underlying messages.
--   is_archived  -> hides the chat from the default list, shows under "Archived"
--   cleared_at   -> "delete chat": messages at/before this time are hidden
--                   from this user's view; a new incoming/outgoing message
--                   after this point brings the chat back automatically.
CREATE TABLE tms_chat_conversation_state (
    user_id        INT         NOT NULL FOREIGN KEY REFERENCES tms_users(id),
    other_user_id  INT         NOT NULL FOREIGN KEY REFERENCES tms_users(id),
    is_archived    BIT         NOT NULL DEFAULT 0,
    cleared_at     DATETIME2   NULL,
    CONSTRAINT PK_chat_conversation_state PRIMARY KEY (user_id, other_user_id)
);
GO
