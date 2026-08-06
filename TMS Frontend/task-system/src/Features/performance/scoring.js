// src/Features/performance/scoring.js
//
// Performance Calculation Engine
// -------------------------------
// FINAL SCORE = Completion×24% + TaskAmount×12% + TimeEfficiency×16%
//             + TaskWeight×20% + Quality×8% + PerformanceRating×20%
//
// tms_tasks doesn't (yet) store an explicit difficulty level, estimated/
// actual hours, or a manager quality rating — so each function below
// derives an honest proxy from what IS tracked (priority, due dates,
// completion dates). The moment a real field shows up on a task
// (task.difficultyLevel, task.estimatedHours, task.actualHours,
// task.qualityRating) these functions use it automatically instead of the
// proxy — no rewiring needed later.
//
// PerformanceRating is the manager-given rating set on the Teams tab ->
// Roster section (tms_performance_ratings.rating), entered and stored on
// a 0-10 scale. It's scaled ×10 internally so it blends correctly with
// every other 0-100 component. If an employee hasn't been rated yet,
// their score is renormalized across the remaining components instead of
// being penalized.

import { daysBetween } from "./utils";

export const PRIORITY_WEIGHT = { low: 1, medium: 2, high: 3, critical: 4 };

function weightOf(task) {
  if (task.difficultyLevel) return Number(task.difficultyLevel);
  return PRIORITY_WEIGHT[task.priority] ?? PRIORITY_WEIGHT.medium;
}

// 1. Completion percentage — completed / assigned
export function achievementScore(tasks) {
  if (!tasks.length) return null;
  const completed = tasks.filter((t) => t.status === "done").length;
  return Math.round((completed / tasks.length) * 100);
}

// 2. Task amount — same completed/assigned ratio as completion percentage,
//    weighted separately per spec (10/20 done = 50%, 25/50 done = 50%, etc.)
export function taskAmountScore(tasks) {
  if (!tasks.length) return null;
  const completed = tasks.filter((t) => t.status === "done").length;
  return Math.round((completed / tasks.length) * 100);
}

// 3. Task weight — weighted points earned / weighted points possible
//    (uses difficultyLevel if set on the task, else falls back to priority)
export function difficultyScore(tasks) {
  if (!tasks.length) return null;
  const possible = tasks.reduce((s, t) => s + weightOf(t), 0);
  if (!possible) return null;
  const earned = tasks
    .filter((t) => t.status === "done")
    .reduce((s, t) => s + weightOf(t), 0);
  return Math.round((earned / possible) * 100);
}

// 4. Time efficiency — expected duration (created→due) vs actual (created→completed)
export function timeEfficiencyScore(tasks) {
  const done = tasks.filter(
    (t) => t.status === "done" && t.completedAt && t.createdAt,
  );
  if (!done.length) return null;
  const ratios = done.map((t) => {
    if (t.estimatedHours && t.actualHours) {
      return Math.min(100, (t.estimatedHours / t.actualHours) * 100);
    }
    const expected = t.dueDate ? daysBetween(t.createdAt, t.dueDate) : null;
    const actual = daysBetween(t.createdAt, t.completedAt);
    if (!expected || expected <= 0 || !actual || actual <= 0) return 100;
    return Math.min(100, (expected / actual) * 100);
  });
  return Math.round(ratios.reduce((a, b) => a + b, 0) / ratios.length);
}

// 5. Quality — manager rating if present, else on-time delivery minus an
//    overdue penalty (rework/error-rate fields aren't tracked yet).
export function qualityScore(tasks) {
  const rated = tasks.filter((t) => t.qualityRating != null);
  if (rated.length) {
    return Math.round(
      rated.reduce((s, t) => s + t.qualityRating, 0) / rated.length,
    );
  }
  const done = tasks.filter((t) => t.status === "done");
  if (!done.length) return null;
  const onTime = done.filter(
    (t) =>
      t.dueDate &&
      t.completedAt &&
      new Date(t.completedAt) <= new Date(t.dueDate),
  ).length;
  const overdueOpen = tasks.filter(
    (t) => t.status !== "done" && t.dueDate && new Date(t.dueDate) < new Date(),
  ).length;
  const onTimeRate = onTime / done.length;
  const overduePenalty = Math.min(0.4, overdueOpen * 0.05);
  return Math.round(Math.max(0, onTimeRate - overduePenalty) * 100);
}

const FINAL_WEIGHTS = {
  achievement: 0.24,
  taskAmount: 0.12,
  difficulty: 0.2,
  timeEfficiency: 0.16,
  quality: 0.08,
  performanceRating: 0.2,
};

export function finalScore({
  achievement,
  taskAmount,
  difficulty,
  timeEfficiency,
  quality,
  performanceRating, // expected on the 0-100 scale here (already scaled)
}) {
  const values = {
    achievement,
    taskAmount,
    difficulty,
    timeEfficiency,
    quality,
    performanceRating,
  };
  let weightedSum = 0;
  let weightTotal = 0;
  for (const key of Object.keys(FINAL_WEIGHTS)) {
    const v = values[key];
    if (v === null || v === undefined) continue;
    weightedSum += v * FINAL_WEIGHTS[key];
    weightTotal += FINAL_WEIGHTS[key];
  }
  if (weightTotal === 0) return 0;
  return Math.round(weightedSum / weightTotal);
}

// performanceRating comes in on the manager-facing 0-10 scale (matches
// the DB CHECK constraint and the roster input). Everything downstream
// (finalScore, gauges, radar) works on 0-100, so it's scaled ×10 here —
// buildScoreBreakdown returns BOTH the raw 0-10 value (for display) and
// the scaled 0-100 value (for the formula/visuals).
export function buildScoreBreakdown(tasks, performanceRating = null) {
  const achievement = achievementScore(tasks);
  const taskAmount = taskAmountScore(tasks);
  const difficulty = difficultyScore(tasks);
  const timeEfficiency = timeEfficiencyScore(tasks);
  const quality = qualityScore(tasks);

  const performanceRatingScore =
    performanceRating != null ? Math.round(performanceRating * 10) : null;

  const hasAnyData = tasks.length > 0 || performanceRatingScore != null;
  const final = hasAnyData
    ? finalScore({
        achievement,
        taskAmount,
        difficulty,
        timeEfficiency,
        quality,
        performanceRating: performanceRatingScore,
      })
    : null;

  return {
    achievement,
    taskAmount,
    difficulty,
    timeEfficiency,
    quality,
    performanceRating, // raw 0-10, for display (roster chip, etc.)
    performanceRatingScore, // scaled 0-100, for gauges/radar
    final,
  };
}

export function ratingFor(score) {
  if (score === null || score === undefined)
    return {
      label: "No Data",
      className: "text-white/40 bg-white/5 border-white/10",
    };
  if (score >= 90)
    return {
      label: "Excellent",
      className: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    };
  if (score >= 75)
    return {
      label: "Good",
      className: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    };
  if (score >= 60)
    return {
      label: "Average",
      className: "text-orange-400 bg-orange-500/10 border-orange-500/20",
    };
  return {
    label: "Needs Improvement",
    className: "text-red-400 bg-red-500/10 border-red-500/20",
  };
}
