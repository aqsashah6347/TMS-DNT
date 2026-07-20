import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import {
  User,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Timer,
  Target,
} from "lucide-react";
import Modal from "../../../components/ui/Modal";

const RING_COLORS = ["#fb923c", "rgba(255,255,255,0.08)"];

function formatDuration(days) {
  if (days === null || days === undefined || Number.isNaN(days)) return "—";
  if (days < 1) return `${Math.round(days * 24)}h`;
  return `${days.toFixed(1)}d`;
}

function StatBox({ icon: Icon, label, value, accent = "text-white" }) {
  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-4 flex flex-col gap-2">
      <div className="flex items-center gap-2 text-white/40 text-xs font-medium uppercase tracking-wider">
        <Icon size={14} />
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

export default function EmployeeDetailModal({ employee, onClose }) {
  if (!employee) return null;

  const {
    name,
    role,
    department,
    employeeCode,
    status,
    team,
    assigned,
    completed,
    pending,
    overdue,
    completionRate,
    onTimeRate,
    avgCompletionDays,
  } = employee;

  const ringData = [
    { name: "Completed", value: completed },
    { name: "Remaining", value: Math.max(assigned - completed, 0) },
  ];
  const hasData = assigned > 0;

  return (
    <Modal
      isOpen={Boolean(employee)}
      onClose={onClose}
      title="Employee Performance"
      width="max-w-3xl"
    >
      <div className="flex flex-col gap-6">
        {/* Identity header */}
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center shrink-0 border-2"
            style={{
              background: `${employee.avatarColor || "#fb923c"}22`,
              borderColor: `${employee.avatarColor || "#fb923c"}55`,
            }}
          >
            <User size={28} color={employee.avatarColor || "#fb923c"} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-xl font-semibold text-white truncate">
                {name}
              </h4>
              {status === "present" && (
                <span
                  className="w-2 h-2 rounded-full bg-green-500 shrink-0"
                  title="Present today"
                />
              )}
            </div>
            <p className="text-sm text-white/50 mt-0.5">
              {role ? role.charAt(0).toUpperCase() + role.slice(1) : "—"}
              {department && department !== "—" ? ` · ${department}` : ""}
              {team ? ` · ${team}` : ""}
            </p>
            {employeeCode && (
              <p className="text-xs text-white/30 mt-0.5">
                Emp # {employeeCode}
              </p>
            )}
          </div>
        </div>

        {/* Ring chart + completion rate */}
        <div className="rounded-2xl bg-white/5 border border-white/10 p-5 flex items-center gap-6 flex-wrap">
          <div className="w-36 h-36 relative shrink-0">
            {hasData ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={ringData}
                    dataKey="value"
                    innerRadius={45}
                    outerRadius={65}
                    startAngle={90}
                    endAngle={-270}
                    stroke="none"
                  >
                    {ringData.map((entry, i) => (
                      <Cell key={entry.name} fill={RING_COLORS[i]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full rounded-full border-8 border-white/10" />
            )}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span
                className="text-2xl font-semibold text-white"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {completionRate}%
              </span>
              <span className="text-[10px] text-white/40 uppercase tracking-wide">
                Done
              </span>
            </div>
          </div>

          <div className="flex-1 min-w-[180px] grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div>
              <p className="text-white/40 text-xs">Tasks Assigned</p>
              <p className="text-white font-semibold text-lg">{assigned}</p>
            </div>
            <div>
              <p className="text-white/40 text-xs">Tasks Completed</p>
              <p className="text-orange-400 font-semibold text-lg">
                {completed}
              </p>
            </div>
            <div>
              <p className="text-white/40 text-xs">Still Pending</p>
              <p className="text-white font-semibold text-lg">{pending}</p>
            </div>
            <div>
              <p className="text-white/40 text-xs">Overdue</p>
              <p
                className={`font-semibold text-lg ${overdue > 0 ? "text-red-400" : "text-white"}`}
              >
                {overdue}
              </p>
            </div>
          </div>
        </div>

        {/* Extra metrics grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <StatBox
            icon={Timer}
            label="Avg. Time to Complete"
            value={formatDuration(avgCompletionDays)}
          />
          <StatBox
            icon={Target}
            label="On-Time Rate"
            value={onTimeRate === null ? "—" : `${onTimeRate}%`}
            accent={
              onTimeRate !== null && onTimeRate < 60
                ? "text-red-400"
                : "text-white"
            }
          />
          <StatBox
            icon={CheckCircle2}
            label="Completion Rate"
            value={`${completionRate}%`}
          />
          <StatBox icon={Clock} label="Pending Tasks" value={pending} />
          <StatBox
            icon={AlertTriangle}
            label="Overdue Tasks"
            value={overdue}
            accent={overdue > 0 ? "text-red-400" : "text-white"}
          />
          <StatBox icon={User} label="Total Assigned" value={assigned} />
        </div>
      </div>
    </Modal>
  );
}
