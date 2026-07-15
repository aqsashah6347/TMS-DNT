// src/api/usersApi.js  (BUGFIX — was self-importing an accessStore copy-paste, breaking ProjectModal + Access page)
import axiosInstance from "./axiosInstance";

export const usersApi = {
  getAllUsers: async () => {
    const res = await axiosInstance.get("/users");
    return res.data;
  },

  createFromRoster: async ({ name, employeeCode, role }) => {
    const res = await axiosInstance.post("/users/from-roster", {
      name,
      employeeCode,
      role,
    });
    return res.data;
  },

  updateUser: async (id, updates) => {
    const res = await axiosInstance.put(`/users/${id}`, updates);
    return res.data;
  },

  deleteUser: async (id) => {
    const res = await axiosInstance.delete(`/users/${id}`);
    return res.data;
  },
};
