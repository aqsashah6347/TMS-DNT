// src/Features/performance/components/PerformanceDashboardTab.jsx
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import {
  Crown,
  Medal,
  Award,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Target,
} from "lucide-react";
import ScoreGauge from "./ScoreGauge";
import { ratingFor } from "../scoring";
import { initials, formatDuration, TOOLTIP_STYLE } from "../utils";

const RATING_CHART_COLORS = {
  Excellent: "#34d399",
  Good: "#60a5fa",
  Average: "#fb923c",
  "Needs Improvement": "#f87171",
};

const RANK_MEDAL = [
  {
    icon: Crown,
    ring: "border-amber-400/60",
    glow: "shadow-[0_0_24px_2px_rgba(251,191,36,0.35)]",
    bg: "bg-amber-400/10",
    chip: "bg-amber-400/15 text-amber-300 border-amber-400/40",
  },
  {
    icon: Medal,
    ring: "border-slate-300/40",
    glow: "shadow-[0_0_18px_1px_rgba(203,213,225,0.2)]",
    bg: "bg-white/[0.04]",
    chip: "bg-white/10 text-slate-200 border-white/20",
  },
  {
    icon: Award,
    ring: "border-orange-700/50",
    glow: "shadow-[0_0_18px_1px_rgba(194,120,60,0.25)]",
    bg: "bg-orange-700/[0.08]",
    chip: "bg-orange-700/15 text-orange-300 border-orange-700/40",
  },
];

// A stat tile with no border box — just a number, a label, and (optionally)
// a tiny icon. Tiles are separated from each other with a thin vertical
// hairline via the parent's `divide-x`, and the whole section sits under
// one horizontal rule — no per-card boxes.
function StatTile({ icon: Icon, label, value, accent = "text-white" }) {
  return (
    <div className="flex-1 min-w-[120px] px-5 py-1 flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5 text-white/40 text-[11px] font-medium uppercase tracking-wider">
        {Icon && <Icon size={13} />}
        {label}
      </div>
      <p
        className={`text-2xl font-semibold ${accent}`}
        style={{ fontFamily: "var(--font-display)" }}
      >
        {value}
      </p>
    </div>
  );
}

