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
      <p className="text-sm text-white/40">
        Nothing overdue — you're on track!
      </p>
    );

  return (
    <div className="flex flex-col">
      {overdueTasks.slice(0, 4).map((task) => {
        const daysOverdue = Math.floor(
          (new Date(today) - new Date(task.dueDate)) / 86400000,
        );
        const label =
          daysOverdue <= 0
            ? "today"
            : daysOverdue === 1
              ? "1 day ago"
              : `${daysOverdue} days ago`;

        return (
          <button
            key={task.id}
            onClick={() => handleClick(task)}
            className="dot-row"
          >
            <span className="dot-row__dot dot-row__dot--red" />
            <span className="dot-row__title">{task.title}</span>
            <span className="dot-row__overdue-meta">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
