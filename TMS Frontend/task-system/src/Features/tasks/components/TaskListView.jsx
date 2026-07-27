import TaskCard from "./TaskCard";

export default function TaskListView({ tasks }) {
  if (!tasks || tasks.length === 0) {
    return (
      <div className="text-left py-12 text-white/60 text-sm">
        No tasks yet. Create your first one to get started.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 p-6 items-start">
      {tasks.map((task) => (
        <TaskCard key={task.id || task._id} task={task} />
      ))}
    </div>
  );
}
