import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, CheckCircle2, Clock } from "lucide-react";
import { useUIStore } from "../../../store/useUIStore";
import { useAuthStore } from "../../../store/useAuthStore";
import { useTaskStore } from "../taskStore";

export default function CompletedLogPanel() {
  const isOpen = useUIStore((s) => s.isCompletedLogOpen);
  const closeCompletedLog = useUIStore((s) => s.closeCompletedLog);
  const completedLog = useTaskStore((s) => s.completedLog);
  const fetchCompletedLog = useTaskStore((s) => s.fetchCompletedLog);
  const { user } = useAuthStore();
  const canManageTasks = user?.role === "admin" || user?.role === "manager";

  const [logScope, setLogScope] = useState("myTasks");

  useEffect(() => {
    if (isOpen) fetchCompletedLog();
  }, [isOpen, fetchCompletedLog]);

  if (!isOpen) return null;

  const visibleLog = canManageTasks
    ? completedLog.filter((t) =>
        logScope === "myTasks"
          ? String(t.assignedTo) === String(user?.id)
          : String(t.assignedBy) === String(user?.id) &&
            String(t.assignedTo) !== String(user?.id),
      )
    : completedLog;

  return createPortal(
    <>
      <div
        className="fixed inset-0 bg-black/50 z-[400]"
        onClick={closeCompletedLog}
      />
      <div className="fixed top-20 inset-x-4 sm:inset-x-auto sm:left-auto sm:right-6 w-[min(24rem,calc(100vw-2rem))] max-h-[70vh] glass rounded-2xl border border-white/10 z-[500] flex flex-col overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-400" />
            Completed Tasks
          </h3>
          <button
            onClick={closeCompletedLog}
            className="text-white/60 hover:text-white p-1"
          >
            <X size={18} />
          </button>
        </div>

        {canManageTasks && (
          <div className="flex gap-1 px-3 pt-3 shrink-0">
            {[
              { key: "myTasks", label: "My Tasks" },
              { key: "assignedTasks", label: "Assigned Tasks" },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setLogScope(key)}
                className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium cursor-pointer transition-all duration-300 ease-out ${
                  logScope === key
                    ? "bg-primary text-dark shadow-[0_0_14px_rgba(251,146,60,0.4)]"
                    : "text-muted bg-white/5 hover:text-orange-300 hover:bg-orange-500/10"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-3 py-3">
          {visibleLog.length === 0 && (
            <p className="text-white/40 italic py-6 text-center text-sm">
              {logScope === "assignedTasks"
                ? "No team completions yet."
                : "No completed tasks yet."}
            </p>
          )}
          {visibleLog.map((t) => {
            const completed = new Date(t.completedAt);
            return (
              <div
                key={t.id}
                className="flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors"
              >
                <CheckCircle2
                  size={16}
                  className="text-emerald-400 mt-0.5 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-white/90 truncate">{t.title}</p>
                  {canManageTasks && logScope === "assignedTasks" && (
                    <p className="text-xs text-orange-300/80 truncate">
                      {t.assignedToName || "Unknown"}
                    </p>
                  )}
                  <p className="text-xs text-white/40 flex items-center gap-1 mt-0.5">
                    <Clock size={11} />
                    {completed.toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                    {" · "}
                    {completed.toLocaleTimeString("en-GB", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>,
    document.body,
  );
}
