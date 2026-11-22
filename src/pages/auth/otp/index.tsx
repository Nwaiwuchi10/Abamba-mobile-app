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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, CheckCircle2 } from "lucide-react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { authService } from "../../../services";
import appStorage from "../../../services/storage";
import { useAppDispatch } from "../../../store";
import { setCredentials } from "../../../store/slices/authSlice";
import { useResponseModal } from "../../../components/common/ResponseModalContext";
import { KeyboardAwareScrollView } from "../../../components/common/KeyboardAwareScrollView";

export default function OtpConfirmationScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const dispatch = useAppDispatch();
  const { showError, showSuccess, showInfo } = useResponseModal();

  const [email, setEmail] = useState((params.email as string) || "");
  const redirect = (params.redirect as string) || "/";

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // If email was not passed directly in params, retrieve from stored userEmail
  useEffect(() => {
    if (!email) {
      appStorage.getItem("userEmail").then((stored) => {
        if (stored) setEmail(stored);
      });
    }
  }, [email]);

  // Resend cooldown timer (like web)
  useEffect(() => {
    let timer: any;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleVerify = async (codeToVerify?: string) => {
    const code = codeToVerify || otp;
    if (!code || code.length < 4) {
      showError("Invalid Code", "Please enter a valid 6-digit OTP code.");
      return;
    }

    try {
      setLoading(true);
      // Matches web authApi.verifyOtp({ email, otpCode: code })
      const res = await authService.verifyOtp({
        email: email.trim().toLowerCase(),
        otpCode: code.trim(),
      });
      const data = res?.data?.data || res?.data;

      if (data?.token) {
        // Store session token permanently until expired/logged out
        const userObj = data.user || {
          id: data.user?._id || data.user?.id || "u_auth",
          email: email.trim().toLowerCase(),
          firstName: data.user?.firstName || data.user?.name,
        };
        await appStorage.setItem("token", data.token);
        await appStorage.setItem("userProfile", JSON.stringify(userObj));
        await appStorage.removeItem("guestToken");
        await appStorage.removeItem("userSignupPending");

        dispatch(
          setCredentials({
            user: userObj,
            token: data.token,
          })
        );
      }

      showSuccess("Account Verified", "Your account verification was successful!", () => {
        router.replace(redirect as any);
      });
    } catch (err: any) {
      const msg = err.response?.data?.message || "Invalid OTP code entered. Please try again.";
      showError("Verification Failed", msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    try {
      setResending(true);
      await authService.resendOtp({ email: email.trim().toLowerCase() });
      setCooldown(180); // 3 minutes cooldown matching web
      showSuccess("Verification Code Sent", "OTP sent successfully, Please check your email.");
    } catch (err: any) {
      showError("Resend Failed", err.response?.data?.message || "Failed to resend code.");
    } finally {
      setResending(false);
    }
  };

  const formatCooldown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <KeyboardAwareScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color="#1F2937" />
        </TouchableOpacity>

        <View style={styles.iconContainer}>
          <CheckCircle2 size={44} color="#003459" />
        </View>

        <Text style={styles.title}>Enter OTP Code</Text>
        <Text style={styles.subtitle}>
          We sent a 6-digit verification code to{"\n"}
          <Text style={styles.emailHighlight}>{email || "your email"}</Text>
        </Text>

        <TextInput
          style={styles.otpInput}
          placeholder="000000"
          placeholderTextColor="#9CA3AF"
          keyboardType="number-pad"
          maxLength={6}
          value={otp}
          onChangeText={(val) => {
            setOtp(val);
            if (val.length === 6) {
              handleVerify(val);
            }
          }}
          autoFocus
        />

        <TouchableOpacity
          style={[styles.verifyBtn, loading && styles.btnDisabled]}
          onPress={() => handleVerify()}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.verifyBtnText}>Verify & Proceed</Text>
          )}
        </TouchableOpacity>

        <View style={styles.resendRow}>
          <Text style={styles.resendText}>Didn't get the code? </Text>
          <TouchableOpacity
            onPress={handleResend}
            disabled={resending || cooldown > 0}
          >
            <Text
              style={[
                styles.resendLink,
                (resending || cooldown > 0) && { color: "#9CA3AF" },
              ]}
            >
              {resending
                ? "Sending..."
                : cooldown > 0
                ? `Resend in (${formatCooldown(cooldown)})`
                : "Resend OTP"}
            </Text>
          </TouchableOpacity>
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
  content: {
    paddingHorizontal: 24,
    alignItems: "center",
  },
  backBtn: {
    alignSelf: "flex-start",
    paddingVertical: 12,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(0, 52, 89, 0.08)",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#003459",
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
  emailHighlight: {
    fontWeight: "700",
    color: "#111827",
  },
  otpInput: {
    width: "80%",
    height: 55,
    borderWidth: 2,
    borderColor: "#003459",
    borderRadius: 12,
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 8,
    marginTop: 30,
    color: "#003459",
  },
  verifyBtn: {
    backgroundColor: "#003459",
    width: "100%",
    height: 48,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 30,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  verifyBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  resendRow: {
    flexDirection: "row",
    marginTop: 20,
  },
  resendText: {
    fontSize: 13,
    color: "#6B7280",
  },
  resendLink: {
    fontSize: 13,
    fontWeight: "700",
    color: "#003459",
  },
});
