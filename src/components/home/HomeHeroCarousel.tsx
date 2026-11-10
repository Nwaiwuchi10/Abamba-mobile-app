import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { useRouter } from "expo-router";
import { ChevronRight, Zap, Sparkles, ShieldCheck, ArrowRight } from "lucide-react-native";

const { width } = Dimensions.get("window");
const BANNER_WIDTH = width - 32;

export const HomeHeroCarousel = () => {
  const router = useRouter();
  const scrollRef = useRef<any>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const slides = [
    // Slide 1: Original Brand Banner (Warm Cream & Navy)
    {
      id: "1",
      bgColor: "#FCEED5",
      badgeText: "HOT DEALS • VERIFIED",
      badgeColor: "#FF5500",
      tagline: "Discover Africa's",
      taglineHighlight: "Best Marketplace",
      description: "Original gadgets, fresh items & escrow buyer protection.",
      btnText: "Shop Collection",
      btnBg: "#003459",
      btnTextColor: "#FFFFFF",
      image: require("../../../assets/images/abambahero.png"),
      route: "/products",
    },
    // Slide 2: Fashion Showcase Slide
    {
      id: "2",
      bgColor: "#FFF2E2",
      badgeText: "NEW ARRIVALS",
      badgeColor: "#003459",
      tagline: "Trending Styles &",
      taglineHighlight: "Designer Outfits",
      description: "Explore premium fashion, luxury wigs and matching footwear.",
      btnText: "Explore Fashion",
      btnBg: "#FF5500",
      btnTextColor: "#FFFFFF",
      image: require("../../../assets/images/stylishwoman.png"),
      route: "/products?category=Fashion",
    },
    // Slide 3: Luxury Tech Slide (Premium Dark Aesthetic)
    {
      id: "3",
      bgColor: "#0B0C0E",
      badgeText: "PREMIUM TECH",
      badgeColor: "#F2A743",
      tagline: "LUXURY TECH.",
      taglineHighlight: "SMART GADGETS",
      description: "High performance laptops, flagship phones and certified audio.",
      btnText: "Shop Luxury Tech",
      btnBg: "#F2A743",
      btnTextColor: "#0B0C0E",
      image: require("../../../assets/images/abambalaptop.png"),
      route: "/products?category=Electronics",
    },
    // Slide 4: Everything You Need (Navy Curve)
    {
      id: "4",
      bgColor: "#002642",
      badgeText: "0% BUYER RISK",
      badgeColor: "#10B981",
      tagline: "Everything You Need,",
      taglineHighlight: "Delivered To You",
      description: "Fast courier delivery across all 36 states with escrow security.",
      btnText: "Browse All Deals",
      btnBg: "#F7DBA7",
      btnTextColor: "#003459",
      image: require("../../../assets/images/phone.png"),
      route: "/products",
    },
    // Slide 5: Smart Watch / Wearables Special
    {
      id: "5",
      bgColor: "#FFE8BE",
      badgeText: "SMARTFIT SPECIAL",
      badgeColor: "#FF5500",
      tagline: "UP TO 80% OFF",
      taglineHighlight: "Smart Watches",
      description: "Track your health and daily fitness in comfort and style.",
      btnText: "Claim Watch Deal",
      btnBg: "#003459",
      btnTextColor: "#FFFFFF",
      image: require("../../../assets/images/watch.png"),
      route: "/products?category=Accessories",
    },
  ];

  // Auto Advance Interval (matching web banner behavior)
  useEffect(() => {
    const timer = setInterval(() => {
      const nextIndex = (activeIndex + 1) % slides.length;
      scrollRef.current?.scrollTo({
        x: nextIndex * BANNER_WIDTH,
        animated: true,
      });
      setActiveIndex(nextIndex);
    }, 5500);

    return () => clearInterval(timer);
  }, [activeIndex, slides.length]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / BANNER_WIDTH);
    if (index !== activeIndex && index >= 0 && index < slides.length) {
      setActiveIndex(index);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        style={styles.scroll}
      >
        {slides.map((slide) => {
          const isDark = slide.bgColor === "#0B0C0E" || slide.bgColor === "#002642";
          return (
            <View
              key={slide.id}
              style={[
                styles.slide,
                { backgroundColor: slide.bgColor, width: BANNER_WIDTH },
              ]}
            >
              <View style={styles.leftContent}>
                <View style={[styles.badge, { borderColor: slide.badgeColor }]}>
                  <Zap size={10} color={slide.badgeColor} fill={slide.badgeColor} />
                  <Text style={[styles.badgeText, { color: slide.badgeColor }]}>
                    {slide.badgeText}
                  </Text>
                </View>

                <Text
                  style={[
                    styles.tagline,
                    { color: isDark ? "#FFFFFF" : "#003459" },
                  ]}
                >
                  {slide.tagline}
                </Text>
                <Text
                  style={[
                    styles.taglineHighlight,
                    { color: slide.id === "3" ? "#F2A743" : "#FF5500" },
                  ]}
                >
                  {slide.taglineHighlight}
                </Text>

                <Text
                  style={[
                    styles.description,
                    { color: isDark ? "#9CA3AF" : "#4B5563" },
                  ]}
                  numberOfLines={2}
                >
                  {slide.description}
                </Text>

                <TouchableOpacity
                  style={[styles.btn, { backgroundColor: slide.btnBg }]}
                  onPress={() => router.push(slide.route as any)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.btnText, { color: slide.btnTextColor }]}>
                    {slide.btnText}
                  </Text>
                  <ChevronRight size={13} color={slide.btnTextColor} />
                </TouchableOpacity>
              </View>

              <View style={styles.imageWrap}>
                <Image source={slide.image} style={styles.image} resizeMode="contain" />
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Dot Indicators */}
      <View style={styles.dotsRow}>
        {slides.map((_, idx) => (
          <TouchableOpacity
            key={idx}
            onPress={() => {
              scrollRef.current?.scrollTo({
                x: idx * BANNER_WIDTH,
                animated: true,
              });
              setActiveIndex(idx);
            }}
            style={[
              styles.dot,
              idx === activeIndex ? styles.activeDot : styles.inactiveDot,
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
  scroll: {
    borderRadius: 18,
    overflow: "hidden",
  },
  slide: {
    height: 195,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    overflow: "hidden",
  },
  leftContent: {
    flex: 1.25,
    justifyContent: "center",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.85)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: "flex-start",
    gap: 4,
    marginBottom: 6,
    borderWidth: 0.5,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 16,
    fontWeight: "800",
    lineHeight: 20,
  },
  taglineHighlight: {
    fontSize: 16,
    fontWeight: "800",
    lineHeight: 20,
    marginBottom: 4,
  },
  description: {
    fontSize: 10.5,
    lineHeight: 15,
    marginBottom: 10,
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 16,
    alignSelf: "flex-start",
    gap: 2,
  },
  btnText: {
    fontSize: 11,
    fontWeight: "700",
  },
  imageWrap: {
    flex: 0.9,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 6,
  },
  image: {
    width: "100%",
    height: "100%",
    maxHeight: 150,
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
