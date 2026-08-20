// Fixed set of resource keys a STAFF account can be granted. ADMIN always has full
// access regardless of this list — see requirePermission in middleware/auth.ts.
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
