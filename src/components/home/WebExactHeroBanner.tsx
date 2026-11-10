import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
} from "react-native";
import { useRouter } from "expo-router";
import { ChevronRight, ChevronLeft } from "lucide-react-native";

const { width } = Dimensions.get("window");
const BANNER_WIDTH = width - 32;

export const WebExactHeroBanner = () => {
  const router = useRouter();
  const [activeSlide, setActiveSlide] = useState(0);

  // Fade animation for transition between slides
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // The 6 Exact Web Slides from web/abamba/src/components/home/banner.jsx:
  // 1. FashionSlide (3 Card series on Web Mobile)
  // 2. LuxuryTechSlide
  // 3. EverythingDarkSlide
  // 4. EverythingLightSlide
  // 5. OriginalBannerSlide
  // 6. AbambaHeroSlide
  const slides = [
    // 0: FashionSlide Card A (New Arrivals / Effortless Styles)
    {
      id: "0",
      type: "navyCurve",
      bgColor: "#FCEED5",
      curveColor: "#003459",
      badge: "NEW ARRIVALS",
      badgeColor: "rgba(255,255,255,0.8)",
      title: "EFFORTLESS",
      title2: "EVERYDAY WEAR",
      sub: "Comfort. Quality. Style.",
      cta: "Shop now",
      ctaBg: "#FCEED5",
      ctaText: "#003459",
      image: require("../../../assets/images/twodarkshades.png"),
      route: "/products?category=Fashion",
    },
    // 1: FashionSlide Card B (Quality wear / Hanged Clothes)
    {
      id: "1",
      type: "softCurve",
      bgColor: "#FCEED5",
      badge: "EXCLUSIVE COLLECTION",
      badgeColor: "#E8792B",
      title: "ELEVATE YOUR",
      title2: "EVERYDAY LOOK",
      sub: "Shop trendy wardrobes 24/7.",
      cta: "Explore now",
      ctaBg: "#003459",
      ctaText: "#FFFFFF",
      image: require("../../../assets/images/hangedclothes.png"),
      route: "/products?category=Fashion",
    },
    // 2: FashionSlide Card C (Look Good / Stylish Woman)
    {
      id: "2",
      type: "navyCurve",
      bgColor: "#FCEED5",
      curveColor: "#003459",
      badge: "LIMITED EDITION",
      badgeColor: "rgba(255,255,255,0.8)",
      title: "LOOK GOOD.",
      title2: "FEEL CONFIDENT.",
      sub: "Express yourself with Abamba Fashion.",
      cta: "Shop collection",
      ctaBg: "#FCEED5",
      ctaText: "#003459",
      image: require("../../../assets/images/stylishwoman.png"),
      route: "/products?category=Fashion",
    },
    // 3: LuxuryTechSlide (Dark #0B0C0E + Gold #F2A743)
    {
      id: "3",
      type: "darkTech",
      bgColor: "#0B0C0E",
      badge: "PREMIUM COLLECTION",
      badgeColor: "#F2A743",
      title: "LUXURY TECH.",
      title2: "LIMITLESS DREAMS.",
      sub: "Certified MacBooks, iPhones & Hi-Fi audio.",
      cta: "Shop tech",
      ctaBg: "#F2A743",
      ctaText: "#0B0C0E",
      image: require("../../../assets/images/abambalaptop.png"),
      route: "/products?category=Electronics",
    },
    // 4: EverythingDarkSlide (Deep Navy #002642 Organic Curve)
    {
      id: "4",
      type: "navyCurve",
      bgColor: "#FCEED5",
      curveColor: "#002642",
      badge: "0% BUYER RISK",
      badgeColor: "#F7DBA7",
      title: "EVERYTHING YOU NEED,",
      title2: "DELIVERED TO YOU",
      sub: "Shop top quality items from verified sellers.",
      cta: "Browse all",
      ctaBg: "#F7DBA7",
      ctaText: "#003459",
      image: require("../../../assets/images/phone.png"),
      route: "/products",
    },
    // 5: OriginalBannerSlide (Smart Watches 80% OFF)
    {
      id: "5",
      type: "lightGold",
      bgColor: "#FFE8BE",
      badge: "HOT DEAL ONLINE",
      badgeColor: "#003459",
      title: "SMART WATCHES",
      title2: "UP TO 80% OFF",
      sub: "Track your fitness in comfort and style.",
      cta: "Claim deal",
      ctaBg: "#003459",
      ctaText: "#FFFFFF",
      image: require("../../../assets/images/watch.png"),
      route: "/products?category=Accessories",
    },
  ];

  // Auto-advance loop exactly as web banner (5.5s)
  useEffect(() => {
    const timer = setInterval(() => {
      handleNext();
    }, 5500);

    return () => clearInterval(timer);
  }, [activeSlide]);

  const changeSlide = (newIndex: number) => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0.2,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
    setActiveSlide(newIndex);
  };

  const handleNext = () => {
    const nextIdx = (activeSlide + 1) % slides.length;
    changeSlide(nextIdx);
  };

  const handlePrev = () => {
    const prevIdx = (activeSlide - 1 + slides.length) % slides.length;
    changeSlide(prevIdx);
  };

  const current = slides[activeSlide];
  const isDark = current.bgColor === "#0B0C0E";

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.bannerBox,
          { backgroundColor: current.bgColor, opacity: fadeAnim },
        ]}
      >
        {/* Navy Organic Curve Background matching Picture & Web CSS */}
        {current.type === "navyCurve" && (
          <View
            style={[
              styles.organicCurve,
              { backgroundColor: current.curveColor || "#003459" },
            ]}
          />
        )}

        {/* Content Layer */}
        <View style={styles.contentWrap}>
          {/* Left Text */}
          <View style={styles.leftCol}>
            <Text
              style={[
                styles.badgeText,
                { color: current.badgeColor || (isDark ? "#F2A743" : "#003459") },
              ]}
            >
              {current.badge}
            </Text>

            <Text
              style={[
                styles.headline,
                {
                  color:
                    current.type === "navyCurve" || isDark ? "#FFFFFF" : "#003459",
                },
              ]}
            >
              {current.title}
            </Text>

            <Text
              style={[
                styles.headline,
                {
                  color:
                    current.id === "3"
                      ? "#F2A743"
                      : current.id === "1"
                      ? "#E8792B"
                      : current.type === "navyCurve"
                      ? "#FCEED5"
                      : "#FF5500",
                },
              ]}
            >
              {current.title2}
            </Text>

            <Text
              style={[
                styles.subText,
                {
                  color:
                    current.type === "navyCurve" || isDark
                      ? "rgba(255,255,255,0.75)"
                      : "#4B5563",
                },
              ]}
              numberOfLines={2}
            >
              {current.sub}
            </Text>

            <TouchableOpacity
              style={[styles.ctaButton, { backgroundColor: current.ctaBg }]}
              onPress={() => router.push(current.route as any)}
              activeOpacity={0.85}
            >
              <Text style={[styles.ctaText, { color: current.ctaText }]}>
                {current.cta}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Right Hero Image */}
          <View style={styles.rightCol}>
            <Image
              source={current.image}
              style={styles.heroImg}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* Web Navigation Arrows */}
        <TouchableOpacity
          style={[styles.arrowBtn, styles.leftArrow]}
          onPress={handlePrev}
          activeOpacity={0.8}
        >
          <ChevronLeft size={16} color="#003459" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.arrowBtn, styles.rightArrow]}
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <ChevronRight size={16} color="#003459" />
        </TouchableOpacity>
      </Animated.View>

      {/* Synchronized Web Dot Indicators */}
      <View style={styles.dotsRow}>
        {slides.map((_, idx) => (
          <TouchableOpacity
            key={idx}
            onPress={() => changeSlide(idx)}
            style={[
              styles.dot,
              idx === activeSlide ? styles.activeDot : styles.inactiveDot,
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 6,
    marginBottom: 16,
  },
  bannerBox: {
    width: BANNER_WIDTH,
    height: 200,
    borderRadius: 20,
    overflow: "hidden",
    position: "relative",
    borderWidth: 1,
    borderColor: "rgba(243, 217, 176, 0.6)",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
  },
  organicCurve: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: "60%",
    borderTopRightRadius: 46,
    borderBottomRightRadius: 46,
    zIndex: 1,
  },
  contentWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    zIndex: 10,
  },
  leftCol: {
    flex: 1.25,
    justifyContent: "center",
    paddingRight: 6,
  },
  badgeText: {
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 0.8,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  headline: {
    fontSize: 15.5,
    fontWeight: "900",
    lineHeight: 19,
  },
  subText: {
    fontSize: 10.5,
    lineHeight: 14,
    marginTop: 4,
    marginBottom: 10,
  },
  ctaButton: {
    paddingHorizontal: 14,
    paddingVertical: 6.5,
    borderRadius: 6,
    alignSelf: "flex-start",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  ctaText: {
    fontSize: 11,
    fontWeight: "800",
  },
  rightCol: {
    flex: 0.85,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  heroImg: {
    width: "100%",
    height: "100%",
    maxHeight: 155,
  },
  arrowBtn: {
    position: "absolute",
    top: "50%",
    marginTop: -14,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 30,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  leftArrow: {
    left: 8,
  },
  rightArrow: {
    right: 8,
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
    gap: 6,
  },
  dot: {
    height: 4,
    borderRadius: 2,
  },
  activeDot: {
    width: 20,
    backgroundColor: "#003459",
  },
  inactiveDot: {
    width: 6,
    backgroundColor: "#D1D5DB",
  },
});

