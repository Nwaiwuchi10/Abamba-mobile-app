import React, { useEffect } from "react";
import { useRouter } from "expo-router";
import HomePage from "../pages/home";
import { useAppSelector } from "../store";

export default function IndexRoute() {
  const router = useRouter();
  const activeMode = useAppSelector((state) => state.auth.activeMode);
  const isApprovedSeller = useAppSelector((state) => state.auth.isApprovedSeller);

  useEffect(() => {
    // If user's persisted preference is seller mode and they are an approved seller, navigate to seller dashboard
    if (activeMode === "seller" && isApprovedSeller) {
      router.replace("/seller/dashboard" as any);
    }
  }, [activeMode, isApprovedSeller, router]);

  return <HomePage />;
}
