import axiosInstance from "./axiosInstance";

export const teamApi = {
  getAllTeams: async () => {
    const res = await axiosInstance.get("/teams");
    return res.data;
  },
};
