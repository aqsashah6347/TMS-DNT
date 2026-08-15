import { useEffect, useMemo, useState } from "react";
import { X, User, Calendar } from "lucide-react";
import { attendanceApi } from "../../../api/attendanceApi";

function formatTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

const RANGES = [
  { key: "today", label: "Today" },
  { key: "week", label: "This Week" },
  { key: "month", label: "Last Month" },
];

function Avatar({ name, gender }) {
  const initial = name?.[0]?.toUpperCase() || "?";
  const isFemale = (gender || "").toLowerCase() === "female";

  return (
    <div
      className="w-14 h-14 rounded-full flex items-center justify-center shrink-0 border"
      style={
        isFemale
          ? { background: "rgba(244,114,182,0.15)", borderColor: "rgba(244,114,182,0.3)" }
          : { background: "rgba(96,165,250,0.15)", borderColor: "rgba(96,165,250,0.3)" }
      }
    >
      <User size={24} color={isFemale ? "#f472b6" : "#60a5fa"} />
      <span className="sr-only">{initial}</span>
    </div>
  );
}

// One box per day in the calendar-style grid. Green-tinted when present,
// plain/dim when absent — no vertical list, this sits inside a CSS grid.
function DayCell({ day }) {
  const dateObj = new Date(`${day.date}T00:00:00`);
  const weekday = dateObj.toLocaleDateString("en-US", { weekday: "short" });
  const dayNum = dateObj.getDate();
  const monthShort = dateObj.toLocaleDateString("en-US", { month: "short" });

  return (
    <div
      className={`rounded-xl border p-3 flex flex-col gap-2 min-h-[104px] transition-colors ${
        day.present
          ? "bg-orange-500/[0.06] border-orange-500/20"
          : "bg-white/[0.02] border-white/10"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-white/40 uppercase tracking-wide">
          {weekday}
        </span>
        <span className="text-xs font-semibold text-white">
          {dayNum} {monthShort}
        </span>
      </div>

      {day.present ? (
        <div className="mt-auto space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-blue-400 font-medium">In</span>
            <span className="text-white/70">{formatTime(day.checkIn)}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-red-400 font-medium">Out</span>
            <span className="text-white/70">{formatTime(day.checkOut)}</span>
          </div>
        </div>
      ) : (
        <span className="mt-auto text-xs text-white/30">Absent</span>
      )}
    </div>
  );
}

// employee: the roster row that was clicked ({ employeeCode, name, gender, department })
// onClose: called to dismiss the modal
export default function EmployeeAttendanceModal({ employee, onClose }) {
  const [range, setRange] = useState("today");
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!employee) return;
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await attendanceApi.getEmployeeHistory(employee.employeeCode, range);
        if (!cancelled) setData(res);
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || "Couldn't load attendance");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [employee, range]);

  // Reset back to "Today" whenever a different employee is opened, so the
  // modal doesn't reopen on last time's "Last Month" tab.
  useEffect(() => {
    setRange("today");
  }, [employee?.employeeCode]);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const { presentCount, absentCount } = useMemo(() => {
    if (!data?.days) return { presentCount: 0, absentCount: 0 };
    const present = data.days.filter((d) => d.present).length;
    return { presentCount: present, absentCount: data.days.length - present };
  }, [data]);

  if (!employee) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl max-h-[85vh] overflow-y-auto rounded-3xl bg-zinc-900/95 border border-white/10 shadow-2xl p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Identity box */}
          <div className="col-span-2 sm:col-span-2 rounded-2xl bg-white/5 border border-white/10 p-4 flex items-center gap-3">
            <Avatar name={employee.name} gender={employee.gender} />
            <div className="min-w-0">
              <p className="text-lg font-semibold text-white truncate">{employee.name}</p>
              <p className="text-sm text-white/50 truncate">{employee.department}</p>
              <p className="text-xs text-white/30 mt-0.5">Emp # {employee.employeeCode}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="ml-auto p-2 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors shrink-0"
              title="Close"
            >
              <X size={18} />
            </button>
          </div>

          {/* Stat boxes */}
          <div className="rounded-2xl bg-white/5 border border-white/10 p-4 flex flex-col items-center justify-center">
            <span className="text-2xl font-semibold text-green-400">{presentCount}</span>
            <span className="text-xs text-white/40 mt-1">Present</span>
          </div>
          <div className="rounded-2xl bg-white/5 border border-white/10 p-4 flex flex-col items-center justify-center">
            <span className="text-2xl font-semibold text-white/70">{absentCount}</span>
            <span className="text-xs text-white/40 mt-1">Absent</span>
          </div>

          {/* Range filter tabs */}
          <div className="col-span-2 sm:col-span-4 flex items-center gap-2 rounded-2xl bg-white/5 border border-white/10 p-1.5">
            {RANGES.map((r) => (
              <button
                key={r.key}
                type="button"
                onClick={() => setRange(r.key)}
                className={`flex-1 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  range === r.key
                    ? "bg-orange-500/20 text-orange-400"
                    : "text-white/50 hover:text-white/80"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* Calendar-style attendance grid */}
          <div className="col-span-2 sm:col-span-4 rounded-2xl bg-white/5 border border-white/10 p-4">
            <div className="flex items-center gap-2 mb-3 text-white/40 text-xs uppercase tracking-wide">
              <Calendar size={14} />
              {data ? `${data.from} to ${data.to}` : "\u00A0"}
            </div>

            {isLoading && (
              <p className="text-sm text-white/50 text-center py-10">Loading attendance…</p>
            )}

            {error && (
              <p className="text-sm text-red-400 text-center py-10">{error}</p>
            )}

            {!isLoading && !error && data && (
              <div
                className={`grid gap-2 ${
                  range === "today"
                    ? "grid-cols-1 max-w-xs mx-auto"
                    : "grid-cols-3 sm:grid-cols-4 md:grid-cols-7"
                }`}
              >
                {data.days.map((day) => (
                  <DayCell key={day.date} day={day} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}