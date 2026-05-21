import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem } from '../types';
import { toast } from 'sonner';

const CART_STORAGE_KEY = 'coffeecraze_cart';

interface CartContextType {
  items: CartItem[];
  addItem: (item: any, qty?: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  total: number;
  totalUsd: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

function loadCart(): CartItem[] {
  try {
    const saved = localStorage.getItem(CART_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]) {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to save cart:', e);
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadCart);

  useEffect(() => {
    saveCart(items);
  }, [items]);

  const addItem = (product: any, qty = 1) => {
    if (product.stock !== undefined && product.stock <= 0) {
      toast.error(`${product.name} is currently out of stock.`);
      return;
    }
    if (product.stock !== undefined && qty > product.stock) {
      toast.error(`Only ${product.stock} units of ${product.name} available.`);
      return;
    }
    setItems((prev) => {
      const existing = prev.find((i) =>
        i.id === product.id &&
        i.selectedVariant?.id === product.selectedVariant?.id
      );
      if (existing) {
        const newQty = existing.quantity + qty;
        if (product.stock !== undefined && newQty > product.stock) {
          toast.error(`Only ${product.stock} units available. You already have ${existing.quantity} in your cart.`);
          return prev;
        }
        return prev.map((i) =>
          (i.id === product.id && i.selectedVariant?.id === product.selectedVariant?.id)
            ? { ...i, quantity: newQty }
            : i
        );
      }
      const newCartItem = {
        ...product,
        productId: product.productId || product.id,
        image: product.image || product.images?.[0] || '',
        quantity: qty
      };
      return [...prev, newCartItem];
    });
    toast.success(`${product.name} added to your ritual cart!`);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const clearCart = () => {
    setItems([]);
    localStorage.removeItem(CART_STORAGE_KEY);
  };

  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalUsd = items.reduce((sum, item) => sum + ((item.priceUsd || 0) * item.quantity), 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, clearCart, total, totalUsd }}>
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
