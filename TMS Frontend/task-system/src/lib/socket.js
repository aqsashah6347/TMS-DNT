import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:5000";

let socket = null;

// Created lazily so it always picks up the freshest token. Call this
// right after login (or on app load if a token already exists).
export function connectSocket() {
  const token = localStorage.getItem("tms_token");
  if (!token) return null;

  if (socket) socket.disconnect();

  socket = io(SOCKET_URL, { auth: { token }, autoConnect: true });
  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}