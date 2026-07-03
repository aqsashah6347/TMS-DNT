import { UserPlus, CheckCircle2, AlertCircle } from "lucide-react";

const iconMap = {
  assignment: { icon: UserPlus, color: "text-primary" },
  status: { icon: CheckCircle2, color: "text-success-text" },
  overdue: { icon: AlertCircle, color: "text-danger-text" },
};

export default function NotificationItem({ notification, onMarkRead }) {
  const { icon: Icon, color } = iconMap[notification.type] || iconMap.status;

  return (
    <div
      onClick={() => !notification.read && onMarkRead(notification.id)}
      className={`flex gap-3 p-3 rounded-card cursor-pointer transition-colors ${
        !notification.read ? "bg-bg hover:bg-primary-light" : "hover:bg-bg"
      }`}
    >
      <Icon size={18} className={`${color} shrink-0 mt-0.5`} />
      <div className="min-w-0 flex-1">
        <p className="text-sm text-dark leading-snug">{notification.message}</p>
        <p className="text-xs text-muted mt-1">{notification.time}</p>
      </div>
      {!notification.read && (
        <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
      )}
    </div>
  );
}
