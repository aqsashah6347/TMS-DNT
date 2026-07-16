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

function colorGradient(hex) {
  const safeHex = hex || "#fb923c";
  const num = parseInt(safeHex.replace("#", ""), 16);
  const r = Math.min(255, (num >> 16) + 60);
  const g = Math.min(255, ((num >> 8) & 0x00ff) + 60);
  const b = Math.min(255, (num & 0x0000ff) + 60);
  const lighter = `rgb(${r}, ${g}, ${b})`;
  return `linear-gradient(90deg, ${lighter}, ${safeHex})`;
}

function getInitial(name) {
  return name ? name.trim().charAt(0).toUpperCase() : "?";
}

export default function TaskCard({ task }) {
  const [isFlipped, setIsFlipped] = useState(false);
  const openTaskView = useTaskStore((s) => s.openTaskView);
  const projects = useProjectStore((s) => s.projects);
  const projectColor = getProjectColor(task.projectId, projects);

  function handleEditClick(e) {
    e.stopPropagation();
    openTaskView(task);
  }

  return (
    <div
      className={`flip-card ${isFlipped ? "is-flipped" : ""}`}
      onClick={() => setIsFlipped((f) => !f)}
    >
      <div className="flip-card-inner">
        {/* ---- FRONT (visible by default) ---- */}
        <div className="flip-card-face glass glass-card glass-card-hover w-full cursor-pointer flex flex-col gap-3 !p-5 !rounded-[32px]">
          <div className="glass-content flex flex-col gap-3 h-full">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: projectColor }}
                />
                <h4 className="glass-card__title !mb-0 !text-base text-white truncate">
                  {task.title}
                </h4>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {task.pinned && (
                  <Pin
                    size={12}
                    className="text-emerald-300 fill-emerald-300"
                  />
                )}
                <span
                  className={`glass-badge ${statusBadge[task.status]} capitalize`}
                >
                  {task.status}
                </span>
                <button
                  onClick={handleEditClick}
                  className="text-white/40 hover:text-white transition-colors p-1"
                  title="Edit task"
                >
                  <Pencil size={13} />
                </button>
              </div>
            </div>

            {task.description ? (
              <p className="text-xs text-white/90 line-clamp-3 flex-1">
                {task.description}
              </p>
            ) : (
              <p className="text-xs text-white/30 italic flex-1">
                No description yet.
              </p>
            )}

            {task.assignedByName && (
              <p className="text-[11px] text-white/40">
                Created by {task.assignedByName}
              </p>
            )}

            <div>
              <div className="flex justify-between text-[11px] text-white/90 mb-1">
                <span className="capitalize">{task.priority} priority</span>
                <Flag size={10} />
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: priorityWidth[task.priority],
                    backgroundImage: colorGradient(
                      priorityColorHex[task.priority],
                    ),
                  }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-white/90 flex items-center gap-1">
                {task.dueDate && (
                  <>
                    <Calendar size={12} /> {task.dueDate}
                  </>
                )}
              </span>
              {task.assignedToName ? (
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                  style={{ backgroundColor: projectColor }}
                  title={task.assignedToName}
                >
                  {getInitial(task.assignedToName)}
                </span>
              ) : (
                <span className="text-[11px] text-white/30">Unassigned</span>
              )}
            </div>

            <p className="text-[10px] text-white/30 text-center mt-1">
              Click card to flip &rsaquo;
            </p>
          </div>
        </div>

        {/* ---- BACK ---- */}
        <div className="flip-card-face flip-card-face--back glass glass-card w-full cursor-pointer flex flex-col gap-3 !p-5 !rounded-[32px]">
          <div className="glass-content flex flex-col gap-3 h-full">
            <div className="flex items-center justify-between gap-2">
              <h4 className="glass-card__title !mb-0 !text-base text-white truncate">
                Details
              </h4>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsFlipped(false);
                }}
                className="text-white/40 hover:text-white transition-colors p-1"
                title="Flip back"
              >
                <RotateCcw size={13} />
              </button>
            </div>

            <div className="flex flex-col gap-1.5 flex-1 overflow-y-auto max-h-48">
              <div className="flex items-center gap-2 bg-white/5 rounded-lg px-2.5 py-1.5">
                <Flag size={13} className="text-white/40 shrink-0" />
                <span className="text-xs text-white/80 flex-1 capitalize">
                  {task.priority} priority
                </span>
                <span className={`glass-badge ${priorityBadge[task.priority]}`}>
                  {task.priority}
                </span>
              </div>

              {task.dueDate && (
                <div className="flex items-center gap-2 bg-white/5 rounded-lg px-2.5 py-1.5">
                  <Calendar size={13} className="text-white/40 shrink-0" />
                  <span className="text-xs text-white/80 flex-1">Due date</span>
                  <span className="text-xs text-white/60">{task.dueDate}</span>
                </div>
              )}

              {task.assignedToName && (
                <div className="flex items-center gap-2 bg-white/5 rounded-lg px-2.5 py-1.5">
                  <User size={13} className="text-white/40 shrink-0" />
                  <span className="text-xs text-white/80 flex-1">
                    Assigned to
                  </span>
                  <span className="text-xs text-white/60">
                    {task.assignedToName}
                  </span>
                </div>
              )}

              {task.assignedByName && (
                <div className="flex items-center gap-2 bg-white/5 rounded-lg px-2.5 py-1.5">
                  <User size={13} className="text-white/40 shrink-0" />
                  <span className="text-xs text-white/80 flex-1">
                    Created by
                  </span>
                  <span className="text-xs text-white/60">
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
                  className="flex items-center gap-2 bg-white/5 hover:bg-white/10 rounded-lg px-2.5 py-1.5 transition-colors"
                >
                  <Video size={13} className="text-white/40 shrink-0" />
                  <span className="text-xs text-white/80 flex-1">
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
                  className="flex items-center gap-2 bg-white/5 hover:bg-white/10 rounded-lg px-2.5 py-1.5 transition-colors"
                >
                  <GitBranch size={13} className="text-white/40 shrink-0" />
                  <span className="text-xs text-white/80 flex-1">
                    GitHub link
                  </span>
                </a>
              )}

              {!task.dueDate &&
                !task.assignedToName &&
                !task.assignedByName &&
                !task.zoomLink &&
                !task.githubLink && (
                  <p className="text-xs text-white/40 text-center py-6 flex-1">
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
