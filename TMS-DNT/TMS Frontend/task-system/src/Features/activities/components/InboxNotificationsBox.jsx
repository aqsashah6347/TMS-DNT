import {
  Bell,
  UserPlus,
  CheckCircle2,
  AlertTriangle,
  FolderPlus,
  PlusCircle,
  Pencil,
  CalendarClock,
  UserCog,
  RefreshCcw,
  Trash2,
  FolderX,
  UsersRound,
  MessageCircle,
} from "lucide-react";
import { formatRelativeTime, formatIOSTime } from "../../../lib/dateFormat";

// Covers every activity type the backend can emit today (see
// activityService.logActivity call sites in taskController.js,
// projectController.js, teamController.js, and missedDeadlineChecker.js).
// Unknown future types fall back to the generic "info" entry below
// instead of crashing.
const TYPE_META = {
  task_assigned: { icon: UserPlus, badge: "bg-blue-500/15 text-blue-400" },
  task_completed: {
    icon: CheckCircle2,
    badge: "bg-violet-500/15 text-violet-400",
  },
  task_created: {
    icon: PlusCircle,
    badge: "bg-emerald-500/15 text-emerald-400",
  },
  task_edited: { icon: Pencil, badge: "bg-blue-500/15 text-blue-400" },
  due_date_updated: {
    icon: CalendarClock,
    badge: "bg-blue-500/15 text-blue-400",
  },
  assignment_changed: {
    icon: UserCog,
    badge: "bg-blue-500/15 text-blue-400",
  },
  status_changed: {
    icon: RefreshCcw,
    badge: "bg-blue-500/15 text-blue-400",
  },
  task_deleted: { icon: Trash2, badge: "bg-red-500/15 text-red-400" },
  deadline_missed: {
    icon: AlertTriangle,
    badge: "bg-red-500/15 text-red-400",
  },
  project_assigned: {
    icon: FolderPlus,
    badge: "bg-amber-500/15 text-amber-400",
  },
  project_created: {
    icon: FolderPlus,
    badge: "bg-emerald-500/15 text-emerald-400",
  },
  project_deleted: { icon: FolderX, badge: "bg-red-500/15 text-red-400" },
  team_created: {
    icon: UsersRound,
    badge: "bg-emerald-500/15 text-emerald-400",
  },
  message: { icon: MessageCircle, badge: "bg-cyan-500/15 text-cyan-400" },
  info: { icon: Bell, badge: "bg-white/10 text-white/60" },
};

export default function InboxNotificationsBox({
  activities,
  unreadCount,
  loading,
  onMarkAsRead,
  onMarkAllAsRead,
}) {
  return (
    <div className="bronze-panel h-full flex flex-col">
      <div className="section-glass-header">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Bell size={18} className="text-amber-dim" />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-[16px] px-[4px] rounded-full bg-amber-500 text-[#1a1210] text-[10px] leading-[16px] text-center font-semibold">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </div>
          <h3 className="section-glass-header__title !text-base">Inbox</h3>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={onMarkAllAsRead}
            className="text-xs text-silver-muted hover:text-white transition-colors"
          >
            Mark all as read
          </button>
        )}
      </div>

      <div className="bronze-panel__body flex-1 min-h-0 flex flex-col">
        <div className="activity-scroll flex-1 overflow-y-auto max-h-[420px] flex flex-col gap-1 pr-1">
          {loading && activities.length === 0 ? (
            <div className="py-10 text-center text-silver-muted text-sm">
              Loading notifications...
            </div>
          ) : activities.length === 0 ? (
            <div className="py-10 flex flex-col items-center gap-2 text-silver-muted text-sm">
              <Bell size={24} className="text-white/20" />
              You're all caught up
            </div>
          ) : (
            activities.map((a) => {
              // Message notifications get their own iOS-banner-styled card
              // (per the reference screenshot) instead of the generic
              // icon-badge card every other activity type uses below.
              if (a.type === "message") {
                return (
                  <button
                    key={a.id}
                    onClick={() => !a.read && onMarkAsRead(a.id)}
                    className={`w-full text-left rounded-2xl px-3.5 py-3 bg-zinc-200 hover:bg-zinc-100 transition-colors ${
                      a.read ? "opacity-70" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                          <MessageCircle
                            size={11}
                            className="text-white"
                            fill="currentColor"
                          />
                        </div>
                        <span className="text-[11px] font-bold text-zinc-900 tracking-wide uppercase">
                          Messages
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span
                          className="text-[10px] text-zinc-500"
                          title={
                            a.createdAt
                              ? new Date(a.createdAt).toLocaleString()
                              : ""
                          }
                        >
                          {formatIOSTime(a.createdAt)}
                        </span>
                        {!a.read && (
                          <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-zinc-800 mt-1 line-clamp-2">
                      {a.message}
                    </p>
                  </button>
                );
              }

              const meta = TYPE_META[a.type] || TYPE_META.info;
              const Icon = meta.icon;
              return (
                <button
                  key={a.id}
                  onClick={() => !a.read && onMarkAsRead(a.id)}
                  className={`w-full flex items-start gap-3 rounded-xl px-3 py-3 text-left transition-colors ${
                    a.read
                      ? "hover:bg-white/5 opacity-70"
                      : "bg-white/[0.04] hover:bg-white/[0.07]"
                  }`}
                >
                  <div
                    className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center ${meta.badge}`}
                  >
                    <Icon size={15} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-white font-medium truncate">
                        {a.title || "Notification"}
                      </span>
                      {!a.read && (
                        <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-silver-muted mt-1 line-clamp-2">
                      {a.message}
                    </p>
                    <span
                      className="text-xs text-white/35 mt-1.5 block"
                      title={
                        a.createdAt
                          ? new Date(a.createdAt).toLocaleString()
                          : ""
                      }
                    >
                      {formatRelativeTime(a.createdAt)}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}