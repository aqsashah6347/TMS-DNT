// Unread "you've got a message" signal that works no matter what the
// user is looking at:
//   - Browser tab: title gets an "(n)" prefix and the favicon gets a
//     red dot, same idea as Gmail/Slack's tab badge.
//   - Desktop: a native OS notification (via the Notification API),
//     which shows up even if the user is in a completely different
//     app, since it's rendered by the OS, not the page.
//
// The tab badge and the desktop popup are two independent knobs.
// Neither is shown if the user is already looking straight at this
// tab (visible + focused) — there's nothing to alert them to.

const BASE_TITLE = document.title;
const FAVICON_HREF = "/favicon.svg";
const PREF_KEY = "tms_notifications_enabled";

let unreadCount = 0;
let badgeIconPromise = null;

// Persisted per-browser (there's no backend column for this yet) —
// lets a user turn the tab bubble + desktop popups off entirely from
// the Settings tab. Defaults to on.
export function getNotificationsEnabled() {
  return localStorage.getItem(PREF_KEY) !== "off";
}

export function setNotificationsEnabled(enabled) {
  localStorage.setItem(PREF_KEY, enabled ? "on" : "off");
  if (!enabled) clearUnread();
}

function getFaviconLink() {
  let link = document.querySelector("link[rel='icon']");
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }
  return link;
}

// Draws the existing favicon onto a canvas with a small red dot added
// in the corner, and caches the result as a data URL so we only do
// this once per page load.
function buildBadgeIcon() {
  if (badgeIconPromise) return badgeIconPromise;

  badgeIconPromise = new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const size = 32;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, size, size);

      ctx.beginPath();
      ctx.arc(size - 7, 7, 7, 0, Math.PI * 2);
      ctx.fillStyle = "#ef4444";
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#18181b";
      ctx.stroke();

      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => resolve(null);
    img.src = FAVICON_HREF;
  });

  return badgeIconPromise;
}

function applyBadge() {
  document.title =
    unreadCount > 0 ? `(${unreadCount}) ${BASE_TITLE}` : BASE_TITLE;

  const link = getFaviconLink();
  if (unreadCount > 0) {
    buildBadgeIcon().then((href) => {
      if (href) link.href = href;
    });
  } else {
    link.href = FAVICON_HREF;
  }
}

function tabIsActive() {
  return document.visibilityState === "visible" && document.hasFocus();
}

export function bumpUnread() {
  unreadCount += 1;
  applyBadge();
}

export function clearUnread() {
  if (unreadCount === 0) return;
  unreadCount = 0;
  applyBadge();
}

// Call once after login so the browser's permission prompt is tied to
// a real user session rather than firing on the login screen.
export function requestNotificationPermission() {
  if (!("Notification" in window)) return;
  if (Notification.permission === "default") {
    Notification.requestPermission();
  }
}

// Call this whenever a message/team message arrives over the socket.
// - Skips everything if the user has turned notifications off.
// - Always bumps the tab title/favicon bubble if the tab isn't the
//   one the user is actively looking at.
// - Also fires a desktop notification in that case, so it reaches the
//   user even if they're in another app entirely.
export function notifyIncomingMessage({ title, body, onClick }) {
  if (!getNotificationsEnabled()) return;
  if (tabIsActive()) return;

  bumpUnread();

  if ("Notification" in window && Notification.permission === "granted") {
    const n = new Notification(title || "New message", {
      body: body || "",
      icon: FAVICON_HREF,
      tag: "tms-chat-message",
    });
    n.onclick = () => {
      window.focus();
      if (onClick) onClick();
      n.close();
    };
  }
}

// Wire once app-wide (see App.jsx) so coming back to the tab clears
// the badge automatically instead of leaving a stale "(3)" behind.
export function initBadgeClearOnFocus() {
  const clear = () => {
    if (tabIsActive()) clearUnread();
  };
  document.addEventListener("visibilitychange", clear);
  window.addEventListener("focus", clear);
  return () => {
    document.removeEventListener("visibilitychange", clear);
    window.removeEventListener("focus", clear);
  };
}
