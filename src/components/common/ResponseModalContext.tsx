import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import { ResponseModal, ResponseModalType } from "./ResponseModal";

export interface ModalOptions {
  type?: ResponseModalType;
  title: string;
  message: string;
  primaryButtonText?: string;
  onPrimaryPress?: () => void;
  secondaryButtonText?: string;
  onSecondaryPress?: () => void;
  dismissible?: boolean;
  autoCloseDuration?: number;
}

interface ResponseModalContextType {
  showModal: (options: ModalOptions) => void;
  showSuccess: (title: string, message: string, onOk?: () => void, autoCloseDuration?: number) => void;
  showError: (title: string, message: string, onOk?: () => void, autoCloseDuration?: number) => void;
  showWarning: (title: string, message: string, onOk?: () => void, autoCloseDuration?: number) => void;
  showInfo: (title: string, message: string, onOk?: () => void, autoCloseDuration?: number) => void;
  showConfirm: (
    title: string,
    message: string,
    onConfirm: () => void,
    onCancel?: () => void,
    confirmText?: string,
    cancelText?: string
  ) => void;
  hideModal: () => void;
}

const ResponseModalContext = createContext<ResponseModalContextType | null>(null);

// Static holder for showing modals from anywhere (services, interceptors, etc.)
let globalModalHandler: ResponseModalContextType | null = null;

export const GlobalModal = {
  show: (options: ModalOptions) => globalModalHandler?.showModal(options),
  success: (title: string, message: string, onOk?: () => void, autoCloseDuration?: number) =>
    globalModalHandler?.showSuccess(title, message, onOk, autoCloseDuration),
  error: (title: string, message: string, onOk?: () => void) =>
    globalModalHandler?.showError(title, message, onOk),
  warning: (title: string, message: string, onOk?: () => void) =>
    globalModalHandler?.showWarning(title, message, onOk),
  info: (title: string, message: string, onOk?: () => void) =>
    globalModalHandler?.showInfo(title, message, onOk),
  confirm: (
    title: string,
    message: string,
    onConfirm: () => void,
    onCancel?: () => void,
    confirmText?: string,
    cancelText?: string
  ) => globalModalHandler?.showConfirm(title, message, onConfirm, onCancel, confirmText, cancelText),
  hide: () => globalModalHandler?.hideModal(),
};

export const ResponseModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [modalConfig, setModalConfig] = useState<ModalOptions & { visible: boolean }>({
    visible: false,
    title: "",
    message: "",
    type: "info",
  });

  const callbacksRef = useRef<{
    onPrimary?: () => void;
    onSecondary?: () => void;
  }>({});

  const hideModal = useCallback(() => {
    setModalConfig((prev) => ({ ...prev, visible: false }));
    callbacksRef.current = {};
  }, []);

  const showModal = useCallback(
    (options: ModalOptions) => {
      callbacksRef.current = {
        onPrimary: options.onPrimaryPress,
        onSecondary: options.onSecondaryPress,
      };
      setModalConfig({
        ...options,
        visible: true,
      });
    },
    []
  );

  const showSuccess = useCallback(
    (title: string, message: string, onOk?: () => void, autoCloseDuration = 5000) => {
      showModal({
        type: "success",
        title,
        message,
        primaryButtonText: "OK",
        onPrimaryPress: onOk,
        autoCloseDuration,
      });
    },
    [showModal]
  );

  const showError = useCallback(
    (title: string, message: string, onOk?: () => void, autoCloseDuration = 5000) => {
      showModal({
        type: "error",
        title,
        message,
        primaryButtonText: "Got it",
        onPrimaryPress: onOk,
        autoCloseDuration,
      });
    },
    [showModal]
  );

  const showWarning = useCallback(
    (title: string, message: string, onOk?: () => void, autoCloseDuration = 5000) => {
      showModal({
        type: "warning",
        title,
        message,
        primaryButtonText: "Understood",
        onPrimaryPress: onOk,
        autoCloseDuration,
      });
    },
    [showModal]
  );

  const showInfo = useCallback(
    (title: string, message: string, onOk?: () => void, autoCloseDuration = 5000) => {
      showModal({
        type: "info",
        title,
        message,
        primaryButtonText: "OK",
        onPrimaryPress: onOk,
        autoCloseDuration,
      });
    },
    [showModal]
  );

  const showConfirm = useCallback(
    (
      title: string,
      message: string,
      onConfirm: () => void,
      onCancel?: () => void,
      confirmText = "Confirm",
      cancelText = "Cancel"
    ) => {
      showModal({
        type: "warning",
        title,
        message,
        primaryButtonText: confirmText,
        secondaryButtonText: cancelText,
        onPrimaryPress: onConfirm,
        onSecondaryPress: onCancel,
      });
    },
    [showModal]
  );

  const contextValue: ResponseModalContextType = {
    showModal,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showConfirm,
    hideModal,
  };

  globalModalHandler = contextValue;

  const handlePrimary = () => {
    const cb = callbacksRef.current.onPrimary;
    hideModal();
    if (cb) cb();
  };

  const handleSecondary = () => {
    const cb = callbacksRef.current.onSecondary;
    hideModal();
    if (cb) cb();
  };

  return (
    <ResponseModalContext.Provider value={contextValue}>
      {children}
      <ResponseModal
        visible={modalConfig.visible}
        type={modalConfig.type}
        title={modalConfig.title}
        message={modalConfig.message}
        primaryButtonText={modalConfig.primaryButtonText}
        onPrimaryPress={handlePrimary}
        secondaryButtonText={modalConfig.secondaryButtonText}
        onSecondaryPress={handleSecondary}
        onClose={hideModal}
        dismissible={modalConfig.dismissible}
        autoCloseDuration={modalConfig.autoCloseDuration}
      />
    </ResponseModalContext.Provider>
  );
};

export const useResponseModal = () => {
  const context = useContext(ResponseModalContext);
  if (!context) {
    throw new Error("useResponseModal must be used within a ResponseModalProvider");
  }
  return context;
};
