import { UserPlus, CheckCircle2, AlertCircle } from "lucide-react";

// Placeholder — later from notificationApi.getRecent()
const notifications = [
  {
    id: 1,
    type: "assignment",
    message: "You were assigned to 'Fix login bug'",
    time: "10m ago",
    read: false,
  },
  {
    id: 2,
    type: "status",
    message: "'Update permissions' marked as Done",
    time: "1h ago",
    read: false,
  },
  {
    id: 3,
    type: "overdue",
    message: "'Review proposal' is overdue",
    time: "3h ago",
    read: true,
  },
];

const iconMap = {
  assignment: { icon: UserPlus, color: "text-primary" },
  status: { icon: CheckCircle2, color: "text-success-text" },
  overdue: { icon: AlertCircle, color: "text-danger-text" },
};

export default function InboxPreview() {
  return (
    <div className="flex flex-col gap-3">
      {notifications.map((n) => {
        const { icon: Icon, color } = iconMap[n.type];
        return (
          <div
            key={n.id}
            className={`flex gap-3 p-2 rounded-card ${!n.read ? "bg-bg" : ""}`}
          >
            <Icon size={16} className={`${color} shrink-0 mt-0.5`} />
            <div className="min-w-0">
              <p className="text-sm text-dark leading-snug">{n.message}</p>
              <p className="text-xs text-muted mt-0.5">{n.time}</p>
            </div>
            {!n.read && (
              <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1" />
            )}
          </div>
        );
      })}
    </div>
  );
}

