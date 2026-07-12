const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const chatService = require("../services/chatService");

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

  io.on("connection", (socket) => {
    const userId = socket.user.id;

    if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
    onlineUsers.get(userId).add(socket.id);

    // Personal room — lets us push to "user 7" without tracking which
    // specific socket/tab/device they're currently on.
    socket.join(`user_${userId}`);

    io.emit("user_online", { userId });
    socket.emit("online_users", Array.from(onlineUsers.keys()));

    socket.on("send_message", async ({ receiverId, message }, callback) => {
      try {
        const trimmed = (message || "").trim();
        if (!trimmed || !receiverId) return;

        const saved = await chatService.saveMessage(userId, receiverId, trimmed);

        io.to(`user_${receiverId}`).emit("receive_message", saved);
        io.to(`user_${userId}`).emit("receive_message", saved); // sync sender's other tabs

        if (typeof callback === "function") callback({ status: "ok", message: saved });
      } catch (err) {
        if (typeof callback === "function") callback({ status: "error", error: err.message });
      }
    });

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