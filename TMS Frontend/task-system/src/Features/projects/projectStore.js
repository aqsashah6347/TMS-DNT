import { create } from "zustand";
import { projectApi } from "../../api/projectApi";

export const useProjectStore = create((set, get) => ({
  projects: [],
  isLoading: false,
  error: null,

  completedLog: [],
  isCompletedLogLoading: false,

  isModalOpen: false,
  editingProject: null,
  modalMode: "view",

  // Client-side search + filters over the already-fetched `projects` list —
  // mirrors teamStore's approach, and the header's global search which
  // already filters projects this same way.
  filters: { search: "", status: "", teamId: "" },
  isFiltersModalOpen: false,

  setFilters: (patch) =>
    set((state) => ({ filters: { ...state.filters, ...patch } })),
  clearFilters: () => set({ filters: { search: "", status: "", teamId: "" } }),

  openFiltersModal: () => set({ isFiltersModalOpen: true }),
  closeFiltersModal: () => set({ isFiltersModalOpen: false }),

  getFilteredProjects: () => {
    const { projects, filters } = get();
    const q = filters.search.trim().toLowerCase();
    return projects.filter((p) => {
      const matchesSearch =
        !q ||
        p.name?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q);
      const matchesStatus = !filters.status || p.status === filters.status;
      const matchesTeam =
        !filters.teamId || String(p.teamId) === String(filters.teamId);
      return matchesSearch && matchesStatus && matchesTeam;
    });
  },

  openCreateModal: () =>
    set({ isModalOpen: true, editingProject: {}, modalMode: "edit" }),
  openEditModal: (project) =>
    set({ isModalOpen: true, editingProject: project, modalMode: "edit" }),
  openProjectView: (project) =>
    set({ isModalOpen: true, editingProject: project, modalMode: "view" }),
  closeModal: () =>
    set({ isModalOpen: false, editingProject: null, modalMode: "view" }),

  // Call this from Projects.jsx on mount.
  fetchProjects: async () => {
    set({ isLoading: true, error: null });
    try {
      const projects = await projectApi.getAllProjects();
      set({ projects, isLoading: false });
    } catch (err) {
      set({
        isLoading: false,
        error: err.response?.data?.message || "Couldn't load projects",
      });
    }
  },

  // Plain-text completed log — feeds the CompletedProjectsLogPanel drawer.
  fetchCompletedLog: async () => {
    set({ isCompletedLogLoading: true });
    try {
      const completedLog = await projectApi.getCompletedLog();
      set({ completedLog, isCompletedLogLoading: false });
    } catch (err) {
      set({ isCompletedLogLoading: false });
    }
  },

  addProject: async (project) => {
    set({ error: null });
    try {
      await projectApi.createProject(project);
      await get().fetchProjects();
      return true;
    } catch (err) {
      set({ error: err.response?.data?.message || "Couldn't create project" });
      return false;
    }
  },

  updateProject: async (id, updates) => {
    set({ error: null });
    try {
      const updated = await projectApi.updateProject(id, updates);
      await get().fetchProjects();
      if (get().editingProject?.id === id) {
        set({ editingProject: updated });
      }

      if (updates.status === "completed") {
        get().fetchCompletedLog();
      }

      return true;
    } catch (err) {
      set({ error: err.response?.data?.message || "Couldn't update project" });
      return false;
    }
  },

  completeProject: async (id) =>
    get().updateProject(id, { status: "completed" }),

  // Reverts an accidentally-completed project back to whatever status it
  // had right before it was marked completed (stashed server-side as
  // previous_status). Falls back to "active" for older completions that
  // predate that column. Always re-syncs the log afterwards since
  // updateProject only auto-refetches it on the *->completed transition,
  // not completed->*.
  undoCompletedProject: async (id, fallbackStatus = "active") => {
    const entry = get().completedLog.find((p) => p.id === id);
    const restoreStatus = entry?.previousStatus || fallbackStatus;
    const ok = await get().updateProject(id, { status: restoreStatus });
    if (ok) {
      await get().fetchCompletedLog();
      await get().fetchProjects();
    }
    return ok;
  },

  deleteProject: async (id) => {
    set({ error: null });
    try {
      await projectApi.deleteProject(id);
      await get().fetchProjects();
      return true;
    } catch (err) {
      set({ error: err.response?.data?.message || "Couldn't delete project" });
      return false;
    }
  },
}));
