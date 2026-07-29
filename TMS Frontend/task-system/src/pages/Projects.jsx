import { useEffect, useMemo } from "react";
import { Plus, Search, X, SlidersHorizontal } from "lucide-react";
import { useProjectStore } from "../Features/projects/projectStore";
import { useTaskStore } from "../Features/tasks/taskStore";
import ProjectCard from "../Features/projects/components/ProjectCard";
import ProjectModal from "../Features/projects/components/ProjectModal";
import ProjectFiltersModal from "../Features/projects/components/ProjectFiltersModal";
import TaskModal from "../Features/tasks/components/TaskModal";
import Button from "../components/ui/Button";
import { usePermissionStore } from "../store/usePermissionStore";
import { useAuthStore } from "../store/useAuthStore";

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
  const canCreateProject = usePermissionStore((s) =>
    s.can("projects", "create"),
  );
  const { user } = useAuthStore();
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    fetchProjects();
    fetchTasks();
  }, [fetchProjects, fetchTasks]);

  const filteredProjects = getFilteredProjects();
  const hasStructuredFilters = Boolean(filters.status || filters.teamId);

  // One row per team — projects with no team (teamId null) fall into their
  // own "No Team" row at the end instead of being dropped. Rows are built
  // fresh from filteredProjects on every render so search/status/team
  // filters, and whichever projects the backend decided this user can see,
  // stay in sync automatically.
  const teamRows = useMemo(() => {
    if (!isAdmin) return null;
    const groups = new Map();
    for (const project of filteredProjects) {
      const key = project.teamId ?? "none";
      if (!groups.has(key)) {
        groups.set(key, {
          teamId: project.teamId ?? null,
          teamName: project.teamName || "No Team",
          projects: [],
        });
      }
      groups.get(key).projects.push(project);
    }
    // Named teams first (alphabetical), "No Team" always last.
    return [...groups.values()].sort((a, b) => {
      if (a.teamId === null) return 1;
      if (b.teamId === null) return -1;
      return a.teamName.localeCompare(b.teamName);
    });
  }, [filteredProjects, isAdmin]);

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

          {canCreateProject && (
            <Button variant="primary" onClick={openCreateModal}>
              <Plus size={14} className="inline mr-1.5 -mt-0.5" /> New Project
            </Button>
          )}
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 mb-4">
          {error}
        </p>
      )}

      {isLoading ? (
        <p className="text-white/50 text-sm">Loading projects…</p>
      ) : filteredProjects.length === 0 ? (
        <p className="text-white/50 text-sm">No projects match your filters.</p>
      ) : isAdmin ? (
        // Admin-only view: every visible project, split into a
        // horizontally-scrolling row per team.
        <div className="flex flex-col gap-8">
          {teamRows.map((row) => (
            <div key={row.teamId ?? "none"}>
              <div className="flex items-center gap-3 mb-3">
                <h3 className="text-lg font-semibold text-white">
                  {row.teamName}
                </h3>
                <span className="text-xs font-medium text-white/40 bg-white/5 border border-white/10 rounded-full px-2.5 py-0.5">
                  {row.projects.length} project
                  {row.projects.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex gap-6 overflow-x-auto pb-2 -mx-1 px-1">
                {row.projects.map((project) => (
                  <div key={project.id} className="w-80 shrink-0">
                    <ProjectCard project={project} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Everyone else: plain grid of whatever projects the backend
        // decided this user can see (their own + any team they manage).
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
