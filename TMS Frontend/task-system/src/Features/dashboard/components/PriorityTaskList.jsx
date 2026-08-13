import { useNavigate } from "react-router-dom";
import { useTaskStore } from "../../tasks/taskStore";

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function PriorityTaskList() {
  const { tasks, openTaskView } = useTaskStore();
  const navigate = useNavigate();

  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  const threeDaysOut = new Date(startOfToday);
  threeDaysOut.setDate(threeDaysOut.getDate() + 3);
  threeDaysOut.setHours(23, 59, 59, 999);

  const priorityTasks = [...tasks]
    .filter((t) => t.status !== "done" && t.dueDate)
    .filter((t) => {
      const due = new Date(t.dueDate);
      return due >= startOfToday && due <= threeDaysOut;
    })
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

  function handleClick(task) {
    openTaskView(task);
    navigate("/tasks");
  }

  if (priorityTasks.length === 0)
    return <p className="text-sm text-white/40">No tasks yet.</p>;

  return (
    <div className="flex flex-col">
      {priorityTasks.map((task) => (
        <button
          key={task.id}
          onClick={() => handleClick(task)}
          className="dot-row"
        >
          <span className="dot-row__dot dot-row__dot--amber" />
          <span className="dot-row__title">{task.title}</span>
          {(task.priority === "critical" || task.priority === "high") && (
            <span className="priority-pill priority-pill--high">High</span>
          )}
          {task.priority === "medium" && (
            <span className="priority-pill priority-pill--medium">Medium</span>
          )}
          {task.priority === "low" && (
            <span className="priority-pill priority-pill--low">Low</span>
          )}
          <span className="dot-row__meta">{formatDate(task.dueDate)}</span>
        </button>
      ))}
    </div>
  );
}
