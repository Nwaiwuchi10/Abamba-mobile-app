import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, Store, Building2, CreditCard, Check } from "lucide-react-native";
import { useRouter } from "expo-router";

export default function SellerOnboardingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [storeName, setStoreName] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      Alert.alert(
        "Application Submitted",
        "Your merchant store has been registered. You can now start adding products to your inventory!",
        [{ text: "Go to Dashboard", onPress: () => router.replace("/seller/dashboard" as any) }]
      );
    }, 1200);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Seller Onboarding</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Step Indicator */}
        <View style={styles.stepIndicator}>
          <View style={[styles.stepDot, step >= 1 && styles.stepActive]}>
            <Text style={[styles.stepText, step >= 1 && styles.stepTextActive]}>1</Text>
          </View>
          <View style={[styles.stepLine, step >= 2 && styles.stepLineActive]} />
          <View style={[styles.stepDot, step >= 2 && styles.stepActive]}>
            <Text style={[styles.stepText, step >= 2 && styles.stepTextActive]}>2</Text>
          </View>
        </View>

        {step === 1 ? (
          <View style={styles.formSection}>
            <View style={styles.iconWrap}>
              <Store size={32} color="#FF5500" />
            </View>
            <Text style={styles.sectionHeading}>Business Information</Text>
            <Text style={styles.sectionSub}>Provide your merchant store details on Abamba</Text>

            <Text style={styles.label}>Store / Business Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Apex Electronics Ltd"
              placeholderTextColor="#9CA3AF"
              value={storeName}
              onChangeText={setStoreName}
            />

            <Text style={styles.label}>Business Contact Email</Text>
            <TextInput
              style={styles.input}
              placeholder="merchant@example.com"
              placeholderTextColor="#9CA3AF"
              keyboardType="email-address"
              value={businessEmail}
              onChangeText={setBusinessEmail}
            />

            <Text style={styles.label}>Support Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="+234 800 000 0000"
              placeholderTextColor="#9CA3AF"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />

            <TouchableOpacity
              style={styles.nextBtn}
              onPress={() => {
                if (!storeName || !businessEmail) {
                  Alert.alert("Missing Fields", "Please complete all fields.");
                  return;
                }
                setStep(2);
              }}
            >
              <Text style={styles.nextBtnText}>Continue to Bank Details</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.formSection}>
            <View style={styles.iconWrap}>
              <CreditCard size={32} color="#FF5500" />
            </View>
            <Text style={styles.sectionHeading}>Payout Information</Text>
            <Text style={styles.sectionSub}>Your earnings will be automatically paid into this account</Text>

            <Text style={styles.label}>Bank Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Access Bank, GTBank, Zenith"
              placeholderTextColor="#9CA3AF"
              value={bankName}
              onChangeText={setBankName}
            />

            <Text style={styles.label}>Account Number</Text>
            <TextInput
              style={styles.input}
              placeholder="0123456789"
              placeholderTextColor="#9CA3AF"
              keyboardType="number-pad"
              maxLength={10}
              value={accountNumber}
              onChangeText={setAccountNumber}
            />

            <Text style={styles.label}>Account Holder Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Account name as registered on bank"
              placeholderTextColor="#9CA3AF"
              value={accountName}
              onChangeText={setAccountName}
            />

            <View style={styles.btnRow}>
              <TouchableOpacity style={styles.prevBtn} onPress={() => setStep(1)}>
                <Text style={styles.prevBtnText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.nextBtn, { flex: 2, marginLeft: 10 }]}
                onPress={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.nextBtnText}>Submit & Launch Store</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  scrollContent: {
    padding: 24,
  },
  stepIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  stepActive: {
    backgroundColor: "#FF5500",
  },
  stepText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6B7280",
  },
  stepTextActive: {
    color: "#FFFFFF",
  },
  stepLine: {
    width: 60,
    height: 3,
    backgroundColor: "#E5E7EB",
    marginHorizontal: 8,
  },
  stepLineActive: {
    backgroundColor: "#FF5500",
  },
  formSection: {
    alignItems: "center",
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FFF5F0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionHeading: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
  },
  sectionSub: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 4,
    marginBottom: 24,
    textAlign: "center",
  },
  label: {
    alignSelf: "flex-start",
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    width: "100%",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 48,
    fontSize: 14,
    color: "#1F2937",
  },
  nextBtn: {
    backgroundColor: "#FF5500",
    width: "100%",
    height: 48,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
  },
  nextBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  btnRow: {
    flexDirection: "row",
    width: "100%",
    marginTop: 14,
  },
  prevBtn: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginTop: 24,
  },
  prevBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#4B5563",
  },
});

