import TaskCard from "./TaskCard";

export default function TaskListView({ tasks }) {
  if (!tasks || tasks.length === 0) {
    return (
      <div className="text-center py-12 text-white/60 text-sm">
        No tasks yet. Create your first one to get started.
      </div>
    );
  }

  return (
    <div className="taskello-grid">
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} />
      ))}
    </div>
  );
}
