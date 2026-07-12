import { create } from "zustand";
import { accessApi } from "../../api/accessApi";

// Real data now comes from GET /api/permissions and /api/permissions/audit-log.
// Shape is unchanged from the old mock data, so PermissionTable.jsx,
// RolePresets.jsx, and AuditLog.jsx don't need to change at all:
//   permissions: [{ userId, userName, role, overrides: { module: [actions] } }]
//   auditLog: [{ id, actor, action, time }]
export const useAccessStore = create((set, get) => ({
  modules: ["tasks", "projects", "teams", "admin", "analytics"],
  actions: ["view", "create", "edit", "delete", "assign"],
  permissions: [],
  auditLog: [],
  isLoading: false,
  error: null,

  // Call this from Access.jsx on mount.
  fetchAll: async () => {
    set({ isLoading: true, error: null });
    try {
      const [permsData, auditLog] = await Promise.all([
        accessApi.getAll(),
        accessApi.getAuditLog(),
      ]);
      set({
        modules: permsData.modules,
        actions: permsData.actions,
        permissions: permsData.permissions,
        auditLog,
        isLoading: false,
      });
    } catch (err) {
      set({
        isLoading: false,
        error: err.response?.data?.message || "Couldn't load permissions",
      });
    }
  },

  refreshAuditLog: async () => {
    try {
      const auditLog = await accessApi.getAuditLog();
      set({ auditLog });
    } catch {
      // Non-critical — the toggle/role change already succeeded, so
      // just leave the audit log stale rather than surfacing an error.
    }
  },

  toggleAction: async (userId, module, action) => {
    // Optimistic update so the checkbox feels instant.
    const previous = get().permissions;
    set({
      permissions: previous.map((p) => {
        if (p.userId !== userId) return p;
        const current = p.overrides[module] || [];
        const updated = current.includes(action)
          ? current.filter((a) => a !== action)
          : [...current, action];
        return { ...p, overrides: { ...p.overrides, [module]: updated } };
      }),
    });

    try {
      const { actions } = await accessApi.toggleAction(userId, module, action);
      // Reconcile with the server's authoritative action list for that module.
      set((state) => ({
        permissions: state.permissions.map((p) =>
          p.userId === userId
            ? { ...p, overrides: { ...p.overrides, [module]: actions } }
            : p,
        ),
      }));
      get().refreshAuditLog();
    } catch (err) {
      // Revert on failure.
      set({
        permissions: previous,
        error: err.response?.data?.message || "Couldn't update permission",
      });
    }
  },

  setRolePreset: async (userId, role) => {
    const previous = get().permissions;
    set({
      permissions: previous.map((p) =>
        p.userId === userId ? { ...p, role } : p,
      ),
    });

    try {
      await accessApi.setRole(userId, role);
      get().refreshAuditLog();
    } catch (err) {
      set({
        permissions: previous,
        error: err.response?.data?.message || "Couldn't update role",
      });
    }
  },
}));