-- Lets an admin force a single team's CURRENT monthly report to show up
-- on that manager's dashboard reminder even when the normal filing
-- window (utils/monthlyReportWindow.js) is closed — e.g. to let a
-- manager file or backfill outside the 25th-30th window. Toggled from
-- the Performance > Reports overview tab's team modal.
ALTER TABLE tms_monthly_reports
ADD force_visible BIT NOT NULL DEFAULT 0;
GO