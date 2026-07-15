import { useEffect } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  UserPlus,
  FolderPlus,
  Inbox as InboxIcon,
} from "lucide-react";
import { useActivityStore } from "../Features/activities/activityStore";
import { connectSocket, getSocket } from "../lib/socket";

const TYPE_META = {
  task_assigned: { icon: UserPlus, color: "blue", label: "Task assigned" },
  task_completed: {
    icon: CheckCircle2,
    color: "emerald",
    label: "Task completed",
  },
  deadline_missed: {
    icon: AlertTriangle,
    color: "red",
    label: "Missed deadline",
  },
  project_assigned: {
    icon: FolderPlus,
    color: "blue",
    label: "Project assigned",
  },
};

const COLOR_CLASSES = {
  blue: "bg-blue-500/15 text-blue-400",
  emerald: "bg-emerald-500/15 text-emerald-400",
  red: "bg-red-500/15 text-red-400",
};

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function ActivityLog() {
  const {
    activities,
    loading,
    unreadCount,
    fetchActivities,
    markAsRead,
    markAllAsRead,
    initSocketListeners,
  } = useActivityStore();

  useEffect(() => {
    if (!getSocket()) connectSocket();
    initSocketListeners();
    fetchActivities();
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2
          className="text-2xl text-white"
          style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}
        >
          Activity Log
        </h2>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-xs text-white/60 hover:text-white transition-colors"
          >
            Mark all as read
          </button>
        )}
      </div>

      <div className="glass glass-card">
        <div className="glass-content p-2">
          {loading && activities.length === 0 ? (
            <div className="py-16 text-center text-white/40 text-sm">
              Loading activity...
            </div>
          ) : activities.length === 0 ? (
            <div className="py-16 flex flex-col items-center gap-2 text-white/40 text-sm">
              <InboxIcon size={28} className="text-white/20" />
              You're all caught up
            </div>
          ) : (
            activities.map((a) => {
              const meta = TYPE_META[a.type] || TYPE_META.task_assigned;
              const Icon = meta.icon;
              return (
                <button
                  key={a.id}
                  onClick={() => !a.read && markAsRead(a.id)}
                  className={`w-full flex items-start gap-3 rounded-xl px-3 py-3 text-left transition-colors ${
                    a.read
                      ? "hover:bg-white/5"
                      : "bg-white/[0.04] hover:bg-white/[0.07]"
                  }`}
                >
                  <div
                    className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center ${COLOR_CLASSES[meta.color]}`}
                  >
                    <Icon size={15} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-white font-medium">
                        {a.title || meta.label}
                      </span>
                      {!a.read && (
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                      )}
                    </div>
                    <p className="text-xs text-white/50 mt-0.5">{a.message}</p>
                    <span className="text-[10px] text-white/30 mt-1 block">
                      {timeAgo(a.createdAt)}
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
