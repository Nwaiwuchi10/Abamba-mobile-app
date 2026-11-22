import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Alert,
  Share,
  Switch,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Plus,
  Search,
  Trash2,
  Package,
  Folder,
  Users,
  AlertTriangle,
  Clock,
  MoreVertical,
  ChevronDown,
  Check,
  CheckSquare,
  Square,
  Eye,
  Star,
  QrCode,
  X,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Edit,
  Share2,
  Filter,
  ArrowUpDown,
  Tag,
  Layers,
  Copy,
  PieChart,
  ShoppingBag,
  RotateCcw,
  Ban,
  CheckCircle2,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useResponseModal } from "../../components/common/ResponseModalContext";
import { sellerService, uploadService } from "../../services";

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

export default function SellerInventoryModuleScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { showConfirm, showSuccess, showError, showWarning } = useResponseModal();

  // Inventory data state
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Search & Filters
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<"latest" | "oldest">("latest");
  const [sortOrder, setSortOrder] = useState<"ascending" | "descending">("descending");
  const [statusFilter, setStatusFilter] = useState<"all" | "approved" | "pending" | "rejected">("all");

  // Selection & Bulk Actions
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  // Action Sheets & Detail Modals
  const [activeProductAction, setActiveProductAction] = useState<any | null>(null);
  const [detailModalProduct, setDetailModalProduct] = useState<any | null>(null);
  const [qrModalProduct, setQrModalProduct] = useState<any | null>(null);
  const [detailImageIdx, setDetailImageIdx] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);

  // Variant Flow States (Add / Edit Variant Modal)
  const [variantModalOpen, setVariantModalOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState<any | null>(null);
  const [variantPrice, setVariantPrice] = useState("");
  const [variantPromoPrice, setVariantPromoPrice] = useState("");
  const [variantQuantity, setVariantQuantity] = useState("10");
  const [variantSku, setVariantSku] = useState("");
  const [variantAttributes, setVariantAttributes] = useState<Record<string, string>>({
    Color: "Default",
    Size: "M",
  });
  const [variantNewAttrKey, setVariantNewAttrKey] = useState("");
  const [variantNewAttrVal, setVariantNewAttrVal] = useState("");
  const [variantHasImage, setVariantHasImage] = useState(false);
  const [variantImageUrl, setVariantImageUrl] = useState<string | null>(null);
  const [savingVariant, setSavingVariant] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

  // Fetch Inventory Products
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await sellerService.getProducts();
      const list =
        res?.data?.data?.products ||
        res?.data?.data ||
        res?.data?.products ||
        res?.data ||
        [];
      if (Array.isArray(list)) {
        setProducts(list);
      } else {
        setProducts([]);
      }
    } catch (err: any) {
      console.warn("Error fetching seller inventory:", err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProducts();
    setRefreshing(false);
  };

  // Metrics (Derived summary cards matching web)
  const totalCount = products.length;
  const lowStockCount = useMemo(() => {
    return products.filter((p) => {
      const qty = p.totalQuantity ?? p.quantity ?? 0;
      const threshold =
        p.lowStockAlert && Number(p.lowStockAlert) > 0 ? Number(p.lowStockAlert) : 2;
      return qty > 0 && qty <= threshold;
    }).length;
  }, [products]);

  const expiredCount = useMemo(() => {
    const now = new Date();
    return products.filter((p) => p.expiryDate && new Date(p.expiryDate) < now).length;
  }, [products]);

  // Filtering & Sorting
  const filteredProducts = useMemo(() => {
    let list = [...products];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => {
        const name = (p.name || p.title || "").toLowerCase();
        const cat = (typeof p.category === "string" ? p.category : p.category?.name || "").toLowerCase();
        return name.includes(q) || cat.includes(q);
      });
    }

    if (statusFilter !== "all") {
      list = list.filter((p) => (p.status || "pending").toLowerCase() === statusFilter);
    }

    if (sortOrder === "ascending") {
      list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    } else {
      list.sort((a, b) => (b.name || "").localeCompare(a.name || ""));
    }

    if (sortField === "latest") {
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    } else if (sortField === "oldest") {
      list.sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
    }

    return list;
  }, [products, search, statusFilter, sortOrder, sortField]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, sortOrder, sortField]);

  // Selection handlers
  const handleToggleSelect = (id: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedProductIds.length === paginatedProducts.length && paginatedProducts.length > 0) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(paginatedProducts.map((p) => p._id || p.id));
    }
  };

  // Delete Single Product
  const handleDeleteSingle = (id: string, name: string) => {
    setActiveProductAction(null);
    showConfirm(
      "Delete Product",
      `Are you sure you want to remove "${name}" from your store inventory?`,
      async () => {
        try {
          await sellerService.deleteProduct(id);
          setProducts((prev) => prev.filter((p) => (p._id || p.id) !== id));
          setSelectedProductIds((prev) => prev.filter((i) => i !== id));
          if (detailModalProduct && (detailModalProduct._id === id || detailModalProduct.id === id)) {
            setDetailModalProduct(null);
          }
          showSuccess("Product Deleted", "The product was removed from your store.");
        } catch (err: any) {
          showError("Delete Failed", err?.response?.data?.message || "Failed to delete product.");
        }
      },
      undefined,
      "Delete",
      "Cancel"
    );
  };

  // Bulk Delete
  const handleBulkDelete = () => {
    if (selectedProductIds.length === 0) {
      showWarning("No Products Selected", "Please select one or more products to delete.");
      return;
    }
    showConfirm(
      "Delete Selected Products",
      `Are you sure you want to delete ${selectedProductIds.length} selected product(s)? This action cannot be undone.`,
      async () => {
        try {
          await Promise.all(selectedProductIds.map((id) => sellerService.deleteProduct(id)));
          setProducts((prev) => prev.filter((p) => !selectedProductIds.includes(p._id || p.id)));
          setSelectedProductIds([]);
          showSuccess("Products Deleted", "Selected products removed successfully.");
        } catch (err: any) {
          showError("Bulk Delete Failed", err?.response?.data?.message || "Failed to delete products.");
        }
      },
      undefined,
      "Delete All Selected",
      "Cancel"
    );
  };

  // Share / Copy Link
  const handleShareProductLink = async (p: any) => {
    const pid = p._id || p.id;
    const url = `https://www.abamba.com.ng/products/${pid}`;
    try {
      await Share.share({
        title: p.name || "Product on Abamba",
        message: `Check out ${p.name || "this item"} on Abamba: ${url}`,
        url,
      });
    } catch {}
  };

  const handleCopyLink = (p: any) => {
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // VARIANT FLOW HANDLERS
  const openAddVariantModal = () => {
    setEditingVariant(null);
    setVariantPrice(
      String(
        detailModalProduct?.bonusPrice ||
          detailModalProduct?.price ||
          detailModalProduct?.basePrice ||
          ""
      )
    );
    setVariantPromoPrice("");
    setVariantQuantity("10");
    setVariantSku(
      `${(detailModalProduct?.name || "PRD").slice(0, 3).toUpperCase()}-V${Date.now().toString().slice(-4)}`
    );
    setVariantAttributes({ Color: "Default", Size: "M" });
    setVariantHasImage(false);
    setVariantImageUrl(null);
    setVariantModalOpen(true);
  };

  const openEditVariantModal = (v: any) => {
    setEditingVariant(v);
    setVariantPrice(String(v.price || ""));
    setVariantPromoPrice(String(v.promoPrice || ""));
    setVariantQuantity(String(v.quantity || "10"));
    setVariantSku(v.sku || "");
    setVariantAttributes(v.attributes ? { ...v.attributes } : { Color: "Default" });
    const hasImg = Array.isArray(v.images) && v.images.length > 0 && Boolean(v.images[0]?.url);
    setVariantHasImage(hasImg);
    setVariantImageUrl(hasImg ? v.images[0].url : null);
    setVariantModalOpen(true);
  };

  const handlePickVariantImage = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });
      if (!res.canceled && res.assets && res.assets.length > 0) {
        const uri = res.assets[0].uri;
        setVariantImageUrl(uri);
        setVariantHasImage(true);

        const formData = new FormData();
        const filename = uri.split("/").pop() || "variant.jpg";
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpeg`;

        formData.append("file", {
          uri,
          name: filename,
          type,
        } as any);

        try {
          const uploadRes = await uploadService.uploadFile(formData);
          const remoteUrl = uploadRes?.data?.data?.url || uploadRes?.data?.url;
          if (remoteUrl) {
            setVariantImageUrl(remoteUrl);
          }
        } catch {
          // Keep local uri fallback
        }
      }
    } catch {
      showError("Image Error", "Could not pick image for variant.");
    }
  };

  const handleSaveVariant = async () => {
    if (!detailModalProduct) return;
    const prodId = detailModalProduct._id || detailModalProduct.id;
    const numPrice = Number(variantPrice);
    if (!numPrice || numPrice <= 0) {
      showWarning("Price Required", "Please enter a valid variant price.");
      return;
    }

    try {
      setSavingVariant(true);

      const payload: any = {
        attributes: variantAttributes,
        price: numPrice,
        quantity: Math.max(Number(variantQuantity) || 1, 0),
        sku: variantSku || `SKU-${Date.now().toString().slice(-4)}`,
      };

      if (variantPromoPrice && Number(variantPromoPrice) > 0) {
        payload.promoPrice = Number(variantPromoPrice);
      }

      if (variantHasImage && variantImageUrl) {
        payload.images = [{ url: variantImageUrl, altText: payload.sku }];
      }

      if (editingVariant) {
        const vId = editingVariant._id || editingVariant.id;
        await sellerService.updateVariant(prodId, vId, payload);
        // Update locally in modal
        setDetailModalProduct((prev: any) => {
          if (!prev) return prev;
          const updatedVariants = (prev.variants || []).map((v: any) =>
            (v._id === vId || v.id === vId) ? { ...v, ...payload } : v
          );
          return { ...prev, variants: updatedVariants };
        });
        showSuccess("Variant Updated", "Product variant successfully updated.");
      } else {
        await sellerService.addVariant(prodId, payload);
        const newObj = { ...payload, _id: `v_${Date.now()}` };
        setDetailModalProduct((prev: any) => {
          if (!prev) return prev;
          return { ...prev, variants: [...(prev.variants || []), newObj] };
        });
        showSuccess("Variant Added", "New variant added to product successfully.");
      }

      setVariantModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      showError(
        "Variant Error",
        err?.response?.data?.message || "Failed to save variant changes."
      );
    } finally {
      setSavingVariant(false);
    }
  };

  const handleDeleteVariant = (v: any) => {
    if (!detailModalProduct) return;
    const prodId = detailModalProduct._id || detailModalProduct.id;
    const vId = v._id || v.id;

    showConfirm(
      "Delete Variant",
      "Are you sure you want to permanently delete this variant?",
      async () => {
        try {
          await sellerService.deleteVariant(prodId, vId);
          setDetailModalProduct((prev: any) => {
            if (!prev) return prev;
            return {
              ...prev,
              variants: (prev.variants || []).filter(
                (item: any) => (item._id || item.id) !== vId
              ),
            };
          });
          showSuccess("Variant Deleted", "Variant removed successfully.");
          fetchProducts();
        } catch (err: any) {
          showError("Delete Failed", err?.response?.data?.message || "Could not delete variant.");
        }
      },
      undefined,
      "Delete",
      "Cancel"
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ArrowLeft size={22} color="#1F2937" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Store Inventory</Text>
            <Text style={styles.headerSub}>Manage your products & inventory</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.addHeroBtn}
          onPress={() => router.push("/seller/add-product" as any)}
          activeOpacity={0.85}
        >
          <Plus size={16} color="#FFFFFF" />
          <Text style={styles.addHeroBtnText}>Add Product</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* SUMMARY CARDS (Exact Web Layout) */}
        <View style={styles.summaryGrid}>
          {/* Card 1: All Products (Navy Card) */}
          <View style={styles.summaryNavyCard}>
            <View style={styles.summaryTopRow}>
              <View style={styles.summaryNavyIconWrap}>
                <Folder size={18} color="#FFFFFF" />
              </View>
              <Text style={styles.summaryNavyBadge}>Store Catalog</Text>
            </View>
            <View style={styles.summaryBottomWrap}>
              <Text style={styles.summaryNavyLabel}>All Products</Text>
              <Text style={styles.summaryNavyCount}>{totalCount}</Text>
            </View>
          </View>

          {/* Card 2: Low Stock & Expired (White Card) */}
          <View style={styles.summaryWhiteCard}>
            <View style={styles.summaryTopRow}>
              <View style={styles.summaryOrangeIconWrap}>
                <Users size={18} color="#EA580C" />
              </View>
              <Text style={styles.summaryWeekText}>This Week</Text>
            </View>
            <View style={styles.summaryDualRow}>
              <View style={styles.summaryCol}>
                <Text style={styles.lowStockLabel}>Low Stock Alert</Text>
                <Text style={styles.lowStockCount}>{lowStockCount}</Text>
              </View>
              <View style={[styles.summaryCol, { borderLeftWidth: 1, borderLeftColor: "#F3F4F6", paddingLeft: 12 }]}>
                <Text style={styles.expiredLabel}>Expired</Text>
                <Text style={styles.expiredCount}>{expiredCount}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* SEARCH & FILTER CONTROLS */}
        <View style={styles.filterSectionCard}>
          {/* Search Bar */}
          <View style={styles.searchBar}>
            <Search size={18} color="#9CA3AF" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search products by title or category..."
              placeholderTextColor="#9CA3AF"
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch("")} style={{ padding: 4 }}>
                <X size={16} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>

          {/* Filter Pills: All, Approved, Pending, Rejected */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.statusPillsRow}
          >
            {[
              { id: "all", label: "All Items" },
              { id: "approved", label: "Approved" },
              { id: "pending", label: "Pending" },
              { id: "rejected", label: "Rejected" },
            ].map((st) => {
              const active = statusFilter === st.id;
              return (
                <TouchableOpacity
                  key={st.id}
                  style={[styles.statusPill, active && styles.statusPillActive]}
                  onPress={() => setStatusFilter(st.id as any)}
                >
                  <Text style={[styles.statusPillText, active && styles.statusPillTextActive]}>
                    {st.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Sort & Bulk Action Toolbar */}
          <View style={styles.toolbarRow}>
            {/* Sort Toggle */}
            <TouchableOpacity
              style={styles.toolbarBtn}
              onPress={() =>
                setSortField((prev) => (prev === "latest" ? "oldest" : "latest"))
              }
            >
              <ArrowUpDown size={14} color="#4B5563" />
              <Text style={styles.toolbarBtnText}>
                {sortField === "latest" ? "Latest First" : "Oldest First"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.toolbarBtn}
              onPress={() =>
                setSortOrder((prev) => (prev === "ascending" ? "descending" : "ascending"))
              }
            >
              <Text style={styles.toolbarBtnText}>
                {sortOrder === "ascending" ? "A → Z" : "Z → A"}
              </Text>
            </TouchableOpacity>

            {/* Bulk Action Toggle */}
            {selectedProductIds.length > 0 && (
              <TouchableOpacity
                style={styles.bulkDeleteBtn}
                onPress={handleBulkDelete}
              >
                <Trash2 size={14} color="#DC2626" />
                <Text style={styles.bulkDeleteBtnText}>
                  Delete ({selectedProductIds.length})
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* SELECT ALL HEADER */}
        {paginatedProducts.length > 0 && (
          <View style={styles.selectionHeaderRow}>
            <TouchableOpacity
              style={styles.selectCheckRow}
              onPress={handleSelectAll}
            >
              {selectedProductIds.length === paginatedProducts.length && paginatedProducts.length > 0 ? (
                <CheckSquare size={18} color="#003459" />
              ) : (
                <Square size={18} color="#9CA3AF" />
              )}
              <Text style={styles.selectHeaderText}>
                Select All on Page ({paginatedProducts.length})
              </Text>
            </TouchableOpacity>

            <Text style={styles.showingText}>
              Page {currentPage} of {totalPages} ({filteredProducts.length} items)
            </Text>
          </View>
        )}

        {/* PRODUCTS LIST */}
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color="#003459" />
            <Text style={styles.loadingText}>Loading store inventory...</Text>
          </View>
        ) : filteredProducts.length === 0 ? (
          <View style={styles.emptyCard}>
            <Package size={48} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No Products Found</Text>
            <Text style={styles.emptySubtitle}>
              {search.trim() || statusFilter !== "all"
                ? "No inventory matches your current search or status filter."
                : "You have not uploaded any products to your store yet."}
            </Text>
            <TouchableOpacity
              style={styles.emptyAddBtn}
              onPress={() => router.push("/seller/add-product" as any)}
            >
              <Plus size={16} color="#FFFFFF" />
              <Text style={styles.emptyAddBtnText}>Upload First Product</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.productListWrap}>
            {paginatedProducts.map((p) => {
              const pid = p._id || p.id;
              const isSelected = selectedProductIds.includes(pid);
              const pName = p.name || p.title || "Untitled Product";
              const pCategory = typeof p.category === "string" ? p.category : p.category?.name || "General";
              const pImage = p.images?.[0]?.url || p.images?.[0] || p.image || null;
              const pStock = p.totalQuantity ?? p.quantity ?? 0;
              const pStatus = (p.status || "approved").toLowerCase();

              // Bonus Week & Pricing Logic matching web
              const hasBonus = Boolean(
                p.isBonusPrice ||
                p.hasBonus ||
                (p.bonusPrice &&
                  Number(p.bonusPrice) > 0 &&
                  Number(p.bonusPrice) < Number(p.basePrice || p.price))
              );
              const sellingPrice = hasBonus
                ? Number(p.bonusPrice ?? p.price ?? 0)
                : Number(p.price ?? p.basePrice ?? 0);
              const originalPrice = Number(p.basePrice ?? p.price ?? 0);

              const isLowStock = pStock > 0 && pStock <= (p.lowStockAlert || 2);
              const isOutOfStock = pStock <= 0;

              return (
                <View
                  key={pid}
                  style={[styles.productCard, isSelected && styles.productCardSelected]}
                >
                  {/* Select Checkbox */}
                  <TouchableOpacity
                    style={styles.cardCheckbox}
                    onPress={() => handleToggleSelect(pid)}
                  >
                    {isSelected ? (
                      <CheckSquare size={20} color="#003459" />
                    ) : (
                      <Square size={20} color="#D1D5DB" />
                    )}
                  </TouchableOpacity>

                  {/* Thumbnail */}
                  <TouchableOpacity
                    style={styles.cardThumbWrap}
                    onPress={() => {
                      setDetailModalProduct(p);
                      setDetailImageIdx(0);
                    }}
                  >
                    {pImage ? (
                      <Image source={{ uri: pImage }} style={styles.cardThumb} />
                    ) : (
                      <Package size={22} color="#9CA3AF" />
                    )}
                  </TouchableOpacity>

                  {/* Info Column */}
                  <TouchableOpacity
                    style={styles.cardDetails}
                    onPress={() => {
                      setDetailModalProduct(p);
                      setDetailImageIdx(0);
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={styles.cardTitleRow}>
                      <Text style={styles.cardTitle} numberOfLines={1}>
                        {pName}
                      </Text>
                      {hasBonus && (
                        <View style={styles.bonusTag}>
                          <Text style={styles.bonusTagText}>Bonus Week</Text>
                        </View>
                      )}
                    </View>

                    <Text style={styles.cardCategory}>{pCategory}</Text>

                    {/* Price Row */}
                    <View style={styles.cardPriceRow}>
                      <Text style={styles.cardSellingPrice}>
                        ₦{sellingPrice.toLocaleString()}
                      </Text>
                      {hasBonus && originalPrice > sellingPrice && (
                        <Text style={styles.cardOriginalPrice}>
                          ₦{originalPrice.toLocaleString()}
                        </Text>
                      )}
                    </View>

                    {/* Meta Badges Row */}
                    <View style={styles.cardMetaRow}>
                      {/* Status */}
                      <View
                        style={[
                          styles.statusBadge,
                          pStatus === "approved"
                            ? styles.statusApproved
                            : pStatus === "rejected"
                            ? styles.statusRejected
                            : styles.statusPending,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusBadgeText,
                            pStatus === "approved"
                              ? styles.statusTextApproved
                              : pStatus === "rejected"
                              ? styles.statusTextRejected
                              : styles.statusTextPending,
                          ]}
                        >
                          {pStatus.charAt(0).toUpperCase() + pStatus.slice(1)}
                        </Text>
                      </View>

                      {/* Stock indicator */}
                      <View
                        style={[
                          styles.stockBadge,
                          isOutOfStock
                            ? styles.stockOut
                            : isLowStock
                            ? styles.stockLow
                            : styles.stockOk,
                        ]}
                      >
                        <Text
                          style={[
                            styles.stockBadgeText,
                            isOutOfStock
                              ? styles.stockOutText
                              : isLowStock
                              ? styles.stockLowText
                              : styles.stockOkText,
                          ]}
                        >
                          {isOutOfStock
                            ? "Out of Stock"
                            : isLowStock
                            ? `Low (${pStock})`
                            : `${pStock} in stock`}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>

                  {/* Actions Menu Trigger */}
                  <TouchableOpacity
                    style={styles.cardMenuBtn}
                    onPress={() => setActiveProductAction(p)}
                  >
                    <MoreVertical size={20} color="#6B7280" />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

        {/* PAGINATION CONTROLS (Web Exact) */}
        {totalPages > 1 && (
          <View style={styles.paginationCard}>
            <TouchableOpacity
              style={[styles.pageBtn, currentPage === 1 && styles.pageBtnDisabled]}
              onPress={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft size={16} color={currentPage === 1 ? "#9CA3AF" : "#1F2937"} />
              <Text style={[styles.pageBtnText, currentPage === 1 && styles.pageBtnTextDisabled]}>
                Prev
              </Text>
            </TouchableOpacity>

            <Text style={styles.pageIndicator}>
              {currentPage} / {totalPages}
            </Text>

            <TouchableOpacity
              style={[styles.pageBtn, currentPage === totalPages && styles.pageBtnDisabled]}
              onPress={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              <Text style={[styles.pageBtnText, currentPage === totalPages && styles.pageBtnTextDisabled]}>
                Next
              </Text>
              <ChevronRight size={16} color={currentPage === totalPages ? "#9CA3AF" : "#1F2937"} />
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>

      {/* ACTION SHEET BOTTOM MODAL (View Product, Product Reviews, QR Code, Delete) */}
      <Modal
        visible={Boolean(activeProductAction)}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveProductAction(null)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setActiveProductAction(null)}
        >
          <View style={styles.actionSheetCard}>
            <View style={styles.actionSheetHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.actionSheetTitle} numberOfLines={1}>
                  {activeProductAction?.name || "Product Actions"}
                </Text>
                <Text style={styles.actionSheetSub}>Choose an action for this inventory item</Text>
              </View>
              <TouchableOpacity
                onPress={() => setActiveProductAction(null)}
                style={styles.actionSheetClose}
              >
                <X size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Option 1: View Product Details */}
            <TouchableOpacity
              style={styles.actionRowItem}
              onPress={() => {
                const prod = activeProductAction;
                setActiveProductAction(null);
                setDetailModalProduct(prod);
                setDetailImageIdx(0);
              }}
            >
              <View style={[styles.actionIconBox, { backgroundColor: "#EFF6FF" }]}>
                <Eye size={18} color="#003459" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.actionItemText}>View Product Details</Text>
                <Text style={styles.actionItemSub}>Inspect specifications, images & variants</Text>
              </View>
            </TouchableOpacity>

            {/* Option 2: Edit Product */}
            <TouchableOpacity
              style={styles.actionRowItem}
              onPress={() => {
                const pid = activeProductAction?._id || activeProductAction?.id;
                setActiveProductAction(null);
                router.push({
                  pathname: "/seller/add-product",
                  params: { productId: pid },
                } as any);
              }}
            >
              <View style={[styles.actionIconBox, { backgroundColor: "#EEF2FF" }]}>
                <Edit size={18} color="#4F46E5" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.actionItemText}>Edit Product</Text>
                <Text style={styles.actionItemSub}>Modify product details, pricing & images</Text>
              </View>
            </TouchableOpacity>

            {/* Option 2: Product Reviews */}
            <TouchableOpacity
              style={styles.actionRowItem}
              onPress={() => {
                setActiveProductAction(null);
                router.push("/seller/reviews" as any);
              }}
            >
              <View style={[styles.actionIconBox, { backgroundColor: "#FEF3C7" }]}>
                <Star size={18} color="#D97706" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.actionItemText}>Product Reviews</Text>
                <Text style={styles.actionItemSub}>See ratings & customer feedback</Text>
              </View>
            </TouchableOpacity>

            {/* Option 3: Product QR Code & Share */}
            <TouchableOpacity
              style={styles.actionRowItem}
              onPress={() => {
                const prod = activeProductAction;
                setActiveProductAction(null);
                setQrModalProduct(prod);
              }}
            >
              <View style={[styles.actionIconBox, { backgroundColor: "#F3E8FF" }]}>
                <QrCode size={18} color="#7C3AED" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.actionItemText}>Product QR & Share</Text>
                <Text style={styles.actionItemSub}>Direct share link & QR code for store promo</Text>
              </View>
            </TouchableOpacity>

            {/* Option 4: Delete Product */}
            <TouchableOpacity
              style={[styles.actionRowItem, { borderBottomWidth: 0 }]}
              onPress={() =>
                handleDeleteSingle(
                  activeProductAction?._id || activeProductAction?.id,
                  activeProductAction?.name
                )
              }
            >
              <View style={[styles.actionIconBox, { backgroundColor: "#FEE2E2" }]}>
                <Trash2 size={18} color="#DC2626" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.actionItemText, { color: "#DC2626" }]}>
                  Delete Product
                </Text>
                <Text style={styles.actionItemSub}>Remove from inventory permanently</Text>
              </View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* DYNAMIC PRODUCT DETAIL MODAL (Matching http://localhost:3000/seller/...&inventory=ID) */}
      <Modal
        visible={Boolean(detailModalProduct)}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setDetailModalProduct(null)}
      >
        <View style={[styles.detailModalContainer, { paddingTop: insets.top }]}>
          {/* Header */}
          <View style={styles.detailHeader}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => setDetailModalProduct(null)}
            >
              <ArrowLeft size={22} color="#1F2937" />
            </TouchableOpacity>
            <Text style={styles.detailHeaderTitle}>Inventory Details</Text>
            <TouchableOpacity
              style={styles.detailShareBtn}
              onPress={() => handleShareProductLink(detailModalProduct)}
            >
              <Share2 size={18} color="#003459" />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.detailScroll}
            showsVerticalScrollIndicator={false}
          >
            {/* Title & Top Action Bar (Matching Web dynamic-inventory) */}
            <View style={styles.detailTitleBox}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <Text style={styles.detailTitleText}>{detailModalProduct?.name}</Text>
                {Boolean(
                  detailModalProduct?.isBonusPrice ||
                  (detailModalProduct?.bonusPrice &&
                    Number(detailModalProduct?.bonusPrice) > 0)
                ) && (
                  <View style={styles.bonusTag}>
                    <Text style={styles.bonusTagText}>Bonus Week</Text>
                  </View>
                )}
              </View>

              <View style={styles.detailMetaRowWeb}>
                <Text style={styles.detailCreatedText}>
                  Created At: {formatDate(detailModalProduct?.createdAt)}
                </Text>

                <TouchableOpacity
                  style={styles.copyLinkBtn}
                  onPress={() => handleCopyLink(detailModalProduct)}
                >
                  <Copy size={13} color="#003459" />
                  <Text style={styles.copyLinkBtnText}>
                    {copiedLink ? "Link Copied!" : "Copy Product URL"}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Action Buttons: Edit Product & Unpublish */}
              <View style={styles.detailTopActionBtnsRow}>
                <TouchableOpacity
                  style={styles.editProductHeroBtn}
                  onPress={() => {
                    const pid = detailModalProduct?._id || detailModalProduct?.id;
                    setDetailModalProduct(null);
                    router.push({
                      pathname: "/seller/add-product",
                      params: { productId: pid },
                    } as any);
                  }}
                >
                  <Edit size={14} color="#FFFFFF" />
                  <Text style={styles.editProductHeroBtnText}>Edit Product</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.unpublishHeroBtn}
                  onPress={() =>
                    handleDeleteSingle(
                      detailModalProduct?._id || detailModalProduct?.id,
                      detailModalProduct?.name
                    )
                  }
                >
                  <Trash2 size={14} color="#FFFFFF" />
                  <Text style={styles.unpublishHeroBtnText}>Unpublish</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Product Image Viewer with Left / Right Arrows (Web exact) */}
            <View style={styles.detailImageContainer}>
              {detailModalProduct?.images && detailModalProduct.images.length > 0 ? (
                <>
                  <View style={styles.detailImageWrap}>
                    <Image
                      source={{
                        uri:
                          detailModalProduct.images[detailImageIdx]?.url ||
                          detailModalProduct.images[detailImageIdx] ||
                          "/placeholder.jpg",
                      }}
                      style={styles.detailMainImage}
                      resizeMode="contain"
                    />

                    {detailModalProduct.images.length > 1 && (
                      <>
                        <TouchableOpacity
                          style={[styles.imageNavBtn, styles.imageNavBtnLeft]}
                          onPress={() =>
                            setDetailImageIdx((prev) =>
                              prev === 0 ? detailModalProduct.images.length - 1 : prev - 1
                            )
                          }
                        >
                          <ChevronLeft size={18} color="#111827" />
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.imageNavBtn, styles.imageNavBtnRight]}
                          onPress={() =>
                            setDetailImageIdx((prev) =>
                              (prev + 1) % detailModalProduct.images.length
                            )
                          }
                        >
                          <ChevronRight size={18} color="#111827" />
                        </TouchableOpacity>
                      </>
                    )}
                  </View>

                  {detailModalProduct.images.length > 1 && (
                    <View style={styles.detailImageThumbRow}>
                      {detailModalProduct.images.map((img: any, idx: number) => (
                        <TouchableOpacity
                          key={idx}
                          style={[
                            styles.detailThumbWrap,
                            detailImageIdx === idx && styles.detailThumbWrapActive,
                          ]}
                          onPress={() => setDetailImageIdx(idx)}
                        >
                          <Image
                            source={{ uri: img?.url || img }}
                            style={styles.detailThumbImg}
                          />
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </>
              ) : (
                <View style={styles.detailNoImageWrap}>
                  <Package size={48} color="#9CA3AF" />
                  <Text style={{ color: "#9CA3AF", fontSize: 13, marginTop: 6 }}>
                    No product image uploaded
                  </Text>
                </View>
              )}
            </View>

            {/* Web-Exact Summary Cards (Price & In Stock + Total Orders) */}
            <View style={styles.webStatCardsRow}>
              {/* Card 1: Last Order & Price / In Stock */}
              <View style={styles.webStatCardLarge}>
                <View style={styles.webStatCardHeader}>
                  <Text style={styles.webStatCardSub}>
                    Last Order: <Text style={{ color: "#111827", fontWeight: "700" }}>Recent</Text>
                  </Text>
                  <View
                    style={[
                      styles.statusBadge,
                      (detailModalProduct?.status || "approved") === "approved"
                        ? styles.statusApproved
                        : styles.statusPending,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        (detailModalProduct?.status || "approved") === "approved"
                          ? styles.statusTextApproved
                          : styles.statusTextPending,
                      ]}
                    >
                      {((detailModalProduct?.status || "approved")).toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={styles.webStatCardBodyRow}>
                  <View>
                    <Text style={styles.webStatLabelSmall}>Price</Text>
                    <Text style={styles.webStatPriceBold}>
                      ₦
                      {Number(
                        detailModalProduct?.bonusPrice ||
                          detailModalProduct?.price ||
                          detailModalProduct?.basePrice ||
                          0
                      ).toLocaleString()}
                    </Text>
                    {Boolean(detailModalProduct?.bonusPrice) && (
                      <Text style={styles.webStatOldPrice}>
                        ₦{Number(detailModalProduct?.basePrice || detailModalProduct?.price || 0).toLocaleString()}
                      </Text>
                    )}
                  </View>

                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={styles.webStatLabelSmall}>In Stock</Text>
                    <Text style={styles.webStatStockBold}>
                      {detailModalProduct?.totalQuantity ?? detailModalProduct?.quantity ?? 0}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Card 2: Total Orders Icon Box */}
              <View style={styles.webStatCardSmall}>
                <View style={styles.pieIconWrap}>
                  <PieChart size={20} color="#5570F1" />
                </View>
                <View>
                  <Text style={styles.webStatLabelSmall}>Total Orders</Text>
                  <Text style={styles.webStatOrdersCount}>
                    {detailModalProduct?.orderCount || "0"}
                  </Text>
                </View>
              </View>
            </View>

            {/* This Week Activity Metrics (Variants, Low Stock Alert, Total Quantity) */}
            <View style={styles.webActivityRow}>
              {/* Activity Card 1 */}
              <View style={styles.activityBox}>
                <View style={styles.activityBoxTop}>
                  <View style={styles.bagIconWrap}>
                    <ShoppingBag size={16} color="#EA580C" />
                  </View>
                  <Text style={styles.activityWeekText}>This Week</Text>
                </View>
                <View style={styles.activityMetricsCols}>
                  <View style={styles.activityMetricItem}>
                    <Text style={styles.activityMetricLabel}>Variants</Text>
                    <Text style={styles.activityMetricVal}>
                      {detailModalProduct?.variants?.length || 0}
                    </Text>
                  </View>
                  <View style={styles.activityMetricItem}>
                    <Text style={styles.activityMetricLabel}>Low Stock Alert</Text>
                    <Text style={styles.activityMetricVal}>
                      {detailModalProduct?.lowStockAlert || 2}
                    </Text>
                  </View>
                  <View style={styles.activityMetricItem}>
                    <Text style={styles.activityMetricLabel}>Total Qty</Text>
                    <Text style={styles.activityMetricVal}>
                      {detailModalProduct?.totalQuantity ?? detailModalProduct?.quantity ?? 0}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Activity Card 2: Canceled / Returned / Damaged */}
              <View style={styles.activityBox}>
                <View style={styles.activityBoxTop}>
                  <View style={styles.bagIconWrap}>
                    <RotateCcw size={16} color="#EA580C" />
                  </View>
                  <Text style={styles.activityWeekText}>This Week</Text>
                </View>
                <View style={styles.activityMetricsCols}>
                  <View style={styles.activityMetricItem}>
                    <Text style={styles.activityMetricLabel}>Canceled</Text>
                    <Text style={styles.activityMetricVal}>0</Text>
                  </View>
                  <View style={styles.activityMetricItem}>
                    <Text style={styles.activityMetricLabel}>Returned</Text>
                    <Text style={styles.activityMetricVal}>0</Text>
                  </View>
                  <View style={styles.activityMetricItem}>
                    <Text style={styles.activityMetricLabel}>Damaged</Text>
                    <Text style={styles.activityMetricVal}>0</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Specifications Card (Clean specs, no raw database ID) */}
            <View style={styles.detailSectionCard}>
              <Text style={styles.detailSectionHeading}>Specifications</Text>
              <View style={styles.specRow}>
                <Text style={styles.specLabel}>Category</Text>
                <Text style={styles.specVal}>
                  {typeof detailModalProduct?.category === "string"
                    ? detailModalProduct?.category
                    : detailModalProduct?.category?.name || "General"}
                </Text>
              </View>
              <View style={styles.specRow}>
                <Text style={styles.specLabel}>Weight</Text>
                <Text style={styles.specVal}>{detailModalProduct?.weight || 1} kg</Text>
              </View>
              <View style={[styles.specRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.specLabel}>Featured in Store</Text>
                <Text style={styles.specVal}>
                  {detailModalProduct?.featured ? "Yes (Active)" : "Standard"}
                </Text>
              </View>
            </View>

            {/* Description */}
            <View style={styles.detailSectionCard}>
              <Text style={styles.detailSectionHeading}>Product Description</Text>
              <Text style={styles.detailDescriptionText}>
                {detailModalProduct?.description || "No description provided for this item."}
              </Text>
            </View>

            {/* COMPLETE PRODUCT VARIANTS FLOW (Matching dynamic-inventory.jsx) */}
            <View style={styles.detailSectionCard}>
              <View style={styles.variantsHeaderRow}>
                <View>
                  <Text style={styles.detailSectionHeading}>Product Variants</Text>
                  <Text style={styles.variantsSubText}>
                    {detailModalProduct?.variants?.length || 0} configured option(s)
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.addVariantHeaderBtn}
                  onPress={openAddVariantModal}
                >
                  <Plus size={14} color="#FFFFFF" />
                  <Text style={styles.addVariantHeaderBtnText}>Add Variant</Text>
                </TouchableOpacity>
              </View>

              {detailModalProduct?.variants && detailModalProduct.variants.length > 0 ? (
                <View style={styles.variantTableWrap}>
                  {detailModalProduct.variants.map((v: any, idx: number) => {
                    const attrs = Object.entries(v.attributes || {})
                      .map(([k, val]) => `${k}: ${val}`)
                      .join(" / ");
                    const hasVariantImg =
                      Array.isArray(v.images) &&
                      v.images.length > 0 &&
                      Boolean(v.images[0]?.url);
                    const vImg = hasVariantImg
                      ? v.images[0].url
                      : detailModalProduct?.images?.[0]?.url || null;

                    return (
                      <View key={v._id || v.id || idx} style={styles.variantTableRow}>
                        <View style={styles.variantThumbWrap}>
                          {vImg ? (
                            <Image source={{ uri: vImg }} style={styles.variantThumb} />
                          ) : (
                            <Layers size={18} color="#9CA3AF" />
                          )}
                        </View>

                        <View style={styles.variantInfoCol}>
                          <Text style={styles.variantAttrsTitle}>
                            {attrs || `Variant #${idx + 1}`}
                          </Text>
                          <Text style={styles.variantMetaText}>
                            Stock: {v.quantity || 0} • SKU: {v.sku || "N/A"}
                          </Text>
                          <View style={styles.variantPriceRow}>
                            <Text style={styles.variantPriceText}>
                              ₦{Number(v.price || 0).toLocaleString()}
                            </Text>
                            {Boolean(v.promoPrice) && (
                              <Text style={styles.variantPromoText}>
                                Promo: ₦{Number(v.promoPrice).toLocaleString()}
                              </Text>
                            )}
                          </View>
                        </View>

                        <View style={styles.variantActionCol}>
                          <TouchableOpacity
                            style={styles.variantEditBtn}
                            onPress={() => openEditVariantModal(v)}
                          >
                            <Edit size={14} color="#003459" />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.variantDeleteBtn}
                            onPress={() => handleDeleteVariant(v)}
                          >
                            <Trash2 size={14} color="#DC2626" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                </View>
              ) : (
                <View style={styles.noVariantsBox}>
                  <Layers size={32} color="#9CA3AF" />
                  <Text style={styles.noVariantsTitle}>No variants configured</Text>
                  <Text style={styles.noVariantsSub}>
                    Add variations like size, color, or material to this product.
                  </Text>
                  <TouchableOpacity
                    style={styles.noVariantsAddBtn}
                    onPress={openAddVariantModal}
                  >
                    <Plus size={14} color="#003459" />
                    <Text style={styles.noVariantsAddBtnText}>Add First Variant</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </Modal>

      {/* ADD / EDIT VARIANT MODAL (Matching add-variant-dialog.jsx & edit-variant-dialog.jsx) */}
      <Modal
        visible={variantModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (!savingVariant) setVariantModalOpen(false);
        }}
      >
        <View style={styles.variantModalBackdrop}>
          <View style={styles.variantModalCard}>
            <View style={styles.variantModalHeader}>
              <View>
                <Text style={styles.variantModalTitle}>
                  {editingVariant ? "Edit Variant" : "Add Product Variant"}
                </Text>
                <Text style={styles.variantModalSub}>
                  Configure attributes, price and stock quantity
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setVariantModalOpen(false)}
                disabled={savingVariant}
                style={{ padding: 4 }}
              >
                <X size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
              {/* Attributes Map */}
              <Text style={styles.formSectionLabel}>Variant Attributes</Text>
              {Object.entries(variantAttributes).map(([k, v]) => (
                <View key={k} style={styles.attrInputRow}>
                  <Text style={styles.attrKeyLabel}>{k}:</Text>
                  <TextInput
                    style={styles.attrValInput}
                    value={v}
                    placeholder={`e.g. ${k === "Color" ? "Blue" : "XL"}`}
                    placeholderTextColor="#9CA3AF"
                    onChangeText={(txt) =>
                      setVariantAttributes((prev) => ({ ...prev, [k]: txt }))
                    }
                  />
                  <TouchableOpacity
                    onPress={() => {
                      setVariantAttributes((prev) => {
                        const copy = { ...prev };
                        delete copy[k];
                        return copy;
                      });
                    }}
                    style={{ padding: 4 }}
                  >
                    <X size={16} color="#DC2626" />
                  </TouchableOpacity>
                </View>
              ))}

              {/* Add Custom Attribute Row */}
              <View style={styles.addCustomAttrRow}>
                <TextInput
                  style={[styles.attrValInput, { flex: 1, marginRight: 6 }]}
                  placeholder="Option (e.g. Material)"
                  placeholderTextColor="#9CA3AF"
                  value={variantNewAttrKey}
                  onChangeText={setVariantNewAttrKey}
                />
                <TextInput
                  style={[styles.attrValInput, { flex: 1, marginRight: 6 }]}
                  placeholder="Value (e.g. Cotton)"
                  placeholderTextColor="#9CA3AF"
                  value={variantNewAttrVal}
                  onChangeText={setVariantNewAttrVal}
                />
                <TouchableOpacity
                  style={styles.addAttrPillBtn}
                  onPress={() => {
                    if (variantNewAttrKey.trim() && variantNewAttrVal.trim()) {
                      setVariantAttributes((prev) => ({
                        ...prev,
                        [variantNewAttrKey.trim()]: variantNewAttrVal.trim(),
                      }));
                      setVariantNewAttrKey("");
                      setVariantNewAttrVal("");
                    }
                  }}
                >
                  <Plus size={14} color="#003459" />
                </TouchableOpacity>
              </View>

              {/* Pricing & Stock Fields */}
              <View style={styles.modalFieldsRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.fieldLabel}>Price (₦) *</Text>
                  <TextInput
                    style={styles.modalTextInput}
                    keyboardType="numeric"
                    placeholder="Variant Price"
                    placeholderTextColor="#9CA3AF"
                    value={variantPrice}
                    onChangeText={(t) => setVariantPrice(t.replace(/[^\d]/g, ""))}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.fieldLabel}>Promo Price (₦)</Text>
                  <TextInput
                    style={styles.modalTextInput}
                    keyboardType="numeric"
                    placeholder="Optional Promo"
                    placeholderTextColor="#9CA3AF"
                    value={variantPromoPrice}
                    onChangeText={(t) => setVariantPromoPrice(t.replace(/[^\d]/g, ""))}
                  />
                </View>
              </View>

              <View style={styles.modalFieldsRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.fieldLabel}>Quantity in Stock *</Text>
                  <TextInput
                    style={styles.modalTextInput}
                    keyboardType="numeric"
                    placeholder="Quantity"
                    placeholderTextColor="#9CA3AF"
                    value={variantQuantity}
                    onChangeText={(t) => setVariantQuantity(t.replace(/[^\d]/g, ""))}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.fieldLabel}>SKU / Code</Text>
                  <TextInput
                    style={styles.modalTextInput}
                    placeholder="e.g. PRD-XL-01"
                    placeholderTextColor="#9CA3AF"
                    value={variantSku}
                    onChangeText={setVariantSku}
                  />
                </View>
              </View>

              {/* Add Variant Specific Image Switch */}
              <View style={styles.variantImageSwitchRow}>
                <View>
                  <Text style={styles.switchTitle}>Add Variant Image</Text>
                  <Text style={styles.switchSub}>
                    Upload specific photo for this color or style
                  </Text>
                </View>
                <Switch
                  value={variantHasImage}
                  onValueChange={setVariantHasImage}
                  trackColor={{ false: "#D1D5DB", true: "#003459" }}
                />
              </View>

              {variantHasImage && (
                <View style={styles.variantImagePickerCard}>
                  {variantImageUrl ? (
                    <View style={styles.variantPreviewWrap}>
                      <Image
                        source={{ uri: variantImageUrl }}
                        style={styles.variantPickerImg}
                      />
                      <TouchableOpacity
                        style={styles.variantRemoveImgBtn}
                        onPress={() => setVariantImageUrl(null)}
                      >
                        <X size={14} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.variantPickBtn}
                      onPress={handlePickVariantImage}
                    >
                      <Plus size={20} color="#003459" />
                      <Text style={styles.variantPickBtnText}>Select Image File</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </ScrollView>

            {/* Modal Actions */}
            <View style={styles.variantModalFooter}>
              <TouchableOpacity
                style={styles.variantCancelBtn}
                onPress={() => setVariantModalOpen(false)}
                disabled={savingVariant}
              >
                <Text style={styles.variantCancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.variantSaveBtn, savingVariant && { opacity: 0.6 }]}
                onPress={handleSaveVariant}
                disabled={savingVariant}
              >
                {savingVariant ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.variantSaveBtnText}>
                    {editingVariant ? "Save Changes" : "Add Variant"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* QR CODE MODAL (Web exact: Dialog with QR Code and share link) */}
      <Modal
        visible={Boolean(qrModalProduct)}
        transparent
        animationType="fade"
        onRequestClose={() => setQrModalProduct(null)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setQrModalProduct(null)}
        >
          <View style={styles.qrModalCard}>
            <View style={styles.qrHeaderRow}>
              <Text style={styles.qrTitle}>Product QR Code</Text>
              <TouchableOpacity onPress={() => setQrModalProduct(null)}>
                <X size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <Text style={styles.qrProductName} numberOfLines={2}>
              {qrModalProduct?.name}
            </Text>

            {/* QR Mockup / Share Display */}
            <View style={styles.qrPlaceholderBox}>
              <QrCode size={120} color="#003459" />
              <Text style={styles.qrLinkText} numberOfLines={1}>
                {`https://abamba.com.ng/products/${qrModalProduct?._id || qrModalProduct?.id}`}
              </Text>
            </View>

            <View style={styles.qrBtnRow}>
              <TouchableOpacity
                style={styles.qrShareBtn}
                onPress={() => handleShareProductLink(qrModalProduct)}
              >
                <Share2 size={16} color="#FFFFFF" />
                <Text style={styles.qrShareBtnText}>Share Link</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.qrCloseBtn}
                onPress={() => setQrModalProduct(null)}
              >
                <Text style={styles.qrCloseBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
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
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
  },
  headerSub: {
    fontSize: 11,
    color: "#6B7280",
  },
  addHeroBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#003459",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    gap: 6,
  },
  addHeroBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  scrollContent: {
    padding: 16,
  },

  /* SUMMARY GRIDS (Web Exact: 1 Navy Card + 1 White Card) */
  summaryGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  summaryNavyCard: {
    flex: 1,
    backgroundColor: "#003459",
    borderRadius: 14,
    padding: 14,
    justifyContent: "space-between",
    minHeight: 120,
    shadowColor: "#003459",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  summaryTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  summaryNavyIconWrap: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    padding: 7,
    borderRadius: 8,
  },
  summaryNavyBadge: {
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.75)",
    fontWeight: "600",
  },
  summaryBottomWrap: {
    marginTop: 10,
  },
  summaryNavyLabel: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.7)",
    fontWeight: "600",
  },
  summaryNavyCount: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
    marginTop: 2,
  },
  summaryWhiteCard: {
    flex: 1.2,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    justifyContent: "space-between",
    minHeight: 120,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryOrangeIconWrap: {
    backgroundColor: "rgba(255, 138, 0, 0.15)",
    padding: 7,
    borderRadius: 8,
  },
  summaryWeekText: {
    fontSize: 11,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  summaryDualRow: {
    flexDirection: "row",
    marginTop: 10,
  },
  summaryCol: {
    flex: 1,
  },
  lowStockLabel: {
    fontSize: 11,
    color: "#DC2626",
    fontWeight: "700",
  },
  lowStockCount: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
    marginTop: 2,
  },
  expiredLabel: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "600",
  },
  expiredCount: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
    marginTop: 2,
  },

  /* FILTER SECTION */
  filterSectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: "#111827",
  },
  statusPillsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
    paddingBottom: 2,
  },
  statusPill: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
  },
  statusPillActive: {
    backgroundColor: "#003459",
  },
  statusPillText: {
    fontSize: 11.5,
    fontWeight: "600",
    color: "#4B5563",
  },
  statusPillTextActive: {
    color: "#FFFFFF",
  },
  toolbarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  toolbarBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#F3F4F6",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  toolbarBtnText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#4B5563",
  },
  bulkDeleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FEE2E2",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginLeft: "auto",
  },
  bulkDeleteBtnText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#DC2626",
  },

  /* SELECTION HEADER */
  selectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  selectCheckRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  selectHeaderText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#374151",
  },
  showingText: {
    fontSize: 11,
    color: "#6B7280",
  },

  /* PRODUCT LIST & CARDS */
  loadingWrap: {
    paddingVertical: 40,
    alignItems: "center",
  },
  loadingText: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 10,
  },
  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 32,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginTop: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 12.5,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
    maxWidth: 280,
  },
  emptyAddBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#003459",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
    marginTop: 16,
  },
  emptyAddBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  productListWrap: {
    gap: 10,
  },
  productCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  productCardSelected: {
    borderColor: "#003459",
    backgroundColor: "#F8FAFC",
  },
  cardCheckbox: {
    padding: 4,
    marginRight: 6,
  },
  cardThumbWrap: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginRight: 10,
  },
  cardThumb: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  cardDetails: {
    flex: 1,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  cardTitle: {
    fontSize: 13.5,
    fontWeight: "700",
    color: "#111827",
    flexShrink: 1,
  },
  bonusTag: {
    backgroundColor: "#FFEDD5",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: "#FDBA74",
  },
  bonusTagText: {
    fontSize: 9.5,
    fontWeight: "800",
    color: "#C2410C",
  },
  cardCategory: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 1,
  },
  cardPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 3,
  },
  cardSellingPrice: {
    fontSize: 13.5,
    fontWeight: "800",
    color: "#003459",
  },
  cardOriginalPrice: {
    fontSize: 11.5,
    color: "#9CA3AF",
    textDecorationLine: "line-through",
  },
  cardMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusApproved: {
    backgroundColor: "#DCFCE7",
  },
  statusPending: {
    backgroundColor: "#FEF3C7",
  },
  statusRejected: {
    backgroundColor: "#FEE2E2",
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  statusTextApproved: {
    color: "#15803D",
  },
  statusTextPending: {
    color: "#B45309",
  },
  statusTextRejected: {
    color: "#B91C1C",
  },
  stockBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  stockOk: {
    backgroundColor: "#F3F4F6",
  },
  stockLow: {
    backgroundColor: "#FEF2F2",
  },
  stockOut: {
    backgroundColor: "#4B5563",
  },
  stockBadgeText: {
    fontSize: 10,
    fontWeight: "600",
  },
  stockOkText: {
    color: "#374151",
  },
  stockLowText: {
    color: "#DC2626",
    fontWeight: "700",
  },
  stockOutText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  cardMenuBtn: {
    padding: 8,
  },

  /* PAGINATION */
  paginationCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 10,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  pageBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: "#F3F4F6",
  },
  pageBtnDisabled: {
    opacity: 0.4,
  },
  pageBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1F2937",
  },
  pageBtnTextDisabled: {
    color: "#9CA3AF",
  },
  pageIndicator: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4B5563",
  },

  /* ACTION SHEET MODAL */
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    justifyContent: "flex-end",
  },
  actionSheetCard: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 36,
  },
  actionSheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    marginBottom: 6,
  },
  actionSheetTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111827",
  },
  actionSheetSub: {
    fontSize: 11.5,
    color: "#6B7280",
    marginTop: 2,
  },
  actionSheetClose: {
    padding: 4,
  },
  actionRowItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    gap: 12,
  },
  actionIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  actionItemText: {
    fontSize: 13.5,
    fontWeight: "700",
    color: "#111827",
  },
  actionItemSub: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 2,
  },

  /* DETAIL MODAL (Matching http://localhost:3000/seller/...&inventory=ID) */
  detailModalContainer: {
    flex: 1,
    backgroundColor: "#F9FAFB",
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
  detailHeaderTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
  },
  detailShareBtn: {
    padding: 6,
  },
  detailScroll: {
    padding: 16,
  },
  detailTitleBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  detailTitleText: {
    fontSize: 17,
    fontWeight: "800",
    color: "#111827",
    flex: 1,
  },
  detailMetaRowWeb: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
    flexWrap: "wrap",
    gap: 8,
  },
  detailCreatedText: {
    fontSize: 12,
    color: "#6B7280",
  },
  copyLinkBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  copyLinkBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#003459",
  },
  detailTopActionBtnsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  editProductHeroBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#003459",
    paddingVertical: 9,
    borderRadius: 8,
  },
  editProductHeroBtnText: {
    color: "#FFFFFF",
    fontSize: 12.5,
    fontWeight: "700",
  },
  unpublishHeroBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#B91C1C",
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  unpublishHeroBtnText: {
    color: "#FFFFFF",
    fontSize: 12.5,
    fontWeight: "700",
  },

  /* IMAGE CAROUSEL WITH ARROWS */
  detailImageContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  detailImageWrap: {
    width: "100%",
    height: 220,
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  detailMainImage: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
  },
  imageNavBtn: {
    position: "absolute",
    top: "50%",
    marginTop: -16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  imageNavBtnLeft: {
    left: 8,
  },
  imageNavBtnRight: {
    right: 8,
  },
  detailNoImageWrap: {
    height: 180,
    alignItems: "center",
    justifyContent: "center",
  },
  detailImageThumbRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  detailThumbWrap: {
    width: 48,
    height: 48,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
  },
  detailThumbWrapActive: {
    borderColor: "#003459",
    borderWidth: 2,
  },
  detailThumbImg: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  /* WEB STATS CARDS */
  webStatCardsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  webStatCardLarge: {
    flex: 2,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    justifyContent: "space-between",
  },
  webStatCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  webStatCardSub: {
    fontSize: 11,
    color: "#6B7280",
  },
  webStatCardBodyRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  webStatLabelSmall: {
    fontSize: 10.5,
    color: "#6B7280",
    fontWeight: "600",
  },
  webStatPriceBold: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
    marginTop: 2,
  },
  webStatOldPrice: {
    fontSize: 11,
    color: "#9CA3AF",
    textDecorationLine: "line-through",
  },
  webStatStockBold: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
    marginTop: 2,
  },
  webStatCardSmall: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    justifyContent: "space-between",
  },
  pieIconWrap: {
    backgroundColor: "rgba(85, 112, 241, 0.12)",
    padding: 8,
    borderRadius: 8,
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  webStatOrdersCount: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
    marginTop: 2,
  },

  /* ACTIVITY BOXES */
  webActivityRow: {
    gap: 10,
    marginBottom: 14,
  },
  activityBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  activityBoxTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  bagIconWrap: {
    backgroundColor: "rgba(255, 204, 145, 0.25)",
    padding: 6,
    borderRadius: 6,
  },
  activityWeekText: {
    fontSize: 11,
    color: "#9CA3AF",
    fontWeight: "600",
  },
  activityMetricsCols: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  activityMetricItem: {
    flex: 1,
  },
  activityMetricLabel: {
    fontSize: 10.5,
    color: "#6B7280",
    fontWeight: "500",
  },
  activityMetricVal: {
    fontSize: 14,
    fontWeight: "800",
    color: "#111827",
    marginTop: 2,
  },

  /* SECTION CARDS */
  detailSectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  detailSectionHeading: {
    fontSize: 14,
    fontWeight: "800",
    color: "#111827",
  },
  specRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  specLabel: {
    fontSize: 12.5,
    color: "#6B7280",
  },
  specVal: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#111827",
    maxWidth: 200,
  },
  detailDescriptionText: {
    fontSize: 13,
    color: "#4B5563",
    lineHeight: 20,
    marginTop: 6,
  },

  /* VARIANTS TABLE & FLOW */
  variantsHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  variantsSubText: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 1,
  },
  addVariantHeaderBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#003459",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  addVariantHeaderBtnText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  variantTableWrap: {
    gap: 8,
  },
  variantTableRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  variantThumbWrap: {
    width: 44,
    height: 44,
    borderRadius: 6,
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginRight: 10,
  },
  variantThumb: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  variantInfoCol: {
    flex: 1,
  },
  variantAttrsTitle: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#111827",
  },
  variantMetaText: {
    fontSize: 10.5,
    color: "#6B7280",
    marginTop: 1,
  },
  variantPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  variantPriceText: {
    fontSize: 12.5,
    fontWeight: "800",
    color: "#003459",
  },
  variantPromoText: {
    fontSize: 10.5,
    color: "#EA580C",
    fontWeight: "700",
  },
  variantActionCol: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginLeft: 6,
  },
  variantEditBtn: {
    padding: 6,
    backgroundColor: "#EFF6FF",
    borderRadius: 6,
  },
  variantDeleteBtn: {
    padding: 6,
    backgroundColor: "#FEE2E2",
    borderRadius: 6,
  },
  noVariantsBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
  },
  noVariantsTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#374151",
    marginTop: 8,
  },
  noVariantsSub: {
    fontSize: 11.5,
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 2,
    maxWidth: 240,
  },
  noVariantsAddBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#003459",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginTop: 12,
  },
  noVariantsAddBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#003459",
  },

  /* VARIANT MODAL FORM */
  variantModalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    justifyContent: "flex-end",
  },
  variantModalCard: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 36,
  },
  variantModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  variantModalTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
  },
  variantModalSub: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 2,
  },
  formSectionLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#374151",
    marginBottom: 6,
    marginTop: 4,
  },
  attrInputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  attrKeyLabel: {
    width: 60,
    fontSize: 12,
    fontWeight: "700",
    color: "#4B5563",
  },
  attrValInput: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 38,
    fontSize: 12.5,
    color: "#111827",
  },
  addCustomAttrRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    marginBottom: 12,
  },
  addAttrPillBtn: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    padding: 9,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  modalFieldsRow: {
    flexDirection: "row",
    marginBottom: 10,
  },
  fieldLabel: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 4,
  },
  modalTextInput: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
    fontSize: 13,
    color: "#111827",
  },
  variantImageSwitchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  switchTitle: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#111827",
  },
  switchSub: {
    fontSize: 10.5,
    color: "#6B7280",
    marginTop: 2,
    maxWidth: 240,
  },
  variantImagePickerCard: {
    marginTop: 10,
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 12,
    alignItems: "center",
  },
  variantPickBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
  },
  variantPickBtnText: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#003459",
  },
  variantPreviewWrap: {
    position: "relative",
    width: 90,
    height: 90,
    borderRadius: 8,
    overflow: "hidden",
  },
  variantPickerImg: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  variantRemoveImgBtn: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 10,
    padding: 3,
  },
  variantModalFooter: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  variantCancelBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
  },
  variantCancelBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#4B5563",
  },
  variantSaveBtn: {
    flex: 2,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: "#003459",
  },
  variantSaveBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  /* QR CODE MODAL */
  qrModalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 24,
    alignSelf: "center",
    width: "88%",
  },
  qrHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  qrTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
  },
  qrProductName: {
    fontSize: 13,
    color: "#4B5563",
    marginBottom: 16,
  },
  qrPlaceholderBox: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  qrLinkText: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 12,
    textAlign: "center",
  },
  qrBtnRow: {
    flexDirection: "row",
    gap: 10,
  },
  qrShareBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#003459",
    paddingVertical: 10,
    borderRadius: 8,
  },
  qrShareBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  qrCloseBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  qrCloseBtnText: {
    color: "#4B5563",
    fontSize: 13,
    fontWeight: "700",
  },
});
