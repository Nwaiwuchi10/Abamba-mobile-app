import React from "react";
import { usePathname } from "expo-router";
import { useAppSelector } from "../../store";
import { BottomTabBar } from "./BottomTabBar";
import { SellerBottomTabBar } from "./SellerBottomTabBar";

export const NavigationTabBar = () => {
  const pathname = usePathname();
  const activeMode = useAppSelector((state) => state.auth.activeMode);

  // Determine if current screen is in seller flow
  const isSellerRoute =
    pathname.startsWith("/seller") && pathname !== "/seller/onboarding";

  // If in seller route or user has switched to seller mode
  if (isSellerRoute || activeMode === "seller") {
    // If user is filling onboarding, don't show tabs
    if (pathname === "/seller/onboarding") {
      return null;
    }
    return <SellerBottomTabBar />;
  }

  // Hide buyer tabs on full-screen modals like checkout
  if (pathname.startsWith("/cart/checkout")) {
    return null;
  }

  return <BottomTabBar />;
};

export default NavigationTabBar;
