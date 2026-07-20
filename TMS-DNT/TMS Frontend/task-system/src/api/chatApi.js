import axiosInstance from "./axiosInstance";

// The backend serves uploads from its own origin, not the /api prefix —
// adjust ORIGIN if your axiosInstance baseURL points somewhere other than
// http://localhost:5000.
const ORIGIN = "http://localhost:5000";
export const fileUrl = (path) =>
  path?.startsWith("http") ? path : `${ORIGIN}${path}`;

export const chatApi = {
  getConversations: async () => {
    const res = await axiosInstance.get("/chat/conversations");
    return res.data;
  },

  getMessages: async (userId) => {
    const res = await axiosInstance.get(`/chat/${userId}`);
    return res.data;
  },

  getAllUsers: async () => {
    const res = await axiosInstance.get("/users");
    return res.data;
  },

  uploadFile: async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    // axiosInstance defaults Content-Type to application/json for every
    // request — explicitly clearing it here lets the browser set
    // multipart/form-data with the correct boundary itself. Without this
    // the request body never parses on the server and multer sees no file.
    const res = await axiosInstance.post("/upload/chat", formData, {
      headers: { "Content-Type": undefined },
    });
    return res.data; // { url, name, type, size }
  },

  archiveConversation: async (userId, archived) => {
    const res = await axiosInstance.patch(`/chat/${userId}/archive`, {
      archived,
    });
    return res.data;
  },

  deleteConversation: async (userId) => {
    const res = await axiosInstance.delete(`/chat/${userId}`);
    return res.data;
  },

  // ---------- Team (group) chat ----------
  getTeams: async () => {
    const res = await axiosInstance.get("/chat/teams");
    return res.data;
  },

  getTeamMessages: async (teamId) => {
    const res = await axiosInstance.get(`/chat/teams/${teamId}/messages`);
    return res.data;
  },
};