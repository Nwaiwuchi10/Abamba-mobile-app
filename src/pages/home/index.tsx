import React, { useEffect, useState } from "react";
import {
  View,
  Image,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Search, Bell } from "lucide-react-native";
import { useRouter } from "expo-router";
import { productService } from "../../services";

// Modularized home sections
import { WebExactHeroBanner } from "../../components/home/WebExactHeroBanner";
import { NativeAdBannerPlacement } from "../../components/home/NativeAdBannerPlacement";
import { ServiceFeaturesBar } from "../../components/home/ServiceFeaturesBar";
import { NewProductsSection } from "../../components/home/NewProductsSection";
import { CategoriesFilterSection } from "../../components/home/CategoriesFilterSection";
import { ExclusiveTechDeals } from "../../components/home/ExclusiveTechDeals";
import { HotDeals } from "../../components/home/HotDeals";
import { FashionBanner } from "../../components/common/FashionBanner";
import { partitionProductsForHome } from "../../utils/productPartition";
import fallbackProducts from "../../../assets/initial-products.json";

export default function HomePage() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [products, setProducts] = useState<any[]>(fallbackProducts || []);
  const [search, setSearch] = useState("");

  const fetchHomeProducts = async () => {
    try {
      setLoading(true);
      const res = await productService.getProducts({ limit: 100 });
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
      console.log("Using cached fallback items:", e);
      if (!products || products.length === 0) {
        setProducts(fallbackProducts);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHomeProducts();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHomeProducts();
  };

  // Exact Web Partitioning:
  // Recommended gets curated/diverse items, Hot Deals gets a disjoint/different set prioritizing highest active discounts
  const { recommendedProducts, hotDealsProducts } = partitionProductsForHome(products, 16, 10);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── Top Header ── */}
      <View style={styles.header}>
        <Image
          source={require("../../../assets/logos/primary-full-logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <View style={styles.headerIcons}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => router.push("/account" as any)}
          >
            <Bell size={20} color="#1F2937" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Search Bar ── */}
      <View style={styles.searchBar}>
        <Search size={18} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          placeholder="Search products, brands and categories..."
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={() => router.push(`/products?search=${search}` as any)}
          style={styles.searchInput}
          placeholderTextColor="#9CA3AF"
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* 1. <Banner /> Multi-Slide Show */}
        <WebExactHeroBanner />

        {/* 2. <NativeAdBannerPlacement /> */}
        {/* <NativeAdBannerPlacement /> */}
        {/* 3. <CategoriesFilter /> */}
        <CategoriesFilterSection />

        {/* 4. <NewProducts /> */}
        <NewProductsSection products={recommendedProducts} loading={loading} />


        {/* 5. <ServiceFeaturesBar /> */}
        <ServiceFeaturesBar />

        {/* 6. <ExclusiveTechDeals /> */}
        <ExclusiveTechDeals />

        {/* 7. <HotDeals /> (Distinct discounted items partitioned from products) */}
        <HotDeals products={hotDealsProducts} />

        {/* 8. <FashionBanner /> directly below HotDeals */}
        <FashionBanner />

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
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
  },
  logo: {
    width: 140,
    height: 38,
  },
  headerIcons: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginVertical: 10,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
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
  scrollContent: {
    paddingBottom: 20,
  },
});

