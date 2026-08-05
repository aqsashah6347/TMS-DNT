// src/Features/performance/components/TeamPerformanceDetail.jsx
import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Users, Zap, AlertTriangle, Crown } from "lucide-react";
import RadialProgress from "../../../components/ui/RadialProgress";
import {
  initials,
  formatDuration,
  STATUS_COLORS,
  TOOLTIP_STYLE,
} from "../utils";

const STATUS_LABELS = {
  backlog: "Backlog",
  "in progress": "In Progress",
  review: "Review",
  done: "Done",
};

export default function TeamPerformanceDetail({ team, rank }) {
  const members = team?.members || [];

  const overdueCount = useMemo(
    () => members.reduce((sum, m) => sum + (m.overdue || 0), 0),
    [members],
  );

  const chartData = useMemo(() => {
    const counts = { backlog: 0, "in progress": 0, review: 0, done: 0 };
    members.forEach((m) => {
      Object.keys(counts).forEach((key) => {
        counts[key] += m.statusCounts?.[key] || 0;
      });
    });
    return Object.entries(STATUS_LABELS).map(([key, label]) => ({
      status: label,
      count: counts[key],
      color: STATUS_COLORS[key],
    }));
  }, [members]);

  if (!team) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center py-24 rounded-2xl border border-white/10 bg-white/5">
        <Users className="w-10 h-10 text-white/15 mb-3" />
        <p className="text-sm text-white/50">No team selected.</p>
      </div>
    );
  }

  const color = team.color || "#fb923c";

  return (
    <div className="flex-1 min-w-0 rounded-2xl border border-white/10 bg-white/5 p-5 lg:p-6">
      <div className="team-stats">
        {/* Hero */}
        <div className="team-stats__hero">
          <div className="team-stats__hero-identity">
            <span
              className="team-stats__dot"
              style={{ background: color }}
              aria-hidden="true"
            />
            <div>
              <p className="team-stats__eyebrow">Rank #{rank} · Managed by</p>
              <div className="team-stats__manager">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0"
                  style={{
                    background: `${color}22`,
                    border: `1px solid ${color}55`,
                    color,
                  }}
                >
                  {initials(team.managerName)}
                </div>
                <span className="team-stats__manager-name">
                  {team.managerName || "Unassigned"}
                </span>
              </div>
            </div>
          </div>

          <div className="team-stats__hero-stats">
            <div className="team-stats__stat">
              <span className="team-stats__stat-value">{team.memberCount}</span>
              <span className="team-stats__stat-label">Members</span>
            </div>
            <div className="team-stats__stat">
              <span
                className="team-stats__stat-value"
                style={{ color: "var(--color-accent-primary, #fb923c)" }}
              >
                {team.assigned}
              </span>
              <span className="team-stats__stat-label">Assigned</span>
            </div>
            <div className="team-stats__stat">
              <span
                className="team-stats__stat-value"
                style={{ color: "#34d399" }}
              >
                {team.completed}
              </span>
              <span className="team-stats__stat-label">Completed</span>
            </div>
            <div className="team-stats__stat">
              <span
                className="team-stats__stat-value"
                style={{ color: overdueCount > 0 ? "#f87171" : "#34d399" }}
              >
                {overdueCount}
              </span>
              <span className="team-stats__stat-label">Overdue</span>
            </div>
          </div>
        </div>

        {/* Most efficient member banner */}
        {team.mostEfficientMember && (
          <div className="flex items-center gap-2 rounded-xl bg-orange-500/10 border border-orange-400/20 px-4 py-2.5 text-sm">
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

        {/* Bento row: completion ring + status breakdown */}
        <div className="team-stats__bento-row">
          <div className="team-stats__cell team-stats__cell--pulse">
            <p className="team-stats__cell-label">Team Pulse</p>
            <RadialProgress
              value={team.completionRate}
              size={104}
              strokeWidth={9}
              color={color}
            >
              <span className="team-stats__ring-pct">
                {team.completionRate}%
              </span>
              <span className="team-stats__ring-caption">complete</span>
            </RadialProgress>
            <p className="team-stats__pulse-footer">
              {team.completed} of {team.assigned} task
              {team.assigned === 1 ? "" : "s"} done ·{" "}
              {formatDuration(team.avgCompletionDays)} avg
            </p>
          </div>

          <div className="team-stats__cell team-stats__cell--breakdown">
            <p className="team-stats__cell-label">Status Breakdown</p>
            {team.assigned === 0 ? (
              <p className="team-stats__empty">No tasks assigned yet.</p>
            ) : (
              <div className="team-stats__chart">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    layout="vertical"
                    margin={{ left: -6, right: 20, top: 4, bottom: 4 }}
                  >
                    <XAxis type="number" hide />
                    <YAxis
                      type="category"
                      dataKey="status"
                      width={82}
                      tick={{ fontSize: 11, fill: "rgba(255,255,255,0.55)" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: "rgba(255,255,255,0.05)" }}
                      contentStyle={TOOLTIP_STYLE}
                      labelStyle={{ color: "#fff" }}
                    />
                    <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={14}>
                      {chartData.map((d) => (
                        <Cell key={d.status} fill={d.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Roster */}
        <div className="team-stats__section">
          <div className="team-stats__section-head">
            <p className="team-stats__cell-label">Roster</p>
            <span className="team-stats__section-count">{members.length}</span>
          </div>

          {members.length === 0 ? (
            <p className="team-stats__empty">
              No members with tasks on this team yet.
            </p>
          ) : (
            <div className="team-stats__member-grid">
              {members.map((m) => (
                <div key={m.id} className="team-stats__member-card">
                  <div className="team-stats__member-top">
                    <div
                      className="w-[34px] h-[34px] rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
                      style={{
                        background: `${m.avatarColor || color}22`,
                        border: `1px solid ${m.avatarColor || color}55`,
                        color: m.avatarColor || color,
                      }}
                    >
                      {initials(m.name)}
                    </div>
                    <div className="team-stats__member-id">
                      <p className="team-stats__member-name">{m.name}</p>
                      <p className="team-stats__member-role">
                        {m.role || "Member"}
                      </p>
                    </div>
                    <RadialProgress
                      value={m.completionRate}
                      size={38}
                      strokeWidth={4}
                      color={color}
                    >
                      <span className="team-stats__member-ring-pct">
                        {m.completionRate}%
                      </span>
                    </RadialProgress>
                  </div>

                  <div className="team-stats__member-metrics">
                    <span>
                      {m.completed}/{m.assigned} done
                    </span>
                    {m.overdue > 0 && (
                      <span className="team-stats__member-overdue">
                        <AlertTriangle
                          size={11}
                          className="inline -mt-0.5 mr-1"
                        />
                        {m.overdue} overdue
                      </span>
                    )}
                  </div>

                  {m.scores?.final !== null &&
                    m.scores?.final !== undefined && (
                      <div className="team-stats__member-projects">
                        <span className="team-stats__chip">
                          <Crown
                            size={10}
                            className="inline -mt-0.5 mr-1 text-amber-300"
                          />
                          Score {m.scores.final}
                        </span>
                      </div>
                    )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
