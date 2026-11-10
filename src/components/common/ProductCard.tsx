import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { Heart, ShoppingCart, Star } from "lucide-react-native";
import { useAppDispatch, useAppSelector, RootState } from "../../store";
import { addToCart } from "../../store/slices/cartSlice";
import { toggleWishlistItem } from "../../store/slices/wishlistSlice";
import { wishlistService } from "../../services";

const { width } = Dimensions.get("window");
export const CARD_WIDTH = (width - 44) / 2;

interface ProductCardProps {
  product: any;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const wishlistItems = useAppSelector((state: RootState) => state.wishlist.items);

  const id = product._id || product.id;
  const isWishlisted = wishlistItems.some(
    (item) => (item.id || item._id) === id
  );
  const name = product.name || "Product";
  const basePrice = Number(product.basePrice || product.price || 0);
  const bonusPrice =
    product.bonusPrice || product.promoPrice ? Number(product.bonusPrice || product.promoPrice) : null;
  const hasDiscount = bonusPrice && bonusPrice > 0 && bonusPrice < basePrice;
  const effectivePrice = hasDiscount ? bonusPrice : basePrice;

  const imageUrl =
    product.thumbnail ||
    product.image ||
    product.images?.[0]?.url ||
    product.images?.[0]?.thumbnail ||
    (typeof product.images?.[0] === "string" ? product.images[0] : null);

  const vendorName =
    product.sellerName ||
    product.user?.business?.businessName ||
    product.user?.storeName ||
    product.storeName ||
    product.businessName ||
    "Abamba Merchant";

  const handleAddToCart = (e: any) => {
    dispatch(
      addToCart({
        id,
        productId: id,
        name,
        price: effectivePrice,
        image: imageUrl || "",
        quantity: 1,
      })
    );
  };

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.92}
      onPress={() => router.push(`/products/${id}` as any)}
    >
      <View style={styles.imageContainer}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.productImage} resizeMode="cover" />
        ) : (
          <Image
            source={require("../../../assets/images/placeholder.jpg")}
            style={styles.productImage}
            resizeMode="cover"
          />
        )}

        {hasDiscount && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>
              -{Math.round(((basePrice - bonusPrice!) / basePrice) * 100)}%
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.wishlistBtn}
          onPress={() => {
            dispatch(
              toggleWishlistItem({
                id,
                _id: id,
                name,
                price: effectivePrice,
                basePrice,
                image: imageUrl || "",
                vendor: vendorName,
              })
            );
            // Optionally sync to backend if authenticated
            wishlistService.addToWishlist({ productId: id }).catch(() => {});
          }}
        >
          <Heart
            size={16}
            color={isWishlisted ? "#EF4444" : "#4B5563"}
            fill={isWishlisted ? "#EF4444" : "transparent"}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.vendor} numberOfLines={1}>
          {vendorName}
        </Text>
        <Text style={styles.name} numberOfLines={2}>
          {name}
        </Text>

        <View style={styles.ratingRow}>
          <Star size={12} color="#F59E0B" fill="#F59E0B" />
          <Text style={styles.ratingText}>
            {product.rating ? Number(product.rating).toFixed(1) : "4.5"}
          </Text>
          <Text style={styles.dot}>•</Text>
          <Text style={styles.stockText}>
            {product.quantity || product.stock || 20} available
          </Text>
        </View>

        <View style={styles.footerRow}>
          <View>
            <Text style={styles.price}>₦{effectivePrice.toLocaleString()}</Text>
            {hasDiscount && (
              <Text style={styles.slashedPrice}>₦{basePrice.toLocaleString()}</Text>
            )}
          </View>

          <TouchableOpacity style={styles.cartBtn} onPress={handleAddToCart}>
            <ShoppingCart size={15} color="#FF5500" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  imageContainer: {
    width: "100%",
    height: 155,
    backgroundColor: "#F9FAFB",
    position: "relative",
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  discountBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "#FF5500",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
  wishlistBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(255,255,255,0.9)",
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    padding: 10,
    justifyContent: "space-between",
    flex: 1,
  },
  vendor: {
    fontSize: 10,
    fontWeight: "600",
    color: "#9CA3AF",
    textTransform: "uppercase",
  },
  name: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
    marginTop: 2,
    lineHeight: 18,
    minHeight: 36,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    gap: 4,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#F59E0B",
  },
  dot: {
    color: "#9CA3AF",
    fontSize: 10,
  },
  stockText: {
    fontSize: 11,
    color: "#6B7280",
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  price: {
    fontSize: 14,
    fontWeight: "800",
    color: "#111827",
  },
  slashedPrice: {
    fontSize: 11,
    color: "#9CA3AF",
    textDecorationLine: "line-through",
    marginTop: 1,
  },
  cartBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#FFF5F0",
    borderWidth: 1,
    borderColor: "#FED7AA",
    alignItems: "center",
    justifyContent: "center",
  },
});

