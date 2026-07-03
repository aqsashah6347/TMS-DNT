import { create } from "zustand";

// Placeholder seed data — replace with a real fetch (taskApi.getAllTasks()) once your backend is ready.
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
  },
];

export const useTaskStore = create((set, get) => ({
  tasks: seedTasks,
  view: "list", // 'list' | 'kanban' | 'calendar'
  filters: { priority: "", assignedTo: "", search: "" },
  isTaskModalOpen: false,
  isFiltersModalOpen: false,
  editingTask: null,

  setView: (view) => set({ view }),
  setFilters: (filters) => set({ filters: { ...get().filters, ...filters } }),

  openCreateModal: () => set({ isTaskModalOpen: true, editingTask: null }),
  openEditModal: (task) => set({ isTaskModalOpen: true, editingTask: task }),
  closeTaskModal: () => set({ isTaskModalOpen: false, editingTask: null }),

  openFiltersModal: () => set({ isFiltersModalOpen: true }),
  closeFiltersModal: () => set({ isFiltersModalOpen: false }),

  addTask: (task) =>
    set((state) => ({
      tasks: [...state.tasks, { ...task, id: Date.now() }],
    })),

  updateTask: (id, updates) =>
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    })),

  deleteTask: (id) =>
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id),
    })),

  getFilteredTasks: () => {
    const { tasks, filters } = get();
    return tasks.filter((t) => {
      if (filters.priority && t.priority !== filters.priority) return false;
      if (filters.assignedTo && t.assignedTo !== filters.assignedTo)
        return false;
      if (
        filters.search &&
        !t.title.toLowerCase().includes(filters.search.toLowerCase())
      )
        return false;
      return true;
    });
  },
}));
