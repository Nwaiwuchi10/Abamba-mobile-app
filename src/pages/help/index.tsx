import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, Search, ChevronDown, ChevronUp, MessageCircle, Mail } from "lucide-react-native";
import { useRouter } from "expo-router";

export default function HelpScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const faqs = [
    {
      q: "How do I place an order on Abamba?",
      a: "Browse products or use the search bar, click on any item to view its details, choose your quantity and tap 'Add to Cart'. Navigate to your Cart to proceed to checkout and select your preferred logistics courier.",
    },
    {
      q: "How does escrow buyer protection work?",
      a: "When you place an order on Abamba, your payment is held securely in escrow until you confirm delivery and product satisfaction. Only then is the payment disbursed to the merchant.",
    },
    {
      q: "How can I become a seller?",
      a: "Go to your Account screen and tap 'Become a Seller / Seller Hub'. Complete the brief onboarding steps with your business information and payout details to begin selling.",
    },
    {
      q: "What is the return policy?",
      a: "Items can be returned within 7 days of delivery if they are defective, incorrect, or damaged in transit. Contact support immediately upon package receipt.",
    },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.heroBox}>
          <Text style={styles.heroTitle}>How can we assist you?</Text>
          <Text style={styles.heroSub}>Find answers or contact customer support directly</Text>
        </View>

        <Text style={styles.sectionHeading}>Frequently Asked Questions</Text>
        <View style={styles.faqList}>
          {faqs.map((item, idx) => {
            const isExpanded = expandedIndex === idx;
            return (
              <TouchableOpacity
                key={idx}
                style={styles.faqItem}
                activeOpacity={0.8}
                onPress={() => setExpandedIndex(isExpanded ? null : idx)}
              >
                <View style={styles.faqHeader}>
                  <Text style={styles.questionText}>{item.q}</Text>
                  {isExpanded ? (
                    <ChevronUp size={18} color="#003459" />
                  ) : (
                    <ChevronDown size={18} color="#6B7280" />
                  )}
                </View>
                {isExpanded && <Text style={styles.answerText}>{item.a}</Text>}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Contact Support Channels */}
        <Text style={[styles.sectionHeading, { marginTop: 20 }]}>Direct Assistance</Text>
        <View style={styles.contactRow}>
          <TouchableOpacity
            style={styles.contactCard}
            onPress={() => router.push("/contact" as any)}
          >
            <Mail size={22} color="#003459" />
            <Text style={styles.contactTitle}>Contact Support</Text>
            <Text style={styles.contactSub}>Send us a direct message</Text>
          </TouchableOpacity>
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
  heroBox: {
    backgroundColor: "#003459",
    padding: 20,
    borderRadius: 14,
    marginBottom: 20,
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
  },
  heroSub: {
    color: "#9CA3AF",
    fontSize: 13,
    marginTop: 4,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 10,
  },
  faqList: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
  },
  faqItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  faqHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  questionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
    flex: 1,
    marginRight: 8,
  },
  answerText: {
    fontSize: 13,
    color: "#4B5563",
    marginTop: 8,
    lineHeight: 18,
  },
  contactRow: {
    marginTop: 8,
  },
  contactCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
  },
  contactTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    marginTop: 8,
  },
  contactSub: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
});

