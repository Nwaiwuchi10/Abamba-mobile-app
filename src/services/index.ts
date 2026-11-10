import api from "./api";

export const authService = {
  login: (data: { email: string; password?: string }) => api.post("/auth/login", data),
  register: (data: any) => api.post("/auth/register", data),
  verifyOtp: (data: { email: string; otp: string }) => api.post("/auth/verify-otp", data),
  resendOtp: (data: { email: string }) => api.post("/auth/resend-otp", data),
  forgotPassword: (data: { email: string }) => api.post("/auth/forgot-password", data),
  resetPassword: (data: any) => api.post("/auth/reset-password", data),
  getProfile: () => api.get("/auth/me"),
};

export const productService = {
  getProducts: (params?: any) => api.get("/products", { params: { limit: 100, ...params } }),
  getProductById: (id: string) => api.get(`/products/${id}`),
  getCategories: () => api.get("/categories"),
  getFeaturedProducts: () => api.get("/products/featured"),
  getNewArrivals: () => api.get("/products/new-arrivals"),
  getHotDeals: () => api.get("/products/hot-deals"),
  searchProducts: (query: string, params?: any) => api.get("/products/search", { params: { q: query, ...params } }),
  getStoreLocations: () => api.get("/store-locations"),
};

export const cartService = {
  getCart: () => api.get("/cart"),
  addToCart: (data: { productId: string; quantity: number; variant?: any }) => api.post("/cart", data),
  updateCartItem: (itemId: string, data: { quantity: number }) => api.put(`/cart/${itemId}`, data),
  removeFromCart: (itemId: string) => api.delete(`/cart/${itemId}`),
  clearCart: () => api.delete("/cart"),
};

export const orderService = {
  createOrder: (data: any) => api.post("/orders", data),
  getMyOrders: (params?: any) => api.get("/orders", { params }),
  getUserOrders: (params?: any) => api.get("/orders", { params }),
  getOrderById: (orderId: string) => api.get(`/orders/${orderId}`),
  initializePayment: (orderId: string, data: any) =>
    api.post(`/orders/${orderId}/payment/initialize`, data),
  verifyPayment: (orderId: string, data: { reference: string }) =>
    api.post(`/orders/${orderId}/payment/verify`, data),
  verifyPaymentByReference: (data: { reference: string }) =>
    api.post("/orders/payment/verify", data),
};

export const customerService = {
  getProfile: () => api.get("/user/profile"),
  updateProfile: (data: any) => api.put("/user/profile", data),
  getAddresses: () => api.get("/user/addresses"),
  addAddress: (data: any) => api.post("/user/addresses", data),
  updateAddress: (id: string, data: any) => api.put(`/user/addresses/${id}`, data),
  deleteAddress: (id: string) => api.delete(`/user/addresses/${id}`),
};

export const wishlistService = {
  getWishlists: () => api.get("/wishlists"),
  getWishlist: () => api.get("/wishlists"),
  addToWishlist: (data: { productId: string; notes?: string }) =>
    api.post("/wishlists/products", data),
  removeFromWishlist: (wishlistId: string, productId: string) =>
    api.delete(`/wishlists/${wishlistId}/products/${productId}`),
  removeProductFromDefault: (productId: string) =>
    api.delete(`/wishlists/products/${productId}`),
};

export const logisticsService = {
  getCheckoutOptions: async (state = "Imo") => {
    try {
      const res = await api.get(`/logistics/checkout-options`, { params: { state } });
      if (res?.data?.data) return res.data.data;
      throw new Error("Invalid format");
    } catch {
      return {
        defaultCompany: {
          _id: "default-richmond",
          id: "richmond-logistics",
          name: "RichmondLogistics",
          email: "richmondoc2@gmail.com",
          defaultBasePrice: 3000,
          state: "Imo",
          hub: "Owerri",
        },
        allCompanies: [
          {
            _id: "default-richmond",
            id: "richmond-logistics",
            name: "RichmondLogistics",
            email: "richmondoc2@gmail.com",
            defaultBasePrice: 3000,
            state: "Imo",
            hub: "Owerri",
          },
          {
            _id: "default-apex",
            id: "apexgologistics",
            name: "Apexgologisticservices",
            email: "Apexgologisticservices@gmail.com",
            defaultBasePrice: 2400,
            state: "Imo",
            hub: "Owerri",
          },
          {
            _id: "default-hens",
            id: "hens-logistics",
            name: "HensLogistics",
            email: "cchineduikechukwu@gmail.com",
            defaultBasePrice: 3000,
            state: "Imo",
            hub: "Owerri",
          },
        ],
      };
    }
  },
};

