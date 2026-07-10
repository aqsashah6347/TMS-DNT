import axiosInstance from "./axiosInstance";

export const accessApi = {
  getAll: async () => {
    const res = await axiosInstance.get("/permissions");
    return res.data;
  },

  toggleAction: async (userId, module, action) => {
    const res = await axiosInstance.put(`/permissions/${userId}`, {
      module,
      action,
    });
    return res.data;
  },

  setRolePreset: async (userId, role) => {
    const res = await axiosInstance.put(`/permissions/${userId}/role`, {
      role,
    });
    return res.data;
  },

  getAuditLog: async () => {
    const res = await axiosInstance.get("/permissions/audit-log");
    return res.data;
  },
};
