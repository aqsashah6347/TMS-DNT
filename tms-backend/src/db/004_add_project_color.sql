-- Adds color so projectController.js can persist the swatch picked in
-- ProjectModal.jsx (previously only lived in frontend mock data). Safe to
-- run multiple times.
IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('tms_projects') AND name = 'color'
)
BEGIN
    ALTER TABLE tms_projects ADD color NVARCHAR(20) NULL;
END
GO