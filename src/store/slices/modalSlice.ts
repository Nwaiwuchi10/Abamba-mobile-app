import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ResponseModalType } from "../../components/common/ResponseModal";

export interface ModalButtonConfig {
  text: string;
  actionKey?: string; // key to identify callback
}

export interface ModalState {
  visible: boolean;
  type: ResponseModalType;
  title: string;
  message: string;
  primaryButtonText?: string;
  primaryActionKey?: string;
  secondaryButtonText?: string;
  secondaryActionKey?: string;
  dismissible?: boolean;
}

const initialState: ModalState = {
  visible: false,
  type: "info",
  title: "",
  message: "",
  primaryButtonText: "OK",
  dismissible: true,
};

export const modalSlice = createSlice({
  name: "modal",
  initialState,
  reducers: {
    showModal: (
      state,
      action: PayloadAction<{
        type?: ResponseModalType;
        title: string;
        message: string;
        primaryButtonText?: string;
        primaryActionKey?: string;
        secondaryButtonText?: string;
        secondaryActionKey?: string;
        dismissible?: boolean;
      }>
    ) => {
      state.visible = true;
      state.type = action.payload.type || "info";
      state.title = action.payload.title;
      state.message = action.payload.message;
      state.primaryButtonText = action.payload.primaryButtonText || "OK";
      state.primaryActionKey = action.payload.primaryActionKey;
      state.secondaryButtonText = action.payload.secondaryButtonText;
      state.secondaryActionKey = action.payload.secondaryActionKey;
      state.dismissible = action.payload.dismissible !== undefined ? action.payload.dismissible : true;
    },
    hideModal: (state) => {
      state.visible = false;
    },
  },
});

export const { showModal, hideModal } = modalSlice.actions;
export default modalSlice.reducer;
