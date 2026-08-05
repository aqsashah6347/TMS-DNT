// src/Features/performance/components/TeamPerformanceSidebar.jsx
import { Crown, Users } from "lucide-react";
import { initials, formatDuration } from "../utils";

const RANK_BADGE = [
  "border-amber-400/50 bg-amber-400/10 text-amber-300",
  "border-white/25 bg-white/10 text-white/70",
  "border-orange-700/40 bg-orange-700/10 text-orange-300",
];

export default function TeamPerformanceSidebar({
  teams,
  selectedId,
  onSelect,
}) {
  return (
    <div className="w-full lg:w-80 shrink-0 flex flex-col lg:h-[calc(100vh-14rem)]">
      <div className="flex items-center justify-between mb-3 px-1">
        <p className="text-xs font-medium text-white/40 uppercase tracking-wider">
          Teams by efficiency
        </p>
        <span className="text-[11px] text-white/30">{teams.length}</span>
      </div>

      {teams.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center rounded-2xl border border-white/10 bg-white/5">
          <Users className="w-8 h-8 text-white/15 mb-2" />
          <p className="text-sm text-white/50">No teams yet.</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1">
          {teams.map((team, i) => {
            const rank = i + 1;
            const isSelected = team.id === selectedId;
            const color = team.color || "#fb923c";
            return (
              <button
                key={team.id}
                type="button"
                onClick={() => onSelect(team.id)}
                className={`w-full text-left rounded-2xl border p-3.5 transition-colors ${
                  isSelected
                    ? "border-orange-500/40 bg-orange-500/10"
                    : "border-white/10 bg-white/5 hover:bg-white/[0.07] hover:border-white/20"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border ${
                      rank <= 3
                        ? RANK_BADGE[rank - 1]
                        : "border-white/10 bg-white/5 text-white/50"
                    }`}
                  >
                    {rank === 1 ? <Crown size={14} /> : rank}
                  </div>

                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: color }}
                  />

                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-sm font-medium truncate ${
                        isSelected ? "text-white" : "text-white/85"
                      }`}
                    >
                      {team.name}
                    </p>
                    <p className="text-[11px] text-white/40 truncate">
                      {initials(team.managerName)} · {team.memberCount} member
                      {team.memberCount !== 1 ? "s" : ""}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <p
                      className={`text-sm font-semibold ${
                        isSelected ? "text-orange-400" : "text-white"
                      }`}
                    >
                      {team.completionRate}%
                    </p>
                    <p className="text-[10px] text-white/40">
                      {formatDuration(team.avgCompletionDays)} avg
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
