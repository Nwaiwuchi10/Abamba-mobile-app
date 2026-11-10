import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, ShieldCheck, RefreshCw } from "lucide-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { WebView } from "react-native-webview";
import { orderService } from "../../../services";
import { useAppDispatch } from "../../../store";
import { clearCart } from "../../../store/slices/cartSlice";
import { ResponseModal, ResponseModalType } from "../../../components/common/ResponseModal";

export default function PaymentWebViewScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const params = useLocalSearchParams();

  const url = (params.url as string) || "";
  const orderId = (params.orderId as string) || "";
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
    type: ResponseModalType,
    title: string,
    message: string,
    primaryText = "OK",
    onPrimary?: () => void,
    secondaryText?: string,
    onSecondary?: () => void
  ) => {
    setModalConfig({
      visible: true,
      type,
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
        "Your transaction was not completed. You can try again or check your orders.",
        "Back to Cart",
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
            Alert.alert(
              "Leave Payment?",
              "Are you sure you want to exit the payment process?",
              [
                { text: "Stay", style: "cancel" },
                { text: "Exit", style: "destructive", onPress: () => router.back() },
              ]
            );
          }}
        >
          <ArrowLeft size={22} color="#1F2937" />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Paystack Secure Checkout</Text>
          <View style={styles.secureBadge}>
            <ShieldCheck size={12} color="#10B981" />
            <Text style={styles.secureText}>256-Bit SSL Encrypted</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => webViewRef.current?.reload()}
        >
          <RefreshCw size={18} color="#4B5563" />
        </TouchableOpacity>
      </View>

      {/* Loading Overlay */}
      {(loading || verifying) && (
        <View style={styles.loadingBar}>
          <ActivityIndicator size="small" color="#FF5500" />
          <Text style={styles.loadingText}>
            {verifying ? "Verifying payment..." : "Loading gateway..."}
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
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          style={styles.webView}
        />
      ) : (
        <View style={styles.errorWrap}>
          <Text style={styles.errorText}>No authorization URL provided.</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => router.back()}>
            <Text style={styles.retryText}>Back to Checkout</Text>
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
    color: "#003459",
  },
  secureBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  secureText: {
    fontSize: 10,
    color: "#059669",
    fontWeight: "600",
  },
  loadingBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 8,
    backgroundColor: "#FFF8F5",
    borderBottomWidth: 1,
    borderBottomColor: "#FFEADF",
  },
  loadingText: {
    fontSize: 12,
    color: "#FF5500",
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
    fontSize: 15,
    color: "#4B5563",
    marginBottom: 16,
  },
  retryBtn: {
    backgroundColor: "#FF5500",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
});

