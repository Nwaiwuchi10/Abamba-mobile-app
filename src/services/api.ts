import axios from "axios";
import appStorage from "./storage";

export const BASE_URL = "https://abamba-backend.vercel.app/api/v1";
// export const BASE_URL = "https://abamba-backend-d0r1.onrender.com/api/v1";

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
      } else if (token) {
        // Fallback to customer user token (e.g. for /seller/onboard when a logged-in user becomes a seller)
        config.headers.Authorization = `Bearer ${token}`;
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
  async (error) => {
    const status = error?.response?.status;
    const url = error?.config?.url;

    // Log helpful diagnostic info for non-2xx errors
    if (__DEV__) {
      console.warn(`[Axios ${status || "Network"}] Endpoint: ${url}`, error?.response?.data || error?.message);
    }

    // 401 Unauthorized or 403 Forbidden: Expired or invalid authentication token
    // 404 on `/users/me`: Stale deleted user session on the backend
    // Note: Do NOT clear the main user token if a seller-specific endpoint returned 401
    if (status === 401 || status === 403 || (status === 404 && url?.includes("/users/me"))) {
      try {
        if (url?.startsWith("/seller/") || url?.startsWith("seller/")) {
          // Only clear sellerToken if seller endpoint failed
          console.warn("⚠️ Invalid seller session. Clearing sellerToken.");
          await appStorage.removeItem("sellerToken");
        } else {
          console.warn("⚠️ Invalid or expired session. Clearing stale user tokens from storage.");
          await appStorage.removeItem("token");
          await appStorage.removeItem("userProfile");
          await appStorage.removeItem("sellerToken");
        }
      } catch (e) {
        console.error("Error clearing expired auth token:", e);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
