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

  // Draft edit state for the panel currently open. Checkbox toggles and
  // role picks only touch these — nothing hits the network — until
  // "Save changes" is clicked. Kept in the store (not component state)
  // so saving can also clear selectedEmployee to close the panel.
  draftOverrides: null, // { module: [actions] } | null
  draftRole: null, // string | null — only set once changed from the committed role
  isSaving: false,
  lastSaveSummary: null, // { userName, changes: [string, ...] } shown after a save

  selectEmployee: (employee) => {
    const perm = employee?.userId
      ? get().permissions.find((p) => p.userId === employee.userId)
      : null;
    set({
      selectedEmployee: employee,
      draftOverrides: perm ? JSON.parse(JSON.stringify(perm.overrides)) : null,
      draftRole: null,
      lastSaveSummary: null,
    });
  },

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

      await get().fetchAll();
      get().selectEmployee({
        userId: user.id,
        employeeCode: employee.employeeCode,
        name: user.name,
        role: user.role,
      });
      set({ isAssigning: false });
      return true;
    } catch (err) {
      set({
        isAssigning: false,
        error: err.response?.data?.message || "Couldn't assign role",
      });
      return false;
    }
  },

  // ---- Staged edits (local only — no network call) ----

  stageToggleAction: (module, action) => {
    set((state) => {
      if (!state.draftOverrides) return {};
      const current = state.draftOverrides[module] || [];
      const updated = current.includes(action)
        ? current.filter((a) => a !== action)
        : [...current, action];
      return {
        draftOverrides: { ...state.draftOverrides, [module]: updated },
      };
    });
  },

  stageRolePreset: (role) => set({ draftRole: role }),

  // Reverts every staged edit back to what's currently saved.
  discardChanges: () => {
    const { selectedEmployee, permissions } = get();
    const perm = selectedEmployee?.userId
      ? permissions.find((p) => p.userId === selectedEmployee.userId)
      : null;
    set({
      draftOverrides: perm ? JSON.parse(JSON.stringify(perm.overrides)) : null,
      draftRole: null,
    });
  },

  // Sends the role change (if any) and every module's full action list in
  // one request, then closes the panel and leaves a summary of what
  // changed for the empty-state view to show.
  saveChanges: async () => {
    const { selectedEmployee, permissions, draftOverrides, draftRole } = get();
    const userId = selectedEmployee?.userId;
    if (!userId) return false;
    const perm = permissions.find((p) => p.userId === userId);
    if (!perm) return false;

    set({ isSaving: true, error: null });
    try {
      const { changes } = await accessApi.batchUpdate(userId, {
        role: draftRole && draftRole !== perm.role ? draftRole : undefined,
        overrides: draftOverrides,
      });

      await get().fetchAll();
      get().refreshAuditLog();

      set({
        isSaving: false,
        selectedEmployee: null, // closes the panel back to the empty state
        draftOverrides: null,
        draftRole: null,
        lastSaveSummary: {
          userName: perm.userName,
          changes: changes?.length ? changes : ["No changes were made"],
        },
      });
      return true;
    } catch (err) {
      set({
        isSaving: false,
        error: err.response?.data?.message || "Couldn't save changes",
      });
      return false;
    }
  },

  clearSaveSummary: () => set({ lastSaveSummary: null }),
}));