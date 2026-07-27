import { User, Pin, Pencil } from "lucide-react";
import { useTaskStore } from "../taskStore";
import { useProjectStore } from "../../projects/projectStore";
import { getProjectColor } from "../../../utils/projectColors";

const priorityColorHex = {
  critical: "#f87171",
  high: "#ffd27f",
  medium: "#b490f5",
  low: "#a1a1aa",
};

// Priority pill colors — the header badge now shows priority, not status.
const priorityBadge = {
  critical: "glass-badge--danger",
  high: "glass-badge--amber",
  medium: "glass-badge--violet",
  low: "glass-badge--primary",
};

const CARD_WIDTH = 320;

function formatStatus(status) {
  if (!status) return "Backlog";
  return status
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function hexToRgba(hex, alpha) {
  const safe = (hex || "#fb923c").replace("#", "");
  const num = parseInt(safe, 16);
  const r = (num >> 16) & 0xff;
  const g = (num >> 8) & 0xff;
  const b = num & 0xff;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Short "Jan 5, 2026" style date, used for both Date Assigned and Due Date.
function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function TaskCard({ task }) {
  const openTaskView = useTaskStore((s) => s.openTaskView);
  const projects = useProjectStore((s) => s.projects);

  // Color precedence stays exactly as before: a project always wins if
  // the task belongs to one (and that project actually has a real color
  // set), otherwise fall back to the task's own saved color, and only
  // fall back to the flat priority color if neither exists.
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

  function handleEditClick(e) {
    e.stopPropagation();
    openTaskView(task);
  }

  return (
    <div
      className="task-card-v2"
      style={{
        width: CARD_WIDTH,
        // Very thin, faint neon outline in the task's own color — a
        // 1px ring plus a soft low-opacity glow, layered under the
        // card's normal drop shadow rather than replacing it.
        boxShadow: `0 0 0 1px ${hexToRgba(accentColor, 0.4)}, 0 0 6px ${hexToRgba(accentColor, 0.25)}, 0 0 12px ${hexToRgba(accentColor, 0.15)}, 0 12px 30px -14px rgba(0, 0, 0, 0.3)`,
      }}
      onClick={() => openTaskView(task)}
      role="button"
      tabIndex={0}
    >
      <button
        onClick={handleEditClick}
        className="task-card-v2__edit text-white/60 hover:text-white transition-colors"
        title="Edit task"
      >
        <Pencil size={13} />
      </button>

      {/* Header: title, priority pill, assignee avatar */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-1.5 min-w-0 pr-6">
          {task.pinned && (
            <Pin
              size={12}
              className="text-white/60 fill-white/60 shrink-0"
              aria-label="Pinned"
            />
          )}
          <h4 className="text-white font-bold text-lg leading-snug line-clamp-1">
            {task.title || "Untitled task"}
          </h4>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <span
            className={`glass-badge ${priorityBadge[task.priority] || "glass-badge--primary"} !py-1 !px-2.5 whitespace-nowrap capitalize`}
          >
            {task.priority || "—"}
          </span>
          <div
            className="task-card-v2__avatar"
            style={{ color: accentColor }}
            title={task.assignedToName || "Unassigned"}
          >
            <User size={16} />
          </div>
        </div>
      </div>

      <div className="task-card-v2__divider" />

      {/* Status */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs uppercase tracking-wider text-white/40">
          Status
        </span>
        <span className="text-sm text-white/90 font-medium">
          {formatStatus(task.status)}
        </span>
      </div>

      {/* Description */}
      <div className="mb-4">
        <span className="text-xs uppercase tracking-wider text-white/40">
          Description:
        </span>
        {task.description ? (
          <p className="text-sm text-white/70 leading-relaxed line-clamp-2 mt-1">
            {task.description}
          </p>
        ) : (
          <p className="text-sm text-white/40 italic mt-1">
            No description yet.
          </p>
        )}
      </div>

      {/* Progress bar */}
      <div
        className="mask-progress-bar flex-1"
        style={{
          backgroundImage: `linear-gradient(${accentColor}, ${accentColor})`,
          backgroundSize: `${progress}% 100%`,
        }}
      />

      {/* Footer: created by / date assigned, assigned to / due date */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 pt-3 border-t border-white/10 mt-auto">
        <div className="min-w-0">
          <span className="text-xs text-white/40 block">Created by:</span>
          <span className="text-sm text-white/80 truncate block">
            {task.assignedByName || "—"}
          </span>
        </div>
        <div className="min-w-0">
          <span className="text-xs text-white/40 block">Date Assigned:</span>
          <span className="text-sm text-white/80 truncate block">
            {formatDate(task.createdAt)}
          </span>
        </div>
        <div className="min-w-0">
          <span className="text-xs text-white/40 block">Assigned to:</span>
          <span className="text-sm text-white/80 truncate block">
            {task.assignedToName || "Unassigned"}
          </span>
        </div>
        <div className="min-w-0">
          <span className="text-xs text-white/40 block">Due Date:</span>
          <span className="text-sm text-white/80 truncate block">
            {task.dueDate ? formatDate(task.dueDate) : "—"}
          </span>
        </div>
      </div>
    </div>
  );
}
