import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import * as SplashScreen from "expo-splash-screen";
import { ArrowRight } from "lucide-react-native";

SplashScreen.preventAutoHideAsync().catch(() => {});

const { width, height } = Dimensions.get("window");

interface Props {
  onFinish?: () => void;
}

// Hero pictures used in the home hero slider:
const HERO_SLIDES = [
  {
    image: require("../../../assets/images/stylishwoman.png"),
    tag: "FASHION & STYLE",
    title: "LOOK GOOD.\nFEEL CONFIDENT.",
    subtitle: "Discover Africa's trendiest styles and curated fashion collections.",
    accent: "#003459",
    tagColor: "#F2A743",
  },
  {
    image: require("../../../assets/images/abambalaptop.png"),
    tag: "PREMIUM TECH",
    title: "LUXURY TECH.\nLIMITLESS DREAMS.",
    subtitle: "High performance laptops, smartphones & certified audio devices.",
    accent: "#0B0C0E",
    tagColor: "#F2A743",
  },
  {
    image: require("../../../assets/images/phone.png"),
    tag: "0% BUYER RISK",
    title: "EVERYTHING YOU NEED,\nDELIVERED TO YOU",
    subtitle: "Shop top-rated electronics and everyday essentials with escrow protection.",
    accent: "#003459",
    tagColor: "#10B981",
  },
  {
    image: require("../../../assets/images/watch.png"),
    tag: "UP TO 80% OFF",
    title: "SMART WATCHES &\nFITNESS WEAR",
    subtitle: "Track your health, daily goals and lifestyle in true comfort.",
    accent: "#002642",
    tagColor: "#FF5500",
  },
];

export const CustomSplashScreen: React.FC<Props> = ({ onFinish }) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const imageScaleAnim = useRef(new Animated.Value(0.92)).current;
  const slideAnim = useRef(new Animated.Value(15)).current;

  const currentSlide = HERO_SLIDES[currentSlideIndex];

  useEffect(() => {
    // Hide system splash screen immediately once our custom splash mounts
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  useEffect(() => {
    // Animate current slide in
    fadeAnim.setValue(0);
    imageScaleAnim.setValue(0.92);
    slideAnim.setValue(15);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
      }),
      Animated.spring(imageScaleAnim, {
        toValue: 1,
        friction: 7,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 450,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto cycle through hero pictures every 2.8s
    const timer = setTimeout(() => {
      if (currentSlideIndex < HERO_SLIDES.length - 1) {
        setCurrentSlideIndex((prev) => prev + 1);
      } else {
        // Finished all hero pictures, dismiss splash
        handleDismiss();
      }
    }, 2800);

    return () => clearTimeout(timer);
  }, [currentSlideIndex]);

  const handleDismiss = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 350,
      useNativeDriver: true,
    }).start(() => {
      if (onFinish) onFinish();
    });
  };

  return (
    <View style={styles.container}>
      {/* Background Hero Picture */}
      <Animated.View
        style={[
          styles.heroImageContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: imageScaleAnim }],
          },
        ]}
      >
        <Image
          source={currentSlide.image}
          style={styles.heroImage}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Top Header with Abamba Logo & Skip Button */}
      <View style={styles.topHeader}>
        <Image
          source={require("../../../assets/logos/primary-full-logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <TouchableOpacity style={styles.skipBtn} onPress={handleDismiss} activeOpacity={0.7}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Content Card */}
      <Animated.View
        style={[
          styles.bottomCard,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Badge / Tag */}
        <View style={[styles.badge, { backgroundColor: "rgba(0, 52, 89, 0.08)" }]}>
          <Text style={[styles.badgeText, { color: currentSlide.tagColor }]}>
            {currentSlide.tag}
          </Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>{currentSlide.title}</Text>

        {/* Subtitle */}
        <Text style={styles.subtitle}>{currentSlide.subtitle}</Text>

        {/* Indicator Dots & Get Started Button */}
        <View style={styles.footerRow}>
          <View style={styles.dotsRow}>
            {HERO_SLIDES.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  index === currentSlideIndex ? styles.activeDot : styles.inactiveDot,
                ]}
              />
            ))}
          </View>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => {
              if (currentSlideIndex < HERO_SLIDES.length - 1) {
                setCurrentSlideIndex((prev) => prev + 1);
              } else {
                handleDismiss();
              }
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.actionBtnText}>
              {currentSlideIndex === HERO_SLIDES.length - 1 ? "Start Shopping" : "Next"}
            </Text>
            <ArrowRight size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#FCEED5",
    zIndex: 99999,
    justifyContent: "space-between",
  },
  topHeader: {
    position: "absolute",
    top: 50,
    left: 20,
    right: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 20,
  },
  logo: {
    width: 140,
    height: 42,
  },
  skipBtn: {
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(0, 52, 89, 0.12)",
  },
  skipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#003459",
  },
  heroImageContainer: {
    position: "absolute",
    top: height * 0.12,
    left: 0,
    right: 0,
    height: height * 0.48,
    alignItems: "center",
    justifyContent: "center",
  },
  heroImage: {
    width: width * 0.86,
    height: height * 0.44,
  },
  bottomCard: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 42,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 12,
  },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    marginBottom: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    color: "#003459",
    lineHeight: 30,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
    marginBottom: 24,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  dot: {
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },
  activeDot: {
    width: 24,
    backgroundColor: "#003459",
  },
  inactiveDot: {
    width: 8,
    backgroundColor: "#D1D5DB",
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#003459",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
  },
  actionBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});
