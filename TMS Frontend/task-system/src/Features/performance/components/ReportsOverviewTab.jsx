// src/Features/performance/components/ReportsOverviewTab.jsx
import { useEffect, useMemo, useState } from "react";
import {
  ClipboardCheck,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Crown,
  Send,
  Lock,
} from "lucide-react";
import { monthlyReportApi } from "../../../api/monthlyReportApi";
import { initials } from "../utils";
import ReportsTeamModal from "./ReportsTeamModal";
import ReportLogsModal from "./ReportLogsModal";

const AVATAR_PALETTE = [
  "#fb923c",
  "#60a5fa",
  "#34d399",
  "#a78bfa",
  "#f472b6",
  "#facc15",
  "#22d3ee",
];

function colorFor(id, fallback) {
  if (fallback) return fallback;
  return AVATAR_PALETTE[Math.abs(id || 0) % AVATAR_PALETTE.length];
}

const STATUS_META = {
  pending: {
    label: "Not filed",
    className: "bg-white/10 text-white/50 border-white/15",
  },
  submitted: {
    label: "Submitted",
    icon: Send,
    className: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  },
  released: {
    label: "Released",
    icon: Lock,
    className: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  },
};

// Bento sizing: bigger rosters get bigger tiles, so the grid reads as
// intentional blocks rather than a repeated card list.
function spanFor(memberCount) {
  if (memberCount >= 7) return "sm:col-span-2 xl:col-span-2 row-span-2";
  if (memberCount >= 4) return "sm:col-span-2 xl:col-span-2";
  return "sm:col-span-1 xl:col-span-1";
}

// Compact inline metric — value + label side by side, no vertical stack,
// so the whole summary strip stays a single thin row.
function MetricChip({ label, value, accent = "text-white" }) {
  return (
    <span className="flex items-baseline gap-1 whitespace-nowrap">
      <span className={`text-sm font-semibold ${accent}`}>{value}</span>
      <span className="text-[11px] text-white/40">{label}</span>
    </span>
  );
}

function MemberChip({ member }) {
  return (
    <span
      title={
        member.marked
          ? `Marked${member.rating !== null ? ` · ${member.rating}/10` : ""}`
          : "Not marked yet"
      }
      className={`inline-flex items-center gap-1.5 pl-1 pr-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors ${
        member.marked
          ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
          : "bg-white/5 border-white/10 text-white/50"
      }`}
    >
      <span
        className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-semibold shrink-0"
        style={{
          background: `${colorFor(member.id, member.avatarColor)}33`,
          color: colorFor(member.id, member.avatarColor),
        }}
      >
        {initials(member.name)}
      </span>
      {member.name}
      {member.marked ? (
        <CheckCircle2 size={12} className="text-emerald-400 shrink-0" />
      ) : (
        <Circle size={10} className="text-white/25 shrink-0" />
      )}
    </span>
  );
}

// Clicking a non-empty box opens ReportsTeamModal for that team, where
// scores can be set/updated and the manager's visibility override lives.
function TeamBox({ team, onClick }) {
  const status = STATUS_META[team.status] || STATUS_META.pending;
  const StatusIcon = status.icon;
  const empty = team.totalCount === 0;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={empty}
      className={`text-left rounded-3xl border p-5 flex flex-col gap-4 transition-colors hover:-translate-y-0.5 disabled:cursor-default disabled:hover:translate-y-0 ${spanFor(team.totalCount)} ${
        team.fullyMarked
          ? "bg-emerald-500/[0.07] border-emerald-500/30"
          : "bg-white/[0.03] border-white/10"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ background: team.teamColor || "#fb923c" }}
            />
            <p className="text-base font-semibold text-white truncate">
              {team.teamName}
            </p>
          </div>
          <div className="flex items-center gap-1.5 mt-1.5 text-xs text-white/50">
            <Crown size={12} className="text-amber-400 shrink-0" />
            <span className="truncate">{team.managerName}</span>
          </div>
        </div>

        {team.fullyMarked ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shrink-0">
            <CheckCircle2 size={13} /> Complete
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 shrink-0">
            {team.markedCount}/{team.totalCount} marked
          </span>
        )}
      </div>

      {empty ? (
        <p className="text-xs text-white/35 italic">
          No employees assigned to this team yet.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2 content-start">
          {team.members.map((m) => (
            <MemberChip key={m.id} member={m} />
          ))}
        </div>
      )}

      <div className="mt-auto pt-2 flex items-center justify-between">
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium border ${status.className}`}
        >
          {StatusIcon && <StatusIcon size={11} />}
          {status.label}
          {team.forceVisible && (
            <span className="ml-1 text-orange-300">· override on</span>
          )}
        </span>
        {!empty && (
          <div className="w-24 h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className={`h-full rounded-full ${team.fullyMarked ? "bg-emerald-400" : "bg-amber-400"}`}
              style={{
                width: `${Math.round((team.markedCount / team.totalCount) * 100)}%`,
              }}
            />
          </div>
        )}
      </div>
    </button>
  );
}

