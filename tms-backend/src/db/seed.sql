-- ============================================================
-- Optional starter data so your frontend has something to show
-- right away. Run this AFTER schema.sql.
-- Password for every seeded user below is: Password123
-- (already hashed with bcrypt so login works out of the box)
-- ============================================================

USE Task_Management;
GO

INSERT INTO tms_users (name, email, password_hash, role, status)
VALUES
('Aqsa', 'aqsa@example.com', '$2a$10$CwTycUXWue0Thq9StjUM0uJ8G8mE2wA2xk1G0m6nA3B4rXFjwEXOG', 'admin', 'active'),
('Sara', 'sara@example.com',  '$2a$10$CwTycUXWue0Thq9StjUM0uJ8G8mE2wA2xk1G0m6nA3B4rXFjwEXOG', 'user', 'active'),
('Ali',  'ali@example.com',   '$2a$10$CwTycUXWue0Thq9StjUM0uJ8G8mE2wA2xk1G0m6nA3B4rXFjwEXOG', 'user', 'inactive');
GO

INSERT INTO tms_teams (name, description, created_by)
VALUES ('Frontend Squad', 'Handles all client-facing UI work', 1);
GO

INSERT INTO tms_team_members (team_id, user_id) VALUES (1, 1), (1, 2);
GO

INSERT INTO tms_projects (name, description, team_id, status, progress, created_by)
VALUES ('DreamsPortal CRM', 'Full-stack CRM for lead management', 1, 'active', 65, 1);
GO

INSERT INTO tms_project_members (project_id, user_id) VALUES (1, 1), (1, 2);
GO

INSERT INTO tms_tasks (title, description, priority, status, due_date, assigned_to, assigned_by, project_id, pinned)
VALUES
('Fix login 2FA bug', 'Users report OTP not validating', 'critical', 'in progress', '2026-07-14', 1, 1, 1, 1),
('Review project proposal', '', 'high', 'backlog', '2026-07-15', 2, 1, 1, 0);
GO
