import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  DollarSign,
  Package,
  TrendingUp,
  ShoppingBag,
  Plus,
  ArrowLeft,
  Clock,
  AlertCircle,
  ShieldCheck,
  RefreshCw,
  Store,
  Users,
  Truck,
  Star,
  Settings,
  Sparkles,
  ChevronRight,
  UserCheck,
  Menu,
  X,
  PieChart,
  LogOut,
  ExternalLink,
} from "lucide-react-native";
import { Modal } from "react-native";
import { useRouter } from "expo-router";
import { useAppDispatch } from "../../store";
import { setActiveMode, setIsApprovedSeller } from "../../store/slices/authSlice";
import { sellerService } from "../../services";
import appStorage from "../../services/storage";
import { useResponseModal } from "../../components/common/ResponseModalContext";

type VerificationStatus = "loading" | "not_registered" | "pending" | "rejected" | "approved";

export default function SellerDashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { showError } = useResponseModal();

  const [status, setStatus] = useState<VerificationStatus>("loading");
  const [sellerProfile, setSellerProfile] = useState<any>(null);
  const [statsData, setStatsData] = useState<any>(null);
  const [rejectionMessage, setRejectionMessage] = useState<string>("");
  const [refreshing, setRefreshing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Check seller verification status and fetch dashboard stats
  const checkStatusAndFetchData = useCallback(async () => {
    try {
      const token = (await appStorage.getItem("sellerToken")) || (await appStorage.getItem("token"));
      if (!token) {
        setStatus("not_registered");
        return;
      }

      // 1. Fetch current seller profile
      const profileRes = await sellerService.getProfile();
      const profile = profileRes?.data?.data || profileRes?.data;
      setSellerProfile(profile);

      // Evaluate business onboarding status
      const business = profile?.business;

      if (!business) {
        // No seller application submitted yet
        setStatus("not_registered");
        return;
      }

      if (business.approved === true) {
        setStatus("approved");
        dispatch(setIsApprovedSeller(true));
        // Save sellerToken if available
        if (profile?.token) {
          await appStorage.setItem("sellerToken", profile.token);
        }

        // 2. Fetch real dynamic store stats
        try {
          const statsRes = await sellerService.getStats();
          setStatsData(statsRes?.data?.data || statsRes?.data);
        } catch (statsErr) {
          console.warn("Could not fetch seller stats:", statsErr);
        }
      } else {
        // Business exists but not approved
        const message = business?.message?.trim();
        if (message) {
          setStatus("rejected");
          setRejectionMessage(message);
        } else {
          setStatus("pending");
        }
      }
    } catch (err: any) {
      const statusCode = err?.response?.status;
      if (statusCode === 404) {
        // Seller record doesn't exist yet
        setStatus("not_registered");
      } else if (statusCode === 401 || statusCode === 403) {
        // Not authenticated as seller
        setStatus("not_registered");
      } else {
        console.warn("Error checking seller status:", err?.message || err);
        // If offline or network glitch, default to pending verification check
        setStatus("pending");
      }
    }
  }, []);

  useEffect(() => {
    checkStatusAndFetchData();
  }, [checkStatusAndFetchData]);

  const handleSwitchToBuyer = async () => {
    await appStorage.setItem("appActiveMode", "buyer");
    dispatch(setActiveMode("buyer"));
    router.replace("/" as any);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await checkStatusAndFetchData();
    setRefreshing(false);
  };

  // 1. LOADING STATE
  if (status === "loading") {
    return (
      <View style={[styles.centerContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#003459" />
        <Text style={styles.loadingText}>Verifying merchant store status...</Text>
      </View>
    );
  }

  // 2. NOT REGISTERED (Prompt to complete onboarding)
  if (status === "not_registered") {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ArrowLeft size={22} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Seller Merchant Hub</Text>
          <View style={{ width: 32 }} />
        </View>

        <View style={styles.statusContentBox}>
          <Store size={64} color="#003459" />
          <Text style={styles.statusTitle}>Become an Abamba Seller</Text>
          <Text style={styles.statusDescription}>
            You haven't submitted a seller onboarding application yet. Register your business to start selling products across Nigeria.
          </Text>
          <TouchableOpacity
            style={styles.primaryActionButton}
            onPress={() => router.replace("/seller/onboarding" as any)}
          >
            <Text style={styles.primaryActionButtonText}>Start Seller Onboarding</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // 3. APPLICATION PENDING VERIFICATION
  if (status === "pending") {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ArrowLeft size={22} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Application Status</Text>
          <TouchableOpacity style={styles.backBtn} onPress={onRefresh}>
            <RefreshCw size={20} color="#003459" />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.statusScrollContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <View style={styles.statusCard}>
            <View style={styles.pendingIconWrap}>
              <Clock size={48} color="#D97706" />
            </View>
            <Text style={styles.statusBadgeText}>APPLICATION UNDER REVIEW</Text>
            <Text style={styles.statusTitle}>Verification In Progress</Text>
            <Text style={styles.statusDescription}>
              Your seller details and verification ID document have been submitted to the Abamba Admin compliance desk. Your merchant dashboard will activate once approved.
            </Text>

            <View style={styles.storeDetailsSummary}>
              <Text style={styles.summaryRowLabel}>Store Name:</Text>
              <Text style={styles.summaryRowValue}>
                {sellerProfile?.business?.businessName || sellerProfile?.name || "Merchant Store"}
              </Text>
            </View>

            <View style={styles.storeDetailsSummary}>
              <Text style={styles.summaryRowLabel}>Contact Phone:</Text>
              <Text style={styles.summaryRowValue}>
                {sellerProfile?.business?.businessPhone || sellerProfile?.phoneNumber || "Verified Phone"}
              </Text>
            </View>

            <View style={styles.storeDetailsSummary}>
              <Text style={styles.summaryRowLabel}>Fulfillment Hub:</Text>
              <Text style={styles.summaryRowValue}>
                {typeof sellerProfile?.business?.storeLocation === "object"
                  ? sellerProfile?.business?.storeLocation?.name ||
                    sellerProfile?.business?.storeLocation?.address ||
                    "Regional Hub"
                  : sellerProfile?.business?.storeLocation || "Regional Branch"}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.outlineRefreshButton}
              onPress={onRefresh}
              activeOpacity={0.85}
            >
              <RefreshCw size={18} color="#FFFFFF" />
              <Text style={styles.outlineRefreshButtonText}>Re-check Status</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => router.replace("/seller/onboarding" as any)}
            >
              <Text style={styles.secondaryButtonText}>Review Submitted Details</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  // 4. APPLICATION REJECTED
  if (status === "rejected") {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ArrowLeft size={22} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Application Status</Text>
          <View style={{ width: 32 }} />
        </View>

        <View style={styles.statusContentBox}>
          <View style={styles.rejectedIconWrap}>
            <AlertCircle size={48} color="#DC2626" />
          </View>
          <Text style={[styles.statusBadgeText, { color: "#DC2626" }]}>DOCUMENTS REJECTED</Text>
          <Text style={styles.statusTitle}>Action Required</Text>
          <Text style={styles.statusDescription}>
            {rejectionMessage ||
              "Your application could not be approved due to document or information discrepancies. Please re-upload your valid government ID."}
          </Text>

          <TouchableOpacity
            style={styles.primaryActionButton}
            onPress={() => router.replace("/seller/onboarding" as any)}
          >
            <Text style={styles.primaryActionButtonText}>Update Onboarding Details</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // 5. APPROVED SELLER: DYNAMIC DASHBOARD (Zero hard-coded data)
  const storeName =
    sellerProfile?.business?.businessName ||
    sellerProfile?.name ||
    "My Merchant Store";

  const totalRevenue = statsData?.stats?.sales?.total
    ? `₦${Number(statsData.stats.sales.total).toLocaleString()}`
    : statsData?.analytics?.thisWeek?.sales
    ? `₦${Number(statsData.analytics.thisWeek.sales).toLocaleString()}`
    : "₦0";

  const totalOrders = statsData?.stats?.orders?.total !== undefined
    ? String(statsData.stats.orders.total)
    : "0";

  const productsCount = statsData?.stats?.products?.total !== undefined
    ? String(statsData.stats.products.total)
    : "0";

  const activeCustomers = statsData?.stats?.customers?.total !== undefined
    ? String(statsData.stats.customers.total)
    : "0";

  const recentOrdersList: any[] = statsData?.recentOrders || [];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header with Side Menu Toggle */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.menuToggleBtn}
          onPress={() => setMenuOpen(true)}
          activeOpacity={0.7}
        >
          <Menu size={24} color="#003459" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Seller Merchant Hub</Text>
        <TouchableOpacity style={styles.backBtn} onPress={onRefresh}>
          <RefreshCw size={19} color="#1F2937" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Banner */}
        <View style={styles.welcomeBanner}>
          <View style={styles.verifiedTagRow}>
            <ShieldCheck size={14} color="#10B981" />
            <Text style={styles.welcomeTag}>VERIFIED MERCHANT</Text>
          </View>
          <Text style={styles.storeName}>{storeName}</Text>
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

        {/* Dynamic Business Overview Grid */}
        <Text style={styles.sectionTitle}>Business Overview</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={[styles.iconWrap, { backgroundColor: "#10B98115" }]}>
              <DollarSign size={20} color="#10B981" />
            </View>
            <Text style={styles.statVal}>{totalRevenue}</Text>
            <Text style={styles.statLabel}>Total Sales</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.iconWrap, { backgroundColor: "#3B82F615" }]}>
              <ShoppingBag size={20} color="#3B82F6" />
            </View>
            <Text style={styles.statVal}>{totalOrders}</Text>
            <Text style={styles.statLabel}>Total Orders</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.iconWrap, { backgroundColor: "#F59E0B15" }]}>
              <Package size={20} color="#F59E0B" />
            </View>
            <Text style={styles.statVal}>{productsCount}</Text>
            <Text style={styles.statLabel}>Products Listed</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.iconWrap, { backgroundColor: "#8B5CF615" }]}>
              <TrendingUp size={20} color="#8B5CF6" />
            </View>
            <Text style={styles.statVal}>{activeCustomers}</Text>
            <Text style={styles.statLabel}>Customers</Text>
          </View>
        </View>

        {/* Recent Orders Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Orders</Text>
        </View>

        {recentOrdersList.length === 0 ? (
          <View style={styles.emptyCard}>
            <Package size={36} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No Orders Yet</Text>
            <Text style={styles.emptySubtitle}>
              New customer orders placed for your store will appear here in real-time.
            </Text>
          </View>
        ) : (
          <View style={styles.ordersList}>
            {recentOrdersList.map((ord: any, idx: number) => (
              <View key={ord.id || ord._id || idx} style={styles.orderCard}>
                <View>
                  <Text style={styles.orderId}>#{ord.orderNumber || ord.id || `ORD-${idx + 1}`}</Text>
                  <Text style={styles.customerName}>{ord.customer?.name || "Customer"}</Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={styles.orderAmount}>
                    ₦{Number(ord.totalAmount || ord.total || 0).toLocaleString()}
                  </Text>
                  <View style={[styles.statusBadge, styles.transit]}>
                    <Text style={styles.statusText}>{ord.status || "Pending"}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Quick Shortcut Buttons */}
        <View style={styles.shortcutRow}>
          <TouchableOpacity
            style={styles.shortcutBtn}
            onPress={() => router.push("/seller/inventory" as any)}
          >
            <Package size={20} color="#003459" />
            <Text style={styles.shortcutText}>Inventory</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shortcutBtn}
            onPress={() => router.push("/seller/orders" as any)}
          >
            <ShoppingBag size={20} color="#003459" />
            <Text style={styles.shortcutText}>Orders</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shortcutBtn}
            onPress={() => router.push("/seller/wallet" as any)}
          >
            <DollarSign size={20} color="#003459" />
            <Text style={styles.shortcutText}>Wallet</Text>
          </TouchableOpacity>
        </View>

        {/* Switch to Buyer Mode */}
        <TouchableOpacity
          style={styles.switchToBuyerBtn}
          onPress={handleSwitchToBuyer}
          activeOpacity={0.8}
        >
          <UserCheck size={18} color="#003459" />
          <Text style={styles.switchToBuyerText}>Switch to Buyer Mode</Text>
        </TouchableOpacity>

        <View style={{ height: 60 }} />
      </ScrollView>

      {/* SELLER SIDEBAR MENU DRAWER (Exact Match to Web Sidebar) */}
      <Modal
        visible={menuOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setMenuOpen(false)}
      >
        <View style={styles.drawerBackdrop}>
          <TouchableOpacity
            style={styles.drawerDismissOverlay}
            activeOpacity={1}
            onPress={() => setMenuOpen(false)}
          />

          <View style={[styles.drawerContent, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 }]}>
            {/* Drawer Header */}
            <View style={styles.drawerHeader}>
              <View style={styles.drawerLogoWrap}>
                <Store size={22} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.drawerStoreName} numberOfLines={1}>
                  {storeName}
                </Text>
                <Text style={styles.drawerVerifiedBadge}>VERIFIED SELLER</Text>
              </View>
              <TouchableOpacity
                style={styles.drawerCloseBtn}
                onPress={() => setMenuOpen(false)}
              >
                <X size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.drawerDivider} />

            {/* Menu Nav Links List */}
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.drawerNavList}>
              {[
                { title: "Dashboard", icon: Store, route: "/seller/dashboard" },
                { title: "Orders", icon: ShoppingBag, route: "/seller/orders" },
                { title: "Customers", icon: Users, route: "/seller/customers" },
                { title: "Inventory", icon: Package, route: "/seller/inventory" },
                { title: "Shipping", icon: Truck, route: "/seller/shipping" },
                { title: "Wallet & Payouts", icon: DollarSign, route: "/seller/wallet" },
                { title: "Reviews", icon: Star, route: "/seller/reviews" },
                { title: "Ads for Sales", icon: Sparkles, route: "/seller/ads" },
                { title: "Store Settings", icon: Settings, route: "/seller/settings" },
              ].map((item, idx) => {
                const Icon = item.icon;
                const isCurrent = item.route === "/seller/dashboard";

                return (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.drawerNavItem, isCurrent && styles.drawerNavItemActive]}
                    onPress={() => {
                      setMenuOpen(false);
                      if (!isCurrent) {
                        router.push(item.route as any);
                      }
                    }}
                  >
                    <Icon size={19} color={isCurrent ? "#003459" : "#4B5563"} />
                    <Text style={[styles.drawerNavText, isCurrent && styles.drawerNavTextActive]}>
                      {item.title}
                    </Text>
                    {isCurrent && <View style={styles.drawerActiveDot} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.drawerDivider} />

            {/* Bottom Switch to Buyer Action */}
            <TouchableOpacity
              style={styles.drawerSwitchBuyerBtn}
              onPress={() => {
                setMenuOpen(false);
                handleSwitchToBuyer();
              }}
            >
              <UserCheck size={18} color="#003459" />
              <Text style={styles.drawerSwitchBuyerText}>Switch to Buyer Mode</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  centerContainer: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 14,
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
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
    padding: 6,
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
    backgroundColor: "#003459",
    borderRadius: 14,
    padding: 18,
    marginBottom: 20,
  },
  verifiedTagRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  welcomeTag: {
    color: "#34D399",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
  },
  storeName: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "800",
    marginTop: 6,
  },
  storeDesc: {
    color: "#BAE6FD",
    fontSize: 12.5,
    marginTop: 4,
    lineHeight: 18,
    marginBottom: 14,
  },
  actionBtn: {
    backgroundColor: "#FF5500",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: "flex-start",
    gap: 6,
  },
  actionBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
    gap: 10,
  },
  statCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
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
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
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
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  orderId: {
    fontSize: 14,
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
    color: "#003459",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 4,
  },
  transit: {
    backgroundColor: "#FEF3C7",
  },
  statusText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#92400E",
  },
  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 24,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#374151",
    marginTop: 10,
  },
  emptySubtitle: {
    fontSize: 12.5,
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 4,
    lineHeight: 18,
  },
  shortcutRow: {
    flexDirection: "row",
    gap: 12,
  },
  shortcutBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
  },
  shortcutText: {
    fontSize: 13.5,
    fontWeight: "700",
    color: "#003459",
  },
  statusContentBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  statusScrollContainer: {
    padding: 20,
  },
  statusCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  pendingIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FEF3C7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  rejectedIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#D97706",
    letterSpacing: 1,
    marginBottom: 6,
  },
  statusTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#111827",
    textAlign: "center",
    marginBottom: 8,
  },
  statusDescription: {
    fontSize: 13.5,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  storeDetailsSummary: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  summaryRowLabel: {
    fontSize: 13,
    color: "#6B7280",
  },
  summaryRowValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
  },
  outlineRefreshButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#003459",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    width: "100%",
    marginTop: 22,
    gap: 10,
    shadowColor: "#003459",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 3,
  },
  outlineRefreshButtonText: {
    fontSize: 14.5,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },
  secondaryButton: {
    paddingVertical: 12,
    marginTop: 8,
  },
  secondaryButtonText: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "600",
  },
  primaryActionButton: {
    backgroundColor: "#003459",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
    marginTop: 10,
  },
  menuToggleBtn: {
    padding: 6,
  },
  drawerBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    flexDirection: "row",
  },
  drawerDismissOverlay: {
    flex: 1,
  },
  drawerContent: {
    width: "78%",
    maxWidth: 320,
    backgroundColor: "#FFFFFF",
    height: "100%",
    elevation: 20,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    paddingHorizontal: 16,
  },
  drawerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
  },
  drawerLogoWrap: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: "#003459",
    alignItems: "center",
    justifyContent: "center",
  },
  drawerStoreName: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111827",
  },
  drawerVerifiedBadge: {
    fontSize: 10,
    fontWeight: "800",
    color: "#059669",
    letterSpacing: 0.5,
    marginTop: 2,
  },
  drawerCloseBtn: {
    padding: 6,
  },
  drawerDivider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginVertical: 10,
  },
  drawerNavList: {
    paddingVertical: 4,
    gap: 4,
  },
  drawerNavItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 12,
  },
  drawerNavItemActive: {
    backgroundColor: "#F0F9FF",
  },
  drawerNavText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    flex: 1,
  },
  drawerNavTextActive: {
    color: "#003459",
    fontWeight: "800",
  },
  drawerActiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#003459",
  },
  drawerSwitchBuyerBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0F9FF",
    borderWidth: 1,
    borderColor: "#BAE6FD",
    borderRadius: 12,
    paddingVertical: 12,
    gap: 8,
    marginTop: 4,
  },
  drawerSwitchBuyerText: {
    fontSize: 13.5,
    fontWeight: "700",
    color: "#003459",
  },
  primaryActionButtonText: {
    color: "#FFFFFF",
    fontSize: 14.5,
    fontWeight: "700",
  },
  modulesGrid: {
    gap: 10,
    marginBottom: 20,
  },
  moduleItemCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 12,
  },
  moduleIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  moduleItemTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  moduleItemSub: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  switchToBuyerBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0F9FF",
    borderWidth: 1,
    borderColor: "#BAE6FD",
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  switchToBuyerText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#003459",
  },
});
