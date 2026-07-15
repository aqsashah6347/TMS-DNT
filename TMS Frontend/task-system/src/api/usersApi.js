import axiosInstance from "./axiosInstance";

export const usersApi = {
  // GET /api/users
  getAllUsers: async () => {
    const res = await axiosInstance.get("/users");
    return res.data;
  },

  // POST /api/users/from-roster
  // { name, employeeCode, role } -> { id, name, email, role, status, enrollNo }
  createFromRoster: async ({ name, employeeCode, role }) => {
    const res = await axiosInstance.post("/users/from-roster", {
      name,
      employeeCode,
      role,
    });
    return res.data;
  },

  // PUT /api/users/:id
  updateUser: async (id, updates) => {
    const res = await axiosInstance.put(`/users/${id}`, updates);
    return res.data;
  },

  // DELETE /api/users/:id
  deleteUser: async (id) => {
    const res = await axiosInstance.delete(`/users/${id}`);
    return res.data;
  },
};