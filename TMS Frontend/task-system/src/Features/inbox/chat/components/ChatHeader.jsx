import { Search, BellOff, MoreVertical, Bell } from "lucide-react";
import { useChatStore } from "../chatStore";

export default function ChatHeader({ thread }) {
  const { toggleNotifications, unreadNotificationCount } = useChatStore();
  const count = unreadNotificationCount();

  if (!thread) return null;

  return (
    <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-white/[0.06] bg-[#161616]">
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-[#18181b] shrink-0"
          style={{ backgroundColor: thread.avatarColor }}
        >
          {thread.avatarText}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white truncate">
            {thread.name}
          </p>
          <p className="text-[11px] text-white/45">
            {thread.online ? (
              <span className="text-emerald-400">Active now</span>
            ) : (
              "Offline"
            )}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        <button className="p-2 rounded-full text-white/60 hover:text-white hover:bg-white/[0.06] transition-colors">
          <Search size={17} />
        </button>
        <button className="p-2 rounded-full text-white/60 hover:text-white hover:bg-white/[0.06] transition-colors hidden sm:inline-flex">
          <BellOff size={17} />
        </button>

        <button
          onClick={toggleNotifications}
          className="relative p-2 rounded-full text-white/60 hover:text-white hover:bg-white/[0.06] transition-colors"
          aria-label="Notifications"
        >
          <Bell size={17} />
          {count > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-orange-400 ring-2 ring-[#161616]" />
          )}
        </button>

        <button className="p-2 rounded-full text-white/60 hover:text-white hover:bg-white/[0.06] transition-colors">
          <MoreVertical size={17} />
        </button>
      </div>
    </div>
  );
}
