import { useEffect } from "react";
import TaskCompletionChart from "../features/dashboard/components/TaskCompletionChart";
import PriorityTaskList from "../features/dashboard/components/PriorityTaskList";
import InboxPreview from "../features/dashboard/components/InboxPreview";
import OverdueTasks from "../features/dashboard/components/OverdueTasks";
import CalendarPreview from "../features/dashboard/components/CalendarPreview";
//import DateTimeBox from "../features/dashboard/components/DateTimeBox";
import QuickActions from "../features/dashboard/components/QuickActions";
import { TrendingUp, Star, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTaskStore } from "../features/tasks/taskStore";
import { useProjectStore } from "../features/projects/projectStore";
import { useAuthStore } from "../store/useAuthStore";
import Card from "../components/ui/Card";
import PresentEmployeesButton from "../features/dashboard/components/AvailableEmployeesButton";

export default function Dashboard() {
  const navigate = useNavigate();
  const { tasks, fetchTasks } = useTaskStore();
  const { projects, fetchProjects } = useProjectStore();
  const user = useAuthStore((s) => s.user);

  // Dashboard is often the first page a user lands on after login, so it
  // needs to fetch its own data instead of relying on Tasks.jsx/Projects.jsx
  // having already been visited.
  useEffect(() => {
    fetchTasks();
    fetchProjects();
  }, [fetchTasks, fetchProjects]);

  const completed = tasks.filter((t) => t.status === "done").length;
  const total = tasks.length || 1;
  const pct = Math.round((completed / total) * 100);

  const activeProjectsCount = projects.filter(
    (p) => p.status === "active",
  ).length;

  const today = new Date().toISOString().split("T")[0];
  const overdueCount = tasks.filter(
    (t) => t.dueDate && t.dueDate < today && t.status !== "done",
  ).length;

  const firstName = user?.name?.split(" ")[0] || "there";

  return (
    <div className="grid grid-cols-3 gap-4">
      {/* ---- Left column (2/3 width) ---- */}
      <div className="col-span-2 flex flex-col gap-4">
        <div className="glass glass--strong rounded-[24px] p-8 cascade-in">
          <div className="glass-content flex flex-col md:flex-row gap-6 md:gap-8">
            <div className="flex-1 min-w-0">
              <div className="glass-dark mb-6">
                <span className="glass-badge glass-badge--primary mb-3 inline-flex">
                  <span className="glass-badge__dot" />{" "}
                  {user?.role || "Team Member"}
                </span>
                <h2
                  className="text-2xl text-white"
                  style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}
                >
                  Welcome back, {firstName}
                </h2>
                <p className="text-white/50 text-sm">
                  Here's what's happening across your projects today.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <StatBox
                  label="Tasks completed"
                  value={completed}
                  color="#2e261f"
                />
                <StatBox
                  label="Active projects"
                  value={activeProjectsCount}
                  color="#2e261f"
                />
                <StatBox
                  label="Overdue tasks"
                  value={overdueCount}
                  color="#2e261f"
                />
              </div>
            </div>
            <div className="md:w-52 shrink-0 md:border-l md:border-white/10 md:pl-8">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-3">
                Quick Actions
              </h3>
              <QuickActions columns={2} />
              <div className="mt-2.5">
                <PresentEmployeesButton />
              </div>
            </div>
          </div>
        </div>

        <div
          className="solid-card p-6 cascade-in"
          style={{ animationDelay: "0.1s" }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/70">
              <TrendingUp size={14} className="text-orange-400" />
              Task Completion Progress
            </h3>
            <span className="text-orange-400 font-semibold text-sm">
              {pct}%
            </span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <p className="text-xs text-white/40 mt-2">
            {completed} of {total} tasks completed
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div
            className="solid-card p-6 cascade-in"
            style={{ animationDelay: "0.15s" }}
          >
            <h3 className="flex items-center gap-2 text-sm font-semibold text-white mb-4">
              <Star size={15} className="text-orange-400" />
              Priority Tasks
            </h3>
            <PriorityTaskList />
            <button
              className="view-all-link"
              onClick={() => navigate("/tasks")}
            >
              View all priority tasks <span>&rsaquo;</span>
            </button>
          </div>

          <div
            className="solid-card p-6 cascade-in"
            style={{ animationDelay: "0.2s" }}
          >
            <h3 className="flex items-center gap-2 text-sm font-semibold text-red-400 mb-4">
              <AlertTriangle size={15} />
              Overdue Tasks
            </h3>
            <OverdueTasks />
            <button
              className="view-all-link view-all-link--danger"
              onClick={() => navigate("/tasks")}
            >
              View all overdue tasks <span>&rsaquo;</span>
            </button>
          </div>
        </div>

        <div
          className="solid-card p-6 cascade-in"
          style={{ animationDelay: "0.25s" }}
        >
          <h3 className="text-sm font-semibold text-white mb-4">
            Task Completion
          </h3>
          <TaskCompletionChart />
        </div>
      </div>

      {/* ---- Right column (1/3 width) ---- */}
      <div className="flex flex-col gap-4">
        <div className="cascade-in">
          <CalendarPreview />
        </div>

        <Card className="cascade-in" style={{ animationDelay: "0.1s" }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white">Inbox</h3>
            <button
              className="view-all-link"
              onClick={() => navigate("/inbox")}
            >
              View all
            </button>
          </div>
          <InboxPreview />
        </Card>
      </div>
    </div>
  );
}

function StatBox({ label, value, accent, color }) {
  const valueColor = accent === "danger" ? "text-red-400" : "text-white";
  return (
    <div className="glass rounded-2xl p-4">
      <div className="glass-content">
        <p
          className={`text-2xl font-semibold ${color ? "" : valueColor}`}
          style={{
            fontFamily: "var(--font-display)",
            ...(color ? { color } : {}),
          }}
        >
          {value}
        </p>
        <p
          className="text-xs mt-1"
          style={{ color: "#482b13", fontWeight: "bold" }}
        >
          {label}
        </p>
      </div>
    </div>
  );
}
