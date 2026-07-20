// src/Features/teams/teamStore.js
import { create } from "zustand";
import { teamApi } from "../../api/teamApi";

export const useTeamStore = create((set, get) => ({
  // Admin/manager collection view.
  teams: [],
  isLoading: false,
  error: null,

  // "My Team" view (user role).
  myTeam: null,
  myTeamProjects: [],
  myTeamTasks: [],
  isMyTeamLoading: false,
  myTeamError: null,

  isModalOpen: false,
  editingTeam: null,
  modalMode: "view",

  // Client-side search + filters over the already-fetched `teams` list —
  // same pattern the header's global search already uses for teams/projects
  // (see components/layout/header.jsx), since getAllTeams has no server-side
  // filtering.
  filters: { search: "", managerId: "" },
  isFiltersModalOpen: false,

  setFilters: (patch) =>
    set((state) => ({ filters: { ...state.filters, ...patch } })),
  clearFilters: () => set({ filters: { search: "", managerId: "" } }),

  openFiltersModal: () => set({ isFiltersModalOpen: true }),
  closeFiltersModal: () => set({ isFiltersModalOpen: false }),

  getFilteredTeams: () => {
    const { teams, filters } = get();
    const q = filters.search.trim().toLowerCase();
    return teams.filter((t) => {
      const matchesSearch =
        !q ||
        t.name?.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        t.managerName?.toLowerCase().includes(q);
      const matchesManager =
        !filters.managerId ||
        String(t.managerId) === String(filters.managerId);
      return matchesSearch && matchesManager;
    });
  },

  openCreateModal: () =>
    set({ isModalOpen: true, editingTeam: null, modalMode: "edit" }),
  openEditModal: (team) =>
    set({ isModalOpen: true, editingTeam: team, modalMode: "edit" }),
  // NEW — mirrors projectStore's openProjectView: opens the modal in a
  // read-only view instead of straight into the edit form.
  openTeamView: (team) =>
    set({ isModalOpen: true, editingTeam: team, modalMode: "view" }),
  closeModal: () =>
    set({ isModalOpen: false, editingTeam: null, modalMode: "view" }),

  // Call this from Teams.jsx on mount for admin/manager roles.
  fetchTeams: async () => {
    set({ isLoading: true, error: null });
    try {
      const teams = await teamApi.getAllTeams();
      set({ teams, isLoading: false });
    } catch (err) {
      set({
        isLoading: false,
        error: err.response?.data?.message || "Couldn't load teams",
      });
    }
  },

  // Call this from Teams.jsx on mount for the user role.
  fetchMyTeam: async () => {
    set({ isMyTeamLoading: true, myTeamError: null });
    try {
      const { team, projects, tasks } = await teamApi.getMyTeam();
      set({
        myTeam: team,
        myTeamProjects: projects || [],
        myTeamTasks: tasks || [],
        isMyTeamLoading: false,
      });
    } catch (err) {
      set({
        isMyTeamLoading: false,
        myTeamError: err.response?.data?.message || "Couldn't load your team",
      });
    }
  },

  addTeam: async (team) => {
    set({ error: null });
    try {
      await teamApi.createTeam(team);
      await get().fetchTeams();
      return true;
    } catch (err) {
      set({ error: err.response?.data?.message || "Couldn't create team" });
      return false;
    }
  },

  updateTeam: async (id, updates) => {
    set({ error: null });
    try {
      await teamApi.updateTeam(id, updates);
      await get().fetchTeams();
      return true;
    } catch (err) {
      set({ error: err.response?.data?.message || "Couldn't update team" });
      return false;
    }
  },

  deleteTeam: async (id) => {
    set({ error: null });
    try {
      await teamApi.deleteTeam(id);
      await get().fetchTeams();
      return true;
    } catch (err) {
      set({ error: err.response?.data?.message || "Couldn't delete team" });
      return false;
    }
  },
}));