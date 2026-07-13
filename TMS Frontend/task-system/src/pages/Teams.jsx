import { useRef } from "react";
import { Plus } from "lucide-react";
import { useTeamStore } from "../Features/teams/teamStore";
import TeamCard from "../Features/teams/components/TeamCard";
import TeamModal from "../Features/teams/components/TeamModal";
import Button from "../components/ui/Button";
import TeamFluidCursor from "../Features/teams/components/TeamFluidCursor";

export default function Teams() {
  const { teams, openCreateModal, openEditModal } = useTeamStore();
  const containerRef = useRef(null);

  return (
    // <div ref={containerRef} className="relative overflow-hidden">
    // NAYA CODE:
<div ref={containerRef} className="relative overflow-hidden min-h-screen w-full">
      <TeamFluidCursor containerRef={containerRef} />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <h2
            className="text-4xl font-semibold text-white"
            style={{ fontFamily: "var(--font-display)" }}
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
    </div>
  );
}