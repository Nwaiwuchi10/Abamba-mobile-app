import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Dimensions,
} from "react-native";
import { X, Search, Check, RotateCcw, Star } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { height } = Dimensions.get("window");

export interface ProductFilterState {
  category: string;
  brand: string | null;
  priceRange: string | null;
  rating: string | null;
  discount: string | null;
}

interface ProductFilterModalProps {
  visible: boolean;
  onClose: () => void;
  categories: string[];
  brands: string[];
  currentFilters: ProductFilterState;
  onApplyFilters: (filters: ProductFilterState) => void;
  onResetFilters: () => void;
}

const PRICE_OPTIONS = [
  { value: "0-10000", label: "Below ₦10,000" },
  { value: "10000-100000", label: "₦10,000 - ₦100,000" },
  { value: "100000-500000", label: "₦100,000 - ₦500,000" },
  { value: "500000", label: "₦500,000+" },
];

const RATING_OPTIONS = [
  { value: "5", label: "5 Stars" },
  { value: "4", label: "4 Stars & up" },
  { value: "3", label: "3 Stars & up" },
  { value: "2", label: "2 Stars & up" },
  { value: "1", label: "1 Star & up" },
];

const DISCOUNT_OPTIONS = [
  { value: "50", label: "50% or More" },
  { value: "40", label: "40% or More" },
  { value: "30", label: "30% or More" },
  { value: "20", label: "20% or More" },
  { value: "10", label: "10% or More" },
];

const DEFAULT_POPULAR_BRANDS = [
  "Samsung",
  "Apple",
  "Tecno",
  "Infinix",
  "Zara",
  "Zirconia",
  "Romoss",
  "Zealot",
  "Xiaomi",
  "Oraimo",
  "Sony",
  "Nike",
];

