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
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, User, Mail, Phone, Lock, Save } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useAppSelector } from "../../../store";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const currentUser = useAppSelector((state) => state.auth.user);

  const [firstName, setFirstName] = useState(currentUser?.firstName || "Valued");
  const [lastName, setLastName] = useState(currentUser?.lastName || "Customer");
  const [email, setEmail] = useState(currentUser?.email || "customer@abamba.com");
  const [phone, setPhone] = useState("+234 812 345 6789");
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      Alert.alert("Profile Updated", "Your changes have been saved successfully.");
    }, 1000);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Personal Profile</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Avatar View */}
        <View style={styles.avatarWrap}>
          <Image
            source={require("../../../../assets/images/user.png")}
            style={styles.avatar}
            resizeMode="cover"
          />
          <Text style={styles.avatarName}>
            {firstName} {lastName}
          </Text>
          <Text style={styles.avatarEmail}>{email}</Text>
        </View>

        {/* Inputs */}
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

        <View style={{ height: 100 }} />
      </ScrollView>
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
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  scrollContent: {
    padding: 16,
  },
  avatarWrap: {
    alignItems: "center",
    marginVertical: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#E5E7EB",
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
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 16,
    marginTop: 8,
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
    backgroundColor: "#FF5500",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 48,
    borderRadius: 10,
    marginTop: 24,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  saveBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});

