import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Wallet as WalletIcon,
  Download,
  Search,
  Filter,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  X,
  CreditCard,
  Building,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { sellerService } from "../../../services";

function formatNaira(amount: number | string | undefined | null) {
  const val = Number(amount || 0);
  return `₦${val.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(dateInput: any) {
  if (!dateInput) return "—";
  try {
    const d = new Date(dateInput);
    return d.toLocaleDateString("en-NG", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return String(dateInput);
  }
}

function StatusBadge({ status }: { status?: string }) {
  const s = (status || "").toLowerCase().trim();
  let bg = "#F3F4F6";
  let text = "#4B5563";
  let label = status || "Unknown";

  switch (s) {
    case "completed":
    case "success":
      bg = "#ECFDF5";
      text = "#059669";
      label = "Completed";
      break;
    case "pending":
    case "pending_approval":
    case "processing":
      bg = "#FEF3C7";
      text = "#D97706";
      label = "Pending";
      break;
    case "failed":
    case "rejected":
      bg = "#FEE2E2";
      text = "#DC2626";
      label = "Failed";
      break;
  }

  return (
    <View style={[styles.badgeContainer, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color: text }]}>{label}</Text>
    </View>
  );
}

export default function SellerWalletScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // State matching web seller-wallet.jsx
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sellerData, setSellerData] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);

  // Filtering & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<"descending" | "ascending">("descending");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const ITEMS_PER_PAGE = 8;

  // Withdrawal Dialog / Modal (WithdrawalReviewDialog)
  const [openWithdrawDialog, setOpenWithdrawDialog] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");
  const [isPendingPayout, setIsPendingPayout] = useState(false);
  const payoutLockRef = useRef(false);

  // Selected Transaction for Details Modal
  const [selectedTx, setSelectedTx] = useState<any>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  // Fetch live seller data and transactions
  const fetchWalletData = useCallback(async () => {
    try {
      setLoading(true);
      const [profileRes, txRes] = await Promise.allSettled([
        sellerService.getProfile(),
        sellerService.getTransactions(),
      ]);

      if (profileRes.status === "fulfilled") {
        const pData = profileRes.value?.data?.data || profileRes.value?.data;
        setSellerData(pData);
      }
      if (txRes.status === "fulfilled") {
        const rawTx =
          txRes.value?.data?.data?.transactions ||
          txRes.value?.data?.data ||
          txRes.value?.data ||
          [];
        setTransactions(Array.isArray(rawTx) ? rawTx : []);
      }
    } catch (err: any) {
      console.warn("Error fetching seller wallet data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWalletData();
  }, [fetchWalletData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchWalletData();
    setRefreshing(false);
  };

  // Derive wallet data
  const seller = sellerData?.seller || sellerData?.business || sellerData || {};
  const wallet = seller?.wallet || sellerData?.wallet || {};
  const bank = seller?.bank || sellerData?.bank || sellerData?.business?.bank;
  const availableBalance = Number(wallet?.balance || sellerData?.balance || 0);
  const pendingBalance = Number(wallet?.pendingBalance || wallet?.escrow || 0);
  const holdBalance = Number(wallet?.holdBalance || 0);

  // Active payout check (pending / processing locks new withdrawal requests)
  const hasActivePayout = useMemo(() => {
    return transactions.some((t) =>
      ["pending", "pending_approval", "processing"].includes(
        String(t.status || "").toLowerCase()
      )
    );
  }, [transactions]);

  // Filtering transactions matching web logic
  const filteredTransactions = useMemo(() => {
    let list = transactions.filter((t) => {
      const q = searchTerm.toLowerCase();
      const ref = String(t.reference || t._id || "").toLowerCase();
      const acc = String(t.accountDetails?.accountNumber || t.accountNumber || "").toLowerCase();
      const desc = String(t.description || "").toLowerCase();
      return ref.includes(q) || acc.includes(q) || desc.includes(q);
    });

    list.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return sortOrder === "ascending" ? dateA - dateB : dateB - dateA;
    });

    return list;
  }, [transactions, searchTerm, sortOrder]);

  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE) || 1;
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTransactions.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredTransactions, currentPage]);

  // Handle payout request matching web
  const handleRequestPayout = async () => {
    if (!withdrawAmount || payoutLockRef.current) return;
    if (hasActivePayout) {
      Alert.alert(
        "Withdrawal Pending",
        "You already have a withdrawal awaiting approval. Please wait for it to be processed."
      );
      return;
    }

    const numericAmount = parseFloat(withdrawAmount.replace(/,/g, ""));
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      Alert.alert("Invalid Amount", "Enter a valid withdrawal amount.");
      return;
    }
    if (numericAmount > availableBalance) {
      Alert.alert("Insufficient Balance", "Amount is more than your available balance.");
      return;
    }

    try {
      payoutLockRef.current = true;
      setIsPendingPayout(true);
      await sellerService.requestPayout({
        amount: numericAmount,
        description: "Withdrawal to bank account",
      });
      payoutLockRef.current = false;
      setIsPendingPayout(false);
      setOpenWithdrawDialog(false);
      setWithdrawAmount("");
      Alert.alert(
        "Request Submitted",
        "Your withdrawal request has been sent successfully and is awaiting bank clearance."
      );
      await fetchWalletData();
    } catch (err: any) {
      payoutLockRef.current = false;
      setIsPendingPayout(false);
      Alert.alert(
        "Withdrawal Failed",
        err?.response?.data?.message || "Failed to send withdrawal request."
      );
    }
  };

  const hasBank = !!(bank?.accountNumber && bank?.bankName);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Merchant Wallet</Text>
        <View style={{ width: 32 }} />
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#003459" />
          <Text style={styles.loadingText}>Loading wallet...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {/* Escrow Clarity Breakdown Banner */}
          <View style={styles.escrowBanner}>
            <View style={styles.escrowBannerIconWrap}>
              <Clock size={20} color="#D97706" />
            </View>
            <View style={styles.escrowBannerContent}>
              <Text style={styles.escrowBannerTitle}>Escrow Protection Active</Text>
              <Text style={styles.escrowBannerText}>
                {pendingBalance > 0
                  ? `${formatNaira(pendingBalance)} is currently held in safe escrow and will be automatically credited to your Available Balance as soon as order delivery is confirmed.`
                  : "Earnings from buyer orders are held safely in escrow and automatically released to your Available Balance once customer delivery is confirmed."}
              </Text>
            </View>
          </View>

          {/* 3 Metric Cards Grid matching Web Article */}
          <View style={styles.metricsGrid}>
            {/* 1. Available Balance */}
            <View style={styles.metricCard}>
              <View style={styles.metricTopRow}>
                <View style={styles.metricIconWrap}>
                  <WalletIcon size={18} color="#003459" />
                </View>
                <TouchableOpacity
                  style={[
                    styles.withdrawActionBtn,
                    (hasActivePayout || availableBalance <= 0) && styles.withdrawActionBtnDisabled,
                  ]}
                  onPress={() => setOpenWithdrawDialog(true)}
                  disabled={hasActivePayout || availableBalance <= 0}
                >
                  <Text style={styles.withdrawActionBtnText}>
                    {hasActivePayout ? "Pending" : "Withdraw"}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.metricBottomCol}>
                <Text style={styles.metricLabel}>Available Balance</Text>
                <Text style={styles.metricValue}>{formatNaira(availableBalance)}</Text>
                <Text style={styles.metricSubtextEmerald}>Funds ready for withdrawal</Text>
              </View>
            </View>

            {/* 2. Pending Balance */}
            <View style={styles.metricCard}>
              <View style={styles.metricTopRow}>
                <View style={styles.metricIconWrap}>
                  <WalletIcon size={18} color="#003459" />
                </View>
              </View>
              <View style={styles.metricBottomCol}>
                <Text style={styles.metricLabel}>Pending Balance</Text>
                <Text style={styles.metricValue}>{formatNaira(pendingBalance)}</Text>
                <Text style={styles.metricSubtextAmber}>
                  Funds held in escrow until delivery
                </Text>
              </View>
            </View>

            {/* 3. Balance on Hold */}
            <View style={styles.metricCard}>
              <View style={styles.metricTopRow}>
                <View style={styles.metricIconWrap}>
                  <Download size={18} color="#003459" />
                </View>
              </View>
              <View style={styles.metricBottomCol}>
                <Text style={styles.metricLabel}>Balance on Hold</Text>
                <Text style={styles.metricValue}>{formatNaira(holdBalance)}</Text>
                <Text style={styles.metricSubtextMuted}>Security reserve</Text>
              </View>
            </View>
          </View>

          {/* Transactions Section Header & Search/Sort Filters */}
          <View style={styles.tableHeaderSection}>
            <View style={styles.searchBox}>
              <Search size={16} color="#9CA3AF" style={{ marginRight: 6 }} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search transactions..."
                placeholderTextColor="#9CA3AF"
                value={searchTerm}
                onChangeText={(text) => {
                  setSearchTerm(text);
                  setCurrentPage(1);
                }}
              />
              {searchTerm.length > 0 && (
                <TouchableOpacity onPress={() => setSearchTerm("")}>
                  <X size={16} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={styles.sortFilterBtn}
              onPress={() => setSortModalVisible(true)}
            >
              <ArrowUpDown size={15} color="#4B5563" />
              <Text style={styles.sortFilterBtnText}>
                {sortOrder === "descending" ? "Newest First" : "Oldest First"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Transactions List */}
          {filteredTransactions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <WalletIcon size={46} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>No transactions found</Text>
              <Text style={styles.emptySubtitle}>
                {searchTerm
                  ? "No transactions match your search filter."
                  : "Payouts, escrow releases, and bank withdrawals will appear here."}
              </Text>
            </View>
          ) : (
            paginatedTransactions.map((tx: any, idx: number) => {
              const txId = tx._id || tx.id || `TX-${idx + 1}`;
              const ref = tx.reference || String(txId).slice(-8);
              const accNum = tx.accountDetails?.accountNumber || tx.accountNumber || "Settlement Bank";
              const amt = Number(tx.amount || 0);
              const dateStr = formatDate(tx.createdAt);

              const isCredit =
                tx.type === "credit" ||
                tx.type === "deposit" ||
                tx.action === "payout" ||
                tx.action === "order_earning";

              return (
                <TouchableOpacity
                  key={txId}
                  style={styles.txCard}
                  onPress={() => {
                    setSelectedTx(tx);
                    setDetailModalVisible(true);
                  }}
                >
                  <View style={styles.txCardLeft}>
                    <View
                      style={[
                        styles.txIconWrap,
                        { backgroundColor: isCredit ? "#ECFDF5" : "#FEF2F2" },
                      ]}
                    >
                      {isCredit ? (
                        <ArrowDownLeft size={18} color="#059669" />
                      ) : (
                        <ArrowUpRight size={18} color="#DC2626" />
                      )}
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.txTitleText} numberOfLines={1}>
                        {tx.description || (isCredit ? "Order Payout" : "Bank Withdrawal")}
                      </Text>
                      <Text style={styles.txSubText}>
                        Ref: {ref} • {dateStr}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.txCardRight}>
                    <Text
                      style={[
                        styles.txAmountText,
                        { color: isCredit ? "#059669" : "#111827" },
                      ]}
                    >
                      {isCredit ? `+${formatNaira(amt)}` : `-${formatNaira(amt)}`}
                    </Text>
                    <StatusBadge status={tx.status} />
                  </View>
                </TouchableOpacity>
              );
            })
          )}

          {/* Pagination Matching Web */}
          {filteredTransactions.length > 0 && (
            <View style={styles.paginationRow}>
              <Text style={styles.paginationInfoText}>
                Showing {paginatedTransactions.length} of {filteredTransactions.length} transactions
              </Text>
              <View style={styles.paginationControls}>
                <TouchableOpacity
                  style={[styles.pageBtn, currentPage === 1 && styles.pageBtnDisabled]}
                  onPress={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft size={16} color={currentPage === 1 ? "#9CA3AF" : "#111827"} />
                </TouchableOpacity>
                <View style={styles.pageNumBox}>
                  <Text style={styles.pageNumText}>
                    {currentPage} / {totalPages}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.pageBtn, currentPage >= totalPages && styles.pageBtnDisabled]}
                  onPress={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                >
                  <ChevronRight size={16} color={currentPage >= totalPages ? "#9CA3AF" : "#111827"} />
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* WITHDRAWAL REVIEW DIALOG (1:1 with Web withdrawal-review-dialog.jsx) */}
      <Modal
        visible={openWithdrawDialog}
        transparent
        animationType="fade"
        onRequestClose={() => setOpenWithdrawDialog(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.dialogCard}>
            {/* Header */}
            <View style={styles.dialogHeader}>
              <Text style={styles.dialogTitle}>Request Withdrawal</Text>
              <TouchableOpacity
                onPress={() => setOpenWithdrawDialog(false)}
                style={styles.dialogCloseBtn}
              >
                <X size={18} color="#4B5563" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
              {/* Payout Destination Card */}
              {hasBank ? (
                <View style={styles.bankDestCard}>
                  <View style={styles.bankDestHeader}>
                    <CheckCircle2 size={15} color="#059669" />
                    <Text style={styles.bankDestHeaderText}>Payout Destination</Text>
                  </View>
                  <Text style={styles.bankNameText}>{bank.bankName}</Text>
                  <Text style={styles.bankAccountMetaText}>
                    {bank.accountNumber} • {bank.accountName}
                  </Text>
                </View>
              ) : (
                <View style={styles.bankAlertCard}>
                  <View style={styles.bankAlertHeader}>
                    <AlertCircle size={15} color="#B45309" />
                    <Text style={styles.bankAlertHeaderText}>Bank Details Required</Text>
                  </View>
                  <Text style={styles.bankAlertBodyText}>
                    You need to set up your payout bank account before requesting a withdrawal.
                  </Text>
                  <TouchableOpacity
                    style={styles.addBankBtn}
                    onPress={() => {
                      setOpenWithdrawDialog(false);
                      router.push("/seller/settings" as any);
                    }}
                  >
                    <Text style={styles.addBankBtnText}>Add Bank in Settings →</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Amount Input */}
              <View style={styles.amountFieldWrap}>
                <View style={styles.amountLabelRow}>
                  <Text style={styles.amountLabel}>Withdrawal Amount</Text>
                  <Text style={styles.availableBadgeText}>
                    Available: {formatNaira(availableBalance)}
                  </Text>
                </View>

                <View style={styles.amountInputRow}>
                  <View style={styles.amountInputBox}>
                    <Text style={styles.nairaPrefix}>₦</Text>
                    <TextInput
                      style={styles.numericInput}
                      keyboardType="numeric"
                      placeholder="0.00"
                      placeholderTextColor="#9CA3AF"
                      value={withdrawAmount}
                      editable={hasBank && !isPendingPayout}
                      onChangeText={setWithdrawAmount}
                    />
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.withdrawAllBtn,
                      (!hasBank || availableBalance <= 0 || isPendingPayout) &&
                        styles.withdrawAllBtnDisabled,
                    ]}
                    onPress={() => setWithdrawAmount(String(availableBalance))}
                    disabled={!hasBank || availableBalance <= 0 || isPendingPayout}
                  >
                    <Text style={styles.withdrawAllBtnText}>Withdraw All</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.dialogActionsRow}>
              <TouchableOpacity
                style={[
                  styles.submitPayoutBtn,
                  (isPendingPayout ||
                    !hasBank ||
                    parseFloat(withdrawAmount || "0") <= 0 ||
                    parseFloat(withdrawAmount || "0") > availableBalance) &&
                    styles.submitPayoutBtnDisabled,
                ]}
                onPress={handleRequestPayout}
                disabled={
                  isPendingPayout ||
                  !hasBank ||
                  parseFloat(withdrawAmount || "0") <= 0 ||
                  parseFloat(withdrawAmount || "0") > availableBalance
                }
              >
                {isPendingPayout ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitPayoutBtnText}>Confirm Withdrawal</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* SORT ORDER PICKER MODAL */}
      <Modal
        visible={sortModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSortModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSortModalVisible(false)}
        >
          <View style={styles.sortModalCard}>
            <Text style={styles.sortModalTitle}>Sort Transactions</Text>
            {[
              { id: "descending", label: "Newest First" },
              { id: "ascending", label: "Oldest First" },
            ].map((opt) => (
              <TouchableOpacity
                key={opt.id}
                style={[
                  styles.sortOptionRow,
                  sortOrder === opt.id && styles.sortOptionRowSelected,
                ]}
                onPress={() => {
                  setSortOrder(opt.id as any);
                  setSortModalVisible(false);
                }}
              >
                <Text
                  style={[
                    styles.sortOptionText,
                    sortOrder === opt.id && styles.sortOptionTextSelected,
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* TRANSACTION DETAILS MODAL */}
      <Modal
        visible={detailModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.txDetailCard}>
            <View style={styles.dialogHeader}>
              <Text style={styles.dialogTitle}>Transaction Details</Text>
              <TouchableOpacity
                onPress={() => setDetailModalVisible(false)}
                style={styles.dialogCloseBtn}
              >
                <X size={18} color="#4B5563" />
              </TouchableOpacity>
            </View>

            {selectedTx && (
              <View style={styles.txDetailBody}>
                <View style={styles.txDetailAmountBox}>
                  <Text style={styles.txDetailAmountLabel}>Amount</Text>
                  <Text style={styles.txDetailAmountVal}>
                    {formatNaira(selectedTx.amount)}
                  </Text>
                  <View style={{ marginTop: 6 }}>
                    <StatusBadge status={selectedTx.status} />
                  </View>
                </View>

                <View style={styles.txDetailRow}>
                  <Text style={styles.txDetailLabel}>Reference:</Text>
                  <Text style={styles.txDetailValue} numberOfLines={1}>
                    {selectedTx.reference || selectedTx._id}
                  </Text>
                </View>

                <View style={styles.txDetailRow}>
                  <Text style={styles.txDetailLabel}>Date:</Text>
                  <Text style={styles.txDetailValue}>
                    {formatDate(selectedTx.createdAt)}
                  </Text>
                </View>

                <View style={styles.txDetailRow}>
                  <Text style={styles.txDetailLabel}>Account Details:</Text>
                  <Text style={styles.txDetailValue}>
                    {selectedTx.accountDetails?.accountNumber ||
                      selectedTx.accountNumber ||
                      "Settlement Account"}
                  </Text>
                </View>

                <View style={styles.txDetailRow}>
                  <Text style={styles.txDetailLabel}>Description:</Text>
                  <Text style={styles.txDetailValue}>
                    {selectedTx.description || "N/A"}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F5F7",
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
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: "#6B7280",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  escrowBanner: {
    flexDirection: "row",
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FCD34D",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    gap: 12,
    alignItems: "flex-start",
  },
  escrowBannerIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FEF3C7",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  escrowBannerContent: {
    flex: 1,
  },
  escrowBannerTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#92400E",
    marginBottom: 4,
  },
  escrowBannerText: {
    fontSize: 12.5,
    color: "#B45309",
    lineHeight: 18,
  },
  metricsGrid: {
    gap: 12,
    marginBottom: 16,
  },
  metricCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  metricTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  metricIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "rgba(0, 52, 89, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  withdrawActionBtn: {
    backgroundColor: "#003459",
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 6,
  },
  withdrawActionBtnDisabled: {
    opacity: 0.5,
  },
  withdrawActionBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  metricBottomCol: {
    gap: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: "#6B7280",
  },
  metricValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  metricSubtextEmerald: {
    fontSize: 11,
    color: "#059669",
    fontWeight: "600",
  },
  metricSubtextAmber: {
    fontSize: 11,
    color: "#D97706",
    fontWeight: "600",
  },
  metricSubtextMuted: {
    fontSize: 11,
    color: "#9CA3AF",
  },
  tableHeaderSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    paddingHorizontal: 10,
    height: 38,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: "#111827",
    paddingVertical: 0,
  },
  sortFilterBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    paddingHorizontal: 10,
    height: 38,
    gap: 4,
  },
  sortFilterBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1F2937",
    marginTop: 10,
  },
  emptySubtitle: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 4,
    maxWidth: 260,
  },
  txCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  txCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 10,
  },
  txIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  txTitleText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
  },
  txSubText: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 2,
  },
  txCardRight: {
    alignItems: "flex-end",
    gap: 4,
  },
  txAmountText: {
    fontSize: 14,
    fontWeight: "700",
  },
  badgeContainer: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
  },
  badgeText: {
    fontSize: 10.5,
    fontWeight: "700",
  },
  paginationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    paddingVertical: 8,
  },
  paginationInfoText: {
    fontSize: 12,
    color: "#6B7280",
  },
  paginationControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  pageBtn: {
    padding: 6,
    backgroundColor: "#FFFFFF",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  pageBtnDisabled: {
    opacity: 0.4,
  },
  pageNumBox: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "#003459",
    borderRadius: 6,
  },
  pageNumText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },

  // Modal Dialogs
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  dialogCard: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  dialogHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  dialogTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  dialogCloseBtn: {
    padding: 4,
  },
  bankDestCard: {
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    borderRadius: 8,
    padding: 12,
    marginBottom: 14,
  },
  bankDestHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  bankDestHeaderText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#065F46",
  },
  bankNameText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
  },
  bankAccountMetaText: {
    fontSize: 11.5,
    color: "#4B5563",
    fontFamily: "monospace",
    marginTop: 2,
  },
  bankAlertCard: {
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FDE68A",
    borderRadius: 8,
    padding: 12,
    marginBottom: 14,
  },
  bankAlertHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  bankAlertHeaderText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#92400E",
  },
  bankAlertBodyText: {
    fontSize: 12,
    color: "#78350F",
    lineHeight: 16,
    marginBottom: 10,
  },
  addBankBtn: {
    backgroundColor: "#D97706",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  addBankBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  amountFieldWrap: {
    gap: 6,
    marginBottom: 16,
  },
  amountLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  amountLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
  },
  availableBadgeText: {
    fontSize: 11,
    color: "#6B7280",
  },
  amountInputRow: {
    flexDirection: "row",
    gap: 8,
  },
  amountInputBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    paddingHorizontal: 12,
    height: 42,
  },
  nairaPrefix: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "600",
    marginRight: 4,
  },
  numericInput: {
    flex: 1,
    fontSize: 14,
    color: "#111827",
    paddingVertical: 0,
  },
  withdrawAllBtn: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 14,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  withdrawAllBtnDisabled: {
    opacity: 0.5,
  },
  withdrawAllBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1F2937",
  },
  dialogActionsRow: {
    marginTop: 4,
  },
  submitPayoutBtn: {
    backgroundColor: "#003459",
    paddingVertical: 11,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  submitPayoutBtnDisabled: {
    opacity: 0.5,
  },
  submitPayoutBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  sortModalCard: {
    width: "100%",
    maxWidth: 280,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
  },
  sortModalTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 10,
  },
  sortOptionRow: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  sortOptionRowSelected: {
    backgroundColor: "#F3F4F6",
  },
  sortOptionText: {
    fontSize: 13,
    color: "#374151",
  },
  sortOptionTextSelected: {
    fontWeight: "700",
    color: "#003459",
  },
  txDetailCard: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 18,
  },
  txDetailBody: {
    gap: 12,
  },
  txDetailAmountBox: {
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    padding: 14,
    borderRadius: 8,
  },
  txDetailAmountLabel: {
    fontSize: 11,
    color: "#6B7280",
  },
  txDetailAmountVal: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
    marginTop: 2,
  },
  txDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    paddingBottom: 8,
  },
  txDetailLabel: {
    fontSize: 12,
    color: "#6B7280",
  },
  txDetailValue: {
    fontSize: 12.5,
    fontWeight: "600",
    color: "#111827",
    maxWidth: 180,
    textAlign: "right",
  },
});
