import { Plus } from "lucide-react";
import { useProjectStore } from "../Features/projects/projectStore";
import ProjectCard from "../Features/projects/components/ProjectCard";
import ProjectModal from "../Features/projects/components/ProjectModal";
import Button from "../components/ui/Button";
import { useRef } from "react";
import TeamFluidCursor from "../Features/teams/components/TeamFluidCursor";

   export default function Projects() {
  const { projects, openCreateModal } = useProjectStore();
  const containerRef = useRef(null);

  return (
    <div>
         <div ref={containerRef} className="relative overflow-hidden min-h-screen w-full">
      <TeamFluidCursor containerRef={containerRef} />
      <div className="flex items-center justify-between mb-6">
        <h2
          className="text-4xl font-semibold text-white"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Projects
        </h2>
        <Button variant="primary" onClick={openCreateModal}>
          <Plus size={14} className="inline mr-1.5 -mt-0.5" /> New Project
        </Button>
      </div>

      {projects.length === 0 ? (
        <p className="text-sm text-muted text-center py-12">
          No projects yet. Create one to get started.
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      <ProjectModal />
    </div>
    </div>
  );
}
