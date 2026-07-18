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
  History,
} from "lucide-react";
import { useAuthStore } from "../../../store/useAuthStore";

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

const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

// Clusters activities into windows: starting from the newest activity,
// every subsequent activity within 6 hours of that window's anchor
// (the newest item in the window) joins the same group. Once something
// falls outside the 6-hour span, it starts a new group with a new
// anchor. Groups of 1 render as a plain row; groups of 2+ render as a
// single "N changes" row with a dropdown.
//
// Grouped PER ACTOR first — an admin viewing everyone's feed must never
// merge two different people's actions into the same "N changes" card.
function groupByTimeWindow(activities, windowMs = SIX_HOURS_MS) {
  const byUser = new Map();
  for (const activity of activities) {
    const key = activity.userId ?? activity.userName ?? "unknown";
    if (!byUser.has(key)) byUser.set(key, []);
    byUser.get(key).push(activity);
  }

  const groups = [];
  for (const userActivities of byUser.values()) {
    const sorted = [...userActivities].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    );

    let currentGroup = null;
    let anchorTs = null;

    for (const activity of sorted) {
      const ts = new Date(activity.createdAt).getTime();
      if (currentGroup && anchorTs - ts <= windowMs) {
        currentGroup.push(activity);
      } else {
        currentGroup = [activity];
        groups.push(currentGroup);
        anchorTs = ts;
      }
    }
  }

  // Flatten every actor's groups back into one feed, newest group first.
  return groups.sort(
    (a, b) => new Date(b[0].createdAt) - new Date(a[0].createdAt),
  );
}

// Activity messages are built server-side as: You <verb> "<task title>" in <project>.
// Pull the quoted task name back out for its own line in the card.
function extractTaskName(message) {
  const match = message?.match(/"([^"]+)"/);
  return match ? match[1] : null;
}

