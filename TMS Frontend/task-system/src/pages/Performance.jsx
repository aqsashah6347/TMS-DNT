import { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  User,
  Users as UsersIcon,
  ShieldOff,
} from "lucide-react";
import { usersApi } from "../api/usersApi";
import { taskApi } from "../api/taskApi";
import { teamApi } from "../api/teamApi";
import { employeesApi } from "../api/employeesApi";
import { useAuthStore } from "../store/useAuthStore";
import TeamPerformanceDetail from "../Features/performance/components/TeamPerformanceDetail";
import TeamPerformanceSidebar from "../Features/performance/components/TeamPerformanceSidebar";
import PerformanceDashboardTab from "../Features/performance/components/PerformanceDashboardTab";
import EmployeeDirectorySidebar from "../Features/performance/components/EmployeeDirectorySidebar";
import EmployeeProfilePanel from "../Features/performance/components/EmployeeProfilePanel";
import {
  buildScoreBreakdown,
  ratingFor,
} from "../Features/performance/scoring";
import { daysBetween } from "../Features/performance/utils";

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

// Combines users + tasks + roster + teams into one stats-and-score object
// per employee, used by the dashboard, the directory, and the profile
// panel — this is the single source of truth for the whole page.
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
    const scores = buildScoreBreakdown(userTasks);

    const statusCounts = { backlog: 0, "in progress": 0, review: 0, done: 0 };
    userTasks.forEach((t) => {
      if (statusCounts[t.status] !== undefined) statusCounts[t.status] += 1;
    });

    const priorityCounts = { low: 0, medium: 0, high: 0, critical: 0 };
    userTasks.forEach((t) => {
      if (priorityCounts[t.priority] !== undefined)
        priorityCounts[t.priority] += 1;
    });

    const projectMap = new Map();
    userTasks.forEach((t) => {
      if (!t.projectName) return;
      if (!projectMap.has(t.projectName)) {
        projectMap.set(t.projectName, {
          name: t.projectName,
          color: t.projectColor || "#fb923c",
          total: 0,
          done: 0,
        });
      }
      const p = projectMap.get(t.projectName);
      p.total += 1;
      if (t.status === "done") p.done += 1;
    });

    return {
      id: u.id,
      name: u.name,
      role: u.role,
      avatarColor: u.avatarColor,
      employeeCode: u.enroll_no || roster?.employeeCode || null,
      department: roster?.department || "—",
      branch: roster?.branch || "Unassigned",
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
      statusCounts,
      priorityCounts,
      projects: Array.from(projectMap.values()).sort(
        (a, b) => b.total - a.total,
      ),
      scores,
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
        managerId: team.managerId,
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

const TABS = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "employees", label: "Employees", icon: User },
  { key: "teams", label: "Teams", icon: UsersIcon },
];

