import {
  Flag,
  Calendar,
  User,
  Pin,
  Video,
  GitBranch,
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

const CARD_MIN_HEIGHT = 260;

// Status pill colors — gives the top-left label the same "at a glance"
// legibility as the priority badge, instead of dim uppercase text that
// blends into the card.
const statusBadge = {
  backlog: "glass-badge--primary",
  todo: "glass-badge--primary",
  in_progress: "glass-badge--violet",
  review: "glass-badge--amber",
  done: "glass-badge--rose",
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
  const openTaskView = useTaskStore((s) => s.openTaskView);
  const projects = useProjectStore((s) => s.projects);

  // Color precedence stays exactly as before: a project always wins if
  // the task belongs to one (and that project actually has a real color
  // set), otherwise fall back to the task's own saved color, and only
  // fall back to the flat priority color if neither exists. Whichever
  // source it comes from, accentColor is what draws the shell's
  // color-coded neon outline below.
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

  const hasBackDetails =
    task.dueDate ||
    task.assignedToName ||
    task.assignedByName ||
    task.zoomLink ||
    task.githubLink;

  return (
    <div
      className="task-carousel-shell w-full h-full"
      style={{ minHeight: CARD_MIN_HEIGHT }}
    >
      <div
        className="task-carousel-card"
        style={{
          // Same muted "colored inside" treatment as ProjectCard's
          // .taskello-card__photo — a soft radial wash of accentColor
          // over a dark base, instead of a flat bright color fill.
          background: `
            radial-gradient(circle at 75% 20%, #ffffff22 0%, transparent 35%),
            radial-gradient(circle at 20% 80%, ${accentColor}aa 0%, transparent 55%),
            radial-gradient(circle at 70% 70%, ${accentColor}55 0%, transparent 60%),
            linear-gradient(135deg, #1a1a1a, #0a0a0a)
          `,
          boxShadow: `inset 0 0 0 1.5px ${hexToRgba(accentColor, 0.45)}`,
        }}
      >
        {/* Top-right: status badge, pin, edit. Status is now a colored
            pill (matching the priority badge's visual language) so it
            reads at a glance instead of dissolving into dim gray text. */}
        <div className="task-carousel-actions">
          {task.pinned && (
            <Pin
              size={12}
              className="text-white/70 fill-white/70"
              aria-label="Pinned"
            />
          )}
          <span
            className={`glass-badge ${statusBadge[task.status] || "glass-badge--primary"} !py-1 !px-2.5 max-w-[120px] truncate`}
          >
            {formatStatus(task.status)}
          </span>
          <button
            onClick={handleEditClick}
            className="text-white/60 hover:text-white transition-colors"
            title="Edit task"
          >
            <Pencil size={13} />
          </button>
        </div>

        {/* ---- Sliding viewport: page 1 = icon/name/due date/description,
              page 2 = the rest of the task's information. Hovering the
              shell slides the track left, like a two-page carousel. ---- */}
        <div className="task-carousel-viewport">
          <div className="task-carousel-track">
            {/* Page 1 */}
            <div className="task-carousel-page px-5 pt-5 pb-4">
              <div className="flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <div
                    className="task-carousel-icon shrink-0"
                    style={{ color: accentColor }}
                    title={task.assignedToName || "Unassigned"}
                  >
                    {getInitial(task.assignedToName)}
                  </div>

                  <div className="flex flex-col gap-1 min-w-0 pt-0.5">
                    <h4 className="text-white font-bold text-lg leading-snug line-clamp-1 pr-36">
                      {task.title || "Untitled task"}
                    </h4>

                    <span className="text-xs text-white/60 flex items-center gap-1.5">
                      <Calendar size={12} />
                      {task.dueDate || "No due date"}
                    </span>
                  </div>
                </div>

                {task.description ? (
                  <p className="text-sm text-white/70 leading-relaxed line-clamp-2">
                    {task.description}
                  </p>
                ) : (
                  <p className="text-sm text-white/40 italic">
                    No description yet.
                  </p>
                )}
              </div>

              <div className="flex-1 min-h-3" />

              <div className="pt-3 border-t border-white/10">
                <div className="flex justify-between items-center text-xs font-semibold text-white/80 mb-1.5">
                  <span className="flex items-center gap-1.5 capitalize">
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{
                        backgroundColor: priorityColorHex[task.priority],
                      }}
                    />
                    {task.priority} priority
                  </span>
                  <Flag
                    size={12}
                    style={{ color: priorityColorHex[task.priority] }}
                  />
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: priorityWidth[task.priority],
                      backgroundImage: colorGradient(accentColor),
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Page 2 */}
            <div className="task-carousel-page gap-2 px-5 pt-5 pb-4 overflow-y-auto">
              <div className="flex items-center gap-2.5 bg-white/5 rounded-lg px-3 py-2">
                <Flag size={15} className="text-white/60 shrink-0" />
                <span className="text-sm text-white/90 flex-1 capitalize">
                  {task.priority} priority
                </span>
                <span className={`glass-badge ${priorityBadge[task.priority]}`}>
                  {task.priority}
                </span>
              </div>

              {task.dueDate && (
                <div className="flex items-center gap-2.5 bg-white/5 rounded-lg px-3 py-2">
                  <Calendar size={15} className="text-white/60 shrink-0" />
                  <span className="text-sm text-white/90 flex-1">Due date</span>
                  <span className="text-sm text-white/70">{task.dueDate}</span>
                </div>
              )}

              {task.assignedToName ? (
                <div className="flex items-center gap-2.5 bg-white/5 rounded-lg px-3 py-2">
                  <User size={15} className="text-white/60 shrink-0" />
                  <span className="text-sm text-white/90 flex-1">
                    Assigned to
                  </span>
                  <span className="text-sm text-white/70">
                    {task.assignedToName}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2.5 bg-white/5 rounded-lg px-3 py-2">
                  <User size={15} className="text-white/60 shrink-0" />
                  <span className="text-sm text-white/40 flex-1 italic">
                    Unassigned
                  </span>
                </div>
              )}

              {task.assignedByName && (
                <div className="flex items-center gap-2.5 bg-white/5 rounded-lg px-3 py-2">
                  <User size={15} className="text-white/60 shrink-0" />
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
                  <Video size={15} className="text-white/60 shrink-0" />
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
                  <GitBranch size={15} className="text-white/60 shrink-0" />
                  <span className="text-sm text-white/90 flex-1">
                    GitHub link
                  </span>
                </a>
              )}

              {!hasBackDetails && (
                <p className="text-sm text-white/45 text-center py-6 flex-1">
                  No additional details.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="task-carousel-dots">
        <span className="task-carousel-dot task-carousel-dot--1" />
        <span className="task-carousel-dot task-carousel-dot--2" />
        <span className="task-carousel-hint">Hover for details</span>
      </div>
    </div>
  );
}
