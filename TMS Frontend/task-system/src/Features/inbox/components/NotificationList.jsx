import NotificationItem from "./NotificationItem";
import { useNotificationStore } from "../notificationStore";

export default function NotificationList({ filter = "all" }) {
  const { notifications, markAsRead } = useNotificationStore();

  const filtered =
    filter === "unread" ? notifications.filter((n) => !n.read) : notifications;

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="mb-2 text-3xl">🎉</p>
        <p className="text-sm text-white/50">
          {filter === "unread"
            ? "No unread notifications"
            : "You're all caught up"}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {filtered.map((n, i) => (
        <NotificationItem
          key={n.id}
          notification={n}
          onMarkRead={markAsRead}
          style={{ animationDelay: `${i * 0.04}s` }}
        />
      ))}
    </div>
  );
}
