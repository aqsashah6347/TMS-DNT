// src/Features/performance/components/EmployeeProfilePanel.jsx
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import {
  User,
  Timer,
  Target,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FolderKanban,
  Users as UsersIcon,
} from "lucide-react";
import ScoreGauge from "./ScoreGauge";
import { ratingFor } from "../scoring";
import {
  initials,
  formatDuration,
  STATUS_COLORS,
  PRIORITY_COLORS,
  TOOLTIP_STYLE,
} from "../utils";

function MiniStat({ icon: Icon, label, value, accent = "text-white" }) {
  return (
    <div className="flex-1 min-w-[110px] px-4 py-1 flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5 text-white/40 text-[11px] font-medium uppercase tracking-wider">
        {Icon && <Icon size={12} />}
        {label}
      </div>
      <p
        className={`text-xl font-semibold ${accent}`}
        style={{ fontFamily: "var(--font-display)" }}
      >
        {value}
      </p>
    </div>
  );
}

export default function EmployeeProfilePanel({ employee }) {
  if (!employee) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center py-24 border-t lg:border-t-0 lg:border-l border-white/10">
        <User className="w-10 h-10 text-white/15 mb-3" />
        <p className="text-sm text-white/40">
          Select an employee from the list to view their performance profile.
        </p>
      </div>
    );
  }

  const { scores } = employee;
  const rating = ratingFor(scores.final);
  const hasData = employee.assigned > 0;

