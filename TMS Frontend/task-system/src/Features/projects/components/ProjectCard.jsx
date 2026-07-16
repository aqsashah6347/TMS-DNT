import { useState, useMemo } from "react";
import { Pencil, RotateCcw, CheckCircle2, Circle } from "lucide-react";
import ProjectMembers from "./ProjectMembers";
import { useProjectStore } from "../projectStore";
import { useTaskStore } from "../../tasks/taskStore";

// Turns a picked project color into a two-stop gradient for a richer look,
// without changing what color the user actually picked.
function colorGradient(hex) {
  const safeHex = hex || "#fb923c"; // falls back to theme orange if a project has no color set
  const num = parseInt(safeHex.replace("#", ""), 16);
  const r = Math.min(255, (num >> 16) + 60);
  const g = Math.min(255, ((num >> 8) & 0x00ff) + 60);
  const b = Math.min(255, (num & 0x0000ff) + 60);
const lighter = `rgb(${r}, ${g}, ${b})`;
  return `linear-gradient(90deg, ${lighter}, ${safeHex})`;
}


const statusBadge = {
  planning: "glass-badge--violet",
  active: "glass-badge--amber",
  completed: "glass-badge--primary",
};

export default function ProjectCard({ project }) {
  const [isFlipped, setIsFlipped] = useState(false);
  const openProjectView = useProjectStore((s) => s.openProjectView);
  const openTaskView = useTaskStore((s) => s.openTaskView);

  // Select the raw (stable) tasks array, then filter locally. Calling
  // getTasksByProject() directly inside the selector returns a brand-new
  // array every render, which makes Zustand think the store "changed"
  // every time and triggers an infinite render loop.
  const allTasks = useTaskStore((s) => s.tasks);
  const tasks = useMemo(
    () => allTasks.filter((t) => t.projectId === project.id),
    [allTasks, project.id],
  );

  const doneCount = tasks.filter((t) => t.status === "done").length;

  function handleEditClick(e) {
    e.stopPropagation();
    openProjectView(project);
  }

  return (
    <div
      className={`flip-card ${isFlipped ? "is-flipped" : ""}`}
      onClick={() => setIsFlipped((f) => !f)}
    >
      <div className="flip-card-inner">
        {/* ---- FRONT: description + team members ---- */}
        <div className="flip-card-face glass glass-card glass-card-hover w-full cursor-pointer flex flex-col gap-3 !p-5 !rounded-[32px]">
          <div className="glass-content flex flex-col gap-3 h-full">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: project.color }}
                />
                <h4 className="glass-card__title !mb-0 !text-base text-white truncate">
                  {project.name}
                </h4>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className={`glass-badge ${statusBadge[project.status]}`}>
                  {project.status}
                </span>
                <button
                  onClick={handleEditClick}
                  className="text-white/40 hover:text-white transition-colors p-1"
                  title="Edit project"
                >
                  <Pencil size={13} />
                </button>
              </div>
            </div>

            {project.description ? (
              <p className="text-xs text-white/90 line-clamp-3 flex-1">
                {project.description}
              </p>
            ) : (
              <p className="text-xs text-white/30 italic flex-1">
                No description yet.
              </p>
            )}

            <div>
              <div className="flex justify-between text-[11px] text-white/90 mb-1">
                <span>Progress</span>
                <span>{project.progress}%</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${project.progress}%`,
                    backgroundImage: colorGradient(project.color),
                  }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-white/90">
                {project.teamName}
              </span>
              <ProjectMembers
                members={project.memberDetails || project.members}
              />
            </div>

            <p className="text-[10px] text-white/30 text-center mt-1">
              Click card to flip &rsaquo;
            </p>
          </div>
        </div>

        {/* ---- BACK: tasks for this project ---- */}
        <div className="flip-card-face flip-card-face--back glass glass-card w-full cursor-pointer flex flex-col gap-3 !p-5 !rounded-[32px]">
          <div className="glass-content flex flex-col gap-3 h-full">
            <div className="flex items-center justify-between gap-2">
              <h4 className="glass-card__title !mb-0 !text-base text-white truncate">
                Tasks{" "}
                <span className="text-white/40 font-normal">
                  ({doneCount}/{tasks.length})
                </span>
              </h4>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsFlipped(false);
                }}
                className="text-white/40 hover:text-white transition-colors p-1 shrink-0"
                title="Flip back"
              >
                <RotateCcw size={13} />
              </button>
            </div>

            {tasks.length === 0 ? (
              <p className="text-xs text-white/40 text-center py-6 flex-1">
                No tasks yet for this project.
              </p>
            ) : (
              <div className="flex flex-col gap-1.5 flex-1 overflow-y-auto max-h-48">
                {tasks.map((task) => (
                  <button
                    key={task.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      openTaskView(task);
                    }}
                    className="w-full flex items-center gap-2 bg-white/5 hover:bg-white/10 rounded-lg px-2.5 py-1.5 transition-colors text-left"
                  >
                    {task.status === "done" ? (
                      <CheckCircle2
                        size={14}
                        className="text-emerald-400 shrink-0"
                      />
                    ) : (
                      <Circle size={14} className="text-white/30 shrink-0" />
                    )}
                    <span className="text-xs text-white/80 flex-1 truncate">
                      {task.title}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}