// Mirrors backend/src/constants/permissions.ts — this repo duplicates small shared
// types between frontend/backend rather than sharing a package.
export const PERMISSIONS = [
  "PRODUCTS",
  "ORDERS",
  "CATEGORIES",
  "COUPONS",
  "BANNERS",
  "SHIPPING",
  "COLLECTIONS",
  "REVIEWS",
  "NEWSLETTER",
  "SETTINGS",
  "CUSTOMERS",
  "REPORTS",
  "EMAIL_TEMPLATES",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const PERMISSION_LABELS: Record<Permission, string> = {
  PRODUCTS: "Products",
  ORDERS: "Orders",
  CATEGORIES: "Categories",
  COUPONS: "Coupons",
  BANNERS: "Banners",
  SHIPPING: "Shipping",
  COLLECTIONS: "Collections",
  REVIEWS: "Reviews",
  NEWSLETTER: "Newsletter",
  SETTINGS: "Settings",
  CUSTOMERS: "Customers",
  REPORTS: "Reports",
  EMAIL_TEMPLATES: "Emails",
};
