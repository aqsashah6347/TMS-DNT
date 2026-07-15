import { create } from "zustand";
import { chatApi } from "../../api/chatApi";
import { getSocket } from "../../lib/socket";
import { useAuthStore } from "../../store/useAuthStore";

export const useChatStore = create((set, get) => ({
  conversations: [],
  messagesByUser: {},
  activeUserId: null,
  onlineUserIds: new Set(),
  typingUserIds: new Set(),
  isLoading: false,
  error: null,

  allEmployees: [],
  employeesLoading: false,
  pinnedUserIds: new Set(),

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

  fetchAvailableEmployees: async () => {
    set({ employeesLoading: true });
    try {
      const allEmployees = await chatApi.getAllUsers();
      set({ allEmployees, employeesLoading: false });
    } catch (err) {
      set({
        error: err.response?.data?.message || "Failed to load employees",
        employeesLoading: false,
      });
    }
  },

  startConversation: (userId) => {
    set((state) => ({
      pinnedUserIds: new Set(state.pinnedUserIds).add(userId),
    }));
    get().openConversation(userId);
  },

  openConversation: async (userId) => {
    set({ activeUserId: userId });

    // Optimistic: zero out the badge immediately instead of waiting on
    // the mark_read round trip or the next fetchConversations poll.
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.userId === userId ? { ...c, unreadCount: 0 } : c,
      ),
    }));

    if (!get().messagesByUser[userId]) {
      try {
        const messages = await chatApi.getMessages(userId);
        set((state) => ({
          messagesByUser: { ...state.messagesByUser, [userId]: messages },
        }));
      } catch (err) {
        set({
          error: err.response?.data?.message || "Failed to load messages",
        });
      }
    }

    getSocket()?.emit("mark_read", { senderId: userId });
  },

  // Now supports an optional File — uploads it first (via REST), then
  // sends the resulting {url, name, type, size} alongside the text.
  sendMessage: async (receiverId, message, file = null) => {
    const socket = getSocket();
    if (!socket) return;
    if (!message.trim() && !file) return;

    let attachment = null;
    if (file) {
      try {
        attachment = await chatApi.uploadFile(file);
      } catch (err) {
        set({ error: "File upload failed" });
        return;
      }
    }

    socket.emit("send_message", {
      receiverId,
      message: message.trim(),
      attachment,
    });
  },

  initSocketListeners: () => {
    const socket = getSocket();
    if (!socket) return;

    socket.off("receive_message");
    socket.off("online_users");
    socket.off("user_online");
    socket.off("user_offline");
    socket.off("typing");
    socket.off("stop_typing");
    socket.off("messages_read");

    socket.on("receive_message", (msg) => {
      const myId = useAuthStore.getState().user?.id;
      const otherUserId =
        msg.sender_id === myId ? msg.receiver_id : msg.sender_id;

      set((state) => {
        const existing = state.messagesByUser[otherUserId] || [];
        return {
          messagesByUser: {
            ...state.messagesByUser,
            [otherUserId]: [...existing, msg],
          },
          pinnedUserIds: new Set(state.pinnedUserIds).add(otherUserId),
        };
      });
      get().fetchConversations();
    });

    // The "seen" receipt: fires on MY client when the person I'm chatting
    // with reads the messages I sent them. Flips is_read on my copies of
    // those messages so the checkmark updates without a refetch.
    socket.on("messages_read", ({ readBy }) => {
      set((state) => {
        const existing = state.messagesByUser[readBy] || [];
        return {
          messagesByUser: {
            ...state.messagesByUser,
            [readBy]: existing.map((m) =>
              m.sender_id !== readBy ? { ...m, is_read: true } : m,
            ),
          },
        };
      });
    });

    socket.on("online_users", (ids) => set({ onlineUserIds: new Set(ids) }));

    socket.on("user_online", ({ userId }) =>
      set((state) => ({
        onlineUserIds: new Set(state.onlineUserIds).add(userId),
      })),
    );

    socket.on("user_offline", ({ userId }) =>
      set((state) => {
        const next = new Set(state.onlineUserIds);
        next.delete(userId);
        return { onlineUserIds: next };
      }),
    );

    socket.on("typing", ({ userId }) =>
      set((state) => ({
        typingUserIds: new Set(state.typingUserIds).add(userId),
      })),
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
