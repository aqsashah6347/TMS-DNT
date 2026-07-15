import { create } from "zustand";
import { activityApi } from "../../api/activityApi";
import { getSocket } from "../../lib/socket";

export const useActivityStore = create((set, get) => ({
  activities: [],
  loading: false,
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
    });

    set({ socketBound: true });
  },
}));
