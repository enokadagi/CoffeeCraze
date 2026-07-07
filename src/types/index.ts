// ============= ENUMS =============
export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  PRODUCT_MANAGER = 'product_manager',
  WHOLESALE_MANAGER = 'wholesale_manager',
  CUSTOMER_SERVICE = 'customer_service',
  ANALYST = 'analyst',
  WHOLESALE = 'wholesale',
  CUSTOMER = 'customer',
}

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.SUPER_ADMIN]: 100,
  [UserRole.ADMIN]: 80,
  [UserRole.PRODUCT_MANAGER]: 60,
  [UserRole.WHOLESALE_MANAGER]: 60,
  [UserRole.CUSTOMER_SERVICE]: 50,
  [UserRole.ANALYST]: 40,
  [UserRole.WHOLESALE]: 20,
  [UserRole.CUSTOMER]: 10,
};

export const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.SUPER_ADMIN]: 'Super Admin',
  [UserRole.ADMIN]: 'Admin',
  [UserRole.PRODUCT_MANAGER]: 'Product Manager',
  [UserRole.WHOLESALE_MANAGER]: 'Wholesale Manager',
  [UserRole.CUSTOMER_SERVICE]: 'Customer Service',
  [UserRole.ANALYST]: 'Analyst',
  [UserRole.WHOLESALE]: 'Wholesale',
  [UserRole.CUSTOMER]: 'Customer',
};

export function hasRole(userRole: UserRole, allowedRoles: UserRole[]): boolean {
  const userLevel = ROLE_HIERARCHY[userRole] ?? 0;
  return allowedRoles.some(r => userLevel >= ROLE_HIERARCHY[r]);
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  CANCELLED = 'cancelled',
}

export enum PaymentStatus {
  PAID = 'paid',
  PENDING = 'pending',
  FAILED = 'failed',
  OVERDUE = 'overdue',
}

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export enum DeliveryStatus {
  SCHEDULED = 'scheduled',
  IN_TRANSIT = 'in_transit',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  FAILED = 'failed',
}

// ============= USER & PROFILE =============
export interface Address {
  id?: string;
  name?: string;
  fullName?: string;
  street?: string;
  address?: string;
  region?: string;
  building?: string;
  floor?: string;
  apartment?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  email?: string;
  phone?: string;
  phoneNumber?: string;
  isDefault?: boolean;
  instructions?: string;
  gateCode?: string;
  landmark?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  phone?: string;
  phoneVerified?: boolean;
  emailVerified?: boolean;
  address?: string;
  addresses?: Address[];
  defaultAddressId?: string;
  role: UserRole;
  loyaltyPoints: number;
  totalSpent: number;
  referralCode?: string;
  referredBy?: string;
  createdAt: string;
  lastLogin?: string;
  onboarded: boolean;
  preferences?: UserPreferences;
  avatar?: string;
  profileImage?: string;
}

export interface UserPreferences {
  emailNotifications: boolean;
  smsNotifications: boolean;
  marketingEmails: boolean;
  preferredDeliveryTime?: string;
  currency: 'USD' | 'LBP';
  language: 'en' | 'ar';
}

export type Profile = UserProfile;

