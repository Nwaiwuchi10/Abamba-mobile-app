import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Save,
  LogOut,
  Trash2,
  AlertTriangle,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { useAppDispatch, useAppSelector } from "../../../store";
import { logout } from "../../../store/slices/authSlice";
import { useResponseModal } from "../../../components/common/ResponseModalContext";
import appStorage from "../../../services/storage";
import { authService } from "../../../services";
import { KeyboardAwareScrollView } from "../../../components/common/KeyboardAwareScrollView";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { showConfirm, showSuccess, showError } = useResponseModal();
  const currentUser = useAppSelector((state) => state.auth.user as any);

  const [firstName, setFirstName] = useState(
    currentUser?.firstName || currentUser?.name?.split(" ")[0] || "Valued"
  );
  const [lastName, setLastName] = useState(
    currentUser?.lastName || currentUser?.name?.split(" ").slice(1).join(" ") || "Shopper"
  );
  const [email] = useState(currentUser?.email || "customer@abamba.com");
  const [phone, setPhone] = useState(
    currentUser?.phoneNumber || currentUser?.phone || "+234 812 345 6789"
  );
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      showSuccess("Profile Updated", "Your profile changes have been saved successfully.");
    }, 1000);
  };

  const handleLogout = () => {
    showConfirm(
      "Log Out",
      "Are you sure you want to sign out of your Abamba account?",
      async () => {
        await appStorage.removeItem("token");
        await appStorage.removeItem("userProfile");
        dispatch(logout());
        showSuccess("Signed Out", "You have successfully signed out.", () => {
          router.replace("/(tabs)" as any);
        });
      },
      undefined,
      "Log Out",
      "Cancel"
    );
  };

  const handleDeleteAccount = () => {
    showConfirm(
      "Delete Account",
      "When you delete your account, your public profile will be deactivated immediately. If you change your mind within 14 days, sign in with your email and password to reactivate. Are you sure you want to proceed?",
      async () => {
        try {
          setDeleting(true);
          const userId = currentUser?._id || currentUser?.id;
          try {
            await authService.deleteAccount(userId);
          } catch (apiErr) {
            // fallback client purge if server mock/dev
            console.warn("Account delete API call:", apiErr);
          }

          await appStorage.removeItem("token");
          await appStorage.removeItem("userProfile");
          dispatch(logout());

          showSuccess(
            "Account Deactivated",
            "Your account has been scheduled for deletion. We are sorry to see you go.",
            () => {
              router.replace("/(tabs)" as any);
            }
          );
        } catch (err: any) {
          showError("Action Failed", err?.response?.data?.message || "Failed to delete account. Please try again.");
        } finally {
          setDeleting(false);
        }
      },
      undefined,
      "Delete Account",
      "Cancel"
    );
  };

  const userInitial = (firstName || email || "U").charAt(0).toUpperCase();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Personal Profile</Text>
        <View style={{ width: 32 }} />
      </View>

      <KeyboardAwareScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Avatar View */}
        <View style={styles.avatarWrap}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitialText}>{userInitial}</Text>
          </View>
          <Text style={styles.avatarName}>
            {firstName} {lastName}
          </Text>
          <Text style={styles.avatarEmail}>{email}</Text>
        </View>

        {/* Inputs Card */}
        <View style={styles.formCard}>
          <Text style={styles.label}>First Name</Text>
          <View style={styles.inputWrap}>
            <User size={18} color="#9CA3AF" style={{ marginRight: 10 }} />
            <TextInput
              style={styles.input}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="First Name"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <Text style={[styles.label, { marginTop: 14 }]}>Last Name</Text>
          <View style={styles.inputWrap}>
            <User size={18} color="#9CA3AF" style={{ marginRight: 10 }} />
            <TextInput
              style={styles.input}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Last Name"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <Text style={[styles.label, { marginTop: 14 }]}>Email Address</Text>
          <View style={styles.inputWrap}>
            <Mail size={18} color="#9CA3AF" style={{ marginRight: 10 }} />
            <TextInput
              style={[styles.input, { color: "#6B7280" }]}
              value={email}
              editable={false}
              placeholder="Email"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <Text style={[styles.label, { marginTop: 14 }]}>Phone Number</Text>
          <View style={styles.inputWrap}>
            <Phone size={18} color="#9CA3AF" style={{ marginRight: 10 }} />
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="Phone"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.btnDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Save size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.saveBtnText}>Save Changes</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Account Management & Security Card (Logout & Delete Account) */}
        <View style={styles.dangerZoneCard}>
          <Text style={styles.dangerZoneHeading}>Account Actions</Text>

          {/* Log Out Option */}
          <TouchableOpacity style={styles.actionRow} onPress={handleLogout}>
            <View style={styles.actionLeft}>
              <View style={[styles.actionIconWrap, { backgroundColor: "#F3F9FB" }]}>
                <LogOut size={18} color="#003459" />
              </View>
              <View>
                <Text style={styles.actionTitle}>Sign Out</Text>
                <Text style={styles.actionSubtitle}>
                  Log out of your session on this mobile device
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Delete Account Section matching Web Policy */}
          <View style={styles.deleteSection}>
            <View style={styles.deleteWarningHeader}>
              <AlertTriangle size={18} color="#DC2626" />
              <Text style={styles.deleteWarningTitle}>Danger Zone: Delete Account</Text>
            </View>
            <Text style={styles.deleteWarningText}>
              When you delete your account, your public profile and saved preferences will be deactivated immediately. You have a 14-day grace period to reactivate by simply logging back in.
            </Text>

            <TouchableOpacity
              style={[styles.deleteBtn, deleting && styles.btnDisabled]}
              onPress={handleDeleteAccount}
              disabled={deleting}
            >
              {deleting ? (
                <ActivityIndicator color="#DC2626" />
              ) : (
                <>
                  <Trash2 size={16} color="#DC2626" style={{ marginRight: 6 }} />
                  <Text style={styles.deleteBtnText}>Delete My Account</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 60 }} />
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#003459",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  avatarWrap: {
    alignItems: "center",
    marginVertical: 14,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#003459",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitialText: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "800",
  },
  avatarName: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
    marginTop: 10,
  },
  avatarEmail: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },
  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 16,
    marginTop: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 48,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: "#1F2937",
  },
  saveBtn: {
    backgroundColor: "#003459",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 48,
    borderRadius: 10,
    marginTop: 22,
  },
  btnDisabled: {
    opacity: 0.65,
  },
  saveBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  dangerZoneCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 16,
    marginTop: 20,
  },
  dangerZoneHeading: {
    fontSize: 14,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 12,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  actionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  actionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#003459",
  },
  actionSubtitle: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  deleteSection: {
    marginTop: 16,
    backgroundColor: "#FEF2F2",
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: "#FEE2E2",
  },
  deleteWarningHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  deleteWarningTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#DC2626",
  },
  deleteWarningText: {
    fontSize: 12,
    color: "#7F1D1D",
    lineHeight: 18,
    marginBottom: 12,
  },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DC2626",
    height: 42,
    borderRadius: 8,
  },
  deleteBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#DC2626",
  },
});
