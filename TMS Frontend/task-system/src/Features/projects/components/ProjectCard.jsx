import { Pencil, Plus } from "lucide-react";
import ProjectMembers from "./ProjectMembers";
import { useProjectStore } from "../projectStore";
import { useTaskStore } from "../../tasks/taskStore";
import { usePermissionStore } from "../../../store/usePermissionStore";
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
  const openEditModal = useProjectStore((s) => s.openEditModal);
  const openCreateModalForProject = useTaskStore(
    (s) => s.openCreateModalForProject,
  );
  const can = usePermissionStore((s) => s.can);
  const canAddTask = can("tasks", "create");
  const canEditProject = can("projects", "edit");

  const allTasks = useTaskStore((s) => s.tasks);
  const tasks = useMemo(
    () => allTasks.filter((t) => t.projectId === project.id),
    [allTasks, project.id],
  );
  const doneCount = tasks.filter((t) => t.status === "done").length;

  function handleEditClick(e) {
    e.stopPropagation();
    openEditModal(project);
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
        {canEditProject && (
          <button
            onClick={handleEditClick}
            className="taskello-card__edit-btn"
            title="Edit project"
          >
            <Pencil size={12} />
          </button>
        )}
        <div className="taskello-card__title">{project.name}</div>
      </div>

      <div className="taskello-card__panel">
        <div className="taskello-card__tab">
          <div className="taskello-card__tab-title">{project.teamName}</div>
        </div>

        <div className="taskello-card__desc-row">
          {project.description ? (
            <p className="taskello-card__desc">{project.description}</p>
          ) : (
            <p className="taskello-card__desc italic opacity-60">
              No description yet.
            </p>
          )}
          <span className="taskello-card__status capitalize">
            {project.status}
          </span>
        </div>

        <div className="taskello-card__progress-row">
          <div className="taskello-card__progress-track">
            <div
              className="taskello-card__progress-fill"
              style={{
                width: `${project.progress}%`,
                backgroundImage: colorGradient(color),
              }}
            />
          </div>
          <span className="taskello-card__progress-pct">
            {project.progress}%
          </span>
        </div>

        <div className="taskello-card__bottom">
          <div className="taskello-card__links">
            {doneCount}/{tasks.length} Tasks
          </div>
          <div className="taskello-card__members">
            <div className="flex items-center gap-2">
              <ProjectMembers
                members={project.memberDetails || project.members}
              />
              {canAddTask && (
                <button
                  onClick={handleAddTaskClick}
                  className="taskello-card__add-btn"
                  title="Add task to this project"
                >
                  <Plus size={13} />
                </button>
              )}
            </div>
            <span className="taskello-card__members-count">
              {(project.memberDetails || project.members || []).length} Members
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
