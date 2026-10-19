export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    PROFILE: "/auth/profile",
    UPDATE_PROFILE: "/auth/profile",
    CHANGE_PASSWORD: "/auth/password",
  },
  PRODUCTS: {
    LIST: "/products",
    DETAIL: (id) => `/products/${id}`,
    CREATE: "/products",
    UPDATE: (id) => `/products/${id}`,
    DELETE: (id) => `/products/${id}`,
  },
  CATEGORIES: {
    LIST: "/categories",
    CREATE: "/categories",
    UPDATE: (id) => `/categories/${id}`,
    DELETE: (id) => `/categories/${id}`,
  },
  CONTACTS: {
    SUBMIT: "/contacts",
    LIST: "/contacts",
    UPDATE_STATUS: (id) => `/contacts/${id}`,
    DELETE: (id) => `/contacts/${id}`,
  },
  ORDERS: {
    CREATE: "/orders",
    LIST: "/orders",
    DETAIL: (id) => `/orders/${id}`,
    UPDATE_STATUS: (id) => `/orders/${id}/status`,
    BY_REFERENCE: (referenceId) => `/orders/reference/${referenceId}`,
  },
  SETTINGS: {
    PUBLIC: "/settings",
    ADMIN: "/settings/admin",
    UPDATE: "/settings",
  },
  ADMIN: {
    STATS: "/admin/stats",
    LOGS: "/admin/logs",
  },
  UPLOAD: "/upload",
  UPLOAD_MULTIPLE: "/upload-multiple",
};
