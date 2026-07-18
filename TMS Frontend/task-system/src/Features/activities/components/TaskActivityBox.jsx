import { useEffect, useState } from "react";
import { CalendarClock, CalendarCheck, Layers } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { taskApi } from "../../../api/taskApi";
import { useAuthStore } from "../../../store/useAuthStore";
import { formatPlainDate } from "../../../lib/dateFormat";

// Same status vocabulary/classes as MyTeamView.jsx's statusPillClass —
// kept local here since this box only ever needs the task variants.
const STATUS_META = {
  backlog: { pill: "status-pill--backlog", label: "Not started" },
  "in progress": { pill: "status-pill--in-progress", label: "In Progress" },
  review: { pill: "status-pill--review", label: "In Review" },
  done: { pill: "status-pill--done", label: "Completed" },
};

function StatusPill({ status }) {
  const meta = STATUS_META[status] || STATUS_META.backlog;
  return (
    <span className={`status-pill ${meta.pill} shrink-0`}>{meta.label}</span>
  );
}

// Role-scoped:
// - admin: tasks THEY have assigned to others (assignedBy = me)
// - manager: toggle between "My Tasks" (assigned to me) and tasks they've
//   assigned to others (assignedBy = me)
// - user: only tasks assigned to them (assignedTo = me) — unchanged
// Assign date / due date / completion status show in every mode, for
// every role.
export default function TaskActivityBox() {
  const user = useAuthStore((s) => s.user);
  const role = user?.role;
  const navigate = useNavigate();

  // Only meaningful for managers — admins and regular users each have a
  // single fixed view, so this state is simply ignored for them.
  const [view, setView] = useState("assignedToMe"); // "assignedToMe" | "assignedByMe"

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Admins always see what they've assigned to others; regular users
  // always see what's assigned to them; managers follow the toggle.
  const effectiveView =
    role === "admin"
      ? "assignedByMe"
      : role === "user"
        ? "assignedToMe"
        : view;

  useEffect(() => {
    let cancelled = false;
    if (!user?.id) return;

    const loadTasks = async () => {
      setLoading(true);

      try {
        const filters =
          effectiveView === "assignedByMe"
            ? { assignedBy: user.id }
            : { assignedTo: user.id };

        const data = await taskApi.getAllTasks(filters);
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
  }, [user?.id, effectiveView]);

  const isOverdue = (dueDate, status) =>
    dueDate &&
    status !== "done" &&
    dueDate < new Date().toISOString().split("T")[0];

  const emptyMessage =
    effectiveView === "assignedByMe"
      ? "You haven't assigned any tasks yet"
      : "No tasks assigned to you yet";

  return (
    <div className="bronze-panel h-full flex flex-col">
      <div className="section-glass-header">
        <div className="flex items-center gap-2.5">
          <Layers size={18} className="text-amber-dim" />
          <h3 className="section-glass-header__title !text-base">
            Task Activity
          </h3>
        </div>

        {/* Toggle only makes sense for managers — admins and regular
            users each have exactly one view. */}
        {role === "manager" && (
          <div className="flex items-center gap-1 rounded-full bg-white/[0.04] p-1 border border-white/10">
            <button
              onClick={() => setView("assignedToMe")}
              className={`text-xs px-3 py-1 rounded-full transition-colors ${
                view === "assignedToMe"
                  ? "bg-amber-500/20 text-amber-dim"
                  : "text-white/50 hover:text-white/80"
              }`}
            >
              My Tasks
            </button>
            <button
              onClick={() => setView("assignedByMe")}
              className={`text-xs px-3 py-1 rounded-full transition-colors ${
                view === "assignedByMe"
                  ? "bg-amber-500/20 text-amber-dim"
                  : "text-white/50 hover:text-white/80"
              }`}
            >
              Assigned by Me
            </button>
          </div>
        )}
      </div>

      <div className="bronze-panel__body flex-1 min-h-0 flex flex-col">
        <div className="activity-scroll flex-1 overflow-y-auto max-h-[420px] flex flex-col gap-1.5 pr-1">
          {loading && tasks.length === 0 ? (
            <div className="py-10 text-center text-silver-muted text-sm">
              Loading tasks...
            </div>
          ) : tasks.length === 0 ? (
            <div className="py-10 text-center text-silver-muted text-sm">
              {emptyMessage}
            </div>
          ) : (
            tasks.slice(0, 8).map((t) => {
              const counterpart =
                effectiveView === "assignedByMe"
                  ? `to ${t.assignedToName || "Unassigned"}`
                  : `by ${t.assignedByName || "Unknown"}`;

              return (
                <button
                  key={t.id}
                  onClick={() => navigate("/tasks")}
                  className="text-left rounded-xl px-3 py-3 hover:bg-white/[0.04] transition-colors overflow-hidden"
                >
                  <div className="flex items-center justify-between gap-2">
                    {/* min-w-0 is what lets this shrink/truncate instead
                        of pushing the pills out past the card edge. */}
                    <div className="min-w-0 flex-1">
                      <span className="text-sm text-white/90 font-medium truncate block">
                        {t.title}
                        <span className="text-silver-muted font-normal">
                          {" "}
                          — Assigned {counterpart}
                        </span>
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {isOverdue(t.dueDate, t.status) && (
                        <span className="status-pill status-pill--backlog !text-red-300 !border-red-500/30 !bg-red-500/10">
                          Overdue
                        </span>
                      )}
                      <StatusPill status={t.status} />
                    </div>
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
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}