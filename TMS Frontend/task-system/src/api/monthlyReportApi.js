// src/api/monthlyReportApi.js
import axiosInstance from "./axiosInstance";

export const monthlyReportApi = {
  getReminders: async () => {
    const res = await axiosInstance.get("/monthly-reports/reminders");
    return res.data;
  },
  getCurrentReport: async (teamId) => {
    const res = await axiosInstance.get(
      `/monthly-reports/teams/${teamId}/current`,
    );
    return res.data;
  },
  setRating: async (teamId, memberId, rating) => {
    const res = await axiosInstance.put(
      `/monthly-reports/teams/${teamId}/current/ratings/${memberId}`,
      { rating },
    );
    return res.data;
  },
  submitReport: async (teamId) => {
    const res = await axiosInstance.post(
      `/monthly-reports/teams/${teamId}/current/submit`,
    );
    return res.data;
  },
  getAnnouncement: async () => {
    const res = await axiosInstance.get("/monthly-reports/announcement");
    return res.data;
  },
  releaseNow: async (period) => {
    const res = await axiosInstance.post("/monthly-reports/release", {
      period,
    });
    return res.data;
  },
};
