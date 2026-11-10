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
  AlertCircle,
  Truck,
  XCircle,
  ChevronRight,
  LogIn,
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

      {/* Orders List */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading && !refreshing ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color="#003459" />
            <Text style={styles.loadingText}>Loading your orders...</Text>
          </View>
        ) : !isAuthenticated && orders.length === 0 ? (
          <View style={styles.emptyWrap}>
            <View style={styles.emptyIconBg}>
              <LogIn size={40} color="#003459" />
            </View>
            <Text style={styles.emptyTitle}>Sign in to view orders</Text>
            <Text style={styles.emptySub}>
              Log in to track your packages, view past purchases and live delivery statuses.
            </Text>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => router.push("/auth/login" as any)}
            >
              <Text style={styles.actionBtnText}>Sign In / Register</Text>
            </TouchableOpacity>
          </View>
        ) : filteredOrders.length === 0 ? (
          <View style={styles.emptyWrap}>
            <View style={styles.emptyIconBg}>
              <Package size={40} color="#9CA3AF" />
            </View>
            <Text style={styles.emptyTitle}>
              {activeStatus === "all" ? "No Orders Yet" : `No ${activeStatus} orders`}
            </Text>
            <Text style={styles.emptySub}>
              {activeStatus === "all"
                ? "When you order items from Abamba, they will appear right here."
                : "You have no orders matching this filter."}
            </Text>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => router.push("/products" as any)}
            >
              <Text style={styles.actionBtnText}>Start Shopping</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredOrders.map((ord, idx) => {
            const badge = getStatusBadgeStyle(ord.status);
            const BadgeIcon = badge.icon;
            const items = Array.isArray(ord.items)
              ? ord.items
              : Array.isArray(ord.products)
              ? ord.products
              : [];
            const firstItem = items[0] || {};
            const itemCount = items.reduce(
              (acc: number, cur: any) => acc + (cur.quantity || 1),
              0
            ) || ord.quantity || 1;
            const totalAmount =
              ord.total ||
              ord.totalAmount ||
              ord.price ||
              ord.payment?.amount ||
              0;
            const orderRef =
              ord.orderId ||
              ord.orderNumber ||
              (ord._id ? `#${ord._id.slice(-8).toUpperCase()}` : `#ORD-${idx + 1000}`);

            return (
              <View key={ord._id || ord.id || idx} style={styles.orderCard}>
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
                    <Text
                      style={[
                        styles.statusText,
                        { color: badge.text },
                      ]}
                    >
                      {String(ord.status || "Pending").toUpperCase()}
                    </Text>
                  </View>
                </View>

                {/* Body Details */}
                <View style={styles.cardBody}>
                  {firstItem?.imageUrl || firstItem?.product?.images?.[0]?.url ? (
                    <Image
                      source={{
                        uri:
                          firstItem?.imageUrl ||
                          firstItem?.product?.images?.[0]?.url,
                      }}
                      style={styles.itemThumb}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.itemThumbPlaceholder}>
                      <Package size={22} color="#9CA3AF" />
                    </View>
                  )}

                  <View style={styles.itemMeta}>
                    <Text style={styles.prodName} numberOfLines={2}>
                      {firstItem.name ||
                        firstItem.product?.name ||
                        ord.product ||
                        "Abamba Marketplace Package"}
                    </Text>
                    <Text style={styles.dateText}>
                      Placed on {formatDate(ord.createdAt || ord.date)}
                    </Text>
                    <Text style={styles.itemCountText}>
                      {itemCount} {itemCount === 1 ? "item" : "items"}
                    </Text>
                  </View>
                </View>

                {/* Footer price & tracking */}
                <View style={styles.cardFooter}>
                  <View>
                    <Text style={styles.totalLabel}>Total Price</Text>
                    <Text style={styles.totalAmount}>
                      ₦{Number(totalAmount).toLocaleString()}
                    </Text>
                  </View>

                  <View style={styles.paymentInfo}>
                    <Text style={styles.paymentLabel}>
                      Payment:{" "}
                      <Text
                        style={{
                          color:
                            ord.payment?.status === "completed" ||
                            ord.payment?.status === "paid"
                              ? "#059669"
                              : "#D97706",
                          fontWeight: "700",
                        }}
                      >
                        {ord.payment?.status || "Escrow Protected"}
                      </Text>
                    </Text>
                  </View>
                </View>
              </View>
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
  },
  actionBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  orderCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
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
    marginBottom: 12,
  },
  orderRefRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  orderId: {
    fontSize: 13,
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
  cardBody: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  itemThumb: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
  },
  itemThumbPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  itemMeta: {
    flex: 1,
  },
  prodName: {
    fontSize: 13.5,
    fontWeight: "600",
    color: "#1F2937",
    lineHeight: 18,
    marginBottom: 4,
  },
  dateText: {
    fontSize: 11.5,
    color: "#6B7280",
    marginBottom: 2,
  },
  itemCountText: {
    fontSize: 11.5,
    color: "#9CA3AF",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
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
  paymentInfo: {
    alignItems: "flex-end",
  },
  paymentLabel: {
    fontSize: 11.5,
    color: "#4B5563",
  },
});
