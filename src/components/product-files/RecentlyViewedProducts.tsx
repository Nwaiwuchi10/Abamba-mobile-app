import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Star } from "lucide-react-native";
import { recentlyViewedService } from "../../services";
import fallbackProducts from "../../../assets/initial-products.json";

interface RecentlyViewedProductsProps {
  currentProductId?: string;
}

export default function RecentlyViewedProducts({
  currentProductId,
}: RecentlyViewedProductsProps) {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadRecentlyViewed = async () => {
      try {
        setLoading(true);
        const res = await recentlyViewedService.getViewedProducts();
        const incoming = res?.data?.data || res?.data || [];
        if (isMounted) {
          if (Array.isArray(incoming) && incoming.length > 0) {
            // Filter out current product
            const filtered = incoming.filter(
              (p: any) => (p._id || p.id) !== currentProductId
            );
            setProducts(filtered.slice(0, 8));
          } else {
            // Fallback to sample catalog items
            const filtered = (fallbackProducts as any[])
              .filter((p: any) => (p._id || p.id) !== currentProductId)
              .slice(0, 6);
            setProducts(filtered);
          }
        }
      } catch (err) {
        if (isMounted) {
          const filtered = (fallbackProducts as any[])
            .filter((p: any) => (p._id || p.id) !== currentProductId)
            .slice(0, 6);
          setProducts(filtered);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadRecentlyViewed();

    return () => {
      isMounted = false;
    };
  }, [currentProductId]);

  if (!loading && products.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recently Viewed</Text>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="small" color="#003459" />
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollList}
        >
          {products.map((item) => {
            const itemId = item._id || item.id;
            const price = Number(item.basePrice || item.price || 0);
            const promoPrice = item.bonusPrice || item.promoPrice;
            const effectivePrice = promoPrice ? Number(promoPrice) : price;
            const imageUrl =
              item.images?.[0]?.url ||
              item.images?.[0] ||
              item.image ||
              "https://via.placeholder.com/200";

            return (
              <TouchableOpacity
                key={itemId}
                style={styles.card}
                activeOpacity={0.85}
                onPress={() => {
                  router.push(`/products/${itemId}` as any);
                }}
              >
                <View style={styles.imageContainer}>
                  <Image
                    source={{ uri: imageUrl }}
                    style={styles.image}
                    resizeMode="cover"
                  />
                  {promoPrice && price > effectivePrice ? (
                    <View style={styles.discountBadge}>
                      <Text style={styles.discountBadgeText}>
                        -{Math.round(((price - effectivePrice) / price) * 100)}%
                      </Text>
                    </View>
                  ) : null}
                </View>

                <View style={styles.cardInfo}>
                  <Text numberOfLines={2} style={styles.productName}>
                    {item.name}
                  </Text>

                  <View style={styles.ratingRow}>
                    <Star size={11} color="#F59E0B" fill="#F59E0B" />
                    <Text style={styles.ratingText}>
                      {item.rating ? Number(item.rating).toFixed(1) : "5.0"}
                    </Text>
                    <Text style={styles.reviewsCount}>
                      ({item.numReviews || item.reviewsCount || 12})
                    </Text>
                  </View>

                  <View style={styles.priceRow}>
                    <Text style={styles.priceText}>
                      ₦{effectivePrice.toLocaleString()}
                    </Text>
                    {promoPrice && price > effectivePrice ? (
                      <Text style={styles.oldPrice}>
                        ₦{price.toLocaleString()}
                      </Text>
                    ) : null}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#003459",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  loadingBox: {
    height: 140,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  card: {
    width: 156,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  imageContainer: {
    width: "100%",
    height: 140,
    backgroundColor: "#F3F4F6",
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  discountBadge: {
    position: "absolute",
    top: 6,
    left: 6,
    backgroundColor: "#DC2626",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
  cardInfo: {
    padding: 10,
  },
  productName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
    lineHeight: 18,
    height: 36,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 4,
    marginBottom: 6,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#374151",
  },
  reviewsCount: {
    fontSize: 10,
    color: "#9CA3AF",
  },
  priceRow: {
    flexDirection: "column",
  },
  priceText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#003459",
  },
  oldPrice: {
    fontSize: 11,
    color: "#9CA3AF",
    textDecorationLine: "line-through",
    marginTop: 1,
  },
});
