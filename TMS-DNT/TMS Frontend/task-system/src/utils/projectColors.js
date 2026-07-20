// Rotating palette so every project gets a distinct, consistent color.
// Colors 1-2 come directly from your palette; the rest are muted pastels
// picked to sit comfortably alongside teal/mint without clashing.
export const PROJECT_COLORS = [
  "#9DC0BC", // teal (your palette)
  "#CDF3D9", // mint (your palette)
  "#B8A9C9", // muted lavender
  "#F2C6A0", // soft apricot
  "#A9C9E0", // dusty blue
  "#D9B8A9", // clay
];

export function getProjectColor(projectId, projects) {
  if (!projectId) return "#CBD5D1"; // neutral gray for tasks with no project
  const project = projects.find((p) => p.id === projectId);
  return project?.color || "#CBD5D1";
}
