import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { CartItem } from '../types';
import { useAuth } from './AuthContext';
import { doc, setDoc, getDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'sonner';

const CART_STORAGE_KEY = 'coffeecraze_cart';

interface CartContextType {
  items: CartItem[];
  addItem: (item: any, qty?: number) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, qty: number) => void;
  clearCart: () => void;
  total: number;
  totalUsd: number;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

function loadLocalCart(): CartItem[] {
  try {
    const saved = localStorage.getItem(CART_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
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
  const isSyncing = useRef(false);
  const prevUserRef = useRef<string | null>(null);

  // Load cart on mount: local first, then Firestore if user is logged in
  useEffect(() => {
    const localCart = loadLocalCart();
    if (user) {
      // If user just logged in, merge local cart into Firestore
      const cartRef = doc(db, 'carts', user.uid);
      getDoc(cartRef).then((snap) => {
        if (snap.exists()) {
          const firestoreCart: CartItem[] = snap.data().items || [];
          if (localCart.length > 0) {
            // Merge: Firestore items take priority, add any local items not in FS
            const merged = [...firestoreCart];
            for (const localItem of localCart) {
              const exists = merged.find(
                (i) => i.productId === localItem.productId && (i.selectedVariant?.id || 'default') === (localItem.selectedVariant?.id || 'default')
              );
              if (exists && localItem.quantity > exists.quantity) {
                exists.quantity = localItem.quantity;
              } else if (!exists) {
                merged.push(localItem);
              }
            }
            setItems(merged);
            saveLocalCart(merged);
            setDoc(cartRef, { items: merged, updatedAt: serverTimestamp() }, { merge: true }).catch((err) => console.error('Cart merge sync error:', err));
          } else {
            setItems(firestoreCart);
            saveLocalCart(firestoreCart);
          }
        } else {
          // No Firestore cart, use local
          setItems(localCart);
          if (localCart.length > 0) {
            setDoc(cartRef, { items: localCart, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }).catch((err) => console.error('Cart init sync error:', err));
          }
        }
        setInitialized(true);
      }).catch((err) => {
        console.warn('Cart Firestore read failed, using local cart:', err);
        setItems(localCart);
        setInitialized(true);
      });
    } else {
      setItems(localCart);
      setInitialized(true);
    }
    prevUserRef.current = user?.uid || null;
  }, [user?.uid]);

  // Listen to Firestore cart changes in real time when logged in
  useEffect(() => {
    if (!user || !initialized) return;
    const cartRef = doc(db, 'carts', user.uid);
    const unsub = onSnapshot(cartRef, (snap) => {
      if (isSyncing.current) return;
      if (snap.exists()) {
        const firestoreItems: CartItem[] = snap.data().items || [];
        setItems(firestoreItems);
        saveLocalCart(firestoreItems);
      }
    }, (err) => console.error('Cart Firestore listener error:', err));
    return unsub;
  }, [user?.uid, initialized]);

  // Sync to Firestore and localStorage whenever items change
  useEffect(() => {
    if (!initialized) return;
    saveLocalCart(items);
    if (user) {
      isSyncing.current = true;
      const cartRef = doc(db, 'carts', user.uid);
      setDoc(cartRef, { items, updatedAt: serverTimestamp() }, { merge: true })
        .catch((err) => {
          console.error('Cart sync error:', err);
          toast.error('Failed to sync cart. Please try again.');
        })
        .finally(() => {
          isSyncing.current = false;
        });
    }
  }, [items, user?.uid, initialized]);

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
        stock: product.stock,
        isSubscriptionEligible: !!product.isSubscriptionEligible,
        selectedVariant: product.selectedVariant,
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

  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalUsd = items.reduce((sum, item) => sum + ((item.priceUsd || 0) * item.quantity), 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, total, totalUsd, itemCount }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
