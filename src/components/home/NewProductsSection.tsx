import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { ChevronRight } from "lucide-react-native";
import { useRouter } from "expo-router";
import { ProductCard } from "../common/ProductCard";

interface NewProductsSectionProps {
  products: any[];
  loading: boolean;
}

export const NewProductsSection: React.FC<NewProductsSectionProps> = ({
  products,
  loading,
}) => {
  const router = useRouter();
  const recommendedProducts = products.slice(0, 16);

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.subHeading}>What's new?</Text>
          <Text style={styles.sectionTitle}>Recommended for you</Text>
        </View>
        <TouchableOpacity
          style={styles.viewMorePill}
          onPress={() => router.push("/products" as any)}
          activeOpacity={0.7}
        >
          <Text style={styles.viewMoreText}>View more</Text>
          <ChevronRight size={14} color="#003459" />
        </TouchableOpacity>
      </View>

      {loading && (!products || products.length === 0) ? (
        <ActivityIndicator size="large" color="#FF5500" style={{ marginVertical: 30 }} />
      ) : (
        <View style={styles.productGrid}>
          {recommendedProducts.map((prod) => (
            <ProductCard key={prod._id || prod.id} product={prod} />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
  },
  subHeading: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "500",
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#003459",
    marginTop: 1,
  },
  viewMorePill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(0,52,89,0.3)",
    gap: 2,
  },
  viewMoreText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#003459",
  },
  productGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
});

