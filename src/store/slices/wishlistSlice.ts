import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface WishlistItem {
  id: string;
  _id?: string;
  name: string;
  price: number;
  basePrice?: number;
  image?: any;
  category?: string;
  brand?: string;
  vendor?: string;
}

interface WishlistState {
  items: WishlistItem[];
}

const initialState: WishlistState = {
  items: [],
};

export const wishlistSlice = createSlice({
  name: "wishlist",
  initialState,
  reducers: {
    setWishlistItems: (state, action: PayloadAction<WishlistItem[]>) => {
      state.items = action.payload;
    },
    toggleWishlistItem: (state, action: PayloadAction<WishlistItem>) => {
      const targetId = action.payload.id || action.payload._id;
      const index = state.items.findIndex(
        (item) => (item.id || item._id) === targetId
      );
      if (index >= 0) {
        state.items.splice(index, 1);
      } else {
        state.items.push(action.payload);
      }
    },
    removeFromWishlist: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(
        (item) => (item.id || item._id) !== action.payload
      );
    },
    clearWishlist: (state) => {
      state.items = [];
    },
  },
});

export const {
  setWishlistItems,
  toggleWishlistItem,
  removeFromWishlist,
  clearWishlist,
} = wishlistSlice.actions;

export default wishlistSlice.reducer;

