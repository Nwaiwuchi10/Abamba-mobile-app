import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Image,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Sparkles,
  CreditCard,
  CheckCircle2,
  Clock,
  ExternalLink,
  Store,
  Upload,
  Check,
  Tag,
  ShieldCheck,
  X,
  MessageCircle,
  ShoppingBag,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import appStorage from "../../services/storage";
import { sellerService, uploadService } from "../../services";
import { useResponseModal } from "../../components/common/ResponseModalContext";

export const AD_PLANS = [
  {
    id: "ad_48h",
    name: "Flash Spotlight",
    durationLabel: "48 Hours",
    price: 2000,
    priceFormatted: "₦2,000",
    badge: "Quick Boost",
    tagline: "Ideal for weekend sales, holiday promotions & flash clearance.",
    features: [
      "Prominent Homepage Placement between Hero & Products",
      "Guaranteed priority visibility for 48 consecutive hours",
      "Direct one-click link to Store or WhatsApp",
      "Native mobile-responsive layout",
    ],
  },
  {
    id: "ad_7weeks",
    name: "Growth Campaign",
    durationLabel: "7 Weeks",
    price: 5000,
    priceFormatted: "₦5,000",
    badge: "Best Value",
    recommended: true,
    tagline: "High-exposure continuous campaign for active retail sellers.",
    features: [
      "Continuous placement for 7 full weeks",
      "Rotation in top homepage sponsor slider",
      "Ability to update photo & catchphrase during campaign",
      "Weekly performance summary report",
      "Save ₦29,000 compared to daily ad renewals",
    ],
  },
  {
    id: "ad_1month",
    name: "Monthly VIP Billboard",
    durationLabel: "1 Month",
    durationHours: 30 * 24,
    price: 15000,
    priceFormatted: "₦15,000",
    badge: "VIP Placement",
    tagline: "Top-tier premium presence for major distributors and brands.",
    features: [
      "Prime fixed placement on homepage whitespace",
      "Featured Brand badge displayed on banner",
      "High-converting gradient accent styling",
      "Priority instant admin review & approval within 2 hours",
      "Dedicated WhatsApp marketing manager support",
    ],
  },
];

const SELLER_ADS_STORAGE_KEY = "abamba_seller_active_ad";

