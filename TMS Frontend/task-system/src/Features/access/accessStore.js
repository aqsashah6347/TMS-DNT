import { create } from "zustand";

// Placeholder — later from permissionApi.getAll()
const modules = ["tasks", "projects", "teams", "admin", "analytics"];
const actions = ["view", "create", "edit", "delete", "assign"];

const seedPermissions = [
  {
    userId: 2,
    userName: "Sara",
    role: "manager",
    overrides: {
      tasks: ["view", "create", "edit"],
      projects: ["view", "edit"],
    },
  },
  {
    userId: 3,
    userName: "Ali",
    role: "user",
    overrides: { tasks: ["view", "edit"] },
  },
];

const seedAuditLog = [
  {
    id: 1,
    actor: "Aqsa",
    action: "Changed Sara's role to Manager",
    time: "2h ago",
  },
  {
    id: 2,
    actor: "Aqsa",
    action: "Granted Ali edit access on Tasks",
    time: "1d ago",
  },
];

export const useAccessStore = create((set, get) => ({
  modules,
  actions,
  permissions: seedPermissions,
  auditLog: seedAuditLog,

  toggleAction: (userId, module, action) =>
    set((state) => ({
      permissions: state.permissions.map((p) => {
        if (p.userId !== userId) return p;
        const current = p.overrides[module] || [];
        const updated = current.includes(action)
          ? current.filter((a) => a !== action)
          : [...current, action];
        return { ...p, overrides: { ...p.overrides, [module]: updated } };
      }),
      auditLog: [
        {
          id: Date.now(),
          actor: "Aqsa",
          action: `Toggled '${action}' on '${module}' for user #${userId}`,
          time: "just now",
        },
        ...state.auditLog,
      ],
    })),

  setRolePreset: (userId, role) =>
    set((state) => ({
      permissions: state.permissions.map((p) =>
        p.userId === userId ? { ...p, role } : p,
      ),
      auditLog: [
        {
          id: Date.now(),
          actor: "Aqsa",
          action: `Set role preset '${role}' for user #${userId}`,
          time: "just now",
        },
        ...state.auditLog,
      ],
    })),
}));
