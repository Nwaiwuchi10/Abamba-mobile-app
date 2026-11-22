import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Eye, EyeOff, ArrowLeft, Mail, Lock } from "lucide-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import appStorage from "../../../services/storage";
import { authService } from "../../../services";
import { useAppDispatch } from "../../../store";
import { setCredentials, logout } from "../../../store/slices/authSlice";
import { useResponseModal } from "../../../components/common/ResponseModalContext";
import { KeyboardAwareScrollView } from "../../../components/common/KeyboardAwareScrollView";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const dispatch = useAppDispatch();
  const { showError, showSuccess, showInfo } = useResponseModal();

  const redirectUrl = (params.redirect as string) || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  // Check if user is already logged in with an active valid token (like web useEffect session check)
  useEffect(() => {
    const verifyExistingSession = async () => {
      try {
        const token = await appStorage.getItem("token");
        if (token) {
          // Attempt to validate token with /users/me
          const res = await authService.getProfile();
          const user = res?.data?.data || res?.data;
          if (user) {
            dispatch(setCredentials({ user, token }));
            router.replace(redirectUrl as any);
            return;
          }
        }
      } catch (err: any) {
        if (err?.response?.status === 401 || err?.response?.status === 403) {
          // Expired session - remove stale token
          console.log("Token expired or unauthorized. Cleared stale token.");
          await appStorage.removeItem("token");
          dispatch(logout());
        }
      } finally {
        setCheckingSession(false);
      }
    };

    verifyExistingSession();
  }, []);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      showError("Missing Information", "Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);
      const res = await authService.login({
        email: email.trim().toLowerCase(),
        password,
      });
      const data = res.data?.data || res.data;

      // Save email for OTP and session persistence
      await appStorage.setItem("userEmail", email.trim().toLowerCase());

      if (data?.token) {
        // Immediate token returned
        const userObj = data.user || { id: "u_auth", email: email.trim().toLowerCase() };
        await appStorage.setItem("token", data.token);
        await appStorage.setItem("userProfile", JSON.stringify(userObj));
        dispatch(
          setCredentials({
            user: userObj,
            token: data.token,
          })
        );
        showSuccess("Welcome Back", "You have successfully signed in to Abamba!", () => {
          router.replace(redirectUrl as any);
        });
      } else {
        // OTP verification step required (Standard Abamba 2-step flow)
        showSuccess(
          "Verification Code Sent",
          "OTP sent successfully, Please check your email.",
          () => {
            router.push({
              pathname: "/auth/otp" as any,
              params: { email: email.trim().toLowerCase(), redirect: redirectUrl },
            });
          }
        );
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || "Invalid email or password. Please try again.";
      showError("Authentication Failed", msg);
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#003459" />
        <Text style={styles.sessionCheckingText}>Checking session...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <KeyboardAwareScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color="#1F2937" />
        </TouchableOpacity>

        <View style={styles.header}>
          <Image
            source={require("../../../../assets/logos/primary-full-logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to continue shopping on Abamba</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Email Address</Text>
          <View style={styles.inputContainer}>
            <Mail size={18} color="#9CA3AF" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="e.g. user@example.com"
              placeholderTextColor="#9CA3AF"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <Text style={[styles.label, { marginTop: 16 }]}>Password</Text>
          <View style={styles.inputContainer}>
            <Lock size={18} color="#9CA3AF" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#9CA3AF"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
              {showPassword ? <EyeOff size={18} color="#6B7280" /> : <Eye size={18} color="#6B7280" />}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.forgotBtn}
            onPress={() => router.push("/auth/forgot-password" as any)}
          >
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.loginBtn, loading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.loginBtnText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/auth/signup" as any,
                  params: { redirect: redirectUrl },
                })
              }
            >
              <Text style={styles.signupLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
  },
  sessionCheckingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  backBtn: {
    paddingVertical: 12,
  },
  header: {
    alignItems: "center",
    marginTop: 10,
    marginBottom: 24,
  },
  logo: {
    width: 150,
    height: 44,
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#003459",
  },
  subtitle: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 6,
    textAlign: "center",
  },
  form: {
    width: "100%",
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: "#1F2937",
  },
  eyeBtn: {
    padding: 6,
  },
  forgotBtn: {
    alignSelf: "flex-end",
    marginTop: 10,
  },
  forgotText: {
    fontSize: 13,
    color: "#003459",
    fontWeight: "600",
  },
  loginBtn: {
    backgroundColor: "#003459",
    height: 48,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  loginBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  footerText: {
    fontSize: 13,
    color: "#6B7280",
  },
  signupLink: {
    fontSize: 13,
    fontWeight: "700",
    color: "#003459",
  },
});
