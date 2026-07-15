// tms-backend/src/db/005_add_team_manager_and_user_team.sql
-- Adds manager_id to tms_teams and team_id to tms_users so a team has one
-- clear manager and every user belongs to at most one team (the Teams page
-- "My Team" view needs a single team per user, not the old many-to-many
-- tms_team_members table). Safe to run multiple times.

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('tms_teams') AND name = 'manager_id'
)
BEGIN
    ALTER TABLE tms_teams ADD manager_id INT NULL;
    ALTER TABLE tms_teams ADD CONSTRAINT FK_tms_teams_manager
        FOREIGN KEY (manager_id) REFERENCES tms_users(id);
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('tms_users') AND name = 'team_id'
)
BEGIN
    ALTER TABLE tms_users ADD team_id INT NULL;
    ALTER TABLE tms_users ADD CONSTRAINT FK_tms_users_team
        FOREIGN KEY (team_id) REFERENCES tms_teams(id);
END
GO

-- One-time backfill: if you already created teams/members through the old
-- tms_team_members join table, this copies each user's first membership
-- row into the new tms_users.team_id column. Harmless no-op on a fresh DB
-- where tms_team_members is empty.
UPDATE u
SET u.team_id = tm.team_id
FROM tms_users u
INNER JOIN (
    SELECT user_id, MIN(team_id) AS team_id
    FROM tms_team_members
    GROUP BY user_id
) tm ON tm.user_id = u.id
WHERE u.team_id IS NULL;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'IX_users_team' AND object_id = OBJECT_ID('tms_users')
)
BEGIN
    CREATE INDEX IX_users_team ON tms_users(team_id);
END
GO