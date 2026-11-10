import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { Truck, ShieldCheck, RefreshCw, CheckCircle, Headphones } from "lucide-react-native";

export const ServiceFeaturesBar = () => {
  const features = [
    { icon: Truck, title: "Free Delivery", desc: "Above ₦20,000" },
    { icon: ShieldCheck, title: "Secure Payment", desc: "100% Escrow" },
    { icon: RefreshCw, title: "Easy Returns", desc: "7-Day Policy" },
    { icon: CheckCircle, title: "Buyer Protection", desc: "Guaranteed" },
    { icon: Headphones, title: "24/7 Support", desc: "We are here" },
  ];

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {features.map((feat, idx) => {
          const Icon = feat.icon;
          return (
            <View key={idx} style={styles.card}>
              <Icon size={18} color="#003459" />
              <View style={{ marginLeft: 8 }}>
                <Text style={styles.title}>{feat.title}</Text>
                <Text style={styles.desc}>{feat.desc}</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 10,
    backgroundColor: "#FDF6EB",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: "rgba(243, 228, 208, 0.8)",
  },
  row: {
    paddingHorizontal: 6,
    gap: 16,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
  },
  title: {
    fontSize: 12,
    fontWeight: "700",
    color: "#003459",
  },
  desc: {
    fontSize: 10,
    color: "rgba(0, 52, 89, 0.7)",
    marginTop: 1,
  },
});

