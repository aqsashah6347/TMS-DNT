import TaskCompletionChart from "../features/dashboard/components/TaskCompletionChart";
import PriorityTaskList from "../features/dashboard/components/PriorityTaskList";
import InboxPreview from "../features/dashboard/components/InboxPreview";
import OverdueTasks from "../features/dashboard/components/OverdueTasks";
import CalendarPreview from "../features/dashboard/components/CalendarPreview";
import DateTimeBox from "../features/dashboard/components/DateTimeBox";
import Card from "../components/ui/Card";

export default function Dashboard() {
  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="glass col-span-2 rounded-[24px] p-8 cascade-in">
        <div className="glass-content">
          <span className="glass-badge glass-badge--primary mb-3 inline-flex">
            <span className="glass-badge__dot" /> Dashboard Overview
          </span>
          <h2 className="text-2xl text-white" style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}>
            Welcome back, Aqsa
          </h2>
          <p className="text-white/50 text-sm mb-6">
            Here's what's happening across your projects today.
          </p>

          <div className="grid grid-cols-3 gap-4">
            <StatBox label="Tasks completed" value="42" />
            <StatBox label="Overdue tasks" value="3" accent="danger" />
            <StatBox label="Active projects" value="7" />
          </div>
        </div>
      </div>

      <div
        className="solid-card p-6 flex flex-col gap-4 cascade-in"
        style={{ animationDelay: "0.1s" }}
      >
        <DateTimeBox />
        <div>
          <h3 className="text-sm font-semibold text-white mb-3">Calendar</h3>
          <CalendarPreview />
        </div>
      </div>

      <div
        className="solid-card col-span-2 p-6 cascade-in"
        style={{ animationDelay: "0.15s" }}
      >
        <h3 className="text-sm font-semibold text-white mb-4">
          Task Completion
        </h3>
        <TaskCompletionChart />
      </div>

      <Card className="cascade-in" style={{ animationDelay: "0.2s" }}>
        <h3 className="text-sm font-semibold text-white mb-4">Inbox</h3>
        <InboxPreview />
      </Card>

      <Card className="cascade-in" style={{ animationDelay: "0.25s" }}>
        <h3 className="text-sm font-semibold text-white mb-4">
          Priority Tasks
        </h3>
        <PriorityTaskList />
      </Card>

      <Card
        className="col-span-2 cascade-in"
        style={{ animationDelay: "0.3s" }}
      >
        <h3 className="text-sm font-semibold text-white mb-4">Overdue</h3>
        <OverdueTasks />
      </Card>
    </div>
  );
}

function StatBox({ label, value, accent }) {
  const valueColor = accent === "danger" ? "text-red-400" : "text-white";
  return (
    <div className="glass rounded-2xl p-4">
      <div className="glass-content">
        <p
          className={`text-2xl font-semibold ${valueColor}`}
          style={{ fontFamily: "var(--font-display)" }}
        >
          {value}
        </p>
        <p className="text-xs text-white/50 mt-1">{label}</p>
      </div>
    </div>
  );
}
