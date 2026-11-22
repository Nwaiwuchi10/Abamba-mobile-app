import React, { useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  User,
  Package,
  MapPin,
  Heart,
  HelpCircle,
  LogOut,
  ChevronRight,
  Shield,
  LogIn,
  FileText,
} from "lucide-react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAppDispatch, useAppSelector } from "../../store";
import { logout, setActiveMode } from "../../store/slices/authSlice";
import { useResponseModal } from "../../components/common/ResponseModalContext";
import appStorage from "../../services/storage";
import { Store, ArrowRightLeft } from "lucide-react-native";

export default function AccountScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const dispatch = useAppDispatch();
  const { showConfirm, showSuccess } = useResponseModal();

  const user = useAppSelector((state) => state.auth.user as any);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const isApprovedSeller = useAppSelector((state) => state.auth.isApprovedSeller);

  const handleSwitchToSeller = async () => {
    await appStorage.setItem("appActiveMode", "seller");
    dispatch(setActiveMode("seller"));
    router.replace("/seller/dashboard" as any);
  };

  // Handle web-like deep-links e.g. /account?section=terms_and_conditions
  useEffect(() => {
    if (params.section) {
      const section = String(params.section).toLowerCase();
      if (section === "terms_and_conditions" || section === "terms") {
        router.push("/terms" as any);
      } else if (section === "help_center" || section === "help") {
        router.push("/help" as any);
      } else if (section === "orders") {
        router.push("/orders" as any);
      } else if (section === "wishlist") {
        router.push("/wishlist" as any);
      } else if (section === "addresses") {
        router.push("/account/addresses" as any);
      } else if (section === "personal_info" || section === "profile") {
        router.push("/account/profile" as any);
      }
    }
  }, [params.section]);

  const menuSections = [
    {
      title: "My Orders & History",
      items: [
        { title: "Orders", icon: Package, screen: "/orders" },
        { title: "Wishlist", icon: Heart, screen: "/wishlist" },
        { title: "Shipping Addresses", icon: MapPin, screen: "/account/addresses" },
      ],
    },
    {
      title: "Account Settings",
      items: [
        { title: "Profile Information", icon: User, screen: "/account/profile" },
        { title: "Become a Seller / Seller Hub", icon: Shield, screen: "/seller/onboarding" },
      ],
    },
    {
      title: "Customer Support & Legal",
      items: [
        { title: "Help center", icon: HelpCircle, screen: "/help" },
        {
          title: "Terms and conditions",
          icon: FileText,
          screen: "/terms",
          hrefQuery: "?section=terms_and_conditions",
        },
      ],
    },
  ];

  const handleLogout = () => {
    showConfirm(
      "Log Out",
      "Are you sure you want to sign out of your Abamba account?",
      async () => {
        await appStorage.removeItem("token");
        await appStorage.removeItem("userProfile");
        dispatch(logout());
        showSuccess("Signed Out", "You have successfully signed out of your account.");
      },
      undefined,
      "Log Out",
      "Cancel"
    );
  };

  const displayName = user?.firstName
    ? `${user.firstName} ${user.lastName || ""}`.trim()
    : user?.name || "Abamba Valued Shopper";

  const userInitial = displayName.charAt(0).toUpperCase() || "A";

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Account</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Switch to Seller Mode Banner for Approved Sellers */}
        {isAuthenticated && isApprovedSeller && (
          <TouchableOpacity
            style={styles.switchModeCard}
            onPress={handleSwitchToSeller}
            activeOpacity={0.85}
          >
            <View style={styles.switchModeIconWrap}>
              <Store size={22} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.switchModeTitle}>Switch to Merchant Store</Text>
              <Text style={styles.switchModeSub}>Access your products, orders & seller dashboard</Text>
            </View>
            <View style={styles.switchPill}>
              <ArrowRightLeft size={14} color="#003459" />
              <Text style={styles.switchPillText}>Switch</Text>
            </View>
          </TouchableOpacity>
        )}
        {/* Profile Card */}
        <View style={styles.profileCard}>
          {/* User Avatar Circle with Initial matching Web Header */}
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitialText}>{userInitial}</Text>
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{displayName}</Text>
            <Text style={styles.userEmail}>
              {user?.email || (isAuthenticated ? "customer@abamba.com" : "Not signed in")}
            </Text>
            <View style={styles.badgeWrap}>
              <Text style={styles.badgeText}>
                {isAuthenticated ? "Verified Customer" : "Guest Mode"}
              </Text>
            </View>
          </View>
        </View>

        {/* Menu Groups */}
        {menuSections.map((sec, idx) => (
          <View key={idx} style={styles.sectionWrap}>
            <Text style={styles.sectionHeading}>{sec.title}</Text>
            <View style={styles.menuContainer}>
              {sec.items.map((item, itemIdx) => {
                const Icon = item.icon;
                return (
                  <TouchableOpacity
                    key={itemIdx}
                    style={[
                      styles.menuItem,
                      itemIdx !== sec.items.length - 1 && styles.borderBottom,
                    ]}
                    onPress={() => {
                      if (item.screen) {
                        router.push(item.screen as any);
                      }
                    }}
                  >
                    <View style={styles.menuLeft}>
                      <View style={styles.iconCircle}>
                        <Icon size={18} color="#003459" />
                      </View>
                      <Text style={styles.menuLabel}>{item.title}</Text>
                    </View>
                    <ChevronRight size={18} color="#9CA3AF" />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}

        {/* Auth Action Button */}
        {isAuthenticated ? (
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <LogOut size={18} color="#EF4444" />
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.loginBtn}
            onPress={() => router.push("/auth/login" as any)}
          >
            <LogIn size={18} color="#003459" />
            <Text style={styles.loginBtnText}>Sign In / Create Account</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
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
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#003459",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 20,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#003459",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitialText: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "800",
  },
  profileInfo: {
    marginLeft: 14,
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
  },
  userEmail: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },
  badgeWrap: {
    backgroundColor: "#ECFDF5",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 6,
  },
  badgeText: {
    color: "#10B981",
    fontSize: 10,
    fontWeight: "700",
  },
  sectionWrap: {
    marginBottom: 18,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6B7280",
    textTransform: "uppercase",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  menuContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  menuLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F3F9FB",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  menuLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1F2937",
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FEE2E2",
    marginTop: 10,
    gap: 8,
  },
  logoutText: {
    color: "#EF4444",
    fontSize: 14,
    fontWeight: "700",
  },
  loginBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#003459",
    marginTop: 10,
    gap: 8,
  },
  loginBtnText: {
    color: "#003459",
    fontSize: 14,
    fontWeight: "700",
  },
  switchModeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#003459",
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    gap: 12,
  },
  switchModeIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  switchModeTitle: {
    fontSize: 14.5,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  switchModeSub: {
    fontSize: 11.5,
    color: "#BAE6FD",
    marginTop: 2,
  },
  switchPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  switchPillText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#003459",
  },
});
