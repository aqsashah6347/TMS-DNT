import { UserPlus, GitPullRequest, XCircle, AtSign, X } from "lucide-react";
import { useChatStore } from "../chatStore";

const iconMap = {
  assignment: {
    icon: UserPlus,
    color: "text-orange-400",
    bg: "bg-orange-400/15",
  },
  pr: {
    icon: GitPullRequest,
    color: "text-emerald-400",
    bg: "bg-emerald-400/15",
  },
  build: { icon: XCircle, color: "text-red-400", bg: "bg-red-400/15" },
  mention: { icon: AtSign, color: "text-violet-300", bg: "bg-violet-300/15" },
};

export default function NotificationCard({ notification }) {
  const { markNotificationRead, dismissNotification } = useChatStore();
  const {
    icon: Icon,
    color,
    bg,
  } = iconMap[notification.type] || iconMap.assignment;

  return (
    <div
      className={`relative rounded-xl p-3.5 border transition-colors ${
        notification.read
          ? "bg-white/[0.02] border-white/[0.06]"
          : "bg-white/[0.05] border-orange-400/25"
      }`}
    >
      <button
        onClick={() => dismissNotification(notification.id)}
        className="absolute top-2.5 right-2.5 text-white/30 hover:text-white/70 transition-colors"
      >
        <X size={14} />
      </button>

      <div className="flex gap-3 pr-5">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${bg}`}
        >
          <Icon size={15} className={color} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white leading-snug">
            {notification.title}
          </p>
          <p className="text-xs text-white/60 mt-0.5 leading-relaxed">
            {notification.description}
          </p>
          <p className="text-[11px] text-white/35 mt-1.5">
            {notification.time}
          </p>

          <div className="flex items-center gap-2 mt-2.5">
            <button className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-orange-400 text-[#18181b] hover:bg-orange-300 transition-colors">
              View Task
            </button>
            {!notification.read && (
              <button
                onClick={() => markNotificationRead(notification.id)}
                className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white/[0.08] text-white/80 hover:bg-white/[0.14] transition-colors"
              >
                Mark as read
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
