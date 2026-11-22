import React, { useEffect } from "react";
import { useAppDispatch } from "../../store";
import { setCredentials, logout, setActiveMode, setIsApprovedSeller, AppMode } from "../../store/slices/authSlice";
import appStorage from "../../services/storage";
import { authService, sellerService } from "../../services";

/**
 * AuthSessionBootstrap
 * Mounts at root to keep user logged in permanently:
 * 1. Immediately restores saved session (token & cached user profile) from persistent storage.
 * 2. Restores saved activeMode ("buyer" | "seller") from persistent storage so app reopens in the exact mode.
 * 3. Checks seller profile for approved status.
 * 4. Background refreshes `/users/me` to ensure user data is current.
 * 5. Keeps user logged in indefinitely across app restarts, reloads, and backgrounding.
 */
export const AuthSessionBootstrap: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    let isMounted = true;

    const bootstrapAuth = async () => {
      try {
        // 0. Hydrate saved activeMode preference ("buyer" or "seller")
        const savedMode = (await appStorage.getItem("appActiveMode")) as AppMode | null;
        if (savedMode && (savedMode === "buyer" || savedMode === "seller") && isMounted) {
          dispatch(setActiveMode(savedMode));
        }

        const token = await appStorage.getItem("token");
        if (!token) return;

        // 1. Immediately hydrate from stored user cache for 0ms lag
        const cachedUserStr = await appStorage.getItem("userProfile");
        if (cachedUserStr && isMounted) {
          try {
            const cachedUser = JSON.parse(cachedUserStr);
            dispatch(setCredentials({ user: cachedUser, token }));
            if (cachedUser?.business?.approved === true || cachedUser?.role === "seller") {
              dispatch(setIsApprovedSeller(true));
            }
          } catch {
            // ignore JSON parse error
          }
        }

        // 2. Fetch fresh user profile from backend with graceful error handling
        try {
          const res = await authService.getProfile();
          const userData = res?.data?.data || res?.data;

          if (userData && isMounted) {
            await appStorage.setItem("userProfile", JSON.stringify(userData));
            dispatch(
              setCredentials({
                user: userData,
                token,
              })
            );
          }
        } catch (profileErr: any) {
          const status = profileErr?.response?.status;
          if (status === 401 || status === 403 || status === 404) {
            console.warn("AuthSessionBootstrap: Invalid session detected. Clearing local tokens.");
            await appStorage.removeItem("token");
            await appStorage.removeItem("userProfile");
            if (isMounted) {
              dispatch(logout());
            }
            return;
          }
        }

        // 3. Check seller profile to determine if approved
        try {
          const sellerRes = await sellerService.getProfile();
          const sellerData = sellerRes?.data?.data || sellerRes?.data;
          if (sellerData?.business?.approved === true || sellerData?.role === "seller") {
            if (isMounted) {
              dispatch(setIsApprovedSeller(true));
            }
          }
        } catch {}
      } catch (error: any) {
        console.warn("AuthSessionBootstrap error:", error?.message || error);
      }
    };

    bootstrapAuth();

    return () => {
      isMounted = false;
    };
  }, [dispatch]);

  return <>{children}</>;
};

export default AuthSessionBootstrap;
