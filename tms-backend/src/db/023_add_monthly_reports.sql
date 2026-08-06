-- One row per team per calendar month: the "monthly report" a manager
-- (or admin) files from the dashboard reminder. status moves
-- pending -> submitted -> released. released rows are locked (see
-- setReportRating in monthlyReportController.js) and are what makes the
-- "Reports announced" banner show up for employees on that team.
CREATE TABLE tms_monthly_reports (
    id            INT IDENTITY(1,1) PRIMARY KEY,
    team_id       INT NOT NULL,
    period_year   INT NOT NULL,
    period_month  INT NOT NULL, -- 1-12
    status        NVARCHAR(20) NOT NULL DEFAULT 'pending',
    submitted_by  INT NULL,
    submitted_at  DATETIME NULL,
    released_at   DATETIME NULL,
    created_at    DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT UQ_monthly_report_team_period UNIQUE (team_id, period_year, period_month),
    CONSTRAINT FK_monthly_report_team FOREIGN KEY (team_id)
        REFERENCES tms_teams(id) ON DELETE CASCADE,
    CONSTRAINT FK_monthly_report_submitted_by FOREIGN KEY (submitted_by)
        REFERENCES tms_users(id),
    CONSTRAINT CK_monthly_report_status CHECK (status IN ('pending','submitted','released'))
);
GO

-- One rating per employee per monthly report — this is the history/audit
-- trail. The same value also gets mirrored into the existing
-- tms_performance_ratings table (the "current rating") at the moment
-- it's entered, so nothing downstream (roster chip, scoring.js) needs
-- to change.
CREATE TABLE tms_monthly_report_ratings (
    id          INT IDENTITY(1,1) PRIMARY KEY,
    report_id   INT NOT NULL,
    employee_id INT NOT NULL,
    rating      INT NOT NULL CHECK (rating BETWEEN 0 AND 10),
    rated_by    INT NOT NULL,
    rated_at    DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT UQ_monthly_report_rating UNIQUE (report_id, employee_id),
    CONSTRAINT FK_mrr_report FOREIGN KEY (report_id)
        REFERENCES tms_monthly_reports(id) ON DELETE CASCADE,
    CONSTRAINT FK_mrr_employee FOREIGN KEY (employee_id)
        REFERENCES tms_users(id),
    CONSTRAINT FK_mrr_rated_by FOREIGN KEY (rated_by)
        REFERENCES tms_users(id)
);
GO