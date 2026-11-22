import api from "./api";

export const authService = {
  login: (data: { email: string; password?: string }) => api.post("/auth/login", data),
  signup: (data: any) => api.post("/auth/signup", data),
  register: (data: any) => api.post("/auth/signup", data),
  verifyOtp: (data: { email: string; otpCode?: string; otp?: string }) =>
    api.post("/auth/verify-otp", {
      email: data.email,
      otpCode: data.otpCode || data.otp,
    }),
  resendOtp: (data: { email: string }) => api.post("/auth/resend-otp", data),
  forgotPassword: (data: { email: string }) => api.post("/auth/forgot-password", data),
  resetPassword: (data: any) => api.post("/auth/reset-password", data),
  getProfile: () => api.get("/users/me"),
  deleteAccount: (userId?: string) => userId ? api.delete(`/users/${userId}`) : api.delete("/users/me"),
};

export const productService = {
  getProducts: (params?: any) => api.get("/products", { params: { limit: 120, ...params } }),
  getProductById: (id: string) => api.get(`/products/${id}`),
  getCategories: () => api.get("/categories"),
  getCategoryOptions: () => api.get("/products/category-options"),
  getBrandsAndCategories: (params?: any) => api.get("/products/brands-categories", { params }),
  getFeaturedProducts: () => api.get("/products/featured"),
  getNewArrivals: () => api.get("/products/new-arrivals"),
  getHotDeals: () => api.get("/products/hot-deals"),
  searchProducts: (query: string, params?: any) => api.get("/products/search", { params: { q: query, ...params } }),
  getStoreLocations: () => api.get("/store-locations"),
  createNewCategory: (data: { category: string; options?: any[] } | string) =>
    api.post(
      "/products/category-options",
      typeof data === "string" ? { category: data, options: [] } : data
    ),
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

export const reviewService = {
  getProductReviews: (productId: string) => api.get(`/reviews/product/${productId}`),
  markHelpful: (reviewId: string) => api.post(`/reviews/${reviewId}/helpful`),
  markUnhelpful: (reviewId: string) => api.post(`/reviews/${reviewId}/unhelpful`),
};

export const recentlyViewedService = {
  getViewedProducts: () => api.get("/products/recently-viewed"),
  addProductToViewed: (productId: string) => api.post(`/products/${productId}/viewed`),
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
          name: "Richmond Logistics",
          email: "richmondoc2@gmail.com",
          defaultBasePrice: 3000,
          state: "Imo",
          hub: "Owerri",
        },
        allCompanies: [
          {
            _id: "default-richmond",
            id: "richmond-logistics",
            name: "Richmond Logistics",
            email: "richmondoc2@gmail.com",
            defaultBasePrice: 3000,
            state: "Imo",
            hub: "Owerri",
          },
          {
            _id: "default-apex",
            id: "apexgologistics",
            name: "Apex Go Logistics",
            email: "Apexgologisticservices@gmail.com",
            defaultBasePrice: 2400,
            state: "Imo",
            hub: "Owerri",
          },
          {
            _id: "default-hens",
            id: "hens-logistics",
            name: "Hens Logistics",
            email: "cchineduikechukwu@gmail.com",
            defaultBasePrice: 3000,
            state: "Imo",
            hub: "Owerri",
          },
          {
            _id: "default-princeswift",
            id: "princeswift-logistics",
            name: "Prince Swift Logistics",
            email: "chisomprince722@gmail.com",
            defaultBasePrice: 3000,
            state: "Abia",
            hub: "Aba",
          },
          {
            _id: "default-oksaturday",
            id: "oksaturday-logistics",
            name: "OkSaturday Logistics",
            email: "oksaturdaylogistics@gmail.com",
            defaultBasePrice: 3000,
            state: "Abia",
            hub: "Aba",
          },
        ],
      };
    }
  },
};

export const notificationService = {
  getMyNotifications: (params?: { page?: number; limit?: number }) =>
    api.get("/notifications", { params }),
  getUnreadCount: () => api.get("/notifications/unread/count"),
  markAsRead: (notificationId: string) => api.patch(`/notifications/${notificationId}/read`),
};

