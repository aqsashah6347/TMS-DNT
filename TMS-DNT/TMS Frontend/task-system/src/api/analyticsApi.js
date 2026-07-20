import axiosInstance from "./axiosInstance";

export const analyticsApi = {
  getCompletionRate: async (weeks = 6) => {
    const res = await axiosInstance.get("/analytics/completion-rate", { params: { weeks } });
    return res.data;
  },
  getOverdue: async () => {
    const res = await axiosInstance.get("/analytics/overdue");
    return res.data;
  },
  getProductivity: async () => {
    const res = await axiosInstance.get("/analytics/productivity");
    return res.data;
  },
  getWorkload: async () => {
    const res = await axiosInstance.get("/analytics/workload");
    return res.data;
  },
};