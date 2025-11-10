import axios from "axios";

// ✅ Create axios instance
const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "https://smatlearnedubackend4.onrender.com/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// ✅ Helper to set or remove auth token
export function setAuthToken(token) {
  if (token) {
    API.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    localStorage.setItem("token", token);
  } else {
    delete API.defaults.headers.common["Authorization"];
    localStorage.removeItem("token");
  }
}

// ✅ Automatically attach token from localStorage on each request
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Handle global 401 responses gracefully
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn("⚠️ Unauthorized — clearing token and redirecting to login");
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // Optional redirect (uncomment if desired)
      // window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default API;
