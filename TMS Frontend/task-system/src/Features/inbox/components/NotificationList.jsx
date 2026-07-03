import NotificationItem from "./NotificationItem";
import { useNotificationStore } from "../notificationStore";

export default function NotificationList() {
  const { notifications, markAsRead } = useNotificationStore();

  if (notifications.length === 0) {
    return (
      <p className="text-sm text-muted text-center py-12">
        You're all caught up 🎉
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {notifications.map((n) => (
        <NotificationItem key={n.id} notification={n} onMarkRead={markAsRead} />
      ))}
    </div>
  );
}
