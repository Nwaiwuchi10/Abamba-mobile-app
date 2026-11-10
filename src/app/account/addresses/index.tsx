import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, MapPin, Plus, Trash2, CheckCircle2 } from "lucide-react-native";
import { useRouter } from "expo-router";

export default function AddressesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [addresses, setAddresses] = useState([
    {
      id: "addr-1",
      name: "Home Address",
      address: "Plot 14 Works Layout, Off Okigwe Road",
      city: "Owerri",
      state: "Imo State",
      phone: "+234 812 345 6789",
      isDefault: true,
    },
    {
      id: "addr-2",
      name: "Office Location",
      address: "12 Port Harcourt Road, New Owerri",
      city: "Owerri",
      state: "Imo State",
      phone: "+234 803 987 6543",
      isDefault: false,
    },
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newStreet, setNewStreet] = useState("");
  const [newPhone, setNewPhone] = useState("");

  const handleAdd = () => {
    if (!newTitle || !newStreet) {
      Alert.alert("Missing Fields", "Please enter address label and street details.");
      return;
    }
    const newAddr = {
      id: `addr-${Date.now()}`,
      name: newTitle,
      address: newStreet,
      city: "Owerri",
      state: "Imo State",
      phone: newPhone || "+234 800 000 0000",
      isDefault: false,
    };
    setAddresses([...addresses, newAddr]);
    setShowAddModal(false);
    setNewTitle("");
    setNewStreet("");
    setNewPhone("");
    Alert.alert("Success", "Address added successfully.");
  };

  const handleDelete = (id: string) => {
    setAddresses((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSetDefault = (id: string) => {
    setAddresses((prev) =>
      prev.map((a) => ({ ...a, isDefault: a.id === id }))
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Delivery Addresses</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setShowAddModal(!showAddModal)}
        >
          <Plus size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {showAddModal && (
          <View style={styles.addCard}>
            <Text style={styles.addCardTitle}>New Delivery Address</Text>
            <TextInput
              style={styles.input}
              placeholder="Address Label (e.g. Home, Office)"
              placeholderTextColor="#9CA3AF"
              value={newTitle}
              onChangeText={setNewTitle}
            />
            <TextInput
              style={styles.input}
              placeholder="Street Address / Landmark"
              placeholderTextColor="#9CA3AF"
              value={newStreet}
              onChangeText={setNewStreet}
            />
            <TextInput
              style={styles.input}
              placeholder="Contact Phone Number"
              placeholderTextColor="#9CA3AF"
              keyboardType="phone-pad"
              value={newPhone}
              onChangeText={setNewPhone}
            />
            <TouchableOpacity style={styles.saveBtn} onPress={handleAdd}>
              <Text style={styles.saveBtnText}>Save Address</Text>
            </TouchableOpacity>
          </View>
        )}

        {addresses.map((item) => (
          <View key={item.id} style={styles.addressCard}>
            <View style={styles.cardTop}>
              <View style={styles.labelRow}>
                <MapPin size={16} color="#FF5500" />
                <Text style={styles.addressLabel}>{item.name}</Text>
                {item.isDefault && (
                  <View style={styles.defaultBadge}>
                    <Text style={styles.defaultText}>Default</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity onPress={() => handleDelete(item.id)}>
                <Trash2 size={16} color="#EF4444" />
              </TouchableOpacity>
            </View>

            <Text style={styles.streetText}>{item.address}</Text>
            <Text style={styles.cityState}>
              {item.city}, {item.state}
            </Text>
            <Text style={styles.phoneText}>Phone: {item.phone}</Text>

            {!item.isDefault && (
              <TouchableOpacity
                style={styles.setDefaultBtn}
                onPress={() => handleSetDefault(item.id)}
              >
                <CheckCircle2 size={14} color="#6B7280" />
                <Text style={styles.setDefaultText}>Set as default</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}

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
  addBtn: {
    backgroundColor: "#FF5500",
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    padding: 16,
  },
  addCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 16,
    marginBottom: 16,
  },
  addCardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  input: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 14,
    color: "#1F2937",
    marginBottom: 10,
  },
  saveBtn: {
    backgroundColor: "#FF5500",
    height: 44,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  saveBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  addressCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 16,
    marginBottom: 12,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  addressLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1F2937",
  },
  defaultBadge: {
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 6,
  },
  defaultText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#10B981",
  },
  streetText: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
  },
  cityState: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },
  phoneText: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
  },
  setDefaultBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  setDefaultText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
  },
});

