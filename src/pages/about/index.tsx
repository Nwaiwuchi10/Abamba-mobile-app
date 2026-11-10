import React from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, ShieldCheck, Heart, Award, Users } from "lucide-react-native";
import { useRouter } from "expo-router";

export default function AboutScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const values = [
    { icon: ShieldCheck, title: "Escrow Protection", desc: "Payments held safe until buyers confirm order quality." },
    { icon: Award, title: "Verified Merchants", desc: "All sellers are thoroughly vetted for authenticity." },
    { icon: Users, title: "Community First", desc: "Empowering Nigerian entrepreneurs and local businesses." },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About Abamba</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.heroBanner}>
          <Image
            source={require("../../../assets/logos/primary-full-logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.tagline}>Africa's Leading E-Commerce Marketplace</Text>
          <Text style={styles.subtext}>
            Connecting genuine buyers with verified sellers with 0% transaction risk.
          </Text>
        </View>

        <Text style={styles.heading}>Our Mission</Text>
        <Text style={styles.paragraph}>
          Abamba was founded with a singular purpose: to build trust in African online commerce.
          By combining transparent seller ratings, guaranteed regional courier delivery, and secure
          escrow disbursement, we eliminate buyer fraud and unlock boundless growth for merchants.
        </Text>

        <Text style={[styles.heading, { marginTop: 20 }]}>Core Pillars</Text>
        {values.map((v, i) => {
          const Icon = v.icon;
          return (
            <View key={i} style={styles.valueCard}>
              <View style={styles.iconCircle}>
                <Icon size={20} color="#FF5500" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.valueTitle}>{v.title}</Text>
                <Text style={styles.valueDesc}>{v.desc}</Text>
              </View>
            </View>
          );
        })}

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
  heroBanner: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 20,
  },
  logo: {
    width: 170,
    height: 48,
    marginBottom: 10,
  },
  tagline: {
    fontSize: 15,
    fontWeight: "800",
    color: "#003459",
    textAlign: "center",
  },
  subtext: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
  },
  heading: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 13,
    color: "#4B5563",
    lineHeight: 20,
  },
  valueCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 10,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFF5F0",
    alignItems: "center",
    justifyContent: "center",
  },
  valueTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  valueDesc: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
});

