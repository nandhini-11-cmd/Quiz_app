import axios from "axios";

// ✅ Use environment variable for flexible base URL
const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL + "/api",
});

// ✅ Automatically attach token if it exists
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default API;
