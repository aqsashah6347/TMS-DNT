import { useEffect } from "react";
import { ClipboardList } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTaskStore } from "../../tasks/taskStore";
import { useAuthStore } from "../../../store/useAuthStore";
import { formatPlainDate } from "../../../lib/dateFormat";

// Right column of the Dashboard's Activity box. Every field here comes
// straight off the real task record (see taskController's
// fetchTaskWithJoins) — createdAt doubles as "date assigned" since tasks
// are created with an assignee already set, same convention
// TaskActivityBox.jsx uses on the Activity page.
export default function TaskAssignments() {
  const { tasks, fetchTasks } = useTaskStore();
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const assigned = tasks
    .filter((t) => String(t.assignedTo) === String(user?.id))
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 4);

  if (assigned.length === 0) {
    return <p className="text-sm text-white/40">No task assignments yet</p>;
  }

  return (
    <div className="flex flex-col">
      {assigned.map((t) => (
        <button
          key={t.id}
          onClick={() => navigate("/tasks")}
          className="w-full text-left rounded-lg px-1 py-1.5 hover:bg-white/[0.04] transition-colors"
        >
          <div className="flex items-center gap-1.5">
            <ClipboardList size={12} className="text-orange-400 shrink-0" />
            <span className="text-xs font-medium text-white/90 truncate">
              {t.title}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-1.5 text-[10px] text-white/40 mt-0.5 pl-[18px]">
            <span>Assigned {formatPlainDate(t.createdAt)}</span>
            <span>· by {t.assignedByName || "Unknown"}</span>
            <span>· Due {formatPlainDate(t.dueDate)}</span>
          </div>
        </button>
      ))}
    </div>
  );
}