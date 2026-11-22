import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Search,
  User,
  Users,
  ShoppingBag,
  Mail,
  Phone,
  Calendar,
  X,
  CreditCard,
  ChevronRight,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { sellerService } from "../../services";

export default function SellerCustomersModuleScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState("");
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [customerModalVisible, setCustomerModalVisible] = useState(false);

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await sellerService.getCustomers();
      const list =
        res?.data?.data?.customers ||
        res?.data?.customers ||
        res?.data?.data ||
        res?.data ||
        [];
      setCustomers(Array.isArray(list) ? list : []);
    } catch (err: any) {
      console.warn("Error fetching seller customers:", err);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCustomers();
    setRefreshing(false);
  };

  const filteredCustomers = customers.filter((c) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const name = String(c.name || "").toLowerCase();
    const email = String(c.email || "").toLowerCase();
    const phone = String(c.phoneNumber || "").toLowerCase();
    return name.includes(term) || email.includes(term) || phone.includes(term);
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Seller Customers</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Metrics Bar */}
      <View style={styles.metricsBar}>
        <View style={styles.metricItem}>
          <Text style={styles.metricVal}>{customers.length}</Text>
          <Text style={styles.metricLabel}>Total Customers</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricItem}>
          <Text style={styles.metricVal}>
            ₦
            {customers
              .reduce((acc, c) => acc + Number(c.totalSpent || 0), 0)
              .toLocaleString()}
          </Text>
          <Text style={styles.metricLabel}>Customer Lifetime Sales</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBar}>
        <Search size={18} color="#9CA3AF" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by customer name, email or phone..."
          placeholderTextColor="#9CA3AF"
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#003459" />
          <Text style={styles.loadingText}>Fetching customers...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {filteredCustomers.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Users size={48} color="#9CA3AF" />
              <Text style={styles.emptyTitle}>No Customers Found</Text>
              <Text style={styles.emptySubtitle}>
                {searchTerm
                  ? "No customer matches your search filter."
                  : "Customers who place orders at your store will automatically be recorded here."}
              </Text>
            </View>
          ) : (
            filteredCustomers.map((cust) => {
              const name = cust.name || "Customer";
              const email = cust.email || "No email";
              const orderCount = cust.orderCount ?? cust.orders?.length ?? 1;
              const totalSpent = Number(cust.totalSpent || 0);

              return (
                <TouchableOpacity
                  key={cust._id || cust.id}
                  style={styles.customerCard}
                  onPress={() => {
                    setSelectedCustomer(cust);
                    setCustomerModalVisible(true);
                  }}
                  activeOpacity={0.8}
                >
                  <View style={styles.avatarWrap}>
                    <Text style={styles.avatarText}>
                      {name.charAt(0).toUpperCase()}
                    </Text>
                  </View>

                  <View style={styles.customerInfo}>
                    <Text style={styles.customerName}>{name}</Text>
                    <Text style={styles.customerEmail}>{email}</Text>
                    <View style={styles.customerStatsRow}>
                      <Text style={styles.statsBadge}>
                        {orderCount} {orderCount === 1 ? "order" : "orders"}
                      </Text>
                      <Text style={styles.statsSpent}>
                        ₦{totalSpent.toLocaleString()} spent
                      </Text>
                    </View>
                  </View>

                  <ChevronRight size={18} color="#9CA3AF" />
                </TouchableOpacity>
              );
            })
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* CUSTOMER DETAIL MODAL */}
      <Modal
        visible={customerModalVisible}
        animationType="slide"
        onRequestClose={() => setCustomerModalVisible(false)}
      >
        <View style={[styles.modalWrap, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>{selectedCustomer?.name || "Customer Profile"}</Text>
              <Text style={styles.modalSubtitle}>Buyer History & Details</Text>
            </View>
            <TouchableOpacity onPress={() => setCustomerModalVisible(false)} style={styles.closeBtn}>
              <X size={22} color="#1F2937" />
            </TouchableOpacity>
          </View>

          {selectedCustomer && (
            <ScrollView contentContainerStyle={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.modalProfileCard}>
                <View style={styles.largeAvatar}>
                  <Text style={styles.largeAvatarText}>
                    {(selectedCustomer.name || "C").charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.modalProfileName}>{selectedCustomer.name}</Text>
                <Text style={styles.modalProfileEmail}>{selectedCustomer.email || "No Email Provided"}</Text>
              </View>

              <View style={styles.detailSectionCard}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Contact Phone:</Text>
                  <Text style={styles.detailValue}>{selectedCustomer.phoneNumber || "—"}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Total Orders Placed:</Text>
                  <Text style={styles.detailValue}>
                    {selectedCustomer.orderCount ?? selectedCustomer.orders?.length ?? 1}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Lifetime Value:</Text>
                  <Text style={[styles.detailValue, { color: "#003459", fontWeight: "800" }]}>
                    ₦{Number(selectedCustomer.totalSpent || 0).toLocaleString()}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status:</Text>
                  <Text style={[styles.detailValue, { color: "#059669", fontWeight: "700" }]}>
                    {selectedCustomer.lastLoginAt ? "Active Buyer" : "Customer"}
                  </Text>
                </View>
              </View>

              <View style={{ height: 30 }} />
            </ScrollView>
          )}
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
  metricsBar: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  metricItem: {
    flex: 1,
    alignItems: "center",
  },
  metricVal: {
    fontSize: 16,
    fontWeight: "800",
    color: "#003459",
  },
  metricLabel: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    backgroundColor: "#E5E7EB",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#111827",
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: "#6B7280",
  },
  scrollContent: {
    padding: 16,
  },
  emptyContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#374151",
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
  },
  customerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  avatarWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#003459",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  customerEmail: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  customerStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    gap: 8,
  },
  statsBadge: {
    fontSize: 11,
    backgroundColor: "#F3F4F6",
    color: "#4B5563",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontWeight: "600",
  },
  statsSpent: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#059669",
  },
  modalWrap: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
  },
  modalSubtitle: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  modalBody: {
    padding: 16,
  },
  modalProfileCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  largeAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#003459",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  largeAvatarText: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "800",
  },
  modalProfileName: {
    fontSize: 17,
    fontWeight: "800",
    color: "#111827",
  },
  modalProfileEmail: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },
  detailSectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  detailLabel: {
    fontSize: 13,
    color: "#6B7280",
  },
  detailValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
  },
});
