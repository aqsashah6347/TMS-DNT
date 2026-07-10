import { X, CheckCheck } from "lucide-react";
import { useChatStore } from "../chatStore";
import NotificationCard from "./NotificationCard";

export default function NotificationDrawer() {
  const {
    isNotificationOpen,
    closeNotifications,
    notifications,
    markAllNotificationsRead,
  } = useChatStore();

  return (
    <>
      <div
        onClick={closeNotifications}
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity ${
          isNotificationOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      />

      <div
        className={`fixed top-0 right-0 h-full w-full max-w-sm bg-[#161616] border-l border-white/[0.08] z-50 flex flex-col transition-transform duration-300 ease-out ${
          isNotificationOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <h3 className="text-base font-bold text-white">Notifications</h3>
          <div className="flex items-center gap-1">
            <button
              onClick={markAllNotificationsRead}
              className="p-2 rounded-full text-white/50 hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              <CheckCheck size={16} />
            </button>
            <button
              onClick={closeNotifications}
              className="p-2 rounded-full text-white/50 hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2.5">
          {notifications.length === 0 ? (
            <p className="text-center text-sm text-white/40 mt-10">
              You're all caught up!
            </p>
          ) : (
            notifications.map((n) => (
              <NotificationCard key={n.id} notification={n} />
            ))
          )}
        </div>
      </div>
    </>
  );
}
