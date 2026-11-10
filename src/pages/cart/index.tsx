import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShoppingBag,
  Truck,
  ShieldCheck,
  ChevronRight,
  Building2,
  Check,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { useAppDispatch, useAppSelector } from "../../store";
import {
  removeFromCart,
  updateQuantity,
  clearCart,
} from "../../store/slices/cartSlice";

export default function CartScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const dispatch = useAppDispatch();

  const { items, totalAmount } = useAppSelector((state) => state.cart);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  const couriers = [
    {
      id: "richmond",
      name: "Richmond Logistics",
      location: "Owerri, Imo State",
      eta: "1 - 2 business days",
      price: 3000,
      isPickup: false,
    },
    {
      id: "apex",
      name: "Apex Go Logistics",
      location: "Owerri, Imo State",
      eta: "1 - 3 business days",
      price: 2400,
      isPickup: false,
    },
    {
      id: "hens",
      name: "Hens Logistics",
      location: "Owerri, Imo State",
      eta: "2 - 4 business days",
      price: 3000,
      isPickup: false,
    },
    {
      id: "pickup",
      name: "Abamba Regional Pick-up Hub",
      location: "31 Wetheral Road, Owerri",
      eta: "Ready in 3 - 5 days",
      price: 0,
      isPickup: true,
    },
  ];

  const [selectedCourier, setSelectedCourier] = useState(couriers[0]);
  const [showCourierModal, setShowCourierModal] = useState(false);

  const shippingFee = selectedCourier.price;
  const grandTotal = totalAmount + shippingFee;

  const handleClear = () => {
    Alert.alert("Clear Cart", "Are you sure you want to remove all items from your cart?", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear", style: "destructive", onPress: () => dispatch(clearCart()) },
    ]);
  };

  const handleCheckout = () => {
    if (items.length === 0) {
      Alert.alert("Empty Cart", "Please add items to your cart before proceeding.");
      return;
    }
    // Web parity: check if user is logged in, redirect to login with redirect param if not
    if (!isAuthenticated) {
      router.push({
        pathname: "/auth/login" as any,
        params: { redirect: "/cart/checkout" },
      });
      return;
    }
    router.push("/cart/checkout" as any);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Shopping Cart ({items.length})</Text>
        {items.length > 0 && (
          <TouchableOpacity onPress={handleClear}>
            <Text style={styles.clearText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <ShoppingBag size={64} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>
            Looks like you haven't added anything to your cart yet.
          </Text>
          <TouchableOpacity
            style={styles.exploreBtn}
            onPress={() => router.push("/products" as any)}
          >
            <Text style={styles.exploreBtnText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Cart Items List */}
          {items.map((item) => (
            <View key={item.id} style={styles.cartCard}>
              <Image
                source={
                  item.image
                    ? { uri: item.image }
                    : require("../../../assets/images/placeholder.jpg")
                }
                style={styles.itemImage}
                resizeMode="cover"
              />
              <View style={styles.itemInfo}>
                <View style={styles.itemTopRow}>
                  <Text style={styles.itemName} numberOfLines={2}>
                    {item.name}
                  </Text>
                  <TouchableOpacity
                    onPress={() => dispatch(removeFromCart(item.id))}
                    style={styles.deleteBtn}
                  >
                    <Trash2 size={16} color="#EF4444" />
                  </TouchableOpacity>
                </View>

                <View style={styles.itemBottomRow}>
                  <Text style={styles.itemPrice}>
                    ₦{Number(item.price).toLocaleString()}
                  </Text>
                  <View style={styles.qtyControls}>
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() =>
                        dispatch(
                          updateQuantity({
                            id: item.id,
                            quantity: item.quantity - 1,
                          })
                        )
                      }
                    >
                      <Minus size={14} color="#374151" />
                    </TouchableOpacity>
                    <Text style={styles.qtyText}>{item.quantity}</Text>
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() =>
                        dispatch(
                          updateQuantity({
                            id: item.id,
                            quantity: item.quantity + 1,
                          })
                        )
                      }
                    >
                      <Plus size={14} color="#374151" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          ))}

          {/* Regional Logistics Selector (Exact Web Replicate) */}
          <TouchableOpacity
            style={styles.logisticsCard}
            onPress={() => setShowCourierModal(true)}
            activeOpacity={0.85}
          >
            <View style={styles.logisticsLeft}>
              <View style={styles.iconCircle}>
                {selectedCourier.isPickup ? (
                  <Building2 size={18} color="#003459" />
                ) : (
                  <Truck size={18} color="#003459" />
                )}
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.courierTitle}>
                  {selectedCourier.name} • {selectedCourier.price === 0 ? "FREE" : `₦${selectedCourier.price.toLocaleString()}`}
                </Text>
                <Text style={styles.courierSub}>
                  {selectedCourier.location} ({selectedCourier.eta})
                </Text>
              </View>
            </View>
            <ChevronRight size={18} color="#9CA3AF" />
          </TouchableOpacity>

          {/* Pricing Summary Breakdown */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Order Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Items Subtotal</Text>
              <Text style={styles.summaryValue}>₦{totalAmount.toLocaleString()}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Shipping / Courier Fee</Text>
              <Text style={styles.summaryValue}>
                {shippingFee === 0 ? "FREE" : `₦${shippingFee.toLocaleString()}`}
              </Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Estimated Total</Text>
              <Text style={styles.totalValue}>₦{grandTotal.toLocaleString()}</Text>
            </View>

            <View style={styles.escrowNote}>
              <ShieldCheck size={14} color="#10B981" />
              <Text style={styles.escrowText}>Protected by Abamba Escrow Guarantee</Text>
            </View>
          </View>

          <View style={{ height: 160 }} />
        </ScrollView>
      )}

      {/* Floating Action Bar */}
      {items.length > 0 && (
        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 12) + 60 }]}>
          <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout}>
            <Text style={styles.checkoutBtnText}>
              Checkout • ₦{grandTotal.toLocaleString()}
            </Text>
            <ArrowRight size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}

      {/* Logistics Modal */}
      <Modal
        visible={showCourierModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCourierModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Delivery Courier</Text>
            <Text style={styles.modalSub}>Choose a courier or self pick-up station</Text>

            {couriers.map((c) => {
              const isSelected = selectedCourier.id === c.id;
              return (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.modalOption, isSelected && styles.modalOptionActive]}
                  onPress={() => {
                    setSelectedCourier(c);
                    setShowCourierModal(false);
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.optionTitle, isSelected && { color: "#003459" }]}>
                      {c.name}
                    </Text>
                    <Text style={styles.optionSub}>{c.location} • {c.eta}</Text>
                  </View>
                  <Text style={[styles.optionPrice, c.price === 0 && { color: "#10B981" }]}>
                    {c.price === 0 ? "FREE" : `₦${c.price.toLocaleString()}`}
                  </Text>
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setShowCourierModal(false)}
            >
              <Text style={styles.closeBtnText}>Done</Text>
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
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#003459",
  },
  clearText: {
    fontSize: 13,
    color: "#EF4444",
    fontWeight: "600",
  },
  scrollContent: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    marginTop: -40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 18,
  },
  exploreBtn: {
    backgroundColor: "#003459",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  exploreBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  cartCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "space-between",
  },
  itemTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  itemName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1F2937",
    flex: 1,
    marginRight: 8,
    lineHeight: 18,
  },
  deleteBtn: {
    padding: 4,
  },
  itemBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: "800",
    color: "#003459",
  },
  qtyControls: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 6,
    paddingHorizontal: 4,
  },
  qtyBtn: {
    padding: 6,
  },
  qtyText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
    paddingHorizontal: 6,
  },
  logisticsCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginTop: 4,
    marginBottom: 14,
  },
  logisticsLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  courierTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1F2937",
  },
  courierSub: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 2,
  },
  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 13,
    color: "#6B7280",
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1F2937",
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 10,
    marginTop: 6,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111827",
  },
  totalValue: {
    fontSize: 17,
    fontWeight: "900",
    color: "#003459",
  },
  escrowNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    backgroundColor: "#ECFDF5",
    padding: 8,
    borderRadius: 6,
  },
  escrowText: {
    fontSize: 11,
    color: "#059669",
    fontWeight: "600",
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  checkoutBtn: {
    backgroundColor: "#003459",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  checkoutBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#003459",
  },
  modalSub: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
    marginBottom: 16,
  },
  modalOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 10,
  },
  modalOptionActive: {
    borderColor: "#003459",
    backgroundColor: "#EFF6FF",
  },
  optionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1F2937",
  },
  optionSub: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 2,
  },
  optionPrice: {
    fontSize: 13,
    fontWeight: "800",
    color: "#003459",
  },
  closeBtn: {
    backgroundColor: "#003459",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  closeBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});
