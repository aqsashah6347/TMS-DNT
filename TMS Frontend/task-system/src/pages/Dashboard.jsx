import TaskCompletionChart from "../features/dashboard/components/TaskCompletionChart";
import PriorityTaskList from "../features/dashboard/components/PriorityTaskList";
import InboxPreview from "../features/dashboard/components/InboxPreview";
import OverdueTasks from "../features/dashboard/components/OverdueTasks";
import CalendarPreview from "../features/dashboard/components/CalendarPreview";



export default function Dashboard() {
  return (
    <div className="grid grid-cols-3 gap-4">
      {/* Top row: greeting + quick stats */}
      <div className="col-span-2 bg-surface rounded-card shadow-card p-6">
        <h2 className="text-2xl font-bold text-dark mb-1">
          Welcome back, Aqsa 👋
        </h2>
        <p className="text-muted text-sm mb-6">
          Here's what's happening across your projects today.
        </p>

        <div className="grid grid-cols-3 gap-4">
          <StatBox label="Tasks completed" value="42" />
          <StatBox label="Overdue tasks" value="3" accent="danger" />
          <StatBox label="Active projects" value="7" />
        </div>
      </div>

      {/* Inbox preview - placeholder */}
      <div className="bg-surface rounded-card shadow-card p-6 row-span-2">
        <h3 className="font-semibold text-dark mb-4">Inbox</h3>
        <InboxPreview />
      </div>

      {/* Task completion chart - placeholder */}
      <div className="col-span-2 bg-surface rounded-card shadow-card p-6">
        <h3 className="font-semibold text-dark mb-4">Task Completion</h3>
        <TaskCompletionChart />
      </div>

      {/* Priority tasks - placeholder */}
      <div className="bg-surface rounded-card shadow-card p-6">
        <h3 className="font-semibold text-dark mb-4">Priority Tasks</h3>
        <PriorityTaskList />
      </div>

      {/* Overdue tasks - placeholder */}
      <div className="bg-surface rounded-card shadow-card p-6">
        <h3 className="font-semibold text-dark mb-4">Overdue</h3>
        <OverdueTasks />
      </div>

      {/* Calendar preview - placeholder */}
      <div className="col-span-2 bg-surface rounded-card shadow-card p-6">
        <h3 className="font-semibold text-dark mb-4">Calendar</h3>
        <CalendarPreview />
      </div>
    </div>
  );
}

function StatBox({ label, value, accent }) {
  const valueColor = accent === "danger" ? "text-danger-text" : "text-dark";
  return (
    <div className="bg-bg rounded-card p-4">
      <p className={`text-2xl font-bold ${valueColor}`}>{value}</p>
      <p className="text-xs text-muted mt-1">{label}</p>
    </div>
  );
}
