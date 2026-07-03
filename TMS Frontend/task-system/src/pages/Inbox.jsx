import { CheckCheck } from "lucide-react";
import { useNotificationStore } from "../features/inbox/notificationStore";
import NotificationList from "../features/inbox/components/NotificationList";
import Button from "../components/ui/Button";

export default function Inbox() {
  const { markAllAsRead, unreadCount } = useNotificationStore();
  const count = unreadCount();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-dark">Inbox</h2>
          {count > 0 && (
            <p className="text-xs text-muted mt-1">{count} unread</p>
          )}
        </div>
        {count > 0 && (
          <Button variant="secondary" onClick={markAllAsRead}>
            <CheckCheck size={14} className="inline mr-1.5 -mt-0.5" /> Mark all
            as read
          </Button>
        )}
      </div>

      <div className="bg-surface rounded-card shadow-card p-3 max-w-2xl">
        <NotificationList />
      </div>
    </div>
  );
}
