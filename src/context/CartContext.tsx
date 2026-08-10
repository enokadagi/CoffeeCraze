import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { CartItem } from '../types';
import { useAuth } from './AuthContext';
import { doc, setDoc, getDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'sonner';
import { cleanUndefined } from '../lib/utils';

const CART_STORAGE_KEY = 'coffeecraze_cart';
const COUPON_STORAGE_KEY = 'coffeecraze_coupon';

export interface AppliedCoupon {
  code: string;
  discountPercent: number;
}

interface CartContextType {
  items: CartItem[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addItem: (item: any, qty?: number) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, qty: number) => void;
  clearCart: () => void;
  total: number;
  totalUsd: number;
  itemCount: number;
  appliedCoupon: AppliedCoupon | null;
  setAppliedCoupon: (coupon: AppliedCoupon | null) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function sanitizeSelectedVariant(v: any) {
  if (!v || typeof v !== 'object') return undefined;
  return {
    id: String(v.id || ''),
    name: String(v.name || ''),
    price: Number(v.price) || 0,
    priceUsd: Number(v.priceUsd) || 0,
    priceLbp: Number(v.priceLbp || v.price) || 0,
    image: v.image || '',
    stock: Number(v.stock) || 0,
    sku: v.sku || '',
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function sanitizeCartItem(item: any): CartItem {
  return {
    id: item.id || '',
    productId: item.productId || '',
    name: String(item.name || item.productId || ''),
    price: Number(item.price) || 0,
    priceUsd: Number(item.priceUsd) || 0,
    priceLbp: Number(item.priceLbp || item.price) || 0,
    image: item.image || (Array.isArray(item.images) ? item.images[0] : '') || '',
    images: Array.isArray(item.images) ? item.images : [],
    category: item.category || '',
    sku: item.sku || '',
    description: item.description || '',
    quantity: Math.max(1, Number(item.quantity) || 1),
    stock: Number(item.stock) || 0,
    isSubscriptionEligible: !!item.isSubscriptionEligible,
    selectedVariant: sanitizeSelectedVariant(item.selectedVariant),
  };
}

function cartKey(item: CartItem) {
  return `${item.productId}::${item.selectedVariant?.id || 'default'}`;
}

function cartsEqual(a: CartItem[], b: CartItem[]) {
  if (a.length !== b.length) return false;
  const bMap = new Map(b.map((i) => [cartKey(i), i.quantity]));
  return a.every((i) => bMap.get(cartKey(i)) === i.quantity);
}

function loadLocalCart(): CartItem[] {
  try {
    const saved = localStorage.getItem(CART_STORAGE_KEY);
    const parsed: CartItem[] = saved ? JSON.parse(saved) : [];
    return parsed.map(sanitizeCartItem);
  } catch {
    console.warn('[Cart] Failed to parse localStorage cart');
    return [];
  }
}

function saveLocalCart(items: CartItem[]) {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to save cart:', e);
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>(() => loadLocalCart());
  const [initialized, setInitialized] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(() => {
    try {
      const saved = localStorage.getItem(COUPON_STORAGE_KEY);
      return saved ? (JSON.parse(saved) as AppliedCoupon) : null;
    } catch {
      return null;
    }
  });
  const isSyncing = useRef(false);
  const guestItemsRef = useRef<CartItem[] | null>(null);
  const loadedForUid = useRef<string | null>(null);
  const appliedForUid = useRef<string | null>(null);

  // Load cart on mount / user change: guest cart first, then server cart (merged) once loaded
  useEffect(() => {
    const uid = user?.uid || null;
    if (!uid) {
      // Logged out: restore only the guest cart snapshot (never another user's server cart)
      if (appliedForUid.current !== null) {
        const guest = guestItemsRef.current ?? [];
        setItems(guest);
        saveLocalCart(guest);
      }
      appliedForUid.current = null;
      loadedForUid.current = null;
      guestItemsRef.current = null;
      setInitialized(true);
      return;
    }
    // Logged in / account switch: snapshot current guest items, then load server cart
    if (appliedForUid.current === null && guestItemsRef.current === null) {
      guestItemsRef.current = loadLocalCart();
    }
    appliedForUid.current = null;
    loadedForUid.current = null;
    setInitialized(false);

    const cartRef = doc(db, 'carts', uid);
    const guestSnapshot = guestItemsRef.current ?? [];
    getDoc(cartRef).then((snap) => {
      if (appliedForUid.current !== null || loadedForUid.current !== null) return;
      let next: CartItem[];
      let mustWrite = false;
      if (snap.exists()) {
        next = (snap.data().items || []).map(sanitizeCartItem);
        for (const guestItem of guestSnapshot) {
          const exists = next.find(
            (i) => cartKey(i) === cartKey(guestItem)
          );
          if (exists) {
            if (guestItem.quantity > exists.quantity) {
              exists.quantity = guestItem.quantity;
              mustWrite = true;
            }
          } else {
            next.push(guestItem);
            mustWrite = true;
          }
        }
      } else {
        next = guestSnapshot;
        mustWrite = next.length > 0;
      }
      setItems(next);
      saveLocalCart(next);
      if (mustWrite) {
        isSyncing.current = true;
        setDoc(cartRef, { items: cleanUndefined(next), createdAt: serverTimestamp(), updatedAt: serverTimestamp() }, { merge: true })
          .catch((err) => console.error('Cart merge sync error:', err))
          .finally(() => {
            isSyncing.current = false;
          });
      }
      appliedForUid.current = uid;
      loadedForUid.current = uid;
      setInitialized(true);
    }).catch((err) => {
      console.warn('Cart Firestore read failed, using guest cart:', err);
      setItems(guestSnapshot);
      saveLocalCart(guestSnapshot);
      appliedForUid.current = uid;
      loadedForUid.current = uid;
      setInitialized(true);
    });
  }, [user]);

  // Listen to Firestore cart changes in real time when the current user's cart is loaded
  useEffect(() => {
    if (!user || !initialized || loadedForUid.current !== user.uid) return;
    const cartRef = doc(db, 'carts', user.uid);
    const unsub = onSnapshot(cartRef, (snap) => {
      if (isSyncing.current) return;
      if (appliedForUid.current !== user.uid) return;
      if (snap.exists()) {
        const firestoreItems: CartItem[] = (snap.data().items || []).map(sanitizeCartItem);
        setItems((prev) => {
          if (cartsEqual(prev, firestoreItems)) return prev;
          return firestoreItems;
        });
        saveLocalCart(firestoreItems);
      }
    }, (err) => console.error('Cart Firestore listener error:', err));
    return unsub;
  }, [user, initialized]);

  // Sync to Firestore and localStorage whenever items change (only after the user's cart is loaded)
  useEffect(() => {
    if (!initialized) return;
    saveLocalCart(items);
    if (user && loadedForUid.current === user.uid) {
      isSyncing.current = true;
      const cartRef = doc(db, 'carts', user.uid);
      setDoc(cartRef, { items: cleanUndefined(items), updatedAt: serverTimestamp() }, { merge: true })
        .catch((err) => {
          console.error('Cart sync error:', err);
          toast.error('Failed to sync cart. Please try again.');
        })
        .finally(() => {
          isSyncing.current = false;
        });
    }
  }, [items, user, initialized]);

  // Persist the applied coupon so it survives navigation and page reloads
  useEffect(() => {
    try {
      if (appliedCoupon) {
        localStorage.setItem(COUPON_STORAGE_KEY, JSON.stringify(appliedCoupon));
      } else {
        localStorage.removeItem(COUPON_STORAGE_KEY);
      }
    } catch (e) {
      console.error('Failed to persist coupon:', e);
    }
  }, [appliedCoupon]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const addItem = (product: any, qty = 1) => {
    if (!product || typeof product !== 'object') {
      toast.error('Invalid product data');
      return;
    }
    if (!initialized) {
      toast.error('Cart is loading. Please try again in a moment.');
      return;
    }
    if (product.stock !== undefined && product.stock <= 0) {
      toast.error(`${product.name || 'Product'} is currently out of stock.`);
      return;
    }
    if (product.stock !== undefined && qty > product.stock) {
      toast.error(`Only ${product.stock} units of ${product.name || 'Product'} available.`);
      return;
    }
    const productId = product.productId || product.id;
    if (!productId) {
      toast.error('Cannot add product: missing product ID');
      return;
    }
    setItems((prev) => {
      const existing = prev.find((i) =>
        i.productId === productId &&
        i.selectedVariant?.id === product.selectedVariant?.id
      );
      if (existing) {
        const newQty = existing.quantity + qty;
        if (product.stock !== undefined && newQty > product.stock) {
          toast.error(`Only ${product.stock} units available. You already have ${existing.quantity} in your cart.`);
          return prev;
        }
        return prev.map((i) =>
          (i.productId === productId && i.selectedVariant?.id === product.selectedVariant?.id)
            ? { ...i, quantity: newQty }
            : i
        );
      }
      const variantKey = product.selectedVariant?.id ? `_${product.selectedVariant.id}` : '';
      const newCartItem: CartItem = {
        id: `${productId}${variantKey}`,
        productId,
        name: String(product.name || productId),
        price: Number(product.price) || 0,
        priceUsd: Number(product.priceUsd) || 0,
        priceLbp: Number(product.priceLbp || product.price) || 0,
        image: product.image || (Array.isArray(product.images) ? product.images[0] : '') || '',
        images: Array.isArray(product.images) ? product.images : [],
        category: product.category || '',
        sku: product.sku || '',
        description: product.description || '',
        quantity: qty,
        stock: Number(product.stock) || 0,
        isSubscriptionEligible: !!product.isSubscriptionEligible,
        selectedVariant: sanitizeSelectedVariant(product.selectedVariant),
      };
      return [...prev, newCartItem];
    });
    toast.success(`${product.name || 'Product'} added to your ritual cart!`);
  };

  const removeItem = (cartItemId: string) => {
    setItems((prev) =>
      prev.filter((i) => i.id !== cartItemId && i.productId !== cartItemId)
    );
    toast.info("Item removed from cart.");
  };

  const updateQuantity = (cartItemId: string, qty: number) => {
    if (qty <= 0) {
      removeItem(cartItemId);
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.id === cartItemId || i.productId === cartItemId ? { ...i, quantity: qty } : i))
    );
  };

  const clearCart = () => {
    setItems([]);
    saveLocalCart([]);
    if (user) {
      const cartRef = doc(db, 'carts', user.uid);
      setDoc(cartRef, { items: [], updatedAt: serverTimestamp() }, { merge: true }).catch((err) => console.error('Cart clear error:', err));
    }
  };

  const total = items.reduce((sum, item) => sum + ((item.price || 0) * item.quantity), 0);
  const totalUsd = items.reduce((sum, item) => sum + ((item.priceUsd || 0) * item.quantity), 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, total, totalUsd, itemCount, appliedCoupon, setAppliedCoupon }}>
      {children}
    </CartContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
