import axiosInstance from "./axiosInstance";

export const projectApi = {
  getAllProjects: async () => {
    const res = await axiosInstance.get("/projects");
    return res.data;
  },

  getProjectById: async (id) => {
    const res = await axiosInstance.get(`/projects/${id}`);
    return res.data;
  },

  createProject: async (project) => {
    const res = await axiosInstance.post("/projects", project);
    return res.data;
  },

  updateProject: async (id, updates) => {
    const res = await axiosInstance.put(`/projects/${id}`, updates);
    return res.data;
  },

  deleteProject: async (id) => {
    const res = await axiosInstance.delete(`/projects/${id}`);
    return res.data;
  },
};
