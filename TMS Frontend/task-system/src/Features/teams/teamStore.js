import { create } from "zustand";

// Placeholder seed data — replace with teamApi.getAllTeams() later.
const seedTeams = [
  {
    id: 1,
    name: "Frontend Squad",
    members: ["Aqsa", "Sara"],
    createdBy: "Admin",
  },
  {
    id: 2,
    name: "Design Team",
    members: ["Ali", "Zara", "Hina"],
    createdBy: "Admin",
  },
];

export const useTeamStore = create((set, get) => ({
  teams: seedTeams,
  isModalOpen: false,
  editingTeam: null,

  openCreateModal: () => set({ isModalOpen: true, editingTeam: null }),
  openEditModal: (team) => set({ isModalOpen: true, editingTeam: team }),
  closeModal: () => set({ isModalOpen: false, editingTeam: null }),

  addTeam: (team) =>
    set((state) => ({
      teams: [...state.teams, { ...team, id: Date.now() }],
    })),

  updateTeam: (id, updates) =>
    set((state) => ({
      teams: state.teams.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    })),

  deleteTeam: (id) =>
    set((state) => ({
      teams: state.teams.filter((t) => t.id !== id),
    })),
}));
