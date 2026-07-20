import { useEffect, useMemo, useState, useRef } from "react";
import {
  Search,
  User,
  ChevronDown,
  Check,
  Trophy,
  Users as UsersIcon,
  LayoutGrid,
  X,
} from "lucide-react";
import { usersApi } from "../api/usersApi";
import { taskApi } from "../api/taskApi";
import { teamApi } from "../api/teamApi";
import { employeesApi } from "../api/employeesApi";
import EmployeeDetailModal from "../Features/performance/components/EmployeeDetailModal";
import TeamsPerformanceView from "../Features/performance/components/TeamsPerformanceView";

// Fetches every task page-by-page (the backend caps pageSize at 100) so
// stats reflect the whole tms_tasks table, not just the first page.
async function fetchAllTasks() {
  let page = 1;
  const pageSize = 100;
  let all = [];
  let total = Infinity;
  while (all.length < total) {
    const { tasks, total: t } = await taskApi.getAllTasks({}, page, pageSize);
    total = t;
    all = all.concat(tasks);
    if (tasks.length === 0) break;
    page += 1;
  }
  return all;
}

function daysBetween(a, b) {
  return (new Date(b).getTime() - new Date(a).getTime()) / 86400000;
}

// Combines users + tasks + roster + teams into one stats object per
// employee, used both by the top-performers list and the searchable grid.
function buildEmployeeStats(users, tasks, rosterByCode, teamByUserId) {
  return users.map((u) => {
    const userTasks = tasks.filter((t) => t.assignedTo === u.id);
    const completed = userTasks.filter((t) => t.status === "done");
    const overdue = userTasks.filter(
      (t) =>
        t.status !== "done" && t.dueDate && new Date(t.dueDate) < new Date(),
    );

    const completionTimes = completed
      .filter((t) => t.createdAt && t.completedAt)
      .map((t) => daysBetween(t.createdAt, t.completedAt));
    const avgCompletionDays = completionTimes.length
      ? completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length
      : null;

    const onTimeCompleted = completed.filter(
      (t) =>
        t.dueDate &&
        t.completedAt &&
        new Date(t.completedAt) <= new Date(t.dueDate),
    );
    const onTimeRate = completed.length
      ? Math.round((onTimeCompleted.length / completed.length) * 100)
      : null;

    const roster = rosterByCode.get(u.enroll_no);
    const teamInfo = teamByUserId.get(u.id);

    return {
      id: u.id,
      name: u.name,
      role: u.role,
      avatarColor: u.avatarColor,
      employeeCode: u.enroll_no || roster?.employeeCode || null,
      department: roster?.department || "—",
      status: roster?.status || null,
      team: teamInfo?.teamName || null,
      assigned: userTasks.length,
      completed: completed.length,
      pending: userTasks.length - completed.length,
      overdue: overdue.length,
      completionRate: userTasks.length
        ? Math.round((completed.length / userTasks.length) * 100)
        : 0,
      onTimeRate,
      avgCompletionDays,
    };
  });
}

function buildTeamStats(teams, employeeStatsById) {
  return teams
    .map((team) => {
      const members = (team.memberDetails || [])
        .filter((m) => m.id !== team.managerId)
        .map((m) => employeeStatsById.get(m.id))
        .filter(Boolean);

      const assigned = members.reduce((sum, m) => sum + m.assigned, 0);
      const completed = members.reduce((sum, m) => sum + m.completed, 0);

      const timedMembers = members.filter((m) => m.avgCompletionDays !== null);
      const avgCompletionDays = timedMembers.length
        ? timedMembers.reduce((sum, m) => sum + m.avgCompletionDays, 0) /
          timedMembers.length
        : null;

      const mostEfficientMember = timedMembers.length
        ? [...timedMembers].sort((a, b) => {
            if (a.avgCompletionDays !== b.avgCompletionDays) {
              return a.avgCompletionDays - b.avgCompletionDays;
            }
            return b.completed - a.completed;
          })[0]
        : members.length
          ? [...members].sort((a, b) => b.completed - a.completed)[0]
          : null;

      return {
        id: team.id,
        name: team.name,
        color: team.color,
        managerName: team.managerName,
        memberCount: members.length,
        assigned,
        completed,
        completionRate: assigned ? Math.round((completed / assigned) * 100) : 0,
        avgCompletionDays,
        mostEfficientMember,
        members: [...members].sort((a, b) => b.completed - a.completed),
      };
    })
    .sort((a, b) => {
      if (b.completionRate !== a.completionRate)
        return b.completionRate - a.completionRate;
      return b.completed - a.completed;
    });
}

