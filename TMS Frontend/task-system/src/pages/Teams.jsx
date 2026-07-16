import { useEffect, useRef } from "react";
import { Plus } from "lucide-react";
import { useTeamStore } from "../Features/teams/teamStore";
import { useAuthStore } from "../store/useAuthStore";
import { useTaskStore } from "../Features/tasks/taskStore";
import { useProjectStore } from "../Features/projects/projectStore";
import TeamCard from "../Features/teams/components/TeamCard";
import TeamModal from "../Features/teams/components/TeamModal";
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
    openEditModal,
  } = useTeamStore();
  const fetchTasks = useTaskStore((s) => s.fetchTasks);
  const fetchProjects = useProjectStore((s) => s.fetchProjects);
  const containerRef = useRef(null);

  useEffect(() => {
    // Admin/manager get the full teams collection; the "user" role only
    // ever needs their own team, fetched inside MyTeamView instead.
    // Tasks + projects are fetched here too so TeamCard's workload bars
    // and "Active Projects" back face reflect real assignments instead
    // of whatever happened to already be in the store.
    if (!isUserRole) {
      fetchTeams();
      fetchTasks();
      fetchProjects();
    }
  }, [isUserRole, fetchTeams, fetchTasks, fetchProjects]);
  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden min-h-screen w-full"
    >
      <TeamFluidCursor containerRef={containerRef} />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <h2
            className="text-4xl font-semibold text-white"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {isUserRole ? "My Team" : "Teams"}
          </h2>
          {/* Only admins can create teams — hidden for every other role. */}
          {isAdmin && (
            <Button variant="primary" onClick={openCreateModal}>
              <Plus size={14} className="inline mr-1.5 -mt-0.5" /> New Team
            </Button>
          )}
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
            ) : (
              <div className="grid grid-cols-3 gap-4">
                {teams.map((team) => (
                  <TeamCard
                    key={team.id}
                    team={team}
                    onClick={isAdmin ? openEditModal : undefined}
                  />
                ))}
              </div>
            )}
          </>
        )}

        <TeamModal />
      </div>
    </div>
  );
}
