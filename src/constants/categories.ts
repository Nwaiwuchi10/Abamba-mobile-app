/**
 * Exact Categories configuration replicating:
 * web/abamba/src/lib/constants.js (categories & PRODUCT_CATEGORIES)
 */

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  image: any;
}

export const EXACT_WEB_CATEGORIES: CategoryItem[] = [
  {
    id: "1",
    name: "Gadgets & Accessories",
    slug: "gadgets-&-accessories",
    image: require("../../assets/images/electronics.png"),
  },
  {
    id: "2",
    name: "Jewelries & Accessories",
    slug: "jewelries-&-accessories",
    image: require("../../assets/images/accessories.png"),
  },
  {
    id: "3",
    name: "Home Appliances",
    slug: "home-appliances",
    image: require("../../assets/images/furnitures.png"),
  },
  {
    id: "4",
    name: "Wigs & Human Hair Bundles",
    slug: "wigs-&-human-hair-bundles",
    image: require("../../assets/images/cosmetics.png"),
  },
  {
    id: "5",
    name: "Room Deco & Lightings",
    slug: "room-deco-&-lightings",
    image: require("../../assets/images/decor.png"),
  },
  {
    id: "6",
    name: "Hair Care Tools & Styling Accessories",
    slug: "hair-care-tools-&-styling-accessories",
    image: require("../../assets/images/cosmetics.png"),
  },
  {
    id: "7",
    name: "Bags & Footwears",
    slug: "bags-&-footwears",
    image: require("../../assets/images/schoolbag.png"),
  },
  {
    id: "8",
    name: "Skin Care & Cosmetics",
    slug: "skin-care-&-cosmetics",
    image: require("../../assets/images/cosmetics.png"),
  },
  {
    id: "9",
    name: "Perfumes & Deodorants",
    slug: "perfumes-&-deodorants",
    image: require("../../assets/images/cosmetics.png"),
  },
  {
    id: "10",
    name: "Dental Care",
    slug: "dental-care",
    image: require("../../assets/images/drug-category.png"),
  },
  {
    id: "11",
    name: "Foodstuffs & Medication",
    slug: "foodstuffs-&-medication",
    image: require("../../assets/images/food-category.png"),
  },
  {
    id: "12",
    name: "School Items & Stationery",
    slug: "school-items-&-stationery",
    image: require("../../assets/images/schoolbag.png"),
  },
  {
    id: "13",
    name: "Clothing & Underwears",
    slug: "clothing-&-underwears",
    image: require("../../assets/images/hangedclothes.png"),
  },
  {
    id: "14",
    name: "Ankara Materials & Styling",
    slug: "ankara-materials-&-styling",
    image: require("../../assets/images/hangedclothes.png"),
  },
  {
    id: "15",
    name: "Furniture",
    slug: "furniture",
    image: require("../../assets/images/furnitures.png"),
  },
  {
    id: "16",
    name: "Other",
    slug: "other",
    image: require("../../assets/images/accessories.png"),
  },
];

export const EXACT_PRODUCT_CATEGORIES = [
  "All",
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
