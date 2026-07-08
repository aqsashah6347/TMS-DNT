import { Flag, Calendar, User, Pin, Video, GitBranch } from "lucide-react";
import Card from "../../../components/ui/Card";
import { useTaskStore } from "../taskStore";
import { useProjectStore } from "../../projects/projectStore";
import { getProjectColor } from "../../../utils/projectColors";

const priorityBadge = {
  critical: "glass-badge--danger",
  high: "glass-badge--amber",
  medium: "glass-badge--violet",
  low: "glass-badge--primary",
};

const statusLabel = {
  backlog: "text-white/60",
  "in progress": "text-violet-300",
  review: "text-amber-300",
  done: "text-emerald-300",
};

export default function TaskCard({ task }) {
  const openTaskView = useTaskStore((s) => s.openTaskView);
  const projects = useProjectStore((s) => s.projects);
  const projectColor = getProjectColor(task.projectId, projects);

  return (
    <Card
      hover
      onClick={() => openTaskView(task)}
      className="task-card cursor-pointer relative border-l-4"
      style={{ borderLeftColor: projectColor }}
    >
      {task.pinned && (
        <Pin
          size={12}
          className="absolute top-3 right-3 text-emerald-300 fill-emerald-300"
        />
      )}

      <div className="flex items-start justify-between gap-3 mb-2 pr-4">
        <h4 className="text-lg sm:text-xl font-bold text-white leading-snug">
          {task.title}
        </h4>
        <span
          className={`glass-badge ${priorityBadge[task.priority]} shrink-0`}
        >
          <Flag size={10} className="inline mr-1 -mt-0.5" />
          {task.priority}
        </span>
      </div>

      {task.description && (
        <p className="text-sm text-white/75 mb-3 line-clamp-2">
          {task.description}
        </p>
      )}

      <div className="flex items-center justify-between flex-wrap gap-2">
        <span className={`status-badge capitalize ${statusLabel[task.status]}`}>
          {task.status}
        </span>
        <div className="flex items-center gap-3 text-white/70">
          {task.zoomLink && <Video size={13} />}
          {task.githubLink && <GitBranch size={13} />}
          {task.dueDate && (
            <span className="flex items-center gap-1 text-xs">
              <Calendar size={12} /> {task.dueDate}
            </span>
          )}
          {task.assignedTo && (
            <span className="flex items-center gap-1 text-xs">
              <User size={12} /> {task.assignedTo}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