export const uploadService = {
  uploadFile: (formData: FormData) =>
    api.put("/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),
  deleteFile: (fileId: string) => api.delete(`/upload/${fileId}`),
  getFile: (fileId: string) => api.get(`/upload/${fileId}`),
};

export const sellerService = {
  getProfile: () =>
    api
      .get("/seller/me")
      .catch((err) =>
        err.response?.status === 404 ? api.get("/seller/profile") : Promise.reject(err)
      ),
  getStats: () => api.get("/seller/stats"),
  getProducts: (params?: any) => api.get("/seller/products", { params }),
  deleteProduct: (productId: string) => api.delete(`/seller/products/${productId}`),
  getTransactions: (params?: any) => api.get("/seller/transactions", { params }),
  requestPayout: (data: { amount: number; description?: string }) => api.post("/seller/payout", data),
  onboard: (data: any) => api.post("/seller/onboard", data),
  getBankList: () =>
    api
      .get("/sellers/bank/list")
      .catch((err) =>
        err.response?.status === 404 ? api.get("/seller/bank/list") : Promise.reject(err)
      ),
  resolveBankAccount: (params: { accountNumber: string; bankCode: string }) =>
    api
      .get("/sellers/bank/resolve", { params })
      .catch((err) =>
        err.response?.status === 404 ? api.get("/seller/bank/resolve", { params }) : Promise.reject(err)
      ),
  getStoreLocations: () => api.get("/store-locations"),
  getSubscriptionPlans: () => api.get("/vendor-subscriptions/plans"),
  // Seller Orders & Details
  getOrders: (params?: any) =>
    api
      .get("/sellers/orders", { params })
      .catch((err) =>
        err.response?.status === 404 ? api.get("/seller/orders", { params }) : Promise.reject(err)
      ),
  getOrderById: (orderId: string) => api.get(`/orders/${orderId}`),
  updateOrderStatus: (orderId: string, data: { status: string }) =>
    api.patch(`/orders/${orderId}/status`, data),

  // Seller Customers
  getCustomers: (params?: any) => api.get("/customers", { params }),
  getCustomerById: (customerId: string) => api.get(`/customers/${customerId}`),

  // Products CRUD
  createProduct: (data: any) => api.post("/seller/products", data),
  updateProduct: (productId: string, data: any) => api.put(`/seller/products/${productId}`, data),
  getProductById: (id: string) => api.get(`/seller/products/${id}`),
  addVariant: (productId: string, data: any) =>
    api.post(`/products/${productId}/variants`, data),
  updateVariant: (productId: string, variantId: string, data: any) =>
    api.put(`/products/${productId}/variants/${variantId}`, data),
  deleteVariant: (productId: string, variantId: string) =>
    api.delete(`/products/${productId}/variants/${variantId}`),

  // Shipping & Shipments
  getShipments: (params?: any) =>
    api
      .get("/shipments", { params })
      .catch(() => api.get("/admin/shipping/stats")),

  // Reviews
  getReviews: (params?: any) => api.get("/reviews", { params }),
  replyReview: (reviewId: string, reply: string) =>
    api.post(`/reviews/${reviewId}/reply`, { content: reply }),

  // Password & Settings
  updatePassword: (data: { oldPassword: string; newPassword: string; confirmPassword: string }) =>
    api.patch("/seller/password", data),
  updateBankDetails: (data: any) =>
    api
      .patch("/sellers/bank", data)
      .catch((err) =>
        err.response?.status === 404 ? api.patch("/seller/bank", data) : Promise.reject(err)
      ),
  sendBankOtp: (email: string) => api.post("/seller/resend-otp", { email }),
  verifyBankOtp: (data: { email: string; otpCode: string }) => api.post("/seller/verify-otp", data),
  updateProfile: (data: any) => api.put("/users/profile", data),
};

export const aiService = {
  generateName: (data: { imageUrls: string[]; category?: string; brand?: string }) =>
    api.post("/ai/generate-name", data),
  generateDescription: (data: {
    productName: string;
    imageUrls: string[];
    category?: string;
    brand?: string;
    targetAudience?: string;
  }) => api.post("/ai/generate-description", data),
};

export const adminService = {
  getPlatformSettings: () =>
    api
      .get("/settings/platform")
      .catch((err) =>
        err.response?.status === 404 ? api.get("/admin/settings/platform") : Promise.reject(err)
      ),
};
