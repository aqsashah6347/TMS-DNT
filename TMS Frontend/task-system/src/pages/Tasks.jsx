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
import Button from "../components/ui/Button";
import { useEffect, useRef, useState } from "react";
import TeamFluidCursor from "../Features/teams/components/TeamFluidCursor";

const viewOptions = [
  { key: "list", label: "Card View", icon: List },
  { key: "kanban", label: "Kanban View", icon: Kanban },
  { key: "calendar", label: "Calendar View", icon: Calendar },
];

export default function Tasks() {
  const { view, setView, openCreateModal, openFiltersModal, getFilteredTasks } =
    useTaskStore();
  const tasks = getFilteredTasks();
  // Kanban needs the raw, unfiltered list so its Done column isn't empty.
  const allTasks = useTaskStore((s) => s.tasks);
  const { fetchTasks, isLoading, error } = useTaskStore();
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
  const containerRef = useRef(null);
  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden min-h-screen w-full"
    >
      <TeamFluidCursor containerRef={containerRef} />
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
              <div className="flex bg-surface rounded-card p-1.5 gap-1">
                {[
                  { key: "myTasks", label: "My Tasks" },
                  { key: "assignedTasks", label: "Assigned Tasks" },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setTaskScope(key)}
                    className={`px-4 py-2.5 rounded-card text-sm font-medium cursor-pointer transition-all duration-300 ease-out ${
                      taskScope === key
                        ? "bg-primary text-dark shadow-[0_0_18px_rgba(251,146,60,0.4)]"
                        : "text-muted hover:text-orange-300 hover:bg-orange-500/10"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}

            <div className="flex bg-surface rounded-card p-2 gap-2">
              {viewOptions.map(({ key, label, icon: Icon }) => (
                <div key={key} className="relative group">
                  <button
                    onClick={() => setView(key)}
                    className={`p-3 rounded-card cursor-pointer transition-all duration-300 ease-out ${
                      view === key
                        ? "bg-primary text-dark shadow-[0_0_22px_rgba(251,146,60,0.45)] scale-105"
                        : "text-muted hover:text-orange-300 hover:bg-orange-500/10 hover:shadow-[0_0_18px_rgba(251,146,60,0.35)] hover:scale-105 active:scale-95"
                    }`}
                  >
                    <Icon size={22} />
                  </button>

                  <div className="absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-zinc-900 border border-orange-400/30 px-3 py-1.5 text-sm font-medium text-white opacity-0 shadow-xl transition-all duration-200 group-hover:opacity-100 group-hover:translate-y-0 pointer-events-none z-50">
                    {label}
                  </div>
                </div>
              ))}
            </div>

            <Button
              variant="secondary"
              onClick={toggleCompletedLog}
              className="text-base px-5 py-3"
            >
              <ClipboardCheck size={18} className="inline mr-1.5 -mt-0.5" />{" "}
              Completed Log
            </Button>

            <Button
              variant="secondary"
              onClick={openFiltersModal}
              className="text-base px-5 py-3"
            >
              <Filter size={18} className="inline mr-1.5 -mt-0.5" /> Filters
            </Button>

            {canManageTasks && (
              <Button
                variant="primary"
                onClick={openCreateModal}
                className="text-base px-5 py-3"
              >
                <Plus size={18} className="inline mr-1.5 -mt-0.5" /> New Task
              </Button>
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

        <TaskModal />
        <TaskFiltersModal />
        <CompletedLogPanel />
      </div>
    </div>
  );
}
