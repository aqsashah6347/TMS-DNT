export function formatMessageTime(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();

  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  const time = date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  if (isToday) return time;
  if (isYesterday) return `Yesterday, ${time}`;

  const sameYear = date.getFullYear() === now.getFullYear();
  const dateLabel = date.toLocaleDateString(
    [],
    sameYear
      ? { month: "short", day: "numeric" }
      : { month: "short", day: "numeric", year: "numeric" },
  );
  return `${dateLabel}, ${time}`;
}

// "Just now" / "5 minutes ago" / "Yesterday" style relative time, for the
// Activity page (Action Activity, Task Activity, Inbox/Notifications).
// Separate from formatMessageTime above (which is used by chat) so chat's
// formatting is untouched.
export function formatRelativeTime(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 45) return "Just now";

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60)
    return `${diffMin} minute${diffMin === 1 ? "" : "s"} ago`;

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hour${diffHr === 1 ? "" : "s"} ago`;

  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay} day${diffDay === 1 ? "" : "s"} ago`;

  const sameYear = date.getFullYear() === now.getFullYear();
  return date.toLocaleDateString(
    [],
    sameYear
      ? { month: "short", day: "numeric" }
      : { month: "short", day: "numeric", year: "numeric" },
  );
}

// Plain date label for due/assigned dates in the Task Activity box —
// no relative phrasing, just "Jul 16, 2026" style.
export function formatPlainDate(dateStr) {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// iOS-notification-style short timestamp ("now" / "5m" / "2h" / "3d") —
// only used by the message-type Inbox card, which mimics an iOS banner.
// Separate from formatRelativeTime above so every other Inbox card's
// timestamp wording is untouched.
export function formatIOSTime(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "";
  const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);

  if (diffSec < 60) return "now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d`;
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}