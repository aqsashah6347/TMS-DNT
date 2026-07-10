import axiosInstance from "./axiosInstance";

export const taskApi = {
  getAllTasks: async (filters = {}) => {
    const res = await axiosInstance.get("/tasks", { params: filters });
    return res.data;
  },

  getTaskById: async (id) => {
    const res = await axiosInstance.get(`/tasks/${id}`);
    return res.data;
  },

  createTask: async (task) => {
    const res = await axiosInstance.post("/tasks", task);
    return res.data;
  },

  updateTask: async (id, updates) => {
    const res = await axiosInstance.put(`/tasks/${id}`, updates);
    return res.data;
  },

  deleteTask: async (id) => {
    // Soft delete, per your spec — backend should set a deletedAt flag, not actually remove the row
    const res = await axiosInstance.delete(`/tasks/${id}`);
    return res.data;
  },

  getCompletionStats: async (range = "7d") => {
    const res = await axiosInstance.get("/tasks/stats/completion", {
      params: { range },
    });
    return res.data;
  },
};
