import { api } from "./api";
import toast from "react-hot-toast";

export const request = {
  get: async (url, params = {}) => {
    try {
      const response = await api.get(url, { params });
      return response.data;
    } catch (error) {
      handleRequestError(error);
      throw error;
    }
  },

  post: async (url, data = {}) => {
    try {
      const response = await api.post(url, data);
      return response.data;
    } catch (error) {
      handleRequestError(error);
      throw error;
    }
  },

  put: async (url, data = {}) => {
    try {
      const response = await api.put(url, data);
      return response.data;
    } catch (error) {
      handleRequestError(error);
      throw error;
    }
  },

  delete: async (url) => {
    try {
      const response = await api.delete(url);
      return response.data;
    } catch (error) {
      handleRequestError(error);
      throw error;
    }
  },
};

function handleRequestError(error) {
  const message = error.response?.data?.message || error.message || "Something went wrong";
  toast.error(message);
}
