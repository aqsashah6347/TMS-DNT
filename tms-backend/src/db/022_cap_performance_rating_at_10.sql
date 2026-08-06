-- Tightens tms_performance_ratings.rating from 0-100 down to 0-10.
-- Run this BEFORE the app writes any new ratings above 10 — if you
-- already have real ratings entered on the old 0-100 scale, decide
-- whether to rescale them (rating/10) or clear them first; this script
-- assumes the table is still empty/test data.
ALTER TABLE tms_performance_ratings DROP CONSTRAINT [the_CK_constraint_name];
-- ^ find the actual name first with:
--   SELECT name FROM sys.check_constraints WHERE parent_object_id = OBJECT_ID('tms_performance_ratings');

ALTER TABLE tms_performance_ratings
    ADD CONSTRAINT CK_perf_rating_range CHECK (rating BETWEEN 0 AND 10);
GO