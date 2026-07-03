import { UserPlus, CheckCircle2, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useNotificationStore } from "../../inbox/notificationStore";

const iconMap = {
  assignment: { icon: UserPlus, color: "text-primary" },
  status: { icon: CheckCircle2, color: "text-success-text" },
  overdue: { icon: AlertCircle, color: "text-danger-text" },
};

export default function InboxPreview() {
  const { notifications, markAsRead } = useNotificationStore();
  const navigate = useNavigate();

  function handleClick(n) {
    markAsRead(n.id);
    navigate("/inbox");
  }

  if (notifications.length === 0) {
    return <p className="text-sm text-muted">You're all caught up 🎉</p>;
  }

  return (
    <div className="flex flex-col gap-1">
      {notifications.slice(0, 4).map((n) => {
        const { icon: Icon, color } = iconMap[n.type] || iconMap.status;
        return (
          <button
            key={n.id}
            onClick={() => handleClick(n)}
            className={`w-full text-left flex gap-3 p-2 rounded-card hover:bg-primary-light/40 transition-colors ${!n.read ? "bg-bg" : ""}`}
          >
            <Icon size={16} className={`${color} shrink-0 mt-0.5`} />
            <div className="min-w-0">
              <p className="text-sm text-dark leading-snug">{n.message}</p>
              <p className="text-xs text-muted mt-0.5">{n.time}</p>
            </div>
            {!n.read && (
              <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1" />
            )}
          </button>
        );
      })}
    </div>
  );
}
