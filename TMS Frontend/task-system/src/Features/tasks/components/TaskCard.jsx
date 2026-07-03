import { Flag, Calendar, User, Pin, Video, GitBranch } from "lucide-react";
import Card from "../../../components/ui/Card";
import { useTaskStore } from "../taskStore";
import { useProjectStore } from "../../projects/projectStore";
import { getProjectColor } from "../../../utils/projectColors";

const priorityStyles = {
  critical: "bg-danger text-danger-text",
  high: "bg-warning text-warning-text",
  medium: "bg-info text-info-text",
  low: "bg-primary-light text-dark",
};

const statusStyles = {
  backlog: "bg-bg text-muted",
  "in progress": "bg-info text-info-text",
  review: "bg-warning text-warning-text",
  done: "bg-success text-success-text",
};

export default function TaskCard({ task }) {
  const openTaskView = useTaskStore((s) => s.openTaskView);
  const projects = useProjectStore((s) => s.projects);
  const projectColor = getProjectColor(task.projectId, projects);

  return (
    <Card
      hover
      onClick={() => openTaskView(task)}
      className="p-4 cursor-pointer relative border-l-4"
      style={{ borderLeftColor: projectColor }}
    >
      {task.pinned && (
        <Pin
          size={12}
          className="absolute top-3 right-3 text-primary fill-primary"
        />
      )}

      <div className="flex items-start justify-between gap-2 mb-2 pr-4">
        <h4 className="text-sm font-medium text-dark leading-snug">
          {task.title}
        </h4>
        <span
          className={`text-[10px] font-medium px-2 py-0.5 rounded-full capitalize shrink-0 ${priorityStyles[task.priority]}`}
        >
          <Flag size={10} className="inline mr-1 -mt-0.5" />
          {task.priority}
        </span>
      </div>

      {task.description && (
        <p className="text-xs text-muted mb-3 line-clamp-2">
          {task.description}
        </p>
      )}

      <div className="flex items-center justify-between">
        <span
          className={`text-[10px] font-medium px-2 py-0.5 rounded-full capitalize ${statusStyles[task.status]}`}
        >
          {task.status}
        </span>
        <div className="flex items-center gap-2 text-muted">
          {task.zoomLink && <Video size={12} />}
          {task.GitBranchLink && <GitBranch size={12} />}
          {task.dueDate && (
            <span className="flex items-center gap-1 text-[11px]">
              <Calendar size={11} /> {task.dueDate}
            </span>
          )}
          {task.assignedTo && (
            <span className="flex items-center gap-1 text-[11px]">
              <User size={11} /> {task.assignedTo}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
