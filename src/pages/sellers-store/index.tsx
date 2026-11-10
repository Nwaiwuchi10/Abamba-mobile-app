import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, Star, Store, ShieldCheck, UserPlus, Check, Filter } from "lucide-react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { productService } from "../../services";
import { ProductCard } from "../../components/common/ProductCard";
import fallbackProducts from "../../../assets/initial-products.json";

export default function SellersStorePage() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [storeProducts, setStoreProducts] = useState<any[]>([]);

  useEffect(() => {
    // Filter fallback or live products matching this store / seller
    const matched = fallbackProducts.filter(
      (p: any) =>
        p.sellerId === id ||
        p.user?._id === id ||
        p.user?.id === id ||
        p.seller?._id === id
    );

    if (matched.length > 0) {
      setStoreProducts(matched);
      setLoading(false);
    } else {
      // Default sample subset
      setStoreProducts(fallbackProducts.slice(0, 12));
      setLoading(false);
    }
  }, [id]);

  const handleFollow = () => {
    setIsFollowing(!isFollowing);
    Alert.alert(
      isFollowing ? "Unfollowed" : "Following",
      isFollowing
        ? "You will no longer receive store updates."
        : "You are now following this merchant store."
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Merchant Store
        </Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Store Profile Card */}
        <View style={styles.storeCard}>
          <View style={styles.storeTop}>
            <View style={styles.avatarWrap}>
              <Store size={26} color="#FF5500" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.storeName}>Abamba Official Store</Text>
              <View style={styles.badgeRow}>
                <View style={styles.verifiedBadge}>
                  <ShieldCheck size={12} color="#10B981" />
                  <Text style={styles.verifiedText}>Verified Merchant</Text>
                </View>
                <View style={styles.ratingBox}>
                  <Star size={12} color="#F59E0B" fill="#F59E0B" />
                  <Text style={styles.ratingText}>4.9 (142 reviews)</Text>
                </View>
              </View>
            </View>
          </View>

          <Text style={styles.storeBio}>
            Official accredited dealer on Abamba. Fast regional dispatch, 100% escrow protection guaranteed.
          </Text>

          <View style={styles.btnRow}>
            <TouchableOpacity
              style={[styles.followBtn, isFollowing && styles.followingBtn]}
              onPress={handleFollow}
            >
              {isFollowing ? (
                <>
                  <Check size={15} color="#003459" />
                  <Text style={[styles.followText, { color: "#003459" }]}>Following</Text>
                </>
              ) : (
                <>
                  <UserPlus size={15} color="#FFFFFF" />
                  <Text style={styles.followText}>Follow Store</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Store Catalog Header */}
        <View style={styles.catalogHeader}>
          <Text style={styles.catalogTitle}>Store Inventory ({storeProducts.length})</Text>
        </View>

        {/* Product Grid */}
        <View style={styles.grid}>
          {storeProducts.map((prod) => (
            <ProductCard key={prod._id || prod.id} product={prod} />
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
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
    color: "#003459",
  },
  scrollContent: {
    padding: 16,
  },
  storeCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 16,
  },
  storeTop: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#FFF5F0",
    alignItems: "center",
    justifyContent: "center",
  },
  storeName: {
    fontSize: 17,
    fontWeight: "800",
    color: "#111827",
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 4,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#10B981",
  },
  ratingBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6B7280",
  },
  storeBio: {
    fontSize: 12.5,
    color: "#4B5563",
    lineHeight: 18,
    marginTop: 12,
  },
  btnRow: {
    flexDirection: "row",
    marginTop: 14,
  },
  followBtn: {
    backgroundColor: "#003459",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  followingBtn: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#003459",
  },
  followText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  catalogHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    marginTop: 6,
  },
  catalogTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#003459",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
});

