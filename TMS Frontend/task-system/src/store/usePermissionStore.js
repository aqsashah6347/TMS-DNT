import { create } from "zustand";
import { accessApi } from "../api/accessApi";

// Holds the logged-in user's own effective permissions (GET
// /permissions/me), fetched once on login/app-load — see App.jsx. This
// is what UI gating across the app should check instead of a raw
// `user.role === "admin"` string: an admin can override any user's
// per-module actions on the Access page, and that override wouldn't
// otherwise reach anything client-side (only the backend enforced it).
export const usePermissionStore = create((set, get) => ({
  permissions: null, // { module: [actions] }, null until first load resolves
  isLoaded: false,

  loadPermissions: async () => {
    try {
      const data = await accessApi.getMine();
      set({ permissions: data.permissions || {}, isLoaded: true });
    } catch (err) {
      // Fails closed: an empty permissions object means can() returns
      // false for everything until the next successful load, instead of
      // silently treating a failed fetch as "no restrictions".
      set({ permissions: {}, isLoaded: true });
    }
  },

  can: (module, action) => {
    const perms = get().permissions;
    if (!perms) return false;
    return (perms[module] || []).includes(action);
  },

  reset: () => set({ permissions: null, isLoaded: false }),
}));
