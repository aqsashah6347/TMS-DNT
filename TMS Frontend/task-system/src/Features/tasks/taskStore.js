import { create } from "zustand";
import { taskApi } from "../../api/taskApi";

export const useTaskStore = create((set, get) => ({
  tasks: [],
  isLoading: false,
  error: null,

  view: "kanban",
  filters: { priority: "", assignedTo: "", search: "" },
  isTaskModalOpen: false,
  isFiltersModalOpen: false,
  editingTask: null,
  modalMode: "view",
  pendingProjectId: null,

  setView: (view) => set({ view }),

  setFilters: (patch) => {
    set((state) => ({ filters: { ...state.filters, ...patch } }));
    get().fetchTasks();
  },

  openFiltersModal: () => set({ isFiltersModalOpen: true }),
  closeFiltersModal: () => set({ isFiltersModalOpen: false }),

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

  // Pulls the current filter state and asks the backend to do the
  // filtering (matches getAllTasks' query params on the backend).
  fetchTasks: async () => {
    const { filters } = get();
    set({ isLoading: true, error: null });
    try {
      const tasks = await taskApi.getAllTasks({
        priority: filters.priority || undefined,
        assignedTo: filters.assignedTo || undefined,
        search: filters.search || undefined,
      });
      set({ tasks, isLoading: false });
    } catch (err) {
      set({
        error: err.response?.data?.message || "Couldn't load tasks",
        isLoading: false,
      });
    }
  },

  addTask: async (task) => {
    set({ error: null });
    try {
      await taskApi.createTask({
        ...task,
        assignedTo: task.assignedTo ? Number(task.assignedTo) : null,
        projectId: task.projectId ? Number(task.projectId) : null,
      });
      await get().fetchTasks();
      return true;
    } catch (err) {
      set({ error: err.response?.data?.message || "Couldn't create task" });
      return false;
    }
  },

  updateTask: async (id, updates) => {
    set({ error: null });
    try {
      const patch = { ...updates };
      if (patch.assignedTo !== undefined) {
        patch.assignedTo = patch.assignedTo ? Number(patch.assignedTo) : null;
      }
      if (patch.projectId !== undefined) {
        patch.projectId = patch.projectId ? Number(patch.projectId) : null;
      }

      const updated = await taskApi.updateTask(id, patch);
      await get().fetchTasks();

      // Keep the modal showing fresh data if this was the open task.
      if (get().editingTask?.id === id) {
        set({ editingTask: updated });
      }
      return true;
    } catch (err) {
      set({ error: err.response?.data?.message || "Couldn't update task" });
      return false;
    }
  },

  deleteTask: async (id) => {
    set({ error: null });
    try {
      await taskApi.deleteTask(id);
      await get().fetchTasks();
      return true;
    } catch (err) {
      set({ error: err.response?.data?.message || "Couldn't delete task" });
      return false;
    }
  },

  togglePin: async (id) => {
    const task = get().tasks.find((t) => t.id === id);
    if (!task) return;
    await get().updateTask(id, { pinned: !task.pinned });
  },

  getTasksByProject: (projectId) =>
    get().tasks.filter((t) => t.projectId === projectId),

  // Filtering now happens server-side in fetchTasks — this just returns
  // whatever the store currently has (kept so Tasks.jsx doesn't need to change).
  getFilteredTasks: () => get().tasks,
}));
