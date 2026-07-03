import ProjectMembers from "./ProjectMembers";
import Card from "../../../components/ui/Card";
import { useProjectStore } from "../projectStore";

const statusStyles = {
  planning: "bg-info text-info-text",
  active: "bg-warning text-warning-text",
  completed: "bg-success text-success-text",
};

export default function ProjectCard({ project }) {
  const openProjectView = useProjectStore((s) => s.openProjectView);

  return (
    <Card
      hover
      onClick={() => openProjectView(project)}
      className="p-5 cursor-pointer flex flex-col gap-3 border-t-4"
      style={{ borderTopColor: project.color }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: project.color }}
          />
          <h4 className="text-base font-semibold text-dark">{project.name}</h4>
        </div>
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
            className="h-full rounded-full transition-all"
            style={{
              width: `${project.progress}%`,
              backgroundColor: project.color,
            }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        <span className="text-[11px] text-muted">{project.teamName}</span>
        <ProjectMembers members={project.members} />
      </div>
    </Card>
  );
}
