import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, Shield, FileText, ExternalLink, Store } from "lucide-react-native";
import { useRouter } from "expo-router";

export default function TermsOfServiceScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const sections = [
    {
      title: "1. Acceptance of Terms",
      content:
        "By creating an account or using our Platform, you confirm that you are at least 18 years old, have the legal capacity to enter contracts, and agree to these Terms.",
    },
    {
      title: "2. Account Registration",
      content:
        "To use certain features, you must register for an account. You agree to provide accurate, current, and complete information during registration and to keep your account credentials confidential. You are responsible for all activities conducted through your account.",
    },
    {
      title: "3. Use of the Platform",
      content:
        "Abamba Market Space is a marketplace designed to connect buyers and sellers for goods and services, including barter and trade offers. You agree to use the Platform only for lawful purposes and in compliance with all applicable laws. You agree not to:\n• List or sell counterfeit, stolen, illegal or prohibited items.\n• Post false, misleading or deceptive product information or prices.\n• Take payment or arrange delivery outside the Platform to avoid fees or buyer protection.\n• Harass other users, or attempt to hack, disrupt or misuse the Platform.\n• Create multiple accounts to abuse promotions, referrals or reviews.",
    },
    {
      title: "4. Orders, Payments and Escrow",
      content:
        "When a buyer pays for an order, the payment is held by Abamba Market Space until the order is confirmed as delivered. After delivery is confirmed, the seller's earnings (the order value less any applicable platform fee) become available in the seller's wallet. Prices are shown in Nigerian Naira (₦).",
    },
    {
      title: "5. Seller Obligations and Payouts",
      content:
        "Sellers must list accurate products, keep stock information up to date, fulfil orders within the agreed timeframe, and provide valid bank account details in their own name. Sellers may request a withdrawal of their available wallet balance. Each withdrawal request is reviewed and approved by Abamba Market Space before it is paid out to the seller's bank account. Abamba Market Space may withhold, reverse or delay payouts where fraud, a dispute or an error is suspected.",
    },
    {
      title: "6. Returns, Refunds and Disputes",
      content:
        "Returns and refunds are governed by our Refund and Return Policy. Return requests must be made within 7 days of receiving the item. Disputes that buyer and seller cannot resolve may be escalated to Abamba Market Space support.",
    },
    {
      title: "7. Fees",
      content:
        "Abamba Market Space may charge a platform fee or commission on completed sales. Applicable fees, including any promotional (reduced or zero) fee periods, are shown to sellers in their dashboard and order details.",
    },
    {
      title: "8. Limitation of Liability",
      content:
        "Abamba Market Space provides the Platform on an “as is” basis. To the maximum extent permitted by law, we are not liable for indirect or consequential losses arising from your use of the Platform, or for the conduct of buyers and sellers, beyond the value of the relevant transaction.",
    },
    {
      title: "9. Suspension and Termination",
      content:
        "We may suspend or close accounts that breach these Terms, are used for fraud, or put other users at risk. You may close your account at any time by contacting support.",
    },
    {
      title: "10. Changes and Governing Law",
      content:
        "We may update these Terms from time to time; continued use of the Platform means you accept the updated Terms. These Terms are governed by the laws of the Federal Republic of Nigeria.",
    },
    {
      title: "11. Contact Us",
      content:
        "OSIBIDI DIGITAL INNOVATION, Angelina House, 31 Wetheral Road, Owerri, Imo State, Nigeria\nPhone: +2349077758206 / +2348060039760\nEmail: Abambasupport@gmail.com",
    },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms and conditions</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.heroBox}>
          <FileText size={26} color="#003459" />
          <Text style={styles.heroTitle}>Abamba Market Space – Terms and conditions</Text>
          <Text style={styles.heroSub}>Effective Date: 8/19/2025</Text>
          <Text style={styles.heroIntro}>
            Welcome to Abamba Market Space! These Terms of Service (“Terms”) govern your use of our
            website, mobile app, and services (collectively, the “Platform”), which is operated by
            OSIBIDI DIGITAL INNOVATION. By accessing or using Abamba Market Space, you agree to
            comply with and be bound by these Terms.
          </Text>
        </View>

        {sections.map((sec, i) => (
          <View key={i} style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>{sec.title}</Text>
            <Text style={styles.sectionContent}>{sec.content}</Text>
          </View>
        ))}

        {/* Return Policy Link Pill */}
        <TouchableOpacity
          style={styles.returnPolicyBtn}
          onPress={() => router.push("/return-policy" as any)}
        >
          <Shield size={16} color="#003459" />
          <Text style={styles.returnPolicyText}>View Refund and Return Policy</Text>
          <ExternalLink size={14} color="#003459" />
        </TouchableOpacity>

        {/* Become a Seller CTA banner under Terms & Conditions (Exact to Web) */}
        <View style={styles.sellerBanner}>
          <View style={styles.sellerIconBox}>
            <Store size={22} color="#003459" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sellerBannerTitle}>Want to sell on Abamba?</Text>
            <Text style={styles.sellerBannerSub}>
              Start selling your products to thousands of shoppers across Nigeria.
            </Text>
          </View>
          <TouchableOpacity
            style={styles.sellerBtn}
            onPress={() => router.push("/seller/onboarding" as any)}
          >
            <Text style={styles.sellerBtnText}>Become a Seller</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 60 }} />
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
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 17,
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
    marginTop: 8,
    textAlign: "center",
  },
  heroSub: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
    fontWeight: "500",
  },
  heroIntro: {
    fontSize: 13,
    color: "#4B5563",
    lineHeight: 19,
    marginTop: 10,
    textAlign: "center",
  },
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 6,
  },
  sectionContent: {
    fontSize: 13,
    color: "#4B5563",
    lineHeight: 20,
  },
  returnPolicyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0F9FF",
    borderWidth: 1,
    borderColor: "#BAE6FD",
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 4,
    marginBottom: 16,
    gap: 8,
  },
  returnPolicyText: {
    color: "#003459",
    fontWeight: "600",
    fontSize: 13,
  },
  sellerBanner: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    padding: 16,
    gap: 12,
    marginTop: 4,
  },
  sellerIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E0F2FE",
    alignItems: "center",
    justifyContent: "center",
  },
  sellerBannerTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },
  sellerBannerSub: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
    lineHeight: 18,
  },
  sellerBtn: {
    backgroundColor: "#003459",
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 4,
  },
  sellerBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});
