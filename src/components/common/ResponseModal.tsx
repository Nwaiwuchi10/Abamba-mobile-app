import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
  Animated,
} from "react-native";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  X,
} from "lucide-react-native";

export type ResponseModalType = "success" | "error" | "warning" | "info";

export interface ResponseModalProps {
  visible: boolean;
  type?: ResponseModalType;
  title: string;
  message: string;
  primaryButtonText?: string;
  onPrimaryPress?: () => void;
  secondaryButtonText?: string;
  onSecondaryPress?: () => void;
  onClose?: () => void;
  dismissible?: boolean;
}

export const ResponseModal: React.FC<ResponseModalProps> = ({
  visible,
  type = "info",
  title,
  message,
  primaryButtonText = "OK",
  onPrimaryPress,
  secondaryButtonText,
  onSecondaryPress,
  onClose,
  dismissible = true,
}) => {
  const getTheme = () => {
    switch (type) {
      case "success":
        return {
          icon: CheckCircle2,
          iconColor: "#059669",
          badgeBg: "#ECFDF5",
          badgeBorder: "#A7F3D0",
          buttonBg: "#059669",
        };
      case "error":
        return {
          icon: XCircle,
          iconColor: "#DC2626",
          badgeBg: "#FEF2F2",
          badgeBorder: "#FECACA",
          buttonBg: "#DC2626",
        };
      case "warning":
        return {
          icon: AlertTriangle,
          iconColor: "#D97706",
          badgeBg: "#FFFBEB",
          badgeBorder: "#FDE68A",
          buttonBg: "#D97706",
        };
      default:
        return {
          icon: Info,
          iconColor: "#FF5500",
          badgeBg: "#FFF8F5",
          badgeBorder: "#FFEADF",
          buttonBg: "#003459",
        };
    }
  };

  const theme = getTheme();
  const Icon = theme.icon;

  const handleDismiss = () => {
    if (dismissible && onClose) {
      onClose();
    }
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={handleDismiss}
    >
      <TouchableWithoutFeedback onPress={handleDismiss}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.card}>
              {/* Close Icon button */}
              {dismissible && onClose && (
                <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                  <X size={18} color="#9CA3AF" />
                </TouchableOpacity>
              )}

              {/* Icon Badge */}
              <View
                style={[
                  styles.iconBadge,
                  {
                    backgroundColor: theme.badgeBg,
                    borderColor: theme.badgeBorder,
                  },
                ]}
              >
                <Icon size={32} color={theme.iconColor} strokeWidth={2.2} />
              </View>

              {/* Title & Message */}
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.message}>{message}</Text>

              {/* Action Buttons */}
              <View style={styles.buttonContainer}>
                {secondaryButtonText && (
                  <TouchableOpacity
                    style={styles.secondaryBtn}
                    onPress={onSecondaryPress || onClose}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.secondaryBtnText}>
                      {secondaryButtonText}
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[
                    styles.primaryBtn,
                    { backgroundColor: theme.buttonBg },
                    secondaryButtonText ? { flex: 1 } : { width: "100%" },
                  ]}
                  onPress={onPrimaryPress || onClose}
                  activeOpacity={0.85}
                >
                  <Text style={styles.primaryBtnText}>{primaryButtonText}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(11, 12, 14, 0.55)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingTop: 28,
    paddingBottom: 22,
    paddingHorizontal: 22,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    position: "relative",
  },
  closeBtn: {
    position: "absolute",
    top: 14,
    right: 14,
    padding: 6,
    borderRadius: 14,
    backgroundColor: "#F3F4F6",
  },
  iconBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#003459",
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  message: {
    fontSize: 13.5,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 22,
    paddingHorizontal: 4,
  },
  buttonContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    width: "100%",
  },
  primaryBtn: {
    height: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontSize: 14.5,
    fontWeight: "700",
  },
  secondaryBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  secondaryBtnText: {
    color: "#4B5563",
    fontSize: 14.5,
    fontWeight: "600",
  },
});

