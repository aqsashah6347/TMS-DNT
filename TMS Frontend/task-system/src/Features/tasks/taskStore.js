import { create } from "zustand";
import { taskApi } from "../../api/taskApi";
import { useUIStore } from "../../store/useUIStore";

export const useTaskStore = create((set, get) => ({
  tasks: [],
  page: 1,
  pageSize: 25,
  total: 0,
  isLoading: false,
  error: null,

  // Complete, unpaginated set of every task matching the current filters
  // (all statuses, every page at once) — used by Kanban and Calendar,
  // which both need the full board rather than whatever "Load more" has
  // paged into `tasks` so far.
  allTasksFull: [],
  isLoadingAll: false,

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

  fetchTasks: async (page = 1) => {
    const { filters, pageSize } = get();
    set({ isLoading: true, error: null });
    try {
      const { tasks, total } = await taskApi.getAllTasks(
        {
          priority: filters.priority || undefined,
          assignedTo: filters.assignedTo || undefined,
          search: filters.search || undefined,
          // Done tasks never show on the List page, so they shouldn't
          // count toward its pagination total either — otherwise "Load
          // more (X of Y)" and the page count include tasks that are
          // filtered out client-side and never actually appear.
          excludeCompleted: true,
        },
        page,
        pageSize,
      );
      set({ tasks, total, page, isLoading: false });
    } catch (err) {
      set({
        error: err.response?.data?.message || "Couldn't load tasks",
        isLoading: false,
      });
    }
    // Kanban/Calendar need every task regardless of List pagination —
    // keep that set in sync whenever the main list refreshes.
    get().fetchAllTasksFull();
  },

  // Fetches the complete, unpaginated task set (all statuses) for views
  // that can't rely on "Load more" — Kanban's Done column and the
  // Calendar both need to see tasks beyond whatever page the List view
  // has loaded so far.
  fetchAllTasksFull: async () => {
    const { filters } = get();
    set({ isLoadingAll: true });
    try {
      const { tasks } = await taskApi.getAllTasks(
        {
          priority: filters.priority || undefined,
          assignedTo: filters.assignedTo || undefined,
          search: filters.search || undefined,
          all: true,
        },
        1,
        get().pageSize,
      );
      set({ allTasksFull: tasks, isLoadingAll: false });
    } catch (err) {
      set({ isLoadingAll: false });
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
  loadMoreTasks: async () => {
    const { page, pageSize, total, tasks, isLoading } = get();
    if (isLoading || tasks.length >= total) return; // nothing more to load

    set({ isLoading: true });
    try {
      const { filters } = get();
      const nextPage = page + 1;
      const { tasks: nextTasks, total: newTotal } = await taskApi.getAllTasks(
        {
          priority: filters.priority || undefined,
          assignedTo: filters.assignedTo || undefined,
          search: filters.search || undefined,
          excludeCompleted: true,
        },
        nextPage,
        pageSize,
      );
      set({
        tasks: [...tasks, ...nextTasks],
        page: nextPage,
        total: newTotal,
        isLoading: false,
      });
    } catch (err) {
      set({ isLoading: false });
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

      if (patch.status === "done") {
        useUIStore.getState().fireConfetti(updated?.dueDate ?? null);
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

  // was: completeTask: async (id) => get().updateTask(id, { status: "done" }),
  completeTask: async (id, extra = {}) =>
    get().updateTask(id, { status: "done", ...extra }),

  // Reverts an accidentally-completed task back to whatever status it had
  // right before it was marked done (stashed server-side as
  // previous_status). Falls back to "in progress" for older completions
  // that predate that column. Always re-syncs the log afterwards since
  // updateTask only auto-refetches it on the done -> * transition, not *
  // -> not-done.
  undoCompletedTask: async (id, fallbackStatus = "in progress") => {
    const entry = get().completedLog.find((t) => t.id === id);
    const restoreStatus = entry?.previousStatus || fallbackStatus;
    const ok = await get().updateTask(id, { status: restoreStatus });
    if (ok) {
      await get().fetchCompletedLog();
      await get().fetchTasks();
    }
    return ok;
  },

  getTasksByProject: (projectId) =>
    get().tasks.filter((t) => t.projectId === projectId),

  // Excludes completed tasks so they drop off the main List view once
  // marked done — their record lives in completedLog instead. Backed by
  // the paginated `tasks` array (fetched with excludeCompleted already,
  // this filter is just a safety net for any locally-stale status).
  getFilteredTasks: () => get().tasks.filter((t) => t.status !== "done"),

  // Same "hide done" rule, but sourced from allTasksFull instead of the
  // paginated `tasks` array — this is what Calendar should use, since it
  // needs every non-done task, not just whatever "Load more" has fetched.
  getFilteredAllTasks: () =>
    get().allTasksFull.filter((t) => t.status !== "done"),
}));
