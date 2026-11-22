import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Image,
  Switch,
  Modal,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Upload,
  Plus,
  Trash2,
  Package,
  CheckCircle2,
  AlertCircle,
  Tag,
  DollarSign,
  Layers,
  Sparkles,
  ChevronDown,
  X,
  RefreshCw,
  Search,
  Check,
} from "lucide-react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import appStorage from "../../services/storage";
import {
  sellerService,
  uploadService,
  productService,
  aiService,
  adminService,
} from "../../services";
import { useResponseModal } from "../../components/common/ResponseModalContext";

const MAX_IMAGES = 5;
const INVENTORY_DRAFT_KEY = "addInventoryDraft";

export const PRODUCT_CATEGORIES = [
  "Gadgets & Accessories",
  "Jewelries & Accessories",
  "Home Appliances",
  "Wigs & Human Hair Bundles",
  "Room Deco & Lightings",
  "Hair Care Tools & Styling Accessories",
  "Bags & Footwears",
  "Skin Care & Cosmetics",
  "Perfumes & Deodorants",
  "Dental Care",
  "Foodstuffs & Medication",
  "School Items & Stationery",
  "Clothing & Underwears",
  "Ankara Materials & Styling",
  "Furniture",
  "Other",
];

export default function SellerAddProductScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { showSuccess, showError, showWarning } = useResponseModal();

  // Basic Details
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [bonusPrice, setBonusPrice] = useState("");
  const [quantity, setQuantity] = useState("10");
  const [weight, setWeight] = useState("");
  const [lowStockAlert, setLowStockAlert] = useState("2");
  const [category, setCategory] = useState("");
  const [featured, setFeatured] = useState(false);

  // Bonus Event status from platform settings
  const [isBonusActive, setIsBonusActive] = useState(false);

  // Image slots (1 Main + up to 4 Additional)
  const [images, setImages] = useState<any[]>([
    { name: "main_image_0", url: null, id: null, isMain: true, status: "idle" },
    { name: "add_image_1", url: null, id: null, isMain: false, status: "idle" },
    { name: "add_image_2", url: null, id: null, isMain: false, status: "idle" },
    { name: "add_image_3", url: null, id: null, isMain: false, status: "idle" },
    { name: "add_image_4", url: null, id: null, isMain: false, status: "idle" },
  ]);
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);

  // AI Generation states
  const [isGeneratingName, setIsGeneratingName] = useState(false);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);

  // Categories list & custom modal
  const [categories, setCategories] = useState<string[]>(PRODUCT_CATEGORIES);
  const [categoryDataList, setCategoryDataList] = useState<any[]>([]);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [newCategoryModalOpen, setNewCategoryModalOpen] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState("");
  const [categorySearch, setCategorySearch] = useState("");
  const [isSavingCategory, setIsSavingCategory] = useState(false);

  // Variants state
  const [enabledVariant, setEnabledVariant] = useState(false);
  const [variantOptions, setVariantOptions] = useState<any[]>([]);
  const [variantCombinations, setVariantCombinations] = useState<any[]>([]);
  const [showVariantTable, setShowVariantTable] = useState(false);
  const [newCustomOptionModal, setNewCustomOptionModal] = useState(false);
  const [customOptionName, setCustomOptionName] = useState("");

  // Direct Variant modal in Add Product (Matches AddVariantDialog)
  const [variantModalOpen, setVariantModalOpen] = useState(false);
  const [editingVariantIndex, setEditingVariantIndex] = useState<number | null>(null);
  const [manualVariantAttributes, setManualVariantAttributes] = useState<Record<string, string>>({ Color: "Default" });
  const [manualVariantNewAttrKey, setManualVariantNewAttrKey] = useState("");
  const [manualVariantNewAttrVal, setManualVariantNewAttrVal] = useState("");
  const [manualVariantPrice, setManualVariantPrice] = useState("");
  const [manualVariantPromoPrice, setManualVariantPromoPrice] = useState("");
  const [manualVariantQuantity, setManualVariantQuantity] = useState("10");
  const [manualVariantWeight, setManualVariantWeight] = useState("1");
  const [manualVariantSku, setManualVariantSku] = useState("");
  const [manualVariantHasImage, setManualVariantHasImage] = useState(false);
  const [manualVariantImageUrl, setManualVariantImageUrl] = useState<string | null>(null);
  const [uploadingVariantImage, setUploadingVariantImage] = useState(false);

  // Edit Product Mode State
  const params = useLocalSearchParams<{ productId?: string; id?: string }>();
  const editProductId = params?.productId || params?.id || null;
  const isEditing = Boolean(editProductId);
  const [isLoadingProduct, setIsLoadingProduct] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  // Load product if editing OR load draft
  useEffect(() => {
    (async () => {
      // 1. Fetch categories (matching web: fetchCategoryOptions merged with PRODUCT_CATEGORIES)
      try {
        const catRes = await productService.getCategoryOptions();
        const raw = catRes?.data?.data || catRes?.data || [];
        setCategoryDataList(raw);
        const names = raw
          .map((item: any) => (typeof item === "string" ? item : item.category))
          .filter(Boolean);
        const merged = Array.from(new Set([...names, ...PRODUCT_CATEGORIES]));
        setCategories(merged);
      } catch (e) {
        console.warn("Could not load categories, fallback to defaults", e);
        setCategories(PRODUCT_CATEGORIES);
      }

      // 2. Fetch platform settings for bonus event
      try {
        const platRes = await adminService.getPlatformSettings();
        const bonusSetting =
          platRes?.data?.data?.systemPreferences?.bonusWeekEnabled ??
          platRes?.data?.systemPreferences?.bonusWeekEnabled;
        if (bonusSetting !== undefined) {
          setIsBonusActive(Boolean(bonusSetting));
        }
      } catch (e) {}

      // 3. If in edit mode, fetch live product from API
      if (editProductId) {
        try {
          setIsLoadingProduct(true);
          const res = await sellerService.getProductById(editProductId);
          const p = res?.data?.data || res?.data;
          if (p) {
            setName(p.name || "");
            setDescription(p.description || "");
            const bPrice = (p.basePrice ?? p.price ?? "").toString();
            setBasePrice(bPrice);
            const bonPrice = (p.bonusPrice !== undefined && p.bonusPrice !== null && p.bonusPrice !== "")
              ? p.bonusPrice.toString()
              : "";
            setBonusPrice(bonPrice);
            setQuantity((p.quantity ?? p.totalQuantity ?? "10").toString());
            setWeight(p.weight ? p.weight.toString() : "1");
            setLowStockAlert(p.lowStockAlert ? p.lowStockAlert.toString() : "2");
            setCategory(typeof p.category === "string" ? p.category : p.category?.name || "");
            setFeatured(Boolean(p.featured));

            // Set images
            if (Array.isArray(p.images) && p.images.length > 0) {
              const loadedSlots = [
                {
                  name: "main_image_0",
                  url: p.images[0]?.url || p.images[0] || null,
                  id: p.images[0]?._id || null,
                  isMain: true,
                  status: p.images[0]?.url ? "success" : "idle",
                },
                ...[1, 2, 3, 4].map((idx) => {
                  const img = p.images[idx];
                  return {
                    name: `add_image_${idx}`,
                    url: img?.url || img || null,
                    id: img?._id || null,
                    isMain: false,
                    status: img ? "success" : "idle",
                  };
                }),
              ];
              setImages(loadedSlots);
            }

            // Set variants
            if (Array.isArray(p.variants) && p.variants.length > 0) {
              setEnabledVariant(true);
              setShowVariantTable(true);
              const mappedVariants = p.variants.map((v: any, index: number) => ({
                id: v._id || v.id || `v_${index}`,
                attributes: v.attributes || { Variant: `Option ${index + 1}` },
                price: (v.price ?? bPrice).toString(),
                promoPrice: v.promoPrice ? v.promoPrice.toString() : "",
                quantity: (v.quantity ?? "5").toString(),
                weight: (v.weight ?? "1").toString(),
                sku: v.sku || `${(p.name || "PRD").slice(0, 3).toUpperCase()}-${index + 1}`,
                images: Array.isArray(v.images) && v.images.length > 0 ? v.images : [{ url: null }],
              }));
              setVariantCombinations(mappedVariants);
            }
          }
        } catch (err: any) {
          showError("Error Loading Product", err?.response?.data?.message || "Failed to fetch product details.");
        } finally {
          setIsLoadingProduct(false);
        }
      } else {
        // 4. If creating new product, load draft from storage
        try {
          const savedDraft = await appStorage.getItem(INVENTORY_DRAFT_KEY);
          if (savedDraft) {
            const parsed = JSON.parse(savedDraft);
            if (parsed.name) setName(parsed.name);
            if (parsed.description) setDescription(parsed.description);
            if (parsed.basePrice) setBasePrice(parsed.basePrice);
            if (parsed.bonusPrice) setBonusPrice(parsed.bonusPrice);
            if (parsed.quantity) setQuantity(parsed.quantity);
            if (parsed.weight) setWeight(parsed.weight);
            if (parsed.lowStockAlert) setLowStockAlert(parsed.lowStockAlert);
            if (parsed.category) setCategory(parsed.category);
            if (parsed.featured !== undefined) setFeatured(parsed.featured);
            if (parsed.enabledVariant !== undefined) setEnabledVariant(parsed.enabledVariant);
            if (Array.isArray(parsed.images) && parsed.images.length > 0) {
              setImages(parsed.images);
            }
            if (Array.isArray(parsed.variantOptions)) {
              setVariantOptions(parsed.variantOptions);
            }
            if (Array.isArray(parsed.variantCombinations)) {
              setVariantCombinations(parsed.variantCombinations);
              setShowVariantTable(true);
            }
          }
        } catch (e) {}
      }
    })();
  }, [editProductId]);

  // Auto-persist draft only when creating new product
  useEffect(() => {
    if (isEditing) return; // Do not overwrite draft when editing existing product
    const saveDraft = async () => {
      const draft = {
        name,
        description,
        basePrice,
        bonusPrice,
        quantity,
        weight,
        lowStockAlert,
        category,
        featured,
        images,
        enabledVariant,
        variantOptions,
        variantCombinations,
      };
      try {
        await appStorage.setItem(INVENTORY_DRAFT_KEY, JSON.stringify(draft));
      } catch (e) {}
    };
    saveDraft();
  }, [
    isEditing,
    name,
    description,
    basePrice,
    bonusPrice,
    quantity,
    weight,
    lowStockAlert,
    category,
    featured,
    images,
    enabledVariant,
    variantOptions,
    variantCombinations,
  ]);

  // Handle Image Upload for a slot
  const handleUploadImageSlot = async (slotIndex: number) => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.85,
      });

      if (!res.canceled && res.assets?.[0]?.uri) {
        const asset = res.assets[0];
        setUploadingSlot(slotIndex);

        try {
          const formData = new FormData();
          formData.append("files", {
            uri: asset.uri,
            name: asset.fileName || `product_img_${Date.now()}.jpg`,
            type: asset.mimeType || "image/jpeg",
          } as any);

          const uploadRes = await uploadService.uploadFile(formData);
          const uploadedUrl =
            uploadRes?.data?.data?.[0]?.url ||
            uploadRes?.data?.[0]?.url ||
            uploadRes?.data?.url ||
            asset.uri;
          const imageId = uploadRes?.data?.data?.[0]?._id || uploadRes?.data?.[0]?._id;

          setImages((prev) => {
            const copy = [...prev];
            copy[slotIndex] = {
              ...copy[slotIndex],
              url: uploadedUrl,
              id: imageId,
              status: "success",
            };
            return copy;
          });
        } catch (uploadErr) {
          // Fallback to local asset uri
          setImages((prev) => {
            const copy = [...prev];
            copy[slotIndex] = {
              ...copy[slotIndex],
              url: asset.uri,
              status: "success",
            };
            return copy;
          });
        } finally {
          setUploadingSlot(null);
        }
      }
    } catch (err: any) {
      setUploadingSlot(null);
      showError("Image Error", "Failed to select image from library.");
    }
  };

  const handleRemoveImageSlot = (slotIndex: number) => {
    setImages((prev) => {
      const copy = [...prev];
      copy[slotIndex] = {
        ...copy[slotIndex],
        url: null,
        id: null,
        status: "idle",
      };
      return copy;
    });
  };

  // AI Name Generator
  const handleAiGenerateName = async () => {
    const validImageUrls = images.filter((img) => img.url).map((img) => img.url);
    if (validImageUrls.length === 0) {
      showWarning("Upload Image First", "Please upload at least one product image before generating a name with AI.");
      return;
    }

    try {
      setIsGeneratingName(true);
      const res = await aiService.generateName({
        imageUrls: validImageUrls,
        category: category || undefined,
      });
      const generated =
        res?.data?.data?.name || res?.data?.data || res?.data?.name;
      if (generated) {
        setName(generated);
        showSuccess("AI Name Generated!", `Suggested: "${generated}"`);
      } else {
        showError("AI Notice", "Could not generate name. Please enter manually.");
      }
    } catch (err: any) {
      showError("AI Failed", err?.response?.data?.message || "AI name generation unavailable right now.");
    } finally {
      setIsGeneratingName(false);
    }
  };

  // AI Description Generator
  const handleAiGenerateDescription = async () => {
    if (!name.trim()) {
      showWarning("Title Required", "Please enter a product title first so AI can describe it.");
      return;
    }
    const validImageUrls = images.filter((img) => img.url).map((img) => img.url);
    if (validImageUrls.length === 0) {
      showWarning("Upload Image First", "Please upload at least one product image first.");
      return;
    }

    try {
      setIsGeneratingDescription(true);
      const res = await aiService.generateDescription({
        productName: name,
        imageUrls: validImageUrls,
        category: category || undefined,
      });
      const generated =
        res?.data?.data?.description || res?.data?.data || res?.data?.description;
      if (generated) {
        setDescription(generated);
        showSuccess("AI Description Generated!", "Product description successfully generated.");
      } else {
        showError("AI Notice", "Could not generate description. Please enter manually.");
      }
    } catch (err: any) {
      showError("AI Failed", err?.response?.data?.message || "AI description service unavailable.");
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  // Category change & initial variant options setup
  const handleSelectCategory = (catName: string) => {
    setCategory(catName);
    setCategoryDropdownOpen(false);

    const foundCategory = categoryDataList.find(
      (c) => (c.category || "").toLowerCase() === catName.toLowerCase()
    );
    const opts = foundCategory?.options || [
      { name: "Color", values: [], type: "text" },
      { name: "Size", values: [], type: "text" },
    ];
    setVariantOptions(
      opts.slice(0, 2).map((o: any) => ({
        name: o.name,
        values: [],
        type: o.type || "text",
      }))
    );
    setVariantCombinations([]);
  };

  // Create new category matching web CategorySelect
  const handleCreateNewCategory = async () => {
    const trimmed = newCategoryInput.trim();
    if (!trimmed) {
      showWarning("Category Name Required", "Please enter a category name (e.g. Skin Care & Cosmetics).");
      return;
    }

    try {
      setIsSavingCategory(true);
      const res = await productService.createNewCategory({
        category: trimmed,
        options: [],
      });
      const createdCategory =
        res?.data?.data?.category ||
        res?.data?.category ||
        trimmed;

      setCategories((prev) => {
        const exists = prev.some((c) => c.toLowerCase() === createdCategory.toLowerCase());
        return exists ? prev : [createdCategory, ...prev];
      });

      handleSelectCategory(createdCategory);
      showSuccess("Category Created", `Category "${createdCategory}" has been created and selected.`);
      setNewCategoryInput("");
      setNewCategoryModalOpen(false);
    } catch (err: any) {
      // Fallback: add locally if API is constrained
      setCategories((prev) => [trimmed, ...prev]);
      handleSelectCategory(trimmed);
      showSuccess("Category Added", `Category "${trimmed}" has been selected.`);
      setNewCategoryInput("");
      setNewCategoryModalOpen(false);
    } finally {
      setIsSavingCategory(false);
    }
  };

  // Add custom option (e.g. Material)
  const handleAddCustomOption = () => {
    if (!customOptionName.trim()) return;
    if (variantOptions.some((o) => o.name.toLowerCase() === customOptionName.trim().toLowerCase())) {
      showWarning("Option Exists", "This option name already exists.");
      return;
    }
    setVariantOptions((prev) => [
      ...prev,
      { name: customOptionName.trim(), values: [], type: "text" },
    ]);
    setCustomOptionName("");
    setNewCustomOptionModal(false);
  };

  const handleAddValueToOption = (optionName: string, val: string) => {
    if (!val.trim()) return;
    setVariantOptions((prev) =>
      prev.map((opt) =>
        opt.name === optionName && !opt.values.includes(val.trim())
          ? { ...opt, values: [...opt.values, val.trim()] }
          : opt
      )
    );
  };

  const handleRemoveValueFromOption = (optionName: string, valToRemove: string) => {
    setVariantOptions((prev) =>
      prev.map((opt) =>
        opt.name === optionName
          ? { ...opt, values: opt.values.filter((v: string) => v !== valToRemove) }
          : opt
      )
    );
  };

  // Generate Matrix Combinations
  const handleGenerateCombinations = () => {
    const activeOpts = variantOptions.filter((o) => o.values && o.values.length > 0);
    if (activeOpts.length === 0) {
      showWarning("Add Values", "Please add at least one value to generate variants (e.g. Red, Blue).");
      return;
    }

    const [first, ...rest] = activeOpts;
    let combos = first.values.map((v: string) => ({ [first.name]: v }));

    for (const opt of rest) {
      const nextCombos: any[] = [];
      for (const c of combos) {
        for (const val of opt.values) {
          nextCombos.push({ ...c, [opt.name]: val });
        }
      }
      combos = nextCombos;
    }

    const generated = combos.map((attrs: Record<string, string>) => {
      const id = Object.values(attrs).join("-");
      return {
        id,
        attributes: attrs,
        price: basePrice || "",
        quantity: "5",
        weight: weight || "1",
        sku: `${name.slice(0, 3).toUpperCase()}-${id.toUpperCase()}`,
        images: [{ url: null }, { url: null }],
      };
    });

    setVariantCombinations(generated);
    setShowVariantTable(true);
    showSuccess("Variants Generated", `Generated ${generated.length} variant combinations.`);
  };

  const handleUpdateCombination = (comboId: string, field: string, val: string) => {
    setVariantCombinations((prev) =>
      prev.map((c) => (c.id === comboId ? { ...c, [field]: val } : c))
    );
  };

  const handleRemoveCombination = (comboId: string) => {
    setVariantCombinations((prev) => prev.filter((c) => c.id !== comboId));
  };

  // Open Add/Edit Manual Variant Modal (Matches Web AddVariantDialog)
  const handleOpenAddVariantModal = () => {
    setEditingVariantIndex(null);
    setManualVariantAttributes({ Color: "Default" });
    setManualVariantPrice(basePrice || "");
    setManualVariantPromoPrice(bonusPrice || "");
    setManualVariantQuantity("10");
    setManualVariantWeight(weight || "1");
    setManualVariantSku(`${(name || "PRD").slice(0, 3).toUpperCase()}-V${Date.now().toString().slice(-4)}`);
    setManualVariantHasImage(false);
    setManualVariantImageUrl(null);
    setVariantModalOpen(true);
  };

  const handleOpenEditVariantModal = (index: number) => {
    const v = variantCombinations[index];
    if (!v) return;
    setEditingVariantIndex(index);
    setManualVariantAttributes(v.attributes ? { ...v.attributes } : { Option: "Default" });
    setManualVariantPrice(v.price?.toString() || basePrice || "");
    setManualVariantPromoPrice(v.promoPrice?.toString() || "");
    setManualVariantQuantity(v.quantity?.toString() || "10");
    setManualVariantWeight(v.weight?.toString() || weight || "1");
    setManualVariantSku(v.sku || "");
    const hasImg = Array.isArray(v.images) && v.images.length > 0 && Boolean(v.images[0]?.url);
    setManualVariantHasImage(hasImg);
    setManualVariantImageUrl(hasImg ? v.images[0].url : null);
    setVariantModalOpen(true);
  };

  const handlePickManualVariantImage = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });
      if (!res.canceled && res.assets && res.assets.length > 0) {
        const uri = res.assets[0].uri;
        setManualVariantImageUrl(uri);
        setManualVariantHasImage(true);
        setUploadingVariantImage(true);

        const formData = new FormData();
        const filename = uri.split("/").pop() || "variant.jpg";
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpeg`;

        formData.append("files", {
          uri,
          name: filename,
          type,
        } as any);

        try {
          const uploadRes = await uploadService.uploadFile(formData);
          const remoteUrl =
            uploadRes?.data?.data?.[0]?.url ||
            uploadRes?.data?.[0]?.url ||
            uploadRes?.data?.url;
          if (remoteUrl) {
            setManualVariantImageUrl(remoteUrl);
          }
        } catch {
          // keep uri
        } finally {
          setUploadingVariantImage(false);
        }
      }
    } catch {
      showError("Image Error", "Could not pick image for variant.");
      setUploadingVariantImage(false);
    }
  };

  const handleSaveManualVariant = () => {
    const numPrice = Number(manualVariantPrice);
    if (!numPrice || numPrice <= 0) {
      showWarning("Price Required", "Please enter a valid price for this variant.");
      return;
    }

    const newVariantItem: any = {
      id: editingVariantIndex !== null
        ? variantCombinations[editingVariantIndex]?.id || `var_${Date.now()}`
        : `var_${Date.now()}`,
      attributes: manualVariantAttributes,
      price: manualVariantPrice,
      quantity: manualVariantQuantity || "5",
      weight: manualVariantWeight || "1",
      sku: manualVariantSku || `${(name || "PRD").slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`,
      images: manualVariantHasImage && manualVariantImageUrl
        ? [{ url: manualVariantImageUrl, altText: manualVariantSku }]
        : [{ url: null }],
    };

    if (manualVariantPromoPrice) {
      newVariantItem.promoPrice = manualVariantPromoPrice;
    }

    if (editingVariantIndex !== null) {
      setVariantCombinations((prev) => {
        const copy = [...prev];
        copy[editingVariantIndex] = newVariantItem;
        return copy;
      });
      showSuccess("Variant Updated", "Variant details updated successfully.");
    } else {
      setVariantCombinations((prev) => [...prev, newVariantItem]);
      setShowVariantTable(true);
      showSuccess("Variant Added", "New variant added to product list.");
    }

    setVariantModalOpen(false);
  };

  // Submit Product to Store (Handles both CREATE and UPDATE)
  const handleSubmitProduct = async () => {
    const validUploadedImages = images.filter((img) => img.url).map((img) => ({
      url: img.url,
      altText: name,
    }));

    if (validUploadedImages.length === 0) {
      showWarning("Main Image Required", "Please upload at least the main product image.");
      return;
    }

    if (!name.trim()) {
      showWarning("Product Title Required", "Please enter a product title.");
      return;
    }

    const numBasePrice = Number(basePrice);
    if (!numBasePrice || isNaN(numBasePrice) || numBasePrice <= 0) {
      showWarning("Valid Price Required", "Please enter a valid base price.");
      return;
    }

    if (bonusPrice) {
      const numBonus = Number(bonusPrice);
      if (numBonus >= numBasePrice) {
        showWarning("Bonus Price Error", "Bonus price must be lower than the regular price.");
        return;
      }
    }

    if (enabledVariant && variantCombinations.length > 0) {
      const missing = variantCombinations.some(
        (c) => !c.price || Number(c.price) <= 0 || !c.quantity || Number(c.quantity) <= 0
      );
      if (missing) {
        showWarning("Variant Fields Required", "Please ensure every variant has a price and stock quantity.");
        return;
      }
    }

    try {
      setSubmitting(true);

      const payload: any = {
        name,
        description: description || name,
        price: numBasePrice,
        basePrice: numBasePrice,
        category: (category || categories[0] || "General").toLowerCase(),
        quantity: Math.min(Math.max(Number(quantity) || 1, 0), 50),
        weight: Number(weight) || 1,
        lowStockAlert: Number(lowStockAlert) || 2,
        featured,
        images: validUploadedImages,
      };

      if (bonusPrice && Number(bonusPrice) > 0) {
        payload.bonusPrice = Number(bonusPrice);
      } else {
        payload.bonusPrice = null;
      }

      if (enabledVariant && variantCombinations.length > 0) {
        payload.variants = variantCombinations.map((v) => ({
          attributes: v.attributes,
          price: Number(v.price) || numBasePrice,
          quantity: Math.min(Math.max(Number(v.quantity) || 1, 0), 50),
          weight: Number(v.weight) || 1,
          sku: v.sku || `${name.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`,
          images: (v.images || []).filter((img: any) => img?.url).map((img: any) => ({ url: img.url, altText: v.id })),
        }));
      }

      if (isEditing && editProductId) {
        await sellerService.updateProduct(editProductId, payload);
        showSuccess("Product Updated!", `Changes to "${name}" have been saved successfully.`);
      } else {
        await sellerService.createProduct(payload);
        // Clear draft upon successful creation
        await appStorage.removeItem(INVENTORY_DRAFT_KEY);
        showSuccess("Product Published!", `"${name}" was published to your store successfully.`);
      }

      setTimeout(() => {
        router.back();
      }, 1000);
    } catch (err: any) {
      showError(
        isEditing ? "Update Failed" : "Publish Failed",
        err?.response?.data?.message || "Could not save product changes to inventory."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditing ? "Edit Product" : "New Inventory Item"}
        </Text>
        <TouchableOpacity
          style={[styles.publishHeaderBtn, submitting && styles.btnDisabled]}
          onPress={handleSubmitProduct}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.publishHeaderBtnText}>
              {isEditing ? "Save Changes" : "Save & Publish"}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {isLoadingProduct ? (
        <View style={styles.loadingProductCenter}>
          <ActivityIndicator size="large" color="#003459" />
          <Text style={styles.loadingProductText}>Loading product details...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* SECTION 1: PRODUCT IMAGES (Exact layout from web) */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Product Image* (Main + Additional)</Text>
          <Text style={styles.cardSub}>
            Upload your main storefront cover photo and up to 4 additional gallery shots.
          </Text>

          {/* Main Image Slot */}
          <Text style={styles.slotLabel}>Main Product Cover *</Text>
          <TouchableOpacity
            style={styles.mainImageSlot}
            onPress={() => handleUploadImageSlot(0)}
            activeOpacity={0.8}
          >
            {images[0]?.url ? (
              <View style={styles.slotFilledWrap}>
                <Image source={{ uri: images[0].url }} style={styles.slotFullImg} resizeMode="cover" />
                <TouchableOpacity
                  style={styles.slotRemoveBtn}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleRemoveImageSlot(0);
                  }}
                >
                  <X size={16} color="#FFFFFF" />
                </TouchableOpacity>
                <View style={styles.mainBadge}>
                  <Text style={styles.mainBadgeText}>Main Cover</Text>
                </View>
              </View>
            ) : (
              <View style={styles.slotEmptyWrap}>
                {uploadingSlot === 0 ? (
                  <ActivityIndicator color="#003459" />
                ) : (
                  <>
                    <Upload size={32} color="#003459" />
                    <Text style={styles.slotEmptyTitle}>Upload Main Image</Text>
                    <Text style={styles.slotEmptySub}>Tap to browse photo</Text>
                  </>
                )}
              </View>
            )}
          </TouchableOpacity>

          {/* Additional Images (Slots 1 to 4) */}
          <Text style={[styles.slotLabel, { marginTop: 14 }]}>Additional Angles (Up to 4)</Text>
          <View style={styles.additionalGrid}>
            {[1, 2, 3, 4].map((idx) => {
              const slot = images[idx];
              const isUploadingThis = uploadingSlot === idx;

              return (
                <TouchableOpacity
                  key={idx}
                  style={styles.addSlotItem}
                  onPress={() => handleUploadImageSlot(idx)}
                  activeOpacity={0.8}
                >
                  {slot?.url ? (
                    <View style={styles.slotFilledWrap}>
                      <Image source={{ uri: slot.url }} style={styles.slotFullImg} resizeMode="cover" />
                      <TouchableOpacity
                        style={styles.slotRemoveBtn}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleRemoveImageSlot(idx);
                        }}
                      >
                        <X size={14} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.slotEmptyWrapSmall}>
                      {isUploadingThis ? (
                        <ActivityIndicator size="small" color="#003459" />
                      ) : (
                        <>
                          <Plus size={20} color="#9CA3AF" />
                          <Text style={styles.slotEmptySubSmall}>Slot {idx}</Text>
                        </>
                      )}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* SECTION 2: PRODUCT TITLE & AI GENERATOR */}
        <View style={styles.card}>
          <View style={styles.labelAiRow}>
            <Text style={styles.inputLabel}>Product Name *</Text>
            <TouchableOpacity
              style={styles.aiButtonPill}
              onPress={handleAiGenerateName}
              disabled={isGeneratingName}
              activeOpacity={0.8}
            >
              {isGeneratingName ? (
                <ActivityIndicator size="small" color="#003459" />
              ) : (
                <>
                  <Sparkles size={14} color="#003459" />
                  <Text style={styles.aiButtonPillText}>AI Suggest Name</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.textInput}
            placeholder="Product Name"
            placeholderTextColor="#9CA3AF"
            value={name}
            onChangeText={setName}
          />

          {/* Product Description & AI Generator */}
          <View style={[styles.labelAiRow, { marginTop: 12 }]}>
            <Text style={styles.inputLabel}>Product Description *</Text>
            <TouchableOpacity
              style={styles.aiButtonPill}
              onPress={handleAiGenerateDescription}
              disabled={isGeneratingDescription}
              activeOpacity={0.8}
            >
              {isGeneratingDescription ? (
                <ActivityIndicator size="small" color="#003459" />
              ) : (
                <>
                  <Sparkles size={14} color="#003459" />
                  <Text style={styles.aiButtonPillText}>AI Write Description</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            multiline
            numberOfLines={4}
            placeholder="Enter comprehensive product description, highlights and specifications..."
            placeholderTextColor="#9CA3AF"
            value={description}
            onChangeText={setDescription}
          />
        </View>

        {/* SECTION 3: PRICING & BONUS PROMO */}
        <View style={styles.card}>
          <Text style={styles.inputLabel}>Product Price (₦) *</Text>
          <TextInput
            style={styles.textInput}
            keyboardType="numeric"
            placeholder="Product Price (₦)"
            placeholderTextColor="#9CA3AF"
            value={basePrice}
            onChangeText={(txt) => setBasePrice(txt.replace(/[^\d]/g, ""))}
          />

          {/* Bonus Price Field */}
          <View style={{ marginTop: 10 }}>
            <View style={styles.bonusHeaderRow}>
              <Text style={styles.bonusLabel}>Bonus Price (₦)</Text>
              {isBonusActive ? (
                <View style={styles.bonusEventBadge}>
                  <Text style={styles.bonusEventBadgeText}>Bonus Event Active</Text>
                </View>
              ) : (
                <View style={styles.optionalBadge}>
                  <Text style={styles.optionalBadgeText}>Promo Price (Optional)</Text>
                </View>
              )}
            </View>
            <TextInput
              style={[styles.textInput, styles.bonusInput]}
              keyboardType="numeric"
              placeholder="Bonus Price (₦) — optional promotional price"
              placeholderTextColor="#9CA3AF"
              value={bonusPrice}
              onChangeText={(txt) => setBonusPrice(txt.replace(/[^\d]/g, ""))}
            />
            {bonusPrice && basePrice ? (
              <Text style={styles.pricePreviewHint}>
                Buyer will see:{" "}
                <Text style={{ fontWeight: "800", color: "#111827" }}>
                  ₦{Number(bonusPrice).toLocaleString()}
                </Text>{" "}
                <Text style={{ textDecorationLine: "line-through", color: "#9CA3AF" }}>
                  ₦{Number(basePrice).toLocaleString()}
                </Text>
              </Text>
            ) : (
              <Text style={styles.fieldHint}>
                Optional. Leave blank to upload at standard price.
              </Text>
            )}
          </View>
        </View>

        {/* SECTION 4: QUANTITY & WEIGHT */}
        <View style={styles.card}>
          <View style={styles.rowInputs}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.inputLabel}>Quantity (Max 50) *</Text>
              <TextInput
                style={styles.textInput}
                keyboardType="numeric"
                maxLength={2}
                placeholder="e.g. 50 (Max: 50)"
                placeholderTextColor="#9CA3AF"
                value={quantity}
                onChangeText={(txt) => setQuantity(txt.replace(/[^\d]/g, ""))}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.inputLabel}>Weight (kg)</Text>
              <TextInput
                style={styles.textInput}
                keyboardType="numeric"
                placeholder="kg"
                placeholderTextColor="#9CA3AF"
                value={weight}
                onChangeText={setWeight}
              />
            </View>
          </View>

          {/* Category Select & Low Stock Alert */}
          <View style={[styles.rowInputs, { marginTop: 10 }]}>
            <View style={{ flex: 1, marginRight: 8, zIndex: 10 }}>
              <View style={styles.categoryLabelRow}>
                <Text style={styles.inputLabel}>Category *</Text>
                <TouchableOpacity
                  onPress={() => setNewCategoryModalOpen(true)}
                  style={styles.addCategoryLinkBtn}
                >
                  <Plus size={13} color="#003459" />
                  <Text style={styles.addCategoryLinkText}>Add category</Text>
                </TouchableOpacity>
              </View>

              {/* In-Place Web-Exact Dropdown */}
              <TouchableOpacity
                style={[
                  styles.categorySelectBtn,
                  categoryDropdownOpen && styles.categorySelectBtnActive,
                ]}
                onPress={() => setCategoryDropdownOpen((prev) => !prev)}
                activeOpacity={0.8}
              >
                <Text
                  style={category ? styles.categorySelectedText : styles.categoryPlaceholderText}
                  numberOfLines={1}
                >
                  {category ? category.charAt(0).toUpperCase() + category.slice(1) : "Select category"}
                </Text>
                <ChevronDown
                  size={16}
                  color="#6B7280"
                  style={{ transform: [{ rotate: categoryDropdownOpen ? "180deg" : "0deg" }] }}
                />
              </TouchableOpacity>

              {/* Dropdown Menu List Box */}
              {categoryDropdownOpen && (
                <View style={styles.categoryDropdownMenu}>
                  {/* Search inside dropdown */}
                  <View style={styles.dropdownSearchWrap}>
                    <Search size={14} color="#9CA3AF" style={{ marginRight: 6 }} />
                    <TextInput
                      style={styles.dropdownSearchInput}
                      placeholder="Search category..."
                      placeholderTextColor="#9CA3AF"
                      value={categorySearch}
                      onChangeText={setCategorySearch}
                    />
                    {categorySearch.length > 0 && (
                      <TouchableOpacity onPress={() => setCategorySearch("")}>
                        <X size={14} color="#9CA3AF" />
                      </TouchableOpacity>
                    )}
                  </View>

                  <ScrollView
                    nestedScrollEnabled={true}
                    style={{ maxHeight: 220 }}
                    showsVerticalScrollIndicator={true}
                  >
                    {/* Add New Category Option inside Dropdown (Web exact: + Add New Category) */}
                    <TouchableOpacity
                      style={styles.dropdownAddItem}
                      onPress={() => {
                        setCategoryDropdownOpen(false);
                        setNewCategoryModalOpen(true);
                      }}
                    >
                      <Plus size={15} color="#003459" />
                      <Text style={styles.dropdownAddItemText}>+ Add New Category</Text>
                    </TouchableOpacity>

                    {categories
                      .filter((c) => c.toLowerCase().includes(categorySearch.toLowerCase()))
                      .map((cat, idx) => {
                        const isSelected = category.toLowerCase() === cat.toLowerCase();
                        return (
                          <TouchableOpacity
                            key={idx}
                            style={[
                              styles.dropdownItem,
                              isSelected && styles.dropdownItemSelected,
                            ]}
                            onPress={() => handleSelectCategory(cat)}
                          >
                            <Text
                              style={[
                                styles.dropdownItemText,
                                isSelected && styles.dropdownItemTextSelected,
                              ]}
                            >
                              {cat.charAt(0).toUpperCase() + cat.slice(1)}
                            </Text>
                            {isSelected && <Check size={16} color="#003459" />}
                          </TouchableOpacity>
                        );
                      })}
                  </ScrollView>
                </View>
              )}
            </View>

            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.inputLabel}>Low Stock Alert (1 or 2)</Text>
              <TextInput
                style={styles.textInput}
                keyboardType="numeric"
                maxLength={1}
                placeholder="2"
                placeholderTextColor="#9CA3AF"
                value={lowStockAlert}
                onChangeText={setLowStockAlert}
              />
            </View>
          </View>

          {/* Featured on store homepage */}
          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.switchTitle}>Featured</Text>
              <Text style={styles.switchSub}>
                Featured products will be highlighted on your store's homepage.
              </Text>
            </View>
            <Switch value={featured} onValueChange={setFeatured} trackColor={{ true: "#003459" }} />
          </View>
        </View>

        {/* SECTION 5: VARIANTS MANAGER & MATRIX */}
        <View style={styles.card}>
          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.switchTitle}>Variant</Text>
              <Text style={styles.switchSub}>
                Add color, size or custom variants for this product
              </Text>
            </View>
            <Switch
              disabled={!category}
              value={enabledVariant}
              onValueChange={(val) => {
                if (!category) {
                  showWarning("Select Category", "Please select a category first before enabling variants.");
                  return;
                }
                setEnabledVariant(val);
              }}
              trackColor={{ true: "#003459" }}
            />
          </View>

          {enabledVariant && (
            <View style={{ marginTop: 14 }}>
              {/* Option / Variant Header Actions */}
              <View style={styles.optionsHeaderRow}>
                <View>
                  <Text style={styles.optionsHeaderTitle}>Variant Management</Text>
                  <Text style={styles.optionsHeaderSub}>
                    Generate combinations or add individual variants
                  </Text>
                </View>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <TouchableOpacity
                    style={styles.addDirectVariantBtn}
                    onPress={handleOpenAddVariantModal}
                  >
                    <Plus size={14} color="#FFFFFF" />
                    <Text style={styles.addDirectVariantBtnText}>Add Variant</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.addOptionBtn}
                    onPress={() => setNewCustomOptionModal(true)}
                  >
                    <Plus size={14} color="#003459" />
                    <Text style={styles.addOptionBtnText}>Add Option</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {variantOptions.map((opt, oIdx) => (
                <View key={oIdx} style={styles.optionBox}>
                  <View style={styles.optionBoxTop}>
                    <Text style={styles.optionBoxName}>{opt.name}</Text>
                    <TouchableOpacity
                      onPress={() =>
                        setVariantOptions((prev) => prev.filter((_, idx) => idx !== oIdx))
                      }
                    >
                      <Trash2 size={15} color="#EF4444" />
                    </TouchableOpacity>
                  </View>

                  {/* Chips of added values */}
                  <View style={styles.chipsRow}>
                    {opt.values.map((val: string, vIdx: number) => (
                      <View key={vIdx} style={styles.valueChip}>
                        <Text style={styles.valueChipText}>{val}</Text>
                        <TouchableOpacity
                          onPress={() => handleRemoveValueFromOption(opt.name, val)}
                        >
                          <X size={12} color="#003459" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>

                  {/* Add value input */}
                  <View style={styles.addValueRow}>
                    <TextInput
                      style={styles.addValueInput}
                      placeholder={`Add ${opt.name} (e.g. ${opt.name === "Color" ? "Black" : "XL"})`}
                      placeholderTextColor="#9CA3AF"
                      onSubmitEditing={(e) => {
                        handleAddValueToOption(opt.name, e.nativeEvent.text);
                      }}
                    />
                  </View>
                </View>
              ))}

              {/* Action Buttons: Generate Matrix & Add Single Variant */}
              <View style={styles.variantActionButtonsRow}>
                <TouchableOpacity
                  style={[styles.generateCombosBtn, { flex: 1, marginRight: 6 }]}
                  onPress={handleGenerateCombinations}
                >
                  <Layers size={15} color="#FFFFFF" />
                  <Text style={styles.generateCombosBtnText}>Generate Matrix</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.directAddFormBtn, { flex: 1, marginLeft: 6 }]}
                  onPress={handleOpenAddVariantModal}
                >
                  <Plus size={15} color="#003459" />
                  <Text style={styles.directAddFormBtnText}>+ Add Variant Item</Text>
                </TouchableOpacity>
              </View>

              {/* Variants Pricing Table / List */}
              {showVariantTable && variantCombinations.length > 0 && (
                <View style={styles.combinationsContainer}>
                  <View style={styles.combinationsHeaderRow}>
                    <Text style={styles.combinationsHeading}>
                      Configured Variants ({variantCombinations.length})
                    </Text>
                    <TouchableOpacity onPress={handleOpenAddVariantModal}>
                      <Text style={styles.addAnotherLinkText}>+ Add Variant</Text>
                    </TouchableOpacity>
                  </View>

                  {variantCombinations.map((combo, comboIdx) => {
                    const comboImg =
                      Array.isArray(combo.images) &&
                      combo.images.length > 0 &&
                      combo.images[0]?.url
                        ? combo.images[0].url
                        : null;

                    return (
                      <View key={combo.id || comboIdx} style={styles.comboItemCard}>
                        <View style={styles.comboItemHeader}>
                          <View style={{ flexDirection: "row", alignItems: "center", flex: 1, gap: 8 }}>
                            {comboImg ? (
                              <Image source={{ uri: comboImg }} style={styles.comboThumbImg} />
                            ) : (
                              <View style={styles.comboThumbPlaceholder}>
                                <Package size={14} color="#9CA3AF" />
                              </View>
                            )}
                            <View style={{ flex: 1 }}>
                              <Text style={styles.comboAttributesTitle} numberOfLines={1}>
                                {typeof combo.attributes === "object"
                                  ? Object.entries(combo.attributes)
                                      .map(([k, v]) => `${k}: ${v}`)
                                      .join(" / ")
                                  : "Default Variant"}
                              </Text>
                              {combo.sku ? (
                                <Text style={styles.comboSkuSub}>SKU: {combo.sku}</Text>
                              ) : null}
                            </View>
                          </View>

                          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                            <TouchableOpacity onPress={() => handleOpenEditVariantModal(comboIdx)}>
                              <Text style={styles.comboEditLinkText}>Edit</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleRemoveCombination(combo.id)}>
                              <Trash2 size={16} color="#EF4444" />
                            </TouchableOpacity>
                          </View>
                        </View>

                        <View style={styles.rowInputs}>
                          <View style={{ flex: 1, marginRight: 6 }}>
                            <Text style={styles.fieldLabelSmall}>Price (₦)</Text>
                            <TextInput
                              style={styles.comboInput}
                              keyboardType="numeric"
                              value={combo.price}
                              placeholder={basePrice || "0"}
                              onChangeText={(t) => handleUpdateCombination(combo.id, "price", t)}
                            />
                          </View>
                          <View style={{ flex: 1, marginLeft: 6 }}>
                            <Text style={styles.fieldLabelSmall}>Quantity</Text>
                            <TextInput
                              style={styles.comboInput}
                              keyboardType="numeric"
                              value={combo.quantity}
                              placeholder="5"
                              onChangeText={(t) => handleUpdateCombination(combo.id, "quantity", t)}
                            />
                          </View>
                        </View>

                        <View style={[styles.rowInputs, { marginTop: 6 }]}>
                          <View style={{ flex: 1, marginRight: 6 }}>
                            <Text style={styles.fieldLabelSmall}>Weight (kg)</Text>
                            <TextInput
                              style={styles.comboInput}
                              keyboardType="numeric"
                              value={combo.weight}
                              placeholder="1"
                              onChangeText={(t) => handleUpdateCombination(combo.id, "weight", t)}
                            />
                          </View>
                          <View style={{ flex: 1, marginLeft: 6 }}>
                            <Text style={styles.fieldLabelSmall}>SKU</Text>
                            <TextInput
                              style={styles.comboInput}
                              value={combo.sku}
                              placeholder="SKU"
                              onChangeText={(t) => handleUpdateCombination(combo.id, "sku", t)}
                            />
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          )}
        </View>

        {/* BOTTOM SAVE & PUBLISH HERO BUTTON */}
        <TouchableOpacity
          style={[styles.publishHeroBtn, submitting && styles.btnDisabled]}
          onPress={handleSubmitProduct}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.publishHeroBtnText}>
              {isEditing ? "Save Product Changes" : "Save & Publish Product"}
            </Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 60 }} />
      </ScrollView>
      )}

      {/* ADD / EDIT INDIVIDUAL VARIANT MODAL (Matches Web AddVariantDialog) */}
      <Modal
        visible={variantModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (!uploadingVariantImage) setVariantModalOpen(false);
        }}
      >
        <View style={styles.variantModalBackdrop}>
          <View style={styles.variantModalCard}>
            <View style={styles.variantModalHeader}>
              <View>
                <Text style={styles.variantModalTitle}>
                  {editingVariantIndex !== null ? "Edit Variant" : "Add Product Variant"}
                </Text>
                <Text style={styles.variantModalSub}>
                  Configure attributes, price, stock & variant photo
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setVariantModalOpen(false)}
                disabled={uploadingVariantImage}
                style={{ padding: 4 }}
              >
                <X size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 440 }}>
              {/* Attributes Map */}
              <Text style={styles.formSectionLabel}>Attributes</Text>
              {Object.entries(manualVariantAttributes).map(([k, v]) => (
                <View key={k} style={styles.attrInputRow}>
                  <Text style={styles.attrKeyLabel}>{k}:</Text>
                  <TextInput
                    style={styles.attrValInput}
                    value={v}
                    placeholder={`e.g. ${k === "Color" ? "Blue" : "XL"}`}
                    placeholderTextColor="#9CA3AF"
                    onChangeText={(txt) =>
                      setManualVariantAttributes((prev) => ({ ...prev, [k]: txt }))
                    }
                  />
                  <TouchableOpacity
                    onPress={() => {
                      setManualVariantAttributes((prev) => {
                        const copy = { ...prev };
                        delete copy[k];
                        return copy;
                      });
                    }}
                    style={{ padding: 4 }}
                  >
                    <X size={16} color="#DC2626" />
                  </TouchableOpacity>
                </View>
              ))}

              {/* Add Custom Attribute Row */}
              <View style={styles.addCustomAttrRow}>
                <TextInput
                  style={[styles.attrValInput, { flex: 1, marginRight: 6 }]}
                  placeholder="Attribute (e.g. Size)"
                  placeholderTextColor="#9CA3AF"
                  value={manualVariantNewAttrKey}
                  onChangeText={setManualVariantNewAttrKey}
                />
                <TextInput
                  style={[styles.attrValInput, { flex: 1, marginRight: 6 }]}
                  placeholder="Value (e.g. XL)"
                  placeholderTextColor="#9CA3AF"
                  value={manualVariantNewAttrVal}
                  onChangeText={setManualVariantNewAttrVal}
                />
                <TouchableOpacity
                  style={styles.addAttrPillBtn}
                  onPress={() => {
                    if (manualVariantNewAttrKey.trim() && manualVariantNewAttrVal.trim()) {
                      setManualVariantAttributes((prev) => ({
                        ...prev,
                        [manualVariantNewAttrKey.trim()]: manualVariantNewAttrVal.trim(),
                      }));
                      setManualVariantNewAttrKey("");
                      setManualVariantNewAttrVal("");
                    }
                  }}
                >
                  <Plus size={14} color="#003459" />
                </TouchableOpacity>
              </View>

              {/* Pricing & Stock Fields */}
              <View style={styles.modalFieldsRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.fieldLabel}>Price (₦) *</Text>
                  <TextInput
                    style={styles.modalTextInput}
                    keyboardType="numeric"
                    placeholder="Variant Price"
                    placeholderTextColor="#9CA3AF"
                    value={manualVariantPrice}
                    onChangeText={(t) => setManualVariantPrice(t.replace(/[^\d]/g, ""))}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.fieldLabel}>Promo Price (₦)</Text>
                  <TextInput
                    style={styles.modalTextInput}
                    keyboardType="numeric"
                    placeholder="Optional Promo"
                    placeholderTextColor="#9CA3AF"
                    value={manualVariantPromoPrice}
                    onChangeText={(t) => setManualVariantPromoPrice(t.replace(/[^\d]/g, ""))}
                  />
                </View>
              </View>

              <View style={styles.modalFieldsRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.fieldLabel}>Quantity in Stock *</Text>
                  <TextInput
                    style={styles.modalTextInput}
                    keyboardType="numeric"
                    placeholder="Quantity"
                    placeholderTextColor="#9CA3AF"
                    value={manualVariantQuantity}
                    onChangeText={(t) => setManualVariantQuantity(t.replace(/[^\d]/g, ""))}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.fieldLabel}>SKU / Code</Text>
                  <TextInput
                    style={styles.modalTextInput}
                    placeholder="e.g. PRD-XL-01"
                    placeholderTextColor="#9CA3AF"
                    value={manualVariantSku}
                    onChangeText={setManualVariantSku}
                  />
                </View>
              </View>

              {/* Add Variant Specific Image Switch (Web exact) */}
              <View style={styles.variantImageSwitchRow}>
                <View>
                  <Text style={styles.switchTitle}>Add Image to Variant</Text>
                  <Text style={styles.switchSub}>
                    Upload specific photo for this color or style
                  </Text>
                </View>
                <Switch
                  value={manualVariantHasImage}
                  onValueChange={setManualVariantHasImage}
                  trackColor={{ false: "#D1D5DB", true: "#003459" }}
                />
              </View>

              {manualVariantHasImage && (
                <View style={styles.variantImagePickerCard}>
                  {manualVariantImageUrl ? (
                    <View style={styles.variantPreviewWrap}>
                      <Image
                        source={{ uri: manualVariantImageUrl }}
                        style={styles.variantPickerImg}
                      />
                      <TouchableOpacity
                        style={styles.variantRemoveImgBtn}
                        onPress={() => setManualVariantImageUrl(null)}
                      >
                        <X size={14} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.variantPickBtn}
                      onPress={handlePickManualVariantImage}
                      disabled={uploadingVariantImage}
                    >
                      {uploadingVariantImage ? (
                        <ActivityIndicator size="small" color="#003459" />
                      ) : (
                        <>
                          <Plus size={20} color="#003459" />
                          <Text style={styles.variantPickBtnText}>Select Image File</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </ScrollView>

            {/* Modal Actions */}
            <View style={styles.variantModalFooter}>
              <TouchableOpacity
                style={styles.variantCancelBtn}
                onPress={() => setVariantModalOpen(false)}
              >
                <Text style={styles.variantCancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.variantSaveBtn}
                onPress={handleSaveManualVariant}
              >
                <Text style={styles.variantSaveBtnText}>
                  {editingVariantIndex !== null ? "Save Changes" : "Save Variant"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ADD NEW CATEGORY PROMPT MODAL */}
      <Modal
        visible={newCategoryModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!isSavingCategory) setNewCategoryModalOpen(false);
        }}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.promptCard}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <Text style={styles.promptTitle}>Add New Category</Text>
              <TouchableOpacity
                onPress={() => setNewCategoryModalOpen(false)}
                disabled={isSavingCategory}
                style={{ padding: 4 }}
              >
                <X size={18} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <Text style={styles.promptSub}>
              Enter a new product category name (e.g. Skin Care & Cosmetics, Home Appliances)
            </Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Skin Care & Cosmetics"
              placeholderTextColor="#9CA3AF"
              value={newCategoryInput}
              onChangeText={setNewCategoryInput}
              editable={!isSavingCategory}
              autoFocus
            />
            <View style={styles.promptBtnRow}>
              <TouchableOpacity
                style={styles.promptCancelBtn}
                onPress={() => setNewCategoryModalOpen(false)}
                disabled={isSavingCategory}
              >
                <Text style={styles.promptCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.promptSaveBtn,
                  (!newCategoryInput.trim() || isSavingCategory) && { opacity: 0.6 },
                ]}
                onPress={handleCreateNewCategory}
                disabled={!newCategoryInput.trim() || isSavingCategory}
              >
                {isSavingCategory ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.promptSaveText}>Save Category</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ADD CUSTOM OPTION MODAL */}
      <Modal
        visible={newCustomOptionModal}
        transparent
        animationType="fade"
        onRequestClose={() => setNewCustomOptionModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.promptCard}>
            <Text style={styles.promptTitle}>Add Custom Variant Option</Text>
            <Text style={styles.promptSub}>Enter the option name (e.g. Material, Scent, Style)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Option Name"
              placeholderTextColor="#9CA3AF"
              value={customOptionName}
              onChangeText={setCustomOptionName}
            />
            <View style={styles.promptBtnRow}>
              <TouchableOpacity
                style={styles.promptCancelBtn}
                onPress={() => setNewCustomOptionModal(false)}
              >
                <Text style={styles.promptCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.promptSaveBtn} onPress={handleAddCustomOption}>
                <Text style={styles.promptSaveText}>Add Option</Text>
              </TouchableOpacity>
            </View>
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
  publishHeaderBtn: {
    backgroundColor: "#003459",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  publishHeaderBtnText: {
    color: "#FFFFFF",
    fontSize: 12.5,
    fontWeight: "700",
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111827",
  },
  cardSub: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
    marginBottom: 12,
    lineHeight: 17,
  },
  slotLabel: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 6,
  },
  mainImageSlot: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "#CBD5E1",
    overflow: "hidden",
    backgroundColor: "#F9FAFB",
  },
  slotFilledWrap: {
    width: "100%",
    height: "100%",
    position: "relative",
  },
  slotFullImg: {
    width: "100%",
    height: "100%",
  },
  slotRemoveBtn: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "rgba(0,0,0,0.65)",
    padding: 5,
    borderRadius: 6,
    zIndex: 10,
  },
  mainBadge: {
    position: "absolute",
    bottom: 8,
    left: 8,
    backgroundColor: "#003459",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  mainBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
  },
  slotEmptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  slotEmptyTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#003459",
    marginTop: 4,
  },
  slotEmptySub: {
    fontSize: 11,
    color: "#9CA3AF",
  },
  additionalGrid: {
    flexDirection: "row",
    gap: 8,
  },
  addSlotItem: {
    flex: 1,
    height: 74,
    borderRadius: 10,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "#CBD5E1",
    overflow: "hidden",
    backgroundColor: "#F9FAFB",
  },
  slotEmptyWrapSmall: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  slotEmptySubSmall: {
    fontSize: 10,
    color: "#9CA3AF",
    marginTop: 2,
  },
  labelAiRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#374151",
  },
  aiButtonPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F9FF",
    borderWidth: 1,
    borderColor: "#BAE6FD",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  aiButtonPillText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#003459",
  },
  textInput: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 46,
    fontSize: 13.5,
    color: "#111827",
  },
  textArea: {
    height: 90,
    textAlignVertical: "top",
    paddingTop: 10,
  },
  bonusHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  bonusLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#EA580C",
  },
  bonusEventBadge: {
    backgroundColor: "#FFEDD5",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  bonusEventBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#C2410C",
  },
  optionalBadge: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  optionalBadgeText: {
    fontSize: 10,
    color: "#6B7280",
  },
  bonusInput: {
    borderColor: "#FDBA74",
    backgroundColor: "#FFF7ED",
  },
  pricePreviewHint: {
    fontSize: 12,
    color: "#4B5563",
    marginTop: 4,
  },
  fieldHint: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 4,
  },
  rowInputs: {
    flexDirection: "row",
  },
  categoryLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  addCategoryLinkBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  addCategoryLinkText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#003459",
  },
  categorySelectBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 46,
  },
  categorySelectBtnActive: {
    borderColor: "#003459",
    backgroundColor: "#FFFFFF",
  },
  categoryDropdownMenu: {
    position: "absolute",
    top: 76,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 9999,
    padding: 8,
  },
  dropdownSearchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    paddingHorizontal: 8,
    height: 36,
    marginBottom: 6,
  },
  dropdownSearchInput: {
    flex: 1,
    fontSize: 12.5,
    color: "#111827",
    paddingVertical: 0,
  },
  dropdownAddItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: "rgba(0, 52, 89, 0.05)",
    marginBottom: 4,
  },
  dropdownAddItemText: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#003459",
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  dropdownItemSelected: {
    backgroundColor: "#F3F4F6",
  },
  dropdownItemText: {
    fontSize: 13,
    color: "#374151",
  },
  dropdownItemTextSelected: {
    fontWeight: "700",
    color: "#003459",
  },
  categorySelectedText: {
    fontSize: 13.5,
    fontWeight: "600",
    color: "#111827",
  },
  categoryPlaceholderText: {
    fontSize: 13,
    color: "#9CA3AF",
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  switchTitle: {
    fontSize: 13.5,
    fontWeight: "700",
    color: "#111827",
  },
  switchSub: {
    fontSize: 11.5,
    color: "#6B7280",
    marginTop: 2,
    maxWidth: 240,
  },
  optionsHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  optionsHeaderTitle: {
    fontSize: 13.5,
    fontWeight: "800",
    color: "#003459",
  },
  addOptionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  addOptionBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#003459",
  },
  optionBox: {
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  optionBoxTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  optionBoxName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 8,
  },
  valueChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 6,
  },
  valueChipText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#003459",
  },
  addValueRow: {
    marginTop: 2,
  },
  addValueInput: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 38,
    fontSize: 12.5,
    color: "#111827",
  },
  generateCombosBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#003459",
    borderRadius: 10,
    paddingVertical: 12,
    gap: 8,
    marginTop: 6,
  },
  generateCombosBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  combinationsContainer: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 12,
  },
  combinationsHeading: {
    fontSize: 14,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 10,
  },
  comboItemCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  comboItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  comboAttributesTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#003459",
  },
  fieldLabelSmall: {
    fontSize: 11,
    fontWeight: "700",
    color: "#6B7280",
    marginBottom: 2,
  },
  comboInput: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 6,
    paddingHorizontal: 8,
    height: 38,
    fontSize: 12.5,
    color: "#111827",
  },
  publishHeroBtn: {
    backgroundColor: "#FF5500",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#FF5500",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  publishHeroBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  btnDisabled: {
    opacity: 0.65,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
  },
  searchBarWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    color: "#111827",
  },
  addNewCategoryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    marginTop: 6,
  },
  addNewCategoryBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#003459",
  },
  categoryListItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  categoryItemText: {
    fontSize: 14,
    color: "#1F2937",
    fontWeight: "500",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  promptCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    width: "100%",
  },
  promptTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 6,
  },
  promptSub: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 12,
  },
  promptBtnRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 14,
  },
  promptCancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  promptCancelText: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "600",
  },
  promptSaveBtn: {
    backgroundColor: "#003459",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  promptSaveText: {
    fontSize: 13,
    color: "#FFFFFF",
    fontWeight: "700",
  },
  loadingProductCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
  },
  loadingProductText: {
    marginTop: 12,
    fontSize: 14,
    color: "#4B5563",
    fontWeight: "600",
  },
  optionsHeaderSub: {
    fontSize: 11.5,
    color: "#6B7280",
    marginTop: 2,
  },
  addDirectVariantBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#003459",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 7,
  },
  addDirectVariantBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  variantActionButtonsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  directAddFormBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: "#E0F2FE",
    borderWidth: 1,
    borderColor: "#BAE6FD",
    paddingVertical: 10,
    borderRadius: 8,
  },
  directAddFormBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#003459",
  },
  combinationsHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  addAnotherLinkText: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#003459",
  },
  comboThumbImg: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: "#F3F4F6",
  },
  comboThumbPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  comboSkuSub: {
    fontSize: 10.5,
    color: "#6B7280",
    marginTop: 1,
  },
  comboEditLinkText: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#2563EB",
  },
  variantModalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  variantModalCard: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "85%",
  },
  variantModalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  variantModalTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
  },
  variantModalSub: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  formSectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#374151",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  attrInputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  attrKeyLabel: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#374151",
    marginRight: 6,
  },
  attrValInput: {
    flex: 1,
    fontSize: 13,
    color: "#111827",
    paddingVertical: 4,
  },
  addCustomAttrRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  addAttrPillBtn: {
    backgroundColor: "#E0F2FE",
    padding: 9,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  modalFieldsRow: {
    flexDirection: "row",
    marginBottom: 10,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 4,
  },
  modalTextInput: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: "#111827",
  },
  variantImageSwitchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  variantImagePickerCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  variantPreviewWrap: {
    position: "relative",
    width: 90,
    height: 90,
    borderRadius: 8,
    overflow: "hidden",
  },
  variantPickerImg: {
    width: "100%",
    height: "100%",
  },
  variantRemoveImgBtn: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 4,
    borderRadius: 4,
  },
  variantPickBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
  },
  variantPickBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#003459",
  },
  variantModalFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 10,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    marginTop: 8,
  },
  variantCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  variantCancelBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
  },
  variantSaveBtn: {
    backgroundColor: "#003459",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  variantSaveBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
