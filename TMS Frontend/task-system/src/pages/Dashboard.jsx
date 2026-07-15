import { useEffect } from "react";
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
        {/* Padding updated from p-8 to p-5 for height reduction */}
        <div className="glass glass--strong rounded-[24px] p-5 cascade-in">
          <div className="glass-content flex flex-col md:flex-row gap-6 md:gap-8">
            <div className="flex-1 min-w-0 flex flex-col justify-between">
              <div>
                {/* Margin bottom reduced from mb-6 to mb-4 */}
                <div className="glass-dark mb-4">
                  <span className="glass-badge glass-badge--primary mb-2.5 inline-flex">
                    <span className="glass-badge__dot" />{" "}
                    {user?.role || "Team Member"}
                  </span>
                  <h2
                    className="text-xl text-white"
                    style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}
                  >
                    Welcome back, {firstName}
                  </h2>
                  <p className="text-white/50 text-xs mt-0.5">
                    Here's what's happening across your projects today.
                  </p>
                </div>

                {/* Gap and margin optimized */}
                <div className="grid grid-cols-3 gap-3 mb-4">
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

              {/* ---- Task Completion Progress INSIDE White card with Dark BG ---- */}
              <div className="mt-1 pt-3 border-t border-white/10">
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
                  <div className="progress-track" style={{ height: '6px' }}>
                    <div className="progress-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-[11px] text-white/40 mt-1">
                    {completed} of {total} tasks completed
                  </p>
                </div>
              </div>
            </div>
            
            {/* Quick Actions column layout intact but slightly more compact spacing */}
            <div className="md:w-52 shrink-0 md:border-l md:border-white/10 md:pl-6">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-2">
                Quick Actions
              </h3>
              <QuickActions columns={2} />
              <div className="mt-2">
                <PresentEmployeesButton />
              </div>
            </div>
          </div>
        </div>

        {/* Priority & Overdue Cards Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div
            className="solid-card p-5 cascade-in"
            style={{ animationDelay: "0.15s" }}
          >
            <h3 className="flex items-center gap-2 text-sm font-semibold text-white mb-3">
              <Star size={15} className="text-orange-400" />
              Priority Tasks
            </h3>
            <PriorityTaskList />
            <button
              className="view-all-link mt-2"
              onClick={() => navigate("/tasks")}
            >
              View all priority tasks <span>&rsaquo;</span>
            </button>
          </div>

          <div
            className="solid-card p-5 cascade-in"
            style={{ animationDelay: "0.2s" }}
          >
            <h3 className="flex items-center gap-2 text-sm font-semibold text-red-400 mb-3">
              <AlertTriangle size={15} />
              Overdue Tasks
            </h3>
            <OverdueTasks />
            <button
              className="view-all-link view-all-link--danger mt-2"
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
    <div className="glass rounded-2xl p-3">
      <div className="glass-content">
        <p
          className={`text-xl font-semibold ${color ? "" : valueColor}`}
          style={{
            fontFamily: "var(--font-display)",
            ...(color ? { color } : {}),
          }}
        >
          {value}
        </p>
        <p
          className="text-[10px] mt-0.5 leading-tight"
          style={{ color: "#482b13", fontWeight: "bold" }}
        >
          {label}
        </p>
      </div>
    </div>
  );
}