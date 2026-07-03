import ProjectMembers from "./ProjectMembers";

const statusStyles = {
  planning: "bg-info text-info-text",
  active: "bg-warning text-warning-text",
  completed: "bg-success text-success-text",
};

export default function ProjectCard({ project, onClick }) {
  return (
    <div
      onClick={() => onClick?.(project)}
      className="bg-surface rounded-card shadow-card p-5 cursor-pointer hover:shadow-md transition-shadow flex flex-col gap-3"
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-base font-semibold text-dark">{project.name}</h4>
        <span
          className={`text-[10px] font-medium px-2 py-0.5 rounded-full capitalize shrink-0 ${statusStyles[project.status]}`}
        >
          {project.status}
        </span>
      </div>

      {project.description && (
        <p className="text-xs text-muted line-clamp-2">{project.description}</p>
      )}

      <div>
        <div className="flex justify-between text-[11px] text-muted mb-1">
          <span>Progress</span>
          <span>{project.progress}%</span>
        </div>
        <div className="h-1.5 bg-bg rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: `${project.progress}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        <span className="text-[11px] text-muted">{project.teamName}</span>
        <ProjectMembers members={project.members} />
      </div>
    </div>
  );
}
