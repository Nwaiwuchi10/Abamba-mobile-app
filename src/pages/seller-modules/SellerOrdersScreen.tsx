import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Image,
  Modal,
  Alert,
  Share,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Search,
  ShoppingBag,
  Eye,
  Calendar,
  User,
  CreditCard,
  MapPin,
  X,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight,
  Filter,
  CheckSquare,
  Square,
  Trash2,
  Share2,
  Package,
  Clock,
  ArrowUpDown,
  CheckCircle,
  Truck,
  AlertCircle,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { sellerService } from "../../services";

// Helper for formatted date
function formatDate(dateInput: any) {
  if (!dateInput) return "—";
  try {
    const d = new Date(dateInput);
    return d.toLocaleDateString("en-NG", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return String(dateInput);
  }
}

// Helper to format currency
function formatNaira(amount: number | string | undefined | null) {
  const val = Number(amount || 0);
  return `₦${val.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Status badge component matching web
function StatusBadge({ status }: { status?: string }) {
  const s = (status || "").toLowerCase().trim();
  let bg = "#F3F4F6";
  let text = "#4B5563";
  let label = status || "Unknown";

  switch (s) {
    case "abandoned":
      bg = "#F3F4F6";
      text = "#6B7280";
      label = "Abandoned Checkout";
      break;
    case "pending":
      bg = "#FEF3C7";
      text = "#D97706";
      label = "Pending Payment";
      break;
    case "paid":
    case "processing":
      bg = "#EFF6FF";
      text = "#2563EB";
      label = "Processing (Paid)";
      break;
    case "shipped":
      bg = "#F5F3FF";
      text = "#7C3AED";
      label = "In Transit";
      break;
    case "delivered":
    case "completed":
      bg = "#ECFDF5";
      text = "#059669";
      label = "Delivered";
      break;
    case "cancelled":
      bg = "#FEE2E2";
      text = "#DC2626";
      label = "Cancelled";
      break;
  }

  return (
    <View style={[styles.badgeContainer, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color: text }]}>{label}</Text>
    </View>
  );
}

export default function SellerOrdersModuleScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Web exact states
  const [activeTab, setActiveTab] = useState<string>("all"); // 'all' | 'active' | 'completed' | 'cancelled_abandoned'
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [displayStyle, setDisplayStyle] = useState<"descending" | "ascending">("descending");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Status Filter Modal & Sort Modal
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [sortModalVisible, setSortModalVisible] = useState(false);

  // Data fetching
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Dynamic View Order (matches web dynamic-order.jsx)
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [detailSearchTerm, setDetailSearchTerm] = useState("");
  const [detailSortConfig, setDetailSortConfig] = useState<"price" | "name">("price");

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await sellerService.getOrders({
        page: currentPage,
        limit: 100, // fetch full list so tab filters & client pagination match web
        sort: displayStyle === "ascending" ? "createdAt" : "-createdAt",
      });
      const list =
        res?.data?.data?.orders ||
        res?.data?.orders ||
        res?.data?.data ||
        res?.data ||
        [];
      setOrders(Array.isArray(list) ? list : []);
    } catch (err: any) {
      console.warn("Error fetching seller orders:", err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, displayStyle]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  // Filter pipeline identical to web seller-orders.jsx
  const filteredOrders = useMemo(() => {
    let list = [...orders];

    // 1. Tab classification
    if (activeTab === "active") {
      list = list.filter((o) =>
        ["paid", "processing", "shipped"].includes((o.status || "").toLowerCase())
      );
    } else if (activeTab === "completed") {
      list = list.filter((o) =>
        ["delivered", "completed"].includes((o.status || "").toLowerCase())
      );
    } else if (activeTab === "cancelled_abandoned") {
      list = list.filter((o) =>
        ["cancelled", "abandoned"].includes((o.status || "").toLowerCase())
      );
    }

    // 2. Status dropdown/modal filter
    if (statusFilter !== "all") {
      list = list.filter(
        (o) => (o.status || "").toLowerCase() === statusFilter.toLowerCase()
      );
    }

    // 3. Search query filter
    if (debouncedSearchTerm.trim()) {
      const q = debouncedSearchTerm.toLowerCase();
      list = list.filter((o) => {
        const id = String(o.orderId || o._id || "").toLowerCase();
        const customer = String(o.user?.name || "").toLowerCase();
        return id.includes(q) || customer.includes(q);
      });
    }

    // 4. Sort display style
    list.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return displayStyle === "ascending" ? dateA - dateB : dateB - dateA;
    });

    return list;
  }, [orders, activeTab, statusFilter, debouncedSearchTerm, displayStyle]);

  // Client-side pagination matching web
  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE) || 1;
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredOrders.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredOrders, currentPage]);

  const handleSelectOrder = (id: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedOrderIds.length === paginatedOrders.length && paginatedOrders.length > 0) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(paginatedOrders.map((o) => o._id || o.id));
    }
  };

  // Bulk actions matching web (Accept, Ship, Deliver, Delete)
  const handleBulkAction = (action: "accept" | "ship" | "deliver" | "delete") => {
    if (selectedOrderIds.length === 0) {
      Alert.alert("No Orders Selected", "Please select one or more orders to apply this action.");
      return;
    }

    if (action === "delete") {
      Alert.alert(
        "Are you absolutely sure?",
        `This action will permanently delete ${selectedOrderIds.length} selected ${
          selectedOrderIds.length === 1 ? "order" : "orders"
        }. This cannot be undone.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => {
              setOrders((prev) => prev.filter((o) => !selectedOrderIds.includes(o._id || o.id)));
              setSelectedOrderIds([]);
              Alert.alert("Deleted", "Selected orders have been removed.");
            },
          },
        ]
      );
      return;
    }

    const actionText = action.toUpperCase();
    Alert.alert(
      `Mark orders as ${actionText}`,
      `Would you like to mark ${selectedOrderIds.length} order(s) as ${action}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            const newStatus = action === "accept" ? "processing" : action === "ship" ? "shipped" : "delivered";
            setOrders((prev) =>
              prev.map((o) =>
                selectedOrderIds.includes(o._id || o.id) ? { ...o, status: newStatus } : o
              )
            );
            setSelectedOrderIds([]);
            Alert.alert("Updated", `Orders marked as ${newStatus}.`);
          },
        },
      ]
    );
  };

  // Dynamic order items filtered & sorted for detail modal
  const dynamicOrderProducts = useMemo(() => {
    if (!selectedOrder?.items) return [];
    let items = [...selectedOrder.items];
    if (detailSearchTerm.trim()) {
      const q = detailSearchTerm.toLowerCase();
      items = items.filter((p: any) =>
        String(p.name || p.product?.name || "").toLowerCase().includes(q)
      );
    }
    if (detailSortConfig === "price") {
      items.sort((a: any, b: any) => Number(b.price || 0) - Number(a.price || 0));
    } else if (detailSortConfig === "name") {
      items.sort((a: any, b: any) =>
        String(a.name || a.product?.name || "").localeCompare(String(b.name || b.product?.name || ""))
      );
    }
    return items;
  }, [selectedOrder, detailSearchTerm, detailSortConfig]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color="#1F2937" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Orders</Text>
          <View style={styles.orderCountPill}>
            <Text style={styles.orderCountPillText}>
              {filteredOrders.length} {filteredOrders.length === 1 ? "order" : "orders"}
            </Text>
          </View>
        </View>
        <View style={{ width: 32 }} />
      </View>

      {/* Tabs Navigation matching Web: All Orders | Active | Completed | Cancelled / Abandoned */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
          {[
            { id: "all", label: "All Orders" },
            { id: "active", label: "Active" },
            { id: "completed", label: "Completed" },
            { id: "cancelled_abandoned", label: "Cancelled / Abandoned" },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tabButton, isActive && styles.tabButtonActive]}
                onPress={() => {
                  setActiveTab(tab.id);
                  setCurrentPage(1);
                }}
              >
                <Text style={[styles.tabButtonText, isActive && styles.tabButtonTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Search & Filter Controls */}
      <View style={styles.controlsRow}>
        <View style={styles.searchBox}>
          <Search size={16} color="#9CA3AF" style={{ marginRight: 6 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by Order ID or Customer"
            placeholderTextColor="#9CA3AF"
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity onPress={() => setSearchTerm("")}>
              <X size={16} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={styles.filterBtn}
          onPress={() => setStatusModalVisible(true)}
        >
          <Filter size={15} color="#4B5563" />
          <Text style={styles.filterBtnText} numberOfLines={1}>
            {statusFilter === "all" ? "Status" : statusFilter.toUpperCase()}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.filterBtn}
          onPress={() => setSortModalVisible(true)}
        >
          <ArrowUpDown size={15} color="#4B5563" />
          <Text style={styles.filterBtnText}>
            {displayStyle === "descending" ? "Newest" : "Oldest"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Bulk Action Bar (Visible when items selected) */}
      {selectedOrderIds.length > 0 && (
        <View style={styles.bulkActionBar}>
          <View style={styles.bulkSelectedCount}>
            <Text style={styles.bulkCountText}>{selectedOrderIds.length} selected</Text>
          </View>
          <View style={styles.bulkButtonsGroup}>
            <TouchableOpacity
              style={[styles.bulkBtn, { backgroundColor: "#003459" }]}
              onPress={() => handleBulkAction("accept")}
            >
              <Text style={styles.bulkBtnText}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.bulkBtn, { backgroundColor: "#7C3AED" }]}
              onPress={() => handleBulkAction("ship")}
            >
              <Text style={styles.bulkBtnText}>Ship</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.bulkBtn, { backgroundColor: "#059669" }]}
              onPress={() => handleBulkAction("deliver")}
            >
              <Text style={styles.bulkBtnText}>Deliver</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.bulkBtn, { backgroundColor: "#DC2626" }]}
              onPress={() => handleBulkAction("delete")}
            >
              <Trash2 size={13} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Select All Row */}
      {paginatedOrders.length > 0 && (
        <View style={styles.selectAllRow}>
          <TouchableOpacity style={styles.selectAllCheckbox} onPress={handleSelectAll}>
            {selectedOrderIds.length === paginatedOrders.length && paginatedOrders.length > 0 ? (
              <CheckSquare size={18} color="#003459" />
            ) : (
              <Square size={18} color="#9CA3AF" />
            )}
            <Text style={styles.selectAllText}>Select All on This Page</Text>
          </TouchableOpacity>
          <Text style={styles.pageInfoText}>
            Page {currentPage} of {totalPages}
          </Text>
        </View>
      )}

      {/* Orders List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#003459" />
          <Text style={styles.loadingText}>Loading orders...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {filteredOrders.length === 0 ? (
            <View style={styles.emptyContainer}>
              <ShoppingBag size={52} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>No Orders Found</Text>
              <Text style={styles.emptySubtitle}>
                {searchTerm
                  ? "No orders match your search term."
                  : "You do not have any orders under this category."}
              </Text>
            </View>
          ) : (
            paginatedOrders.map((order) => {
              const orderId = order.orderId || String(order._id || "").slice(-8) || "N/A";
              const isSelected = selectedOrderIds.includes(order._id || order.id);
              const customerName = order.user?.name || "Customer";
              const dateStr = formatDate(order.createdAt);
              const totalAmount = Number(order.total || 0);
              const itemsCount = order.items?.length || 1;

              return (
                <View
                  key={order._id || order.id}
                  style={[styles.orderCard, isSelected && styles.orderCardSelected]}
                >
                  {/* Top Bar: Checkbox + Order ID + Status */}
                  <View style={styles.cardHeaderRow}>
                    <TouchableOpacity
                      onPress={() => handleSelectOrder(order._id || order.id)}
                      style={styles.cardCheckbox}
                    >
                      {isSelected ? (
                        <CheckSquare size={19} color="#003459" />
                      ) : (
                        <Square size={19} color="#9CA3AF" />
                      )}
                    </TouchableOpacity>

                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <Text style={styles.cardOrderId}>#{orderId}</Text>
                      <Text style={styles.cardDate}>{dateStr}</Text>
                    </View>

                    <StatusBadge status={order.status} />
                  </View>

                  <View style={styles.cardDivider} />

                  {/* Middle: Customer + Total */}
                  <View style={styles.cardBodyRow}>
                    <View style={styles.customerInfoWrap}>
                      <View style={styles.avatarIconWrap}>
                        <User size={14} color="#003459" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.customerName} numberOfLines={1}>
                          {customerName}
                        </Text>
                        <Text style={styles.customerSubText}>
                          {itemsCount} {itemsCount === 1 ? "item" : "items"}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.totalWrap}>
                      <Text style={styles.totalLabel}>Total</Text>
                      <Text style={styles.totalValue}>{formatNaira(totalAmount)}</Text>
                    </View>
                  </View>

                  <View style={styles.cardDivider} />

                  {/* Bottom: View Order Action Button (Matching Web Table Action) */}
                  <View style={styles.cardFooterRow}>
                    <TouchableOpacity
                      style={styles.viewOrderBtn}
                      onPress={() => {
                        setSelectedOrder(order);
                        setDetailModalVisible(true);
                      }}
                    >
                      <Eye size={15} color="#FFFFFF" />
                      <Text style={styles.viewOrderBtnText}>View Order</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}

          {/* Pagination Controls matching Web */}
          {filteredOrders.length > 0 && (
            <View style={styles.paginationWrap}>
              <Text style={styles.paginationText}>
                Showing page {currentPage} of {totalPages}
              </Text>
              <View style={styles.paginationButtons}>
                <TouchableOpacity
                  style={[styles.pageNavBtn, currentPage === 1 && styles.pageNavBtnDisabled]}
                  onPress={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft size={18} color={currentPage === 1 ? "#9CA3AF" : "#111827"} />
                </TouchableOpacity>
                <View style={styles.pageNumberBadge}>
                  <Text style={styles.pageNumberBadgeText}>{currentPage}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.pageNavBtn, currentPage >= totalPages && styles.pageNavBtnDisabled]}
                  onPress={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                >
                  <ChevronRight size={18} color={currentPage >= totalPages ? "#9CA3AF" : "#111827"} />
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* STATUS FILTER MODAL */}
      <Modal
        visible={statusModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setStatusModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setStatusModalVisible(false)}
        >
          <View style={styles.pickerModalContent}>
            <Text style={styles.pickerModalTitle}>Filter by Status</Text>
            {[
              { id: "all", label: "All Statuses" },
              { id: "pending", label: "Pending" },
              { id: "paid", label: "Paid" },
              { id: "processing", label: "Processing" },
              { id: "shipped", label: "Shipped" },
              { id: "delivered", label: "Delivered" },
              { id: "cancelled", label: "Cancelled" },
              { id: "abandoned", label: "Abandoned" },
            ].map((st) => (
              <TouchableOpacity
                key={st.id}
                style={[
                  styles.pickerOption,
                  statusFilter === st.id && styles.pickerOptionSelected,
                ]}
                onPress={() => {
                  setStatusFilter(st.id);
                  setStatusModalVisible(false);
                  setCurrentPage(1);
                }}
              >
                <Text
                  style={[
                    styles.pickerOptionText,
                    statusFilter === st.id && styles.pickerOptionTextSelected,
                  ]}
                >
                  {st.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* SORT ORDER MODAL */}
      <Modal
        visible={sortModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSortModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSortModalVisible(false)}
        >
          <View style={styles.pickerModalContent}>
            <Text style={styles.pickerModalTitle}>Sort Display Style</Text>
            {[
              { id: "descending", label: "Newest First" },
              { id: "ascending", label: "Oldest First" },
            ].map((opt) => (
              <TouchableOpacity
                key={opt.id}
                style={[
                  styles.pickerOption,
                  displayStyle === opt.id && styles.pickerOptionSelected,
                ]}
                onPress={() => {
                  setDisplayStyle(opt.id as any);
                  setSortModalVisible(false);
                }}
              >
                <Text
                  style={[
                    styles.pickerOptionText,
                    displayStyle === opt.id && styles.pickerOptionTextSelected,
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* DYNAMIC ORDER DETAILS MODAL (1:1 with Web DynamicOrder) */}
      <Modal
        visible={detailModalVisible}
        animationType="slide"
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View style={[styles.detailModalContainer, { paddingTop: insets.top }]}>
          {/* Header */}
          <View style={styles.detailHeader}>
            <TouchableOpacity
              onPress={() => setDetailModalVisible(false)}
              style={styles.detailBackBtn}
            >
              <ArrowLeft size={20} color="#111827" />
              <Text style={styles.detailBackBtnText}>Back</Text>
            </TouchableOpacity>

            <View style={{ alignItems: "center" }}>
              <Text style={styles.detailHeaderTitle}>
                Order #{selectedOrder?.orderId || selectedOrder?._id?.slice(-8)}
              </Text>
              <Text style={styles.detailHeaderSubtitle}>
                {formatDate(selectedOrder?.createdAt)}
              </Text>
            </View>

            <TouchableOpacity
              onPress={async () => {
                if (!selectedOrder) return;
                try {
                  await Share.share({
                    message: `Order #${selectedOrder.orderId || selectedOrder._id} Details\nCustomer: ${
                      selectedOrder.user?.name || "Customer"
                    }\nTotal: ${formatNaira(selectedOrder.total)}`,
                  });
                } catch (e) {
                  console.warn(e);
                }
              }}
              style={styles.detailShareBtn}
            >
              <Share2 size={18} color="#003459" />
            </TouchableOpacity>
          </View>

          {selectedOrder && (
            <ScrollView
              contentContainerStyle={styles.detailScroll}
              showsVerticalScrollIndicator={false}
            >
              {/* Card 1: Customer Profile */}
              <View style={styles.summaryCard}>
                <View style={styles.summaryCardHeader}>
                  <View style={styles.summaryIconWrap}>
                    <User size={18} color="#003459" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.summaryCardTitle}>
                      {selectedOrder.user?.name || "Customer"}
                    </Text>
                    <Text style={styles.summaryCardSub}>Customer Profile</Text>
                  </View>
                  <StatusBadge status={selectedOrder.status} />
                </View>

                <View style={styles.summaryDivider} />

                <View style={styles.infoRowGrid}>
                  <View style={styles.infoGridCol}>
                    <Text style={styles.infoGridLabel}>Phone</Text>
                    <Text style={styles.infoGridValue}>
                      {selectedOrder.shippingAddress?.phoneNumber || selectedOrder.user?.phoneNumber || "—"}
                    </Text>
                  </View>
                  <View style={styles.infoGridCol}>
                    <Text style={styles.infoGridLabel}>Email</Text>
                    <Text style={styles.infoGridValue} numberOfLines={1}>
                      {selectedOrder.user?.email || "—"}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Card 2: Shipping Address */}
              <View style={styles.summaryCard}>
                <View style={styles.summaryCardHeader}>
                  <View style={styles.summaryIconWrap}>
                    <MapPin size={18} color="#003459" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.summaryCardTitle}>Shipping Address</Text>
                    <Text style={styles.summaryCardSub}>Delivery Destination</Text>
                  </View>
                </View>

                <View style={styles.summaryDivider} />

                <Text style={styles.addressFullText}>
                  {selectedOrder.shippingAddress?.addressLine1 || "No street address"}
                  {selectedOrder.shippingAddress?.city ? `, ${selectedOrder.shippingAddress.city}` : ""}
                  {selectedOrder.shippingAddress?.state ? `, ${selectedOrder.shippingAddress.state}` : ""}
                  {selectedOrder.shippingAddress?.zipCode ? ` - ${selectedOrder.shippingAddress.zipCode}` : ""}
                </Text>
              </View>

              {/* Card 3: Payment Breakdown & Seller Net Earnings */}
              <View style={styles.summaryCard}>
                <View style={styles.summaryCardHeader}>
                  <View style={styles.summaryIconWrap}>
                    <CreditCard size={18} color="#003459" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.summaryCardTitle}>Payment Details</Text>
                    <Text style={styles.summaryCardSub}>
                      {selectedOrder.payment?.method || selectedOrder.paymentMethod || "Paystack"}
                    </Text>
                  </View>
                </View>

                <View style={styles.summaryDivider} />

                {/* Subtotal */}
                <View style={styles.paymentLineRow}>
                  <Text style={styles.paymentLineLabel}>Subtotal</Text>
                  <Text style={styles.paymentLineVal}>
                    {formatNaira(selectedOrder.subtotal || selectedOrder.total)}
                  </Text>
                </View>

                {/* Shipping */}
                <View style={styles.paymentLineRow}>
                  <Text style={styles.paymentLineLabel}>Shipping</Text>
                  <Text style={styles.paymentLineVal}>
                    {formatNaira(selectedOrder.shippingCost || 0)}
                  </Text>
                </View>

                {/* Platform Fee */}
                {selectedOrder.platformFee > 0 ? (
                  <View style={styles.paymentLineRow}>
                    <Text style={[styles.paymentLineLabel, { color: "#EA580C" }]}>
                      Platform Fee ({selectedOrder.platformFeeRate || 1.5}%)
                    </Text>
                    <Text style={[styles.paymentLineVal, { color: "#EA580C" }]}>
                      -{formatNaira(selectedOrder.platformFee)}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.paymentLineRow}>
                    <Text style={[styles.paymentLineLabel, { color: "#059669" }]}>
                      Platform Fee (Growth Promo)
                    </Text>
                    <Text style={[styles.paymentLineVal, { color: "#059669" }]}>₦0.00 (0%)</Text>
                  </View>
                )}

                {/* Total Paid */}
                <View style={[styles.paymentLineRow, styles.paymentLineTotalBorder]}>
                  <Text style={styles.paymentTotalLabel}>Total Paid</Text>
                  <Text style={styles.paymentTotalVal}>
                    {formatNaira(selectedOrder.total)}
                  </Text>
                </View>

                {/* Net Seller Earnings */}
                <View style={styles.netEarningsBox}>
                  <Text style={styles.netEarningsLabel}>Your Net Earning</Text>
                  <Text style={styles.netEarningsValue}>
                    {formatNaira(
                      selectedOrder.sellerEarnings ||
                        (selectedOrder.subtotal
                          ? selectedOrder.subtotal - (selectedOrder.platformFee || 0)
                          : selectedOrder.total)
                    )}
                  </Text>
                </View>
              </View>

              {/* Dynamic Order Table: Ordered Products */}
              <View style={styles.productsSection}>
                <View style={styles.productsSectionHeader}>
                  <Text style={styles.productsSectionTitle}>
                    Products Ordered ({selectedOrder.items?.length || 0})
                  </Text>
                  <View style={styles.productSortWrap}>
                    <TouchableOpacity
                      style={[
                        styles.sortOptionChip,
                        detailSortConfig === "price" && styles.sortOptionChipActive,
                      ]}
                      onPress={() => setDetailSortConfig("price")}
                    >
                      <Text
                        style={[
                          styles.sortOptionChipText,
                          detailSortConfig === "price" && styles.sortOptionChipTextActive,
                        ]}
                      >
                        Price
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.sortOptionChip,
                        detailSortConfig === "name" && styles.sortOptionChipActive,
                      ]}
                      onPress={() => setDetailSortConfig("name")}
                    >
                      <Text
                        style={[
                          styles.sortOptionChipText,
                          detailSortConfig === "name" && styles.sortOptionChipTextActive,
                        ]}
                      >
                        Name
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Items List */}
                {dynamicOrderProducts.map((item: any, idx: number) => {
                  const img = item.imageUrl || item.product?.images?.[0]?.url || item.image;
                  const price = Number(item.price || 0);
                  const qty = Number(item.quantity || 1);
                  const sku = item.sku || item.product?.sku || "N/A";

                  return (
                    <View key={item._id || idx} style={styles.productItemCard}>
                      <View style={styles.productThumbWrap}>
                        {img ? (
                          <Image source={{ uri: img }} style={styles.productThumb} />
                        ) : (
                          <Package size={22} color="#9CA3AF" />
                        )}
                      </View>

                      <View style={styles.productInfoCol}>
                        <Text style={styles.productNameText} numberOfLines={2}>
                          {item.name || item.product?.name || "Product Item"}
                        </Text>
                        <Text style={styles.productSkuText}>SKU: {sku}</Text>
                        <View style={styles.productMetaRow}>
                          <Text style={styles.productUnitPrice}>
                            {formatNaira(price)} × {qty}
                          </Text>
                          <Text style={styles.productLineTotal}>
                            {formatNaira(price * qty)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>

              <View style={{ height: 40 }} />
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
    backgroundColor: "#F4F5F7",
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
  headerCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  orderCountPill: {
    backgroundColor: "rgba(0, 52, 89, 0.08)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  orderCountPillText: {
    color: "#003459",
    fontSize: 11,
    fontWeight: "700",
  },
  tabsContainer: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  tabsScroll: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 16,
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabButtonActive: {
    borderBottomColor: "#003459",
  },
  tabButtonText: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
  },
  tabButtonTextActive: {
    color: "#003459",
    fontWeight: "700",
  },
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    paddingHorizontal: 10,
    height: 38,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: "#111827",
    paddingVertical: 0,
  },
  filterBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    paddingHorizontal: 10,
    height: 38,
    gap: 4,
  },
  filterBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
  },
  bulkActionBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#E2E8F0",
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  bulkSelectedCount: {
    flexDirection: "row",
    alignItems: "center",
  },
  bulkCountText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1E293B",
  },
  bulkButtonsGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  bulkBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  bulkBtnText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  selectAllRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  selectAllCheckbox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  selectAllText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4B5563",
  },
  pageInfoText: {
    fontSize: 12,
    color: "#6B7280",
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: "#6B7280",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 4,
    maxWidth: 260,
  },
  orderCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  orderCardSelected: {
    borderColor: "#003459",
    backgroundColor: "#F8FAFC",
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardCheckbox: {
    padding: 2,
  },
  cardOrderId: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  cardDate: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 1,
  },
  cardDivider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginVertical: 10,
  },
  cardBodyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  customerInfoWrap: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
  },
  avatarIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0, 52, 89, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  customerName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1F2937",
  },
  customerSubText: {
    fontSize: 11,
    color: "#6B7280",
  },
  totalWrap: {
    alignItems: "flex-end",
  },
  totalLabel: {
    fontSize: 11,
    color: "#6B7280",
  },
  totalValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  cardFooterRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  viewOrderBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#003459",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 6,
    gap: 6,
  },
  viewOrderBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  badgeContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  paginationWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
    paddingVertical: 10,
  },
  paginationText: {
    fontSize: 12,
    color: "#6B7280",
  },
  paginationButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  pageNavBtn: {
    padding: 6,
    backgroundColor: "#FFFFFF",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  pageNavBtnDisabled: {
    opacity: 0.4,
  },
  pageNumberBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "#003459",
    borderRadius: 6,
  },
  pageNumberBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  pickerModalContent: {
    width: "100%",
    maxWidth: 320,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
  },
  pickerModalTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  pickerOption: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  pickerOptionSelected: {
    backgroundColor: "#F3F4F6",
  },
  pickerOptionText: {
    fontSize: 13,
    color: "#374151",
  },
  pickerOptionTextSelected: {
    fontWeight: "700",
    color: "#003459",
  },

  // Detail Modal Styles (DynamicOrder)
  detailModalContainer: {
    flex: 1,
    backgroundColor: "#F4F5F7",
  },
  detailHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  detailBackBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    padding: 4,
  },
  detailBackBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
  },
  detailHeaderTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },
  detailHeaderSubtitle: {
    fontSize: 11,
    color: "#6B7280",
  },
  detailShareBtn: {
    padding: 6,
  },
  detailScroll: {
    padding: 16,
  },
  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  summaryCardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  summaryIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: "rgba(0, 52, 89, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  summaryCardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  summaryCardSub: {
    fontSize: 11,
    color: "#6B7280",
  },
  summaryDivider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginVertical: 10,
  },
  infoRowGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  infoGridCol: {
    flex: 1,
  },
  infoGridLabel: {
    fontSize: 11,
    color: "#9CA3AF",
    marginBottom: 2,
  },
  infoGridValue: {
    fontSize: 13,
    color: "#1F2937",
    fontWeight: "500",
  },
  addressFullText: {
    fontSize: 13,
    color: "#374151",
    lineHeight: 19,
  },
  paymentLineRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  paymentLineLabel: {
    fontSize: 12.5,
    color: "#6B7280",
  },
  paymentLineVal: {
    fontSize: 13,
    color: "#1F2937",
    fontWeight: "500",
  },
  paymentLineTotalBorder: {
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 8,
    marginTop: 4,
  },
  paymentTotalLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  paymentTotalVal: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },
  netEarningsBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ECFDF5",
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  netEarningsLabel: {
    fontSize: 12.5,
    fontWeight: "600",
    color: "#059669",
  },
  netEarningsValue: {
    fontSize: 15,
    fontWeight: "700",
    color: "#059669",
  },
  productsSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  productsSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  productsSectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  productSortWrap: {
    flexDirection: "row",
    gap: 6,
  },
  sortOptionChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: "#F3F4F6",
  },
  sortOptionChipActive: {
    backgroundColor: "#003459",
  },
  sortOptionChipText: {
    fontSize: 11,
    color: "#6B7280",
  },
  sortOptionChipTextActive: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  productItemCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  productThumbWrap: {
    width: 48,
    height: 48,
    borderRadius: 6,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginRight: 10,
  },
  productThumb: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  productInfoCol: {
    flex: 1,
  },
  productNameText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
  },
  productSkuText: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 2,
  },
  productMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  productUnitPrice: {
    fontSize: 12,
    color: "#6B7280",
  },
  productLineTotal: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
  },
});
