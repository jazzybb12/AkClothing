export interface ProductImage {
  id: string;
  url: string;
  altText: string | null;
}

export interface ProductVariant {
  id: string;
  size: string;
  color: string;
  sku: string;
  priceOverride: string | null;
  stockQty: number;
  isOutOfStock: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
}

export type BannerGradientKey = "brand" | "emerald" | "accent";

export interface Banner {
  id: string;
  eyebrow: string | null;
  heading: string;
  subtext: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
  imageUrl: string | null;
  gradientKey: BannerGradientKey;
  position: number;
  active: boolean;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  basePrice: string;
  status: "ACTIVE" | "DRAFT";
  featured: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
  category: Category;
  images: ProductImage[];
  variants: ProductVariant[];
  avgRating: number | null;
  reviewCount: number;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  comment: string;
  authorName: string | null;
  showOnHomepage: boolean;
  createdAt: string;
  user: { name: string };
  product?: { name: string; slug: string };
}

export interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  position: number;
  active?: boolean;
  _count?: { products: number };
}

export interface CollectionDetail {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  products: Product[];
}

export interface OrderItem {
  id: string;
  productId: string;
  variantId: string;
  productNameSnapshot: string;
  size: string;
  color: string;
  qty: number;
  unitPrice: string;
  lineTotal: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: "PENDING" | "CONFIRMED" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "RETURNED";
  subtotal: string;
  discountAmount: string;
  shippingFee: string;
  shippingMethodName: string | null;
  paymentMethod: "COD" | "BANK_DEPOSIT";
  total: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  shippingAddress: { address: string; city: string };
  courierProvider: "LEOPARDS" | "POSTEX" | null;
  courierTrackingNumber: string | null;
  courierStatus: string | null;
  items: OrderItem[];
  createdAt: string;
}

export interface ShippingMethod {
  id: string;
  name: string;
  description: string | null;
  fee: string;
  active: boolean;
  position: number;
}

export interface CartLine {
  variantId: string;
  productSlug: string;
  productName: string;
  size: string;
  color: string;
  unitPrice: number;
  qty: number;
  image?: string;
}
