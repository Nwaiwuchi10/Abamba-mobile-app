import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Wallet,
  Settings,
} from "lucide-react-native";
import { useRouter, usePathname } from "expo-router";

export const SellerBottomTabBar = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();

  const tabs = [
    { name: "Dashboard", route: "/seller/dashboard" as const, icon: LayoutDashboard },
    { name: "Orders", route: "/seller/orders" as const, icon: ShoppingBag },
    { name: "Inventory", route: "/seller/inventory" as const, icon: Package },
    { name: "Wallet", route: "/seller/wallet" as const, icon: Wallet },
    { name: "Settings", route: "/seller/settings" as const, icon: Settings },
  ];

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: Math.max(insets.bottom, 8),
          height: 62 + Math.max(insets.bottom, 8),
        },
      ]}
    >
      <View style={styles.tabRow}>
        {tabs.map((tab) => {
          const isActive = pathname === tab.route;
          const Icon = tab.icon;

          return (
            <TouchableOpacity
              key={tab.name}
              style={styles.tabItem}
              activeOpacity={0.7}
              onPress={() => {
                if (pathname !== tab.route) {
                  router.push(tab.route as any);
                }
              }}
            >
              <View
                style={[
                  styles.iconPill,
                  isActive && styles.activeIconPill,
                ]}
              >
                <View style={styles.iconWrapper}>
                  <Icon
                    size={22}
                    color={isActive ? "#FF5500" : "#64748B"}
                    strokeWidth={isActive ? 2.4 : 1.9}
                  />
                </View>
              </View>
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: isActive ? "#FF5500" : "#64748B",
                    fontWeight: isActive ? "800" : "500",
                  },
                ]}
              >
                {tab.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    elevation: 16,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    zIndex: 999,
  },
  tabRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingTop: 6,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  iconPill: {
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  activeIconPill: {
    backgroundColor: "rgba(255, 85, 0, 0.1)",
  },
  iconWrapper: {
    position: "relative",
    width: 26,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  tabLabel: {
    fontSize: 10.5,
    marginTop: 3,
    letterSpacing: -0.2,
  },
});

export default SellerBottomTabBar;
