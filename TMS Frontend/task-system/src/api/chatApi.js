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
    const res = await axiosInstance.post("/upload/chat", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data; // { url, name, type, size }
  },
};
