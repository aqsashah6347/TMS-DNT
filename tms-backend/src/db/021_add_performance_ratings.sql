-- One current Performance Rating per employee (0-100), set only by that
-- employee's team manager (or an admin) from the Performance page's
-- Teams tab -> Roster section. Re-rating overwrites the existing row —
-- rated_by/rated_at are kept so the roster can show "last rated by / when".
CREATE TABLE tms_performance_ratings (
    id          INT IDENTITY(1,1) PRIMARY KEY,
    employee_id INT NOT NULL UNIQUE,
    team_id     INT NOT NULL,
    rating      INT NOT NULL CHECK (rating BETWEEN 0 AND 100),
    rated_by    INT NOT NULL,
    rated_at    DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_perf_rating_employee FOREIGN KEY (employee_id)
        REFERENCES tms_users(id) ON DELETE CASCADE,
    CONSTRAINT FK_perf_rating_team FOREIGN KEY (team_id)
        REFERENCES tms_teams(id),
    CONSTRAINT FK_perf_rating_rated_by FOREIGN KEY (rated_by)
        REFERENCES tms_users(id)
);
GO