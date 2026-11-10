import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, Wallet, ArrowUpRight, ArrowDownLeft, Clock, ShieldCheck } from "lucide-react-native";
import { useRouter } from "expo-router";

export default function SellerWalletScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const transactions = [
    { id: "TX-101", desc: "Order ORD-9482 Payout", amount: "+₦45,000", date: "Today, 10:14 AM", type: "credit" },
    { id: "TX-102", desc: "Bank Withdrawal (GTBank)", amount: "-₦120,000", date: "Yesterday, 3:30 PM", type: "debit" },
    { id: "TX-103", desc: "Order ORD-9480 Payout", amount: "+₦82,000", date: "08 Nov 2024", type: "credit" },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Merchant Wallet</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Wallet Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>AVAILABLE BALANCE</Text>
          <Text style={styles.balanceValue}>₦485,500.00</Text>
          <Text style={styles.escrowInfo}>Escrow / Pending Clearance: ₦63,500.00</Text>

          <View style={styles.btnRow}>
            <TouchableOpacity
              style={styles.withdrawBtn}
              onPress={() => Alert.alert("Request Withdrawal", "Initiate bank transfer of available funds")}
            >
              <ArrowUpRight size={18} color="#FFFFFF" />
              <Text style={styles.withdrawText}>Withdraw Funds</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.securityBox}>
          <ShieldCheck size={18} color="#10B981" />
          <Text style={styles.securityText}>Direct payout to verified merchant account</Text>
        </View>

        <Text style={styles.sectionTitle}>Transaction History</Text>
        <View style={styles.txList}>
          {transactions.map((tx) => (
            <View key={tx.id} style={styles.txItem}>
              <View style={styles.txLeft}>
                <View
                  style={[
                    styles.txIcon,
                    tx.type === "credit" ? styles.creditIcon : styles.debitIcon,
                  ]}
                >
                  {tx.type === "credit" ? (
                    <ArrowDownLeft size={16} color="#059669" />
                  ) : (
                    <ArrowUpRight size={16} color="#DC2626" />
                  )}
                </View>
                <View>
                  <Text style={styles.txDesc}>{tx.desc}</Text>
                  <Text style={styles.txDate}>{tx.date}</Text>
                </View>
              </View>
              <Text
                style={[
                  styles.txAmount,
                  tx.type === "credit" ? styles.creditAmount : styles.debitAmount,
                ]}
              >
                {tx.amount}
              </Text>
            </View>
          ))}
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
  balanceCard: {
    backgroundColor: "#111827",
    borderRadius: 16,
    padding: 20,
    marginBottom: 14,
  },
  balanceLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FF5500",
    letterSpacing: 1,
  },
  balanceValue: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
    marginTop: 6,
  },
  escrowInfo: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 4,
    marginBottom: 16,
  },
  btnRow: {
    flexDirection: "row",
  },
  withdrawBtn: {
    backgroundColor: "#FF5500",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  withdrawText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  securityBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#ECFDF5",
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
  },
  securityText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#065F46",
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 10,
  },
  txList: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
  },
  txItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  txLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  txIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  creditIcon: {
    backgroundColor: "#ECFDF5",
  },
  debitIcon: {
    backgroundColor: "#FEF2F2",
  },
  txDesc: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1F2937",
  },
  txDate: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 2,
  },
  txAmount: {
    fontSize: 14,
    fontWeight: "700",
  },
  creditAmount: {
    color: "#059669",
  },
  debitAmount: {
    color: "#DC2626",
  },
});

