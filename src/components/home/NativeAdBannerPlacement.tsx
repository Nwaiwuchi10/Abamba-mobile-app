import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from "react-native";
import { Sparkles, ShoppingBag, ExternalLink, ChevronRight, Store } from "lucide-react-native";
import api from "../../services/api";

export const NativeAdBannerPlacement = () => {
  const [ad, setAd] = useState<any>({
    catchphrase: "Certified Escrow Marketplace • Genuine Products Guaranteed",
    merchantName: "Abamba Verified Partner",
    buttonCta: "Shop Now",
    buttonLink: "",
  });

  useEffect(() => {
    const fetchAd = async () => {
      try {
        const res = await api.get("/ads/live-banner");
        if (res?.data?.success && res.data.masterEnabled !== false) {
          const incoming = res.data.ads?.[0] || res.data.ad;
          if (incoming) {
            setAd({
              catchphrase: incoming.catchphrase || incoming.title,
              merchantName: incoming.storeName || incoming.sellerName || "Abamba Sponsored Partner",
              buttonCta: incoming.buttonCta || "Shop Now",
              buttonLink: incoming.buttonLink || "",
              photoUrl: incoming.photoUrl,
            });
          }
        }
      } catch (e) {
        // Safe graceful fallback with verified styling
      }
    };
    fetchAd();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.innerGradient}>
        <View style={styles.contentRow}>
          {/* Logo / Thumbnail */}
          <View style={styles.logoWrap}>
            {ad.photoUrl ? (
              <Image source={{ uri: ad.photoUrl }} style={styles.logoImg} resizeMode="cover" />
            ) : (
              <Store size={22} color="#FFA800" />
            )}
          </View>

          {/* Texts */}
          <View style={styles.textWrap}>
            <View style={styles.tagRow}>
              <View style={styles.sponsorBadge}>
                <Sparkles size={9} color="#111827" />
                <Text style={styles.sponsorText}>SPONSORED PARTNER</Text>
              </View>
              <Text style={styles.merchantText} numberOfLines={1}>
                {ad.merchantName}
              </Text>
            </View>

            <Text style={styles.catchphrase} numberOfLines={2}>
              {ad.catchphrase}
            </Text>
          </View>

          {/* Action button */}
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => {
              if (ad.buttonLink && ad.buttonLink.startsWith("http")) {
                Linking.openURL(ad.buttonLink).catch(() => {});
              }
            }}
          >
            <ShoppingBag size={12} color="#111827" />
            <Text style={styles.actionBtnText}>{ad.buttonCta}</Text>
            <ExternalLink size={10} color="#111827" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 16,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },
  innerGradient: {
    backgroundColor: "#00223B",
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(0, 52, 89, 0.8)",
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  logoImg: {
    width: "100%",
    height: "100%",
  },
  textWrap: {
    flex: 1,
    marginLeft: 10,
    marginRight: 6,
  },
  tagRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  sponsorBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFA800",
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
    gap: 3,
  },
  sponsorText: {
    color: "#111827",
    fontSize: 8,
    fontWeight: "900",
  },
  merchantText: {
    fontSize: 10,
    color: "#D1D5DB",
    fontWeight: "600",
    flex: 1,
  },
  catchphrase: {
    fontSize: 12,
    fontWeight: "800",
    color: "#FFFFFF",
    lineHeight: 16,
  },
  actionBtn: {
    backgroundColor: "#FFA800",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 4,
  },
  actionBtnText: {
    fontSize: 10.5,
    fontWeight: "800",
    color: "#111827",
  },
});

