import { useEffect, useState } from "react";
import { CalendarClock, CalendarCheck, RefreshCw, Layers } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { taskApi } from "../../../api/taskApi";
import { useAuthStore } from "../../../store/useAuthStore";
import { formatPlainDate, formatRelativeTime } from "../../../lib/dateFormat";

// Deliberately fetches its own scoped copy of "my tasks" via taskApi
// instead of subscribing to the global taskStore — this box only needs
// a read-only, sorted-by-recency slice, and pulling from the shared
// store risked stepping on Tasks.jsx's own filters/view state.
export default function TaskActivityBox() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!user?.id) return;

    setLoading(true);
    taskApi
      .getAllTasks({ assignedTo: user.id })
      .then((data) => {
        if (cancelled) return;
        const sorted = [...data].sort(
          (a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0),
        );
        setTasks(sorted);
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const isOverdue = (dueDate, status) =>
    dueDate &&
    status !== "done" &&
    dueDate < new Date().toISOString().split("T")[0];

  return (
    <div className="glass glass-card h-full">
      <div className="glass-content p-4 flex flex-col h-full">
        <div className="flex items-center gap-2 mb-3">
          <Layers size={16} className="text-orange-400" />
          <h3
            className="text-sm text-white"
            style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}
          >
            Task Activity
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto max-h-[420px] flex flex-col gap-1.5 pr-1">
          {loading && tasks.length === 0 ? (
            <div className="py-10 text-center text-white/40 text-xs">
              Loading tasks...
            </div>
          ) : tasks.length === 0 ? (
            <div className="py-10 text-center text-white/40 text-xs">
              No tasks assigned to you yet
            </div>
          ) : (
            tasks.slice(0, 8).map((t) => (
              <button
                key={t.id}
                onClick={() => navigate("/tasks")}
                className="text-left rounded-xl px-2.5 py-2.5 hover:bg-white/[0.04] transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-white/90 font-medium truncate">
                    {t.title}
                  </span>
                  {isOverdue(t.dueDate, t.status) && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/20 shrink-0">
                      Overdue
                    </span>
                  )}
                </div>

                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-white/40">
                  <span className="flex items-center gap-1">
                    <CalendarClock size={11} className="text-white/30" />
                    Assigned {formatPlainDate(t.createdAt)}
                  </span>
                  <span className="flex items-center gap-1">
                    <CalendarCheck size={11} className="text-white/30" />
                    Due {formatPlainDate(t.dueDate)}
                  </span>
                  <span className="flex items-center gap-1">
                    <RefreshCw size={11} className="text-white/30" />
                    Updated {formatRelativeTime(t.updatedAt)}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}