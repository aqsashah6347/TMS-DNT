import { Plus, Filter, List, Kanban, Calendar } from "lucide-react";
import { useTaskStore } from "../features/tasks/taskStore";
import TaskListView from "../features/tasks/components/TaskListView";
import TaskKanbanView from "../features/tasks/components/TaskKanbanView";
import TaskCalendarView from "../features/tasks/components/TaskCalendarView";
import TaskModal from "../features/tasks/components/TaskModal";
import TaskFiltersModal from "../features/tasks/components/TaskFiltersModal";
import Button from "../components/ui/Button";

const viewOptions = [
  { key: "list", icon: List },
  { key: "kanban", icon: Kanban },
  { key: "calendar", icon: Calendar },
];

export default function Tasks() {
  const { view, setView, openCreateModal, openFiltersModal, getFilteredTasks } =
    useTaskStore();
  const tasks = getFilteredTasks();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-dark">Tasks</h2>

        <div className="flex items-center gap-3">
          <div className="flex bg-surface rounded-card p-1 gap-1">
            {viewOptions.map(({ key, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setView(key)}
                className={`p-2 rounded-card ${view === key ? "bg-primary text-dark" : "text-muted"}`}
              >
                <Icon size={16} />
              </button>
            ))}
          </div>

          <Button variant="secondary" onClick={openFiltersModal}>
            <Filter size={14} className="inline mr-1.5 -mt-0.5" /> Filters
          </Button>

          <Button variant="primary" onClick={openCreateModal}>
            <Plus size={14} className="inline mr-1.5 -mt-0.5" /> New Task
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
