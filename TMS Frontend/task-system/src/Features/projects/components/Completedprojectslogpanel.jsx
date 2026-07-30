import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, CheckCircle2, Clock, Undo2 } from "lucide-react";
import { useUIStore } from "../../../store/useUIStore";
import { useAuthStore } from "../../../store/useAuthStore";
import { useProjectStore } from "../projectStore";

export default function CompletedProjectsLogPanel() {
  const isOpen = useUIStore((s) => s.isCompletedProjectsLogOpen);
  const closeCompletedProjectsLog = useUIStore(
    (s) => s.closeCompletedProjectsLog,
  );
  const completedLog = useProjectStore((s) => s.completedLog);
  const fetchCompletedLog = useProjectStore((s) => s.fetchCompletedLog);
  const undoCompletedProject = useProjectStore((s) => s.undoCompletedProject);
  const { user } = useAuthStore();
  const isAdmin = user?.role === "admin";

  // Admins get the same "mine vs everyone's" split the task log has —
  // "My Projects" = created by me, "Team Projects" = everything else
  // visible to me (the backend already scopes visibility per role).
  const [logScope, setLogScope] = useState("myProjects");
  const [undoingId, setUndoingId] = useState(null);

  useEffect(() => {
    if (isOpen) fetchCompletedLog();
  }, [isOpen, fetchCompletedLog]);

  async function handleUndo(e, projectId) {
    e.stopPropagation();
    if (undoingId) return;
    setUndoingId(projectId);
    try {
      await undoCompletedProject(projectId);
    } finally {
      setUndoingId(null);
    }
  }

  if (!isOpen) return null;

  const visibleLog = isAdmin
    ? completedLog.filter((p) =>
        logScope === "myProjects"
          ? String(p.createdBy) === String(user?.id)
          : String(p.createdBy) !== String(user?.id),
      )
    : completedLog;

  return createPortal(
    <>
      <div
        className="fixed inset-0 bg-black/50 z-[400]"
        onClick={closeCompletedProjectsLog}
      />
      <div className="fixed top-20 inset-x-4 sm:inset-x-auto sm:left-auto sm:right-6 w-[min(24rem,calc(100vw-2rem))] max-h-[70vh] glass rounded-2xl border border-white/10 z-[500] flex flex-col overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-400" />
            Completed Projects
          </h3>
          <button
            onClick={closeCompletedProjectsLog}
            className="text-white/60 hover:text-white p-1"
          >
            <X size={18} />
          </button>
        </div>

        {isAdmin && (
          <div className="flex gap-1 px-3 pt-3 shrink-0">
            {[
              { key: "myProjects", label: "My Projects" },
              { key: "teamProjects", label: "Team Projects" },
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
              {logScope === "teamProjects"
                ? "No team completions yet."
                : "No completed projects yet."}
            </p>
          )}
          {visibleLog.map((p) => {
            const completed = new Date(p.completedAt);
            const isUndoing = undoingId === p.id;
            return (
              <div
                key={p.id}
                className="flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors"
              >
                <CheckCircle2
                  size={16}
                  className="text-emerald-400 mt-0.5 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-white/90 truncate">{p.name}</p>
                  {isAdmin && logScope === "teamProjects" && (
                    <p className="text-xs text-orange-300/80 truncate">
                      {p.createdByName || "Unknown"}
                      {p.teamName ? ` · ${p.teamName}` : ""}
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

                <button
                  onClick={(e) => handleUndo(e, p.id)}
                  disabled={isUndoing}
                  title="Undo — restore this project to its previous status"
                  className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-orange-300/90 bg-orange-500/10 border border-orange-500/20 hover:bg-orange-500/20 hover:text-orange-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Undo2
                    size={13}
                    className={isUndoing ? "animate-spin" : ""}
                  />
                  {isUndoing ? "Undoing…" : "Undo"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </>,
    document.body,
  );
}
