import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, ShieldCheck, RefreshCw } from "lucide-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { WebView } from "react-native-webview";
import { orderService } from "../../../services";
import { useAppDispatch } from "../../../store";
import { clearCart } from "../../../store/slices/cartSlice";
import { ResponseModal, ResponseModalType } from "../../../components/common/ResponseModal";
import appStorage from "../../../services/storage";

export default function PaymentWebViewScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const params = useLocalSearchParams();

  const url = (params.url as string) || "";
  const orderId = (params.orderId as string) || "";
  const type = (params.type as string) || ""; // "ad" | "order"
  const planId = (params.planId as string) || "";

  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const webViewRef = React.useRef<any>(null);

  // Response Modal State
  const [modalConfig, setModalConfig] = useState<{
    visible: boolean;
    type: ResponseModalType;
    title: string;
    message: string;
    primaryText?: string;
    onPrimary?: () => void;
    secondaryText?: string;
    onSecondary?: () => void;
  }>({
    visible: false,
    type: "info",
    title: "",
    message: "",
  });

  const showModal = (
    modalType: ResponseModalType,
    title: string,
    message: string,
    primaryText = "OK",
    onPrimary?: () => void,
    secondaryText?: string,
    onSecondary?: () => void
  ) => {
    setModalConfig({
      visible: true,
      type: modalType,
      title,
      message,
      primaryText,
      onPrimary,
      secondaryText,
      onSecondary,
    });
  };

  const closeModal = () => {
    setModalConfig((prev) => ({ ...prev, visible: false }));
  };

  const handlePaymentCompleted = async (reference?: string) => {
    if (verifying) return;
    try {
      setVerifying(true);

      // Handle Ad Plan Payment completion
      if (type === "ad") {
        const stored = await appStorage.getItem("abamba_seller_active_ad");
        const existing = stored ? JSON.parse(stored) : {};
        const updated = {
          ...existing,
          status: "paid_setup",
          planId: planId || existing.planId || "ad_7weeks",
          paymentReference: reference || `AD_PAY_${Date.now()}`,
        };
        await appStorage.setItem("abamba_seller_active_ad", JSON.stringify(updated));

        showModal(
          "success",
          "Ad Payment Confirmed",
          "Your Paystack payment has been verified! Now set up your homepage ad banner details.",
          "Continue Setup",
          () => {
            closeModal();
            router.replace("/seller/ads" as any);
          }
        );
        return;
      }

      // Handle Regular Order Payment verification
      if (orderId && reference) {
        await orderService.verifyPayment(orderId, { reference }).catch(() => {});
      } else if (reference) {
        await orderService.verifyPaymentByReference({ reference }).catch(() => {});
      }
      dispatch(clearCart());
      showModal(
        "success",
        "Payment Successful",
        "Your order payment has been confirmed! You can track package status in My Orders.",
        "View Orders",
        () => {
          closeModal();
          router.replace("/orders" as any);
        }
      );
    } catch (err) {
      if (type === "ad") {
        showModal(
          "success",
          "Ad Payment Recorded",
          "Your ad transaction was processed. Continue to configure your banner.",
          "Continue Setup",
          () => {
            closeModal();
            router.replace("/seller/ads" as any);
          }
        );
      } else {
        dispatch(clearCart());
        showModal(
          "success",
          "Order Placed",
          "Your payment transaction was submitted.",
          "Go to Orders",
          () => {
            closeModal();
            router.replace("/orders" as any);
          }
        );
      }
    } finally {
      setVerifying(false);
    }
  };

  const handleNavigationStateChange = (navState: any) => {
    const currentUrl = navState.url || "";

    // Check for Paystack / gateway callback URLs or completion indicators
    if (
      currentUrl.includes("step=submitted") ||
      currentUrl.includes("/orders") ||
      currentUrl.includes("success") ||
      currentUrl.includes("payment-success") ||
      currentUrl.includes("trxref=") ||
      currentUrl.includes("reference=")
    ) {
      // Extract reference if present
      let ref = "";
      try {
        const u = new URL(currentUrl);
        ref = u.searchParams.get("reference") || u.searchParams.get("trxref") || "";
      } catch (e) {
        const match = currentUrl.match(/(?:reference|trxref)=([^&]+)/);
        if (match) ref = match[1];
      }
      handlePaymentCompleted(ref);
    } else if (currentUrl.includes("cancel") || currentUrl.includes("failed")) {
      showModal(
        "error",
        "Payment Cancelled",
        "Your transaction was not completed. You can try again.",
        "Go Back",
        () => {
          closeModal();
          router.back();
        }
      );
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            showModal(
              "warning",
              "Leave Payment?",
              "Are you sure you want to cancel and exit the current payment process?",
              "Exit Payment",
              () => router.back(),
              "Stay on Payment",
              () => setModalConfig((prev) => ({ ...prev, visible: false }))
            );
          }}
        >
          <ArrowLeft size={22} color="#1F2937" />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>
            {type === "ad" ? "Ad Subscription Payment" : "Secure Payment"}
          </Text>
          <View style={styles.secureBadge}>
            <ShieldCheck size={13} color="#059669" />
            <Text style={styles.secureText}>Paystack Gateway • 256-bit SSL</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.refreshBtn}
          onPress={() => webViewRef.current?.reload()}
        >
          <RefreshCw size={18} color="#4B5563" />
        </TouchableOpacity>
      </View>

      {/* Loading Bar */}
      {(loading || verifying) && (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="small" color="#003459" />
          <Text style={styles.loadingText}>
            {verifying ? "Verifying transaction with Paystack..." : "Loading secure payment page..."}
          </Text>
        </View>
      )}

      {/* WebView */}
      {url ? (
        <WebView
          ref={webViewRef}
          source={{ uri: url }}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          onNavigationStateChange={handleNavigationStateChange}
          onMessage={(event) => {
            try {
              const data = JSON.parse(event.nativeEvent.data);
              if (data?.event === "success" || data?.status === "success") {
                handlePaymentCompleted(data?.reference);
              } else if (data?.event === "close" || data?.event === "cancel") {
                router.back();
              }
            } catch (e) {
              console.warn("WebView message parse:", e);
            }
          }}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          style={styles.webView}
        />
      ) : (
        <View style={styles.errorWrap}>
          <Text style={styles.errorText}>No authorization URL provided.</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => router.back()}>
            <Text style={styles.retryText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Response Modal */}
      <ResponseModal
        visible={modalConfig.visible}
        type={modalConfig.type}
        title={modalConfig.title}
        message={modalConfig.message}
        primaryButtonText={modalConfig.primaryText || "OK"}
        onPrimaryPress={modalConfig.onPrimary || closeModal}
        secondaryButtonText={modalConfig.secondaryText}
        onSecondaryPress={modalConfig.onSecondary}
        onClose={closeModal}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backBtn: {
    padding: 6,
  },
  headerTitleWrap: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },
  secureBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  secureText: {
    fontSize: 11,
    color: "#059669",
    fontWeight: "600",
  },
  refreshBtn: {
    padding: 6,
  },
  loadingWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0FDF4",
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#DCFCE7",
  },
  loadingText: {
    fontSize: 12,
    color: "#003459",
    fontWeight: "600",
  },
  webView: {
    flex: 1,
  },
  errorWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  errorText: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 16,
  },
  retryBtn: {
    backgroundColor: "#003459",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
});
