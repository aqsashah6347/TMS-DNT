import { useEffect, useRef } from "react";
import { Plus, Search, X, SlidersHorizontal } from "lucide-react";
import { useTeamStore } from "../Features/teams/teamStore";
import { useAuthStore } from "../store/useAuthStore";
import { useTaskStore } from "../Features/tasks/taskStore";
import { useProjectStore } from "../Features/projects/projectStore";
import TeamCard from "../Features/teams/components/TeamCard";
import TeamModal from "../Features/teams/components/TeamModal";
import TeamFiltersModal from "../Features/teams/components/TeamFiltersModal";
import MyTeamView from "../Features/teams/components/MyTeamView";
import Button from "../components/ui/Button";
import TeamFluidCursor from "../Features/teams/components/TeamFluidCursor";

export default function Teams() {
  const { user } = useAuthStore();
  const isUserRole = user?.role === "user";
  const isAdmin = user?.role === "admin";

  const {
    teams,
    isLoading,
    error,
    fetchTeams,
    openCreateModal,
    openTeamView,
    filters,
    setFilters,
    openFiltersModal,
    getFilteredTeams,
  } = useTeamStore();
  const fetchTasks = useTaskStore((s) => s.fetchTasks);
  const allTasks = useTaskStore((s) => s.tasks);
  const fetchProjects = useProjectStore((s) => s.fetchProjects);
  const containerRef = useRef(null);

  useEffect(() => {
    // Admin/manager get the full teams collection; the "user" role only
    // ever needs their own team, fetched inside MyTeamView instead.
    // Tasks + projects are fetched here too so TeamCard's workload bars
    // and "Active Projects" back face reflect real assignments instead
    // of whatever happened to already be in the store — and now also so
    // the header's task count is real, live data.
    if (!isUserRole) {
      fetchTeams();
      fetchTasks();
      fetchProjects();
    }
  }, [isUserRole, fetchTeams, fetchTasks, fetchProjects]);

  const filteredTeams = getFilteredTeams();
  const hasManagerFilter = Boolean(filters.managerId);

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden min-h-screen w-full"
    >
      <TeamFluidCursor containerRef={containerRef} />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <h2
            className="text-4xl font-semibold text-white flex items-center gap-3"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {isUserRole ? "My Team" : "Teams"}
            {!isUserRole && (
              <>
                <span className="text-base font-medium text-orange-300 bg-orange-500/10 border border-orange-400/30 rounded-full px-3 py-1">
                  {filteredTeams.length} team
                  {filteredTeams.length !== 1 ? "s" : ""}
                </span>
                <span className="text-base font-medium text-orange-300 bg-orange-500/10 border border-orange-400/30 rounded-full px-3 py-1">
                 {(allTasks?.length ?? 0)} task{(allTasks?.length ?? 0) !== 1 ? "s" : ""}
                </span>
              </>
            )}
          </h2>

          <div className="flex items-center gap-3">
            {!isUserRole && (
              <>
                <div className="flex items-center gap-2 w-64 rounded-full border border-white/10 bg-[#2a2d34] px-4 py-2 transition-all duration-300 hover:border-orange-500/60 focus-within:border-orange-500 focus-within:shadow-[0_0_18px_rgba(249,115,22,0.25)]">
                  <Search size={16} className="text-orange-400 shrink-0" />
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => setFilters({ search: e.target.value })}
                    placeholder="Search teams..."
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
                  <SlidersHorizontal
                    size={14}
                    className="inline mr-1.5 -mt-0.5"
                  />
                  Filters
                  {hasManagerFilter && (
                    <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-orange-400" />
                  )}
                </Button>
              </>
            )}

            {/* Only admins can create teams — hidden for every other role. */}
            {isAdmin && (
              <Button variant="primary" onClick={openCreateModal}>
                <Plus size={14} className="inline mr-1.5 -mt-0.5" /> New Team
              </Button>
            )}
          </div>
        </div>

        {isUserRole ? (
          <MyTeamView />
        ) : (
          <>
            {error && (
              <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 mb-4">
                {error}
              </p>
            )}

            {isLoading ? (
              <p className="text-sm text-muted text-center py-12">
                Loading teams…
              </p>
            ) : teams.length === 0 ? (
              <p className="text-sm text-muted text-center py-12">
                No teams yet. {isAdmin ? "Create one to get started." : ""}
              </p>
            ) : filteredTeams.length === 0 ? (
              <p className="text-sm text-muted text-center py-12">
                No teams match your search or filters.
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                {filteredTeams.map((team) => (
                  <TeamCard
                    key={team.id}
                    team={team}
                    onClick={isAdmin ? openTeamView : undefined}
                  />
                ))}
              </div>
            )}
          </>
        )}

        <TeamModal />
        <TeamFiltersModal />
      </div>
    </div>
  );
}