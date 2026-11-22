/**
 * Complete Regional Logistics Companies Configuration for Abamba
 * Covering Imo State (Owerri Hub) & Abia State (Aba Hub) + Official Free Pickup
 */

export interface LogisticsCompany {
  id: string;
  name: string;
  email: string;
  phone: string;
  state: string;
  hub: string;
  defaultBasePrice: number;
  eta: string;
  ratings: number;
  isPickupStation?: boolean;
}

export const REGIONAL_LOGISTICS_COMPANIES: LogisticsCompany[] = [
  // ─── IMO STATE (3 COMPANIES) ──────────────────────────────────────────────
  {
    id: "richmond-logistics",
    name: "Richmond Logistics",
    email: "richmondoc2@gmail.com",
    phone: "+2348012345671",
    state: "Imo",
    hub: "Owerri",
    defaultBasePrice: 3000,
    eta: "1 - 2 business days",
    ratings: 5.0,
  },
  {
    id: "apexgologistics",
    name: "Apex Go Logistics",
    email: "Apexgologisticservices@gmail.com",
    phone: "+2348012345672",
    state: "Imo",
    hub: "Owerri",
    defaultBasePrice: 2400,
    eta: "Same-Day Delivery",
    ratings: 4.9,
  },
  {
    id: "hens-logistics",
    name: "Hens Logistics",
    email: "cchineduikechukwu@gmail.com",
    phone: "+2348012345673",
    state: "Imo",
    hub: "Owerri",
    defaultBasePrice: 3000,
    eta: "1 - 2 business days",
    ratings: 4.8,
  },

  // ─── ABIA STATE (2 COMPANIES - ABA HUB) ───────────────────────────────────
  {
    id: "princeswift-logistics",
    name: "Prince Swift Logistics",
    email: "chisomprince722@gmail.com",
    phone: "+2348012345674",
    state: "Abia",
    hub: "Aba",
    defaultBasePrice: 3000,
    eta: "Same-Day Delivery",
    ratings: 4.9,
  },
  {
    id: "oksaturday-logistics",
    name: "OkSaturday Logistics",
    email: "oksaturdaylogistics@gmail.com",
    phone: "+2348012345675",
    state: "Abia",
    hub: "Aba",
    defaultBasePrice: 3000,
    eta: "1 - 2 business days",
    ratings: 4.7,
  },
];

/**
 * Official Abamba Self Pick-Up Station Configuration
 * Buyer picks up directly at our office with zero delivery fee.
 */
export const PICKUP_STATION_DETAILS = {
  id: "pickup-station",
  name: "Abamba Pick-Up Station (Owerri Office)",
  courier_id: "pickup-station",
  courier_name: "Abamba Pick-Up Station (Owerri Office)",
  state: "Imo",
  hub: "Owerri",
  address: "Angelina House, 31 Wetheral Road, Owerri, Imo State, Nigeria",
  customerPhone: "+2348060039760",
  supportPhone: "+2349077758206",
  timeline: "5 to 7 working days",
  delivery_eta: "5 to 7 working days",
  eta: "5 to 7 working days",
  price: 0,
  fee: 0,
  defaultBasePrice: 0,
  isPickupStation: true,
  isPickup: true,
  available: true,
  description: "Direct self-collection from our official office in Owerri with zero shipping fee.",
};
