import axiosInstance from "./axiosInstance";

export const usersApi = {
  getAllUsers: async () => {
    const res = await axiosInstance.get("/users");
    return res.data;
  },

  // --- ADDED THIS METHOD ---
  getAssignableUsers: async () => {
    const res = await axiosInstance.get("/users/assignable");
    return res.data;
  },
  // -------------------------

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
  
  // Self-service — updates the CURRENT user's own avatar color and saves
  // it to the DB, so it follows them everywhere (not just this device).
  updateAvatarColor: async (color) => {
    const res = await axiosInstance.put("/users/me/avatar-color", { color });
    return res.data;
  },

  deleteUser: async (id) => {
    const res = await axiosInstance.delete(`/users/${id}`);
    return res.data;
  },
};