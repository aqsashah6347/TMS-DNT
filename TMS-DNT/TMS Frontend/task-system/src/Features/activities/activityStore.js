import { create } from "zustand";
import { activityApi } from "../../api/activityApi";
import { getSocket } from "../../lib/socket";

export const useActivityStore = create((set, get) => ({
  activities: [],
  loading: false,

  // Separate feed for Box 1 (Action Activity) — for an admin this holds
  // every user's self-logged actions, not just their own, so it's kept
  // apart from `activities` (which stays "my personal notifications
  // only," used for the Inbox box and unread badge).
  actionActivities: [],
  actionLoading: false,

  socketBound: false,
  unreadCount: 0,

  fetchActivities: async () => {
    set({ loading: true });
    try {
      const activities = await activityApi.getAll();
      set({
        activities,
        unreadCount: activities.filter((a) => !a.read).length,
        loading: false,
      });
    } catch {
      set({ loading: false });
    }
  },

  fetchActionActivities: async () => {
    set({ actionLoading: true });
    try {
      const actionActivities = await activityApi.getActions();
      set({ actionActivities, actionLoading: false });
    } catch {
      set({ actionLoading: false });
    }
  },

  markAsRead: async (id) => {
    // Optimistic: flips the card to "read" instantly instead of waiting
    // on the round trip.
    set((state) => {
      const wasUnread = state.activities.find((a) => a.id === id && !a.read);
      return {
        activities: state.activities.map((a) =>
          a.id === id ? { ...a, read: true } : a,
        ),
        unreadCount: wasUnread
          ? Math.max(0, state.unreadCount - 1)
          : state.unreadCount,
      };
    });
    try {
      await activityApi.markAsRead(id);
    } catch {
      get().fetchActivities(); // fell out of sync with the server — just refetch
    }
  },

  markAllAsRead: async () => {
    set((state) => ({
      activities: state.activities.map((a) => ({ ...a, read: true })),
      unreadCount: 0,
    }));
    try {
      await activityApi.markAllAsRead();
    } catch {
      get().fetchActivities();
    }
  },

  // Call once after the socket connects. Guarded so calling it from more
  // than one page never stacks duplicate listeners.
  initSocketListeners: () => {
    if (get().socketBound) return;
    const socket = getSocket();
    if (!socket) return;

    socket.on("new_activity", (activity) => {
      set((state) => ({
        activities: [activity, ...state.activities],
        unreadCount: state.unreadCount + 1,
      }));
      // Same event also feeds Box 1. For a regular user this is always
      // their own action; for an admin it may be anyone's — the backend
      // only pushes into the shared "admins" room for self-logged
      // action types, so this array never picks up task_assigned /
      // deadline_missed noise meant for the Inbox box.
      set((state) => ({
        actionActivities: [activity, ...state.actionActivities],
      }));
    });

    set({ socketBound: true });
  },
}));