import axiosInstance from "./axiosInstance";

export const authApi = {
  login: async (email, password) => {
    const res = await axiosInstance.post("/auth/login", { email, password });
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
