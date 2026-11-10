import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";

export const ExclusiveTechDeals = () => {
  const router = useRouter();

  const deals = [
    {
      title: "EXCLUSIVE DEALS",
      highlight: "ON PREMIUM TECH",
      desc: "Save more on top global brands.",
      image: require("../../../assets/images/heroimg1.png"),
      bg: "#002340",
      textColor: "#FFFFFF",
      highlightColor: "#F7DBA7",
      category: "Electronics",
    },
    {
      title: "MACBOOKS & LAPTOPS",
      highlight: "POWER & SPEED",
      desc: "Performance. Perfection. Reliability.",
      image: require("../../../assets/images/laptophero.png"),
      bg: "#FCEED5",
      textColor: "#003459",
      highlightColor: "#FF5500",
      category: "Electronics",
    },
    {
      title: "APPLE WATCH",
      highlight: "SMART LIFE",
      desc: "Track. Connect. Live Smarter.",
      image: require("../../../assets/images/watchhero.png"),
      bg: "#002340",
      textColor: "#FFFFFF",
      highlightColor: "#F7DBA7",
      category: "Accessories",
    },
    {
      title: "Sell on Abamba",
      highlight: "MERCHANT HUB",
      desc: "Grow your business with 0% risk.",
      image: require("../../../assets/images/salesrep.png"),
      bg: "#D4DDD2",
      textColor: "#1A2E1A",
      highlightColor: "#059669",
      isSeller: true,
    },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.sectionHeading}>Exclusive Deals on Tech</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {deals.map((item, idx) => (
          <TouchableOpacity
            key={idx}
            style={[styles.card, { backgroundColor: item.bg }]}
            activeOpacity={0.9}
            onPress={() => {
              if (item.isSeller) {
                router.push("/seller/onboarding" as any);
              } else {
                router.push(`/products?category=${item.category}` as any);
              }
            }}
          >
            <View style={styles.textWrap}>
              <Text style={[styles.title, { color: item.textColor }]}>{item.title}</Text>
              <Text style={[styles.highlight, { color: item.highlightColor }]}>
                {item.highlight}
              </Text>
              <Text style={[styles.desc, { color: item.textColor }]} numberOfLines={2}>
                {item.desc}
              </Text>
              <View style={styles.pill}>
                <Text style={styles.pillText}>
                  {item.isSeller ? "Start Selling →" : "Shop Now →"}
                </Text>
              </View>
            </View>

            <Image source={item.image} style={styles.img} resizeMode="contain" />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 18,
    marginBottom: 10,
  },
  sectionHeading: {
    fontSize: 17,
    fontWeight: "800",
    color: "#003459",
    marginHorizontal: 16,
    marginBottom: 12,
  },
  scroll: {
    paddingLeft: 16,
    gap: 12,
  },
  card: {
    width: 250,
    height: 140,
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
  },
  textWrap: {
    flex: 1.2,
    justifyContent: "center",
  },
  title: {
    fontSize: 12,
    fontWeight: "800",
  },
  highlight: {
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 4,
  },
  desc: {
    fontSize: 10,
    opacity: 0.85,
    marginBottom: 8,
    lineHeight: 14,
  },
  pill: {
    backgroundColor: "rgba(255,255,255,0.9)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  pillText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#003459",
  },
  img: {
    flex: 0.8,
    height: 110,
    marginLeft: 6,
  },
});

