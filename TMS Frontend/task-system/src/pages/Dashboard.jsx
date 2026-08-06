import { useEffect, useState, useCallback } from "react";
import PriorityTaskList from "../features/dashboard/components/PriorityTaskList";
import ChatNotifications from "../Features/dashboard/components/ChatNotifications";
import TaskAssignments from "../Features/dashboard/components/TaskAssignments";
import OverdueTasks from "../features/dashboard/components/OverdueTasks";
import CalendarPreview from "../features/dashboard/components/CalendarPreview";
import QuickActions from "../features/dashboard/components/QuickActions";
import { TrendingUp, Star, AlertTriangle, CalendarCheck2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTaskStore } from "../features/tasks/taskStore";
import { useProjectStore } from "../features/projects/projectStore";
import { useAuthStore } from "../store/useAuthStore";
import Card from "../components/ui/Card";
import { taskApi } from "../api/taskApi";
import MonthlyReportReminder from "../Features/dashboard/components/MonthlyReportReminder";
import MonthlyReportAnnouncement from "../Features/dashboard/components/MonthlyReportAnnouncement";

export default function Dashboard() {
  const navigate = useNavigate();
  const { tasks, fetchTasks } = useTaskStore();
  const { projects, fetchProjects } = useProjectStore();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    fetchTasks();
    fetchProjects();
  }, [fetchTasks, fetchProjects]);

  const [dailyProgressCounts, setDailyProgressCounts] = useState({
    done: 0,
    total: 0,
  });

  const loadDailyProgressCounts = useCallback(async () => {
    try {
      const data = await taskApi.getDailyProgress();
      setDailyProgressCounts({
        done: data.filter((t) => t.updatedToday).length,
        total: data.length,
      });
    } catch (err) {
      setDailyProgressCounts({ done: 0, total: 0 });
    }
  }, []);

  useEffect(() => {
    loadDailyProgressCounts();
  }, [loadDailyProgressCounts]);

  const completed = tasks.filter((t) => t.status === "done").length;
  const total = tasks.length || 1;
  const pct = Math.round((completed / total) * 100);

  const activeTasksCount = tasks.filter((t) => t.status !== "done").length;
  const activeProjectsCount = projects.filter(
    (p) => p.status === "active",
  ).length;

  const today = new Date().toISOString().split("T")[0];
  const overdueCount = tasks.filter(
    (t) => t.dueDate && t.dueDate < today && t.status !== "done",
  ).length;

  const firstName = user?.name?.split(" ")[0] || "there";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* ---- Left column (2/3 width) ---- */}
      <div className="lg:col-span-2 flex flex-col gap-4">
        <div className="glass glass--strong rounded-[14px] p-5 cascade-in">
          <div className="glass-content flex flex-col xl:flex-row gap-6">
            {/* Left side: Greeting + Stats + Progress */}
            <div className="flex-1 min-w-0 flex flex-col justify-between gap-4">
              <div>
                <div className="glass-dark mb-4 flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <span className="glass-badge glass-badge--primary mb-2 inline-flex">
                      <span className="glass-badge__dot" />{" "}
                      {user?.role || "Team Member"}
                    </span>
                    <h2
                      className="text-xl text-white font-semibold"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      Welcome back, {firstName}
                    </h2>
                    <p className="text-white/50 text-xs mt-0.5">
                      Here's what's happening across your projects today.
                    </p>
                  </div>

                  <DailyProgressBadge
                    done={dailyProgressCounts.done}
                    total={dailyProgressCounts.total}
                    onClick={() => navigate("/daily-progress")}
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <StatBox
                    label="Active Tasks"
                    value={activeTasksCount}
                    variant="green"
                  />
                  <StatBox
                    label="Active Projects"
                    value={activeProjectsCount}
                    variant="white"
                  />
                  <StatBox
                    label="Overdue Tasks"
                    value={overdueCount}
                    variant="overdue"
                  />
                </div>
              </div>

              {/* Task Completion Progress */}
              <div className="pt-2 border-t border-white/10">
                <div className="bg-black/20 p-3 rounded-xl backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-1.5">
                    <h3 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-white/70">
                      <TrendingUp size={13} className="text-orange-400" />
                      Task Completion Progress
                    </h3>
                    <span className="text-orange-400 font-semibold text-xs">
                      {pct}%
                    </span>
                  </div>
                  <div className="progress-track" style={{ height: "6px" }}>
                    <div
                      className="progress-fill"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-white/40 mt-1">
                    {completed} of {total} tasks completed
                  </p>
                </div>
              </div>
            </div>

            {/* Right side: Quick Actions & Present Employees */}
            <div className="xl:w-64 shrink-0 xl:border-l xl:border-white/10 xl:pl-6 flex flex-col justify-between gap-4">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-3">
                  Quick Actions
                </h3>
                <QuickActions columns={2} />
              </div>
            </div>
          </div>
        </div>

        {/* Priority & Overdue Tasks */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div
            className="solid-card p-5 cascade-in flex flex-col justify-between"
            style={{ animationDelay: "0.15s" }}
          >
            <div>
              <h3 className="flex items-center gap-2 text-sm font-semibold text-white mb-3">
                <Star size={15} className="text-orange-400" />
                Priority Tasks
              </h3>
              <PriorityTaskList />
            </div>
            <button
              className="view-all-link mt-3 self-start"
              onClick={() => navigate("/tasks")}
            >
              View all priority tasks <span>&rsaquo;</span>
            </button>
          </div>

          <div
            className="solid-card p-5 cascade-in flex flex-col justify-between"
            style={{ animationDelay: "0.2s" }}
          >
            <div>
              <h3 className="flex items-center gap-2 text-sm font-semibold text-red-400 mb-3">
                <AlertTriangle size={15} />
                Overdue Tasks
              </h3>
              <OverdueTasks />
            </div>
            <button
              className="view-all-link view-all-link--danger mt-3 self-start"
              onClick={() => navigate("/tasks")}
            >
              View all overdue tasks <span>&rsaquo;</span>
            </button>
          </div>
        </div>
      </div>

      {/* ---- Right column (1/3 width) ---- */}
      <div className="flex flex-col gap-4">
        <div className="cascade-in">
          <CalendarPreview />
        </div>
        <div className="cascade-in">
          <MonthlyReportReminder />
          <MonthlyReportAnnouncement />
        </div>

        <Card className="cascade-in" style={{ animationDelay: "0.1s" }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white">Activity</h3>
            <button
              className="view-all-link"
              onClick={() => navigate("/activity")}
            >
              View all
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <h4 className="text-[10px] font-semibold uppercase tracking-wider text-white/40 mb-1.5">
                Messages
              </h4>
              <ChatNotifications />
            </div>
            <div className="border-l border-white/10 pl-3">
              <h4 className="text-[10px] font-semibold uppercase tracking-wider text-white/40 mb-1.5">
                Task Assignments
              </h4>
              <TaskAssignments />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function DailyProgressBadge({ done, total, onClick }) {
  const hasUpdates = done > 0;

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs shrink-0 border transition-colors duration-200 cursor-pointer ${
        hasUpdates
          ? "bg-green-500/15 border-green-500/40 text-green-400 hover:bg-green-500/25"
          : "bg-white/5 border-white/15 text-white/50 hover:bg-white/10"
      }`}
      title="Go to Daily Progress"
    >
      <CalendarCheck2 size={13} />
      Daily Progress Updated {done}/{total}
    </button>
  );
}

function StatBox({ label, value, variant = "white" }) {
  const isRed = variant === "overdue" && value !== 0;

  if (isRed) {
    return (
      <div className="rounded-2xl p-3 bg-red-500/10 border border-red-500/30">
        <p
          className="text-xl font-semibold text-red-400"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {value}
        </p>
        <p className="text-[10px] mt-0.5 leading-tight font-bold text-red-300/90">
          {label}
        </p>
      </div>
    );
  }

  if (variant === "green") {
    return (
      <div className="rounded-2xl p-3 bg-green-500/10 border border-green-500/30">
        <p
          className="text-xl font-semibold text-green-400"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {value}
        </p>
        <p className="text-[10px] mt-0.5 leading-tight font-bold text-green-300/90">
          {label}
        </p>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-3">
      <div className="glass-content">
        <p
          className="text-xl font-semibold text-white"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {value}
        </p>
        <p className="text-[10px] mt-0.5 leading-tight font-bold text-white/70">
          {label}
        </p>
      </div>
    </div>
  );
}
