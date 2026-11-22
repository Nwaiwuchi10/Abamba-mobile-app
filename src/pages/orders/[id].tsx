import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Package,
  Truck,
  Building2,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  CreditCard,
  ShieldCheck,
  ChevronRight,
  Phone,
  Mail,
  User,
} from "lucide-react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { orderService } from "../../services";

export default function OrderDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchOrderDetail = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const res = await orderService.getOrderById(id as string);
      const data = res?.data?.data || res?.data;
      if (data) {
        setOrder(data);
      } else {
        setError("Order not found");
      }
    } catch (err: any) {
      console.log("Error loading order detail:", err);
      setError(err?.response?.data?.message || "Failed to load order details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetail();
  }, [id]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return String(dateStr);
    }
  };

  const getStatusBadgeStyle = (status: string, paymentStatus?: string) => {
    const s = String(status || "").toLowerCase();
    if (s.includes("delivered") || s.includes("completed")) {
      return {
        bg: "#ECFDF5",
        text: "#059669",
        border: "#A7F3D0",
        label: "Delivered",
        icon: CheckCircle2,
      };
    }
    if (s.includes("processing") || s.includes("transit") || s.includes("shipped")) {
      return {
        bg: "#EFF6FF",
        text: "#2563EB",
        border: "#BFDBFE",
        label: "Processing",
        icon: Truck,
      };
    }
    if (s.includes("cancelled") || s.includes("abandoned") || s.includes("failed")) {
      return {
        bg: "#FEF2F2",
        text: "#DC2626",
        border: "#FECACA",
        label: "Cancelled",
        icon: XCircle,
      };
    }
    return {
      bg: "#FFFBEB",
      text: "#D97706",
      border: "#FDE68A",
      label: "Pending",
      icon: Clock,
    };
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerWrap, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#003459" />
        <Text style={styles.loadingText}>Fetching order details from backend...</Text>
      </View>
    );
  }

  if (error || !order) {
    return (
      <View style={[styles.container, styles.centerWrap, { paddingTop: insets.top }]}>
        <Package size={50} color="#9CA3AF" />
        <Text style={styles.errorTitle}>Order Not Found</Text>
        <Text style={styles.errorSubtitle}>
          {error || "We couldn't retrieve the requested order."}
        </Text>
        <TouchableOpacity style={styles.backHomeBtn} onPress={() => router.back()}>
          <Text style={styles.backHomeBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Extract Order Data
  const orderNumber =
    order?.orderId ||
    order?.orderNumber ||
    (order?._id ? `#${order._id.slice(-8).toUpperCase()}` : "#ORD");

  const items = Array.isArray(order?.items)
    ? order.items
    : order?.product
    ? [{ name: order.product, quantity: order.quantity || 1, price: order.totalAmount }]
    : [];

  const isPickup =
    order?.fulfillmentType === "pickup_station" ||
    order?.isPickupStation ||
    order?.carrierId === "pickup-station" ||
    order?.courierId === "pickup-station" ||
    String(order?.courierName || "").toLowerCase().includes("pickup") ||
    String(order?.shippingAddress?.addressLine1 || "").toUpperCase().includes("PICK-UP") ||
    String(order?.shippingAddress?.addressLine1 || "").toUpperCase().includes("WETHERAL");

  const statusBadge = getStatusBadgeStyle(order.status, order.payment?.status);
  const StatusIcon = statusBadge.icon;

  const courierName =
    order?.courierName ||
    order?.courier ||
    (isPickup ? "Abamba Official Pick-Up Station" : "Standard Logistics Delivery");

  const shippingAddr = order?.shippingAddress || {};
  const recipientName = shippingAddr.fullName || order?.fullName || order?.user?.name || "Customer";
  const recipientPhone = shippingAddr.phoneNumber || order?.phoneNumber || order?.phone || "N/A";
  const recipientEmail = order?.email || order?.user?.email || "customer@abamba.store";

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order #{orderNumber}</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: statusBadge.bg, borderColor: statusBadge.border },
              ]}
            >
              <StatusIcon size={14} color={statusBadge.text} style={{ marginRight: 5 }} />
              <Text style={[styles.statusText, { color: statusBadge.text }]}>
                {statusBadge.label.toUpperCase()}
              </Text>
            </View>
            <Text style={styles.orderDateText}>{formatDate(order.createdAt)}</Text>
          </View>

          <Text style={styles.orderRefHeader}>Reference: {order._id || orderNumber}</Text>
        </View>

        {/* Fulfillment Method Card (Pickup Station vs Delivery) */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            {isPickup ? (
              <Building2 size={20} color="#003459" />
            ) : (
              <Truck size={20} color="#003459" />
            )}
            <Text style={styles.cardHeading}>
              {isPickup ? "Office Pick-Up Station" : "Doorstep Logistics Delivery"}
            </Text>
          </View>

          <View style={styles.logisticsDetailBox}>
            <Text style={styles.courierTitle}>{courierName}</Text>
            {isPickup ? (
              <View style={styles.pickupLocationBox}>
                <Text style={styles.pickupStationName}>
                  🏢 Regional Collection Hub:
                </Text>
                <Text style={styles.pickupAddress}>
                  Angelina House, 31 Wetheral Road, Owerri, Imo State, Nigeria
                </Text>
                <View style={styles.freePill}>
                  <Text style={styles.freePillText}>FREE (₦0) Collection</Text>
                </View>
              </View>
            ) : (
              <Text style={styles.deliveryEta}>
                Estimated Arrival: 1 - 3 business days via regional dispatch
              </Text>
            )}
          </View>
        </View>

        {/* Shipping / Recipient Address Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <MapPin size={20} color="#003459" />
            <Text style={styles.cardHeading}>
              {isPickup ? "Collector / Recipient Details" : "Delivery Address Details"}
            </Text>
          </View>

          <View style={styles.addressInfo}>
            <View style={styles.infoRow}>
              <User size={15} color="#6B7280" style={{ marginRight: 8 }} />
              <Text style={styles.infoLabel}>Name:</Text>
              <Text style={styles.infoValue}>{recipientName}</Text>
            </View>

            <View style={styles.infoRow}>
              <Phone size={15} color="#6B7280" style={{ marginRight: 8 }} />
              <Text style={styles.infoLabel}>Phone:</Text>
              <Text style={styles.infoValue}>{recipientPhone}</Text>
            </View>

            {recipientEmail && (
              <View style={styles.infoRow}>
                <Mail size={15} color="#6B7280" style={{ marginRight: 8 }} />
                <Text style={styles.infoLabel}>Email:</Text>
                <Text style={styles.infoValue}>{recipientEmail}</Text>
              </View>
            )}

            {!isPickup && (
              <View style={[styles.infoRow, { alignItems: "flex-start", marginTop: 4 }]}>
                <MapPin size={15} color="#6B7280" style={{ marginRight: 8, marginTop: 2 }} />
                <Text style={styles.infoLabel}>Address:</Text>
                <Text style={[styles.infoValue, { flex: 1 }]}>
                  {[
                    shippingAddr.addressLine1 || shippingAddr.street || shippingAddr.address,
                    shippingAddr.addressLine2,
                    shippingAddr.city,
                    shippingAddr.state,
                    shippingAddr.country,
                  ]
                    .filter(Boolean)
                    .join(", ") || "Address provided at checkout"}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Ordered Items List (Handles Single & Multiple Items) */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Package size={20} color="#003459" />
            <Text style={styles.cardHeading}>
              Ordered Items ({items.length})
            </Text>
          </View>

          {items.map((item: any, idx: number) => {
            const itemPrice = Number(item.price || item.unitPrice || 0);
            const itemQty = Number(item.quantity || 1);
            const itemTotal = Number(item.totalPrice || itemPrice * itemQty);
            const itemImg =
              item.imageUrl ||
              item.image ||
              item.product?.images?.[0]?.url ||
              item.product?.thumbnail ||
              null;

            const productId = item.product?._id || item.product?.id || item.productId || item.product;

            return (
              <TouchableOpacity
                key={item._id || item.id || idx}
                style={[
                  styles.itemRow,
                  idx !== items.length - 1 && styles.borderBottom,
                ]}
                activeOpacity={0.8}
                onPress={() => {
                  if (productId && typeof productId === "string") {
                    router.push(`/products/${productId}` as any);
                  }
                }}
              >
                {itemImg ? (
                  <Image source={{ uri: itemImg }} style={styles.itemImage} resizeMode="contain" />
                ) : (
                  <View style={styles.itemImagePlaceholder}>
                    <Package size={22} color="#9CA3AF" />
                  </View>
                )}

                <View style={styles.itemDetails}>
                  <Text style={styles.itemName} numberOfLines={2}>
                    {item.name || item.product?.name || "Abamba Product Item"}
                  </Text>

                  {/* Attributes / Variants if any */}
                  {item.variantAttributes && (
                    <Text style={styles.itemVariant}>
                      {Object.entries(item.variantAttributes)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(" • ")}
                    </Text>
                  )}

                  <View style={styles.itemQtyPriceRow}>
                    <Text style={styles.itemQtyText}>Qty: {itemQty}</Text>
                    <Text style={styles.itemUnitPrice}>
                      ₦{itemPrice.toLocaleString()} each
                    </Text>
                  </View>
                </View>

                <View style={styles.itemTotalCol}>
                  <Text style={styles.itemTotalAmount}>
                    ₦{itemTotal.toLocaleString()}
                  </Text>
                  <ChevronRight size={16} color="#9CA3AF" style={{ marginTop: 4 }} />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Payment & Order Summary */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <CreditCard size={20} color="#003459" />
            <Text style={styles.cardHeading}>Payment & Order Summary</Text>
          </View>

          <View style={styles.summaryList}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                Subtotal ({items.length} {items.length === 1 ? "item" : "items"})
              </Text>
              <Text style={styles.summaryValue}>
                ₦{Number(order.subtotal || order.totalAmount || 0).toLocaleString()}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Shipping / Courier Fee</Text>
              <Text style={styles.summaryValue}>
                {isPickup || Number(order.shippingCost || 0) === 0
                  ? "FREE (₦0)"
                  : `₦${Number(order.shippingCost).toLocaleString()}`}
              </Text>
            </View>

            {Number(order.discount || 0) > 0 && (
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: "#059669" }]}>Discount</Text>
                <Text style={[styles.summaryValue, { color: "#059669" }]}>
                  -₦{Number(order.discount).toLocaleString()}
                </Text>
              </View>
            )}

            <View style={styles.totalRow}>
              <Text style={styles.totalTitle}>Total Paid</Text>
              <Text style={styles.totalValue}>
                ₦{Number(order.total || order.totalAmount || 0).toLocaleString()}
              </Text>
            </View>
          </View>

          {/* Payment Method Badge */}
          <View style={styles.paymentMethodCard}>
            <View style={styles.paymentLeft}>
              <ShieldCheck size={18} color="#059669" />
              <View style={{ marginLeft: 8 }}>
                <Text style={styles.paymentProviderTitle}>
                  Payment:{" "}
                  <Text style={{ textTransform: "uppercase", fontWeight: "700" }}>
                    {order.paymentMethod || order.provider || "Escrow Protected"}
                  </Text>
                </Text>
                <Text style={styles.escrowNote}>
                  Protected by 100% Abamba Buyer Escrow Guarantee
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  centerWrap: {
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6B7280",
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#003459",
    marginTop: 12,
  },
  errorSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 4,
    marginBottom: 16,
  },
  backHomeBtn: {
    backgroundColor: "#003459",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backHomeBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#003459",
  },
  scrollContent: {
    padding: 16,
  },
  statusCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 14,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "800",
  },
  orderDateText: {
    fontSize: 12,
    color: "#6B7280",
  },
  orderRefHeader: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4B5563",
    marginTop: 10,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 14,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    paddingBottom: 8,
  },
  cardHeading: {
    fontSize: 15,
    fontWeight: "700",
    color: "#003459",
  },
  logisticsDetailBox: {
    paddingTop: 4,
  },
  courierTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  deliveryEta: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 4,
  },
  pickupLocationBox: {
    marginTop: 8,
    backgroundColor: "rgba(0, 52, 89, 0.04)",
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#003459",
  },
  pickupStationName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#003459",
  },
  pickupAddress: {
    fontSize: 12,
    color: "#4B5563",
    marginTop: 3,
    lineHeight: 18,
  },
  freePill: {
    alignSelf: "flex-start",
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 6,
  },
  freePillText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#065F46",
  },
  addressInfo: {
    gap: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
    width: 65,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: "#F9FAFB",
  },
  itemImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  itemDetails: {
    flex: 1,
    marginLeft: 12,
  },
  itemName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
    lineHeight: 18,
  },
  itemVariant: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 2,
  },
  itemQtyPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  itemQtyText: {
    fontSize: 12,
    color: "#4B5563",
    fontWeight: "600",
  },
  itemUnitPrice: {
    fontSize: 12,
    color: "#6B7280",
  },
  itemTotalCol: {
    alignItems: "flex-end",
    marginLeft: 8,
  },
  itemTotalAmount: {
    fontSize: 14,
    fontWeight: "800",
    color: "#003459",
  },
  summaryList: {
    gap: 8,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 13,
    color: "#6B7280",
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 10,
    marginTop: 6,
  },
  totalTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111827",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "900",
    color: "#003459",
  },
  paymentMethodCard: {
    backgroundColor: "#F0FDF4",
    padding: 10,
    borderRadius: 8,
    marginTop: 12,
  },
  paymentLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  paymentProviderTitle: {
    fontSize: 12,
    color: "#166534",
  },
  escrowNote: {
    fontSize: 11,
    color: "#059669",
    marginTop: 1,
  },
});
