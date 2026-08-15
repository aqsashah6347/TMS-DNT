import axiosInstance from "./axiosInstance";

export const attendanceApi = {
  getTodayAttendance: async () => {
    const res = await axiosInstance.get("/attendance/today");
    return res.data; // { date, employees: [{ id, name, avatarUrl, firstLogTime }], unmatchedCount }
  },

  // range: "today" | "week" | "month"
  getEmployeeHistory: async (employeeCode, range = "today") => {
    const res = await axiosInstance.get(`/attendance/employee/${employeeCode}`, {
      params: { range },
    });
    return res.data; // { employeeCode, name, department, range, from, to, days: [{ date, checkIn, checkOut, present }] }
  },
};