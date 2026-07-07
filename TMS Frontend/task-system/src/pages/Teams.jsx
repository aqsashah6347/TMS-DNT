import { Plus } from "lucide-react";
import { useTeamStore } from "../features/teams/teamStore";
import TeamCard from "../features/teams/components/TeamCard";
import TeamModal from "../features/teams/components/TeamModal";
import Button from "../components/ui/Button";

export default function Teams() {
  const { teams, openCreateModal, openEditModal } = useTeamStore();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2
          className="text-2xl text-white"
          style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}
        >
          Teams
        </h2>
        <Button variant="primary" onClick={openCreateModal}>
          <Plus size={14} className="inline mr-1.5 -mt-0.5" /> New Team
        </Button>
      </div>

      {teams.length === 0 ? (
        <p className="text-sm text-muted text-center py-12">
          No teams yet. Create one to get started.
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {teams.map((team) => (
            <TeamCard key={team.id} team={team} onClick={openEditModal} />
          ))}
        </div>
      )}

      <TeamModal />
    </div>
  );
}
