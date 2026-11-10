import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Home,
  LayoutGrid,
  ShoppingBag,
  Package,
  UserRound,
} from "lucide-react-native";
import { useRouter, usePathname } from "expo-router";
import { useAppSelector, RootState } from "../../store";

export const BottomTabBar = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();
  const cartTotal = useAppSelector((state: RootState) => state.cart.totalQuantity);

  const tabs = [
    { name: "Home", route: "/" as const, icon: Home },
    { name: "Products", route: "/products" as const, icon: LayoutGrid },
    { name: "Cart", route: "/cart" as const, icon: ShoppingBag, badge: cartTotal },
    { name: "Orders", route: "/orders" as const, icon: Package },
    { name: "Account", route: "/account" as const, icon: UserRound },
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
                    color={isActive ? "#003459" : "#64748B"}
                    strokeWidth={isActive ? 2.4 : 1.9}
                    fill={
                      isActive && (tab.name === "Home" || tab.name === "Wishlist")
                        ? "rgba(0, 52, 89, 0.15)"
                        : "none"
                    }
                  />
                  {!!tab.badge && tab.badge > 0 && (
                    <View style={styles.badgeContainer}>
                      <Text style={styles.badgeText}>
                        {tab.badge > 99 ? "99+" : tab.badge}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: isActive ? "#003459" : "#64748B",
                    fontWeight: isActive ? "700" : "500",
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
    borderTopColor: "#F1F5F9",
    elevation: 16,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
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
    backgroundColor: "rgba(0, 52, 89, 0.08)",
  },
  iconWrapper: {
    position: "relative",
    width: 26,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeContainer: {
    position: "absolute",
    top: -5,
    right: -10,
    backgroundColor: "#003459",
    borderRadius: 9,
    minWidth: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "700",
  },
  tabLabel: {
    fontSize: 10.5,
    marginTop: 3,
    letterSpacing: -0.2,
  },
});
