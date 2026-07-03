import TaskCard from "./TaskCard";

const columns = [
  { key: "backlog", label: "Backlog" },
  { key: "in progress", label: "In Progress" },
  { key: "review", label: "Review" },
  { key: "done", label: "Done" },
];

export default function TaskKanbanView({ tasks, onTaskClick }) {
  return (
    <div className="grid grid-cols-4 gap-4">
      {columns.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.key);
        return (
          <div key={col.key} className="bg-bg rounded-card p-3">
            <div className="flex items-center justify-between mb-3 px-1">
              <h4 className="text-sm font-semibold text-dark">{col.label}</h4>
              <span className="text-xs text-muted bg-surface rounded-full px-2 py-0.5">
                {colTasks.length}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {colTasks.map((task) => (
                <TaskCard key={task.id} task={task} onClick={onTaskClick} />
              ))}
              {colTasks.length === 0 && (
                <p className="text-xs text-muted text-center py-4">No tasks</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
