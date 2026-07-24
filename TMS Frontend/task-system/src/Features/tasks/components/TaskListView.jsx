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
    <div className="flex flex-wrap gap-8 justify-start items-start p-6">
      {tasks.map((task) => (
        <TaskCard key={task.id || task._id} task={task} />
      ))}
    </div>
  );
}