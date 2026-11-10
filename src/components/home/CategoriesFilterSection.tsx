import React from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";

export const CategoriesFilterSection = () => {
  const router = useRouter();

  const staticCategories = [
    { id: "1", name: "Foodstuffs", image: require("../../../assets/images/food-category.png") },
    { id: "2", name: "Electronics", image: require("../../../assets/images/electronics.png") },
    { id: "3", name: "Fashion", image: require("../../../assets/images/hangedclothes.png") },
    { id: "4", name: "Phones", image: require("../../../assets/images/phone.png") },
    { id: "5", name: "Cosmetics", image: require("../../../assets/images/cosmetics.png") },
    { id: "6", name: "Accessories", image: require("../../../assets/images/accessories.png") },
    { id: "7", name: "Furniture", image: require("../../../assets/images/furnitures.png") },
    { id: "8", name: "Home & Decor", image: require("../../../assets/images/decor.png") },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.subHeading}>Browse Catalog</Text>
          <Text style={styles.sectionTitle}>Product Categories</Text>
        </View>
        <TouchableOpacity onPress={() => router.push("/products" as any)}>
          <Text style={styles.seeAll}>See All</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catRow}>
        {staticCategories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={styles.catCard}
            onPress={() => router.push(`/products?category=${encodeURIComponent(cat.name)}` as any)}
          >
            <View style={styles.catImageWrap}>
              <Image source={cat.image} style={styles.catImage} resizeMode="contain" />
            </View>
            <Text style={styles.catLabel} numberOfLines={1}>
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
    fontWeight: "500",
  },
  sectionTitle: {
    fontSize: 17,
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
    paddingLeft: 16,
    marginBottom: 10,
  },
  catCard: {
    alignItems: "center",
    marginRight: 14,
    width: 72,
  },
  catImageWrap: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 6,
  },
  catImage: {
    width: 38,
    height: 38,
  },
  catLabel: {
    fontSize: 11,
    color: "#374151",
    fontWeight: "600",
    textAlign: "center",
  },
});

