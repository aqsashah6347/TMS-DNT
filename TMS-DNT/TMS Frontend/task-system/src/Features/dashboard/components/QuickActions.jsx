import { Plus, FolderPlus, ListChecks, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../../store/useAuthStore";
import { useTaskStore } from "../../tasks/taskStore";
import { useProjectStore } from "../../projects/projectStore";

export default function QuickActions({ columns = 4 }) {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const openCreateTaskModal = useTaskStore((s) => s.openCreateModal);
  const openCreateProjectModal = useProjectStore((s) => s.openCreateModal);

  const canManage = user?.role === "admin" || user?.role === "manager";

  const actions = [
    canManage && {
      label: "Add Task",
      icon: Plus,
      color: "#fb923c",
      bg: "rgba(251, 146, 60, 0.15)",
      onClick: () => {
        openCreateTaskModal();
        navigate("/tasks");
      },
    },
    canManage && {
      label: "Add Project",
      icon: FolderPlus,
      color: "#b490f5",
      bg: "rgba(180, 144, 245, 0.15)",
      onClick: () => {
        openCreateProjectModal();
        navigate("/projects");
      },
    },
    {
      label: "View Tasks",
      icon: ListChecks,
      color: "#60a5fa",
      bg: "rgba(96, 165, 250, 0.15)",
      onClick: () => navigate("/tasks"),
    },
    {
      label: "Reports",
      icon: BarChart3,
      color: "#4ade80",
      bg: "rgba(74, 222, 128, 0.15)",
      onClick: () => navigate("/analytics"),
    },
  ].filter(Boolean);

  return (
    <div
      className="grid gap-2.5"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {actions.map(({ label, icon: Icon, color, bg, onClick }) => (
        <button key={label} className="quick-action-btn" onClick={onClick}>
          <span
            className="quick-action-btn__icon"
            style={{ background: bg }}
          >
            <Icon size={16} color={color} />
          </span>
          {label}
        </button>
      ))}
    </div>
  );
}