export default function ProductFilterModal({
  visible,
  onClose,
  categories,
  brands,
  currentFilters,
  onApplyFilters,
  onResetFilters,
}: ProductFilterModalProps) {
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState<
    "category" | "brand" | "price" | "rating" | "discount"
  >("category");

  const [tempFilters, setTempFilters] = useState<ProductFilterState>(currentFilters);
  const [brandSearch, setBrandSearch] = useState("");

  // Sync state when modal opens
  React.useEffect(() => {
    if (visible) {
      setTempFilters(currentFilters);
      setBrandSearch("");
    }
  }, [visible, currentFilters]);

  // Combined and filtered brands
  const combinedBrands = Array.from(
    new Set([...brands, ...DEFAULT_POPULAR_BRANDS])
  );

  const displayBrands = brandSearch
    ? combinedBrands.filter((b) =>
        b.toLowerCase().includes(brandSearch.toLowerCase().trim())
      )
    : combinedBrands;

  const handleApply = () => {
    onApplyFilters(tempFilters);
    onClose();
  };

  const handleReset = () => {
    onResetFilters();
    setTempFilters({
      category: "recommended",
      brand: null,
      priceRange: null,
      rating: null,
      discount: null,
    });
    setBrandSearch("");
    onClose();
  };

  const activeCount = [
    tempFilters.category && tempFilters.category !== "recommended" && tempFilters.category !== "All",
    tempFilters.brand,
    tempFilters.priceRange,
    tempFilters.rating,
    tempFilters.discount,
  ].filter(Boolean).length;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Text style={styles.headerTitle}>Filter Products</Text>
              {activeCount > 0 && (
                <View style={styles.activePill}>
                  <Text style={styles.activePillText}>{activeCount} active</Text>
                </View>
              )}
            </View>
            <View style={styles.headerActionRow}>
              <TouchableOpacity onPress={handleReset} style={styles.resetBtn}>
                <RotateCcw size={15} color="#003459" />
                <Text style={styles.resetBtnText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <X size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Body: Split Sidebar Navigation & Content */}
          <View style={styles.body}>
            {/* Left Nav Tabs */}
            <View style={styles.tabsNav}>
              <TouchableOpacity
                style={[styles.tabItem, activeTab === "category" && styles.activeTabItem]}
                onPress={() => setActiveTab("category")}
              >
                <Text
                  style={[
                    styles.tabItemText,
                    activeTab === "category" && styles.activeTabItemText,
                  ]}
                >
                  Category
                </Text>
                {tempFilters.category &&
                  tempFilters.category !== "recommended" &&
                  tempFilters.category !== "All" && <View style={styles.tabDot} />}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabItem, activeTab === "brand" && styles.activeTabItem]}
                onPress={() => setActiveTab("brand")}
              >
                <Text
                  style={[
                    styles.tabItemText,
                    activeTab === "brand" && styles.activeTabItemText,
                  ]}
                >
                  Brands
                </Text>
                {tempFilters.brand && <View style={styles.tabDot} />}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabItem, activeTab === "price" && styles.activeTabItem]}
                onPress={() => setActiveTab("price")}
              >
                <Text
                  style={[
                    styles.tabItemText,
                    activeTab === "price" && styles.activeTabItemText,
                  ]}
                >
                  Price (₦)
                </Text>
                {tempFilters.priceRange && <View style={styles.tabDot} />}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabItem, activeTab === "rating" && styles.activeTabItem]}
                onPress={() => setActiveTab("rating")}
              >
                <Text
                  style={[
                    styles.tabItemText,
                    activeTab === "rating" && styles.activeTabItemText,
                  ]}
                >
                  Rating
                </Text>
                {tempFilters.rating && <View style={styles.tabDot} />}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabItem, activeTab === "discount" && styles.activeTabItem]}
                onPress={() => setActiveTab("discount")}
              >
                <Text
                  style={[
                    styles.tabItemText,
                    activeTab === "discount" && styles.activeTabItemText,
                  ]}
                >
                  Discount
                </Text>
                {tempFilters.discount && <View style={styles.tabDot} />}
              </TouchableOpacity>
            </View>

            {/* Right Pane: Option Items */}
            <ScrollView style={styles.optionsPane} showsVerticalScrollIndicator={false}>
              {/* Category Options */}
              {activeTab === "category" && (
                <View style={styles.sectionWrap}>
                  <Text style={styles.sectionHeading}>Select Category</Text>
                  {["recommended", ...categories].map((cat, idx) => {
                    const isRecommended =
                      cat.toLowerCase() === "recommended" || cat.toLowerCase() === "all";
                    const displayLabel = isRecommended ? "All (Recommended)" : cat;
                    const isSelected =
                      (isRecommended &&
                        (tempFilters.category === "recommended" ||
                          tempFilters.category === "All" ||
                          !tempFilters.category)) ||
                      tempFilters.category.toLowerCase() === cat.toLowerCase();

                    return (
                      <TouchableOpacity
                        key={idx}
                        style={[
                          styles.optionRow,
                          isSelected && styles.optionRowSelected,
                        ]}
                        onPress={() => {
                          setTempFilters((prev) => ({
                            ...prev,
                            category: isRecommended ? "recommended" : cat,
                            brand: null, // Reset brand on category switch matching web
                          }));
                        }}
                      >
                        <Text
                          style={[
                            styles.optionLabel,
                            isSelected && styles.optionLabelSelected,
                          ]}
                        >
                          {displayLabel}
                        </Text>
                        <View
                          style={[
                            styles.radioCircle,
                            isSelected && styles.radioCircleActive,
                          ]}
                        >
                          {isSelected && <View style={styles.radioDot} />}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* Brands Options */}
              {activeTab === "brand" && (
                <View style={styles.sectionWrap}>
                  <View style={styles.brandSearchRow}>
                    <Search size={15} color="#9CA3AF" style={{ marginRight: 6 }} />
                    <TextInput
                      placeholder="e.g. Samsung, Zara, Tecno..."
                      value={brandSearch}
                      onChangeText={setBrandSearch}
                      style={styles.brandSearchInput}
                      placeholderTextColor="#9CA3AF"
                    />
                    {brandSearch ? (
                      <TouchableOpacity onPress={() => setBrandSearch("")}>
                        <X size={15} color="#6B7280" />
                      </TouchableOpacity>
                    ) : null}
                  </View>

                  {tempFilters.brand && (
                    <TouchableOpacity
                      style={styles.clearCurrentOption}
                      onPress={() =>
                        setTempFilters((prev) => ({ ...prev, brand: null }))
                      }
                    >
                      <Text style={styles.clearCurrentOptionText}>
                        Clear Brand Selection ({tempFilters.brand})
                      </Text>
                    </TouchableOpacity>
                  )}

                  {displayBrands.map((b, idx) => {
                    const isSelected =
                      tempFilters.brand?.toLowerCase() === b.toLowerCase();
                    return (
                      <TouchableOpacity
                        key={idx}
                        style={[
                          styles.optionRow,
                          isSelected && styles.optionRowSelected,
                        ]}
                        onPress={() => {
                          setTempFilters((prev) => ({
                            ...prev,
                            brand: isSelected ? null : b,
                          }));
                        }}
                      >
                        <Text
                          style={[
                            styles.optionLabel,
                            isSelected && styles.optionLabelSelected,
                          ]}
                        >
                          {b}
                        </Text>
                        <View
                          style={[
                            styles.radioCircle,
                            isSelected && styles.radioCircleActive,
                          ]}
                        >
                          {isSelected && <View style={styles.radioDot} />}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* Price Options */}
              {activeTab === "price" && (
                <View style={styles.sectionWrap}>
                  <View style={styles.sectionTitleRow}>
                    <Text style={styles.sectionHeading}>Price Range</Text>
                    {tempFilters.priceRange && (
                      <TouchableOpacity
                        onPress={() =>
                          setTempFilters((prev) => ({ ...prev, priceRange: null }))
                        }
                      >
                        <Text style={styles.clearText}>Clear</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {PRICE_OPTIONS.map((item) => {
                    const isSelected = tempFilters.priceRange === item.value;
                    return (
                      <TouchableOpacity
                        key={item.value}
                        style={[
                          styles.optionRow,
                          isSelected && styles.optionRowSelected,
                        ]}
                        onPress={() => {
                          setTempFilters((prev) => ({
                            ...prev,
                            priceRange: isSelected ? null : item.value,
                          }));
                        }}
                      >
                        <Text
                          style={[
                            styles.optionLabel,
                            isSelected && styles.optionLabelSelected,
                          ]}
                        >
                          {item.label}
                        </Text>
                        <View
                          style={[
                            styles.radioCircle,
                            isSelected && styles.radioCircleActive,
                          ]}
                        >
                          {isSelected && <View style={styles.radioDot} />}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* Rating Options */}
              {activeTab === "rating" && (
                <View style={styles.sectionWrap}>
                  <View style={styles.sectionTitleRow}>
                    <Text style={styles.sectionHeading}>Customer Rating</Text>
                    {tempFilters.rating && (
                      <TouchableOpacity
                        onPress={() =>
                          setTempFilters((prev) => ({ ...prev, rating: null }))
                        }
                      >
                        <Text style={styles.clearText}>Clear</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {RATING_OPTIONS.map((item) => {
                    const isSelected = tempFilters.rating === item.value;
                    return (
                      <TouchableOpacity
                        key={item.value}
                        style={[
                          styles.optionRow,
                          isSelected && styles.optionRowSelected,
                        ]}
                        onPress={() => {
                          setTempFilters((prev) => ({
                            ...prev,
                            rating: isSelected ? null : item.value,
                          }));
                        }}
                      >
                        <View style={styles.ratingRowLabel}>
                          <Text
                            style={[
                              styles.optionLabel,
                              isSelected && styles.optionLabelSelected,
                            ]}
                          >
                            {item.label}
                          </Text>
                          <View style={styles.starsInline}>
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                size={12}
                                color={
                                  s <= Number(item.value) ? "#F59E0B" : "#E5E7EB"
                                }
                                fill={
                                  s <= Number(item.value) ? "#F59E0B" : "transparent"
                                }
                              />
                            ))}
                          </View>
                        </View>

                        <View
                          style={[
                            styles.radioCircle,
                            isSelected && styles.radioCircleActive,
                          ]}
                        >
                          {isSelected && <View style={styles.radioDot} />}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* Discount Options */}
              {activeTab === "discount" && (
                <View style={styles.sectionWrap}>
                  <View style={styles.sectionTitleRow}>
                    <Text style={styles.sectionHeading}>Discount Percentage</Text>
                    {tempFilters.discount && (
                      <TouchableOpacity
                        onPress={() =>
                          setTempFilters((prev) => ({ ...prev, discount: null }))
                        }
                      >
                        <Text style={styles.clearText}>Clear</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {DISCOUNT_OPTIONS.map((item) => {
                    const isSelected = tempFilters.discount === item.value;
                    return (
                      <TouchableOpacity
                        key={item.value}
                        style={[
                          styles.optionRow,
                          isSelected && styles.optionRowSelected,
                        ]}
                        onPress={() => {
                          setTempFilters((prev) => ({
                            ...prev,
                            discount: isSelected ? null : item.value,
                          }));
                        }}
                      >
                        <Text
                          style={[
                            styles.optionLabel,
                            isSelected && styles.optionLabelSelected,
                          ]}
                        >
                          {item.label}
                        </Text>
                        <View
                          style={[
                            styles.radioCircle,
                            isSelected && styles.radioCircleActive,
                          ]}
                        >
                          {isSelected && <View style={styles.radioDot} />}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </ScrollView>
          </View>

          {/* Footer Action */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.applyBtn} onPress={handleApply}>
              <Check size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.applyBtnText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: height * 0.82,
    flexDirection: "column",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#003459",
  },
  activePill: {
    backgroundColor: "#E0F2FE",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  activePillText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#003459",
  },
  headerActionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  resetBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  resetBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#003459",
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    flex: 1,
    flexDirection: "row",
  },
  tabsNav: {
    width: 120,
    backgroundColor: "#F9FAFB",
    borderRightWidth: 1,
    borderRightColor: "#E5E7EB",
    paddingVertical: 10,
  },
  tabItem: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    position: "relative",
  },
  activeTabItem: {
    backgroundColor: "#FFFFFF",
    borderLeftWidth: 3,
    borderLeftColor: "#003459",
  },
  tabItemText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
  },
  activeTabItemText: {
    color: "#003459",
    fontWeight: "800",
  },
  tabDot: {
    position: "absolute",
    right: 8,
    top: 18,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#003459",
  },
  optionsPane: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  sectionWrap: {
    paddingBottom: 24,
  },
  sectionTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  clearText: {
    fontSize: 12,
    color: "#003459",
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  brandSearchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 38,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  brandSearchInput: {
    flex: 1,
    fontSize: 13,
    color: "#111827",
  },
  clearCurrentOption: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: "#FEE2E2",
    borderRadius: 6,
    marginBottom: 10,
  },
  clearCurrentOptionText: {
    fontSize: 12,
    color: "#DC2626",
    fontWeight: "600",
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 11,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F9FAFB",
  },
  optionRowSelected: {
    backgroundColor: "rgba(0, 52, 89, 0.04)",
    borderRadius: 6,
  },
  optionLabel: {
    fontSize: 13,
    color: "#374151",
    fontWeight: "500",
    flex: 1,
  },
  optionLabelSelected: {
    color: "#003459",
    fontWeight: "700",
  },
  ratingRowLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  starsInline: {
    flexDirection: "row",
    gap: 2,
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
  },
  radioCircleActive: {
    borderColor: "#003459",
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#003459",
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  applyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#003459",
    height: 48,
    borderRadius: 12,
  },
  applyBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
