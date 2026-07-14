import ProjectMembers from "./ProjectMembers";
import TeamGlassCard from "../../teams/components/TeamGlassCard";
import { useProjectStore } from "../projectStore";

const statusBadge = {
  planning: "glass-badge--violet",
  active: "glass-badge--amber",
  completed: "glass-badge--primary",
};

export default function ProjectCard({ project }) {
  const openProjectView = useProjectStore((s) => s.openProjectView);

  return (
    <TeamGlassCard
      onClick={() => openProjectView(project)}
      className="flex flex-col gap-3"
      front={
        <>
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: project.color }}
              />
              <h4 className="glass-card__title !mb-0 !text-base text-white">
                {project.name}
              </h4>
            </div>
            <span className={`glass-badge ${statusBadge[project.status]} shrink-0`}>
              {project.status}
            </span>
          </div>

          {project.description && (
            <p className="text-xs text-white/50 line-clamp-2">
              {project.description}
            </p>
          )}

          <div>
            <div className="flex justify-between text-[11px] text-white/40 mb-1">
              <span>Progress</span>
              <span>{project.progress}%</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
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
            <span className="text-[11px] text-white/40">{project.teamName}</span>
            <ProjectMembers members={project.members} />
          </div>
        </>
      }
      back={
        <div className="text-white p-2">
          <h5 className="font-semibold mb-2 text-sm text-orange-200">Project Details</h5>
          <p className="text-xs text-white/70">
            Team: {project.teamName}
          </p>
        </div>
      }
    />
  );
}