const radarData = [
  { metric: "Completion", value: scores.achievement ?? 0 },
  { metric: "Task Amount", value: scores.taskAmount ?? 0 },
  { metric: "Task Weight", value: scores.difficulty ?? 0 },
  { metric: "Efficiency", value: scores.timeEfficiency ?? 0 },
  { metric: "Quality", value: scores.quality ?? 0 },
  { metric: "Manager Rating", value: scores.performanceRatingScore ?? 0 },
];

  const statusData = Object.entries(employee.statusCounts)
    .map(([status, value]) => ({ status, value }))
    .filter((d) => d.value > 0);

  const priorityData = Object.entries(employee.priorityCounts)
    .map(([priority, value]) => ({ priority, value }))
    .filter((d) => d.value > 0);

  return (
    <div className="flex-1 min-w-0 lg:pl-8 lg:border-l border-white/10 border-t lg:border-t-0 pt-6 lg:pt-0">
      {/* Identity header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center shrink-0 border-2 text-sm font-semibold"
            style={{
              background: `${employee.avatarColor || "#fb923c"}22`,
              borderColor: `${employee.avatarColor || "#fb923c"}55`,
              color: employee.avatarColor || "#fb923c",
            }}
          >
            {initials(employee.name)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xl font-semibold text-white truncate">
                {employee.name}
              </h3>
              {employee.status === "present" && (
                <span
                  className="w-2 h-2 rounded-full bg-green-500 shrink-0"
                  title="Present today"
                />
              )}
            </div>
            <p className="text-sm text-white/50 mt-0.5 truncate">
              {employee.role
                ? employee.role.charAt(0).toUpperCase() + employee.role.slice(1)
                : "—"}
              {employee.department && employee.department !== "—"
                ? ` · ${employee.department}`
                : ""}
              {employee.team ? ` · ${employee.team}` : ""}
            </p>
            {employee.employeeCode && (
              <p className="text-xs text-white/30 mt-0.5">
                Emp # {employee.employeeCode}
              </p>
            )}
          </div>
        </div>
        <span
          className={`inline-flex px-3 py-1.5 rounded-full text-xs font-medium border shrink-0 ${rating.className}`}
        >
          {rating.label}
        </span>
      </div>

      {!hasData ? (
        <p className="text-sm text-white/40 mt-8 border-t border-white/10 pt-6">
          No tasks assigned yet — scores will appear once work is assigned.
        </p>
      ) : (
        <>
          {/* Final score + explainability + sub-metric gauges */}
          <div className="border-t border-white/10 mt-6 pt-6">
            <p className="text-xs font-medium text-white/40 uppercase tracking-wider mb-4">
              Why did I get this score?
            </p>
            <div className="flex flex-wrap items-center gap-8">
              <ScoreGauge
                score={scores.final}
                size={140}
                thickness={12}
                label="Final Score"
              />
              <div className="flex flex-wrap gap-6">
                <ScoreGauge
                  score={scores.achievement}
                  size={76}
                  thickness={7}
                  label="Completion"
                  caption="24% weight"
                />
                <ScoreGauge
                  score={scores.taskAmount}
                  size={76}
                  thickness={7}
                  label="Task Amount"
                  caption="12% weight"
                />
                <ScoreGauge
                  score={scores.difficulty}
                  size={76}
                  thickness={7}
                  label="Task Weight"
                  caption="20% weight"
                />
                <ScoreGauge
                  score={scores.timeEfficiency}
                  size={76}
                  thickness={7}
                  label="Efficiency"
                  caption="16% weight"
                />
                <ScoreGauge
                  score={scores.quality}
                  size={76}
                  thickness={7}
                  label="Quality"
                  caption="8% weight"
                />
                <ScoreGauge
                  score={scores.performanceRatingScore}
                  size={76}
                  thickness={7}
                  label="Manager Rating"
                  caption={
                    scores.performanceRating !== null
                      ? `${scores.performanceRating}/10 · 20% weight`
                      : "20% weight"
                  }
                />
              </div>
            </div>
          </div>

          {/* Radar + status pie + priority bar */}
          <div className="border-t border-white/10 mt-6 pt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div>
              <p className="text-xs font-medium text-white/40 uppercase tracking-wider mb-3">
                Skill Profile
              </p>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData} outerRadius="75%">
                    <PolarGrid stroke="rgba(255,255,255,0.1)" />
                    <PolarAngleAxis
                      dataKey="metric"
                      tick={{ fontSize: 11, fill: "rgba(255,255,255,0.6)" }}
                    />
                    <PolarRadiusAxis
                      domain={[0, 100]}
                      tick={false}
                      axisLine={false}
                    />
                    <Radar
                      dataKey="value"
                      stroke="#fb923c"
                      fill="#fb923c"
                      fillOpacity={0.35}
                    />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-white/40 uppercase tracking-wider mb-3">
                Tasks by Status
              </p>
              <div className="h-56 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      dataKey="value"
                      nameKey="status"
                      innerRadius={45}
                      outerRadius={80}
                      stroke="none"
                      paddingAngle={2}
                    >
                      {statusData.map((d) => (
                        <Cell key={d.status} fill={STATUS_COLORS[d.status]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span
                    className="text-xl font-semibold text-white"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {employee.assigned}
                  </span>
                  <span className="text-[10px] text-white/40 uppercase tracking-wide">
                    Total
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 justify-center">
                {statusData.map((d) => (
                  <span
                    key={d.status}
                    className="flex items-center gap-1.5 text-[11px] text-white/50 capitalize"
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ background: STATUS_COLORS[d.status] }}
                    />
                    {d.status} ({d.value})
                  </span>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-white/40 uppercase tracking-wider mb-3">
                Tasks by Difficulty
              </p>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={priorityData} margin={{ left: -20, top: 8 }}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.06)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="priority"
                      stroke="rgba(255,255,255,0.4)"
                      tick={{ fontSize: 11 }}
                      className="capitalize"
                    />
                    <YAxis
                      stroke="rgba(255,255,255,0.4)"
                      tick={{ fontSize: 11 }}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE}
                      cursor={{ fill: "rgba(255,255,255,0.04)" }}
                    />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {priorityData.map((d) => (
                        <Cell
                          key={d.priority}
                          fill={PRIORITY_COLORS[d.priority]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Raw stats bento row */}
          <div className="border-t border-white/10 mt-6 pt-6 flex flex-wrap divide-x divide-white/10 -mx-4">
            <MiniStat
              icon={CheckCircle2}
              label="Assigned"
              value={employee.assigned}
            />
            <MiniStat
              icon={CheckCircle2}
              label="Completed"
              value={employee.completed}
              accent="text-emerald-400"
            />
            <MiniStat icon={Clock} label="Pending" value={employee.pending} />
            <MiniStat
              icon={AlertTriangle}
              label="Overdue"
              value={employee.overdue}
              accent={employee.overdue > 0 ? "text-red-400" : "text-white"}
            />
            <MiniStat
              icon={Timer}
              label="Avg. Time"
              value={formatDuration(employee.avgCompletionDays)}
            />
            <MiniStat
              icon={Target}
              label="On-Time Rate"
              value={
                employee.onTimeRate === null ? "—" : `${employee.onTimeRate}%`
              }
            />
          </div>

          {/* Teams & projects */}
          <div className="border-t border-white/10 mt-6 pt-6">
            <p className="text-xs font-medium text-white/40 uppercase tracking-wider mb-3">
              Teams &amp; Projects
            </p>
            <div className="flex items-center gap-2 mb-4">
              <UsersIcon size={14} className="text-white/40" />
              <span className="text-sm text-white/80">
                {employee.team || "Not assigned to a team"}
              </span>
            </div>

            {employee.projects.length === 0 ? (
              <p className="text-sm text-white/40">
                Not part of any project yet.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                {employee.projects.map((p) => {
                  const pct = p.total
                    ? Math.round((p.done / p.total) * 100)
                    : 0;
                  return (
                    <div key={p.name} className="flex items-center gap-3">
                      <FolderKanban
                        size={14}
                        className="text-white/30 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm text-white/85 truncate">
                            {p.name}
                          </span>
                          <span className="text-xs text-white/40 shrink-0">
                            {p.done}/{p.total}
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden mt-1.5">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${pct}%`, background: p.color }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
