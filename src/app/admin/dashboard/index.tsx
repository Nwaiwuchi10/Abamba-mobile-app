import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Users,
  Store,
  DollarSign,
  TrendingUp,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Package,
} from "lucide-react-native";
import { useRouter } from "expo-router";

export default function AdminDashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const metrics = [
    { title: "Total Users", val: "14,820", icon: Users, color: "#3B82F6" },
    { title: "Active Sellers", val: "348", icon: Store, color: "#10B981" },
    { title: "Gross Platform GMV", val: "₦48.2M", icon: DollarSign, color: "#FF5500" },
    { title: "Pending Reviews", val: "19", icon: ShieldCheck, color: "#F59E0B" },
  ];

  const pendingApprovals = [
    { id: "REV-101", product: "Apple iPhone 15 Pro", seller: "Owerri Tech Hub", price: "₦1,250,000" },
    { id: "REV-102", product: "Designer Luxury Suit", seller: "Aba Fashion Plaza", price: "₦85,000" },
    { id: "REV-103", product: "Rechargeable Solar Generator", seller: "Solar Direct Ltd", price: "₦340,000" },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Abamba Super Admin Hub</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Banner */}
        <View style={styles.banner}>
          <Text style={styles.bannerTag}>SYSTEM ADMINISTRATION</Text>
          <Text style={styles.bannerTitle}>Platform Governance</Text>
          <Text style={styles.bannerSub}>Monitor ecosystem activity, approve vendors, and track escrow payouts.</Text>
        </View>

        {/* Metrics Grid */}
        <Text style={styles.sectionHeading}>Platform Metrics</Text>
        <View style={styles.metricsGrid}>
          {metrics.map((m, idx) => {
            const Icon = m.icon;
            return (
              <View key={idx} style={styles.metricCard}>
                <View style={[styles.iconWrap, { backgroundColor: `${m.color}15` }]}>
                  <Icon size={20} color={m.color} />
                </View>
                <Text style={styles.metricVal}>{m.val}</Text>
                <Text style={styles.metricTitle}>{m.title}</Text>
              </View>
            );
          })}
        </View>

        {/* Pending Product Reviews */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeading}>Pending Product Approvals</Text>
          <TouchableOpacity onPress={() => Alert.alert("Product Reviews", "Viewing full product moderation list")}>
            <Text style={styles.seeAll}>See All (19)</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.reviewList}>
          {pendingApprovals.map((item) => (
            <View key={item.id} style={styles.reviewCard}>
              <View style={styles.reviewTop}>
                <View>
                  <Text style={styles.productName}>{item.product}</Text>
                  <Text style={styles.sellerName}>Merchant: {item.seller}</Text>
                </View>
                <Text style={styles.price}>{item.price}</Text>
              </View>

              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.btn, styles.rejectBtn]}
                  onPress={() => Alert.alert("Rejected", `Rejected ${item.product}`)}
                >
                  <XCircle size={15} color="#EF4444" />
                  <Text style={styles.rejectText}>Reject</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.btn, styles.approveBtn]}
                  onPress={() => Alert.alert("Approved", `Approved ${item.product}`)}
                >
                  <CheckCircle size={15} color="#059669" />
                  <Text style={styles.approveText}>Approve & Publish</Text>
                </TouchableOpacity>
              </View>
            </View>
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
    color: "#111827",
  },
  scrollContent: {
    padding: 16,
  },
  banner: {
    backgroundColor: "#111827",
    padding: 18,
    borderRadius: 14,
    marginBottom: 20,
  },
  bannerTag: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FF5500",
    letterSpacing: 1,
  },
  bannerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
    marginTop: 4,
  },
  bannerSub: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 4,
    lineHeight: 18,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 10,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  metricCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 12,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  metricVal: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
  },
  metricTitle: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  seeAll: {
    fontSize: 13,
    color: "#FF5500",
    fontWeight: "600",
  },
  reviewList: {
    marginTop: 4,
  },
  reviewCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 14,
    marginBottom: 12,
  },
  reviewTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  productName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  sellerName: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  price: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FF5500",
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  btn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 38,
    borderRadius: 8,
    gap: 6,
  },
  rejectBtn: {
    borderWidth: 1,
    borderColor: "#FEE2E2",
    backgroundColor: "#FEF2F2",
  },
  rejectText: {
    color: "#EF4444",
    fontSize: 13,
    fontWeight: "700",
  },
  approveBtn: {
    backgroundColor: "#059669",
  },
  approveText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
});

