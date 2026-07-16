// Palette a user can pick from for their own profile icon color.
// Kept as solid hex values (not gradients) since this gets persisted to
// tms_users.avatar_color and reused as a plain CSS background everywhere.
export const AVATAR_COLORS = [
  "#f97316", // orange (app default)
  "#ef4444", // red
  "#f59e0b", // amber
  "#eab308", // yellow
  "#84cc16", // lime
  "#22c55e", // green
  "#10b981", // emerald
  "#14b8a6", // teal
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#a855f7", // purple
  "#d946ef", // fuchsia
  "#ec4899", // pink
  "#64748b", // slate
];

export const DEFAULT_AVATAR_COLOR = "#f97316";
