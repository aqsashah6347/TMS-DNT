import { useState } from "react";
import {
  Flag,
  Calendar,
  User,
  Pin,
  Video,
  GitBranch,
  RotateCcw,
  Pencil,
} from "lucide-react";
import { useTaskStore } from "../taskStore";
import { useProjectStore } from "../../projects/projectStore";
import { getProjectColor } from "../../../utils/projectColors";

const priorityBadge = {
  critical: "glass-badge--danger",
  high: "glass-badge--amber",
  medium: "glass-badge--violet",
  low: "glass-badge--primary",
};

const priorityColorHex = {
  critical: "#f87171",
  high: "#ffd27f",
  medium: "#b490f5",
  low: "#a1a1aa",
};

const priorityWidth = {
  critical: "100%",
  high: "75%",
  medium: "50%",
  low: "25%",
};

const statusBadge = {
  backlog: "glass-badge--primary",
  "in progress": "glass-badge--violet",
  review: "glass-badge--amber",
  done: "glass-badge--primary",
};

const CARD_MIN_HEIGHT = 260;

function hexToRgba(hex, alpha) {
  const safe = (hex || "#fb923c").replace("#", "");
  const num = parseInt(safe, 16);
  const r = (num >> 16) & 0xff;
  const g = (num >> 8) & 0xff;
  const b = num & 0xff;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function colorGradient(hex) {
  const safeHex = hex || "#fb923c";
  const num = parseInt(safeHex.replace("#", ""), 16);
  const r = Math.min(255, (num >> 16) + 60);
  const g = Math.min(255, ((num >> 8) & 0x00ff) + 60);
  const b = Math.min(255, (num & 0x0000ff) + 60);
  const lighter = `rgb(${r}, ${g}, ${b})`;
  return `linear-gradient(135deg, ${lighter}, ${safeHex})`;
}

function getInitial(name) {
  return name ? name.trim().charAt(0).toUpperCase() : "?";
}

export default function TaskCard({ task }) {
  const [isFlipped, setIsFlipped] = useState(false);
  const openTaskView = useTaskStore((s) => s.openTaskView);
  const projects = useProjectStore((s) => s.projects);

  // FIX: previously this never looked at task.color at all — a
  // project-less task always fell back to the flat priority color,
  // so picking a swatch in the modal visually did nothing. Now:
  // projectId present -> project's color (project always wins, matches
  // backend's "projectColor should be preferred" comment). No project
  // -> the task's own saved color. Only falls back to priority color
  // if neither exists (e.g. legacy tasks created before this column).
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

  function handleEditClick(e) {
    e.stopPropagation();
    openTaskView(task);
  }

  return (
    <div
      className={`flip-card ${isFlipped ? "is-flipped" : ""}`}
      style={{ minHeight: CARD_MIN_HEIGHT }}
      onClick={() => setIsFlipped((f) => !f)}
    >
      <div className="flip-card-inner" style={{ minHeight: CARD_MIN_HEIGHT }}>
        {/* ---- FRONT ---- */}
        <div
          className="flip-card-face glass glass-card-hover w-full h-full cursor-pointer !p-0 !rounded-[32px] overflow-hidden"
          style={{
            backgroundColor: "#1e1e20",
            // Vibrant glassmorphism: colored glow ring around the whole
            // card body, tinted by the task's own color instead of a
            // generic dark shadow.
            boxShadow: `0 20px 50px -12px ${hexToRgba(accentColor, 0.35)}, inset 0 1px 0 rgba(255,255,255,0.06)`,
            border: `1px solid ${hexToRgba(accentColor, 0.35)}`,
          }}
        >
          <div className="glass-content flex flex-col h-full">
            {/* Header zone — richer, more saturated gradient + stronger
                glass blur so the accent color actually reads as vibrant
                instead of a muted wash. */}
            <div
              className="relative px-5 pt-4 pb-7 shrink-0"
              style={{
                background: `linear-gradient(160deg, ${hexToRgba(accentColor, 0.9)} 0%, ${hexToRgba(accentColor, 0.45)} 100%)`,
                backdropFilter: "blur(18px) saturate(160%)",
                WebkitBackdropFilter: "blur(18px) saturate(160%)",
                borderBottom: `2px solid ${hexToRgba(accentColor, 1)}`,
                boxShadow: `inset 0 1px 0 rgba(255,255,255,0.25), inset 0 -14px 18px -14px rgba(0,0,0,0.45), 0 0 24px -6px ${hexToRgba(accentColor, 0.55)}`,
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)]">
                  {task.pinned && (
                    <Pin size={12} className="text-white fill-white" />
                  )}
                  {task.status}
                </span>
                <button
                  onClick={handleEditClick}
                  className="text-white/80 hover:text-white transition-colors p-1"
                  title="Edit task"
                >
                  <Pencil size={15} />
                </button>
              </div>
              <h4 className="mt-1 text-white font-bold text-lg leading-snug truncate drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)]">
                {task.title}
              </h4>
            </div>

            {/* Avatar */}
            <div className="relative flex justify-center -mt-6 z-10 shrink-0">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-base font-bold text-white border-2"
                style={{
                  background: `linear-gradient(160deg, ${hexToRgba(accentColor, 1)}, ${hexToRgba(accentColor, 0.65)})`,
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  borderColor: "rgba(255,255,255,0.4)",
                  boxShadow: `0 6px 18px ${hexToRgba(accentColor, 0.55)}, inset 0 1px 0 rgba(255,255,255,0.4)`,
                }}
                title={task.assignedToName || "Unassigned"}
              >
                {getInitial(task.assignedToName)}
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 flex flex-col gap-3 px-5 pt-2 pb-4">
              {task.description ? (
                <p className="text-sm text-white/90 leading-relaxed line-clamp-2">
                  {task.description}
                </p>
              ) : (
                <p className="text-sm text-white/35 italic">
                  No description yet.
                </p>
              )}

              {task.assignedByName && (
                <p className="text-xs text-white/45 -mt-1.5">
                  Created by {task.assignedByName}
                </p>
              )}

              <div className="mt-auto flex flex-col gap-3">
                <div>
                  <div className="flex justify-between items-center text-xs font-medium text-white/85 mb-1.5">
                    <span className="capitalize">{task.priority} priority</span>
                    <Flag size={12} />
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: priorityWidth[task.priority],
                        backgroundImage: colorGradient(accentColor),
                      }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/85 flex items-center gap-1.5">
                    {task.dueDate && (
                      <>
                        <Calendar size={14} /> {task.dueDate}
                      </>
                    )}
                  </span>
                  {!task.assignedToName && (
                    <span className="text-sm text-white/35">Unassigned</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ---- BACK ---- */}
        <div
          className="flip-card-face flip-card-face--back glass w-full h-full cursor-pointer flex flex-col gap-3 !p-6 !rounded-[32px]"
          style={{
            backgroundColor: "#1e1e20",
            border: `1px solid ${hexToRgba(accentColor, 0.35)}`,
            boxShadow: `0 20px 50px -12px ${hexToRgba(accentColor, 0.3)}`,
          }}
        >
          <div className="glass-content flex flex-col gap-3 h-full">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-white font-bold text-lg truncate">Details</h4>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsFlipped(false);
                }}
                className="text-white/50 hover:text-white transition-colors p-1"
                title="Flip back"
              >
                <RotateCcw size={15} />
              </button>
            </div>

            <div className="flex flex-col gap-2 flex-1 overflow-y-auto">
              <div className="flex items-center gap-2.5 bg-white/5 rounded-lg px-3 py-2">
                <Flag size={15} className="text-white/50 shrink-0" />
                <span className="text-sm text-white/90 flex-1 capitalize">
                  {task.priority} priority
                </span>
                <span className={`glass-badge ${priorityBadge[task.priority]}`}>
                  {task.priority}
                </span>
              </div>

              {task.dueDate && (
                <div className="flex items-center gap-2.5 bg-white/5 rounded-lg px-3 py-2">
                  <Calendar size={15} className="text-white/50 shrink-0" />
                  <span className="text-sm text-white/90 flex-1">Due date</span>
                  <span className="text-sm text-white/70">{task.dueDate}</span>
                </div>
              )}

              {task.assignedToName && (
                <div className="flex items-center gap-2.5 bg-white/5 rounded-lg px-3 py-2">
                  <User size={15} className="text-white/50 shrink-0" />
                  <span className="text-sm text-white/90 flex-1">
                    Assigned to
                  </span>
                  <span className="text-sm text-white/70">
                    {task.assignedToName}
                  </span>
                </div>
              )}

              {task.assignedByName && (
                <div className="flex items-center gap-2.5 bg-white/5 rounded-lg px-3 py-2">
                  <User size={15} className="text-white/50 shrink-0" />
                  <span className="text-sm text-white/90 flex-1">
                    Created by
                  </span>
                  <span className="text-sm text-white/70">
                    {task.assignedByName}
                  </span>
                </div>
              )}

              {task.zoomLink && (
                <a
                  href={task.zoomLink}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-2.5 bg-white/5 hover:bg-white/10 rounded-lg px-3 py-2 transition-colors"
                >
                  <Video size={15} className="text-white/50 shrink-0" />
                  <span className="text-sm text-white/90 flex-1">
                    Zoom link
                  </span>
                </a>
              )}

              {task.githubLink && (
                <a
                  href={task.githubLink}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-2.5 bg-white/5 hover:bg-white/10 rounded-lg px-3 py-2 transition-colors"
                >
                  <GitBranch size={15} className="text-white/50 shrink-0" />
                  <span className="text-sm text-white/90 flex-1">
                    GitHub link
                  </span>
                </a>
              )}

              {!task.dueDate &&
                !task.assignedToName &&
                !task.assignedByName &&
                !task.zoomLink &&
                !task.githubLink && (
                  <p className="text-sm text-white/40 text-center py-6 flex-1">
                    No additional details.
                  </p>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
