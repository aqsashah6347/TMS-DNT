import axiosInstance from "./axiosInstance";

export const taskApi = {
<<<<<<< HEAD
getAllTasks: async (filters = {}, page = 1, pageSize = 25) => {
=======
  getAllTasks: async (filters = {}, page = 1, pageSize = 25) => {
>>>>>>> 2d756372ed8b89d5a594bec420b9388e7b28e8cc
    const res = await axiosInstance.get("/tasks", {
      params: { ...filters, page, pageSize },
    });
    const data = res.data;
    // Tolerates the backend returning either the old shape (a plain
    // array) or the new paginated shape, so a mismatch here can never
    // leave `tasks` as undefined for the rest of the app.
    if (Array.isArray(data)) {
<<<<<<< HEAD
      return { tasks: data, page: 1, pageSize: data.length, total: data.length };
=======
      return {
        tasks: data,
        page: 1,
        pageSize: data.length,
        total: data.length,
      };
>>>>>>> 2d756372ed8b89d5a594bec420b9388e7b28e8cc
    }
    return {
      tasks: data.tasks ?? [],
      page: data.page ?? 1,
      pageSize: data.pageSize ?? pageSize,
      total: data.total ?? (data.tasks ? data.tasks.length : 0),
    };
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
    // Hard delete — row is fully removed from tms_tasks
    const res = await axiosInstance.delete(`/tasks/${id}`);
    return res.data;
  },
  getCompletedLog: async () => {
    const res = await axiosInstance.get("/tasks/completed-log");
    return res.data;
  },
<<<<<<< HEAD
=======
  getProgressHistory: async (id) => {
    const res = await axiosInstance.get(`/tasks/${id}/progress-history`);
    return res.data;
  },
>>>>>>> 2d756372ed8b89d5a594bec420b9388e7b28e8cc
  getCompletionStats: async (range = "7d") => {
    const res = await axiosInstance.get("/tasks/stats/completion", {
      params: { range },
    });
    return res.data;
  },
};
