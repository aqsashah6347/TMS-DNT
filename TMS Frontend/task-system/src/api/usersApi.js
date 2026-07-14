import axiosInstance from "./axiosInstance";

export const usersApi = {
  getAllUsers: async () => {
    const res = await axiosInstance.get("/users");
    return res.data; // [{ id, name, email, role, status, enroll_no }]
  },
};

