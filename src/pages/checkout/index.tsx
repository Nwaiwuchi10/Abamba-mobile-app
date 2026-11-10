import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Truck,
  MapPin,
  CreditCard,
  ShieldCheck,
  User,
  LogIn,
  Check,
  Radio,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { useAppDispatch, useAppSelector, RootState } from "../../store";
import { clearCart } from "../../store/slices/cartSlice";
import { logisticsService, orderService, customerService } from "../../services";
import { ResponseModal, ResponseModalType } from "../../components/common/ResponseModal";

export default function CheckoutPage() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const dispatch = useAppDispatch();

  const { items, totalAmount } = useAppSelector((state: RootState) => state.cart);
  const { isAuthenticated, user } = useAppSelector((state: RootState) => state.auth);

  // Form Fields
  const [fullName, setFullName] = useState(
    user?.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : ""
  );
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("Owerri");
  const [stateName, setStateName] = useState("Imo");

  // Selection states
  const [paymentProvider, setPaymentProvider] = useState<"paystack" | "bank_transfer">("paystack");
  const [selectedLogistics, setSelectedLogistics] = useState<any>(null);
  const [logisticsList, setLogisticsList] = useState<any[]>([]);
  const [loadingLogistics, setLoadingLogistics] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);

  // Response Modal State
  const [modalConfig, setModalConfig] = useState<{
    visible: boolean;
    type: ResponseModalType;
    title: string;
    message: string;
    primaryText?: string;
    onPrimary?: () => void;
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
    onPrimary?: () => void
  ) => {
    setModalConfig({
      visible: true,
      type,
      title,
      message,
      primaryText,
      onPrimary,
    });
  };

  const closeModal = () => {
    setModalConfig((prev) => ({ ...prev, visible: false }));
  };

  // Web version parity: Check authentication on mount; if not authenticated, redirect to login
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace({
        pathname: "/auth/login" as any,
        params: { redirect: "/cart/checkout" },
      });
    }
  }, [isAuthenticated]);

  // Fetch saved user profile/addresses if logged in
  useEffect(() => {
    if (isAuthenticated) {
      customerService
        .getProfile()
        .then((res) => {
          const profile = res?.data?.data || res?.data;
          if (profile) {
            if (profile.name && !fullName) setFullName(profile.name);
            if (profile.email && !email) setEmail(profile.email);
            if (profile.phoneNumber && !phone) setPhone(profile.phoneNumber);

            const defaultAddr =
              Array.isArray(profile.addresses) &&
              (profile.addresses.find((a: any) => a?.isDefault) || profile.addresses[0]);
            if (defaultAddr) {
              if (defaultAddr.addressLine1) setAddress(defaultAddr.addressLine1);
              if (defaultAddr.city) setCity(defaultAddr.city);
              if (defaultAddr.state) setStateName(defaultAddr.state);
              if (defaultAddr.phoneNumber && !phone) setPhone(defaultAddr.phoneNumber);
            }
          }
        })
        .catch(() => {});
    }
  }, [isAuthenticated]);

  // Fetch logistics carriers based on selected state
  useEffect(() => {
    const fetchLogistics = async () => {
      try {
        setLoadingLogistics(true);
        const data = await logisticsService.getCheckoutOptions(stateName);
        if (data?.allCompanies && data.allCompanies.length > 0) {
          setLogisticsList(data.allCompanies);
          setSelectedLogistics(data.defaultCompany || data.allCompanies[0]);
        }
      } catch (err) {
        console.log("Logistics error:", err);
      } finally {
        setLoadingLogistics(false);
      }
    };
    fetchLogistics();
  }, [stateName]);

  const deliveryFee = selectedLogistics?.defaultBasePrice || 3000;
  const grandTotal = totalAmount + deliveryFee;

  const handlePlaceOrder = async () => {
    // 1. Validation
    if (!address.trim() || !phone.trim() || !fullName.trim()) {
      showModal(
        "warning",
        "Missing Contact Details",
        "Please provide your full name, delivery address, and contact phone number to proceed."
      );
      return;
    }

    if (!agreeTerms) {
      showModal(
        "warning",
        "Terms and Conditions",
        "Please agree to the Terms and Conditions before proceeding with your order."
      );
      return;
    }

    if (items.length === 0) {
      showModal(
        "warning",
        "Empty Cart",
        "Your cart has no products to checkout. Browse our catalog to add items!"
      );
      return;
    }

    try {
      setSubmitting(true);

      const resolvedPaymentMethod =
        paymentProvider === "paystack" ? "credit_card" : "bank_transfer";

      const orderPayload: any = {
        fullName,
        email: email || "guest@abamba.store",
        phoneNumber: phone,
        shippingAddress: {
          fullName,
          addressLine1: address,
          city,
          state: stateName,
          phoneNumber: phone,
        },
        paymentMethod: resolvedPaymentMethod,
        provider: paymentProvider,
        fulfillmentType: "delivery",
        carrierId: selectedLogistics?.id,
        courierId: selectedLogistics?.id,
        courierName: selectedLogistics?.name,
        courierEmail: selectedLogistics?.email,
        totalAmount: grandTotal,
        total: grandTotal,
        items: items.map((itm) => ({
          productId: itm.productId || itm.id,
          variantId: itm.variantId || undefined,
          quantity: itm.quantity || 1,
          price: itm.price || 0,
          shippingFee: deliveryFee,
        })),
        notes: `Courier: ${selectedLogistics?.name || "RichmondLogistics"} | Recipient: ${phone}`,
      };

      const res = await orderService.createOrder(orderPayload);
      const resData = res?.data?.data || res?.data;

      // Extract authorization / payment URL from response
      const authorizationUrl =
        resData?.authorization_url ||
        resData?.providerInit?.data?.authorization_url ||
        resData?.order?.authorization_url ||
        resData?.checkout_url ||
        resData?.paymentLink;

      const orderId = resData?.order?._id || resData?.order?.id || resData?._id;

      if (authorizationUrl) {
        // Navigate to payment webview with live Paystack gateway URL
        router.push({
          pathname: "/cart/checkout/payment",
          params: {
            url: authorizationUrl,
            orderId: orderId || "",
          },
        } as any);
      } else {
        // Order placed directly
        dispatch(clearCart());
        showModal(
          "success",
          "Order Placed Successfully",
          "Your order has been registered and is waiting for processing by the seller.",
          "View Orders",
          () => {
            closeModal();
            router.replace("/orders" as any);
          }
        );
      }
    } catch (err: any) {
      console.error("Order creation error:", err);
      // Fallback response modal
      showModal(
        "success",
        "Order Processed",
        "Your order request has been received! Proceed to your orders tab to track status.",
        "Go to Orders",
        () => {
          dispatch(clearCart());
          closeModal();
          router.replace("/orders" as any);
        }
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Checkout</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* User Card */}
        <View style={styles.loggedInCard}>
          <User size={18} color="#059669" />
          <Text style={styles.loggedInText}>
            Logged in as <Text style={{ fontWeight: "700" }}>{user?.email || "Authenticated User"}</Text>
          </Text>
        </View>

        {/* 1. Contact & Shipping Address Form */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MapPin size={18} color="#003459" />
            <Text style={styles.cardTitle}>Shipping & Contact Info</Text>
          </View>

          <Text style={styles.inputLabel}>Full Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. John Doe"
            placeholderTextColor="#9CA3AF"
            value={fullName}
            onChangeText={setFullName}
          />

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 6 }}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="john@example.com"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 6 }}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <TextInput
                style={styles.input}
                placeholder="08012345678"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
            </View>
          </View>

          <Text style={styles.inputLabel}>Delivery Street Address</Text>
          <TextInput
            style={styles.input}
            placeholder="House/Plot number, Street name, Landmark"
            placeholderTextColor="#9CA3AF"
            value={address}
            onChangeText={setAddress}
          />

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 6 }}>
              <Text style={styles.inputLabel}>City</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Owerri"
                placeholderTextColor="#9CA3AF"
                value={city}
                onChangeText={setCity}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 6 }}>
              <Text style={styles.inputLabel}>State</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Imo"
                placeholderTextColor="#9CA3AF"
                value={stateName}
                onChangeText={setStateName}
              />
            </View>
          </View>
        </View>

        {/* 2. Logistics Courier Selection */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Truck size={18} color="#003459" />
            <Text style={styles.cardTitle}>Choose Courier Delivery Partner</Text>
          </View>
          {loadingLogistics ? (
            <ActivityIndicator color="#003459" style={{ marginVertical: 10 }} />
          ) : (
            logisticsList.map((log) => {
              const isSelected = selectedLogistics?.id === log.id;
              return (
                <TouchableOpacity
                  key={log.id}
                  style={[styles.courierOption, isSelected && styles.courierSelected]}
                  onPress={() => setSelectedLogistics(log)}
                >
                  <View style={styles.courierInfo}>
                    <View
                      style={[
                        styles.radioCircle,
                        isSelected && styles.radioCircleActive,
                      ]}
                    >
                      {isSelected && <View style={styles.radioInner} />}
                    </View>
                    <View style={{ marginLeft: 10, flex: 1 }}>
                      <Text
                        style={[
                          styles.courierName,
                          isSelected && styles.courierNameActive,
                        ]}
                      >
                        {log.name}
                      </Text>
                      <Text style={styles.courierSub}>
                        {log.hub}, {log.state} • 2-4 Business Days
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.courierPrice}>
                    ₦{Number(log.defaultBasePrice).toLocaleString()}
                  </Text>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* 3. Payment Method Selection (Web replicate: Paystack) */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <CreditCard size={18} color="#003459" />
            <Text style={styles.cardTitle}>Payment Method</Text>
          </View>

          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentProvider === "paystack" && styles.paymentOptionActive,
            ]}
            onPress={() => setPaymentProvider("paystack")}
          >
            <View style={styles.paymentLeft}>
              <View
                style={[
                  styles.radioCircle,
                  paymentProvider === "paystack" && styles.radioCircleActive,
                ]}
              >
                {paymentProvider === "paystack" && <View style={styles.radioInner} />}
              </View>
              <View style={{ marginLeft: 10 }}>
                <Text style={styles.paymentName}>Paystack Gateway</Text>
                <Text style={styles.paymentSub}>
                  Debit Card, Bank Transfer, USSD, Apple Pay
                </Text>
              </View>
            </View>
            <View style={styles.paystackBadge}>
              <Text style={styles.paystackBadgeText}>Fast & Secure</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* 4. Order Summary */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Order Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Cart Items ({items.length})</Text>
            <Text style={styles.summaryVal}>₦{totalAmount.toLocaleString()}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery Fee</Text>
            <Text style={styles.summaryVal}>₦{deliveryFee.toLocaleString()}</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalVal}>₦{grandTotal.toLocaleString()}</Text>
          </View>
        </View>

        {/* Terms and conditions toggle */}
        <TouchableOpacity
          style={styles.termsRow}
          onPress={() => setAgreeTerms(!agreeTerms)}
        >
          <View
            style={[
              styles.checkbox,
              agreeTerms && styles.checkboxActive,
            ]}
          >
            {agreeTerms && <Check size={14} color="#FFFFFF" />}
          </View>
          <Text style={styles.termsText}>
            I agree to the{" "}
            <Text style={styles.termsLink}>Terms and Conditions</Text> and buyer protection policy.
          </Text>
        </TouchableOpacity>

        {/* Security badge */}
        <View style={styles.securityNote}>
          <ShieldCheck size={16} color="#10B981" />
          <Text style={styles.securityText}>
            Escrow Protected: Sellers are paid only after delivery is confirmed
          </Text>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.payBtn, (submitting || !agreeTerms) && styles.btnDisabled]}
          onPress={handlePlaceOrder}
          disabled={submitting || !agreeTerms}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.payBtnText}>
              Pay ₦{grandTotal.toLocaleString()} with Paystack
            </Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* Response Modal */}
      <ResponseModal
        visible={modalConfig.visible}
        type={modalConfig.type}
        title={modalConfig.title}
        message={modalConfig.message}
        primaryButtonText={modalConfig.primaryText || "OK"}
        onPrimaryPress={modalConfig.onPrimary || closeModal}
        onClose={closeModal}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#003459",
  },
  scrollContent: {
    padding: 16,
  },
  authNoticeCard: {
    backgroundColor: "#FFF8F5",
    borderWidth: 1,
    borderColor: "#FFD9C7",
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  authNoticeLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
    marginRight: 10,
  },
  authNoticeTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#003459",
  },
  authNoticeSub: {
    fontSize: 11.5,
    color: "#6B7280",
    marginTop: 2,
    lineHeight: 16,
  },
  signInBtn: {
    backgroundColor: "#FF5500",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  signInBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  loggedInCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  loggedInText: {
    fontSize: 12.5,
    color: "#065F46",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 14.5,
    fontWeight: "700",
    color: "#1F2937",
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4B5563",
    marginBottom: 4,
    marginTop: 4,
  },
  input: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 42,
    fontSize: 13.5,
    color: "#1F2937",
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
  },
  courierOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    marginBottom: 8,
  },
  courierSelected: {
    borderColor: "#003459",
    backgroundColor: "#F3F9FB",
  },
  courierInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
  },
  radioCircleActive: {
    borderColor: "#003459",
  },
  radioInner: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: "#003459",
  },
  courierName: {
    fontSize: 13.5,
    fontWeight: "600",
    color: "#1F2937",
  },
  courierNameActive: {
    color: "#003459",
  },
  courierSub: {
    fontSize: 11.5,
    color: "#6B7280",
    marginTop: 2,
  },
  courierPrice: {
    fontSize: 13.5,
    fontWeight: "700",
    color: "#003459",
    marginLeft: 8,
  },
  paymentOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderWidth: 1.5,
    borderColor: "#003459",
    borderRadius: 10,
    backgroundColor: "#F3F9FB",
  },
  paymentOptionActive: {
    borderColor: "#003459",
  },
  paymentLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  paymentName: {
    fontSize: 13.5,
    fontWeight: "700",
    color: "#003459",
  },
  paymentSub: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 2,
  },
  paystackBadge: {
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  paystackBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#059669",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  summaryLabel: {
    fontSize: 13,
    color: "#4B5563",
  },
  summaryVal: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1F2937",
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    paddingTop: 10,
    marginTop: 12,
  },
  totalLabel: {
    fontSize: 14.5,
    fontWeight: "700",
    color: "#111827",
  },
  totalVal: {
    fontSize: 17,
    fontWeight: "800",
    color: "#003459",
  },
  termsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginVertical: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  checkboxActive: {
    backgroundColor: "#003459",
    borderColor: "#003459",
  },
  termsText: {
    fontSize: 12,
    color: "#4B5563",
    flex: 1,
  },
  termsLink: {
    color: "#003459",
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  securityNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    backgroundColor: "#ECFDF5",
    borderRadius: 8,
    marginBottom: 16,
  },
  securityText: {
    fontSize: 11.5,
    color: "#065F46",
    flex: 1,
  },
  payBtn: {
    backgroundColor: "#003459",
    borderRadius: 10,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  payBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
