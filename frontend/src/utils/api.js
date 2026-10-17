import axios from "axios";

export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://api.kingcreativestudio.my.id/elkon/api";

// Media (uploaded images) is served from the same host as the API,
// so derive it by stripping the trailing "/api" segment.
export const MEDIA_BASE_URL =
  import.meta.env.VITE_MEDIA_URL || API_BASE_URL.replace(/\/api\/?$/, "");

export const api = axios.create({
  baseURL: API_BASE_URL,
});

// Request interceptor to attach JWT token to authorization headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("elkon_token");
    if (token) {
      config.configure = config.configure || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Reusable helper to format image URLs from backend
export const getImageUrl = (imagePath) => {
  if (!imagePath) return "";
  return `${MEDIA_BASE_URL}${imagePath}`;
};
