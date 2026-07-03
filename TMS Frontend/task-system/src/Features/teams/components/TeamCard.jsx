import { Users } from "lucide-react";
import ProjectMembers from "../../projects/components/ProjectMembers";
import TeamWorkload from "./TeamWorkload";
import Card from "../../../components/ui/Card";

export default function TeamCard({ team, onClick }) {
  return (
    <Card
      hover
      onClick={() => onClick?.(team)}
      className="p-5 cursor-pointer flex flex-col gap-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users size={16} className="text-primary" />
          <h4 className="text-base font-semibold text-dark">{team.name}</h4>
        </div>
        <ProjectMembers members={team.members} />
      </div>

      <div>
        <p className="text-[11px] text-muted mb-2">Workload</p>
        <TeamWorkload members={team.members} />
      </div>
    </Card>
  );
}
