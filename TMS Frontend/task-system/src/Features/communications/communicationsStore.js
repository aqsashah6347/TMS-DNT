// TMS Frontend/task-system/src/Features/communications/communicationsStore.js
import { create } from "zustand";
import { notificationSettingsApi } from "../../api/notificationSettingsApi";

// type/channel pairs are fixed (they mirror the 3 automated notification
// jobs on the backend) — this just labels them nicely for the UI.
export const TYPE_LABELS = {
  task_assigned: "Task assigned",
  deadline_24h: "Deadline reminder (24h before)",
  progress_reminder: "Daily progress reminder",
};

export const useCommunicationsStore = create((set, get) => ({
  settings: [],
  logs: [],
  logTotal: 0,
  logFilters: { channel: "", type: "", status: "" },
  logPage: 1,
  logPageSize: 50,
  contacts: [],
  contactsTotal: 0,

  isLoadingSettings: false,
  isLoadingLog: false,
  isLoadingContacts: false,
  isSaving: false,
  error: null,

  fetchSettings: async () => {
    set({ isLoadingSettings: true, error: null });
    try {
      const { settings } = await notificationSettingsApi.getSettings();
      set({ settings, isLoadingSettings: false });
    } catch (err) {
      set({
        error: err.response?.data?.message || "Failed to load settings",
        isLoadingSettings: false,
      });
    }
  },

  saveSetting: async (id, payload) => {
    set({ isSaving: true, error: null });
    try {
      const { settings } = await notificationSettingsApi.updateSetting(
        id,
        payload,
      );
      set({ settings, isSaving: false });
      return true;
    } catch (err) {
      set({
        error: err.response?.data?.message || "Failed to save setting",
        isSaving: false,
      });
      return false;
    }
  },

  setLogFilters: (filters) =>
    set({ logFilters: { ...get().logFilters, ...filters }, logPage: 1 }),

  fetchLog: async (page = get().logPage) => {
    set({ isLoadingLog: true, error: null });
    try {
      const { channel, type, status } = get().logFilters;
      const { logs, total } = await notificationSettingsApi.getLog({
        channel: channel || undefined,
        type: type || undefined,
        status: status || undefined,
        page,
        pageSize: get().logPageSize,
      });
      set({ logs, logTotal: total, logPage: page, isLoadingLog: false });
    } catch (err) {
      set({
        error: err.response?.data?.message || "Failed to load the send log",
        isLoadingLog: false,
      });
    }
  },

  fetchContacts: async () => {
    set({ isLoadingContacts: true, error: null });
    try {
      const { contacts, total } = await notificationSettingsApi.getContacts();
      set({ contacts, contactsTotal: total, isLoadingContacts: false });
    } catch (err) {
      set({
        error:
          err.response?.data?.message ||
          "Failed to load the contacts directory",
        isLoadingContacts: false,
      });
    }
  },
}));