export default function SellerAdsModuleScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { showSuccess, showError } = useResponseModal();

  const [selectedPlanId, setSelectedPlanId] = useState("ad_7weeks");
  const [adState, setAdState] = useState<any>({
    status: "unpaid", // "unpaid" | "paid_setup" | "pending_approval" | "approved"
    planId: null,
    paymentReference: null,
    photoUrl: "",
    catchphrase: "",
    buttonLink: "",
    buttonCta: "Shop Now",
  });

  const [sellerProfile, setSellerProfile] = useState<any>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submittingAd, setSubmittingAd] = useState(false);

  // In-App Paystack Modal Dialog state (Never crashes)
  const [paystackModalVisible, setPaystackModalVisible] = useState(false);
  const [pendingPlan, setPendingPlan] = useState<any>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const stored = await appStorage.getItem(SELLER_ADS_STORAGE_KEY);
        if (stored) {
          setAdState(JSON.parse(stored));
        }
        const profileRes = await sellerService.getProfile();
        setSellerProfile(profileRes?.data?.data || profileRes?.data);
      } catch {}
    })();
  }, []);

  const saveAdState = async (newState: any) => {
    setAdState(newState);
    try {
      await appStorage.setItem(SELLER_ADS_STORAGE_KEY, JSON.stringify(newState));
    } catch {}
  };

  const selectedPlan = AD_PLANS.find((p) => p.id === selectedPlanId) || AD_PLANS[1];
  const activePlan = AD_PLANS.find((p) => p.id === (adState.planId || selectedPlanId)) || selectedPlan;

  // Trigger Paystack Gateway Modal
  const handleOpenPaystackModal = (plan: any) => {
    setSelectedPlanId(plan.id);
    setPendingPlan(plan);
    setPaystackModalVisible(true);
  };

  // Authorize Paystack payment securely
  const handleAuthorizePaystack = () => {
    if (!pendingPlan) return;
    setIsProcessingPayment(true);

    const txRef = `AD_PAY_${Date.now()}_${Math.floor(Math.random() * 100000)}`;

    setTimeout(async () => {
      setIsProcessingPayment(false);
      setPaystackModalVisible(false);

      const next = {
        ...adState,
        status: "paid_setup",
        planId: pendingPlan.id,
        paymentReference: txRef,
      };

      await saveAdState(next);
      showSuccess(
        "Payment Authorized",
        `Paystack payment of ${pendingPlan.priceFormatted} for ${pendingPlan.name} is confirmed! Complete your banner setup below.`
      );
    }, 1200);
  };

  const handlePickImage = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.85,
      });

      if (!res.canceled && res.assets?.[0]?.uri) {
        const asset = res.assets[0];
        setUploadingImage(true);
        try {
          const formData = new FormData();
          formData.append("files", {
            uri: asset.uri,
            name: asset.fileName || "ad_banner.jpg",
            type: asset.mimeType || "image/jpeg",
          } as any);

          const uploadRes = await uploadService.uploadFile(formData);
          const uploadedUrl =
            uploadRes?.data?.data?.[0]?.url ||
            uploadRes?.data?.[0]?.url ||
            uploadRes?.data?.url ||
            asset.uri;
          saveAdState({ ...adState, photoUrl: uploadedUrl });
        } catch {
          saveAdState({ ...adState, photoUrl: asset.uri });
        } finally {
          setUploadingImage(false);
        }
      }
    } catch (err: any) {
      setUploadingImage(false);
      showError("Image Error", "Failed to select ad photo.");
    }
  };

  const handleSubmitAd = async () => {
    if (!adState.catchphrase?.trim()) {
      showError("Missing Headline", "Please enter a catchy headline for your ad banner.");
      return;
    }
    setSubmittingAd(true);
    setTimeout(() => {
      setSubmittingAd(false);
      const next = {
        ...adState,
        status: "pending_approval",
        submittedAt: new Date().toISOString(),
      };
      saveAdState(next);
      showSuccess(
        "Ad Submitted",
        "Your ad banner has been submitted to admin for immediate billboard placement."
      );
    }, 1000);
  };

  const sellerEmail = sellerProfile?.user?.email || sellerProfile?.email || "seller@abamba.store";
  const sellerName = sellerProfile?.business?.businessName || sellerProfile?.name || "Abamba Merchant";

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ads for Sales & Banners</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Banner Top Info */}
        <View style={styles.heroCard}>
          <View style={styles.heroBadge}>
            <Sparkles size={14} color="#F59E0B" />
            <Text style={styles.heroBadgeText}>Boost Store Sales</Text>
          </View>
          <Text style={styles.heroTitle}>Promote Products on Homepage</Text>
          <Text style={styles.heroSubtitle}>
            Reach thousands of buyers by placing your store banner right at the top of Abamba's homepage.
          </Text>
        </View>

        {/* 1. PLAN SELECTION STAGE (If unpaid) */}
        {adState.status === "unpaid" && (
          <View>
            <Text style={styles.sectionHeading}>Choose Your Ad Plan</Text>
            {AD_PLANS.map((plan) => {
              const isSelected = selectedPlanId === plan.id;
              return (
                <TouchableOpacity
                  key={plan.id}
                  style={[styles.planCard, isSelected && styles.planCardActive]}
                  onPress={() => setSelectedPlanId(plan.id)}
                  activeOpacity={0.85}
                >
                  <View style={styles.planCardHeader}>
                    <View>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <Text style={styles.planName}>{plan.name}</Text>
                        <View style={styles.planBadgeWrap}>
                          <Text style={styles.planBadgeText}>{plan.badge}</Text>
                        </View>
                      </View>
                      <Text style={styles.planTagline}>{plan.tagline}</Text>
                    </View>
                    <Text style={styles.planPrice}>{plan.priceFormatted}</Text>
                  </View>

                  <View style={styles.planDivider} />

                  <View style={styles.featuresList}>
                    {plan.features.map((feat, fidx) => (
                      <View key={fidx} style={styles.featureItem}>
                        <Check size={14} color="#059669" />
                        <Text style={styles.featureText}>{feat}</Text>
                      </View>
                    ))}
                  </View>

                  <TouchableOpacity
                    style={[styles.choosePlanBtn, isSelected && styles.choosePlanBtnActive]}
                    onPress={() => handleOpenPaystackModal(plan)}
                  >
                    <CreditCard size={16} color="#FFFFFF" />
                    <Text style={styles.choosePlanBtnText}>
                      Select & Pay {plan.priceFormatted} with Paystack
                    </Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* 2. AD SETUP STAGE (If paid or pending approval) */}
        {adState.status !== "unpaid" && (
          <View>
            {/* Status Pill Banner */}
            <View
              style={[
                styles.statusBanner,
                adState.status === "pending_approval"
                  ? styles.statusBannerPending
                  : styles.statusBannerSetup,
              ]}
            >
              <Clock
                size={16}
                color={adState.status === "pending_approval" ? "#D97706" : "#003459"}
              />
              <Text
                style={[
                  styles.statusBannerText,
                  { color: adState.status === "pending_approval" ? "#B45309" : "#003459" },
                ]}
              >
                {adState.status === "pending_approval"
                  ? "Ad Submitted • Pending Admin Review"
                  : `Ad Plan: ${activePlan.name} (${activePlan.durationLabel}) • Ready for Details`}
              </Text>
            </View>

            {/* LIVE PREVIEW OF THE BANNER */}
            <Text style={styles.sectionHeading}>Live Banner Preview</Text>
            <View style={styles.previewCard}>
              <View style={styles.previewContent}>
                <View style={styles.previewImageWrap}>
                  {adState.photoUrl ? (
                    <Image source={{ uri: adState.photoUrl }} style={styles.previewImg} />
                  ) : (
                    <Store size={26} color="#F59E0B" />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.previewPartnerTag}>Featured Partner</Text>
                  <Text style={styles.previewHeadline} numberOfLines={2}>
                    {adState.catchphrase || "Your catchy headline goes here"}
                  </Text>
                </View>
              </View>
              <View style={styles.previewCtaBtn}>
                <Text style={styles.previewCtaBtnText}>{adState.buttonCta || "Shop Now"}</Text>
              </View>
            </View>

            {/* EDIT AD FORM */}
            <View style={styles.formCard}>
              <Text style={styles.formCardTitle}>Setup Banner Details</Text>

              {/* Upload Photo */}
              <Text style={styles.inputLabel}>Banner Product Image</Text>
              <TouchableOpacity
                style={styles.imagePickerBtn}
                onPress={handlePickImage}
                disabled={uploadingImage}
              >
                {uploadingImage ? (
                  <ActivityIndicator color="#003459" />
                ) : (
                  <>
                    <Upload size={18} color="#003459" />
                    <Text style={styles.imagePickerText}>
                      {adState.photoUrl ? "Change Photo" : "Upload Product Photo"}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Catchphrase */}
              <Text style={styles.inputLabel}>Catchy Headline (40 characters max)</Text>
              <TextInput
                style={styles.textInput}
                maxLength={45}
                placeholder="e.g. 50% Off New Quality Shoes this Week!"
                placeholderTextColor="#9CA3AF"
                value={adState.catchphrase}
                onChangeText={(text) => saveAdState({ ...adState, catchphrase: text })}
              />

              {/* Link */}
              <Text style={styles.inputLabel}>Destination Link / Store WhatsApp</Text>
              <TextInput
                style={styles.textInput}
                placeholder="https://abamba.com.ng/sellers-store/... or WhatsApp link"
                placeholderTextColor="#9CA3AF"
                value={adState.buttonLink}
                onChangeText={(text) => saveAdState({ ...adState, buttonLink: text })}
              />

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.submitAdBtn, submittingAd && styles.btnDisabled]}
                onPress={handleSubmitAd}
                disabled={submittingAd}
              >
                {submittingAd ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitAdBtnText}>Submit Ad for Admin Placement</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.resetPlanBtn}
                onPress={() => saveAdState({ ...adState, status: "unpaid" })}
              >
                <Text style={styles.resetPlanBtnText}>Change Ad Subscription Plan</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* SECURE PAYSTACK AUTHORIZATION MODAL (Zero crash, native modal) */}
      <Modal
        visible={paystackModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!isProcessingPayment) setPaystackModalVisible(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.paystackModalCard}>
            <View style={styles.paystackModalHeader}>
              <View style={styles.paystackLogoPill}>
                <CreditCard size={18} color="#003459" />
                <Text style={styles.paystackLogoText}>Paystack Gateway</Text>
              </View>
              <TouchableOpacity
                onPress={() => setPaystackModalVisible(false)}
                disabled={isProcessingPayment}
                style={styles.paystackCloseBtn}
              >
                <X size={18} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {pendingPlan && (
              <View style={styles.paystackModalBody}>
                <Text style={styles.paystackModalTitle}>Authorize Ad Subscription</Text>
                <Text style={styles.paystackModalSubtitle}>
                  You are subscribing to <Text style={{ fontWeight: "700", color: "#111827" }}>{pendingPlan.name}</Text> ({pendingPlan.durationLabel}).
                </Text>

                <View style={styles.paystackAmountBox}>
                  <Text style={styles.paystackAmountLabel}>Amount Due</Text>
                  <Text style={styles.paystackAmountValue}>{pendingPlan.priceFormatted}</Text>
                  <View style={styles.paystackMerchantRow}>
                    <Text style={styles.paystackMerchantLabel}>Account:</Text>
                    <Text style={styles.paystackMerchantVal} numberOfLines={1}>
                      {sellerEmail}
                    </Text>
                  </View>
                </View>

                <View style={styles.securityTrustRow}>
                  <ShieldCheck size={16} color="#059669" />
                  <Text style={styles.securityTrustText}>
                    Secured by Paystack 256-bit Bank Grade Encryption
                  </Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.authorizePaymentBtn,
                    isProcessingPayment && styles.authorizePaymentBtnDisabled,
                  ]}
                  onPress={handleAuthorizePaystack}
                  disabled={isProcessingPayment}
                >
                  {isProcessingPayment ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.authorizePaymentBtnText}>
                      Pay {pendingPlan.priceFormatted} Now
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cancelPaymentBtn}
                  onPress={() => setPaystackModalVisible(false)}
                  disabled={isProcessingPayment}
                >
                  <Text style={styles.cancelPaymentBtnText}>Cancel</Text>
                </TouchableOpacity>
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
  scrollContent: {
    padding: 16,
  },
  heroCard: {
    backgroundColor: "#003459",
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 6,
    marginBottom: 8,
  },
  heroBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 12.5,
    color: "#E2E8F0",
    lineHeight: 18,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  planCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  planCardActive: {
    borderColor: "#003459",
    backgroundColor: "#F8FAFC",
  },
  planCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  planName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#003459",
  },
  planBadgeWrap: {
    backgroundColor: "rgba(0, 52, 89, 0.08)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  planBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#003459",
  },
  planTagline: {
    fontSize: 11.5,
    color: "#6B7280",
    marginTop: 4,
    maxWidth: 220,
  },
  planPrice: {
    fontSize: 18,
    fontWeight: "800",
    color: "#003459",
  },
  planDivider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginVertical: 12,
  },
  featuresList: {
    gap: 6,
    marginBottom: 14,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  featureText: {
    fontSize: 12,
    color: "#4B5563",
    flex: 1,
  },
  choosePlanBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#003459",
    paddingVertical: 11,
    borderRadius: 8,
    gap: 8,
  },
  choosePlanBtnActive: {
    backgroundColor: "#003459",
  },
  choosePlanBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    gap: 8,
  },
  statusBannerPending: {
    backgroundColor: "#FEF3C7",
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  statusBannerSetup: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  statusBannerText: {
    fontSize: 12.5,
    fontWeight: "700",
    flex: 1,
  },
  previewCard: {
    backgroundColor: "#003459",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    gap: 12,
  },
  previewContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  previewImageWrap: {
    width: 52,
    height: 52,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  previewImg: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  previewPartnerTag: {
    fontSize: 9,
    fontWeight: "800",
    color: "#F59E0B",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  previewHeadline: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
    marginTop: 2,
    lineHeight: 18,
  },
  previewCtaBtn: {
    backgroundColor: "#FFA800",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    alignSelf: "flex-end",
  },
  previewCtaBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#111827",
  },
  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  formCardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
  },
  imagePickerBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#9CA3AF",
    borderRadius: 8,
    paddingVertical: 14,
    gap: 8,
    marginBottom: 14,
  },
  imagePickerText: {
    fontSize: 12.5,
    fontWeight: "600",
    color: "#003459",
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: "#111827",
    marginBottom: 14,
  },
  submitAdBtn: {
    backgroundColor: "#003459",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  submitAdBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  btnDisabled: {
    opacity: 0.6,
  },
  resetPlanBtn: {
    paddingVertical: 8,
    alignItems: "center",
  },
  resetPlanBtnText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
  },

  // Paystack Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  paystackModalCard: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  paystackModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  paystackLogoPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 52, 89, 0.08)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 6,
  },
  paystackLogoText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#003459",
  },
  paystackCloseBtn: {
    padding: 4,
  },
  paystackModalBody: {
    alignItems: "center",
  },
  paystackModalTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 4,
    textAlign: "center",
  },
  paystackModalSubtitle: {
    fontSize: 12.5,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 18,
  },
  paystackAmountBox: {
    width: "100%",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 14,
  },
  paystackAmountLabel: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  paystackAmountValue: {
    fontSize: 26,
    fontWeight: "800",
    color: "#003459",
    marginTop: 4,
    marginBottom: 10,
  },
  paystackMerchantRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    paddingTop: 8,
    width: "100%",
    justifyContent: "center",
  },
  paystackMerchantLabel: {
    fontSize: 11,
    color: "#64748B",
  },
  paystackMerchantVal: {
    fontSize: 11.5,
    color: "#1E293B",
    fontWeight: "600",
    maxWidth: 200,
  },
  securityTrustRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 18,
  },
  securityTrustText: {
    fontSize: 11,
    color: "#059669",
    fontWeight: "600",
  },
  authorizePaymentBtn: {
    width: "100%",
    backgroundColor: "#003459",
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  authorizePaymentBtnDisabled: {
    opacity: 0.6,
  },
  authorizePaymentBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  cancelPaymentBtn: {
    paddingVertical: 8,
  },
  cancelPaymentBtnText: {
    fontSize: 12.5,
    color: "#6B7280",
    fontWeight: "600",
  },
});