// Full exact date + time for every action, e.g. "Jul 19, 2026, 3:45 PM".
function formatExactDateTime(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
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
        className="flex items-start gap-3 px-3 py-3"
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
          className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center ${meta.badge}`}
        >
          <Icon size={17} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-base text-white/90 font-medium">
              {userName}
            </span>
            <span
              className={`text-sm px-2 py-0.5 rounded-full leading-none ${meta.badge}`}
            >
              {meta.label}
            </span>
          </div>
          <p className="text-base text-white/60 mt-1 truncate">
            {taskName || activity.message}
          </p>
          <span className="text-sm text-white/35 mt-1.5 block">
            {formatExactDateTime(activity.createdAt)}
          </span>
        </div>
        {hasChanges && (
          <ChevronDown
            size={18}
            className={`shrink-0 mt-1.5 text-white/40 transition-transform duration-300 ${
              expanded ? "rotate-180" : ""
            }`}
          />
        )}
        <span className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${meta.dot}`} />
      </div>

      {hasChanges && (
        <div
          className={`grid transition-[grid-template-rows] duration-300 ease-out ${
            expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          }`}
        >
          <div className="overflow-hidden">
            <div className="ml-[46px] mr-2 mb-3 pl-3 border-l border-white/10 flex flex-col gap-2">
              {changes.map((c, i) => (
                <div
                  key={i}
                  className="text-sm text-white/60 flex items-baseline gap-2 flex-wrap"
                >
                  <span className="text-white/80 font-medium shrink-0">
                    {c.field}:
                  </span>
                  <span className="min-w-0">
                    {c.oldValue} <span className="text-white/30">→</span>{" "}
                    {c.newValue}
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

// One line inside an expanded group — a compact version of ActivityRow.
// Still supports its own nested expand for field-level `changes` (e.g.
// a task_edited entry inside a group of 4 actions), so no detail is
// lost by grouping.
function SubActivityRow({ activity, meta }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = meta.icon;
  const taskName = extractTaskName(activity.message);
  const changes = Array.isArray(activity.changes) ? activity.changes : [];
  const hasChanges = changes.length > 0;

  const toggle = () => setExpanded((v) => !v);

  return (
    <div className="rounded-lg hover:bg-white/[0.03] transition-colors">
      <div
        className="flex items-start gap-2.5 py-2"
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
          <Icon size={14} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-xs px-1.5 py-0.5 rounded-full leading-none ${meta.badge}`}
            >
              {meta.label}
            </span>
            <span className="text-xs text-white/35">
              {formatExactDateTime(activity.createdAt)}
            </span>
          </div>
          <p className="text-sm text-white/55 mt-0.5 truncate">
            {taskName || activity.message}
          </p>
        </div>
        {hasChanges && (
          <ChevronDown
            size={15}
            className={`shrink-0 mt-1 text-white/30 transition-transform duration-300 ${
              expanded ? "rotate-180" : ""
            }`}
          />
        )}
      </div>

      {hasChanges && (
        <div
          className={`grid transition-[grid-template-rows] duration-300 ease-out ${
            expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          }`}
        >
          <div className="overflow-hidden">
            <div className="ml-[34px] mb-2 pl-3 border-l border-white/10 flex flex-col gap-1.5">
              {changes.map((c, i) => (
                <div
                  key={i}
                  className="text-xs text-white/55 flex items-baseline gap-2 flex-wrap"
                >
                  <span className="text-white/75 font-medium shrink-0">
                    {c.field}:
                  </span>
                  <span className="min-w-0">
                    {c.oldValue} <span className="text-white/30">→</span>{" "}
                    {c.newValue}
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

// The card shown for a 6-hour window that contains 2+ actions from the
// SAME actor — one row that says "<user> · N changes" instead of N
// separate cards. Click to expand and see every individual action.
function GroupedActivityRow({ items, userName }) {
  const [expanded, setExpanded] = useState(false);
  const toggle = () => setExpanded((v) => !v);
  const latest = items[0];
  const count = items.length;

  return (
    <div className="rounded-xl hover:bg-white/[0.04] transition-colors">
      <div
        className="flex items-start gap-3 px-3 py-3 cursor-pointer"
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        onClick={toggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggle();
          }
        }}
      >
        <div className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center bg-amber-500/15 text-amber-dim border border-amber-500/20">
          <History size={17} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-base text-white/90 font-medium">
              {userName}
            </span>
            <span className="text-sm px-2 py-0.5 rounded-full leading-none bg-amber-500/15 text-amber-dim border border-amber-500/20">
              {count} changes
            </span>
          </div>
          <p className="text-base text-white/60 mt-1 truncate">
            Latest: {extractTaskName(latest.message) || latest.message}
          </p>
          <span className="text-sm text-white/35 mt-1.5 block">
            {formatExactDateTime(latest.createdAt)}
          </span>
        </div>
        <ChevronDown
          size={18}
          className={`shrink-0 mt-1.5 text-white/40 transition-transform duration-300 ${
            expanded ? "rotate-180" : ""
          }`}
        />
      </div>

      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${
          expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="ml-[46px] mr-2 mb-2 pl-3 border-l border-white/10 flex flex-col divide-y divide-white/5">
            {items.map((a) => (
              <SubActivityRow key={a.id} activity={a} meta={ACTION_TYPES[a.type]} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ActionActivityBox({ activities, loading }) {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "admin";

  const actionItems = activities.filter((a) => ACTION_TYPES[a.type]);
  const groups = groupByTimeWindow(actionItems);

  // Your own actions read as "You", same as before. Anyone else's (only
  // possible for an admin, since only admins get non-own rows here at
  // all) shows their real name.
  const nameFor = (activity) =>
    activity.userId === user?.id ? "You" : activity.userName || "Someone";

  return (
    <div className="bronze-panel h-full flex flex-col">
      <div className="section-glass-header">
        <div className="flex items-center gap-2.5">
          <ListChecks size={18} className="text-amber-dim" />
          <h3 className="section-glass-header__title !text-base">
            {isAdmin ? "Action Activity — All Users" : "Action Activity"}
          </h3>
        </div>
      </div>

      <div className="bronze-panel__body flex-1 min-h-0 flex flex-col">
        <div className="activity-scroll flex-1 overflow-y-auto max-h-[880px] flex flex-col gap-1.5 pr-1">
          {loading && actionItems.length === 0 ? (
            <div className="py-10 text-center text-silver-muted text-base">
              Loading activity...
            </div>
          ) : actionItems.length === 0 ? (
            <div className="py-10 text-center text-silver-muted text-base">
              No task actions yet
            </div>
          ) : (
            groups.map((g) =>
              g.length === 1 ? (
                <ActivityRow
                  key={g[0].id}
                  activity={g[0]}
                  meta={ACTION_TYPES[g[0].type]}
                  userName={nameFor(g[0])}
                />
              ) : (
                <GroupedActivityRow
                  key={g[0].id}
                  items={g}
                  userName={nameFor(g[0])}
                />
              ),
            )
          )}
        </div>
      </div>
    </div>
  );
}