import React, { useState, useEffect, useCallback, useMemo } from "react";
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
  Image,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Search,
  Star,
  MessageSquare,
  X,
  Package,
  User,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Send,
  Calendar,
  CheckCircle2,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { sellerService } from "../../services";

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

// 5-Star Rating Component matching web StarRating
function StarRating({ rating }: { rating: number }) {
  const rounded = Math.round(rating || 0);
  return (
    <View style={styles.starsRow}>
      {[1, 2, 3, 4, 5].map((idx) => (
        <Star
          key={idx}
          size={14}
          color={idx <= rounded ? "#F59E0B" : "#D1D5DB"}
          fill={idx <= rounded ? "#F59E0B" : "transparent"}
          style={{ marginRight: 2 }}
        />
      ))}
    </View>
  );
}

export default function SellerReviewsModuleScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // State matching web sellers-reviews.jsx
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<"descending" | "ascending">("descending");
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Reply review dialog state (matches web ReplyReviewDialog)
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [replyTargetReview, setReplyTargetReview] = useState<any>(null);
  const [replyText, setReplyText] = useState("");
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  // View review details dialog state (matches web ViewReviewDetails)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<any>(null);

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      const res = await sellerService.getReviews();
      const list =
        res?.data?.data?.reviews ||
        res?.data?.reviews ||
        res?.data?.data ||
        res?.data ||
        [];
      setReviews(Array.isArray(list) ? list : []);
    } catch (err: any) {
      console.warn("Error fetching seller reviews:", err);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchReviews();
    setRefreshing(false);
  };

  // Metric computations matching web articles
  const totalReviews = reviews.length;
  const recentReviews = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return reviews.filter((r) => new Date(r.createdAt || 0) > thirtyDaysAgo).length;
  }, [reviews]);

  // Filter and sort reviews
  const filteredReviews = useMemo(() => {
    let list = reviews.filter((r) => {
      const q = searchTerm.toLowerCase();
      const cust = String(r.user?.name || "Anonymous").toLowerCase();
      const prod = String(r.product?.name || "").toLowerCase();
      const comment = String(r.comment || "").toLowerCase();
      return cust.includes(q) || prod.includes(q) || comment.includes(q);
    });

    list.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return sortOrder === "ascending" ? dateA - dateB : dateB - dateA;
    });

    return list;
  }, [reviews, searchTerm, sortOrder]);

  const totalPages = Math.ceil(filteredReviews.length / ITEMS_PER_PAGE) || 1;
  const paginatedReviews = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredReviews.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredReviews, currentPage]);

  // Reply submission matching web
  const handleReplySubmit = async () => {
    if (!replyText.trim() || !replyTargetReview) {
      Alert.alert("Empty Reply", "Please enter your response before submitting.");
      return;
    }

    try {
      setIsSubmittingReply(true);
      await sellerService.replyReview(replyTargetReview._id, replyText.trim());
      setIsSubmittingReply(false);
      setReplyDialogOpen(false);
      setReplyText("");
      Alert.alert("Success", "Your response has been published.");
      await fetchReviews();
    } catch (err: any) {
      setIsSubmittingReply(false);
      Alert.alert(
        "Reply Failed",
        err?.response?.data?.message || "Could not publish your response."
      );
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Product Reviews</Text>
        <View style={{ width: 32 }} />
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#003459" />
          <Text style={styles.loadingText}>Loading reviews...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {/* 2 Metric Cards Grid matching Web Article */}
          <View style={styles.metricsRow}>
            {/* Total Reviews */}
            <View style={styles.metricCard}>
              <View style={styles.metricIconWrap}>
                <MessageSquare size={18} color="#003459" />
              </View>
              <View style={styles.metricContent}>
                <Text style={styles.metricLabel}>Total Reviews</Text>
                <Text style={styles.metricValue}>{totalReviews}</Text>
              </View>
            </View>

            {/* Recent Reviews (Last 30 Days) */}
            <View style={styles.metricCard}>
              <View style={styles.metricIconWrap}>
                <Star size={18} color="#003459" />
              </View>
              <View style={styles.metricContent}>
                <Text style={styles.metricLabel}>Recent Reviews (30d)</Text>
                <Text style={styles.metricValue}>{recentReviews}</Text>
              </View>
            </View>
          </View>

          {/* Search Bar & Sort Filter */}
          <View style={styles.controlsRow}>
            <View style={styles.searchBox}>
              <Search size={16} color="#9CA3AF" style={{ marginRight: 6 }} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by customer or product..."
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
                {sortOrder === "descending" ? "Newest" : "Oldest"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Reviews List */}
          {filteredReviews.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Star size={46} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>No reviews found</Text>
              <Text style={styles.emptySubtitle}>
                {searchTerm
                  ? "No reviews match your current search criteria."
                  : "Buyer feedback and product ratings will appear here."}
              </Text>
            </View>
          ) : (
            paginatedReviews.map((review) => {
              const reviewId = review._id || review.id;
              const customerName = review.user?.name || "Anonymous";
              const productName = review.product?.name || "Product";
              const productImage =
                review.variantDetails?.images?.[0]?.url ||
                review.product?.images?.[0]?.url ||
                null;
              const dateStr = formatDate(review.createdAt);
              const hasReplied = !!review.reply;

              return (
                <View key={reviewId} style={styles.reviewCard}>
                  {/* Card Header: Product Thumb + Title + Rating */}
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.productThumbWrap}>
                      {productImage ? (
                        <Image source={{ uri: productImage }} style={styles.productThumb} />
                      ) : (
                        <Package size={20} color="#9CA3AF" />
                      )}
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={styles.productTitleText} numberOfLines={1}>
                        {productName}
                      </Text>
                      <View style={styles.metaRow}>
                        <StarRating rating={Number(review.rating || 5)} />
                        <Text style={styles.ratingScoreText}>{review.rating}.0</Text>
                        <Text style={styles.dotSeparator}>•</Text>
                        <Text style={styles.dateText}>{dateStr}</Text>
                      </View>
                    </View>

                    {/* Status Badge */}
                    <View
                      style={[
                        styles.replyStatusBadge,
                        hasReplied ? styles.repliedBadge : styles.pendingBadge,
                      ]}
                    >
                      <Text
                        style={[
                          styles.replyStatusText,
                          hasReplied ? styles.repliedText : styles.pendingText,
                        ]}
                      >
                        {hasReplied ? "Replied" : "Pending"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.cardDivider} />

                  {/* Customer & Comment */}
                  <View style={styles.authorRow}>
                    <User size={13} color="#6B7280" />
                    <Text style={styles.authorName}>{customerName}</Text>
                  </View>

                  <Text style={styles.commentText} numberOfLines={3}>
                    "{review.comment || "No comment provided."}"
                  </Text>

                  {/* Store Reply Preview if available */}
                  {review.reply && (
                    <View style={styles.replyBox}>
                      <View style={styles.replyBoxHeader}>
                        <CheckCircle2 size={13} color="#059669" />
                        <Text style={styles.replyBoxTitle}>Your Store Response</Text>
                      </View>
                      <Text style={styles.replyBoxContent} numberOfLines={2}>
                        {typeof review.reply === "object" ? review.reply.content : review.reply}
                      </Text>
                    </View>
                  )}

                  <View style={styles.cardDivider} />

                  {/* Action Buttons: View Details & Reply */}
                  <View style={styles.cardActionRow}>
                    <TouchableOpacity
                      style={styles.viewDetailBtn}
                      onPress={() => {
                        setSelectedReview(review);
                        setDetailDialogOpen(true);
                      }}
                    >
                      <Eye size={14} color="#003459" />
                      <Text style={styles.viewDetailBtnText}>View Details</Text>
                    </TouchableOpacity>

                    {!hasReplied && (
                      <TouchableOpacity
                        style={styles.replyActionBtn}
                        onPress={() => {
                          setReplyTargetReview(review);
                          setReplyText("");
                          setReplyDialogOpen(true);
                        }}
                      >
                        <MessageSquare size={13} color="#FFFFFF" />
                        <Text style={styles.replyActionBtnText}>Reply</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })
          )}

          {/* Pagination Controls */}
          {filteredReviews.length > 0 && (
            <View style={styles.paginationRow}>
              <Text style={styles.paginationInfoText}>
                Showing {paginatedReviews.length} of {filteredReviews.length} reviews
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

      {/* REPLY REVIEW MODAL (1:1 with Web ReplyReviewDialog) */}
      <Modal
        visible={replyDialogOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setReplyDialogOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.replyModalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reply to Review</Text>
              <TouchableOpacity
                onPress={() => setReplyDialogOpen(false)}
                style={styles.modalCloseBtn}
              >
                <X size={18} color="#4B5563" />
              </TouchableOpacity>
            </View>

            {replyTargetReview && (
              <View style={styles.snippetCard}>
                <Text style={styles.snippetAuthor}>
                  Review by {replyTargetReview.user?.name || "Customer"}:
                </Text>
                <Text style={styles.snippetComment} numberOfLines={2}>
                  "{replyTargetReview.comment}"
                </Text>
              </View>
            )}

            <Text style={styles.replyInputLabel}>Your Response</Text>
            <TextInput
              style={styles.replyTextArea}
              multiline
              numberOfLines={4}
              placeholder="Enter your official response to this customer..."
              placeholderTextColor="#9CA3AF"
              value={replyText}
              onChangeText={setReplyText}
              textAlignVertical="top"
            />

            <View style={styles.modalFooterRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setReplyDialogOpen(false)}
                disabled={isSubmittingReply}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.submitReplyBtn, isSubmittingReply && styles.submitReplyBtnDisabled]}
                onPress={handleReplySubmit}
                disabled={isSubmittingReply}
              >
                {isSubmittingReply ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Send size={14} color="#FFFFFF" />
                    <Text style={styles.submitReplyBtnText}>Submit</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* VIEW REVIEW DETAILS MODAL (1:1 with Web ViewReviewDetails) */}
      <Modal
        visible={detailDialogOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setDetailDialogOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.detailModalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Review Details</Text>
              <TouchableOpacity
                onPress={() => setDetailDialogOpen(false)}
                style={styles.modalCloseBtn}
              >
                <X size={18} color="#4B5563" />
              </TouchableOpacity>
            </View>

            {selectedReview && (
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
                {/* Product & Reviewer Header */}
                <View style={styles.detailHeaderBlock}>
                  <View style={styles.detailThumbWrap}>
                    {selectedReview.product?.images?.[0]?.url ? (
                      <Image
                        source={{ uri: selectedReview.product.images[0].url }}
                        style={styles.productThumb}
                      />
                    ) : (
                      <Package size={28} color="#9CA3AF" />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.detailProductTitle}>
                      {selectedReview.product?.name || "Product"}
                    </Text>
                    <Text style={styles.detailAuthorText}>
                      Reviewed by: <Text style={{ fontWeight: "700" }}>{selectedReview.user?.name || "Customer"}</Text>
                    </Text>
                    <Text style={styles.detailDateText}>{formatDate(selectedReview.createdAt)}</Text>
                  </View>
                </View>

                {/* Rating Bar */}
                <View style={styles.detailRatingBar}>
                  <View style={styles.detailRatingLeft}>
                    <Text style={styles.detailRatingLabel}>Rating:</Text>
                    <StarRating rating={Number(selectedReview.rating || 5)} />
                    <Text style={styles.detailRatingVal}>{selectedReview.rating}.0</Text>
                  </View>
                  <View
                    style={[
                      styles.detailStatusPill,
                      {
                        backgroundColor:
                          selectedReview.status === "published" ? "#ECFDF5" : "#FEF3C7",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.detailStatusPillText,
                        {
                          color:
                            selectedReview.status === "published" ? "#059669" : "#D97706",
                        },
                      ]}
                    >
                      {selectedReview.status || "Published"}
                    </Text>
                  </View>
                </View>

                {/* Comment */}
                <View style={styles.detailCommentSection}>
                  {selectedReview.title ? (
                    <Text style={styles.detailReviewTitle}>{selectedReview.title}</Text>
                  ) : null}
                  <Text style={styles.detailCommentBody}>"{selectedReview.comment}"</Text>
                </View>

                {/* Attached Images if any */}
                {selectedReview.photos && selectedReview.photos.length > 0 && (
                  <View style={styles.attachedPhotosSection}>
                    <Text style={styles.attachedPhotosTitle}>Attached Photos</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ gap: 8 }}>
                      {selectedReview.photos.map((photo: any, pIdx: number) => (
                        <Image
                          key={photo._id || pIdx}
                          source={{ uri: photo.url }}
                          style={styles.reviewPhotoThumb}
                        />
                      ))}
                    </ScrollView>
                  </View>
                )}

                {/* Store Response Section */}
                {selectedReview.reply && (
                  <View style={styles.detailReplyCard}>
                    <View style={styles.detailReplyHeader}>
                      <CheckCircle2 size={14} color="#059669" />
                      <Text style={styles.detailReplyHeaderText}>Your Official Response</Text>
                    </View>
                    <Text style={styles.detailReplyBody}>
                      {typeof selectedReview.reply === "object"
                        ? selectedReview.reply.content
                        : selectedReview.reply}
                    </Text>
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* SORT ORDER MODAL */}
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
            <Text style={styles.sortModalTitle}>Sort Reviews</Text>
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
  metricsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  metricIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "rgba(0, 52, 89, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  metricContent: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 11,
    color: "#6B7280",
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  controlsRow: {
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
  reviewCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  productThumbWrap: {
    width: 42,
    height: 42,
    borderRadius: 6,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginRight: 10,
  },
  productThumb: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  productTitleText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  starsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingScoreText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#111827",
    marginLeft: 4,
  },
  dotSeparator: {
    marginHorizontal: 5,
    color: "#9CA3AF",
    fontSize: 11,
  },
  dateText: {
    fontSize: 11,
    color: "#6B7280",
  },
  replyStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  repliedBadge: {
    backgroundColor: "#ECFDF5",
  },
  pendingBadge: {
    backgroundColor: "#FFFBEB",
  },
  replyStatusText: {
    fontSize: 11,
    fontWeight: "700",
  },
  repliedText: {
    color: "#059669",
  },
  pendingText: {
    color: "#D97706",
  },
  cardDivider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginVertical: 10,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 4,
  },
  authorName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4B5563",
  },
  commentText: {
    fontSize: 12.5,
    color: "#1F2937",
    lineHeight: 18,
  },
  replyBox: {
    backgroundColor: "#F9FAFB",
    borderLeftWidth: 3,
    borderLeftColor: "#003459",
    padding: 8,
    borderRadius: 4,
    marginTop: 8,
  },
  replyBoxHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 2,
  },
  replyBoxTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#003459",
  },
  replyBoxContent: {
    fontSize: 11.5,
    color: "#4B5563",
    lineHeight: 16,
  },
  cardActionRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
  viewDetailBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  viewDetailBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#003459",
  },
  replyActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#003459",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  replyActionBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
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

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  replyModalCard: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 18,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  modalCloseBtn: {
    padding: 4,
  },
  snippetCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  snippetAuthor: {
    fontSize: 11,
    color: "#6B7280",
    marginBottom: 2,
  },
  snippetComment: {
    fontSize: 12,
    color: "#111827",
    fontStyle: "italic",
  },
  replyInputLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
  },
  replyTextArea: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    color: "#111827",
    minHeight: 100,
    marginBottom: 14,
  },
  modalFooterRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: "#F3F4F6",
  },
  cancelBtnText: {
    fontSize: 12.5,
    fontWeight: "600",
    color: "#4B5563",
  },
  submitReplyBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: "#003459",
    gap: 6,
  },
  submitReplyBtnDisabled: {
    opacity: 0.5,
  },
  submitReplyBtnText: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  // Detail Modal Styles
  detailModalCard: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 18,
  },
  detailHeaderBlock: {
    flexDirection: "row",
    gap: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    marginBottom: 12,
  },
  detailThumbWrap: {
    width: 54,
    height: 54,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  detailProductTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  detailAuthorText: {
    fontSize: 12,
    color: "#4B5563",
    marginTop: 2,
  },
  detailDateText: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 2,
  },
  detailRatingBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F9FAFB",
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  detailRatingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  detailRatingLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
  },
  detailRatingVal: {
    fontSize: 12,
    fontWeight: "700",
    color: "#111827",
  },
  detailStatusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  detailStatusPillText: {
    fontSize: 11,
    fontWeight: "700",
  },
  detailCommentSection: {
    marginBottom: 14,
  },
  detailReviewTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  detailCommentBody: {
    fontSize: 13,
    color: "#374151",
    lineHeight: 19,
  },
  attachedPhotosSection: {
    marginBottom: 14,
  },
  attachedPhotosTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
  },
  reviewPhotoThumb: {
    width: 64,
    height: 64,
    borderRadius: 6,
    marginRight: 8,
    backgroundColor: "#F3F4F6",
  },
  detailReplyCard: {
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    borderRadius: 8,
    padding: 12,
    marginTop: 4,
  },
  detailReplyHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  detailReplyHeaderText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#065F46",
  },
  detailReplyBody: {
    fontSize: 12.5,
    color: "#065F46",
    lineHeight: 18,
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
});
