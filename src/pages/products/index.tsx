import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Search,
  ArrowLeft,
  SlidersHorizontal,
  ArrowUpDown,
  X,
  Check,
  RotateCcw,
} from "lucide-react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { productService } from "../../services";
import { ProductCard } from "../../components/common/ProductCard";
import fallbackProducts from "../../../assets/initial-products.json";
import { EXACT_PRODUCT_CATEGORIES } from "../../constants/categories";
import ProductFilterModal, {
  ProductFilterState,
} from "../../components/products/ProductFilterModal";

const SORT_OPTIONS = [
  { value: "popularity", label: "Popularity" },
  { value: "newest", label: "Newest Arrivals" },
  { value: "price-low-high", label: "Price: Low to High" },
  { value: "price-high-low", label: "Price: High to Low" },
  { value: "rating", label: "Highest Rated" },
];

export default function ProductsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();

  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>(fallbackProducts || []);
  const [search, setSearch] = useState((params.search as string) || "");

  // Web Exact Filters
  const [category, setCategory] = useState<string>(
    (params.category as string) || "recommended"
  );
  const [brand, setBrand] = useState<string | null>(
    (params.brand as string) || null
  );
  const [priceRange, setPriceRange] = useState<string | null>(null);
  const [rating, setRating] = useState<string | null>(null);
  const [discount, setDiscount] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<string>("popularity");

  // Dynamic Categories & Brands from API matching web
  const [availableCategories, setAvailableCategories] = useState<string[]>(
    EXACT_PRODUCT_CATEGORIES.filter((c) => c !== "All")
  );
  const [availableBrands, setAvailableBrands] = useState<string[]>([]);

  // Modals
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);

  // Fetch Brands and Categories matching web
  useEffect(() => {
    const fetchBrandsAndCategories = async () => {
      try {
        const resolvedCategory =
          category === "recommended" || category === "All"
            ? ""
            : category.replace(/_/g, " ").trim();
        const res = await productService.getBrandsAndCategories({
          category: resolvedCategory,
        });
        const incomingBrands = res?.data?.data?.brands || res?.data?.brands || [];
        const incomingCats = res?.data?.data?.categories || res?.data?.categories || [];

        if (Array.isArray(incomingBrands) && incomingBrands.length > 0) {
          setAvailableBrands(incomingBrands);
        }
        if (Array.isArray(incomingCats) && incomingCats.length > 0) {
          setAvailableCategories(incomingCats);
        }
      } catch (err) {
        // Fallback gracefully to default catalog
      }
    };

    fetchBrandsAndCategories();
  }, [category]);

  // Fetch Products matching web
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const resolvedCategory =
        !category || category === "recommended" || category === "All"
          ? ""
          : category.replace(/_/g, " ").trim();

      const queryParams: any = {
        limit: 120,
        category: resolvedCategory,
      };
      if (brand) queryParams.brand = brand;
      if (search) queryParams.search = search;

      const res = await productService.getProducts(queryParams);
      const incoming =
        res?.data?.data?.products ||
        res?.data?.products ||
        res?.data?.data ||
        res?.data;

      if (Array.isArray(incoming) && incoming.length > 0) {
        setProducts(incoming);
      } else if (!products || products.length === 0) {
        setProducts(fallbackProducts);
      }
    } catch (e) {
      console.log("Error loading catalog products:", e);
      if (!products || products.length === 0) {
        setProducts(fallbackProducts);
      }
    } finally {
      setLoading(false);
    }
  }, [category, brand, search]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Price calculation helpers mirroring web/abamba/src/components/product-files/products.jsx
  const getBasePrice = (product: any) => {
    return Number(product.basePrice || product.price || 0);
  };

  const getEffectivePrice = (product: any) => {
    const base = getBasePrice(product);
    const bonus =
      product.bonusPrice !== undefined &&
      product.bonusPrice !== null &&
      product.bonusPrice !== ""
        ? Number(product.bonusPrice)
        : product.bonus_price !== undefined &&
          product.bonus_price !== null &&
          product.bonus_price !== ""
        ? Number(product.bonus_price)
        : product.promoPrice !== undefined &&
          product.promoPrice !== null &&
          product.promoPrice !== ""
        ? Number(product.promoPrice)
        : null;

    if (bonus !== null && !isNaN(bonus) && bonus > 0 && bonus < base) {
      return bonus;
    }
    return base;
  };

  // Exact filtering & sorting logic replicating web
  const filteredAndSortedProducts = useMemo(() => {
    let prods = [...products];

    // 0. Search term matching
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      prods = prods.filter((p) => {
        const pName = String(p.name || "").toLowerCase();
        const pBrand = String(p.brand || "").toLowerCase();
        const pDesc = String(p.description || "").toLowerCase();
        return pName.includes(q) || pBrand.includes(q) || pDesc.includes(q);
      });
    }

    // 1. Category Filtering
    if (category && category !== "recommended" && category !== "All") {
      const normCat = category.toLowerCase().replace(/_/g, " ").trim();
      prods = prods.filter((p) => {
        const prodCat = String(p.category?.name || p.category || "").toLowerCase();
        return prodCat.includes(normCat) || normCat.includes(prodCat);
      });
    }

    // 2. Brand Filtering (with exact alias mapping from web)
    if (brand) {
      const brandLower = String(brand).toLowerCase().trim();
      const aliasMap: Record<string, string[]> = {
        iphone: ["apple", "iphone", "i phone", "ios"],
        apple: ["apple", "iphone", "i phone", "ipad", "macbook", "airpod"],
        redmi: ["redmi", "xiaomi", "mi", "poco"],
        xiaomi: ["xiaomi", "redmi", "mi", "poco"],
        samsung: ["samsung", "galaxy"],
        itel: ["itel"],
        tecno: ["tecno", "spark", "camon", "phantom"],
        infinix: ["infinix", "hot", "note", "smart"],
        oraimo: ["oraimo", "freebuds", "freepods"],
      };

      const searchTerms = aliasMap[brandLower] || [brandLower];

      prods = prods.filter((p) => {
        const prodBrand = String(p.brand || "").toLowerCase();
        const prodName = String(p.name || "").toLowerCase();
        const prodDesc = String(p.description || "").toLowerCase();
        const prodTags = Array.isArray(p.tags)
          ? p.tags.join(" ").toLowerCase()
          : String(p.tags || "").toLowerCase();

        return searchTerms.some(
          (term) =>
            prodBrand.includes(term) ||
            prodName.includes(term) ||
            prodDesc.includes(term) ||
            prodTags.includes(term)
        );
      });
    }

    // 3. Price Range Filtering
    if (priceRange) {
      if (priceRange === "500000" || priceRange === "500000+") {
        prods = prods.filter((p) => getEffectivePrice(p) >= 500000);
      } else if (priceRange.includes("-")) {
        const [minStr, maxStr] = priceRange.split("-");
        const minPrice = Number(minStr) || 0;
        const maxPrice = Number(maxStr) || Infinity;
        prods = prods.filter((p) => {
          const price = getEffectivePrice(p);
          return price >= minPrice && price <= maxPrice;
        });
      }
    }

    // 4. Rating Filtering
    if (rating) {
      const minRating = Number(rating);
      prods = prods.filter((p) => {
        const prodRating = p.rating ? Number(p.rating) : 4.5;
        return prodRating >= minRating;
      });
    }

    // 5. Discount Percentage Filtering
    if (discount) {
      const minDiscount = Number(discount);
      prods = prods.filter((p) => {
        const base = getBasePrice(p);
        const effective = getEffectivePrice(p);
        if (base > 0 && effective < base) {
          const pct = Math.round(((base - effective) / base) * 100);
          return pct >= minDiscount;
        }
        return false;
      });
    }

    // 6. Sorting
    switch (sortOption) {
      case "newest":
        prods.sort(
          (a, b) =>
            new Date(b.approvedAt || b.createdAt || 0).getTime() -
            new Date(a.approvedAt || a.createdAt || 0).getTime()
        );
        break;
      case "popularity":
      case "rating":
        prods.sort(
          (a, b) => (Number(b.rating) || 4.5) - (Number(a.rating) || 4.5)
        );
        break;
      case "price-low-high":
        prods.sort((a, b) => getEffectivePrice(a) - getEffectivePrice(b));
        break;
      case "price-high-low":
        prods.sort((a, b) => getEffectivePrice(b) - getEffectivePrice(a));
        break;
      default:
        break;
    }

    return prods;
  }, [products, search, category, brand, priceRange, rating, discount, sortOption]);

  const activeFilterCount = [
    category && category !== "recommended" && category !== "All",
    brand,
    priceRange,
    rating,
    discount,
  ].filter(Boolean).length;

  const handleApplyFilterModal = (filters: ProductFilterState) => {
    setCategory(filters.category);
    setBrand(filters.brand);
    setPriceRange(filters.priceRange);
    setRating(filters.rating);
    setDiscount(filters.discount);
  };

  const handleResetFilters = () => {
    setCategory("recommended");
    setBrand(null);
    setPriceRange(null);
    setRating(null);
    setDiscount(null);
    setSearch("");
  };

  const selectedCategoryDisplay =
    category === "recommended" || category === "All" || !category
      ? "All"
      : category;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Products Catalog</Text>
        <TouchableOpacity
          style={styles.filterHeaderBtn}
          onPress={() => setShowFilterModal(true)}
        >
          <SlidersHorizontal size={19} color="#003459" />
          {activeFilterCount > 0 && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Search Input Bar */}
      <View style={styles.searchBar}>
        <Search size={18} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          placeholder="Search products, brands, or categories..."
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={fetchProducts}
          style={styles.searchInput}
          placeholderTextColor="#9CA3AF"
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch("")} style={{ padding: 4 }}>
            <X size={16} color="#9CA3AF" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Category Pills Slider */}
      <View style={styles.catScrollWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.catScroll}
          contentContainerStyle={styles.catScrollContent}
        >
          {["All", ...availableCategories].map((cat) => {
            const isSelected =
              (cat === "All" &&
                (category === "recommended" || category === "All" || !category)) ||
              category.toLowerCase() === cat.toLowerCase();

            return (
              <TouchableOpacity
                key={cat}
                style={[styles.catPill, isSelected && styles.activeCatPill]}
                onPress={() => {
                  setCategory(cat === "All" ? "recommended" : cat);
                  setBrand(null); // Reset brand when user switches category matching web
                }}
              >
                <Text
                  style={[
                    styles.catPillText,
                    isSelected && styles.activeCatPillText,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Control Action Bar: Filter Button & Sort By Pill */}
      <View style={styles.controlBar}>
        <TouchableOpacity
          style={[
            styles.filterTriggerBtn,
            activeFilterCount > 0 && styles.filterTriggerBtnActive,
          ]}
          onPress={() => setShowFilterModal(true)}
        >
          <SlidersHorizontal
            size={16}
            color={activeFilterCount > 0 ? "#FFFFFF" : "#003459"}
          />
          <Text
            style={[
              styles.filterTriggerText,
              activeFilterCount > 0 && styles.filterTriggerTextActive,
            ]}
          >
            Filters {activeFilterCount > 0 ? `(${activeFilterCount})` : ""}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.sortTriggerBtn}
          onPress={() => setShowSortModal(true)}
        >
          <ArrowUpDown size={15} color="#003459" />
          <Text style={styles.sortTriggerText} numberOfLines={1}>
            Sort:{" "}
            {SORT_OPTIONS.find((s) => s.value === sortOption)?.label || "Popularity"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Active Filter Chips Row */}
      {activeFilterCount > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.activeChipsContainer}
        >
          {category && category !== "recommended" && category !== "All" && (
            <View style={styles.chip}>
              <Text style={styles.chipText}>Category: {category}</Text>
              <TouchableOpacity onPress={() => setCategory("recommended")}>
                <X size={14} color="#003459" />
              </TouchableOpacity>
            </View>
          )}

          {brand && (
            <View style={styles.chip}>
              <Text style={styles.chipText}>Brand: {brand}</Text>
              <TouchableOpacity onPress={() => setBrand(null)}>
                <X size={14} color="#003459" />
              </TouchableOpacity>
            </View>
          )}

          {priceRange && (
            <View style={styles.chip}>
              <Text style={styles.chipText}>
                Price:{" "}
                {priceRange === "500000"
                  ? "₦500k+"
                  : `₦${priceRange.replace("-", " - ₦")}`}
              </Text>
              <TouchableOpacity onPress={() => setPriceRange(null)}>
                <X size={14} color="#003459" />
              </TouchableOpacity>
            </View>
          )}

          {rating && (
            <View style={styles.chip}>
              <Text style={styles.chipText}>{rating}★ & up</Text>
              <TouchableOpacity onPress={() => setRating(null)}>
                <X size={14} color="#003459" />
              </TouchableOpacity>
            </View>
          )}

          {discount && (
            <View style={styles.chip}>
              <Text style={styles.chipText}>{discount}%+ off</Text>
              <TouchableOpacity onPress={() => setDiscount(null)}>
                <X size={14} color="#003459" />
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity onPress={handleResetFilters} style={styles.clearAllBtn}>
            <Text style={styles.clearAllText}>Clear All</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Products Counter & Status */}
      <View style={styles.resultsInfoRow}>
        <Text style={styles.resultsCountText}>
          Showing{" "}
          <Text style={{ fontWeight: "700", color: "#003459" }}>
            {filteredAndSortedProducts.length}
          </Text>{" "}
          products
        </Text>
      </View>

      {/* Products Grid */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {loading && (!products || products.length === 0) ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="large" color="#003459" />
            <Text style={styles.loadingText}>Fetching products...</Text>
          </View>
        ) : filteredAndSortedProducts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No Products Found</Text>
            <Text style={styles.emptySubtitle}>
              No items match your active filters. Try adjusting or clearing your
              filters.
            </Text>
            <TouchableOpacity
              style={styles.emptyResetBtn}
              onPress={handleResetFilters}
            >
              <RotateCcw size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.emptyResetBtnText}>Reset All Filters</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.productGrid}>
            {filteredAndSortedProducts.map((prod) => (
              <ProductCard key={prod._id || prod.id} product={prod} />
            ))}
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Web Exact Filter Modal */}
      <ProductFilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        categories={availableCategories}
        brands={availableBrands}
        currentFilters={{
          category,
          brand,
          priceRange,
          rating,
          discount,
        }}
        onApplyFilters={handleApplyFilterModal}
        onResetFilters={handleResetFilters}
      />

      {/* Sort Options Bottom Sheet Modal */}
      <Modal
        visible={showSortModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSortModal(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowSortModal(false)}
        >
          <View style={[styles.sortModalSheet, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.sortModalHeader}>
              <Text style={styles.sortModalTitle}>Sort Products By</Text>
              <TouchableOpacity onPress={() => setShowSortModal(false)}>
                <X size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {SORT_OPTIONS.map((item) => {
              const isSelected = sortOption === item.value;
              return (
                <TouchableOpacity
                  key={item.value}
                  style={[
                    styles.sortOptionItem,
                    isSelected && styles.sortOptionItemSelected,
                  ]}
                  onPress={() => {
                    setSortOption(item.value);
                    setShowSortModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.sortOptionText,
                      isSelected && styles.sortOptionTextSelected,
                    ]}
                  >
                    {item.label}
                  </Text>
                  {isSelected && <Check size={18} color="#003459" />}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
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
    padding: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#003459",
  },
  filterHeaderBtn: {
    padding: 6,
    position: "relative",
  },
  headerBadge: {
    position: "absolute",
    top: 2,
    right: 2,
    backgroundColor: "#DC2626",
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  headerBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#1F2937",
  },
  catScrollWrapper: {
    marginBottom: 8,
  },
  catScroll: {
    paddingHorizontal: 16,
  },
  catScrollContent: {
    paddingRight: 24,
    paddingVertical: 4,
    alignItems: "center",
  },
  catPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    marginRight: 8,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  activeCatPill: {
    backgroundColor: "#003459",
    borderColor: "#003459",
  },
  catPillText: {
    fontSize: 13,
    color: "#4B5563",
    fontWeight: "500",
  },
  activeCatPillText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  controlBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 6,
    gap: 10,
  },
  filterTriggerBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: "#003459",
    gap: 6,
  },
  filterTriggerBtnActive: {
    backgroundColor: "#003459",
  },
  filterTriggerText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#003459",
  },
  filterTriggerTextActive: {
    color: "#FFFFFF",
  },
  sortTriggerBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 6,
  },
  sortTriggerText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#003459",
    maxWidth: 130,
  },
  activeChipsContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 52, 89, 0.08)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    gap: 6,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#003459",
  },
  clearAllBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  clearAllText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#DC2626",
    textDecorationLine: "underline",
  },
  resultsInfoRow: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 4,
  },
  resultsCountText: {
    fontSize: 12,
    color: "#6B7280",
  },
  scrollContent: {
    paddingTop: 4,
  },
  loaderWrap: {
    marginTop: 50,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: "#6B7280",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#003459",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 20,
  },
  emptyResetBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#003459",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
  },
  emptyResetBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  productGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sortModalSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  sortModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sortModalTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#003459",
  },
  sortOptionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  sortOptionItemSelected: {
    backgroundColor: "rgba(0, 52, 89, 0.04)",
  },
  sortOptionText: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
  },
  sortOptionTextSelected: {
    color: "#003459",
    fontWeight: "700",
  },
});
