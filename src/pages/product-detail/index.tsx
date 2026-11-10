import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ArrowLeft,
  ShoppingBag,
  Heart,
  Share2,
  ShieldCheck,
  Truck,
  Star,
  Check,
  ChevronRight,
} from "lucide-react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { productService } from "../../services";
import { useAppDispatch } from "../../store";
import { addToCart } from "../../store/slices/cartSlice";
import fallbackProducts from "../../../assets/initial-products.json";

const { width } = Dimensions.get("window");

export default function ProductDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const dispatch = useAppDispatch();

  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        // Look in cached fallback products first for instant display
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
        console.log("Error fetching product detail, using fallback match:", e);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProduct();
  }, [id]);

  const p = product;
  const name = p?.name || "Product";
  const basePrice = Number(p?.basePrice || p?.price || 0);
  const bonusPrice =
    p?.bonusPrice || p?.promoPrice ? Number(p?.bonusPrice || p?.promoPrice) : null;
  const hasDiscount = bonusPrice && bonusPrice > 0 && bonusPrice < basePrice;
  const effectivePrice = hasDiscount ? bonusPrice : basePrice;

  // Extract images array
  const rawImages = p?.images || [];
  const imageUrls = rawImages.map((img: any) =>
    typeof img === "string" ? img : img?.url || img?.thumbnail || null
  ).filter(Boolean);

  if (imageUrls.length === 0 && p?.thumbnail) {
    imageUrls.push(p.thumbnail);
  }

  const handleAddToCart = () => {
    if (!product) return;
    dispatch(
      addToCart({
        id: product._id || product.id,
        productId: product._id || product.id,
        name,
        price: effectivePrice,
        image: imageUrls[0] || "",
        quantity,
      })
    );
    router.push("/cart" as any);
  };

  if (loading && !product) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#FF5500" />
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
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => setIsWishlisted(!isWishlisted)}
        >
          <Heart
            size={20}
            color={isWishlisted ? "#EF4444" : "#1F2937"}
            fill={isWishlisted ? "#EF4444" : "transparent"}
          />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Main Product Image Carousel */}
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

          {hasDiscount && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>
                -{Math.round(((basePrice - bonusPrice!) / basePrice) * 100)}% OFF
              </Text>
            </View>
          )}
        </View>

        {/* Thumbnail Preview Selector */}
        {imageUrls.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbRow}>
            {imageUrls.map((img: string, idx: number) => (
              <TouchableOpacity
                key={idx}
                onPress={() => setSelectedImageIndex(idx)}
                style={[
                  styles.thumbWrap,
                  selectedImageIndex === idx && styles.activeThumb,
                ]}
              >
                <Image source={{ uri: img }} style={styles.thumbImg} resizeMode="cover" />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Product Details Section */}
        <View style={styles.infoCard}>
          <Text style={styles.vendorName}>
            {p?.sellerName || p?.user?.business?.businessName || p?.storeName || "Verified Vendor"}
          </Text>
          <Text style={styles.productTitle}>{name}</Text>

          {/* Rating & Stock */}
          <View style={styles.metaRow}>
            <View style={styles.ratingBox}>
              <Star size={13} color="#F59E0B" fill="#F59E0B" />
              <Text style={styles.ratingText}>
                {p?.rating ? Number(p.rating).toFixed(1) : "4.8"}
              </Text>
            </View>
            <Text style={styles.dot}>•</Text>
            <Text style={styles.stockText}>
              {p?.quantity || p?.stock || 50} in stock
            </Text>
          </View>

          {/* Price Container */}
          <View style={styles.priceRow}>
            <Text style={styles.productPrice}>₦{effectivePrice.toLocaleString()}</Text>
            {hasDiscount && (
              <Text style={styles.slashedPrice}>₦{basePrice.toLocaleString()}</Text>
            )}
          </View>

          {/* Logistics & Trust Badges */}
          <View style={styles.badgesRow}>
            <View style={styles.trustBadge}>
              <ShieldCheck size={16} color="#10B981" />
              <Text style={styles.trustBadgeText}>Abamba Escrow Protection</Text>
            </View>
            <View style={styles.trustBadge}>
              <Truck size={16} color="#003459" />
              <Text style={[styles.trustBadgeText, { color: "#003459" }]}>
                Standard Regional Courier (₦3,000)
              </Text>
            </View>
          </View>

          {/* Product Description */}
          <Text style={styles.descHeading}>Product Description</Text>
          <Text style={styles.descBody}>
            {p?.description || "High-quality verified item sourced through approved Abamba merchant network."}
          </Text>

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
                onPress={() => setQuantity((q) => q + 1)}
              >
                <Text style={styles.qtyBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

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
    maxWidth: "70%",
  },
  iconBtn: {
    padding: 6,
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
    width: width * 0.9,
    height: 290,
  },
  discountBadge: {
    position: "absolute",
    top: 14,
    left: 14,
    backgroundColor: "#FF5500",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  discountText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },
  thumbRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  thumbWrap: {
    width: 60,
    height: 60,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginRight: 10,
    overflow: "hidden",
  },
  activeThumb: {
    borderColor: "#FF5500",
    borderWidth: 2,
  },
  thumbImg: {
    width: "100%",
    height: "100%",
  },
  infoCard: {
    backgroundColor: "#FFFFFF",
    marginTop: 10,
    padding: 16,
    borderRadius: 14,
    marginHorizontal: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  vendorName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    textTransform: "uppercase",
  },
  productTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
    marginTop: 4,
    lineHeight: 24,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 6,
  },
  ratingBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#F59E0B",
  },
  dot: {
    color: "#9CA3AF",
  },
  stockText: {
    fontSize: 12,
    color: "#10B981",
    fontWeight: "600",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 10,
    marginTop: 14,
  },
  productPrice: {
    fontSize: 24,
    fontWeight: "800",
    color: "#003459",
  },
  slashedPrice: {
    fontSize: 16,
    color: "#9CA3AF",
    textDecorationLine: "line-through",
    fontWeight: "600",
  },
  badgesRow: {
    marginTop: 16,
    gap: 8,
  },
  trustBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  trustBadgeText: {
    fontSize: 12,
    color: "#10B981",
    fontWeight: "600",
  },
  descHeading: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1F2937",
    marginTop: 20,
  },
  descBody: {
    fontSize: 13,
    color: "#4B5563",
    marginTop: 8,
    lineHeight: 20,
  },
  qtyContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  qtyLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
  },
  qtyControls: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    paddingHorizontal: 6,
  },
  qtyBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  qtyBtnText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
  },
  qtyNumber: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    paddingHorizontal: 8,
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
  addToCartBtn: {
    backgroundColor: "#003459",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 10,
  },
  addToCartText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
