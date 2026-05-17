import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem } from '../types';
import { toast } from 'sonner';

interface CartContextType {
  items: CartItem[];
  addItem: (item: any, qty?: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  total: number;
  totalUsd: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = (product: any, qty = 1) => {
    setItems((prev) => {
      // Find item with same id AND same variant id
      const existing = prev.find((i) => 
        i.id === product.id && 
        i.selectedVariant?.id === product.selectedVariant?.id
      );
      if (existing) {
        return prev.map((i) => 
          (i.id === product.id && i.selectedVariant?.id === product.selectedVariant?.id) 
            ? { ...i, quantity: i.quantity + qty } 
            : i
        );
      }
      return [...prev, { ...product, quantity: qty }];
    });
    toast.success(`${product.name} added to your ritual cart!`);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const clearCart = () => setItems([]);

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
