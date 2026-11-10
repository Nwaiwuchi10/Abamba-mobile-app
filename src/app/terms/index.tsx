import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, Shield, FileText } from "lucide-react-native";
import { useRouter } from "expo-router";

export default function TermsOfServiceScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const sections = [
    {
      title: "1. Acceptance of Terms",
      content:
        "By downloading, accessing, or using the Abamba mobile application, you agree to be bound by these Terms of Service. If you do not accept these terms, do not use the platform.",
    },
    {
      title: "2. Escrow & Payment Processing",
      content:
        "All transactions on Abamba are processed through secure third-party payment gateways and held in escrow. Payouts are made to verified merchants once the delivery window elapses without dispute.",
    },
    {
      title: "3. Seller Responsibilities",
      content:
        "Sellers must ensure all listed items are authentic, accurately represented, and delivered via approved logistics partners in satisfactory condition.",
    },
    {
      title: "4. Disputes and Arbitration",
      content:
        "Any discrepancies between buyers and merchants should first be reported through the Help Center. Abamba support acts as an impartial mediator.",
    },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms of Service</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.heroBox}>
          <FileText size={26} color="#FF5500" />
          <Text style={styles.heroTitle}>User Agreement & Terms</Text>
          <Text style={styles.heroSub}>Last updated: November 2024</Text>
        </View>

        {sections.map((sec, i) => (
          <View key={i} style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>{sec.title}</Text>
            <Text style={styles.sectionContent}>{sec.content}</Text>
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
    padding: 18,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#111827",
    marginTop: 6,
  },
  heroSub: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  sectionContent: {
    fontSize: 12.5,
    color: "#4B5563",
    lineHeight: 18,
  },
});

