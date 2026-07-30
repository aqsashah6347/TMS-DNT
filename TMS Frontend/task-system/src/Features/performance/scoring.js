// src/Features/performance/scoring.js
//
// Performance Calculation Engine
// -------------------------------
// FINAL SCORE = Completion×30% + TaskAmount×15% + TimeEfficiency×20% + TaskWeight×25% + Quality×10%
//
// tms_tasks doesn't (yet) store an explicit difficulty level, estimated/
// actual hours, or a manager quality rating — so each function below
// derives an honest proxy from what IS tracked (priority, due dates,
// completion dates). The moment a real field shows up on a task
// (task.difficultyLevel, task.estimatedHours, task.actualHours,
// task.qualityRating) these functions use it automatically instead of the
// proxy — no rewiring needed later.

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

export function finalScore({
  achievement,
  taskAmount,
  difficulty,
  timeEfficiency,
  quality,
}) {
  const a = achievement ?? 0;
  const ta = taskAmount ?? 0;
  const d = difficulty ?? 0;
  const t = timeEfficiency ?? 0;
  const q = quality ?? 0;
  return Math.round(a * 0.3 + ta * 0.15 + d * 0.25 + t * 0.2 + q * 0.1);
}

export function buildScoreBreakdown(tasks) {
  const achievement = achievementScore(tasks);
  const taskAmount = taskAmountScore(tasks);
  const difficulty = difficultyScore(tasks);
  const timeEfficiency = timeEfficiencyScore(tasks);
  const quality = qualityScore(tasks);
  const final = tasks.length
    ? finalScore({
        achievement,
        taskAmount,
        difficulty,
        timeEfficiency,
        quality,
      })
    : null;
  return {
    achievement,
    taskAmount,
    difficulty,
    timeEfficiency,
    quality,
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
