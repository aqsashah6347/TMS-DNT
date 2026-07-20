import axiosInstance from "./axiosInstance";

export const authApi = {
  // identifier is the employee ID (e.g. "EMP-1001"). The backend also
  // still accepts an email address here for legacy/admin accounts.
  login: async (identifier, password) => {
    const res = await axiosInstance.post("/auth/login", {
      employeeId: identifier,
      password,
    });
    return res.data; // expected: { user, requiresTwoFactor, tempToken }
  },

  verifyOtp: async (tempToken, otp) => {
    const res = await axiosInstance.post("/auth/verify-otp", {
      tempToken,
      otp,
    });
    return res.data; // expected: { user, token }
  },

  logout: async () => {
    await axiosInstance.post("/auth/logout");
  },

  getCurrentUser: async () => {
    const res = await axiosInstance.get("/auth/me");
    return res.data;
  },
};
