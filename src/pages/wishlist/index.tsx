import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Heart, ShoppingCart, ArrowLeft, Trash2 } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useAppDispatch, useAppSelector, RootState } from "../../store";
import { addToCart } from "../../store/slices/cartSlice";
import {
  removeFromWishlist,
  setWishlistItems,
} from "../../store/slices/wishlistSlice";
import { wishlistService } from "../../services";

export default function WishlistScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const reduxWishlistItems = useAppSelector(
    (state: RootState) => state.wishlist.items
  );
  const [loading, setLoading] = useState(false);

  // Sync with backend on mount
  useEffect(() => {
    const fetchBackendWishlist = async () => {
      try {
        setLoading(true);
        const res = await wishlistService.getWishlists();
        const data = res?.data?.data || res?.data;
        if (data) {
          const wishlists = Array.isArray(data.wishlists)
            ? data.wishlists
            : Array.isArray(data)
            ? data
            : [];
          const remoteItems = wishlists.flatMap((w: any) =>
            (w.products || []).map((p: any) => {
              const prod = p.product || p;
              return {
                id: prod._id || prod.id,
                _id: prod._id || prod.id,
                name: prod.name,
                price: Number(prod.bonusPrice || prod.price || prod.basePrice || 0),
                basePrice: Number(prod.basePrice || prod.price || 0),
                image:
                  prod.thumbnail ||
                  prod.images?.[0]?.url ||
                  prod.images?.[0] ||
                  "",
                vendor:
                  prod.storeName ||
                  prod.sellerName ||
                  prod.user?.business?.businessName,
              };
            })
          );
          if (remoteItems.length > 0) {
            dispatch(setWishlistItems(remoteItems));
          }
        }
      } catch (err) {
        // Silently catch and preserve local items if guest or network offline
      } finally {
        setLoading(false);
      }
    };

    fetchBackendWishlist();
  }, []);

  const handleRemoveItem = (id: string) => {
    dispatch(removeFromWishlist(id));
    wishlistService.removeProductFromDefault(id).catch(() => {});
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Wishlist ({reduxWishlistItems.length})</Text>
        <View style={{ width: 32 }} />
      </View>

      {loading && reduxWishlistItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#FF5500" />
        </View>
      ) : reduxWishlistItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Heart size={64} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>Your wishlist is empty</Text>
          <Text style={styles.emptySubtitle}>
            Save products you like to purchase them later. Tap the heart on any product card!
          </Text>
          <TouchableOpacity
            style={styles.exploreBtn}
            onPress={() => router.push("/products" as any)}
          >
            <Text style={styles.exploreBtnText}>Discover Products</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {reduxWishlistItems.map((item) => {
            const itemId = String(item.id || item._id || "");
            const imageSource =
              typeof item.image === "string" && item.image.startsWith("http")
                ? { uri: item.image }
                : typeof item.image === "number"
                ? item.image
                : require("../../../assets/images/placeholder.jpg");

            return (
              <View key={itemId} style={styles.itemCard}>
                <Image source={imageSource} style={styles.itemImage} resizeMode="cover" />
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName} numberOfLines={2}>
                    {item.name}
                  </Text>
                  <Text style={styles.itemPrice}>
                    ₦{Number(item.price).toLocaleString()}
                  </Text>
                  <View style={styles.btnRow}>
                    <TouchableOpacity
                      style={styles.addToCartBtn}
                      onPress={() => {
                        dispatch(
                          addToCart({
                            id: itemId,
                            productId: itemId,
                            name: item.name,
                            price: item.price,
                            image: typeof item.image === "string" ? item.image : "",
                            quantity: 1,
                          })
                        );
                        handleRemoveItem(itemId);
                      }}
                    >
                      <ShoppingCart size={14} color="#FFFFFF" />
                      <Text style={styles.addToCartText}>Move to Cart</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => handleRemoveItem(itemId)}
                    >
                      <Trash2 size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })}
          <View style={{ height: 120 }} />
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
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
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
  itemCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: "#F9FAFB",
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "space-between",
  },
  itemName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: "700",
    color: "#003459",
    marginVertical: 4,
  },
  btnRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  addToCartBtn: {
    backgroundColor: "#003459",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
    gap: 6,
  },
  addToCartText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  deleteBtn: {
    padding: 6,
  },
});

