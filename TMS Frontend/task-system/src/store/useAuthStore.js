import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { connectSocket, disconnectSocket } from "../lib/socket";

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      // userData: the user object from the API response
      // token: the JWT from either /auth/login (no 2FA) or /auth/verify-otp
      login: (userData, token) => {
        if (token) localStorage.setItem("tms_token", token);
        set({ user: userData, isAuthenticated: true });
        connectSocket();
      },

      logout: () => {
        localStorage.removeItem("tms_token");
        set({ user: null, isAuthenticated: false });
        disconnectSocket();
      },
    }),
    {
      name: "tms-auth", // sessionStorage key
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);