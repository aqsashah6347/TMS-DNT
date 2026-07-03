import { AlertTriangle } from "lucide-react";

// Placeholder — later from taskApi.getTasks({ overdue: true })
const overdueTasks = [
  { id: 1, title: "Review proposal", daysOverdue: 2 },
  { id: 2, title: "Client feedback call", daysOverdue: 1 },
];

export default function OverdueTasks() {
  if (overdueTasks.length === 0) {
    return (
      <p className="text-sm text-muted">Nothing overdue — you're on track 🎉</p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {overdueTasks.map((task) => (
        <div
          key={task.id}
          className="flex items-center gap-2 bg-danger/20 rounded-card px-3 py-2"
        >
          <AlertTriangle size={14} className="text-danger-text shrink-0" />
          <span className="text-sm text-dark flex-1 truncate">
            {task.title}
          </span>
          <span className="text-xs font-medium text-danger-text shrink-0">
            {task.daysOverdue}d overdue
          </span>
        </div>
      ))}
    </div>
  );
}
