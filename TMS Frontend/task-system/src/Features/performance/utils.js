// src/Features/performance/utils.js
export function daysBetween(a, b) {
  if (!a || !b) return null;
  return (new Date(b).getTime() - new Date(a).getTime()) / 86400000;
}

export function formatDuration(days) {
  if (days === null || days === undefined || Number.isNaN(days)) return "—";
  if (days < 1) return `${Math.round(days * 24)}h`;
  return `${days.toFixed(1)}d`;
}

export function initials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] || "";
  const second = parts[1]?.[0] || "";
  return (first + second).toUpperCase();
}

// Deterministic color per department so the same department always gets
// the same badge/chart color without hardcoding every department name.
const DEPARTMENT_PALETTE = [
  "#a78bfa", // violet
  "#60a5fa", // blue
  "#fb923c", // orange
  "#34d399", // emerald
  "#f472b6", // pink
  "#facc15", // yellow
  "#22d3ee", // cyan
];

export function colorForDepartment(department) {
  if (!department || department === "—") return "#94a3b8";
  let hash = 0;
  for (let i = 0; i < department.length; i++) {
    hash = department.charCodeAt(i) + ((hash << 5) - hash);
  }
  return DEPARTMENT_PALETTE[Math.abs(hash) % DEPARTMENT_PALETTE.length];
}

export function scoreColor(score) {
  if (score === null || score === undefined) return "#8a8f98";
  if (score >= 90) return "#34d399"; // emerald
  if (score >= 75) return "#60a5fa"; // blue
  if (score >= 60) return "#fb923c"; // orange
  return "#f87171"; // red
}

export const STATUS_COLORS = {
  backlog: "#94a3b8",
  "in progress": "#60a5fa",
  review: "#a78bfa",
  done: "#34d399",
};

export const PRIORITY_COLORS = {
  low: "#34d399",
  medium: "#60a5fa",
  high: "#fb923c",
  critical: "#f87171",
};

export const TOOLTIP_STYLE = {
  background: "#1c1d21",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "0.75rem",
  fontSize: "12px",
  color: "#fff",
};
