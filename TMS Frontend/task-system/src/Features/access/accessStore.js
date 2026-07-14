import { create } from "zustand";
import { accessApi } from "../../api/accessApi";
import { usersApi } from "../../api/usersApi";

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
  // account yet.
  selectedEmployee: null,
  selectEmployee: (employee) => set({ selectedEmployee: employee }),

  isAssigning: false,

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

  // This is the actual "assign a role" entry point for someone who
  // hasn't logged into TMS yet — creates (or links) their tms_users row
  // right from the Access page, no backend/DB editing needed.
  assignRoleToRosterEmployee: async (employee, role) => {
    set({ isAssigning: true, error: null });
    try {
      const user = await usersApi.createFromRoster({
        name: employee.name,
        employeeCode: employee.employeeCode,
        role,
      });

      set({
        selectedEmployee: {
          userId: user.id,
          employeeCode: employee.employeeCode,
          name: user.name,
          role: user.role,
        },
        isAssigning: false,
      });

      await get().fetchAll();
      return true;
    } catch (err) {
      set({
        isAssigning: false,
        error: err.response?.data?.message || "Couldn't assign role",
      });
      return false;
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