import axiosInstance from "./axiosInstance";

export const activityApi = {
  getAll: async () => {
    const res = await axiosInstance.get("/activities");
    return res.data;
  },
  markAsRead: async (id) => {
    const res = await axiosInstance.put(`/activities/${id}/read`);
    return res.data;
  },
  markAllAsRead: async () => {
    const res = await axiosInstance.put("/activities/read-all");
    return res.data;
  },
};
