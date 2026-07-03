import { AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTaskStore } from "../../tasks/taskStore";

export default function OverdueTasks() {
  const { tasks, openTaskView } = useTaskStore();
  const navigate = useNavigate();

  const today = new Date().toISOString().split("T")[0];
  const overdueTasks = tasks.filter(
    (t) => t.dueDate < today && t.status !== "done",
  );

  function handleClick(task) {
    openTaskView(task);
    navigate("/tasks");
  }

  if (overdueTasks.length === 0)
    return (
      <p className="text-sm text-muted">Nothing overdue — you're on track 🎉</p>
    );

  return (
    <div className="flex flex-col gap-2">
      {overdueTasks.map((task) => {
        const daysOverdue = Math.floor(
          (new Date(today) - new Date(task.dueDate)) / 86400000,
        );
        return (
          <button
            key={task.id}
            onClick={() => handleClick(task)}
            className="w-full flex items-center gap-2 bg-danger/15 rounded-card px-3 py-2 hover:bg-danger/25 transition-colors text-left"
          >
            <AlertTriangle size={14} className="text-danger-text shrink-0" />
            <span className="text-sm text-dark flex-1 truncate">
              {task.title}
            </span>
            <span className="text-xs font-medium text-danger-text shrink-0">
              {daysOverdue}d overdue
            </span>
          </button>
        );
      })}
    </div>
  );
}
