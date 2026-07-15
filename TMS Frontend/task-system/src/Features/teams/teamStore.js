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

  openCreateModal: () => set({ isModalOpen: true, editingTeam: null }),
  openEditModal: (team) => set({ isModalOpen: true, editingTeam: team }),
  closeModal: () => set({ isModalOpen: false, editingTeam: null }),

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