// Same custom-styled dropdown pattern used on the Employees page, kept
// local here since it's the only other place a department filter is needed.
function DepartmentDropdown({ departments, value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const label = value || "All Departments";

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center justify-between gap-2 min-w-[180px] px-4 py-2.5 rounded-xl bg-white/5 border text-sm text-white transition-colors ${
          isOpen
            ? "border-orange-500/40 ring-2 ring-orange-500/40"
            : "border-white/10 hover:border-white/20"
        }`}
      >
        <span className="truncate">{label}</span>
        <ChevronDown
          size={15}
          className={`text-white/40 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-30 mt-2 w-full min-w-[200px] rounded-xl bg-zinc-900 border border-white/10 shadow-2xl overflow-hidden py-1">
          <button
            type="button"
            onClick={() => {
              onChange("");
              setIsOpen(false);
            }}
            className={`w-full flex items-center justify-between px-3.5 py-2 text-sm text-left transition-colors ${
              value === ""
                ? "text-orange-400 bg-orange-500/10"
                : "text-white/70 hover:bg-white/5 hover:text-white"
            }`}
          >
            All Departments
            {value === "" && <Check size={14} />}
          </button>

          {departments.map((dept) => (
            <button
              key={dept}
              type="button"
              onClick={() => {
                onChange(dept);
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2 text-sm text-left truncate transition-colors ${
                value === dept
                  ? "text-orange-400 bg-orange-500/10"
                  : "text-white/70 hover:bg-white/5 hover:text-white"
              }`}
            >
              <span className="truncate">{dept}</span>
              {value === dept && <Check size={14} className="shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function formatDuration(days) {
  if (days === null || days === undefined || Number.isNaN(days)) return "—";
  if (days < 1) return `${Math.round(days * 24)}h`;
  return `${days.toFixed(1)}d`;
}

function EmployeeRow({ emp, rank, onClick }) {
  const isTopThree = rank && rank <= 3;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-4 rounded-2xl border p-4 text-left transition-colors ${
        isTopThree
          ? "border-emerald-400/70 bg-amber-400/10 hover:bg-amber-400/[0.14] shadow-[0_0_18px_2px_rgba(52,211,153,0.45)]"
          : "border-white/10 bg-white/5 hover:bg-white/[0.07]"
      }`}
    >
      {rank && (
        <div
          className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border ${
            isTopThree
              ? "border-amber-400/50 bg-amber-400/15 text-amber-300"
              : "border-white/10 bg-white/5 text-white/50"
          }`}
        >
          {rank}
        </div>
      )}

      <div
        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 border"
        style={{
          background: `${emp.avatarColor || "#fb923c"}22`,
          borderColor: `${emp.avatarColor || "#fb923c"}55`,
        }}
      >
        <User size={18} color={emp.avatarColor || "#fb923c"} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-white truncate">{emp.name}</p>
        <p className="text-xs text-white/40 truncate">
          {emp.department}
          {emp.team ? ` · ${emp.team}` : ""}
        </p>
      </div>

      <div className="hidden sm:flex items-center gap-5 shrink-0 text-sm">
        <div className="text-center">
          <p className="text-white font-semibold">
            {emp.completed}/{emp.assigned}
          </p>
          <p className="text-[10px] text-white/40 uppercase tracking-wide">
            Done
          </p>
        </div>
        <div className="text-center">
          <p className="text-orange-400 font-semibold">{emp.completionRate}%</p>
          <p className="text-[10px] text-white/40 uppercase tracking-wide">
            Rate
          </p>
        </div>
        <div className="text-center">
          <p className="text-white font-semibold">
            {formatDuration(emp.avgCompletionDays)}
          </p>
          <p className="text-[10px] text-white/40 uppercase tracking-wide">
            Avg Time
          </p>
        </div>
      </div>
    </button>
  );
}

export default function Performance() {
  const [view, setView] = useState("employees"); // "employees" | "teams"
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [teams, setTeams] = useState([]);
  const [roster, setRoster] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const [usersData, allTasks, teamsData, rosterData] = await Promise.all([
          usersApi.getAllUsers(),
          fetchAllTasks(),
          teamApi.getAllTeams(),
          employeesApi.getRoster(),
        ]);
        if (cancelled) return;
        setUsers(usersData || []);
        setTasks(allTasks || []);
        setTeams(teamsData || []);
        setRoster(rosterData?.employees || []);
      } catch (err) {
        if (!cancelled)
          setError(
            err.response?.data?.message || "Couldn't load performance data",
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

  const rosterByCode = useMemo(() => {
    const map = new Map();
    roster.forEach((r) => map.set(r.employeeCode, r));
    return map;
  }, [roster]);

  const teamByUserId = useMemo(() => {
    const map = new Map();
    teams.forEach((team) => {
      (team.memberDetails || []).forEach((m) => {
        map.set(m.id, {
          teamId: team.id,
          teamName: team.name,
          teamColor: team.color,
        });
      });
    });
    return map;
  }, [teams]);

  const employeeStats = useMemo(
    () => buildEmployeeStats(users, tasks, rosterByCode, teamByUserId),
    [users, tasks, rosterByCode, teamByUserId],
  );

  const employeeStatsById = useMemo(() => {
    const map = new Map();
    employeeStats.forEach((e) => map.set(e.id, e));
    return map;
  }, [employeeStats]);

  const teamStats = useMemo(
    () => buildTeamStats(teams, employeeStatsById),
    [teams, employeeStatsById],
  );

  const topPerformers = useMemo(() => {
    return [...employeeStats]
      .filter((e) => e.assigned > 0)
      .sort((a, b) => {
        if (b.completed !== a.completed) return b.completed - a.completed;
        const aTime = a.avgCompletionDays ?? Infinity;
        const bTime = b.avgCompletionDays ?? Infinity;
        return aTime - bTime;
      })
      .slice(0, 10);
  }, [employeeStats]);

  const departments = useMemo(() => {
    const set = new Set(
      employeeStats.map((e) => e.department).filter((d) => d && d !== "—"),
    );
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [employeeStats]);

  const filteredEmployees = useMemo(() => {
    return employeeStats.filter((e) => {
      const matchesSearch =
        !search ||
        e.name.toLowerCase().includes(search.toLowerCase()) ||
        (e.employeeCode || "").toLowerCase().includes(search.toLowerCase());
      const matchesDept =
        !departmentFilter || e.department === departmentFilter;
      return matchesSearch && matchesDept;
    });
  }, [employeeStats, search, departmentFilter]);

  const selectedEmployee = selectedEmployeeId
    ? employeeStatsById.get(selectedEmployeeId)
    : null;

  return (
    <div>
      <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-6">
        <div className="shrink-0">
          <h2
            className="text-4xl font-semibold text-white"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Performance
          </h2>
          <p className="text-sm text-white/50 mt-1">
            Task throughput and completion speed, per employee and per team.
          </p>
        </div>

        <div className="lg:ml-auto flex rounded-xl bg-white/5 border border-white/10 p-1 shrink-0">
          <button
            onClick={() => setView("employees")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              view === "employees"
                ? "bg-orange-500/20 text-orange-400"
                : "text-white/50 hover:text-white/80"
            }`}
          >
            <LayoutGrid size={14} /> Employees
          </button>
          <button
            onClick={() => setView("teams")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              view === "teams"
                ? "bg-orange-500/20 text-orange-400"
                : "text-white/50 hover:text-white/80"
            }`}
          >
            <UsersIcon size={14} /> Teams
          </button>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 mb-4">
          {error}
        </p>
      )}

      {isLoading ? (
        <p className="text-sm text-white/50 text-center py-16">
          Loading performance data…
        </p>
      ) : view === "employees" ? (
        <>
          {/* Top performers */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <Trophy size={18} className="text-amber-400" />
              <h3 className="text-lg font-semibold text-white">
                Top Performers
              </h3>
              <span className="text-xs text-white/40">
                Top {topPerformers.length}, ranked by tasks done & speed
              </span>
            </div>
            {topPerformers.length === 0 ? (
              <p className="text-sm text-white/50">No completed tasks yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {topPerformers.map((emp, i) => (
                  <EmployeeRow
                    key={emp.id}
                    emp={emp}
                    rank={i + 1}
                    onClick={() => setSelectedEmployeeId(emp.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Search + filter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
            <div className="flex items-center gap-2 w-full sm:w-72 rounded-full border border-white/10 bg-[#2a2d34] px-4 py-2.5 transition-all duration-300 hover:border-orange-500/60 focus-within:border-orange-500 focus-within:shadow-[0_0_18px_rgba(249,115,22,0.25)]">
              <Search size={16} className="text-orange-400 shrink-0" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search employee..."
                className="flex-1 min-w-0 bg-transparent text-sm text-white placeholder:text-white/40 outline-none"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="text-white/40 hover:text-white transition-colors shrink-0"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <DepartmentDropdown
              departments={departments}
              value={departmentFilter}
              onChange={setDepartmentFilter}
            />
          </div>

          {/* Full employee list */}
          {filteredEmployees.length === 0 ? (
            <p className="text-sm text-white/50 text-center py-12">
              No employees match your search or filter.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {filteredEmployees.map((emp) => (
                <EmployeeRow
                  key={emp.id}
                  emp={emp}
                  onClick={() => setSelectedEmployeeId(emp.id)}
                />
              ))}
            </div>
          )}
        </>
      ) : (
        <TeamsPerformanceView teams={teamStats} />
      )}

      <EmployeeDetailModal
        employee={selectedEmployee}
        onClose={() => setSelectedEmployeeId(null)}
      />
    </div>
  );
}
