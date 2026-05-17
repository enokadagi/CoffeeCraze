export enum UserRole {
  ADMIN = 'admin',
  WHOLESALE = 'wholesale',
  CUSTOMER = 'customer',
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  phone?: string;
  address?: string;
  role: UserRole;
  loyaltyPoints: number;
  referralCode?: string;
  createdAt: string;
  onboarded: boolean;
}

export type Profile = UserProfile;

export interface WholesaleAccount {
  id?: string;
  userId: string;
  businessName: string;
  businessType: string;
  location: string;
  estimatedVolume: string;
  website?: string;
  taxId?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface ProductVariant {
  id: string;
  name: string;
  price?: number;
  priceUsd?: number;
  priceLbp?: number;
  image?: string;
  stock: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  fullDescription?: string;
  price: number; 
  priceUsd?: number;
  priceLbp?: number;
  category: string;
  images: string[];
  stock: number;
  sku: string;
  barcode?: string;
  weight?: number;
  tags: string[];
  isSubscriptionEligible: boolean;
  wholesalePrice?: number;
  wholesalePriceUsd?: number;
  wholesalePriceLbp?: number;
  rating: number;
  reviewCount: number;
  isFeatured: boolean;
  variants?: ProductVariant[];
}

export interface CartItem extends Product {
  quantity: number;
  selectedVariant?: ProductVariant;
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  CANCELLED = 'cancelled',
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status: SubscriptionStatus;
  nextDelivery: string;
  frequency: 'weekly' | 'biweekly' | 'monthly';
  preferredDay?: string;
  preferredTime?: string;
  items: CartItem[];
  address: any;
  history: any[];
  paymentStatus: 'paid' | 'pending' | 'failed';
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'paid' | 'pending';
  paymentMethod: string;
  shippingAddress?: any;
  trackingId?: string;
  deliveryDate?: string;
  deliveryTime?: string;
  createdAt: string;
}

