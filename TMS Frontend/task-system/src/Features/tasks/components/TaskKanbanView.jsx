import { useState } from "react";
import TaskCard from "./TaskCard";
import { useTaskStore } from "../taskStore";

const columns = [
  { key: "backlog", label: "Backlog" },
  { key: "in progress", label: "In Progress" },
  { key: "review", label: "Review" },
  { key: "done", label: "Done" },
];

function effectiveColor(task) {
  return task.projectId ? task.projectColor : task.color;
}

export default function TaskKanbanView({ tasks, onTaskClick }) {
  const updateTask = useTaskStore((s) => s.updateTask);
  const [draggingId, setDraggingId] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);

  function handleDrop(e, columnKey) {
    e.preventDefault();
    setDragOverCol(null);
    const taskId = Number(e.dataTransfer.getData("text/task-id"));
    setDraggingId(null);
    if (!taskId) return;
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === columnKey) return;
    updateTask(taskId, { status: columnKey });
  }

  return (
    <div className="grid grid-cols-4 gap-4">
      {columns.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.key);
        const isDragOver = dragOverCol === col.key;
        return (
          <div
            key={col.key}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
              if (dragOverCol !== col.key) setDragOverCol(col.key);
            }}
            onDragLeave={() =>
              setDragOverCol((cur) => (cur === col.key ? null : cur))
            }
            onDrop={(e) => handleDrop(e, col.key)}
            className={`bg-bg rounded-card p-3 transition-colors ${
              isDragOver ? "ring-2 ring-primary/50 bg-primary/5" : ""
            }`}
          >
            <div className="flex items-center justify-between mb-3 px-1">
              <h4 className="text-sm font-semibold text-dark">{col.label}</h4>
              <span className="text-xs text-muted bg-surface rounded-full px-2 py-0.5">
                {colTasks.length}
              </span>
            </div>
            <div className="flex flex-col gap-2 min-h-[40px]">
              {colTasks.map((task) => {
                const color = effectiveColor(task);
                return (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/task-id", String(task.id));
                      e.dataTransfer.effectAllowed = "move";
                      setDraggingId(task.id);
                    }}
                    onDragEnd={() => {
                      setDraggingId(null);
                      setDragOverCol(null);
                    }}
                    onClick={() => onTaskClick?.(task)}
                    style={{
                      borderLeft: color ? `3px solid ${color}` : undefined,
                      opacity: draggingId === task.id ? 0.4 : 1,
                    }}
                    className="rounded-md cursor-grab active:cursor-grabbing transition-opacity"
                  >
                    <TaskCard task={task} />
                  </div>
                );
              })}
              {colTasks.length === 0 && (
                <p className="text-xs text-muted text-center py-4">
                  {isDragOver ? "Drop here" : "No tasks"}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}