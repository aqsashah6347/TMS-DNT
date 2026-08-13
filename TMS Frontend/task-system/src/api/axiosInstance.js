import axios from "axios";

// Change this to match your Node backend's actual port once it's running.
// (Your DreamsPortal CRM backend runs on its own port — this TMS needs a separate one.)
const API_BASE_URL = "http://localhost:5000/api";

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Attach the auth token automatically to every request. The token can be
// in localStorage (user checked "Keep me logged in") or sessionStorage
// (they didn't), so check both.
axiosInstance.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("tms_token") || sessionStorage.getItem("tms_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Global error handling — if the token expires/is invalid, log the user out automatically.
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("tms_token");
      sessionStorage.removeItem("tms_token");
      localStorage.removeItem("tms_remember_me");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export default axiosInstance;
