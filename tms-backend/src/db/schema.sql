-- ============================================================
-- TMS Database Schema (SQL Server)
-- Run this ONCE against an empty database called Task_Management;
-- In SSMS: open this file, make sure the connection points to
-- your server, then click Execute (or press F5).
-- ============================================================

IF DB_ID('Task_Management;') IS NULL
BEGIN
    CREATE DATABASE Task_Management;
END
GO

USE Task_Management;
GO

-- ---------- USERS ----------
-- Every person who can log in: admins, managers, regular members.
CREATE TABLE tms_users (
    id              INT IDENTITY(1,1) PRIMARY KEY,
    name            NVARCHAR(100)   NOT NULL,
    email           NVARCHAR(255)   NOT NULL UNIQUE,
    password_hash   NVARCHAR(255)   NOT NULL,
    role            NVARCHAR(20)    NOT NULL DEFAULT 'user',   -- 'admin' | 'manager' | 'user'
    status          NVARCHAR(20)    NOT NULL DEFAULT 'active', -- 'active' | 'inactive'
    two_factor_enabled BIT         NOT NULL DEFAULT 0,
    avatar_url      NVARCHAR(500)   NULL,
    created_at      DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

-- One-time passcodes issued during the login -> verify-otp flow.
-- A row here is created right after a correct email/password check.
CREATE TABLE tms_otp_codes (
    id              INT IDENTITY(1,1) PRIMARY KEY,
    user_id         INT             NOT NULL FOREIGN KEY REFERENCES tms_users(id),
    temp_token      NVARCHAR(500)   NOT NULL,
    otp_code        NVARCHAR(10)    NOT NULL,
    expires_at      DATETIME2       NOT NULL,
    used            BIT             NOT NULL DEFAULT 0,
    created_at      DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

-- ---------- TEAMS ----------
CREATE TABLE tms_teams (
    id              INT IDENTITY(1,1) PRIMARY KEY,
    name            NVARCHAR(150)   NOT NULL,
    description     NVARCHAR(1000)  NULL,
    created_by      INT             NULL FOREIGN KEY REFERENCES tms_users(id),
    created_at      DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

CREATE TABLE tms_team_members (
    team_id         INT NOT NULL FOREIGN KEY REFERENCES tms_teams(id) ON DELETE CASCADE,
    user_id         INT NOT NULL FOREIGN KEY REFERENCES tms_users(id),
    PRIMARY KEY (team_id, user_id)
);
GO

-- ---------- PROJECTS ----------
CREATE TABLE tms_projects (
    id              INT IDENTITY(1,1) PRIMARY KEY,
    name            NVARCHAR(150)   NOT NULL,
    description     NVARCHAR(1000)  NULL,
    team_id         INT             NULL FOREIGN KEY REFERENCES tms_teams(id),
    status          NVARCHAR(20)    NOT NULL DEFAULT 'planning', -- 'planning' | 'active' | 'completed'
    progress        INT             NOT NULL DEFAULT 0,          -- 0-100, recalculated from tasks
    created_by      INT             NULL FOREIGN KEY REFERENCES tms_users(id),
    created_at      DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

CREATE TABLE tms_project_members (
    project_id      INT NOT NULL FOREIGN KEY REFERENCES tms_projects(id) ON DELETE CASCADE,
    user_id         INT NOT NULL FOREIGN KEY REFERENCES tms_users(id),
    PRIMARY KEY (project_id, user_id)
);
GO

-- ---------- TASKS ----------
CREATE TABLE tms_tasks (
    id              INT IDENTITY(1,1) PRIMARY KEY,
    title           NVARCHAR(255)   NOT NULL,
    description     NVARCHAR(MAX)   NULL,
    priority        NVARCHAR(20)    NOT NULL DEFAULT 'medium', -- 'low'|'medium'|'high'|'critical'
    status          NVARCHAR(20)    NOT NULL DEFAULT 'backlog', -- 'backlog'|'in progress'|'review'|'done'
    due_date        DATE            NULL,
    assigned_to     INT             NULL FOREIGN KEY REFERENCES tms_users(id),
    assigned_by     INT             NULL FOREIGN KEY REFERENCES tms_users(id),
    project_id      INT             NULL FOREIGN KEY REFERENCES tms_projects(id),
    pinned          BIT             NOT NULL DEFAULT 0,
    zoom_link       NVARCHAR(500)   NULL,
    github_link     NVARCHAR(500)   NULL,
    completed_by    INT             NULL FOREIGN KEY REFERENCES tms_users(id),
    deleted_at      DATETIME2       NULL,   -- soft delete: NULL = not deleted
    created_at      DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at      DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

-- ---------- NOTIFICATIONS ----------
CREATE TABLE tms_notifications (
    id              INT IDENTITY(1,1) PRIMARY KEY,
    user_id         INT             NOT NULL FOREIGN KEY REFERENCES tms_users(id),
    type            NVARCHAR(30)    NOT NULL, -- 'assignment' | 'status' | 'overdue' | ...
    message         NVARCHAR(500)   NOT NULL,
    related_entity  NVARCHAR(30)    NULL,     -- 'task' | 'project' | 'team'
    related_id      INT             NULL,
    is_read         BIT             NOT NULL DEFAULT 0,
    created_at      DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

-- ---------- ACCESS CONTROL ----------
CREATE TABLE tms_permissions (
    user_id         INT             NOT NULL FOREIGN KEY REFERENCES tms_users(id),
    module          NVARCHAR(30)    NOT NULL,  -- 'tasks' | 'projects' | 'teams' | 'admin' | 'analytics'
    actions         NVARCHAR(200)   NOT NULL,  -- comma-separated: 'view,create,edit'
    PRIMARY KEY (user_id, module)
);
GO

CREATE TABLE tms_audit_log (
    id              INT IDENTITY(1,1) PRIMARY KEY,
    actor_id        INT             NULL FOREIGN KEY REFERENCES tms_users(id),
    action          NVARCHAR(500)   NOT NULL,
    created_at      DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

-- Helpful indexes for the queries the frontend will make a lot
CREATE INDEX IX_tasks_project ON tms_tasks(project_id);
CREATE INDEX IX_tasks_assigned_to ON tms_tasks(assigned_to);
CREATE INDEX IX_tasks_deleted_at ON tms_tasks(deleted_at);
CREATE INDEX IX_notifications_user ON tms_notifications(user_id, is_read);
GO
