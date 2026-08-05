import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { connectSocket, disconnectSocket } from "../lib/socket";

// Small storage adapter that reads/writes to either localStorage or
// sessionStorage depending on whether "Keep me logged in" was checked
// at login time. The flag itself always lives in localStorage (it's not
// sensitive) so we know which backing store to use even before any auth
// state has been read — e.g. right after a full browser restart.
const REMEMBER_KEY = "tms_remember_me";

function getBackingStorage() {
  return localStorage.getItem(REMEMBER_KEY) === "true"
    ? localStorage
    : sessionStorage;
}

const dynamicStorage = {
  getItem: (name) => getBackingStorage().getItem(name),
  setItem: (name, value) => getBackingStorage().setItem(name, value),
  removeItem: (name) => getBackingStorage().removeItem(name),
};

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      rememberMe: false,

      // userData: the user object from the API response, or a locally
      // patched copy of the existing user (e.g. after changing avatar color)
      // token: only passed on an actual login/2FA-verify — omit it for a
      //   plain "update the cached user" call and the session is left alone
      // remember: whether to persist the session across browser restarts
      //   (only meaningful when a token is provided)
      login: (userData, token, remember = false) => {
        // No token = this isn't a real (re)login, just a user-data patch
        // (profile edits, avatar color, etc). Don't touch storage/remember.
        if (!token) {
          set({ user: userData, isAuthenticated: true });
          return;
        }

        // Real login: set the flag first so the persist middleware's next
        // write lands in the right storage.
        localStorage.setItem(REMEMBER_KEY, remember ? "true" : "false");

        // Clean up whichever storage we are NOT using, so a stale token
        // doesn't linger there from a previous login with the opposite
        // "remember me" choice.
        const chosen = remember ? localStorage : sessionStorage;
        const other = remember ? sessionStorage : localStorage;
        other.removeItem("tms_token");
        chosen.setItem("tms_token", token);

        set({ user: userData, isAuthenticated: true, rememberMe: remember });
        connectSocket();
      },

      logout: () => {
        localStorage.removeItem("tms_token");
        sessionStorage.removeItem("tms_token");
        localStorage.removeItem(REMEMBER_KEY);
        set({ user: null, isAuthenticated: false, rememberMe: false });
        disconnectSocket();
      },
    }),
    {
      name: "tms-auth",
      storage: createJSONStorage(() => dynamicStorage),
    },
  ),
);
