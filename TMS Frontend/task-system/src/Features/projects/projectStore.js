import { create } from "zustand";

// Placeholder seed data — replace with projectApi.getAllProjects() later.
const seedProjects = [
  {
    id: 1,
    name: "DreamsPortal CRM",
    description: "Full-stack CRM for lead management",
    teamId: 1,
    teamName: "Frontend Squad",
    members: ["Aqsa", "Sara"],
    status: "active",
    progress: 65,
  },
  {
    id: 2,
    name: "Mobile App Revamp",
    description: "UI refresh for the mobile client",
    teamId: 2,
    teamName: "Design Team",
    members: ["Ali", "Zara"],
    status: "planning",
    progress: 15,
  },
  {
    id: 3,
    name: "Internal Analytics Tool",
    description: "",
    teamId: 1,
    teamName: "Frontend Squad",
    members: ["Aqsa"],
    status: "completed",
    progress: 100,
  },
];

export const useProjectStore = create((set, get) => ({
  projects: seedProjects,
  isModalOpen: false,
  editingProject: null,
  modalMode: "view",

  openCreateModal: () =>
    set({ isModalOpen: true, editingProject: {}, modalMode: "edit" }),
  openEditModal: (project) =>
    set({ isModalOpen: true, editingProject: project, modalMode: "edit" }),
  openProjectView: (project) =>
    set({ isModalOpen: true, editingProject: project, modalMode: "view" }),
  closeModal: () =>
    set({ isModalOpen: false, editingProject: null, modalMode: "view" }),

  addProject: (project) =>
    set((state) => ({
      projects: [
        ...state.projects,
        { ...project, id: Date.now(), progress: 0 },
      ],
    })),

  updateProject: (id, updates) =>
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === id ? { ...p, ...updates } : p,
      ),
    })),

  deleteProject: (id) =>
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
    })),
}));