export default function Performance() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "admin";

  const [tab, setTab] = useState("dashboard");
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [teams, setTeams] = useState([]);
  const [roster, setRoster] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  // null while still checking; true/false once we know whether this
  // person is allowed to see the page at all (admin, or manager of ≥1 team)
  const [isAuthorized, setIsAuthorized] = useState(null);

  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [selectedTeamId, setSelectedTeamId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        // Access check + scope come from the same call: admins get every
        // team back, everyone else only gets teams they manage (often
        // none — that's what makes this page admin/manager-only without
        // a separate permission flag to keep in sync).
        const teamsData = await teamApi.getManagedTeams();
        if (cancelled) return;

        if (!isAdmin && (teamsData || []).length === 0) {
          setIsAuthorized(false);
          setIsLoading(false);
          return;
        }
        setIsAuthorized(true);

        // Roster (attendance/department/branch data) is admin-only on the
        // backend — team managers just don't get that enrichment layer,
        // buildEmployeeStats() falls back to "—"/"Unassigned" without it.
        //
        // NOTE: for non-admins we deliberately do NOT call usersApi.getAllUsers()
        // — that endpoint returns every employee in the company (it has to,
        // since Chat needs it too), which would leak the full roster to a
        // manager's browser even if the UI only renders a filtered subset.
        // Instead we build the user list straight from teamsData.memberDetails,
        // which the backend already scoped to teams this manager owns.
        const [usersData, allTasks, rosterData] = await Promise.all([
          isAdmin ? usersApi.getAllUsers() : Promise.resolve(null),
          fetchAllTasks(),
          isAdmin
            ? employeesApi.getRoster()
            : Promise.resolve({ employees: [] }),
        ]);
        if (cancelled) return;

        if (isAdmin) {
          setUsers(usersData || []);
          setTasks(allTasks || []);
        } else {
          // Scope everything down to just the people on the team(s) this
          // manager actually manages — memberDetails already includes the
          // manager themself (assignMembers always adds managerId in).
          const memberMap = new Map();
          (teamsData || []).forEach((t) => {
            (t.memberDetails || []).forEach((m) => {
              memberMap.set(m.id, {
                id: m.id,
                name: m.name,
                role: m.role,
                avatarColor: m.avatarColor,
                enroll_no: m.enrollNo ?? m.enroll_no ?? null,
              });
            });
          });
          const allowedIds = new Set(memberMap.keys());
          setUsers(Array.from(memberMap.values()));
          setTasks(
            (allTasks || []).filter((t) => allowedIds.has(t.assignedTo)),
          );
        }
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
  }, [isAdmin]);

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

  // Keep a team selected in the Teams tab at all times — default to the
  // top-ranked (most efficient) team, and fall back to it again if the
  // currently selected team disappears (filters change, team gets deleted).
  useEffect(() => {
    if (teamStats.length === 0) {
      if (selectedTeamId !== null) setSelectedTeamId(null);
      return;
    }
    const stillExists = teamStats.some((t) => t.id === selectedTeamId);
    if (!stillExists) setSelectedTeamId(teamStats[0].id);
  }, [teamStats, selectedTeamId]);

  const selectedTeamRank = useMemo(() => {
    const idx = teamStats.findIndex((t) => t.id === selectedTeamId);
    return idx === -1 ? 1 : idx + 1;
  }, [teamStats, selectedTeamId]);

  const selectedTeam = useMemo(
    () => teamStats.find((t) => t.id === selectedTeamId) || null,
    [teamStats, selectedTeamId],
  );

  const topPerformers = useMemo(() => {
    return [...employeeStats]
      .filter((e) => e.assigned > 0)
      .sort((a, b) => {
        const bs = b.scores.final ?? -1;
        const as = a.scores.final ?? -1;
        if (bs !== as) return bs - as;
        return b.completed - a.completed;
      })
      .slice(0, 10);
  }, [employeeStats]);

  const orgStats = useMemo(() => {
    const withTasks = employeeStats.filter((e) => e.assigned > 0);
    const totalAssigned = employeeStats.reduce((s, e) => s + e.assigned, 0);
    const totalCompleted = employeeStats.reduce((s, e) => s + e.completed, 0);
    const totalOverdue = employeeStats.reduce((s, e) => s + e.overdue, 0);
    const avgScore = withTasks.length
      ? Math.round(
          withTasks.reduce((s, e) => s + (e.scores.final ?? 0), 0) /
            withTasks.length,
        )
      : null;
    const avgOnTime = withTasks.length
      ? Math.round(
          withTasks.reduce((s, e) => s + (e.onTimeRate ?? 0), 0) /
            withTasks.length,
        )
      : null;

    const byDept = new Map();
    employeeStats.forEach((e) => {
      if (!e.department || e.department === "—") return;
      if (!byDept.has(e.department)) {
        byDept.set(e.department, {
          department: e.department,
          employees: 0,
          scoreSum: 0,
          scoredCount: 0,
        });
      }
      const d = byDept.get(e.department);
      d.employees += 1;
      if (e.assigned > 0) {
        d.scoreSum += e.scores.final ?? 0;
        d.scoredCount += 1;
      }
    });
    const departmentComparison = Array.from(byDept.values())
      .map((d) => ({
        department: d.department,
        employees: d.employees,
        avgScore: d.scoredCount ? Math.round(d.scoreSum / d.scoredCount) : 0,
      }))
      .sort((a, b) => b.avgScore - a.avgScore);

    const ratingCounts = {
      Excellent: 0,
      Good: 0,
      Average: 0,
      "Needs Improvement": 0,
    };
    withTasks.forEach((e) => {
      const r = ratingFor(e.scores.final).label;
      if (ratingCounts[r] !== undefined) ratingCounts[r] += 1;
    });

    const monthMap = new Map();
    tasks.forEach((t) => {
      if (t.status !== "done" || !t.completedAt) return;
      const d = new Date(t.completedAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthMap.set(key, (monthMap.get(key) || 0) + 1);
    });
    const monthlyTrend = Array.from(monthMap.entries())
      .sort((a, b) => (a[0] > b[0] ? 1 : -1))
      .slice(-6)
      .map(([key, count]) => {
        const [y, m] = key.split("-");
        const label = new Date(Number(y), Number(m) - 1).toLocaleString(
          "en-US",
          { month: "short" },
        );
        return { month: label, completed: count };
      });

    return {
      totalEmployees: employeeStats.length,
      activeEmployees: withTasks.length,
      totalAssigned,
      totalCompleted,
      totalOverdue,
      avgScore,
      avgOnTime,
      departmentComparison,
      ratingCounts,
      monthlyTrend,
    };
  }, [employeeStats, tasks]);

  const departments = useMemo(() => {
    const set = new Set(
      employeeStats.map((e) => e.department).filter((d) => d && d !== "—"),
    );
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [employeeStats]);

  const filteredEmployees = useMemo(() => {
    return employeeStats
      .filter((e) => {
        const matchesSearch =
          !search ||
          e.name.toLowerCase().includes(search.toLowerCase()) ||
          (e.employeeCode || "").toLowerCase().includes(search.toLowerCase());
        const matchesDept =
          !departmentFilter || e.department === departmentFilter;
        return matchesSearch && matchesDept;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [employeeStats, search, departmentFilter]);

  const selectedEmployee = selectedEmployeeId
    ? employeeStatsById.get(selectedEmployeeId)
    : null;

  function goToEmployee(id) {
    setSelectedEmployeeId(id);
    setTab("employees");
  }

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
            {isAdmin
              ? "Task achievement, difficulty handling, efficiency, and quality — per employee and per team."
              : "Task achievement, difficulty handling, efficiency, and quality — for your team."}
          </p>
        </div>

        {isAuthorized && (
          <div className="lg:ml-auto flex rounded-xl bg-white/5 border border-white/10 p-1 shrink-0">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  tab === key
                    ? "bg-orange-500/20 text-orange-400"
                    : "text-white/50 hover:text-white/80"
                }`}
              >
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {isAuthorized === false ? (
        <div className="flex flex-col items-center justify-center text-center gap-3 py-24">
          <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
            <ShieldOff size={22} className="text-white/40" />
          </div>
          <h3 className="text-lg font-semibold text-white">
            Performance is restricted
          </h3>
          <p className="text-sm text-white/50 max-w-sm">
            This page is only available to admins and to team managers, scoped
            to their own team. You'll get access automatically if you're made a
            team's manager.
          </p>
        </div>
      ) : (
        <>
          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 mb-4">
              {error}
            </p>
          )}

          {isLoading ? (
            <p className="text-sm text-white/50 text-center py-16">
              Loading performance data…
            </p>
          ) : tab === "dashboard" ? (
            <PerformanceDashboardTab
              orgStats={orgStats}
              topPerformers={topPerformers}
              onSelectEmployee={goToEmployee}
            />
          ) : tab === "employees" ? (
            <div className="flex flex-col lg:flex-row gap-6">
              <EmployeeDirectorySidebar
                employees={filteredEmployees}
                selectedId={selectedEmployeeId}
                onSelect={setSelectedEmployeeId}
                search={search}
                onSearchChange={setSearch}
                departments={departments}
                departmentFilter={departmentFilter}
                onDepartmentChange={setDepartmentFilter}
              />
              <EmployeeProfilePanel employee={selectedEmployee} />
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row gap-6">
              <TeamPerformanceDetail
                team={selectedTeam}
                rank={selectedTeamRank}
              />
              <TeamPerformanceSidebar
                teams={teamStats}
                selectedId={selectedTeamId}
                onSelect={setSelectedTeamId}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
