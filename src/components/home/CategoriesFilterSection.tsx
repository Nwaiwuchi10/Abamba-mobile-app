import React, { useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { EXACT_WEB_CATEGORIES } from "../../constants/categories";

export const CategoriesFilterSection = () => {
  const router = useRouter();

  const categories = useMemo(() => EXACT_WEB_CATEGORIES, []);

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.subHeading}>Browse Catalog</Text>
          <Text style={styles.sectionTitle}>Shop by Category</Text>
        </View>
        <TouchableOpacity onPress={() => router.push("/products" as any)}>
          <Text style={styles.seeAll}>See All ({categories.length})</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={styles.catCard}
            onPress={() =>
              router.push({
                pathname: "/products" as any,
                params: { category: cat.name },
              })
            }
            activeOpacity={0.8}
          >
            <View style={styles.catImageWrap}>
              <Image source={cat.image} style={styles.catImage} resizeMode="contain" />
            </View>
            <Text style={styles.catLabel} numberOfLines={2}>
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
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
    marginTop: 18,
    marginBottom: 12,
  },
  subHeading: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#003459",
    marginTop: 1,
  },
  seeAll: {
    fontSize: 13,
    color: "#003459",
    fontWeight: "700",
  },
  catRow: {
    paddingHorizontal: 16,
    paddingBottom: 6,
  },
  catCard: {
    alignItems: "center",
    marginRight: 14,
    width: 82,
  },
  catImageWrap: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#F3F4F6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 6,
  },
  catImage: {
    width: 38,
    height: 38,
  },
  catLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#1F2937",
    textAlign: "center",
    lineHeight: 14,
  },
});
