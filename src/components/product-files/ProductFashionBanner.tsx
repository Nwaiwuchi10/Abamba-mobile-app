import React from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity, Dimensions } from "react-native";
import { useRouter } from "expo-router";

const { width } = Dimensions.get("window");

export const ProductFashionBanner: React.FC = () => {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.curveBg} />
      <View style={styles.content}>
        <View style={styles.textContainer}>
          <Text style={styles.title}>WE MADE YOUR EVERYDAY FASHION BETTER!</Text>
          <Text style={styles.subtitle}>
            In our journey to improve everyday fashion, Euphoria presents EVERYDAY wear range -
            Comfortable & Affordable fashion 24/7.
          </Text>
          <TouchableOpacity
            style={styles.ctaBtn}
            onPress={() => router.push("/products" as any)}
            activeOpacity={0.8}
          >
            <Text style={styles.ctaBtnText}>Shop Now</Text>
          </TouchableOpacity>
        </View>

        <Image
          source={require("../../../assets/images/shopping.png")}
          style={styles.image}
          resizeMode="contain"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#003459",
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 20,
    overflow: "hidden",
    position: "relative",
  },
  curveBg: {
    position: "absolute",
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "#002A48",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 18,
  },
  textContainer: {
    flex: 1,
    paddingRight: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: "900",
    color: "#FFFFFF",
    lineHeight: 22,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
    lineHeight: 17,
    marginBottom: 12,
  },
  ctaBtn: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  ctaBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#003459",
  },
  image: {
    width: 105,
    height: 120,
  },
});

export default ProductFashionBanner;
