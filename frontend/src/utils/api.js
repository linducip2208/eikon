import axios from "axios";

// Alamat API ditentukan saat RUNTIME supaya satu hasil build bisa dipakai di
// semua environment (lokal maupun production) — lihat README bagian Deploy.
//
// Prioritas:
// 1. VITE_API_URL — override manual (dipakai `npm run dev` via frontend/.env)
// 2. Hostname lokal (eikon.test / localhost / 127.0.0.1) -> "/api" (diproxy Apache lokal)
// 3. Hostname lain (production) -> API production
const LOCAL_HOSTNAMES = ["eikon.test", "localhost", "127.0.0.1"];
const PRODUCTION_API_URL = "https://api.kingcreativestudio.my.id/elkon/api";

const resolveApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  const hostname = typeof window !== "undefined" ? window.location.hostname : "";
  return LOCAL_HOSTNAMES.includes(hostname) ? "/api" : PRODUCTION_API_URL;
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
