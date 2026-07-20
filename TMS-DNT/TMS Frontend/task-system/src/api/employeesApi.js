import axiosInstance from "./axiosInstance";

export const employeesApi = {
  getRoster: async () => {
    const res = await axiosInstance.get("/employees/roster");
    return res.data; // { date, employees: [{ employeeCode, name, gender, department, status, checkIn, checkOut }] }
  },

  // Any authenticated user can hit this (unlike /roster). Used here to
  // look up the current user's own department for the profile page.
  getDirectory: async () => {
    const res = await axiosInstance.get("/employees/directory");
    return res.data; // { employees: [{ employeeCode, name, department, userId }] }
  },
};
