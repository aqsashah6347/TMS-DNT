import { Pencil, Plus } from "lucide-react";
import ProjectMembers from "./ProjectMembers";
import { useProjectStore } from "../projectStore";
import { useTaskStore } from "../../tasks/taskStore";
import { useAuthStore } from "../../../store/useAuthStore";
import { useMemo } from "react";

function colorGradient(hex) {
  const safeHex = hex || "#fb923c";
  const num = parseInt(safeHex.replace("#", ""), 16);
  const r = Math.min(255, (num >> 16) + 60);
  const g = Math.min(255, ((num >> 8) & 0x00ff) + 60);
  const b = Math.min(255, (num & 0x0000ff) + 60);
  const lighter = `rgb(${r}, ${g}, ${b})`;
  return `linear-gradient(90deg, ${lighter}, ${safeHex})`;
}

export default function ProjectCard({ project }) {
  const openProjectView = useProjectStore((s) => s.openProjectView);
  const openCreateModalForProject = useTaskStore(
    (s) => s.openCreateModalForProject,
  );
  const user = useAuthStore((s) => s.user);
  const canManageTasks = user?.role === "admin" || user?.role === "manager";

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

  function handleAddTaskClick(e) {
    e.stopPropagation();
    openCreateModalForProject(project.id);
  }

  const color = project.color || "#fb923c";

  return (
    <div
      className="taskello-card cursor-pointer"
      onClick={() => openProjectView(project)}
    >
      <div
        className="taskello-card__photo"
        style={{
          background: `
            radial-gradient(circle at 75% 20%, #ffffff22 0%, transparent 35%),
            radial-gradient(circle at 20% 80%, ${color}aa 0%, transparent 55%),
            radial-gradient(circle at 70% 70%, ${color}55 0%, transparent 60%),
            linear-gradient(135deg, #1a1a1a, #0a0a0a)
          `,
        }}
      >
        <button
          onClick={handleEditClick}
          className="taskello-card__edit-btn"
          title="Edit project"
        >
          <Pencil size={12} />
        </button>
        <div className="taskello-card__photo-text capitalize">
          {project.status}
        </div>
      </div>

      <div className="taskello-card__panel">
        <div className="taskello-card__tab">
          <div className="taskello-card__tab-title">{project.name}</div>
          <div className="taskello-card__tab-sub">{project.teamName}</div>
        </div>

        {project.description ? (
          <p className="taskello-card__desc">{project.description}</p>
        ) : (
          <p className="taskello-card__desc italic opacity-60">
            No description yet.
          </p>
        )}

        <div className="mb-3">
          <div className="flex justify-between text-[11px] text-white/60 mb-1">
            <span>Progress</span>
            <span>{project.progress}%</span>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${project.progress}%`,
                backgroundImage: colorGradient(color),
              }}
            />
          </div>
        </div>

        <div className="taskello-card__bottom">
          <div className="taskello-card__links">
            {doneCount}/{tasks.length} tasks
          </div>
          <div className="flex items-center gap-2">
            <ProjectMembers
              members={project.memberDetails || project.members}
            />
            {canManageTasks && (
              <button
                onClick={handleAddTaskClick}
                className="taskello-card__edit-btn !static"
                title="Add task to this project"
              >
                <Plus size={13} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
