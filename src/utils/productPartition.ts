export function getProductCategory(product: any) {
  if (!product) return "General";
  if (typeof product.category === "string" && product.category.trim()) {
    return product.category.trim();
  }
  if (product.category?.name && typeof product.category.name === "string") {
    return product.category.name.trim();
  }
  if (Array.isArray(product.categories) && product.categories.length > 0) {
    const first = product.categories[0];
    return typeof first === "string"
      ? first.trim()
      : first?.name?.trim() || "General";
  }
  return "General";
}

export function getProductCategoryKey(product: any) {
  return getProductCategory(product).toLowerCase().trim();
}

export function getProductSeller(product: any) {
  if (!product) return "Vendor";
  const name =
    product.sellerName ||
    product.user?.business?.businessName ||
    product.user?.storeName ||
    product.user?.businessName ||
    product.storeName ||
    product.businessName ||
    product.business?.businessName ||
    product.seller?.business?.businessName ||
    product.seller?.businessName ||
    product.seller?.storeName ||
    product.user?.name ||
    product.seller?.name ||
    product.sellerId ||
    product.seller?._id ||
    "Vendor";
  return typeof name === "string" ? name.trim() : "Vendor";
}

export function getProductSellerKey(product: any) {
  const raw = getProductSeller(product).toLowerCase();
  return raw
    .replace(/['’]/g, "")
    .replace(/\s+stores?$/i, "")
    .replace(/\s+ltd\.?$/i, "")
    .trim();
}

function interleaveProducts(products: any[]) {
  if (!Array.isArray(products) || products.length <= 2) return products;
  const bySeller: Record<string, any[]> = {};
  products.forEach((p) => {
    const sKey = getProductSellerKey(p);
    if (!bySeller[sKey]) bySeller[sKey] = [];
    bySeller[sKey].push(p);
  });

  const queues = Object.values(bySeller);
  const result: any[] = [];
  let added = true;

  while (added) {
    added = false;
    for (const q of queues) {
      if (q.length > 0) {
        result.push(q.shift());
        added = true;
      }
    }
  }

  return result;
}

function selectRecommendedProducts(allProducts: any[], targetCount = 16) {
  if (!allProducts || allProducts.length === 0) return [];
  const recommended: any[] = [];
  const recommendedIds = new Set<string>();
  const sellerCounts: Record<string, number> = {};
  const categoryCounts: Record<string, number> = {};

  const add = (p: any) => {
    const pid = p._id || p.id;
    recommended.push(p);
    recommendedIds.add(pid);
    const sKey = getProductSellerKey(p);
    const cKey = getProductCategoryKey(p);
    sellerCounts[sKey] = (sellerCounts[sKey] || 0) + 1;
    categoryCounts[cKey] = (categoryCounts[cKey] || 0) + 1;
  };

  const canAdd = (p: any, maxSeller = 2, maxCat = 3) => {
    const sKey = getProductSellerKey(p);
    const cKey = getProductCategoryKey(p);
    return (sellerCounts[sKey] || 0) < maxSeller && (categoryCounts[cKey] || 0) < maxCat;
  };

  // 1. Prioritize pinned / recommended
  for (const p of allProducts) {
    if (recommended.length >= targetCount) break;
    if (p.isRecommended || p.featured) {
      add(p);
    }
  }

  // 2. Add diverse
  for (const p of allProducts) {
    if (recommended.length >= targetCount) break;
    const pid = p._id || p.id;
    if (!recommendedIds.has(pid) && canAdd(p, 2, 2)) {
      add(p);
    }
  }

  // 3. Fill up
  for (const p of allProducts) {
    if (recommended.length >= targetCount) break;
    const pid = p._id || p.id;
    if (!recommendedIds.has(pid)) {
      add(p);
    }
  }

  return interleaveProducts(recommended.slice(0, targetCount));
}

function selectHotDealsProducts(allProducts: any[], excludeIds = new Set<string>(), targetCount = 10) {
  if (!allProducts || allProducts.length === 0) return [];

  const candidates = [...allProducts];

  const scored = candidates.map((p) => {
    const base = Number(p.basePrice || p.price || 0);
    const bonus =
      p.bonusPrice !== undefined && p.bonusPrice !== null && p.bonusPrice !== ""
        ? Number(p.bonusPrice)
        : p.bonus_price !== undefined && p.bonus_price !== null && p.bonus_price !== ""
        ? Number(p.bonus_price)
        : p.promoPrice !== undefined && p.promoPrice !== null && p.promoPrice !== ""
        ? Number(p.promoPrice)
        : 0;

    const hasDiscount = bonus > 0 && bonus < base;
    const discountAmount = hasDiscount ? base - bonus : 0;
    const isNewToUser = !excludeIds.has(p._id || p.id);

    return {
      product: p,
      hasDiscount,
      discountAmount,
      isNewToUser,
    };
  });

  // Strict Web Sort: Items not yet shown in Recommended first, then by highest active discount
  scored.sort((a, b) => {
    if (a.isNewToUser !== b.isNewToUser) {
      return a.isNewToUser ? -1 : 1;
    }
    if (a.hasDiscount !== b.hasDiscount) {
      return a.hasDiscount ? -1 : 1;
    }
    return b.discountAmount - a.discountAmount;
  });

  const hotDeals: any[] = [];
  const selectedIds = new Set<string>();
  const sellerCounts: Record<string, number> = {};

  const add = (p: any) => {
    const pid = p._id || p.id;
    hotDeals.push(p);
    selectedIds.add(pid);
    const sKey = getProductSellerKey(p);
    sellerCounts[sKey] = (sellerCounts[sKey] || 0) + 1;
  };

  // Pass 1: Add new items with discounts first
  for (const item of scored) {
    if (hotDeals.length >= targetCount) break;
    const p = item.product;
    const pid = p._id || p.id;
    if (!selectedIds.has(pid) && (sellerCounts[getProductSellerKey(p)] || 0) < 2) {
      add(p);
    }
  }

  // Pass 2: Guaranteed fill
  for (const item of scored) {
    if (hotDeals.length >= targetCount) break;
    const p = item.product;
    const pid = p._id || p.id;
    if (!selectedIds.has(pid)) {
      add(p);
    }
  }

  return interleaveProducts(hotDeals.slice(0, targetCount));
}

export function partitionProductsForHome(
  allProducts: any[] = [],
  recommendedTarget = 16,
  hotDealsTarget = 10
) {
  if (!Array.isArray(allProducts) || allProducts.length === 0) {
    return { recommendedProducts: [], hotDealsProducts: [] };
  }

  // 1. Recommended
  const recommendedProducts = selectRecommendedProducts(allProducts, recommendedTarget);
  const recommendedIds = new Set<string>(recommendedProducts.map((p) => p._id || p.id));

  // 2. Hot Deals (completely disjoint/different set of items prioritizing discounts)
  const hotDealsProducts = selectHotDealsProducts(allProducts, recommendedIds, hotDealsTarget);

  return {
    recommendedProducts,
    hotDealsProducts,
  };
}

