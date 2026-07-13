import axiosInstance from "./axiosInstance";

export const chatApi = {
  getConversations: async () => {
    const res = await axiosInstance.get("/chat/conversations");
    return res.data;
  },

  getMessages: async (userId) => {
    const res = await axiosInstance.get(`/chat/${userId}`);
    return res.data;
  },

  // Reuses the existing GET /api/users route — used to populate the
  // "everyone you can message" list, not just people you've already chatted with.
  getAllUsers: async () => {
    const res = await axiosInstance.get("/users");
    return res.data;
  },
};