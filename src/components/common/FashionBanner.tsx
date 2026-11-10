import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

export const FashionBanner = () => {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <Text style={styles.headline}>WE MADE YOUR EVERYDAY FASHION BETTER!</Text>
        <Text style={styles.subtext}>
          Comfortable & Affordable fashion 24/7. Discover trendy collections today.
        </Text>
        <TouchableOpacity
          style={styles.shopBtn}
          onPress={() => router.push("/products?category=Fashion" as any)}
        >
          <Text style={styles.shopBtnText}>Shop now</Text>
        </TouchableOpacity>
      </View>

      <Image
        source={require("../../../assets/images/shopping.png")}
        style={styles.image}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 18,
    backgroundColor: "#003459",
    borderRadius: 18,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
    minHeight: 160,
  },
  left: {
    flex: 1.2,
    justifyContent: "center",
  },
  headline: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
    lineHeight: 19,
    marginBottom: 6,
  },
  subtext: {
    color: "#E5E7EB",
    fontSize: 10.5,
    lineHeight: 15,
    marginBottom: 12,
  },
  shopBtn: {
    backgroundColor: "#FF5500",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  shopBtnText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },
  image: {
    flex: 0.8,
    height: 140,
    marginLeft: 6,
  },
});

