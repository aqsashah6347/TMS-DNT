import TaskCard from "./TaskCard";

export default function TaskListView({ tasks }) {
  if (!tasks || tasks.length === 0) {
    return (
      <div className="text-center py-12 text-muted text-sm">
        No tasks yet. Create your first one to get started.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} />
      ))}
    </div>
  );
}
