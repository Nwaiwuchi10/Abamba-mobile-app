import axios from "axios";
import appStorage from "./storage";

export const BASE_URL = "https://abamba-backend-d0r1.onrender.com/api/v1";

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

api.interceptors.request.use(async (config) => {
  try {
    const token = await appStorage.getItem("token");
    const guestToken = await appStorage.getItem("guestToken");
    const sellerToken = await appStorage.getItem("sellerToken");
    const superAdminToken = await appStorage.getItem("superAdminToken");

    const url = config.url?.replace(/^\//, "") || "";

    if (url.startsWith("seller/") || url.startsWith("sellers/") || url.startsWith("ai/")) {
      if (sellerToken) {
        config.headers.Authorization = `Bearer ${sellerToken}`;
      }
    } else if (url.startsWith("admin")) {
      if (superAdminToken) {
        config.headers.Authorization = `Bearer ${superAdminToken}`;
      } else if (sellerToken) {
        config.headers.Authorization = `Bearer ${sellerToken}`;
      } else if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      } else if (guestToken) {
        config.headers.Authorization = `Bearer ${guestToken}`;
      }
    } else {
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      } else if (sellerToken) {
        config.headers.Authorization = `Bearer ${sellerToken}`;
      } else if (guestToken) {
        config.headers.Authorization = `Bearer ${guestToken}`;
      }
    }
  } catch (err) {
    console.error("AsyncStorage token retrieval error:", err);
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

export default api;

