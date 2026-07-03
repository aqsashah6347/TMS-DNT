import { create } from "zustand";

// Placeholder — later this gets set from a real login response (authApi.login()).
// role is either "user" or "admin" — drives sidebar visibility and route protection.
export const useAuthStore = create((set) => ({
  user: { id: 1, name: "Aqsa", email: "aqsa@example.com", role: "admin" },
  isAuthenticated: true,

  login: (userData) => set({ user: userData, isAuthenticated: true }),
  logout: () => set({ user: null, isAuthenticated: false }),
}));
