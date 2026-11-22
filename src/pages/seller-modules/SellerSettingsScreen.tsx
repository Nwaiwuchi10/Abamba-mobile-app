import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Modal,
  Switch,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ArrowLeft,
  User,
  Lock,
  Store,
  CreditCard,
  Bell,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ChevronRight,
  ShieldCheck,
  Send,
  X,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { sellerService } from "../../services";
import { useResponseModal } from "../../components/common/ResponseModalContext";

type SettingsTab = "user_info" | "password" | "business_info" | "payout" | "notifications";

export default function SellerSettingsModuleScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { showSuccess, showError, showWarning } = useResponseModal();

  const [activeTab, setActiveTab] = useState<SettingsTab>("user_info");
  const [loading, setLoading] = useState(true);
  const [sellerData, setSellerData] = useState<any>(null);

  // Form states
  // 1. Password state
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // 2. Bank Payout state
  const [bankList, setBankList] = useState<any[]>([]);
  const [selectedBank, setSelectedBank] = useState<any>(null);
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [resolvingAccount, setResolvingAccount] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [updatingBank, setUpdatingBank] = useState(false);
  const [bankSelectModal, setBankSelectModal] = useState(false);
  const [bankSearch, setBankSearch] = useState("");

  // 3. Notifications state
  const [orderNotifs, setOrderNotifs] = useState(true);
  const [statusNotifs, setStatusNotifs] = useState(true);
  const [deliveryNotifs, setDeliveryNotifs] = useState(true);
  const [emailNotifs, setEmailNotifs] = useState(true);

  // Fetch initial profile
  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const [profileRes, banksRes] = await Promise.allSettled([
        sellerService.getProfile(),
        sellerService.getBankList(),
      ]);

      if (profileRes.status === "fulfilled") {
        const data = profileRes.value?.data?.data || profileRes.value?.data;
        setSellerData(data);
        if (data?.bank) {
          setSelectedBank({
            name: data.bank.bankName,
            code: data.bank.bankCode,
          });
          setAccountNumber(data.bank.accountNumber || "");
          setAccountName(data.bank.accountName || "");
        }
      }

      if (banksRes.status === "fulfilled") {
        const rawBanks =
          banksRes.value?.data?.data ||
          banksRes.value?.data?.banks ||
          banksRes.value?.data ||
          [];
        setBankList(Array.isArray(rawBanks) ? rawBanks : []);
      }
    } catch (err: any) {
      console.warn("Error fetching seller settings data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Handle Account Name Resolution
  useEffect(() => {
    if (accountNumber.length === 10 && selectedBank?.code) {
      const resolve = async () => {
        try {
          setResolvingAccount(true);
          const res = await sellerService.resolveBankAccount({
            accountNumber,
            bankCode: selectedBank.code,
          });
          const resolvedName =
            res?.data?.data?.account_name ||
            res?.data?.account_name ||
            res?.data?.data?.accountName ||
            "";
          if (resolvedName) {
            setAccountName(resolvedName);
          }
        } catch (err) {
          console.warn("Could not auto-resolve bank account:", err);
        } finally {
          setResolvingAccount(false);
        }
      };
      resolve();
    }
  }, [accountNumber, selectedBank]);

  // Password Submit
  const handleUpdatePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      showWarning("Incomplete Fields", "Please complete all password fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      showError("Mismatch", "New password and confirmation password do not match.");
      return;
    }
    try {
      setUpdatingPassword(true);
      await sellerService.updatePassword({
        oldPassword,
        newPassword,
        confirmPassword,
      });
      showSuccess("Password Updated", "Your seller security password was updated successfully.");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      showError("Update Failed", err?.response?.data?.message || "Failed to update password.");
    } finally {
      setUpdatingPassword(false);
    }
  };

  // Payout Update - Step 1: Send OTP
  const handleInitiateBankUpdate = async () => {
    if (!selectedBank?.code || !accountNumber || !accountName) {
      showWarning("Missing Details", "Please select a bank and enter a valid account number.");
      return;
    }
    const email = sellerData?.email;
    if (!email) {
      showError("Missing Email", "Seller email is required to verify payout updates.");
      return;
    }
    try {
      setSendingOtp(true);
      await sellerService.sendBankOtp(email);
      showSuccess("Verification Code Sent", `A 6-digit confirmation OTP was sent to ${email}.`);
      setOtpModalVisible(true);
    } catch (err: any) {
      showError("OTP Failed", err?.response?.data?.message || "Failed to send verification code.");
    } finally {
      setSendingOtp(false);
    }
  };

  // Payout Update - Step 2: Verify OTP and save
  const handleConfirmBankUpdate = async () => {
    if (otpCode.length < 4) {
      showWarning("Invalid OTP", "Please enter the verification OTP code.");
      return;
    }
    try {
      setUpdatingBank(true);
      await sellerService.updateBankDetails({
        bank: {
          bankName: selectedBank.name,
          bankCode: selectedBank.code,
          accountNumber,
          accountName,
        },
        otp: otpCode,
      });
      showSuccess("Payout Settings Saved", "Your payout destination bank account was updated.");
      setOtpModalVisible(false);
      setOtpCode("");
      await fetchProfile();
    } catch (err: any) {
      showError("Verification Failed", err?.response?.data?.message || "Invalid OTP code.");
    } finally {
      setUpdatingBank(false);
    }
  };

  const filteredBanks = bankList.filter((b) =>
    (b.name || "").toLowerCase().includes(bankSearch.toLowerCase())
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Seller Store Settings</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Tabs Row */}
      <View style={styles.tabsWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
          {[
            { id: "user_info", label: "User Info", icon: User },
            { id: "business_info", label: "Business Details", icon: Store },
            { id: "payout", label: "Payout Bank", icon: CreditCard },
            { id: "password", label: "Password", icon: Lock },
            { id: "notifications", label: "Notifications", icon: Bell },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tabChip, isActive && styles.tabChipActive]}
                onPress={() => setActiveTab(tab.id as SettingsTab)}
              >
                <Icon size={14} color={isActive ? "#FFFFFF" : "#6B7280"} />
                <Text style={[styles.tabChipText, isActive && styles.tabChipTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#003459" />
          <Text style={styles.loadingText}>Loading settings...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* TAB 1: USER INFO */}
          {activeTab === "user_info" && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Owner / User Information</Text>
              <Text style={styles.cardSub}>
                Personal contact details for account security and merchant verification.
              </Text>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Full Name</Text>
                <Text style={styles.detailValue}>{sellerData?.name || "Merchant Owner"}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Phone Number</Text>
                <Text style={styles.detailValue}>{sellerData?.phoneNumber || "Verified Phone"}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Email Address</Text>
                <Text style={styles.detailValue}>{sellerData?.email || "merchant@abamba.com.ng"}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Date of Birth</Text>
                <Text style={styles.detailValue}>{sellerData?.dob || "Recorded in Verification"}</Text>
              </View>

              <View style={styles.infoNoticeBox}>
                <Text style={styles.infoNoticeText}>
                  To update your verified legal identity details, please contact Abamba Merchant Support.
                </Text>
              </View>
            </View>
          )}

          {/* TAB 2: BUSINESS INFO */}
          {activeTab === "business_info" && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Store & Business Information</Text>
              <Text style={styles.cardSub}>
                Your registered merchant business identity on Abamba.
              </Text>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Business / Store Name</Text>
                <Text style={[styles.detailValue, { fontWeight: "800", color: "#003459" }]}>
                  {sellerData?.business?.businessName || sellerData?.name}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Business Type</Text>
                <Text style={styles.detailValue}>
                  {sellerData?.business?.businessType?.toUpperCase() || "RETAIL MERCHANT"}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Business Phone</Text>
                <Text style={styles.detailValue}>
                  {sellerData?.business?.businessPhone || sellerData?.phoneNumber || "—"}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Business Email</Text>
                <Text style={styles.detailValue}>
                  {sellerData?.business?.businessEmail || sellerData?.email || "—"}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Fulfillment Branch Hub</Text>
                <Text style={styles.detailValue}>
                  {typeof sellerData?.business?.storeLocation === "object"
                    ? sellerData?.business?.storeLocation?.name
                    : sellerData?.business?.storeLocation || "Regional Branch Hub"}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Verification Status</Text>
                <Text style={[styles.detailValue, { color: "#059669", fontWeight: "700" }]}>
                  Approved & Active Merchant
                </Text>
              </View>
            </View>
          )}

          {/* TAB 3: PAYOUT BANK SETTINGS */}
          {activeTab === "payout" && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Payout Bank Account</Text>
              <Text style={styles.cardSub}>
                Earnings from your completed orders are deposited directly into this bank account.
              </Text>

              {/* Bank Selector Trigger */}
              <Text style={styles.inputLabel}>Bank Name</Text>
              <TouchableOpacity
                style={styles.selectorTrigger}
                onPress={() => setBankSelectModal(true)}
              >
                <Text style={selectedBank ? styles.selectorValue : styles.selectorPlaceholder}>
                  {selectedBank?.name || "Choose Your Bank"}
                </Text>
                <ChevronRight size={16} color="#9CA3AF" />
              </TouchableOpacity>

              {/* Account Number */}
              <Text style={styles.inputLabel}>10-Digit Account Number</Text>
              <TextInput
                style={styles.textInput}
                keyboardType="numeric"
                maxLength={10}
                placeholder="0123456789"
                placeholderTextColor="#9CA3AF"
                value={accountNumber}
                onChangeText={setAccountNumber}
              />

              {/* Resolved Account Name */}
              <Text style={styles.inputLabel}>Account Name</Text>
              <View style={styles.resolvedNameBox}>
                {resolvingAccount ? (
                  <ActivityIndicator size="small" color="#003459" />
                ) : (
                  <Text style={styles.resolvedNameText}>
                    {accountName || "Account name will appear automatically..."}
                  </Text>
                )}
              </View>

              <TouchableOpacity
                style={[styles.saveBtn, sendingOtp && styles.btnDisabled]}
                onPress={handleInitiateBankUpdate}
                disabled={sendingOtp}
              >
                {sendingOtp ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveBtnText}>Send Verification OTP to Update</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* TAB 4: PASSWORD SETTINGS */}
          {activeTab === "password" && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Update Password</Text>
              <Text style={styles.cardSub}>
                Change your seller account login and security credentials.
              </Text>

              <Text style={styles.inputLabel}>Current Password</Text>
              <TextInput
                style={styles.textInput}
                secureTextEntry={!showPassword}
                placeholder="Enter your current password"
                placeholderTextColor="#9CA3AF"
                value={oldPassword}
                onChangeText={setOldPassword}
              />

              <Text style={styles.inputLabel}>New Password</Text>
              <TextInput
                style={styles.textInput}
                secureTextEntry={!showPassword}
                placeholder="Minimum 6 characters"
                placeholderTextColor="#9CA3AF"
                value={newPassword}
                onChangeText={setNewPassword}
              />

              <Text style={styles.inputLabel}>Confirm New Password</Text>
              <TextInput
                style={styles.textInput}
                secureTextEntry={!showPassword}
                placeholder="Re-enter new password"
                placeholderTextColor="#9CA3AF"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />

              <TouchableOpacity
                style={{ flexDirection: "row", alignItems: "center", gap: 6, marginVertical: 8 }}
                onPress={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={16} color="#6B7280" /> : <Eye size={16} color="#6B7280" />}
                <Text style={{ fontSize: 13, color: "#6B7280" }}>
                  {showPassword ? "Hide Passwords" : "Show Passwords"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveBtn, updatingPassword && styles.btnDisabled]}
                onPress={handleUpdatePassword}
                disabled={updatingPassword}
              >
                {updatingPassword ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveBtnText}>Update Password</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* TAB 5: NOTIFICATIONS */}
          {activeTab === "notifications" && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Notification Preferences</Text>
              <Text style={styles.cardSub}>
                Configure what notifications you receive about orders and merchant activity.
              </Text>

              <View style={styles.notifRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.notifTitle}>New Order Notifications</Text>
                  <Text style={styles.notifSub}>Receive instant alerts when a buyer buys a product</Text>
                </View>
                <Switch value={orderNotifs} onValueChange={setOrderNotifs} trackColor={{ true: "#003459" }} />
              </View>

              <View style={styles.notifRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.notifTitle}>Order Status Updates</Text>
                  <Text style={styles.notifSub}>Get notified when order statuses update</Text>
                </View>
                <Switch value={statusNotifs} onValueChange={setStatusNotifs} trackColor={{ true: "#003459" }} />
              </View>

              <View style={styles.notifRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.notifTitle}>Delivery Confirmations</Text>
                  <Text style={styles.notifSub}>Alerts when items are marked delivered to buyer</Text>
                </View>
                <Switch value={deliveryNotifs} onValueChange={setDeliveryNotifs} trackColor={{ true: "#003459" }} />
              </View>

              <View style={styles.notifRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.notifTitle}>Email Summaries</Text>
                  <Text style={styles.notifSub}>Send order receipts and payouts statements via email</Text>
                </View>
                <Switch value={emailNotifs} onValueChange={setEmailNotifs} trackColor={{ true: "#003459" }} />
              </View>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* OTP MODAL */}
      <Modal
        visible={otpModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setOtpModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.otpCard}>
            <Text style={styles.otpTitle}>Verify Payout Update</Text>
            <Text style={styles.otpSub}>
              Enter the 6-digit confirmation code sent to {sellerData?.email}.
            </Text>

            <TextInput
              style={styles.otpInput}
              keyboardType="numeric"
              maxLength={6}
              placeholder="123456"
              placeholderTextColor="#9CA3AF"
              value={otpCode}
              onChangeText={setOtpCode}
            />

            <TouchableOpacity
              style={[styles.saveBtn, updatingBank && styles.btnDisabled]}
              onPress={handleConfirmBankUpdate}
              disabled={updatingBank}
            >
              {updatingBank ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.saveBtnText}>Verify & Save Bank</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={{ marginTop: 12, alignItems: "center" }}
              onPress={() => setOtpModalVisible(false)}
            >
              <Text style={{ color: "#6B7280", fontSize: 13 }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* BANK SELECTOR MODAL */}
      <Modal
        visible={bankSelectModal}
        animationType="slide"
        onRequestClose={() => setBankSelectModal(false)}
      >
        <View style={[styles.container, { paddingTop: insets.top }]}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Select Your Bank</Text>
            <TouchableOpacity onPress={() => setBankSelectModal(false)}>
              <X size={22} color="#1F2937" />
            </TouchableOpacity>
          </View>
          <View style={{ padding: 12 }}>
            <TextInput
              style={styles.textInput}
              placeholder="Search bank name..."
              placeholderTextColor="#9CA3AF"
              value={bankSearch}
              onChangeText={setBankSearch}
            />
          </View>
          <ScrollView contentContainerStyle={{ paddingHorizontal: 16 }}>
            {filteredBanks.map((b, idx) => (
              <TouchableOpacity
                key={b.code || idx}
                style={styles.bankItemRow}
                onPress={() => {
                  setSelectedBank(b);
                  setBankSelectModal(false);
                }}
              >
                <Text style={styles.bankItemName}>{b.name}</Text>
                {selectedBank?.code === b.code && <CheckCircle2 size={18} color="#003459" />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>
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
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  tabsWrap: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  tabsScroll: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  tabChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    gap: 6,
  },
  tabChipActive: {
    backgroundColor: "#003459",
  },
  tabChipText: {
    fontSize: 12.5,
    fontWeight: "600",
    color: "#4B5563",
  },
  tabChipTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: "#6B7280",
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
  },
  cardSub: {
    fontSize: 12.5,
    color: "#6B7280",
    marginTop: 4,
    marginBottom: 16,
    lineHeight: 18,
  },
  detailRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  detailLabel: {
    fontSize: 12,
    color: "#6B7280",
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginTop: 2,
  },
  infoNoticeBox: {
    backgroundColor: "#F0F9FF",
    borderWidth: 1,
    borderColor: "#BAE6FD",
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  infoNoticeText: {
    fontSize: 12,
    color: "#0369A1",
    lineHeight: 17,
  },
  inputLabel: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 6,
    marginTop: 10,
  },
  selectorTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 46,
    marginBottom: 6,
  },
  selectorValue: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "600",
  },
  selectorPlaceholder: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  textInput: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 46,
    fontSize: 14,
    color: "#111827",
    marginBottom: 8,
  },
  resolvedNameBox: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 46,
    justifyContent: "center",
    marginBottom: 16,
  },
  resolvedNameText: {
    fontSize: 13.5,
    fontWeight: "700",
    color: "#003459",
  },
  saveBtn: {
    backgroundColor: "#003459",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  saveBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  btnDisabled: {
    opacity: 0.6,
  },
  notifRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  notifSub: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
    maxWidth: 240,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  otpCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    width: "100%",
  },
  otpTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
  },
  otpSub: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 4,
    marginBottom: 16,
    lineHeight: 18,
  },
  otpInput: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    height: 50,
    fontSize: 20,
    textAlign: "center",
    fontWeight: "800",
    letterSpacing: 4,
    marginBottom: 16,
  },
  bankItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  bankItemName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
});
