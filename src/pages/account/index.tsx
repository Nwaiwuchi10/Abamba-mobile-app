import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
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
  CreditCard,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { useAppDispatch, useAppSelector } from "../../store";
import { logout } from "../../store/slices/authSlice";

export default function AccountScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const dispatch = useAppDispatch();

  const user = useAppSelector((state) => state.auth.user);

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
        { title: "Become a Seller / Seller Hub", icon: Shield, screen: "/seller/dashboard" },
      ],
    },
    {
      title: "Support & Legal",
      items: [
        { title: "Help Center / FAQ", icon: HelpCircle, screen: "/help" },
      ],
    },
  ];

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to log out of Abamba?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: () => {
          dispatch(logout());
          Alert.alert("Logged out", "You have successfully signed out.");
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Account</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <Image
            source={require("../../../assets/images/user.png")}
            style={styles.avatar}
            resizeMode="cover"
          />
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>
              {user?.firstName ? `${user.firstName} ${user.lastName || ""}` : "Abamba Valued Shopper"}
            </Text>
            <Text style={styles.userEmail}>
              {user?.email || "customer@abamba.com"}
            </Text>
            <TouchableOpacity style={styles.badgeWrap}>
              <Text style={styles.badgeText}>Verified Customer</Text>
            </TouchableOpacity>
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

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <LogOut size={18} color="#EF4444" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <View style={{ height: 120 }} />
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
    fontWeight: "700",
    color: "#111827",
  },
  scrollContent: {
    padding: 16,
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
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#F3F4F6",
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
});

