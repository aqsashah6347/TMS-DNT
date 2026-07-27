// Lightweight persistence layer for per-task, per-day progress entries.
// The backend task model currently has no "progress" concept (only status),
// so daily progress is tracked client-side and used to drive the
// productivity/completion charts in the project modal.
//
// Shape stored in localStorage:
// {
//   "<taskId>": { "YYYY-MM-DD": <0-100 number>, ... },
//   ...
// }

const STORAGE_KEY = "tms_task_daily_progress";

export function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function readAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeAll(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore storage errors (e.g. private browsing / quota)
  }
}

/** Get the full { date: percent } log for one task. */
export function getTaskLog(taskId) {
  const all = readAll();
  return all[taskId] || {};
}

/** Get a single day's progress for a task (defaults to today). */
export function getTaskProgress(taskId, date = new Date()) {
  const log = getTaskLog(taskId);
  return log[todayKey(date)] ?? 0;
}

/** Set a single day's progress for a task (clamped 0-100) and persist it. */
export function setTaskProgress(taskId, percent, date = new Date()) {
  const all = readAll();
  const clamped = Math.max(0, Math.min(100, Number(percent) || 0));
  const key = String(taskId);
  all[key] = { ...(all[key] || {}), [todayKey(date)]: clamped };
  writeAll(all);
  return clamped;
}

/**
 * Aggregate progress entries across a set of task ids into per-date totals,
 * suitable for the "productivity by date" bar chart. Returns entries sorted
 * chronologically, e.g. [{ date: "Jul 21", productivity: 140 }, ...]
 */
export function getProductivityByDate(taskIds) {
  const all = readAll();
  const totals = {};

  taskIds.forEach((id) => {
    const log = all[String(id)] || {};
    Object.entries(log).forEach(([date, percent]) => {
      totals[date] = (totals[date] || 0) + percent;
    });
  });

  return Object.keys(totals)
    .sort()
    .map((date) => ({
      date: new Date(date).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
      productivity: totals[date],
    }));
}