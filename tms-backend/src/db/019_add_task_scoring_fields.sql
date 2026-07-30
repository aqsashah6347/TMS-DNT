-- Adds the fields the Performance Calculation Engine needs directly on
-- tms_tasks, instead of deriving them from priority/due-date proxies.
ALTER TABLE tms_tasks ADD
    difficulty_level INT           NULL,  -- 1=Low, 2=Medium, 3=High, 4=Critical — set when task is created/assigned
    estimated_hours  DECIMAL(6,2)  NULL,  -- manager's expected effort, set at creation
    actual_hours     DECIMAL(6,2)  NULL,  -- hours actually spent, logged on completion
    quality_rating   INT           NULL;  -- 0-100 review score, set on completion
GO