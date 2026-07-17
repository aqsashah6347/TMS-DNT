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

    const loadTasks = async () => {
      setLoading(true);

      try {
        const data = await taskApi.getAllTasks({ assignedTo: user.id });
        if (cancelled) return;

        const sorted = [...data].sort(
          (a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0),
        );
        setTasks(sorted);
      } catch (error) {
        // Intentionally silent: no-op for dashboard widget.
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadTasks();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const isOverdue = (dueDate, status) =>
    dueDate &&
    status !== "done" &&
    dueDate < new Date().toISOString().split("T")[0];

  return (
    <div className="bronze-panel h-full flex flex-col">
      <div className="section-glass-header">
        <div className="flex items-center gap-2.5">
          <Layers size={18} className="text-amber-dim" />
          <h3 className="section-glass-header__title !text-base">
            Task Activity
          </h3>
        </div>
      </div>

      <div className="bronze-panel__body flex-1 min-h-0 flex flex-col">
        <div className="activity-scroll flex-1 overflow-y-auto max-h-[420px] flex flex-col gap-1.5 pr-1">
          {loading && tasks.length === 0 ? (
            <div className="py-10 text-center text-silver-muted text-sm">
              Loading tasks...
            </div>
          ) : tasks.length === 0 ? (
            <div className="py-10 text-center text-silver-muted text-sm">
              No tasks assigned to you yet
            </div>
          ) : (
            tasks.slice(0, 8).map((t) => (
              <button
                key={t.id}
                onClick={() => navigate("/tasks")}
                className="text-left rounded-xl px-3 py-3 hover:bg-white/[0.04] transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-white/90 font-medium truncate">
                    {t.title}
                  </span>
                  {isOverdue(t.dueDate, t.status) && (
                    <span className="status-pill status-pill--backlog !text-red-300 !border-red-500/30 !bg-red-500/10 shrink-0">
                      Overdue
                    </span>
                  )}
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-silver-muted">
                  <span className="flex items-center gap-1.5">
                    <CalendarClock size={13} className="text-white/30" />
                    Assigned {formatPlainDate(t.createdAt)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CalendarCheck size={13} className="text-white/30" />
                    Due {formatPlainDate(t.dueDate)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <RefreshCw size={13} className="text-white/30" />
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
