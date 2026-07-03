import { Flag } from "lucide-react";

// Placeholder data — later this comes from taskApi.getTasks({ sort: 'priority' })
const priorityTasks = [
  { id: 1, title: "Fix login 2FA bug", priority: "critical", dueDate: "Today" },
  {
    id: 2,
    title: "Review project proposal",
    priority: "high",
    dueDate: "Tomorrow",
  },
  {
    id: 3,
    title: "Update team permissions",
    priority: "medium",
    dueDate: "Jul 5",
  },
];

const priorityStyles = {
  critical: "bg-danger text-danger-text",
  high: "bg-warning text-warning-text",
  medium: "bg-info text-info-text",
  low: "bg-primary-light text-dark",
};

export default function PriorityTaskList() {
  return (
    <div className="flex flex-col gap-3">
      {priorityTasks.map((task) => (
        <div
          key={task.id}
          className="flex items-center justify-between gap-2 bg-bg rounded-card px-3 py-2"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Flag size={14} className="text-muted shrink-0" />
            <span className="text-sm text-dark truncate">{task.title}</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-muted">{task.dueDate}</span>
            <span
              className={`text-[10px] font-medium px-2 py-0.5 rounded-full capitalize ${priorityStyles[task.priority]}`}
            >
              {task.priority}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
