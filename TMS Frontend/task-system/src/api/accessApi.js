import axiosInstance from "./axiosInstance";

export const accessApi = {
  // GET /api/permissions
  // -> { modules, actions, permissions: [{ userId, userName, role, overrides }] }
  getAll: async () => {
    const res = await axiosInstance.get("/permissions");
    return res.data;
  },

  // GET /api/permissions/audit-log
  // -> [{ id, actor, action, time }]
  getAuditLog: async () => {
    const res = await axiosInstance.get("/permissions/audit-log");
    return res.data;
  },

  // PUT /api/permissions/:userId  body: { module, action }
  // -> { userId, module, actions }  (the module's full updated action list)
  toggleAction: async (userId, module, action) => {
    const res = await axiosInstance.put(`/permissions/${userId}`, {
      module,
      action,
    });
    return res.data;
  },

  // PUT /api/permissions/:userId/role  body: { role }
  // -> { id, name, role }
  setRole: async (userId, role) => {
    const res = await axiosInstance.put(`/permissions/${userId}/role`, {
      role,
    });
    return res.data;
  },
};