// ============= PRODUCTS & COMMERCE =============
export interface ProductVariant {
  id: string;
  name: string;
  price?: number;
  priceUsd?: number;
  priceLbp?: number;
  image?: string;
  stock: number;
  sku?: string;
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
  planId?: string;
  barcode?: string;
  brand?: string;
  origin?: string;
  weight?: number;
  tags: string[];
  isSubscriptionEligible: boolean;
  isActive?: boolean;
  wholesalePrice?: number;
  wholesalePriceUsd?: number;
  wholesalePriceLbp?: number;
  rating: number;
  reviewCount: number;
  isFeatured: boolean;
  variants?: ProductVariant[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  priceUsd?: number;
  priceLbp?: number;
  image?: string;
  images?: string[];
  category?: string;
  sku?: string;
  description?: string;
  quantity: number;
  selectedVariant?: ProductVariant;
  stock?: number;
  isSubscriptionEligible?: boolean;
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

// ============= PLANS & SUBSCRIPTIONS =============
export interface PlanItem {
  productId: string;
  quantity: number;
  name: string;
  price: number;
}

export interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  priceLbp?: number;
  priceUsd?: number;
  features: string[];
  image?: string;
  items: PlanItem[];
  frequency: 'weekly' | 'biweekly' | 'monthly';
  minDeliveries: number;
  isFeatured: boolean;
  isCustomizable: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface SubscriptionPlan {
  planId: string;
  items: PlanItem[];
  frequency: 'weekly' | 'biweekly' | 'monthly';
  nextDeliveryDate: string;
  customizations?: string;
}

export interface PaymentSchedule {
  type: 'prepaid' | 'monthly' | 'deferred';
  amount: number;
  amountLbp?: number;
  dueDate: string;
  status: PaymentStatus;
  method?: 'card' | 'bank_transfer' | 'cash_on_delivery';
  transactionId?: string;
  notes?: string;
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status: SubscriptionStatus;
  plan: SubscriptionPlan;
  frequency?: 'weekly' | 'biweekly' | 'monthly';
  items?: OrderItem[];
  address?: Address | string;
  preferredDay?: string;
  preferredTime?: string;
  preferredTimeSlot?: string;
  history?: string[];
  paymentStatus?: PaymentStatus;
  startDate: string;
  endDate?: string;
  nextDelivery: string;
  deliveryAddress: Address;
  deliveryNotes?: string;
  paymentSchedule: PaymentSchedule[];
  currentPaymentStatus: PaymentStatus;
  nextPaymentDue?: string;
  skippedDeliveries?: string[];
  pausedUntil?: string;
  deliveryHistory: string[];
  totalDeliveries: number;
  completedDeliveries: number;
  cancellationReason?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt?: string;
}

// ============= ORDERS & DELIVERY =============
export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  images?: string[];
  category?: string;
  sku?: string;
}

export interface Delivery {
  id: string;
  orderId: string;
  subscriptionId?: string;
  userId: string;
  items: OrderItem[];
  status: DeliveryStatus;
  scheduledDate: string;
  scheduledTimeWindow?: string;
  actualDeliveryDate?: string;
  estimatedDeliveryTime?: string;
  address: Address;
  instructions?: string;
  driverName?: string;
  driverPhone?: string;
  trackingUrl?: string;
  attempts: number;
  failureReason?: string;
  proof?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  subtotal: number;
  subtotalLbp?: number;
  shipping: number;
  shippingLbp?: number;
  tax?: number;
  taxLbp?: number;
  total: number;
  totalLbp?: number;
  totalUsd?: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: 'card' | 'bank_transfer' | 'cash_on_delivery';
  paymentTiming: 'prepaid' | 'monthly' | 'deferred';
  shippingAddress: Address;
  deliveryDate?: string;
  deliveryTime?: string;
  customNotes?: string;
  gateCode?: string;
  trackingId?: string;
  invoiceUrl?: string;
  createdAt: string;
  updatedAt?: string;
  deliveredAt?: string;
}

// ============= PAYMENTS & LEDGER =============
export interface Payment {
  id: string;
  userId: string;
  orderId?: string;
  subscriptionId?: string;
  amount: number;
  amountLbp: number;
  currency: 'USD' | 'LBP';
  exchangeRate: number;
  status: PaymentStatus;
  method: 'card' | 'bank_transfer' | 'cash_on_delivery';
  transactionId?: string;
  reference?: string;
  dueDate: string;
  paidDate?: string;
  invoice?: string;
  notes?: string;
  failureReason?: string;
  retryCount: number;
  nextRetryDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentLedger {
  id: string;
  userId: string;
  totalDue: number;
  totalDueLbp: number;
  totalPaid: number;
  totalPaidLbp: number;
  overdue: number;
  overdueLbp: number;
  pending: number;
  pendingLbp: number;
  paymentHistory: Payment[];
  lastPaymentDate?: string;
  nextDueDate?: string;
  status: 'current' | 'overdue' | 'paid';
}

// ============= WHOLESALE =============
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
  contactPerson?: string;
  contactPhone?: string;
  approvedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  notes?: string;
}

// ============= ADMIN & OPERATIONS =============
export interface InventoryLog {
  id: string;
  productId: string;
  previousStock: number;
  newStock: number;
  change: number;
  reason: 'sale' | 'restock' | 'damage' | 'correction' | 'return';
  reference?: string;
  createdAt: string;
  createdBy: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  subject: string;
  description: string;
  category: 'order' | 'subscription' | 'payment' | 'delivery' | 'product' | 'account' | 'other';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  messages: Array<{
    from: 'user' | 'admin';
    text: string;
    timestamp: string;
  }>;
  assignedTo?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface AdminOperation {
  id: string;
  type: 'subscription_update' | 'payment_adjustment' | 'delivery_reschedule' | 'manual_refund' | 'customer_note';
  targetId: string;
  adminId: string;
  changes: Record<string, any>;
  reason?: string;
  createdAt: string;
}

