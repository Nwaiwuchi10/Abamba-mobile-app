import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  Modal,
  Share,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ArrowLeft,
  ShoppingBag,
  Heart,
  ShieldCheck,
  Truck,
  Star,
  Building2,
  Check,
  ChevronRight,
  Share2,
  MapPin,
  ExternalLink,
} from "lucide-react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  productService,
  wishlistService,
  customerService,
  recentlyViewedService,
} from "../../services";
import { useAppDispatch, useAppSelector } from "../../store";
import { addToCart } from "../../store/slices/cartSlice";
import { toggleWishlistItem } from "../../store/slices/wishlistSlice";
import fallbackProducts from "../../../assets/initial-products.json";
import { useResponseModal } from "../../components/common/ResponseModalContext";
import ProductReviews from "../../components/product-files/ProductReviews";
import ProductFashionBanner from "../../components/product-files/ProductFashionBanner";
import RecentlyViewedProducts from "../../components/product-files/RecentlyViewedProducts";

const { width } = Dimensions.get("window");

// Web Logistics Couriers replicating web/abamba/src/lib/logistics-data.js & product-id.jsx
const COURIERS = [
  {
    courier_id: "richmond-logistics",
    courier_name: "Richmond Logistics",
    location: "Imo (Owerri)",
    delivery_eta: "1 - 2 business days",
    price: 3000,
    isDefault: true,
  },
  {
    courier_id: "apexgologistics",
    courier_name: "Apex Go Logistics",
    location: "Imo (Owerri)",
    delivery_eta: "Same-Day Delivery",
    price: 2400,
  },
  {
    courier_id: "hens-logistics",
    courier_name: "Hens Logistics",
    location: "Imo (Owerri)",
    delivery_eta: "1 - 2 business days",
    price: 3000,
  },
  {
    courier_id: "pickup-station",
    courier_name: "Abamba Official Pick-Up Station",
    location: "Owerri (Angelina House, 31 Wetheral Rd)",
    delivery_eta: "5 to 7 working days",
    price: 0,
    isPickupStation: true,
  },
  {
    courier_id: "princeswift-logistics",
    courier_name: "Prince Swift Logistics",
    location: "Abia (Aba)",
    delivery_eta: "Same-Day Delivery",
    price: 3000,
  },
  {
    courier_id: "oksaturday-logistics",
    courier_name: "OkSaturday Logistics",
    location: "Abia (Aba)",
    delivery_eta: "1 - 2 business days",
    price: 3000,
  },
];

