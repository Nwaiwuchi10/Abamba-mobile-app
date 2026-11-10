import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, Plus, Search, Edit3, Trash2, Package } from "lucide-react-native";
import { useRouter } from "expo-router";

export default function SellerInventoryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [products, setProducts] = useState([
    {
      id: "inv-1",
      name: "Apple iPhone 14 Pro Max 256GB",
      price: 950000,
      stock: 8,
      category: "Phones",
      status: "In Stock",
    },
    {
      id: "inv-2",
      name: "Wireless Bluetooth Bass Earbuds",
      price: 18000,
      stock: 45,
      category: "Electronics",
      status: "In Stock",
    },
    {
      id: "inv-3",
      name: "Minimalist Leather Smart Watch",
      price: 32000,
      stock: 0,
      category: "Accessories",
      status: "Out of Stock",
    },
  ]);

  const handleDelete = (id: string) => {
    Alert.alert("Delete Product", "Are you sure you want to remove this product from your inventory?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => setProducts((prev) => prev.filter((p) => p.id !== id)),
      },
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Seller Inventory</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => Alert.alert("Add Product", "Open new product listing form")}
        >
          <Plus size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchBar}>
        <Search size={18} color="#9CA3AF" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search your inventory..."
          placeholderTextColor="#9CA3AF"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {products.map((item) => (
          <View key={item.id} style={styles.productCard}>
            <View style={styles.productTop}>
              <View style={styles.iconBox}>
                <Package size={22} color="#FF5500" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.productName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.category}>{item.category}</Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  item.status === "In Stock" ? styles.stockIn : styles.stockOut,
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    item.status === "In Stock" ? styles.textIn : styles.textOut,
                  ]}
                >
                  {item.status}
                </Text>
              </View>
            </View>

            <View style={styles.productBottom}>
              <View>
                <Text style={styles.price}>₦{item.price.toLocaleString()}</Text>
                <Text style={styles.stockCount}>Units Available: {item.stock}</Text>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.actionIcon}
                  onPress={() => Alert.alert("Edit", `Edit ${item.name}`)}
                >
                  <Edit3 size={16} color="#4B5563" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionIcon, { borderColor: "#FEE2E2" }]}
                  onPress={() => handleDelete(item.id)}
                >
                  <Trash2 size={16} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}

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
    color: "#111827",
  },
  addBtn: {
    backgroundColor: "#FF5500",
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
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
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#1F2937",
  },
  scrollContent: {
    padding: 16,
  },
  productCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 14,
    marginBottom: 12,
  },
  productTop: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: "#FFF5F0",
    alignItems: "center",
    justifyContent: "center",
  },
  productName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1F2937",
  },
  category: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  stockIn: {
    backgroundColor: "#ECFDF5",
  },
  stockOut: {
    backgroundColor: "#FEF2F2",
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
  },
  textIn: {
    color: "#059669",
  },
  textOut: {
    color: "#DC2626",
  },
  productBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  price: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FF5500",
  },
  stockCount: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
  actionIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
});

