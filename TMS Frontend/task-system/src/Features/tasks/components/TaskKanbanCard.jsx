import { useTaskStore } from "../taskStore";
import { useProjectStore } from "../../projects/projectStore";
import { getProjectColor } from "../../../utils/projectColors";

const priorityColorHex = {
  critical: "#f87171",
  high: "#ffd27f",
  medium: "#b490f5",
  low: "#a1a1aa",
};

function hexToRgba(hex, alpha) {
  const safe = (hex || "#fb923c").replace("#", "");
  const num = parseInt(safe, 16);
  const r = (num >> 16) & 0xff;
  const g = (num >> 8) & 0xff;
  const b = num & 0xff;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function initials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Deliberately tiny — this is the compact row used only on the Kanban
// ("pipeline") board, where four columns need to show a lot of tasks in a
// small footprint. The full-detail TaskCard is still used everywhere else
// (list view, calendar view, etc.) and is untouched.
export default function TaskKanbanCard({ task }) {
  const openTaskView = useTaskStore((s) => s.openTaskView);
  const projects = useProjectStore((s) => s.projects);

  const rawProjectColor = getProjectColor(task.projectId, projects);
  const hasValidProjectColor =
    rawProjectColor &&
    rawProjectColor !== "#ffffff" &&
    rawProjectColor !== "#fff";

  const accentColor = task.projectId
    ? hasValidProjectColor
      ? rawProjectColor
      : priorityColorHex[task.priority]
    : task.color || priorityColorHex[task.priority];

  const progress = Math.max(0, Math.min(100, Number(task.progress) || 0));

  return (
    <div
      className="kanban-card"
      style={{ "--kc-accent": accentColor || "#fb923c" }}
      onClick={() => openTaskView(task)}
      role="button"
      tabIndex={0}
      title={task.title || "Untitled task"}
    >
      <span className="kanban-card__bar" />

      <span className="kanban-card__title">
        {task.title || "Untitled task"}
      </span>

      <span
        className="kanban-card__priority"
        style={{ background: priorityColorHex[task.priority] || "#a1a1aa" }}
        title={task.priority ? `${task.priority} priority` : "No priority set"}
      />

      <span
        className="kanban-card__avatar"
        style={{
          color: accentColor || "#fb923c",
          borderColor: hexToRgba(accentColor, 0.4),
        }}
        title={task.assignedToName || "Unassigned"}
      >
        {initials(task.assignedToName)}
      </span>

      <span className="kanban-card__progress-track">
        <span
          className="kanban-card__progress-fill"
          style={{
            width: `${progress}%`,
            background: accentColor || "#fb923c",
          }}
        />
      </span>
    </div>
  );
}
