import {
  Plus,
  Filter,
  List,
  Kanban,
  Calendar,
  ClipboardCheck,
} from "lucide-react";
import { useTaskStore } from "../Features/tasks/taskStore";
import { useAuthStore } from "../store/useAuthStore";
import { useUIStore } from "../store/useUIStore";
import TaskListView from "../Features/tasks/components/TaskListView";
import TaskKanbanView from "../Features/tasks/components/TaskKanbanView";
import TaskCalendarView from "../Features/tasks/components/TaskCalendarView";
import TaskModal from "../Features/tasks/components/TaskModal";
import TaskFiltersModal from "../Features/tasks/components/TaskFiltersModal";
import CompletedLogPanel from "../Features/tasks/components/CompletedLogPanel";
import { useEffect, useState } from "react";
import CompletionBubbleOverlay from "../Features/tasks/components/CompletionBubbleOverlay";

const viewOptions = [
  { key: "list", label: "Card View", icon: List },
  { key: "kanban", label: "Kanban View", icon: Kanban },
  { key: "calendar", label: "Calendar View", icon: Calendar },
];

// Shared squarish/solid button style — matches the Employees page toggles:
// flat orange-tinted background when active, no glow/scale, backdrop-blur
// so the translucent bg reads as solid rather than see-through.
const toolbarBtn =
  "flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium backdrop-blur-md border transition-colors";
const toolbarBtnSecondary =
  "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white";
const toolbarBtnPrimary =
  "bg-orange-500/20 border-orange-500/30 text-orange-400 hover:bg-orange-500/30";

export default function Tasks() {
  const { view, setView, openCreateModal, openFiltersModal, getFilteredTasks } =
    useTaskStore();
  const tasks = getFilteredTasks();
  // Kanban needs the raw, unfiltered list so its Done column isn't empty.
  const allTasks = useTaskStore((s) => s.tasks);
  const { fetchTasks, isLoading, error, total, loadMoreTasks } = useTaskStore();
  const { user } = useAuthStore();
  const canManageTasks = user?.role === "admin" || user?.role === "manager";
  const toggleCompletedLog = useUIStore((s) => s.toggleCompletedLog);

  // Only relevant to admins/managers, since they're the only ones who can
  // assign tasks to others — regular users always just see their own
  // (the backend already scopes their /tasks response to assigned_to = them).
  const [taskScope, setTaskScope] = useState("myTasks"); // "myTasks" | "assignedTasks"
  const scopeFilter = (t) =>
    taskScope === "myTasks"
      ? String(t.assignedTo) === String(user?.id)
      : String(t.assignedBy) === String(user?.id);

  const scopedTasks = canManageTasks ? tasks.filter(scopeFilter) : tasks;
  const scopedAllTasks = canManageTasks
    ? allTasks.filter(scopeFilter)
    : allTasks;

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return (
    <div className="relative min-h-screen w-full">
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <h2
            className="text-4xl font-semibold text-white flex items-center gap-3"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Tasks
            <span className="text-base font-medium text-orange-300 bg-orange-500/10 border border-orange-400/30 rounded-full px-3 py-1">
              {scopedTasks.length}
            </span>
          </h2>

          <div className="flex items-center gap-5">
            {canManageTasks && (
              <div className="flex rounded-xl bg-white/5 backdrop-blur-md border border-white/10 p-1 gap-1">
                {[
                  { key: "myTasks", label: "My Tasks" },
                  { key: "assignedTasks", label: "Assigned Tasks" },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setTaskScope(key)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      taskScope === key
                        ? "bg-orange-500/20 text-orange-400"
                        : "text-white/50 hover:text-white/80 hover:bg-white/5"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}

            <div className="flex rounded-xl bg-white/5 backdrop-blur-md border border-white/10 p-1 gap-1">
              {viewOptions.map(({ key, label, icon: Icon }) => (
                <div key={key} className="relative group">
                  <button
                    onClick={() => setView(key)}
                    className={`p-3 rounded-lg transition-colors ${
                      view === key
                        ? "bg-orange-500/20 text-orange-400"
                        : "text-white/50 hover:text-white/80 hover:bg-white/5"
                    }`}
                  >
                    <Icon size={22} />
                  </button>

                  <div className="absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-zinc-900 border border-white/10 px-3 py-1.5 text-sm font-medium text-white opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:translate-y-0 pointer-events-none z-50">
                    {label}
                  </div>
                </div>
              ))}
            </div>

            <button
              id="completed-log-btn"
              onClick={toggleCompletedLog}
              className={`${toolbarBtn} ${toolbarBtnSecondary}`}
            >
              <ClipboardCheck size={18} />
              Completed Log
            </button>

            <button
              onClick={openFiltersModal}
              className={`${toolbarBtn} ${toolbarBtnSecondary}`}
            >
              <Filter size={18} />
              Filters
            </button>

            {canManageTasks && (
              <button
                onClick={openCreateModal}
                className={`${toolbarBtn} ${toolbarBtnPrimary}`}
              >
                <Plus size={18} />
                New Task
              </button>
            )}
          </div>
        </div>
        {isLoading && tasks.length === 0 && (
          <p className="text-sm text-white/50 py-8 text-center">
            Loading tasks…
          </p>
        )}
        {error && (
          <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mb-4">
            {error}
          </div>
        )}
        {view === "list" && <TaskListView tasks={scopedTasks} />}
        {view === "kanban" && <TaskKanbanView tasks={scopedAllTasks} />}
        {view === "calendar" && <TaskCalendarView tasks={scopedTasks} />}

        {view === "list" && allTasks.length < total && (
          <div className="flex justify-center mt-6">
            <button
              onClick={loadMoreTasks}
              disabled={isLoading}
              className={`${toolbarBtn} ${toolbarBtnSecondary} disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              {isLoading
                ? "Loading..."
                : `Load more (${allTasks.length} of ${total})`}
            </button>
          </div>
        )}

        <TaskModal />
        <TaskFiltersModal />
        <CompletedLogPanel />
        <CompletionBubbleOverlay />
      </div>
    </div>
  );
}
