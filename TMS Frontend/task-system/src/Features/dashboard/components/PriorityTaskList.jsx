import { Flag } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTaskStore } from "../../tasks/taskStore";

const priorityStyles = {
  critical: "bg-danger text-danger-text",
  high: "bg-warning text-warning-text",
  medium: "bg-info text-info-text",
  low: "bg-primary-light text-dark",
};

const priorityRank = { critical: 0, high: 1, medium: 2, low: 3 };

export default function PriorityTaskList() {
  const { tasks, openTaskView } = useTaskStore();
  const navigate = useNavigate();

  const priorityTasks = [...tasks]
    .sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority])
    .slice(0, 4);

  function handleClick(task) {
    openTaskView(task);
    navigate("/tasks");
  }

  if (priorityTasks.length === 0)
    return <p className="text-sm text-muted">No tasks yet.</p>;

  return (
    <div className="flex flex-col gap-2">
      {priorityTasks.map((task) => (
        <button
          key={task.id}
          onClick={() => handleClick(task)}
          className="w-full flex items-center justify-between gap-2 bg-bg rounded-card px-3 py-2 hover:bg-primary-light/40 transition-colors text-left"
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
        </button>
      ))}
    </div>
  );
}
