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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Search,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  Package,
  Calendar,
  User,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { sellerService } from "../../services";

export default function SellerShippingModuleScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState("");
  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchShipments = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch seller shipments or seller orders with shipping info
      const res = await sellerService.getOrders();
      const list =
        res?.data?.data?.orders ||
        res?.data?.orders ||
        res?.data?.data ||
        [];

      // Map orders to shipment records with shipping company and tracking details
      const mapped = (Array.isArray(list) ? list : []).map((order, idx) => ({
        id: order._id || `shp_${idx}`,
        shipmentId: order.orderId ? `SHP-${order.orderId}` : `SHP-00${idx + 1}`,
        customerName: order.user?.name || "Customer",
        shipmentCompany: order.shippingCarrier || order.carrier || "Abamba Logistics (ShipBubble)",
        shipmentDate: order.createdAt
          ? new Date(order.createdAt).toLocaleDateString()
          : "Recently Dispatched",
        arrivalDate: order.estimatedDeliveryDate
          ? new Date(order.estimatedDeliveryDate).toLocaleDateString()
          : "2-4 Business Days",
        status: order.status === "delivered" ? "Delivered" : order.status === "shipped" ? "Shipped" : "In Transit",
        address: order.shippingAddress?.city
          ? `${order.shippingAddress?.city}, ${order.shippingAddress?.state || ""}`
          : "Nigeria",
      }));

      setShipments(mapped);
    } catch (err: any) {
      console.warn("Error fetching seller shipping data:", err);
      setShipments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchShipments();
  }, [fetchShipments]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchShipments();
    setRefreshing(false);
  };

  const filteredShipments = shipments.filter((s) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      s.customerName.toLowerCase().includes(term) ||
      s.shipmentId.toLowerCase().includes(term) ||
      s.shipmentCompany.toLowerCase().includes(term)
    );
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Seller Shipping & Logistics</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Search Input */}
      <View style={styles.searchBar}>
        <Search size={18} color="#9CA3AF" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by shipment ID, courier or buyer..."
          placeholderTextColor="#9CA3AF"
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#003459" />
          <Text style={styles.loadingText}>Loading shipments...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {filteredShipments.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Truck size={48} color="#9CA3AF" />
              <Text style={styles.emptyTitle}>No Shipments Yet</Text>
              <Text style={styles.emptySubtitle}>
                {searchTerm
                  ? "No shipments match your search filter."
                  : "Shipments and fulfillment packages will appear here once orders are dispatched."}
              </Text>
            </View>
          ) : (
            filteredShipments.map((s) => {
              const isDelivered = s.status === "Delivered";

              return (
                <View key={s.id} style={styles.shipmentCard}>
                  <View style={styles.cardTop}>
                    <View style={styles.carrierWrap}>
                      <Truck size={16} color="#003459" />
                      <Text style={styles.carrierText}>{s.shipmentCompany}</Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        isDelivered ? styles.deliveredBadge : styles.transitBadge,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          isDelivered ? styles.deliveredText : styles.transitText,
                        ]}
                      >
                        {s.status}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.shipmentId}>{s.shipmentId}</Text>

                  <View style={styles.metaRow}>
                    <User size={14} color="#6B7280" />
                    <Text style={styles.metaText}>{s.customerName} • {s.address}</Text>
                  </View>

                  <View style={styles.datesRow}>
                    <View style={styles.dateCol}>
                      <Text style={styles.dateLabel}>Dispatched:</Text>
                      <Text style={styles.dateValue}>{s.shipmentDate}</Text>
                    </View>
                    <View style={styles.dateCol}>
                      <Text style={styles.dateLabel}>Est. Arrival:</Text>
                      <Text style={styles.dateValue}>{s.arrivalDate}</Text>
                    </View>
                  </View>
                </View>
              );
            })
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
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
  shipmentCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  carrierWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  carrierText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#003459",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  deliveredBadge: {
    backgroundColor: "#ECFDF5",
  },
  transitBadge: {
    backgroundColor: "#EFF6FF",
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  deliveredText: {
    color: "#059669",
  },
  transitText: {
    color: "#2563EB",
  },
  shipmentId: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111827",
    marginTop: 8,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
  metaText: {
    fontSize: 12.5,
    color: "#4B5563",
  },
  datesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  dateCol: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 11,
    color: "#9CA3AF",
  },
  dateValue: {
    fontSize: 12.5,
    fontWeight: "600",
    color: "#111827",
    marginTop: 2,
  },
});
