import { User, Pin, Pencil } from "lucide-react";
import { useTaskStore } from "../taskStore";
import { useProjectStore } from "../../projects/projectStore";
import { getProjectColor } from "../../../utils/projectColors";
import EditableProgressBar from "../../../components/ui/EditableProgressBar";

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
  const updateTask = useTaskStore((s) => s.updateTask);
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

  function handleEditClick(e) {
    e.stopPropagation();
    openTaskView(task);
  }

  async function handleProgressSave(value) {
    return updateTask(task.id, { progress: value });
  }

  return (
    <div
      className="task-card-v2 w-full"
      style={{
        boxShadow: `0 0 0 1.5px ${hexToRgba(accentColor, 0.7)}, 0 16px 40px -14px rgba(0, 0, 0, 0.55)`,
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
          <h4 className="text-white font-bold text-base leading-snug line-clamp-1">
            {task.title || "Untitled task"}
          </h4>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`glass-badge ${priorityBadge[task.priority] || "glass-badge--primary"} !py-0.5 !px-2 whitespace-nowrap capitalize`}
          >
            {task.priority || "—"}
          </span>
          <div
            className="task-card-v2__avatar"
            style={{ color: accentColor }}
            title={task.assignedToName || "Unassigned"}
          >
            <User size={13} />
          </div>
        </div>
      </div>

      <div className="task-card-v2__divider" />

      {/* Status */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs uppercase tracking-wider text-white/40">
          Status
        </span>
        <span className="text-sm text-white/90 font-medium">
          {formatStatus(task.status)}
        </span>
      </div>

      {/* Description */}
      <div className="mb-3">
        <span className="text-xs uppercase tracking-wider text-white/40">
          Description:
        </span>
        {task.description ? (
          <p className="text-sm text-white/70 leading-relaxed line-clamp-1 mt-1">
            {task.description}
          </p>
        ) : (
          <p className="text-sm text-white/40 italic mt-1">
            No description yet.
          </p>
        )}
      </div>

      {/* Progress bar — editable: type a value, arrow keys, or click the
          track, then hit the save button (or Enter) to persist it. */}
      <div className="mb-3">
        <EditableProgressBar
          progress={progress}
          color={accentColor}
          onSave={handleProgressSave}
        />
      </div>

      {/* Footer: created by / date assigned, assigned to / due date */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-2.5 border-t border-white/10 mt-auto">
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
