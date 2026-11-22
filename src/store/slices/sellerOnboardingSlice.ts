import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface SellerOnboardingState {
  currentStep: number;
  name: string;
  phoneNumber: string;
  dob: string;
  addressLine1: string;
  state: string;
  city: string;
  businessName: string;
  businessType: string;
  businessPhone: string;
  businessEmail: string;
  storeLocation: string;
  businessStreet: string;
  businessState: string;
  businessCity: string;
  documentType: string;
  personalDocument: string | null;
  personalDocName: string;
  personalDocUri: string | null;
  personalDocMimeType: string;
  businessDocument: string | null;
  businessDocName: string;
  businessDocUri: string | null;
  businessDocMimeType: string;
  selectedBank: {
    name: string;
    code: string;
  } | null;
  accountNumber: string;
  accountName: string;
}

const initialState: SellerOnboardingState = {
  currentStep: 1,
  name: "",
  phoneNumber: "",
  dob: "",
  addressLine1: "",
  state: "Imo",
  city: "Owerri",
  businessName: "",
  businessType: "individual",
  businessPhone: "",
  businessEmail: "",
  storeLocation: "",
  businessStreet: "",
  businessState: "Imo",
  businessCity: "Owerri",
  documentType: "nin",
  personalDocument: null,
  personalDocName: "",
  personalDocUri: null,
  personalDocMimeType: "application/pdf",
  businessDocument: null,
  businessDocName: "",
  businessDocUri: null,
  businessDocMimeType: "application/pdf",
  selectedBank: null,
  accountNumber: "",
  accountName: "",
};

export const sellerOnboardingSlice = createSlice({
  name: "sellerOnboarding",
  initialState,
  reducers: {
    updateSellerOnboarding: (
      state,
      action: PayloadAction<Partial<SellerOnboardingState>>
    ) => {
      return {
        ...state,
        ...action.payload,
      };
    },
    setSellerStep: (state, action: PayloadAction<number>) => {
      state.currentStep = action.payload;
    },
    resetSellerOnboarding: () => {
      return initialState;
    },
  },
});

export const {
  updateSellerOnboarding,
  setSellerStep,
  resetSellerOnboarding,
} = sellerOnboardingSlice.actions;

export default sellerOnboardingSlice.reducer;
