import { Users } from "lucide-react";
import ProjectMembers from "../../projects/components/ProjectMembers";
import TeamWorkload from "./TeamWorkload";
import Card from "../../../components/ui/Card";

export default function TeamCard({ team, onClick }) {
  return (
    <Card
      hover
      onClick={() => onClick?.(team)}
      className="cursor-pointer flex flex-col gap-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users size={16} className="text-emerald-300" />
          <h4 className="glass-card__title !mb-0 !text-base text-white">
            {team.name}
          </h4>
        </div>
        <ProjectMembers members={team.members} />
      </div>

      <div>
        <p className="text-[11px] text-white/40 mb-2">Workload</p>
        <TeamWorkload members={team.members} />
      </div>
    </Card>
  );
}
