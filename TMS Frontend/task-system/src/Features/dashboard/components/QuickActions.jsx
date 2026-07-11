import { Plus, FolderPlus, ListChecks, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const actions = [
  {
    label: "Add Task",
    icon: Plus,
    color: "#fb923c",
    bg: "rgba(251, 146, 60, 0.15)",
    to: "/tasks",
  },
  {
    label: "Add Project",
    icon: FolderPlus,
    color: "#b490f5",
    bg: "rgba(180, 144, 245, 0.15)",
    to: "/projects",
  },
  {
    label: "View Tasks",
    icon: ListChecks,
    color: "#60a5fa",
    bg: "rgba(96, 165, 250, 0.15)",
    to: "/tasks",
  },
  {
    label: "Reports",
    icon: BarChart3,
    color: "#4ade80",
    bg: "rgba(74, 222, 128, 0.15)",
    to: "/analytics",
  },
];

export default function QuickActions({ columns = 4 }) {
  const navigate = useNavigate();

  return (
    <div
      className="grid gap-2.5"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {actions.map(({ label, icon: Icon, color, bg, to }) => (
        <button
          key={label}
          className="quick-action-btn"
          onClick={() => navigate(to)}
        >
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
