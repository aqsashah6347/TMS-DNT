import { create } from "zustand";

// ---- Seed data ----------------------------------------------------------

const seedThreads = [
  {
    id: 1,
    name: "Feature/Auth-Bugs",
    avatarText: "AB",
    avatarColor: "#fb923c",
    online: true,
    lastMessage: "Pushed the fix for the OTP validation issue",
    time: "2m",
    unread: 3,
  },
  {
    id: 2,
    name: "Sara Ahmed",
    avatarText: "SA",
    avatarColor: "#b490f5",
    online: true,
    lastMessage: "Can you review the proposal draft?",
    time: "18m",
    unread: 0,
  },
  {
    id: 3,
    name: "Bug/Payment-Gateway",
    avatarText: "PG",
    avatarColor: "#f87171",
    online: false,
    lastMessage: "Build failed on staging, checking logs now",
    time: "1h",
    unread: 1,
  },
  {
    id: 4,
    name: "Ali Raza",
    avatarText: "AR",
    avatarColor: "#a8f08a",
    online: false,
    lastMessage: "Sounds good, I'll update the ticket",
    time: "3h",
    unread: 0,
  },
  {
    id: 5,
    name: "Design Team",
    avatarText: "DT",
    avatarColor: "#ffd27f",
    online: true,
    lastMessage: "New mockups are in Figma, take a look",
    time: "1d",
    unread: 0,
  },
];

const seedMessages = {
  1: [
    {
      id: 1,
      sender: "them",
      type: "text",
      text: "Hey, I dug into the OTP bug from yesterday.",
      time: "10:02 AM",
    },
    {
      id: 2,
      sender: "them",
      type: "text",
      text: "Found it — assigned_staff_id was coercing '' to 0 instead of null.",
      time: "10:03 AM",
    },
    {
      id: 3,
      sender: "me",
      type: "text",
      text: "Ah that'll do it. Good catch. Can you paste the fix?",
      time: "10:05 AM",
    },
    {
      id: 4,
      sender: "them",
      type: "code",
      text: `if (lead.assigned_staff_id && Number.isFinite(Number(lead.assigned_staff_id))) {
  request.input("assigned_staff_id", Number(lead.assigned_staff_id));
}`,
      time: "10:06 AM",
    },
    {
      id: 5,
      sender: "them",
      type: "markdown",
      text: "**Summary:** guarding the `Number.isFinite` check with a truthy check on the raw value first prevents `''` from silently becoming `0`.",
      time: "10:06 AM",
    },
    {
      id: 6,
      sender: "me",
      type: "text",
      text: "Perfect, pushing this to staging now.",
      time: "10:08 AM",
    },
    {
      id: 7,
      sender: "them",
      type: "text",
      text: "Pushed the fix for the OTP validation issue",
      time: "10:14 AM",
    },
  ],
  2: [
    {
      id: 1,
      sender: "them",
      type: "text",
      text: "Can you review the proposal draft?",
      time: "9:40 AM",
    },
  ],
  3: [
    {
      id: 1,
      sender: "them",
      type: "text",
      text: "Build failed on staging, checking logs now",
      time: "8:55 AM",
    },
  ],
  4: [
    {
      id: 1,
      sender: "me",
      type: "text",
      text: "Can you take the permissions ticket?",
      time: "Yesterday",
    },
    {
      id: 2,
      sender: "them",
      type: "text",
      text: "Sounds good, I'll update the ticket",
      time: "Yesterday",
    },
  ],
  5: [
    {
      id: 1,
      sender: "them",
      type: "text",
      text: "New mockups are in Figma, take a look",
      time: "Yesterday",
    },
  ],
};

const seedNotifications = [
  {
    id: 1,
    type: "assignment",
    title: "New task assigned",
    description: "You were assigned to Task #104 — Fix login 2FA bug",
    time: "5m ago",
    read: false,
  },
  {
    id: 2,
    type: "pr",
    title: "Pull request approved",
    description: "Sara approved your PR 'Fix OTP validation'",
    time: "22m ago",
    read: false,
  },
  {
    id: 3,
    type: "build",
    title: "Build failed",
    description: "Build failed in main — payment-gateway staging deploy",
    time: "1h ago",
    read: false,
  },
  {
    id: 4,
    type: "mention",
    title: "You were mentioned",
    description: "Ali mentioned you in Bug/Payment-Gateway",
    time: "3h ago",
    read: true,
  },
  {
    id: 5,
    type: "assignment",
    title: "Added to project",
    description: "You were added to 'Mobile App Revamp'",
    time: "1d ago",
    read: true,
  },
];

// ---- Store ----------------------------------------------------------------

export const useChatStore = create((set, get) => ({
  threads: seedThreads,
  messagesByThread: seedMessages,
  activeThreadId: 1,
  isNotificationOpen: false,
  notifications: seedNotifications,
  search: "",

  setSearch: (search) => set({ search }),

  selectThread: (id) =>
    set((state) => ({
      activeThreadId: id,
      threads: state.threads.map((t) =>
        t.id === id ? { ...t, unread: 0 } : t,
      ),
    })),

  sendMessage: (threadId, text) => {
    if (!text.trim()) return;
    const newMsg = {
      id: Date.now(),
      sender: "me",
      type: "text",
      text: text.trim(),
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    set((state) => ({
      messagesByThread: {
        ...state.messagesByThread,
        [threadId]: [...(state.messagesByThread[threadId] || []), newMsg],
      },
      threads: state.threads.map((t) =>
        t.id === threadId ? { ...t, lastMessage: text.trim(), time: "now" } : t,
      ),
    }));
  },

  toggleNotifications: () =>
    set((state) => ({ isNotificationOpen: !state.isNotificationOpen })),
  closeNotifications: () => set({ isNotificationOpen: false }),

  markNotificationRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n,
      ),
    })),

  dismissNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),

  markAllNotificationsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    })),

  unreadNotificationCount: () =>
    get().notifications.filter((n) => !n.read).length,
}));
