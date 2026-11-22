import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface User {
  id?: string;
  _id?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  role?: string;
  sellerId?: string;
  business?: any;
  token?: string;
}

export type AppMode = "buyer" | "seller";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  activeMode: AppMode;
  isApprovedSeller: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  activeMode: "buyer",
  isApprovedSeller: false,
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: User; token: string }>
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      const business = action.payload.user?.business;
      state.isApprovedSeller =
        action.payload.user?.role === "seller" || business?.approved === true;
    },
    setActiveMode: (state, action: PayloadAction<AppMode>) => {
      state.activeMode = action.payload;
    },
    setIsApprovedSeller: (state, action: PayloadAction<boolean>) => {
      state.isApprovedSeller = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.activeMode = "buyer";
      state.isApprovedSeller = false;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
});

export const {
  setCredentials,
  setActiveMode,
  setIsApprovedSeller,
  logout,
  setLoading,
} = authSlice.actions;
export default authSlice.reducer;

