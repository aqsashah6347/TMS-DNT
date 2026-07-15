// src/api/teamApi.js
import axiosInstance from "./axiosInstance";

export const teamApi = {
  getAllTeams: async () => {
    const res = await axiosInstance.get("/teams");
    return res.data;
  },

  // The logged-in user's own team context: { team, projects, tasks }.
  // team is null if they haven't been assigned to one yet.
  getMyTeam: async () => {
    const res = await axiosInstance.get("/teams/mine");
    return res.data;
  },

  createTeam: async (team) => {
    const res = await axiosInstance.post("/teams", team);
    return res.data;
  },

  updateTeam: async (id, updates) => {
    const res = await axiosInstance.put(`/teams/${id}`, updates);
    return res.data;
  },

  deleteTeam: async (id) => {
    const res = await axiosInstance.delete(`/teams/${id}`);
    return res.data;
  },
};