export default function ProductDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const dispatch = useAppDispatch();
  const { showWarning } = useResponseModal();

  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Variant selections
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
  const [selectedCarrier, setSelectedCarrier] = useState(COURIERS[0]);
  const [showCarrierModal, setShowCarrierModal] = useState(false);
  const [shippingAddresses, setShippingAddresses] = useState<any[]>([]);

  // Wishlist state
  const wishlistItems = useAppSelector((state) => state.wishlist?.items || []);
  const isWishlisted = useMemo(() => {
    return wishlistItems.some((item) => (item._id || item.id) === id);
  }, [wishlistItems, id]);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        // Find in initial fallback for immediate zero-latency load
        const matchedFallback = fallbackProducts.find((p: any) => p._id === id || p.id === id);
        if (matchedFallback) {
          setProduct(matchedFallback);
        }

        const res = await productService.getProductById(id as string);
        const incoming = res?.data?.data || res?.data;
        if (incoming) {
          setProduct(incoming);
        }
      } catch (e) {
        console.log("Error loading product detail:", e);
      } finally {
        setLoading(false);
      }
    };

    const fetchAddresses = async () => {
      try {
        const res = await customerService.getAddresses();
        const addrs = res?.data?.data || res?.data || [];
        if (Array.isArray(addrs)) {
          setShippingAddresses(addrs);
        }
      } catch {
        // Guest or unauthenticated, ignore
      }
    };

    if (id) {
      fetchProduct();
      fetchAddresses();
      // Record view in recently viewed products service
      try {
        recentlyViewedService.addProductToViewed(id as string);
      } catch {
        // silently handled
      }
    }
  }, [id]);

  const p = product;
  const name = p?.name || "Product";
  const category = p?.category?.name || p?.category || "Products";
  const brand = p?.brand || p?.manufacturer || null;
  const sku = p?.sku || p?._id?.slice(-8)?.toUpperCase() || "ABM-8890";
  const basePrice = Number(p?.basePrice || p?.price || 0);
  const bonusPrice =
    p?.bonusPrice || p?.promoPrice ? Number(p?.bonusPrice || p?.promoPrice) : null;
  const hasDiscount = bonusPrice && bonusPrice > 0 && bonusPrice < basePrice;
  const discountPercent = hasDiscount
    ? Math.round(((basePrice - bonusPrice!) / basePrice) * 100)
    : 0;
  const effectivePrice = hasDiscount ? bonusPrice! : basePrice;

  // Extract images array
  const rawImages = p?.images || [];
  const imageUrls = rawImages
    .map((img: any) => (typeof img === "string" ? img : img?.url || img?.thumbnail || null))
    .filter(Boolean);

  if (imageUrls.length === 0 && p?.thumbnail) {
    imageUrls.push(p.thumbnail);
  }

  // Variants extraction
  const variantAttributes = useMemo(() => {
    if (!product?.hasVariants || !product?.variants?.length) return null;
    const attrs: Record<string, string[]> = {};
    product.variants.forEach((v: any) => {
      if (v.attributes) {
        Object.keys(v.attributes).forEach((key) => {
          if (!attrs[key]) attrs[key] = [];
          if (!attrs[key].includes(v.attributes[key])) {
            attrs[key].push(v.attributes[key]);
          }
        });
      }
    });
    return attrs;
  }, [product]);

  // Selected variant check
  const selectedVariant = useMemo(() => {
    if (!product?.hasVariants || !product?.variants?.length) return null;
    if (Object.keys(selectedAttributes).length === 0) return null;
    return product.variants.find((v: any) => {
      return Object.entries(selectedAttributes).every(
        ([key, val]) => v.attributes?.[key] === val
      );
    });
  }, [product, selectedAttributes]);

  const inStock = p?.quantity !== undefined ? p.quantity > 0 : true;
  const stockQuantity = p?.quantity || 50;

  const handleToggleWishlist = async () => {
    if (!product) return;
    dispatch(toggleWishlistItem(product));
    try {
      await wishlistService.addToWishlist({ productId: product._id || product.id });
    } catch {
      // Handled in slice
    }
  };

  const handleShareProduct = async () => {
    try {
      await Share.share({
        message: `Check out ${name} on Abamba! Price: ₦${effectivePrice.toLocaleString()}`,
        title: name,
      });
    } catch {
      // ignored
    }
  };

  const handleAddToCart = () => {
    if (!product) return;
    if (product.hasVariants && !selectedVariant) {
      showWarning("Select Options", "Please select your preferred variant options before adding to cart.");
      return;
    }

    dispatch(
      addToCart({
        id: product._id || product.id,
        productId: product._id || product.id,
        name,
        price: effectivePrice,
        image: imageUrls[0] || "",
        quantity,
        variantId: selectedVariant?._id || selectedVariant?.id,
      })
    );
    router.push("/cart" as any);
  };

  const sellerName =
    p?.storeName ||
    p?.businessName ||
    p?.user?.business?.businessName ||
    p?.user?.businessName ||
    p?.user?.storeName ||
    p?.user?.name ||
    p?.sellerName ||
    "Verified Merchant";

  const sellerId = p?.user?._id || p?.user?.id || p?.sellerId || p?.userId;

  if (loading && !product) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#003459" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {name}
        </Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconBtn} onPress={handleShareProduct}>
            <Share2 size={20} color="#1F2937" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={handleToggleWishlist}>
            <Heart
              size={22}
              color={isWishlisted ? "#EF4444" : "#1F2937"}
              fill={isWishlisted ? "#EF4444" : "transparent"}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Breadcrumb Navigation matching Web */}
        <View style={styles.breadcrumbBar}>
          <TouchableOpacity onPress={() => router.push("/(tabs)" as any)}>
            <Text style={styles.breadcrumbLink}>Home</Text>
          </TouchableOpacity>
          <Text style={styles.breadcrumbSlash}>/</Text>
          <TouchableOpacity onPress={() => router.push("/products" as any)}>
            <Text style={styles.breadcrumbLink}>Products</Text>
          </TouchableOpacity>
          <Text style={styles.breadcrumbSlash}>/</Text>
          <TouchableOpacity onPress={() => router.push("/products" as any)}>
            <Text style={styles.breadcrumbLink} numberOfLines={1}>
              {category}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Main Product Image Gallery */}
        <View style={styles.imageGallery}>
          {imageUrls.length > 0 ? (
            <Image
              source={{ uri: imageUrls[selectedImageIndex] }}
              style={styles.mainImage}
              resizeMode="contain"
            />
          ) : (
            <Image
              source={require("../../../assets/images/placeholder.jpg")}
              style={styles.mainImage}
              resizeMode="contain"
            />
          )}

          {/* Web Bonus Deal Badge */}
          {hasDiscount && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>-{discountPercent}% Bonus Deal</Text>
            </View>
          )}

          {p?.isFeatured && (
            <View style={styles.featuredBadge}>
              <Text style={styles.featuredBadgeText}>Featured</Text>
            </View>
          )}
        </View>

        {/* Thumbnail Selector */}
        {imageUrls.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbRow}>
            {imageUrls.map((img: string, idx: number) => (
              <TouchableOpacity
                key={idx}
                onPress={() => setSelectedImageIndex(idx)}
                style={[styles.thumbWrap, selectedImageIndex === idx && styles.activeThumb]}
              >
                <Image source={{ uri: img }} style={styles.thumbImg} resizeMode="cover" />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Info Card */}
        <View style={styles.infoCard}>
          {brand && (
            <Text style={styles.brandText}>Brand: {brand}</Text>
          )}

          <Text style={styles.productTitle}>{name}</Text>

          {/* Rating, Reviews & In-Stock SKU */}
          <View style={styles.metaRow}>
            <View style={styles.ratingBox}>
              <Star size={13} color="#F59E0B" fill="#F59E0B" />
              <Text style={styles.ratingText}>
                {p?.rating ? Number(p.rating).toFixed(1) : "5.0"}
              </Text>
            </View>
            <Text style={styles.dot}>•</Text>
            <Text style={styles.reviewsText}>
              ({p?.numReviews || "12"} reviews)
            </Text>
            <Text style={styles.dot}>•</Text>
            <Text style={[styles.stockText, { color: inStock ? "#10B981" : "#EF4444" }]}>
              {inStock ? "In Stock" : "Out of stock"}
            </Text>
          </View>

          {/* SKU / Available Quantity tag */}
          <View style={styles.skuRow}>
            <Text style={styles.skuText}>SKU: {sku}</Text>
            {inStock && (
              <Text style={styles.availableQtyText}>({stockQuantity} available)</Text>
            )}
          </View>

          {/* Price Container with Slashed Price */}
          <View style={styles.priceRow}>
            <Text style={styles.productPrice}>₦{effectivePrice.toLocaleString()}</Text>
            {hasDiscount && (
              <Text style={styles.slashedPrice}>₦{basePrice.toLocaleString()}</Text>
            )}
          </View>

          {/* Variants Selector (Color, Size, Options) Replicating Web */}
          {variantAttributes && (
            <View style={styles.variantsBlock}>
              {Object.entries(variantAttributes).map(([attrKey, values]) => {
                const isColor = attrKey.toLowerCase() === "color";
                return (
                  <View key={attrKey} style={styles.attrGroup}>
                    <Text style={styles.attrLabel}>
                      {attrKey.toUpperCase()}:{" "}
                      <Text style={{ fontWeight: "400", color: "#6B7280" }}>
                        {selectedAttributes[attrKey] || "Choose option"}
                      </Text>
                    </Text>
                    <View style={styles.optionsRow}>
                      {values.map((val) => {
                        const isSelected = selectedAttributes[attrKey] === val;
                        if (isColor) {
                          return (
                            <TouchableOpacity
                              key={val}
                              onPress={() =>
                                setSelectedAttributes((prev) => ({ ...prev, [attrKey]: val }))
                              }
                              style={[
                                styles.colorCircle,
                                { backgroundColor: val.startsWith("#") ? val : `#${val}` },
                                isSelected && styles.colorCircleSelected,
                              ]}
                            />
                          );
                        }
                        return (
                          <TouchableOpacity
                            key={val}
                            onPress={() =>
                              setSelectedAttributes((prev) => ({ ...prev, [attrKey]: val }))
                            }
                            style={[
                              styles.sizeBox,
                              isSelected && styles.sizeBoxSelected,
                            ]}
                          >
                            <Text
                              style={[
                                styles.sizeBoxText,
                                isSelected && styles.sizeBoxTextSelected,
                              ]}
                            >
                              {val}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* Quantity Selector */}
          <View style={styles.qtyContainer}>
            <Text style={styles.qtyLabel}>Quantity:</Text>
            <View style={styles.qtyControls}>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => setQuantity((q) => Math.max(1, q - 1))}
              >
                <Text style={styles.qtyBtnText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.qtyNumber}>{quantity}</Text>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => setQuantity((q) => Math.min(stockQuantity, q + 1))}
              >
                <Text style={styles.qtyBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Delivery & Logistics Selector Card (Replicating Web Exact Logistics Card) */}
          <TouchableOpacity
            style={styles.carrierCard}
            onPress={() => setShowCarrierModal(true)}
            activeOpacity={0.8}
          >
            <View style={styles.carrierIconWrap}>
              {selectedCarrier.isPickupStation ? (
                <Building2 size={22} color="#003459" />
              ) : (
                <Truck size={22} color="#003459" />
              )}
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <View style={styles.carrierTitleRow}>
                <Text style={styles.carrierName}>{selectedCarrier.courier_name}</Text>
                {selectedCarrier.isPickupStation && (
                  <View style={styles.freeBadge}>
                    <Text style={styles.freeBadgeText}>FREE (₦0)</Text>
                  </View>
                )}
              </View>
              <Text style={styles.carrierLocation}>{selectedCarrier.location}</Text>
              <Text style={styles.carrierEta}>
                {selectedCarrier.delivery_eta} • Tap to switch
              </Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.carrierPrice}>
                {selectedCarrier.price === 0
                  ? "FREE"
                  : `₦${selectedCarrier.price.toLocaleString()}`}
              </Text>
              <ChevronRight size={18} color="#9CA3AF" style={{ marginTop: 4 }} />
            </View>
          </TouchableOpacity>

          {/* Trust Guarantee Badges */}
          <View style={styles.badgesRow}>
            <View style={styles.trustBadge}>
              <ShieldCheck size={16} color="#10B981" />
              <Text style={styles.trustBadgeText}>Abamba Escrow Protection</Text>
            </View>
            <View style={styles.trustBadge}>
              <Check size={16} color="#003459" />
              <Text style={[styles.trustBadgeText, { color: "#003459" }]}>
                7-Day Return Guarantee
              </Text>
            </View>
          </View>

          {/* Product Description */}
          <Text style={styles.descHeading}>Product Description</Text>
          <Text style={styles.descBody}>
            {p?.description ||
              "High-quality verified item sourced through approved Abamba merchant network with fast nationwide regional dispatch."}
          </Text>

          {/* Delivery & Returns + Sold By Merchant Card matching web */}
          <View style={styles.sellerAndPolicyCard}>
            <View style={styles.policySection}>
              <Text style={styles.policyHeading}>Delivery & Returns:</Text>
              <Text style={styles.policyBody}>
                Delivery time depends on your location and the courier you choose at checkout. Returns can be requested within 7 days of receiving your item under Abamba Escrow Protection.
              </Text>
            </View>

            <View style={styles.soldBySection}>
              <Text style={styles.soldByLabel}>Sold by:</Text>
              <TouchableOpacity
                style={styles.sellerLinkWrap}
                onPress={() => {
                  if (sellerId) {
                    router.push(`/sellers-store/${sellerId}` as any);
                  }
                }}
              >
                <Text style={styles.sellerLinkText}>{sellerName}</Text>
                <ExternalLink size={13} color="#003459" style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Customer Reviews Section */}
        <ProductReviews
          productId={id as string}
          rating={p?.rating}
          numReviews={p?.numReviews}
        />

        {/* Fashion Promo Banner */}
        <ProductFashionBanner />

        {/* Recently Viewed Products Horizontal Carousel */}
        <RecentlyViewedProducts currentProductId={id as string} />

        <View style={{ height: 160 }} />
      </ScrollView>

      {/* Floating Action Bar */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 12) + 60 }]}>
        <TouchableOpacity style={styles.addToCartBtn} onPress={handleAddToCart}>
          <ShoppingBag size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.addToCartText}>
            Add to Cart • ₦{(effectivePrice * quantity).toLocaleString()}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Logistics Partner Selection Modal */}
      <Modal
        visible={showCarrierModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCarrierModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalSheet, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Logistics Partner</Text>
              <TouchableOpacity onPress={() => setShowCarrierModal(false)}>
                <Text style={styles.closeBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSub}>
              Choose from verified delivery services or official free pickup:
            </Text>

            {COURIERS.map((c) => {
              const isSelected = selectedCarrier.courier_id === c.courier_id;
              return (
                <TouchableOpacity
                  key={c.courier_id}
                  style={[styles.modalCourierItem, isSelected && styles.modalCourierItemSelected]}
                  onPress={() => {
                    setSelectedCarrier(c);
                    setShowCarrierModal(false);
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalCourierName}>{c.courier_name}</Text>
                    <Text style={styles.modalCourierDetails}>
                      📍 {c.location} • {c.delivery_eta}
                    </Text>
                  </View>
                  <Text style={styles.modalCourierPrice}>
                    {c.price === 0 ? "FREE" : `₦${c.price.toLocaleString()}`}
                  </Text>
                </TouchableOpacity>
              );
            })}
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
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#003459",
    maxWidth: "60%",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconBtn: {
    padding: 6,
  },
  breadcrumbBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  breadcrumbLink: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  breadcrumbSlash: {
    fontSize: 12,
    color: "#9CA3AF",
    marginHorizontal: 6,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  imageGallery: {
    width: "100%",
    height: 320,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  mainImage: {
    width: width - 40,
    height: 280,
  },
  discountBadge: {
    position: "absolute",
    top: 16,
    left: 16,
    backgroundColor: "#EF4444",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  discountText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  featuredBadge: {
    position: "absolute",
    top: 16,
    right: 16,
    backgroundColor: "#003459",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  featuredBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  thumbRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  thumbWrap: {
    width: 60,
    height: 60,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    marginRight: 10,
    overflow: "hidden",
  },
  activeThumb: {
    borderColor: "#003459",
  },
  thumbImg: {
    width: "100%",
    height: "100%",
  },
  infoCard: {
    backgroundColor: "#FFFFFF",
    marginTop: 10,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  brandText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  productTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
    lineHeight: 26,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  ratingBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#B45309",
    marginLeft: 4,
  },
  dot: {
    marginHorizontal: 8,
    color: "#9CA3AF",
  },
  reviewsText: {
    fontSize: 13,
    color: "#6B7280",
  },
  stockText: {
    fontSize: 13,
    fontWeight: "600",
  },
  skuRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
  },
  skuText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  availableQtyText: {
    fontSize: 12,
    color: "#059669",
    fontWeight: "600",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 14,
  },
  productPrice: {
    fontSize: 26,
    fontWeight: "900",
    color: "#003459",
  },
  slashedPrice: {
    fontSize: 16,
    color: "#9CA3AF",
    textDecorationLine: "line-through",
    marginLeft: 12,
  },
  variantsBlock: {
    marginTop: 18,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    paddingTop: 16,
  },
  attrGroup: {
    marginBottom: 14,
  },
  attrLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 8,
  },
  optionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  colorCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: "#E5E7EB",
  },
  colorCircleSelected: {
    borderColor: "#003459",
    transform: [{ scale: 1.1 }],
  },
  sizeBox: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
  },
  sizeBoxSelected: {
    backgroundColor: "#003459",
    borderColor: "#003459",
  },
  sizeBoxText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
  },
  sizeBoxTextSelected: {
    color: "#FFFFFF",
  },
  qtyContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 18,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    paddingTop: 14,
  },
  qtyLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },
  qtyControls: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
  },
  qtyBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#F9FAFB",
  },
  qtyBtnText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  qtyNumber: {
    paddingHorizontal: 16,
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },
  carrierCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 52, 89, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(0, 52, 89, 0.12)",
    borderRadius: 12,
    padding: 12,
    marginTop: 18,
  },
  carrierIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  carrierTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  carrierName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#003459",
  },
  freeBadge: {
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 6,
  },
  freeBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#065F46",
  },
  carrierLocation: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  carrierEta: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 2,
  },
  carrierPrice: {
    fontSize: 14,
    fontWeight: "800",
    color: "#003459",
  },
  badgesRow: {
    marginTop: 18,
    gap: 8,
  },
  trustBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  trustBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#166534",
    marginLeft: 6,
  },
  descHeading: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginTop: 20,
    marginBottom: 6,
  },
  descBody: {
    fontSize: 14,
    color: "#4B5563",
    lineHeight: 22,
  },
  sellerAndPolicyCard: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    paddingTop: 16,
    gap: 12,
  },
  policySection: {
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderRadius: 8,
  },
  policyHeading: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  policyBody: {
    fontSize: 12,
    color: "#6B7280",
    lineHeight: 18,
  },
  soldBySection: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  soldByLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4B5563",
    marginRight: 6,
  },
  sellerLinkWrap: {
    flexDirection: "row",
    alignItems: "center",
  },
  sellerLinkText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#003459",
    textDecorationLine: "underline",
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  addToCartBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#003459",
    height: 50,
    borderRadius: 12,
  },
  addToCartText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#003459",
  },
  closeBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#003459",
  },
  modalSub: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 16,
  },
  modalCourierItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 10,
  },
  modalCourierItemSelected: {
    borderColor: "#003459",
    backgroundColor: "rgba(0, 52, 89, 0.05)",
  },
  modalCourierName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#003459",
  },
  modalCourierDetails: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  modalCourierPrice: {
    fontSize: 15,
    fontWeight: "800",
    color: "#003459",
  },
});
