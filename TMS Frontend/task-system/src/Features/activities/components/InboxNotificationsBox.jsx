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
} from "lucide-react";
import { formatRelativeTime } from "../../../lib/dateFormat";

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
    <div
      className="activity-noise-card h-full"
      style={{
        background:
          "linear-gradient(155deg, #303034 0%, #232326 45%, #2b2b2f 75%, #1e1e21 100%)",
      }}
    >
      <div className="glass-content p-4 flex flex-col h-full">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Bell size={16} className="text-orange-400" />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-[14px] px-[3px] rounded-full bg-orange-500 text-white text-[9px] leading-[14px] text-center font-semibold">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </div>
            <h3
              className="text-sm text-white"
              style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}
            >
              Inbox
            </h3>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllAsRead}
              className="text-[11px] text-white/50 hover:text-white transition-colors"
            >
              Mark all as read
            </button>
          )}
        </div>

        <div className="activity-scroll flex-1 overflow-y-auto max-h-[420px] flex flex-col gap-1 pr-1">
          {loading && activities.length === 0 ? (
            <div className="py-10 text-center text-white/40 text-xs">
              Loading notifications...
            </div>
          ) : activities.length === 0 ? (
            <div className="py-10 flex flex-col items-center gap-2 text-white/40 text-xs">
              <Bell size={22} className="text-white/20" />
              You're all caught up
            </div>
          ) : (
            activities.map((a) => {
              const meta = TYPE_META[a.type] || TYPE_META.info;
              const Icon = meta.icon;
              return (
                <button
                  key={a.id}
                  onClick={() => !a.read && onMarkAsRead(a.id)}
                  className={`w-full flex items-start gap-2.5 rounded-xl px-2.5 py-2.5 text-left transition-colors ${
                    a.read
                      ? "hover:bg-white/5 opacity-70"
                      : "bg-white/[0.04] hover:bg-white/[0.07]"
                  }`}
                >
                  <div
                    className={`w-7 h-7 shrink-0 rounded-full flex items-center justify-center ${meta.badge}`}
                  >
                    <Icon size={13} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-white font-medium truncate">
                        {a.title || "Notification"}
                      </span>
                      {!a.read && (
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-white/50 mt-0.5 line-clamp-2">
                      {a.message}
                    </p>
                    <span
                      className="text-[10px] text-white/30 mt-1 block"
                      title={a.createdAt ? new Date(a.createdAt).toLocaleString() : ""}
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