function HeroCard({ emp, rank, onClick }) {
  const medal = RANK_MEDAL[rank - 1];
  const Icon = medal.icon;
  const rating = ratingFor(emp.scores.final);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left rounded-3xl border ${medal.ring} ${medal.bg} ${medal.glow} p-5 flex flex-col gap-4 transition-transform hover:-translate-y-0.5`}
    >
      <div className="flex items-center justify-between">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${medal.chip}`}
        >
          <Icon size={13} /> #{rank}
        </span>
        <span
          className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-medium border ${rating.className}`}
        >
          {rating.label}
        </span>
      </div>

      <div className="flex items-center gap-4">
        <ScoreGauge score={emp.scores.final} size={84} thickness={8} />
        <div className="min-w-0">
          <p className="text-base font-semibold text-white truncate">
            {emp.name}
          </p>
          <p className="text-xs text-white/40 truncate">
            {emp.department}
            {emp.team ? ` · ${emp.team}` : ""}
          </p>
          <div className="flex items-center gap-3 mt-2 text-xs">
            <span className="text-white/70">
              <span className="text-white font-semibold">{emp.completed}</span>/
              {emp.assigned} done
            </span>
            <span className="text-white/70">
              {formatDuration(emp.avgCompletionDays)} avg
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

function CompactRow({ emp, rank, onClick }) {
  const color = [
    "#fb923c",
    "#60a5fa",
    "#34d399",
    "#a78bfa",
    "#f472b6",
    "#facc15",
    "#22d3ee",
  ][rank % 7];
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-4 py-3 text-left hover:bg-white/[0.03] transition-colors rounded-lg px-2 -mx-2"
    >
      <span className="w-6 shrink-0 text-center text-xs font-semibold text-white/30">
        {rank}
      </span>
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border text-[10px] font-semibold"
        style={{
          background: `${emp.avatarColor || color}22`,
          borderColor: `${emp.avatarColor || color}55`,
          color: emp.avatarColor || color,
        }}
      >
        {initials(emp.name)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-white font-medium truncate">{emp.name}</p>
        <p className="text-[11px] text-white/40 truncate">{emp.department}</p>
      </div>
      <div className="hidden sm:block w-28 h-1.5 rounded-full bg-white/5 overflow-hidden shrink-0">
        <div
          className="h-full rounded-full"
          style={{ width: `${emp.scores.final ?? 0}%`, background: "#fb923c" }}
        />
      </div>
      <span className="w-10 text-right text-sm font-semibold text-orange-400 shrink-0">
        {emp.scores.final ?? "—"}
      </span>
    </button>
  );
}

export default function PerformanceDashboardTab({
  orgStats,
  topPerformers,
  onSelectEmployee,
}) {
  const ratingData = Object.entries(orgStats.ratingCounts)
    .map(([name, value]) => ({ name, value }))
    .filter((d) => d.value > 0);

  const top3 = topPerformers.slice(0, 3);
  const rest = topPerformers.slice(3, 10);

  return (
    <div className="flex flex-col">
      {/* ── Org overview bento row ───────────────────────────────── */}
      <div className="flex flex-wrap divide-x divide-white/10 -mx-5">
        <StatTile
          icon={Users}
          label="Employees"
          value={orgStats.totalEmployees}
        />
        <StatTile
          icon={CheckCircle2}
          label="Tasks Done"
          value={`${orgStats.totalCompleted}/${orgStats.totalAssigned}`}
        />
        <StatTile
          icon={Target}
          label="Org Avg Score"
          value={orgStats.avgScore ?? "—"}
          accent="text-orange-400"
        />
        <StatTile
          icon={Clock}
          label="Avg On-Time"
          value={orgStats.avgOnTime !== null ? `${orgStats.avgOnTime}%` : "—"}
        />
        <StatTile
          icon={AlertTriangle}
          label="Overdue"
          value={orgStats.totalOverdue}
          accent={orgStats.totalOverdue > 0 ? "text-red-400" : "text-white"}
        />
      </div>

      {/* ── Top performers ───────────────────────────────────────── */}
      <div className="border-t border-white/10 mt-8 pt-6">
        <div className="flex items-center gap-2 mb-4">
          <Crown size={18} className="text-amber-400" />
          <h3 className="text-lg font-semibold text-white">
            Top 10 Performers
          </h3>
          <span className="text-xs text-white/40">
            Ranked by final performance score
          </span>
        </div>

        {top3.length === 0 ? (
          <p className="text-sm text-white/50 py-8 text-center">
            No scored employees yet.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {top3.map((emp, i) => (
                <HeroCard
                  key={emp.id}
                  emp={emp}
                  rank={i + 1}
                  onClick={() => onSelectEmployee(emp.id)}
                />
              ))}
            </div>

            {rest.length > 0 && (
              <div className="mt-2 divide-y divide-white/10">
                {rest.map((emp, i) => (
                  <CompactRow
                    key={emp.id}
                    emp={emp}
                    rank={i + 4}
                    onClick={() => onSelectEmployee(emp.id)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Analytics charts ──────────────────────────────────────── */}
      <div className="border-t border-white/10 mt-8 pt-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          Organization Analytics
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Department comparison — wide tile */}
          <div className="lg:col-span-2">
            <p className="text-xs font-medium text-white/40 uppercase tracking-wider mb-3">
              Avg. Score by Department
            </p>
            <div className="h-64">
              {orgStats.departmentComparison.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-white/40">
                  No department data yet.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={orgStats.departmentComparison}
                    margin={{ left: -20, top: 8 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.06)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="department"
                      stroke="rgba(255,255,255,0.4)"
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis
                      domain={[0, 100]}
                      stroke="rgba(255,255,255,0.4)"
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE}
                      cursor={{ fill: "rgba(255,255,255,0.04)" }}
                    />
                    <Bar
                      dataKey="avgScore"
                      name="Avg Score"
                      fill="#fb923c"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Rating distribution donut */}
          <div>
            <p className="text-xs font-medium text-white/40 uppercase tracking-wider mb-3">
              Performance Rating Mix
            </p>
            <div className="h-64 relative">
              {ratingData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-white/40">
                  No data yet.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={ratingData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={55}
                      outerRadius={85}
                      stroke="none"
                      paddingAngle={2}
                    >
                      {ratingData.map((d) => (
                        <Cell key={d.name} fill={RATING_CHART_COLORS[d.name]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 justify-center">
              {ratingData.map((d) => (
                <span
                  key={d.name}
                  className="flex items-center gap-1.5 text-[11px] text-white/50"
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: RATING_CHART_COLORS[d.name] }}
                  />
                  {d.name} ({d.value})
                </span>
              ))}
            </div>
          </div>

          {/* Monthly trend — full width */}
          <div className="lg:col-span-3">
            <p className="text-xs font-medium text-white/40 uppercase tracking-wider mb-3">
              Tasks Completed — Last 6 Months
            </p>
            <div className="h-56">
              {orgStats.monthlyTrend.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-white/40">
                  No completion history yet.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={orgStats.monthlyTrend}
                    margin={{ left: -20, top: 8 }}
                  >
                    <defs>
                      <linearGradient
                        id="trendFill"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#fb923c"
                          stopOpacity={0.4}
                        />
                        <stop
                          offset="100%"
                          stopColor="#fb923c"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.06)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="month"
                      stroke="rgba(255,255,255,0.4)"
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis
                      stroke="rgba(255,255,255,0.4)"
                      tick={{ fontSize: 11 }}
                      allowDecimals={false}
                    />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Area
                      type="monotone"
                      dataKey="completed"
                      name="Completed"
                      stroke="#fb923c"
                      fill="url(#trendFill)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
