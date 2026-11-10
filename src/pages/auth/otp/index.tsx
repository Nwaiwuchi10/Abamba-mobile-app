import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, CheckCircle2 } from "lucide-react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { authService } from "../../../services";
import appStorage from "../../../services/storage";
import { useAppDispatch } from "../../../store";
import { setCredentials } from "../../../store/slices/authSlice";

export default function OtpConfirmationScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { email, redirect } = useLocalSearchParams();
  const dispatch = useAppDispatch();

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleVerify = async () => {
    if (!otp || otp.length < 4) {
      Alert.alert("Error", "Please enter a valid OTP code.");
      return;
    }

    try {
      setLoading(true);
      const res = await authService.verifyOtp({ email: (email as string) || "", otp });
      const data = res?.data?.data || res?.data;
      if (data?.token) {
        await appStorage.setItem("token", data.token);
        dispatch(
          setCredentials({
            user: data.user || { id: "u1", email: (email as string) || "" },
            token: data.token,
          })
        );
      }
      Alert.alert("Verified", "Your verification was successful!");
      const targetRoute = (redirect as string) || "/";
      router.replace(targetRoute as any);
    } catch (err: any) {
      const msg = err.response?.data?.message || "Invalid OTP code entered.";
      Alert.alert("Verification Failed", msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      setResending(true);
      await authService.resendOtp({ email: (email as string) || "" });
      Alert.alert("Sent", "A new OTP code has been delivered to your email.");
    } catch (err: any) {
      Alert.alert("Resend Failed", err.response?.data?.message || "Failed to resend code.");
    } finally {
      setResending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      <View style={styles.content}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color="#1F2937" />
        </TouchableOpacity>

        <View style={styles.iconContainer}>
          <CheckCircle2 size={44} color="#003459" />
        </View>

        <Text style={styles.title}>Enter OTP Code</Text>
        <Text style={styles.subtitle}>
          We sent a verification code to{"\n"}
          <Text style={styles.emailHighlight}>{email || "your email"}</Text>
        </Text>

        <TextInput
          style={styles.otpInput}
          placeholder="000000"
          placeholderTextColor="#9CA3AF"
          keyboardType="number-pad"
          maxLength={6}
          value={otp}
          onChangeText={setOtp}
          autoFocus
        />

        <TouchableOpacity
          style={[styles.verifyBtn, loading && styles.btnDisabled]}
          onPress={handleVerify}
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
          <TouchableOpacity onPress={handleResend} disabled={resending}>
            <Text style={styles.resendLink}>
              {resending ? "Sending..." : "Resend OTP"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
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

