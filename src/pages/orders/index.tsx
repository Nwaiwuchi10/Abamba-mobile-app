import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Package,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
  ChevronRight,
  LogIn,
  Building2,
  MapPin,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { orderService } from "../../services";
import { useAppSelector, RootState } from "../../store";

export default function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const isAuthenticated = useAppSelector(
    (state: RootState) => state.auth.isAuthenticated
  );

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [activeStatus, setActiveStatus] = useState<string>("all");

  const statusFilters = [
    { label: "All", value: "all" },
    { label: "Pending", value: "pending" },
    { label: "Processing", value: "processing" },
    { label: "Delivered", value: "delivered" },
    { label: "Cancelled", value: "cancelled" },
  ];

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await orderService.getUserOrders();
      const incoming =
        res?.data?.data?.orders ||
        res?.data?.orders ||
        res?.data?.data ||
        res?.data;

      if (Array.isArray(incoming)) {
        setOrders(incoming);
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.log("Error fetching user orders:", err);
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [isAuthenticated]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const filteredOrders = useMemo(() => {
    if (activeStatus === "all") return orders;
    return orders.filter(
      (ord) =>
        String(ord.status || "").toLowerCase() === activeStatus.toLowerCase()
    );
  }, [orders, activeStatus]);

  const getStatusBadgeStyle = (status: string) => {
    const s = String(status || "").toLowerCase();
    if (s.includes("delivered") || s.includes("completed")) {
      return {
        bg: "#ECFDF5",
        text: "#059669",
        border: "#A7F3D0",
        icon: CheckCircle2,
      };
    }
    if (s.includes("processing") || s.includes("transit") || s.includes("shipped")) {
      return {
        bg: "#EFF6FF",
        text: "#2563EB",
        border: "#BFDBFE",
        icon: Truck,
      };
    }
    if (s.includes("cancelled") || s.includes("abandoned") || s.includes("failed")) {
      return {
        bg: "#FEF2F2",
        text: "#DC2626",
        border: "#FECACA",
        icon: XCircle,
      };
    }
    return {
      bg: "#FFFBEB",
      text: "#D97706",
      border: "#FDE68A",
      icon: Clock,
    };
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "Recent";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return String(dateStr);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Orders</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Status Filter Chips */}
      <View style={styles.filterWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {statusFilters.map((tab) => {
            const isActive = activeStatus === tab.value;
            return (
              <TouchableOpacity
                key={tab.value}
                style={[
                  styles.filterChip,
                  isActive && styles.activeFilterChip,
                ]}
                onPress={() => setActiveStatus(tab.value)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    isActive && styles.activeFilterChipText,
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading && !refreshing ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color="#003459" />
            <Text style={styles.loadingText}>Loading orders...</Text>
          </View>
        ) : filteredOrders.length === 0 ? (
          <View style={styles.emptyWrap}>
            <View style={styles.emptyIconBg}>
              <Package size={40} color="#003459" />
            </View>
            <Text style={styles.emptyTitle}>No Orders Found</Text>
            <Text style={styles.emptySub}>
              {isAuthenticated
                ? "When you order items from Abamba, all details and real-time delivery status will appear right here."
                : "Sign in to track your orders, live deliveries, and purchase history."}
            </Text>
            {!isAuthenticated ? (
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => router.push("/auth/login" as any)}
              >
                <LogIn size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.actionBtnText}>Sign In to Account</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => router.push("/(tabs)/products" as any)}
              >
                <Text style={styles.actionBtnText}>Explore Products</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filteredOrders.map((ord: any, idx: number) => {
            const badge = getStatusBadgeStyle(ord.status);
            const BadgeIcon = badge.icon;

            const items: any[] = Array.isArray(ord.items) && ord.items.length > 0
              ? ord.items
              : ord.product
              ? [{ name: ord.product, quantity: ord.quantity || 1, price: ord.totalAmount }]
              : [];

            const totalItemCount = items.reduce(
              (acc: number, cur: any) => acc + (cur.quantity || 1),
              0
            ) || ord.quantity || 1;

            const totalAmount =
              ord.total ||
              ord.totalAmount ||
              ord.price ||
              ord.payment?.amount ||
              0;

            const orderIdValue = ord._id || ord.id || ord.orderId;
            const orderRef =
              ord.orderId ||
              ord.orderNumber ||
              (ord._id ? `#${ord._id.slice(-8).toUpperCase()}` : `#ORD-${idx + 1000}`);

            const isPickup =
              ord.fulfillmentType === "pickup_station" ||
              ord.isPickupStation ||
              ord.carrierId === "pickup-station" ||
              ord.courierId === "pickup-station" ||
              String(ord.courierName || "").toLowerCase().includes("pickup") ||
              String(ord.shippingAddress?.addressLine1 || "").toUpperCase().includes("PICK-UP") ||
              String(ord.shippingAddress?.addressLine1 || "").toUpperCase().includes("WETHERAL");

            return (
              <TouchableOpacity
                key={ord._id || ord.id || idx}
                style={styles.orderCard}
                activeOpacity={0.85}
                onPress={() => {
                  if (orderIdValue) {
                    router.push(`/orders/${orderIdValue}` as any);
                  }
                }}
              >
                {/* Header row */}
                <View style={styles.cardHeader}>
                  <View style={styles.orderRefRow}>
                    <Package size={17} color="#003459" />
                    <Text style={styles.orderId}>{orderRef}</Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: badge.bg,
                        borderColor: badge.border,
                      },
                    ]}
                  >
                    <BadgeIcon size={12} color={badge.text} style={{ marginRight: 4 }} />
                    <Text style={[styles.statusText, { color: badge.text }]}>
                      {String(ord.status || "Pending").toUpperCase()}
                    </Text>
                  </View>
                </View>

                {/* Fulfillment Indicator Tag */}
                <View style={styles.fulfillmentTagRow}>
                  {isPickup ? (
                    <View style={styles.pickupPill}>
                      <Building2 size={13} color="#003459" style={{ marginRight: 4 }} />
                      <Text style={styles.pickupPillText}>Office Pick-Up Station</Text>
                    </View>
                  ) : (
                    <View style={styles.deliveryPill}>
                      <Truck size={13} color="#2563EB" style={{ marginRight: 4 }} />
                      <Text style={styles.deliveryPillText}>
                        {ord.courierName || "Doorstep Delivery"}
                      </Text>
                    </View>
                  )}
                  <Text style={styles.dateText}>
                    {formatDate(ord.createdAt || ord.date)}
                  </Text>
                </View>

                {/* Multiple Ordered Items Preview */}
                <View style={styles.itemsPreviewContainer}>
                  {items.map((item: any, itemIdx: number) => {
                    const itemImg =
                      item.imageUrl ||
                      item.image ||
                      item.product?.images?.[0]?.url ||
                      item.product?.thumbnail ||
                      null;
                    const itemName =
                      item.name ||
                      item.product?.name ||
                      ord.product ||
                      "Abamba Marketplace Package";
                    const itemQty = item.quantity || 1;
                    const itemPrice = Number(item.price || item.unitPrice || 0);

                    return (
                      <View
                        key={item._id || item.id || itemIdx}
                        style={[
                          styles.itemRow,
                          itemIdx !== items.length - 1 && styles.itemRowBorder,
                        ]}
                      >
                        {itemImg ? (
                          <Image
                            source={{ uri: itemImg }}
                            style={styles.itemThumb}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={styles.itemThumbPlaceholder}>
                            <Package size={20} color="#9CA3AF" />
                          </View>
                        )}

                        <View style={styles.itemMeta}>
                          <Text style={styles.prodName} numberOfLines={2}>
                            {itemName}
                          </Text>
                          {item.variantAttributes && (
                            <Text style={styles.itemVariantText}>
                              {Object.entries(item.variantAttributes)
                                .map(([k, v]) => `${k}: ${v}`)
                                .join(" • ")}
                            </Text>
                          )}
                          <View style={styles.itemPriceQtyRow}>
                            <Text style={styles.itemQtyBadge}>Qty: {itemQty}</Text>
                            {itemPrice > 0 && (
                              <Text style={styles.itemUnitPriceText}>
                                ₦{itemPrice.toLocaleString()}
                              </Text>
                            )}
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>

                {/* Footer: Total Amount, Payment, and Action */}
                <View style={styles.cardFooter}>
                  <View>
                    <Text style={styles.totalLabel}>
                      Total ({totalItemCount} {totalItemCount === 1 ? "item" : "items"})
                    </Text>
                    <Text style={styles.totalAmount}>
                      ₦{Number(totalAmount).toLocaleString()}
                    </Text>
                  </View>

                  <View style={styles.viewDetailBtnWrap}>
                    <Text style={styles.viewDetailText}>View Details</Text>
                    <ChevronRight size={16} color="#003459" />
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
        <View style={{ height: 110 }} />
      </ScrollView>
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
  filterWrapper: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  filterRow: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
  },
  activeFilterChip: {
    backgroundColor: "#003459",
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4B5563",
  },
  activeFilterChipText: {
    color: "#FFFFFF",
  },
  scrollContent: {
    padding: 16,
  },
  loadingWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: "#6B7280",
  },
  emptyWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 50,
    paddingHorizontal: 24,
  },
  emptyIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F3F9FB",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#003459",
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 20,
  },
  actionBtn: {
    backgroundColor: "#003459",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  actionBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  orderCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 14,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    paddingBottom: 10,
    marginBottom: 10,
  },
  orderRefRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  orderId: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  fulfillmentTagRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  pickupPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 52, 89, 0.06)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pickupPillText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#003459",
  },
  deliveryPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  deliveryPillText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#2563EB",
  },
  dateText: {
    fontSize: 11.5,
    color: "#6B7280",
  },
  itemsPreviewContainer: {
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  itemRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  itemThumb: {
    width: 52,
    height: 52,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
  },
  itemThumbPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 8,
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  itemMeta: {
    flex: 1,
    marginLeft: 10,
  },
  prodName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1F2937",
    lineHeight: 18,
  },
  itemVariantText: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 2,
  },
  itemPriceQtyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  itemQtyBadge: {
    fontSize: 11,
    color: "#4B5563",
    fontWeight: "600",
    backgroundColor: "#E5E7EB",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  itemUnitPriceText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#003459",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    paddingTop: 10,
  },
  totalLabel: {
    fontSize: 11,
    color: "#6B7280",
  },
  totalAmount: {
    fontSize: 15,
    fontWeight: "800",
    color: "#003459",
    marginTop: 2,
  },
  viewDetailBtnWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  viewDetailText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#003459",
  },
});
