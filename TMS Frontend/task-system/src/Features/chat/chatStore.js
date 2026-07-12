import { create } from "zustand";
import { chatApi } from "../../api/chatApi";
import { getSocket } from "../../lib/socket";
import { useAuthStore } from "../../store/useAuthStore";

export const useChatStore = create((set, get) => ({
  conversations: [],
  messagesByUser: {}, // { [userId]: Message[] }
  activeUserId: null,
  onlineUserIds: new Set(),
  typingUserIds: new Set(),
  isLoading: false,
  error: null,

  fetchConversations: async () => {
    set({ isLoading: true, error: null });
    try {
      const conversations = await chatApi.getConversations();
      set({ conversations, isLoading: false });
    } catch (err) {
      set({
        error: err.response?.data?.message || "Failed to load conversations",
        isLoading: false,
      });
    }
  },

  openConversation: async (userId) => {
    set({ activeUserId: userId });

    if (!get().messagesByUser[userId]) {
      try {
        const messages = await chatApi.getMessages(userId);
        set((state) => ({
          messagesByUser: { ...state.messagesByUser, [userId]: messages },
        }));
      } catch (err) {
        set({ error: err.response?.data?.message || "Failed to load messages" });
      }
    }

    getSocket()?.emit("mark_read", { senderId: userId });
  },

  sendMessage: (receiverId, message) => {
    const socket = getSocket();
    if (!socket || !message.trim()) return;
    socket.emit("send_message", { receiverId, message: message.trim() });
  },

  // Wires socket events into store state. Safe to call every time the
  // Chat page mounts — it clears old listeners first.
  initSocketListeners: () => {
    const socket = getSocket();
    if (!socket) return;

    socket.off("receive_message");
    socket.off("online_users");
    socket.off("user_online");
    socket.off("user_offline");
    socket.off("typing");
    socket.off("stop_typing");

    socket.on("receive_message", (msg) => {
      const myId = useAuthStore.getState().user?.id;
      const otherUserId = msg.sender_id === myId ? msg.receiver_id : msg.sender_id;

      set((state) => {
        const existing = state.messagesByUser[otherUserId] || [];
        return {
          messagesByUser: { ...state.messagesByUser, [otherUserId]: [...existing, msg] },
        };
      });
      get().fetchConversations();
    });

    socket.on("online_users", (ids) => set({ onlineUserIds: new Set(ids) }));

    socket.on("user_online", ({ userId }) =>
      set((state) => ({ onlineUserIds: new Set(state.onlineUserIds).add(userId) })),
    );

    socket.on("user_offline", ({ userId }) =>
      set((state) => {
        const next = new Set(state.onlineUserIds);
        next.delete(userId);
        return { onlineUserIds: next };
      }),
    );

    socket.on("typing", ({ userId }) =>
      set((state) => ({ typingUserIds: new Set(state.typingUserIds).add(userId) })),
    );

    socket.on("stop_typing", ({ userId }) =>
      set((state) => {
        const next = new Set(state.typingUserIds);
        next.delete(userId);
        return { typingUserIds: next };
      }),
    );
  },
}));