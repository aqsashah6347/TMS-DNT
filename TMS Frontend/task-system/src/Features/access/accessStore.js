import { create } from "zustand";
import { accessApi } from "../../api/accessApi";

// Real data comes from GET /api/permissions and /api/permissions/audit-log.
//   permissions: [{ userId, userName, role, overrides: { module: [actions] } }]
//   auditLog: [{ id, actor, action, time }]
export const useAccessStore = create((set, get) => ({
  modules: ["tasks", "projects", "teams", "admin", "analytics"],
  actions: ["view", "create", "edit", "delete", "assign"],
  permissions: [],
  auditLog: [],
  isLoading: false,
  error: null,

  // The roster employee currently open in the panel — { userId, employeeCode,
  // name, role }. userId is null when this employee has no tms_users login
  // account yet; the panel handles that case instead of the list blocking it.
  selectedEmployee: null,
  selectEmployee: (employee) => set({ selectedEmployee: employee }),

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
      set((state) => ({
        permissions: state.permissions.map((p) =>
          p.userId === userId
            ? { ...p, overrides: { ...p.overrides, [module]: actions } }
            : p,
        ),
      }));
      get().refreshAuditLog();
    } catch (err) {
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
      // Keep the panel's role badge in sync if this is the open employee.
      const selected = get().selectedEmployee;
      if (selected?.userId === userId) {
        set({ selectedEmployee: { ...selected, role } });
      }
    } catch (err) {
      set({
        permissions: previous,
        error: err.response?.data?.message || "Couldn't update role",
      });
    }
  },
}));
