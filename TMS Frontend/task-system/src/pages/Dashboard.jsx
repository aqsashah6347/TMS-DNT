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
      {/* Banner */}
      <div className="col-span-2 rounded-card p-6 bg-gradient-to-br from-primary via-primary to-primary-light relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/10" />
        <div className="absolute -right-2 top-16 w-24 h-24 rounded-full bg-white/10" />
        <h2 className="relative text-2xl font-bold text-dark mb-1">
          Welcome back, Aqsa 👋
        </h2>
        <p className="relative text-dark/70 text-sm mb-6">
          Here's what's happening across your projects today.
        </p>

        <div className="relative grid grid-cols-3 gap-4">
          <StatBox label="Tasks completed" value="42" />
          <StatBox label="Overdue tasks" value="3" accent="danger" />
          <StatBox label="Active projects" value="7" />
        </div>
      </div>

      {/* Top-right: date/time + calendar, stacked above Inbox */}
      <Card className="p-4 flex flex-col gap-4">
        <DateTimeBox />
        <div>
          <h3 className="font-semibold text-dark text-sm mb-3">Calendar</h3>
          <CalendarPreview />
        </div>
      </Card>

      {/* Task completion chart */}
      <Card className="col-span-2 p-6">
        <h3 className="font-semibold text-dark mb-4">Task Completion</h3>
        <TaskCompletionChart />
      </Card>

      {/* Inbox — directly below the calendar card */}
      <Card className="p-6">
        <h3 className="font-semibold text-dark mb-4">Inbox</h3>
        <InboxPreview />
      </Card>

      {/* Priority + Overdue */}
      <Card className="p-6">
        <h3 className="font-semibold text-dark mb-4">Priority Tasks</h3>
        <PriorityTaskList />
      </Card>

      <Card className="col-span-2 p-6">
        <h3 className="font-semibold text-dark mb-4">Overdue</h3>
        <OverdueTasks />
      </Card>
    </div>
  );
}

function StatBox({ label, value, accent }) {
  const valueColor = accent === "danger" ? "text-danger-text" : "text-dark";
  return (
    <div className="bg-white/50 backdrop-blur-sm rounded-card p-4">
      <p className={`text-2xl font-bold ${valueColor}`}>{value}</p>
      <p className="text-xs text-dark/60 mt-1">{label}</p>
    </div>
  );
}
