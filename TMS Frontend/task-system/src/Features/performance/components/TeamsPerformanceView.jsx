import { useState } from "react";
import { Crown, Users, ChevronDown, Zap } from "lucide-react";

const RANK_STYLES = [
  "border-amber-400/50 bg-amber-400/10",
  "border-white/20 bg-white/5",
  "border-orange-700/40 bg-orange-700/10",
];

function formatDuration(days) {
  if (days === null || days === undefined || Number.isNaN(days)) return "—";
  if (days < 1) return `${Math.round(days * 24)}h`;
  return `${days.toFixed(1)}d`;
}

function TeamRow({ team, rank }) {
  const [expanded, setExpanded] = useState(false);
  const isTop = rank === 1;

  return (
    <div
      className={`rounded-2xl border p-4 transition-colors ${
        isTop
          ? RANK_STYLES[0]
          : "border-white/10 bg-white/5 hover:bg-white/[0.07]"
      }`}
    >
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center gap-4 text-left"
      >
        <div
          className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold border ${
            rank <= 3
              ? RANK_STYLES[rank - 1]
              : "border-white/10 bg-white/5 text-white/50"
          }`}
        >
          {isTop ? <Crown size={16} className="text-amber-300" /> : rank}
        </div>

        <div
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{ background: team.color || "#fb923c" }}
        />

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white truncate">
            {team.name}
          </p>
          <p className="text-xs text-white/40 truncate">
            Manager: {team.managerName || "Unassigned"} · {team.memberCount}{" "}
            member
            {team.memberCount !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="hidden sm:flex items-center gap-6 shrink-0 text-sm">
          <div className="text-center">
            <p className="text-white font-semibold">
              {team.completed}/{team.assigned}
            </p>
            <p className="text-[10px] text-white/40 uppercase tracking-wide">
              Done
            </p>
          </div>
          <div className="text-center">
            <p className="text-orange-400 font-semibold">
              {team.completionRate}%
            </p>
            <p className="text-[10px] text-white/40 uppercase tracking-wide">
              Rate
            </p>
          </div>
          <div className="text-center">
            <p className="text-white font-semibold">
              {formatDuration(team.avgCompletionDays)}
            </p>
            <p className="text-[10px] text-white/40 uppercase tracking-wide">
              Avg Time
            </p>
          </div>
        </div>

        <ChevronDown
          size={16}
          className={`text-white/40 shrink-0 transition-transform duration-200 ${
            expanded ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Mobile-only stat row */}
      <div className="sm:hidden flex items-center justify-between mt-3 text-xs text-white/60">
        <span>
          {team.completed}/{team.assigned} done
        </span>
        <span className="text-orange-400">{team.completionRate}%</span>
        <span>{formatDuration(team.avgCompletionDays)} avg</span>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-white/10">
          {team.mostEfficientMember && (
            <div className="flex items-center gap-2 mb-3 rounded-xl bg-orange-500/10 border border-orange-400/20 px-3 py-2 text-sm">
              <Zap size={14} className="text-orange-400 shrink-0" />
              <span className="text-white/70">
                Most efficient:{" "}
                <span className="text-white font-medium">
                  {team.mostEfficientMember.name}
                </span>
                {" — "}
                {team.mostEfficientMember.completed} completed,{" "}
                {formatDuration(team.mostEfficientMember.avgCompletionDays)} avg
              </span>
            </div>
          )}

          {team.members.length === 0 ? (
            <p className="text-xs text-white/40">
              No members assigned to this team yet.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {team.members.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm"
                >
                  <span className="text-white/80 truncate">{m.name}</span>
                  <span className="text-white/40 text-xs shrink-0 ml-2">
                    {m.completed}/{m.assigned} ·{" "}
                    {formatDuration(m.avgCompletionDays)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function TeamsPerformanceView({ teams }) {
  if (teams.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Users className="w-10 h-10 text-white/20 mb-3" />
        <p className="text-sm text-white/50">No teams yet.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {teams.map((team, i) => (
        <TeamRow key={team.id} team={team} rank={i + 1} />
      ))}
    </div>
  );
}
