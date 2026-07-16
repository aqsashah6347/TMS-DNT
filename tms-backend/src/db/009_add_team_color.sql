-- Adds color so teamController.js can persist the swatch picked in
-- TeamModal.jsx (used for the glass-tinted panel on the team card).
-- Safe to run multiple times.
IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('tms_teams') AND name = 'color'
)
BEGIN
    ALTER TABLE tms_teams ADD color NVARCHAR(20) NULL;
END
GO