import axiosInstance from "./axiosInstance";

export const attendanceApi = {
  getTodayAttendance: async () => {
    const res = await axiosInstance.get("/attendance/today");
    return res.data; // { date, employees: [{ id, name, avatarUrl, firstLogTime }], unmatchedCount }
  },
};
