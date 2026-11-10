import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { ChevronRight } from "lucide-react-native";
import { useRouter } from "expo-router";
import { ProductCard } from "../common/ProductCard";

interface HotDealsProps {
  products: any[];
}

export const HotDeals: React.FC<HotDealsProps> = ({ products }) => {
  const router = useRouter();

  // Renders the exact partition passed to HotDeals
  const displayProducts = products && products.length > 0 ? products.slice(0, 10) : [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Hot deals</Text>
        <TouchableOpacity
          style={styles.viewMoreBtn}
          onPress={() => router.push("/products" as any)}
          activeOpacity={0.7}
        >
          <Text style={styles.viewMoreText}>View more</Text>
          <ChevronRight size={14} color="#003459" />
        </TouchableOpacity>
      </View>

      <View style={styles.grid}>
        {displayProducts.map((prod) => (
          <ProductCard key={prod._id || prod.id} product={prod} />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 14,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: "#003459",
  },
  viewMoreBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#003459",
    gap: 2,
  },
  viewMoreText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#003459",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
});

