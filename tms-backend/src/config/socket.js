const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const chatService = require("../services/chatService");
const teamChatService = require("../services/teamChatService");

let io;
// userId -> Set of socket ids (a user can have multiple tabs/devices open)
const onlineUsers = new Map();

function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: process.env.FRONTEND_URL || "http://localhost:5173" },
  });

  // Same JWT your REST routes use — sent by the client during the
  // socket handshake instead of an Authorization header.
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("No token provided"));

    try {
      socket.user = jwt.verify(token, process.env.JWT_SECRET); // { id, name, email, role }
      next();
    } catch (err) {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", async (socket) => {
    const userId = socket.user.id;

    if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
    onlineUsers.get(userId).add(socket.id);

    // Personal room — lets us push to "user 7" without tracking which
    // specific socket/tab/device they're currently on.
    socket.join(`user_${userId}`);
      // Admins also get a shared room so logActivity can push everyone's
    // self-logged actions to their Action Activity box in real time.
    if (socket.user.role === "admin") {
      socket.join("admins");
    }

    // Join a room per team the user is allowed to group-chat in, so
    // send_team_message can just broadcast to `team_${teamId}` without
    // re-checking membership on every single message.
    try {
      const teamIds = await teamChatService.getAccessibleTeamIds(
        userId,
        socket.user.role,
      );
      teamIds.forEach((teamId) => socket.join(`team_${teamId}`));
    } catch (err) {
      console.error("Failed to join team chat rooms:", err.message);
    }

    io.emit("user_online", { userId });
    socket.emit("online_users", Array.from(onlineUsers.keys()));

   socket.on(
     "send_message",
     async ({ receiverId, message, attachment }, callback) => {
       try {
         const trimmed = (message || "").trim();
         if (!receiverId || (!trimmed && !attachment)) return;

         const saved = await chatService.saveMessage(
           userId,
           receiverId,
           trimmed || null,
           attachment,
         );

         io.to(`user_${receiverId}`).emit("receive_message", saved);
         io.to(`user_${userId}`).emit("receive_message", saved); // sync sender's other tabs

         if (typeof callback === "function")
           callback({ status: "ok", message: saved });
       } catch (err) {
         if (typeof callback === "function")
           callback({ status: "error", error: err.message });
       }
     },
   );
    socket.on("typing", ({ receiverId }) => {
      io.to(`user_${receiverId}`).emit("typing", { userId });
    });

    socket.on("stop_typing", ({ receiverId }) => {
      io.to(`user_${receiverId}`).emit("stop_typing", { userId });
    });

    socket.on("mark_read", async ({ senderId }) => {
      try {
        await chatService.markAsRead(userId, senderId);
        io.to(`user_${senderId}`).emit("messages_read", { readBy: userId });
      } catch (err) {
        console.error("mark_read failed:", err.message);
      }
    });

    // ---------- Team (group) chat ----------
    socket.on(
      "send_team_message",
      async ({ teamId, message, attachment }, callback) => {
        try {
          const trimmed = (message || "").trim();
          if (!teamId || (!trimmed && !attachment)) return;

          const allowed = await teamChatService.canAccessTeam(
            userId,
            socket.user.role,
            teamId,
          );
          if (!allowed) {
            if (typeof callback === "function")
              callback({ status: "error", error: "Not allowed in this team" });
            return;
          }

          const saved = await teamChatService.saveTeamMessage(
            teamId,
            userId,
            trimmed || null,
            attachment,
          );

          io.to(`team_${teamId}`).emit("receive_team_message", saved);

          if (typeof callback === "function")
            callback({ status: "ok", message: saved });
        } catch (err) {
          if (typeof callback === "function")
            callback({ status: "error", error: err.message });
        }
      },
    );

    socket.on("team_typing", ({ teamId }) => {
      socket.to(`team_${teamId}`).emit("team_typing", { teamId, userId });
    });

    socket.on("team_stop_typing", ({ teamId }) => {
      socket.to(`team_${teamId}`).emit("team_stop_typing", { teamId, userId });
    });

    socket.on("team_mark_read", async ({ teamId }) => {
      try {
        await teamChatService.markTeamAsRead(teamId, userId);
      } catch (err) {
        console.error("team_mark_read failed:", err.message);
      }
    });

    socket.on("disconnect", () => {
      const sockets = onlineUsers.get(userId);
      if (!sockets) return;
      sockets.delete(socket.id);
      if (sockets.size === 0) {
        onlineUsers.delete(userId);
        io.emit("user_offline", { userId });
      }
    });
  });

  return io;
}

function getIO() {
  if (!io) throw new Error("Socket.io not initialized — call initSocket() first");
  return io;
}

module.exports = { initSocket, getIO };