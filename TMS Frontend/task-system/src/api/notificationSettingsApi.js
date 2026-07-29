// TMS Frontend/task-system/src/api/notificationSettingsApi.js
import axiosInstance from "./axiosInstance";

export const notificationSettingsApi = {
  // GET /api/notification-settings -> { settings: [...] }
  getSettings: async () => {
    const res = await axiosInstance.get("/notification-settings");
    return res.data;
  },

  // PUT /api/notification-settings/:id  body: { enabled, subjectTemplate, bodyTemplate }
  // -> { settings: [...] }
  updateSetting: async (id, payload) => {
    const res = await axiosInstance.put(
      `/notification-settings/${id}`,
      payload,
    );
    return res.data;
  },

  // GET /api/notification-settings/log?channel=&type=&status=&page=&pageSize=
  // -> { logs: [...], total, page, pageSize }
  getLog: async (params = {}) => {
    const res = await axiosInstance.get("/notification-settings/log", {
      params,
    });
    return res.data;
  },

  // GET /api/notification-settings/contacts -> { contacts: [...], total }
  getContacts: async () => {
    const res = await axiosInstance.get("/notification-settings/contacts");
    return res.data;
  },
};
