import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, RotateCcw, AlertCircle, CheckCircle2 } from "lucide-react-native";
import { useRouter } from "expo-router";

export default function ReturnPolicyScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const rules = [
    { title: "7-Day Return Window", desc: "Notify support or open a dispute within 7 days of package delivery." },
    { title: "Condition Requirement", desc: "Items must remain unused, unworn, and with all original tags/packaging intact." },
    { title: "Defective & Damaged Items", desc: "100% full refund or free replacement guaranteed for items damaged in transit." },
    { title: "Escrow Hold Safeguard", desc: "Seller payouts are withheld until your dispute is reviewed by Abamba mediators." },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Return & Refund Policy</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.heroBox}>
          <RotateCcw size={28} color="#FF5500" />
          <Text style={styles.heroTitle}>Buyer Protection Guarantee</Text>
          <Text style={styles.heroSub}>
            Shop with total peace of mind. If your order isn't as described or arrives damaged, we have you covered.
          </Text>
        </View>

        <Text style={styles.heading}>Policy Guidelines</Text>
        {rules.map((r, i) => (
          <View key={i} style={styles.ruleCard}>
            <CheckCircle2 size={18} color="#10B981" style={{ marginTop: 2 }} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.ruleTitle}>{r.title}</Text>
              <Text style={styles.ruleDesc}>{r.desc}</Text>
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
    color: "#003459",
  },
  scrollContent: {
    padding: 16,
  },
  heroBox: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#111827",
    marginTop: 8,
  },
  heroSub: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
  },
  heading: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 10,
  },
  ruleCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 10,
  },
  ruleTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  ruleDesc: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
    lineHeight: 16,
  },
});

