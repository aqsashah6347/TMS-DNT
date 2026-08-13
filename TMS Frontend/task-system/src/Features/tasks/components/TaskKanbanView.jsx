import { useState } from "react";
import TaskKanbanCard from "./TaskKanbanCard";
import { useTaskStore } from "../taskStore";
import { useUIStore } from "../../../store/useUIStore";

// Each column gets its own identity color — used for the bookmark-tab
// header, the drop-highlight ring, and the divider gradient between
// columns, so the four stages read as distinct at a glance.
const columns = [
  { key: "backlog", label: "Backlog", color: "#94a3b8" },
  { key: "in progress", label: "In Progress", color: "#fb923c" },
  { key: "review", label: "Review", color: "#b490f5" },
  { key: "done", label: "Done", color: "#a8f08a" },
];

function effectiveColor(task) {
  return task.projectId ? task.projectColor : task.color;
}

function hexToRgba(hex, alpha) {
  const safe = (hex || "#fb923c").replace("#", "");
  const num = parseInt(safe, 16);
  const r = (num >> 16) & 0xff;
  const g = (num >> 8) & 0xff;
  const b = num & 0xff;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
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
    if (columnKey === "done") {
      useUIStore.getState().fireCompletionBubble({
        x: e.clientX,
        y: e.clientY,
        color: effectiveColor(task) || "#fb923c",
      });
    }
    updateTask(taskId, { status: columnKey });
  }

  return (
    <div className="flex items-stretch">
      {columns.map((col, i) => {
        const colTasks = tasks.filter((t) => t.status === col.key);
        const isDragOver = dragOverCol === col.key;
        const nextCol = columns[i + 1];

        return (
          <div key={col.key} className="flex items-stretch flex-1 min-w-0">
            <div className="kanban-column flex-1 min-w-0">
              {/* Bookmark-style header tab */}
              <div
                className="kanban-bookmark"
                style={{
                  "--bm-color": col.color,
                  "--bm-glow": hexToRgba(col.color, 0.45),
                }}
              >
                <span className="kanban-bookmark__label">{col.label}</span>
                <span className="kanban-bookmark__count">
                  {colTasks.length}
                </span>
              </div>

              {/* Column body / drop zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                  if (dragOverCol !== col.key) setDragOverCol(col.key);
                }}
                onDragLeave={() =>
                  setDragOverCol((cur) => (cur === col.key ? null : cur))
                }
                onDrop={(e) => handleDrop(e, col.key)}
                className={`kanban-column__body ${
                  isDragOver ? "kanban-column__body--drag-over" : ""
                }`}
                style={{ "--kc-col": col.color }}
              >
                <div className="flex flex-col gap-1.5 min-h-[32px]">
                  {colTasks.map((task) => (
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
                      style={{ opacity: draggingId === task.id ? 0.4 : 1 }}
                      className="transition-opacity"
                    >
                      <TaskKanbanCard task={task} />
                    </div>
                  ))}
                  {colTasks.length === 0 && (
                    <p className="text-[11px] text-white/30 text-center py-3">
                      {isDragOver ? "Drop here" : "No tasks"}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Divider between columns — gradient blends this column's
                color into the next one's, so it reinforces the boundary
                instead of just being a flat gray rule. */}
            {nextCol && (
              <div
                className="kanban-divider"
                style={{
                  background: `linear-gradient(to bottom, ${hexToRgba(
                    col.color,
                    0.6,
                  )} 0%, rgba(255,255,255,0.08) 50%, ${hexToRgba(
                    nextCol.color,
                    0.6,
                  )} 100%)`,
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
