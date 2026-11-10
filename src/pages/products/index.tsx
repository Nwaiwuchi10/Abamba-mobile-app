import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Search, ArrowLeft } from "lucide-react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { productService } from "../../services";
import { ProductCard } from "../../components/common/ProductCard";
import fallbackProducts from "../../../assets/initial-products.json";

export default function ProductsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();

  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>(fallbackProducts || []);
  const [search, setSearch] = useState((params.search as string) || "");
  const [selectedCategory, setSelectedCategory] = useState(
    (params.category as string) || "All"
  );

  const categories = [
    "All",
    "Electronics",
    "Electricals",
    "Fashion",
    "Foodstuffs",
    "Phones",
    "Cosmetics",
    "Accessories",
    "Furniture",
  ];

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const queryParams: any = { limit: 100 };
      if (search) queryParams.search = search;
      if (selectedCategory !== "All") queryParams.category = selectedCategory;

      const res = await productService.getProducts(queryParams);
      const incoming =
        res?.data?.data?.products ||
        res?.data?.products ||
        res?.data?.data ||
        res?.data;

      if (Array.isArray(incoming) && incoming.length > 0) {
        setProducts(incoming);
      } else if (!products || products.length === 0) {
        setProducts(fallbackProducts);
      }
    } catch (e) {
      console.log("Error loading catalog products:", e);
      if (!products || products.length === 0) {
        setProducts(fallbackProducts);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory]);

  const filteredProducts = products.filter((p) => {
    const matchesCategory =
      selectedCategory === "All" ||
      (p.category && p.category.toLowerCase().includes(selectedCategory.toLowerCase()));
    const matchesSearch =
      !search || (p.name && p.name.toLowerCase().includes(search.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Products Catalog</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchBar}>
        <Search size={18} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          placeholder="Search products..."
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={fetchProducts}
          style={styles.searchInput}
          placeholderTextColor="#9CA3AF"
        />
      </View>

      {/* Category Pills */}
      <View style={styles.catScrollWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.catScroll}
          contentContainerStyle={styles.catScrollContent}
        >
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.catPill,
                selectedCategory === cat && styles.activeCatPill,
              ]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text
                style={[
                  styles.catPillText,
                  selectedCategory === cat && styles.activeCatPillText,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Product Grid */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {loading && (!products || products.length === 0) ? (
          <ActivityIndicator size="large" color="#FF5500" style={{ marginTop: 40 }} />
        ) : (
          <View style={styles.productGrid}>
            {(filteredProducts.length > 0 ? filteredProducts : products).map((prod) => (
              <ProductCard key={prod._id || prod.id} product={prod} />
            ))}
          </View>
        )}

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
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#1F2937",
  },
  catScrollWrapper: {
    marginBottom: 8,
  },
  catScroll: {
    paddingHorizontal: 16,
  },
  catScrollContent: {
    paddingRight: 24,
    paddingVertical: 6,
    alignItems: "center",
  },
  catPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    marginRight: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  activeCatPill: {
    backgroundColor: "#003459",
  },
  catPillText: {
    fontSize: 13,
    color: "#4B5563",
    fontWeight: "500",
  },
  activeCatPillText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  scrollContent: {
    paddingTop: 8,
  },
  productGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
});