export default function ReportsOverviewTab() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openTeamId, setOpenTeamId] = useState(null);
  const [logsOpen, setLogsOpen] = useState(false);

  // Re-fetches in place (no loading spinner) — used after a rating is
  // saved or the visibility toggle is flipped inside a modal, so
  // whatever's open behind it is already fresh by the time it's closed.
  function refresh() {
    monthlyReportApi
      .getOverview()
      .then(setData)
      .catch((err) =>
        setError(err.response?.data?.message || "Couldn't load report status"),
      );
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await monthlyReportApi.getOverview();
        if (!cancelled) setData(res);
      } catch (err) {
        if (!cancelled)
          setError(
            err.response?.data?.message || "Couldn't load report status",
          );
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const summary = useMemo(() => {
    if (!data) return null;
    const teams = data.teams.filter((t) => t.totalCount > 0);
    const fullyMarked = teams.filter((t) => t.fullyMarked).length;
    const notStarted = teams.filter((t) => t.markedCount === 0).length;
    const totalEmployees = teams.reduce((s, t) => s + t.totalCount, 0);
    const totalMarked = teams.reduce((s, t) => s + t.markedCount, 0);
    const pending = teams.filter((t) => !t.fullyMarked);
    return {
      teamCount: teams.length,
      fullyMarked,
      inProgress: teams.length - fullyMarked - notStarted,
      notStarted,
      totalEmployees,
      totalMarked,
      pendingCount: pending.length,
    };
  }, [data]);

  const periodLabel = data
    ? new Date(data.period.year, data.period.month - 1).toLocaleString(
        "en-US",
        { month: "long", year: "numeric" },
      )
    : "";

  if (isLoading) {
    return (
      <p className="text-sm text-white/50 text-center py-16">
        Loading report status…
      </p>
    );
  }

  if (error) {
    return (
      <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
        {error}
      </p>
    );
  }

  const teamsWithRoster = data.teams.filter((t) => t.totalCount > 0);
  const teamsWithoutRoster = data.teams.filter((t) => t.totalCount === 0);
  const openTeam = data.teams.find((t) => t.teamId === openTeamId) || null;

  return (
    <div className="flex flex-col">
      {/* ── Compact header row: title, inline metrics, Report Logs ─── */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2 shrink-0">
          <ClipboardCheck size={16} className="text-orange-400" />
          <h3 className="text-sm font-semibold text-white">
            Monthly Reports
            <span className="text-white/40 font-normal"> — {periodLabel}</span>
          </h3>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-3.5">
            <MetricChip label="teams" value={summary.teamCount} />
            <MetricChip
              label="filed"
              value={summary.fullyMarked}
              accent="text-emerald-400"
            />
            <MetricChip
              label="in progress"
              value={summary.inProgress}
              accent="text-blue-400"
            />
            <MetricChip
              label="not started"
              value={summary.notStarted}
              accent={summary.notStarted > 0 ? "text-amber-400" : "text-white"}
            />
            <MetricChip
              label="marked"
              value={`${summary.totalMarked}/${summary.totalEmployees}`}
            />
          </div>

          <button
            type="button"
            onClick={() => setLogsOpen(true)}
            className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition-colors shrink-0"
          >
            <AlertTriangle size={13} />
            Report Logs
            {summary.pendingCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-[1.1rem] h-[1.1rem] px-1 rounded-full bg-amber-400 text-[10px] font-bold text-black">
                {summary.pendingCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── Body: just the team boxes ────────────────────────────── */}
      {teamsWithRoster.length === 0 ? (
        <p className="text-sm text-white/50 text-center py-16">
          No teams with employees yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 auto-rows-[minmax(150px,auto)] grid-flow-dense gap-4">
          {teamsWithRoster.map((team) => (
            <TeamBox
              key={team.teamId}
              team={team}
              onClick={() => setOpenTeamId(team.teamId)}
            />
          ))}
        </div>
      )}

      {teamsWithoutRoster.length > 0 && (
        <p className="text-[11px] text-white/30 mt-4">
          {teamsWithoutRoster.length} team
          {teamsWithoutRoster.length === 1 ? "" : "s"} with no employees
          assigned ({teamsWithoutRoster.map((t) => t.teamName).join(", ")}) not
          shown above.
        </p>
      )}

      <ReportsTeamModal
        team={openTeam}
        isOpen={openTeamId !== null}
        onClose={() => setOpenTeamId(null)}
        onChanged={refresh}
      />

      <ReportLogsModal
        teams={data.teams}
        isOpen={logsOpen}
        onClose={() => setLogsOpen(false)}
        onSelectTeam={(teamId) => {
          setLogsOpen(false);
          setOpenTeamId(teamId);
        }}
      />
    </div>
  );
}
