import { create } from "zustand";

// Placeholder seed data — replace with notificationApi.getAll() later.
const seedNotifications = [
  {
    id: 1,
    type: "assignment",
    message: "You were assigned to 'Fix login bug'",
    relatedEntity: "task",
    time: "10m ago",
    read: false,
  },
  {
    id: 2,
    type: "status",
    message: "'Update permissions' marked as Done",
    relatedEntity: "task",
    time: "1h ago",
    read: false,
  },
  {
    id: 3,
    type: "overdue",
    message: "'Review proposal' is overdue",
    relatedEntity: "task",
    time: "3h ago",
    read: true,
  },
  {
    id: 4,
    type: "assignment",
    message: "You were added to 'Mobile App Revamp'",
    relatedEntity: "project",
    time: "1d ago",
    read: true,
  },
];

export const useNotificationStore = create((set, get) => ({
  notifications: seedNotifications,

  markAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n,
      ),
    })),

  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    })),

  unreadCount: () => get().notifications.filter((n) => !n.read).length,
}));
