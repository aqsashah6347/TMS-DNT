import { create } from "zustand";

const seedTasks = [
  {
    id: 1,
    title: "Fix login 2FA bug",
    description: "Users report OTP not validating",
    priority: "critical",
    status: "in progress",
    dueDate: "2026-07-04",
    assignedTo: "Aqsa",
    assignedBy: "Admin",
    projectId: 1,
    pinned: true,
    zoomLink: "",
    githubLink: "",
    completedBy: null,
  },
  {
    id: 2,
    title: "Review project proposal",
    description: "",
    priority: "high",
    status: "backlog",
    dueDate: "2026-07-05",
    assignedTo: "Sara",
    assignedBy: "Admin",
    projectId: 2,
    pinned: false,
    zoomLink: "",
    githubLink: "",
    completedBy: null,
  },
  {
    id: 3,
    title: "Update team permissions",
    description: "",
    priority: "medium",
    status: "review",
    dueDate: "2026-07-06",
    assignedTo: "Ali",
    assignedBy: "Admin",
    projectId: 1,
    pinned: false,
    zoomLink: "",
    githubLink: "",
    completedBy: null,
  },
  {
    id: 4,
    title: "Client feedback call",
    description: "",
    priority: "low",
    status: "done",
    dueDate: "2026-07-02",
    assignedTo: "Aqsa",
    assignedBy: "Admin",
    projectId: 1,
    pinned: false,
    zoomLink: "",
    githubLink: "",
    completedBy: "Aqsa",
  },
];

export const useTaskStore = create((set, get) => ({
  tasks: seedTasks,
  view: "list",
  filters: { priority: "", assignedTo: "", search: "" },
  isTaskModalOpen: false,
  isFiltersModalOpen: false,
  editingTask: null,
  modalMode: "view",
  pendingProjectId: null, // set when "Add Task" is clicked from inside a Project modal

  setView: (view) => set({ view }),
  setFilters: (filters) => set({ filters: { ...get().filters, ...filters } }),

  openTaskView: (task) =>
    set({ isTaskModalOpen: true, editingTask: task, modalMode: "view" }),
  openTaskEdit: (task) =>
    set({ isTaskModalOpen: true, editingTask: task, modalMode: "edit" }),
  openCreateModal: () =>
    set({
      isTaskModalOpen: true,
      editingTask: null,
      modalMode: "edit",
      pendingProjectId: null,
    }),

  // Called from the Project detail modal's "Add Task" button
  openCreateModalForProject: (projectId) =>
    set({
      isTaskModalOpen: true,
      editingTask: null,
      modalMode: "edit",
      pendingProjectId: projectId,
    }),

  closeTaskModal: () =>
    set({
      isTaskModalOpen: false,
      editingTask: null,
      modalMode: "view",
      pendingProjectId: null,
    }),

  addTask: (task) =>
    set((state) => ({
      tasks: [...state.tasks, { ...task, id: Date.now(), pinned: false }],
    })),

  updateTask: (id, updates) =>
    set((state) => {
      // If a task is being marked done and no completedBy was set, default to the assignee
      const patched = { ...updates };
      if (patched.status === "done" && !patched.completedBy) {
        const existing = state.tasks.find((t) => t.id === id);
        patched.completedBy = existing?.assignedTo || null;
      }
      return {
        tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...patched } : t)),
        editingTask:
          state.editingTask?.id === id
            ? { ...state.editingTask, ...patched }
            : state.editingTask,
      };
    }),

  deleteTask: (id) =>
    set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) })),

  togglePin: (id) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id ? { ...t, pinned: !t.pinned } : t,
      ),
    })),

  getTasksByProject: (projectId) =>
    get().tasks.filter((t) => t.projectId === projectId),

  getFilteredTasks: () => {
    const { tasks, filters } = get();
    return tasks
      .filter((t) => {
        if (filters.priority && t.priority !== filters.priority) return false;
        if (filters.assignedTo && t.assignedTo !== filters.assignedTo)
          return false;
        if (
          filters.search &&
          !t.title.toLowerCase().includes(filters.search.toLowerCase())
        )
          return false;
        return true;
      })
      .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
  },
}));
