import { create } from "zustand";

// Placeholder seed data — replace with a real fetch (userApi.getAllUsers()) later.
const seedUsers = [
  {
    id: 1,
    name: "Aqsa",
    email: "aqsa@example.com",
    role: "admin",
    status: "active",
  },
  {
    id: 2,
    name: "Sara",
    email: "sara@example.com",
    role: "user",
    status: "active",
  },
  {
    id: 3,
    name: "Ali",
    email: "ali@example.com",
    role: "user",
    status: "inactive",
  },
  {
    id: 4,
    name: "Zara",
    email: "zara@example.com",
    role: "user",
    status: "active",
  },
];

export const useAdminStore = create((set, get) => ({
  users: seedUsers,
  isModalOpen: false,
  editingUser: null,

  openCreateModal: () => set({ isModalOpen: true, editingUser: null }),
  openEditModal: (user) => set({ isModalOpen: true, editingUser: user }),
  closeModal: () => set({ isModalOpen: false, editingUser: null }),

  addUser: (user) =>
    set((state) => ({
      users: [...state.users, { ...user, id: Date.now(), status: "active" }],
    })),

  updateUser: (id, updates) =>
    set((state) => ({
      users: state.users.map((u) => (u.id === id ? { ...u, ...updates } : u)),
    })),

  deleteUser: (id) =>
    set((state) => ({
      users: state.users.filter((u) => u.id !== id),
    })),
}));
