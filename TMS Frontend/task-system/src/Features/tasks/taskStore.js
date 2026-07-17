import { create } from "zustand";
import { taskApi } from "../../api/taskApi";
import { useUIStore } from "../../store/useUIStore";

export const useTaskStore = create((set, get) => ({
  tasks: [],
  isLoading: false,
  error: null,

  completedLog: [],
  isCompletedLogLoading: false,

  view: "list",
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

  // Plain-text completed log — feeds the CompletedLogPanel drawer.
  fetchCompletedLog: async () => {
    set({ isCompletedLogLoading: true });
    try {
      const completedLog = await taskApi.getCompletedLog();
      set({ completedLog, isCompletedLogLoading: false });
    } catch (err) {
      set({ isCompletedLogLoading: false });
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

      if (get().editingTask?.id === id) {
        set({ editingTask: updated });
      }

      // Centralized completion trigger — fires for BOTH the "Mark
      // Complete" button (TaskModal's completeTask) and dragging a card
      // into the Done column in Kanban, since both paths funnel through
      // this single updateTask function with { status: "done" } in the
      // patch. Refreshes the log panel too, so it's up to date if open.
      if (patch.status === "done") {
        useUIStore.getState().fireConfetti();
        get().fetchCompletedLog();
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

  completeTask: async (id) => get().updateTask(id, { status: "done" }),

  getTasksByProject: (projectId) =>
    get().tasks.filter((t) => t.projectId === projectId),

  // Excludes completed tasks so they drop off the main List/Calendar
  // views once marked done — their record lives in completedLog instead.
  // Kanban still gets the full unfiltered set (see Tasks.jsx) since its
  // Done column is the intended place to see them mid-board.
  getFilteredTasks: () => get().tasks.filter((t) => t.status !== "done"),
}));
