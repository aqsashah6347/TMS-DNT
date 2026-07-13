import axiosInstance from "./axiosInstance";

export const employeesApi = {
  getRoster: async () => {
    const res = await axiosInstance.get("/employees/roster");
    return res.data; // { date, employees: [{ employeeCode, name, gender, department, status, checkIn, checkOut }] }
  },
};
