import { useState } from "react";
import {
  PlusCircle,
  Pencil,
  CheckCircle2,
  ListChecks,
  CalendarClock,
  UserCog,
  RefreshCcw,
  Trash2,
  FolderPlus,
  FolderX,
  UsersRound,
  ChevronDown,
} from "lucide-react";
import { useAuthStore } from "../../../store/useAuthStore";
import { formatRelativeTime } from "../../../lib/dateFormat";

// Box 1 covers every self-logged "action the user took" event: Create
// (green), Edit — including the granular due-date/assignment/status
// sub-types (blue), and Delete (red). Anything that happens *to* a user
// instead (task_assigned, project_assigned, deadline_missed) stays out
// of this box and lives in the Inbox/Notifications box instead.
const ACTION_TYPES = {
  task_created: {
    icon: PlusCircle,
    label: "Created",
    dot: "bg-emerald-400",
    badge: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20",
  },
  project_created: {
    icon: FolderPlus,
    label: "Project created",
    dot: "bg-emerald-400",
    badge: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20",
  },
  team_created: {
    icon: UsersRound,
    label: "Team created",
    dot: "bg-emerald-400",
    badge: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20",
  },
  task_edited: {
    icon: Pencil,
    label: "Edited",
    dot: "bg-blue-400",
    badge: "bg-blue-500/15 text-blue-400 border border-blue-500/20",
  },
  due_date_updated: {
    icon: CalendarClock,
    label: "Due date updated",
    dot: "bg-blue-400",
    badge: "bg-blue-500/15 text-blue-400 border border-blue-500/20",
  },
  assignment_changed: {
    icon: UserCog,
    label: "Assignment changed",
    dot: "bg-blue-400",
    badge: "bg-blue-500/15 text-blue-400 border border-blue-500/20",
  },
  status_changed: {
    icon: RefreshCcw,
    label: "Status changed",
    dot: "bg-blue-400",
    badge: "bg-blue-500/15 text-blue-400 border border-blue-500/20",
  },
  task_completed: {
    icon: CheckCircle2,
    label: "Completed",
    dot: "bg-violet-400",
    badge: "bg-violet-500/15 text-violet-400 border border-violet-500/20",
  },
  task_deleted: {
    icon: Trash2,
    label: "Deleted",
    dot: "bg-red-400",
    badge: "bg-red-500/15 text-red-400 border border-red-500/20",
  },
  project_deleted: {
    icon: FolderX,
    label: "Project deleted",
    dot: "bg-red-400",
    badge: "bg-red-500/15 text-red-400 border border-red-500/20",
  },
};

// Activity messages are built server-side as: You <verb> "<task title>" in <project>.
// Pull the quoted task name back out for its own line in the card.
function extractTaskName(message) {
  const match = message?.match(/"([^"]+)"/);
  return match ? match[1] : null;
}

// A single Action Activity card. When the activity carries a `changes`
// list (currently only task_edited — one field-level change per entry:
// due date, assignment, priority, status, ...) the field-level detail is
// tucked behind a chevron instead of being shown as separate cards, so
// one edit that touches several fields still reads as one line: "Edited
// by <user>", with the specifics one click away.
function ActivityRow({ activity, meta, userName }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = meta.icon;
  const taskName = extractTaskName(activity.message);
  const changes = Array.isArray(activity.changes) ? activity.changes : [];
  const hasChanges = changes.length > 0;

  const toggle = () => setExpanded((v) => !v);

  return (
    <div className="rounded-xl hover:bg-white/[0.04] transition-colors">
      <div
        className="flex items-start gap-2.5 px-2.5 py-2.5"
        role={hasChanges ? "button" : undefined}
        tabIndex={hasChanges ? 0 : undefined}
        aria-expanded={hasChanges ? expanded : undefined}
        onClick={hasChanges ? toggle : undefined}
        onKeyDown={
          hasChanges
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  toggle();
                }
              }
            : undefined
        }
        style={hasChanges ? { cursor: "pointer" } : undefined}
      >
        <div
          className={`w-7 h-7 shrink-0 rounded-full flex items-center justify-center ${meta.badge}`}
        >
          <Icon size={13} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-white/90 font-medium">
              {userName}
            </span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full leading-none ${meta.badge}`}
            >
              {meta.label}
            </span>
          </div>
          <p className="text-xs text-white/60 mt-0.5 truncate">
            {taskName || activity.message}
          </p>
          <span
            className="text-[10px] text-white/30 mt-1 block"
            title={
              activity.createdAt
                ? new Date(activity.createdAt).toLocaleString()
                : ""
            }
          >
            {formatRelativeTime(activity.createdAt)}
          </span>
        </div>
        {hasChanges && (
          <ChevronDown
            size={14}
            className={`shrink-0 mt-1.5 text-white/40 transition-transform duration-300 ${
              expanded ? "rotate-180" : ""
            }`}
          />
        )}
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1.5 ${meta.dot}`}
        />
      </div>

      {hasChanges && (
        <div
          className={`grid transition-[grid-template-rows] duration-300 ease-out ${
            expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          }`}
        >
          <div className="overflow-hidden">
            <div className="ml-[38px] mr-2 mb-2.5 pl-3 border-l border-white/10 flex flex-col gap-1.5">
              {changes.map((c, i) => (
                <div
                  key={i}
                  className="text-[11px] text-white/60 flex items-baseline gap-1.5 flex-wrap"
                >
                  <span className="text-white/80 font-medium shrink-0">
                    {c.field}:
                  </span>
                  <span className="min-w-0">
                    {c.oldValue}{" "}
                    <span className="text-white/30">→</span> {c.newValue}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ActionActivityBox({ activities, loading }) {
  const user = useAuthStore((s) => s.user);

  const actionItems = activities.filter((a) => ACTION_TYPES[a.type]);

  return (
    <div className="glass glass-card h-full">
      <div className="glass-content p-4 flex flex-col h-full">
        <div className="flex items-center gap-2 mb-3">
          <ListChecks size={16} className="text-orange-400" />
          <h3
            className="text-sm text-white"
            style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}
          >
            Action Activity
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto max-h-[880px] flex flex-col gap-1.5 pr-1">
          {loading && actionItems.length === 0 ? (
            <div className="py-10 text-center text-white/40 text-xs">
              Loading activity...
            </div>
          ) : actionItems.length === 0 ? (
            <div className="py-10 text-center text-white/40 text-xs">
              No task actions yet
            </div>
          ) : (
            actionItems.map((a) => (
              <ActivityRow
                key={a.id}
                activity={a}
                meta={ACTION_TYPES[a.type]}
                userName={user?.name || "You"}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}