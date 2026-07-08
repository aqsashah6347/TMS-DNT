import { Plus, Filter, List, Kanban, Calendar } from "lucide-react";
import { useTaskStore } from "../features/tasks/taskStore";
import TaskListView from "../features/tasks/components/TaskListView";
import TaskKanbanView from "../features/tasks/components/TaskKanbanView";
import TaskCalendarView from "../features/tasks/components/TaskCalendarView";
import TaskModal from "../features/tasks/components/TaskModal";
import TaskFiltersModal from "../features/tasks/components/TaskFiltersModal";
import Button from "../components/ui/Button";

const viewOptions = [
  { key: "list", label: "List View", icon: List },
  { key: "kanban", label: "Kanban View", icon: Kanban },
  { key: "calendar", label: "Calendar View", icon: Calendar },
];

export default function Tasks() {
  const { view, setView, openCreateModal, openFiltersModal, getFilteredTasks } =
    useTaskStore();
  const tasks = getFilteredTasks();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2
          className="text-4xl font-semibold text-white"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Tasks
        </h2>

        <div className="flex items-center gap-5">
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
            onClick={openFiltersModal}
            className="text-base px-5 py-3"
          >
            <Filter size={18} className="inline mr-1.5 -mt-0.5" /> Filters
          </Button>

          <Button
            variant="primary"
            onClick={openCreateModal}
            className="text-base px-5 py-3"
          >
            <Plus size={18} className="inline mr-1.5 -mt-0.5" /> New Task
          </Button>
        </div>
      </div>

      {view === "list" && <TaskListView tasks={tasks} />}
      {view === "kanban" && <TaskKanbanView tasks={tasks} />}
      {view === "calendar" && <TaskCalendarView tasks={tasks} />}

      <TaskModal />
      <TaskFiltersModal />
    </div>
  );
}
