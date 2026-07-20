import { create } from "zustand";
import { chatApi } from "../../api/chatApi";
import { getSocket } from "../../lib/socket";
import { useAuthStore } from "../../store/useAuthStore";
import { notifyIncomingMessage } from "../../lib/notify";

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

  // ---------- Team (group) chat state ----------
  teams: [],
  teamsLoading: false,
  teamMessagesByTeam: {},
  activeTeamId: null,
  teamTypingByTeam: {}, // teamId -> Set of userIds currently typing

  fetchConversations: async () => {
    set({ isLoading: true, error: null });
    try {
      const conversations = await chatApi.getConversations();
      const activeUserId = get().activeUserId;
      // Whatever the DB says, if I'm actively looking at this
      // conversation right now it's read — don't let a slow refetch
      // snap the badge back on.
      const patched = activeUserId
        ? conversations.map((c) =>
            c.userId === activeUserId ? { ...c, unreadCount: 0 } : c,
          )
        : conversations;
      set({ conversations: patched, isLoading: false });
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
    set({ activeUserId: userId, activeTeamId: null });

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
  // Returns true/false so the caller knows whether it's safe to clear
  // the input, instead of assuming it always worked.
  sendMessage: async (receiverId, message, file = null) => {
    const socket = getSocket();
    set({ error: null });

    if (!socket) {
      set({ error: "Not connected — try refreshing the page" });
      return false;
    }
    if (!message.trim() && !file) return false;

    let attachment = null;
    if (file) {
      try {
        attachment = await chatApi.uploadFile(file);
      } catch (err) {
        set({
          error: err.response?.data?.message || "File upload failed",
        });
        return false;
      }
    }

    return new Promise((resolve) => {
      socket.emit(
        "send_message",
        { receiverId, message: message.trim(), attachment },
        (ack) => {
          if (ack?.status === "error") {
            set({ error: ack.error || "Message failed to send" });
            resolve(false);
          } else {
            resolve(true);
          }
        },
      );
    });
  },

  // Archive/unarchive only changes how this user sees the chat — flip it
  // optimistically, then let the server call confirm it.
  archiveConversation: async (userId, archived) => {
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.userId === userId ? { ...c, archived } : c,
      ),
    }));
    try {
      await chatApi.archiveConversation(userId, archived);
      return true;
    } catch (err) {
      set({
        error: err.response?.data?.message || "Failed to update chat",
      });
      return false;
    }
  },

  // "Delete chat" clears it from this user's own view only — the other
  // person's copy and the stored messages are untouched.
  deleteConversation: async (userId) => {
    try {
      await chatApi.deleteConversation(userId);
      set((state) => {
        const nextMessages = { ...state.messagesByUser };
        delete nextMessages[userId];
        const nextPinned = new Set(state.pinnedUserIds);
        nextPinned.delete(userId);
        return {
          conversations: state.conversations.filter((c) => c.userId !== userId),
          messagesByUser: nextMessages,
          pinnedUserIds: nextPinned,
          activeUserId:
            state.activeUserId === userId ? null : state.activeUserId,
        };
      });
      return true;
    } catch (err) {
      set({
        error: err.response?.data?.message || "Failed to delete chat",
      });
      return false;
    }
  },

  // ---------- Team (group) chat actions ----------
  fetchTeams: async () => {
    set({ teamsLoading: true, error: null });
    try {
      const activeTeamId = get().activeTeamId;
      const teams = await chatApi.getTeams();
      const patched = activeTeamId
        ? teams.map((t) =>
            t.id === activeTeamId ? { ...t, unreadCount: 0 } : t,
          )
        : teams;
      set({ teams: patched, teamsLoading: false });
    } catch (err) {
      set({
        error: err.response?.data?.message || "Failed to load teams",
        teamsLoading: false,
      });
    }
  },

  openTeamConversation: async (teamId) => {
    set({ activeTeamId: teamId, activeUserId: null });

    set((state) => ({
      teams: state.teams.map((t) =>
        t.id === teamId ? { ...t, unreadCount: 0 } : t,
      ),
    }));

    if (!get().teamMessagesByTeam[teamId]) {
      try {
        const messages = await chatApi.getTeamMessages(teamId);
        set((state) => ({
          teamMessagesByTeam: {
            ...state.teamMessagesByTeam,
            [teamId]: messages,
          },
        }));
      } catch (err) {
        set({
          error: err.response?.data?.message || "Failed to load team messages",
        });
      }
    }

    getSocket()?.emit("team_mark_read", { teamId });
  },

  sendTeamMessage: async (teamId, message, file = null) => {
    const socket = getSocket();
    set({ error: null });

    if (!socket) {
      set({ error: "Not connected — try refreshing the page" });
      return false;
    }
    if (!message.trim() && !file) return false;

    let attachment = null;
    if (file) {
      try {
        attachment = await chatApi.uploadFile(file);
      } catch (err) {
        set({ error: err.response?.data?.message || "File upload failed" });
        return false;
      }
    }

    return new Promise((resolve) => {
      socket.emit(
        "send_team_message",
        { teamId, message: message.trim(), attachment },
        (ack) => {
          if (ack?.status === "error") {
            set({ error: ack.error || "Message failed to send" });
            resolve(false);
          } else {
            resolve(true);
          }
        },
      );
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
    socket.off("receive_team_message");
    socket.off("team_typing");
    socket.off("team_stop_typing");

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

      // Only alert on messages someone else actually sent me — not the
      // "sync my other tabs" copy of my own outgoing messages.
      if (msg.sender_id !== myId) {
        const sender = get().conversations.find(
          (c) => c.userId === otherUserId,
        );
        notifyIncomingMessage({
          title: sender?.userName || "New message",
          body:
            msg.message ||
            (msg.attachment_name
              ? `Sent a file: ${msg.attachment_name}`
              : "Sent an attachment"),
          onClick: () => get().openConversation(otherUserId),
        });
      }

      // If this message just arrived in the conversation I'm currently
      // viewing, tell the server it's read immediately — otherwise it
      // sits unread until I click away and back.
      if (get().activeUserId === otherUserId && msg.sender_id === otherUserId) {
        getSocket()?.emit("mark_read", { senderId: otherUserId });
      }

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

    // ---------- Team (group) chat sockets ----------
    socket.on("receive_team_message", (msg) => {
      const myId = useAuthStore.getState().user?.id;
      const teamId = msg.team_id;

      set((state) => {
        const existing = state.teamMessagesByTeam[teamId] || [];
        return {
          teamMessagesByTeam: {
            ...state.teamMessagesByTeam,
            [teamId]: [...existing, msg],
          },
        };
      });

      if (msg.sender_id !== myId) {
        const team = get().teams.find((t) => t.id === teamId);
        notifyIncomingMessage({
          title: team?.name ? `${team.name} (team chat)` : "New team message",
          body:
            msg.message ||
            (msg.attachment_name
              ? `Sent a file: ${msg.attachment_name}`
              : "Sent an attachment"),
          onClick: () => get().openTeamConversation(teamId),
        });
      }

      // If I'm currently looking at this team's chat and someone else
      // sent it, mark it read right away instead of waiting for the
      // next fetchTeams poll.
      if (get().activeTeamId === teamId && msg.sender_id !== myId) {
        getSocket()?.emit("team_mark_read", { teamId });
      }

      get().fetchTeams();
    });

    socket.on("team_typing", ({ teamId, userId }) =>
      set((state) => {
        const existing = state.teamTypingByTeam[teamId] || new Set();
        return {
          teamTypingByTeam: {
            ...state.teamTypingByTeam,
            [teamId]: new Set(existing).add(userId),
          },
        };
      }),
    );

    socket.on("team_stop_typing", ({ teamId, userId }) =>
      set((state) => {
        const existing = state.teamTypingByTeam[teamId];
        if (!existing) return {};
        const next = new Set(existing);
        next.delete(userId);
        return {
          teamTypingByTeam: { ...state.teamTypingByTeam, [teamId]: next },
        };
      }),
    );
  },
}));
