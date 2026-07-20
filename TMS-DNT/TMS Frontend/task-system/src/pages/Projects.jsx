import { useEffect } from "react";
import { Plus, Search, X, SlidersHorizontal } from "lucide-react";
import { useProjectStore } from "../Features/projects/projectStore";
import { useTaskStore } from "../Features/tasks/taskStore";
import ProjectCard from "../Features/projects/components/ProjectCard";
import ProjectModal from "../Features/projects/components/ProjectModal";
import ProjectFiltersModal from "../Features/projects/components/ProjectFiltersModal";
import TaskModal from "../Features/tasks/components/TaskModal";
import Button from "../components/ui/Button";

export default function Projects() {
  const {
    projects,
    isLoading,
    error,
    fetchProjects,
    openCreateModal,
    filters,
    setFilters,
    openFiltersModal,
    getFilteredProjects,
  } = useProjectStore();
  const fetchTasks = useTaskStore((s) => s.fetchTasks);
  const allTasks = useTaskStore((s) => s.tasks);

  useEffect(() => {
    fetchProjects();
    fetchTasks();
  }, [fetchProjects, fetchTasks]);

  const filteredProjects = getFilteredProjects();
  const hasStructuredFilters = Boolean(filters.status || filters.teamId);

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <h2
          className="text-4xl font-semibold text-white flex items-center gap-3"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Projects
          <span className="text-base font-medium text-orange-300 bg-orange-500/10 border border-orange-400/30 rounded-full px-3 py-1">
            {filteredProjects.length} project
            {filteredProjects.length !== 1 ? "s" : ""}
          </span>
          <span className="text-base font-medium text-orange-300 bg-orange-500/10 border border-orange-400/30 rounded-full px-3 py-1">
            {allTasks.length} task{allTasks.length !== 1 ? "s" : ""}
          </span>
        </h2>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 w-64 rounded-full border border-white/10 bg-[#2a2d34] px-4 py-2 transition-all duration-300 hover:border-orange-500/60 focus-within:border-orange-500 focus-within:shadow-[0_0_18px_rgba(249,115,22,0.25)]">
            <Search size={16} className="text-orange-400 shrink-0" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({ search: e.target.value })}
              placeholder="Search projects..."
              className="w-full bg-transparent text-sm text-white placeholder:text-white/40 outline-none"
            />
            {filters.search && (
              <button
                onClick={() => setFilters({ search: "" })}
                className="text-white/40 hover:text-white transition-colors shrink-0"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <Button variant="secondary" onClick={openFiltersModal}>
            <SlidersHorizontal size={14} className="inline mr-1.5 -mt-0.5" />
            Filters
            {hasStructuredFilters && (
              <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-orange-400" />
            )}
          </Button>

          <Button variant="primary" onClick={openCreateModal}>
            <Plus size={14} className="inline mr-1.5 -mt-0.5" /> New Project
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-4 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {isLoading && projects.length === 0 ? (
        <p className="text-sm text-muted text-center py-12">
          Loading projects…
        </p>
      ) : projects.length === 0 ? (
        <p className="text-sm text-muted text-center py-12">
          No projects yet. Create one to get started.
        </p>
      ) : filteredProjects.length === 0 ? (
        <p className="text-sm text-muted text-center py-12">
          No projects match your search or filters.
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      <ProjectModal />
      <ProjectFiltersModal />
      <TaskModal />
    </div>
  );
}