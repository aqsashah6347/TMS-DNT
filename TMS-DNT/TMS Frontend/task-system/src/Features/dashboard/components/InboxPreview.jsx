import { useEffect } from "react";
import {
  UserPlus,
  CheckCircle2,
  AlertTriangle,
  FolderPlus,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useActivityStore } from "../../activities/activityStore";

// Same activity types as the Activity Log page, kept in sync so an item
// looks the same whether you see it here or on /activity.
const iconMap = {
  task_assigned: {
    icon: UserPlus,
    color: "#60a5fa",
    bg: "rgba(96,165,250,0.15)",
  },
  task_completed: {
    icon: CheckCircle2,
    color: "#4ade80",
    bg: "rgba(74,222,128,0.15)",
  },
  deadline_missed: {
    icon: AlertTriangle,
    color: "#f87171",
    bg: "rgba(248,113,113,0.15)",
  },
  project_assigned: {
    icon: FolderPlus,
    color: "#c4c4c4",
    bg: "rgba(255,255,255,0.1)",
  },
};

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function InboxPreview() {
  const { activities, fetchActivities, markAsRead } = useActivityStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  function handleClick(a) {
    if (!a.read) markAsRead(a.id);
    navigate("/activity");
  }

  if (activities.length === 0) {
    return <p className="text-sm text-white/40">You're all caught up 🎉</p>;
  }

  return (
    <div className="flex flex-col">
      {activities.slice(0, 4).map((a) => {
        const {
          icon: Icon,
          color,
          bg,
        } = iconMap[a.type] || iconMap.task_assigned;
        return (
          <button
            key={a.id}
            onClick={() => handleClick(a)}
            className="inbox-row"
          >
            <span className="inbox-row__icon" style={{ background: bg }}>
              <Icon size={13} color={color} />
            </span>
            <span className="inbox-row__msg">{a.title || a.message}</span>
            <span className="inbox-row__time">{timeAgo(a.createdAt)}</span>
          </button>
        );
      })}
    </div>
  );
}
