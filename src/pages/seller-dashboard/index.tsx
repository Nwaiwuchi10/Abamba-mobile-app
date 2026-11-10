import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  DollarSign,
  Package,
  TrendingUp,
  ShoppingBag,
  Plus,
  ArrowLeft,
  Settings,
} from "lucide-react-native";
import { useRouter } from "expo-router";

export default function SellerDashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  const stats = [
    { title: "Total Revenue", value: "₦1,240,500", icon: DollarSign, color: "#10B981" },
    { title: "Total Orders", value: "86", icon: ShoppingBag, color: "#3B82F6" },
    { title: "Products Listed", value: "24", icon: Package, color: "#F59E0B" },
    { title: "Store Views", value: "3,420", icon: TrendingUp, color: "#8B5CF6" },
  ];

  const recentOrders = [
    { id: "ORD-9482", customer: "Chinedu Okafor", amount: "₦45,000", status: "Delivered" },
    { id: "ORD-9481", customer: "Amaka Eze", amount: "₦18,500", status: "In Transit" },
    { id: "ORD-9480", customer: "Ibrahim Musa", amount: "₦82,000", status: "Processing" },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Seller Merchant Hub</Text>
        <TouchableOpacity style={styles.backBtn}>
          <Settings size={20} color="#1F2937" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Banner */}
        <View style={styles.welcomeBanner}>
          <Text style={styles.welcomeTag}>MERCHANT STORE ACTIVE</Text>
          <Text style={styles.storeName}>Abamba Official Store</Text>
          <Text style={styles.storeDesc}>
            Manage inventory, view customer orders, and withdraw store earnings.
          </Text>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => router.push("/seller/inventory" as any)}
          >
            <Plus size={16} color="#FFFFFF" />
            <Text style={styles.actionBtnText}>Add New Product</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Stats Grid */}
        <Text style={styles.sectionTitle}>Business Overview</Text>
        <View style={styles.statsGrid}>
          {stats.map((s, idx) => {
            const Icon = s.icon;
            return (
              <View key={idx} style={styles.statCard}>
                <View style={[styles.iconWrap, { backgroundColor: `${s.color}15` }]}>
                  <Icon size={20} color={s.color} />
                </View>
                <Text style={styles.statVal}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.title}</Text>
              </View>
            );
          })}
        </View>

        {/* Recent Orders Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Orders</Text>
          <TouchableOpacity onPress={() => router.push("/seller/orders" as any)}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.ordersList}>
          {recentOrders.map((ord) => (
            <View key={ord.id} style={styles.orderCard}>
              <View>
                <Text style={styles.orderId}>{ord.id}</Text>
                <Text style={styles.customerName}>{ord.customer}</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={styles.orderAmount}>{ord.amount}</Text>
                <View
                  style={[
                    styles.statusBadge,
                    ord.status === "Delivered"
                      ? styles.delivered
                      : ord.status === "In Transit"
                      ? styles.transit
                      : styles.processing,
                  ]}
                >
                  <Text style={styles.statusText}>{ord.status}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Store Actions Nav */}
        <View style={styles.shortcutRow}>
          <TouchableOpacity
            style={styles.shortcutBtn}
            onPress={() => router.push("/seller/inventory" as any)}
          >
            <Package size={20} color="#FF5500" />
            <Text style={styles.shortcutText}>Inventory</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shortcutBtn}
            onPress={() => router.push("/seller/wallet" as any)}
          >
            <DollarSign size={20} color="#FF5500" />
            <Text style={styles.shortcutText}>Wallet & Payouts</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
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
    color: "#111827",
  },
  scrollContent: {
    padding: 16,
  },
  welcomeBanner: {
    backgroundColor: "#111827",
    borderRadius: 14,
    padding: 18,
    marginBottom: 20,
  },
  welcomeTag: {
    color: "#FF5500",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
  },
  storeName: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "800",
    marginTop: 4,
  },
  storeDesc: {
    color: "#9CA3AF",
    fontSize: 12,
    marginTop: 4,
    lineHeight: 18,
    marginBottom: 14,
  },
  actionBtn: {
    backgroundColor: "#FF5500",
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  actionBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  statCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 12,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  statVal: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
  },
  statLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  seeAll: {
    fontSize: 13,
    color: "#FF5500",
    fontWeight: "600",
  },
  ordersList: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
    marginBottom: 20,
  },
  orderCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  orderId: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
  },
  customerName: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  orderAmount: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  delivered: {
    backgroundColor: "#ECFDF5",
  },
  transit: {
    backgroundColor: "#EFF6FF",
  },
  processing: {
    backgroundColor: "#FEF3C7",
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#374151",
  },
  shortcutRow: {
    flexDirection: "row",
    gap: 12,
  },
  shortcutBtn: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  shortcutText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1F2937",
  },
});

