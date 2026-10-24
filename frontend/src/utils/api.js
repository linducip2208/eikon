import axios from "axios";

// Alamat API selalu relatif satu domain ("/api") supaya satu hasil build
// bisa dipakai di semua environment tanpa hardcode domain production.
// - `npm run dev` (Vite)  -> VITE_API_URL dari frontend/.env.development
// - `eikon.test` (Apache) -> "/api" diproxy ke http://127.0.0.1:5000/api
// - production satu domain -> "/api" ikut domain aktif (tanpa domain eksternal)
// Override manual tetap bisa lewat VITE_API_URL / VITE_MEDIA_URL.
const resolveApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  return "/api";
};

export const API_BASE_URL = resolveApiBaseUrl();

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
