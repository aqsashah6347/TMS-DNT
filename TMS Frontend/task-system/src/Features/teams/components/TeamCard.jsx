import { Users } from "lucide-react";
import ProjectMembers from "../../projects/components/ProjectMembers";
import TeamWorkload from "./TeamWorkload";
import TeamGlassCard from "./TeamGlassCard";

export default function TeamCard({ team, onClick }) {
  return (
    <TeamGlassCard 
      onClick={() => onClick?.(team)} 
      className="flex flex-col gap-4"
      // Front side ka content yahan aayega
      front={
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-orange-300" />
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
        </>
      }
      // Back side ka content yahan aayega (jo flip honay par dikhega)
      back={
        <div className="text-white p-2">
          <h5 className="font-semibold mb-2 text-sm text-orange-200">Team Details</h5>
          <p className="text-xs text-white/70">
            Total Members: {team.members?.length || 0}
          </p>
          {/* Aap yahan piche dikhane ke liye koi bhi mazeed data add kar sakte hain */}
        </div>
      }
    />
  );
}