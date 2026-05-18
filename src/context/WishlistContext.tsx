import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { Product } from '../types';
import { toast } from 'sonner';

interface WishlistContextType {
  wishlistIds: string[];
  toggleWishlist: (product: Product) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);

  useEffect(() => {
    if (!user) {
      setWishlistIds([]);
      return;
    }

    const docRef = doc(db, 'wishlist', user.uid);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setWishlistIds(docSnap.data().productIds || []);
      } else {
        setWishlistIds([]);
      }
    });

    return () => unsubscribe();
  }, [user]);

  const toggleWishlist = async (product: Product) => {
    if (!user) {
      toast.error("Please sign in to save items to your wishlist.");
      return;
    }

    const docRef = doc(db, 'wishlist', user.uid);
    const isAdding = !wishlistIds.includes(product.id);
    const newIds = isAdding
      ? [...wishlistIds, product.id]
      : wishlistIds.filter(id => id !== product.id);

    try {
      await setDoc(docRef, { productIds: newIds, userId: user.uid }, { merge: true });
      if (isAdding) {
        toast.success(`${product.name} added to your wishlist ritual.`);
      } else {
        toast.info(`${product.name} removed from wishlist.`);
      }
    } catch (err) {
      console.error("Error updating wishlist:", err);
      toast.error("Failed to update wishlist ritual.");
    }
  };

  const isInWishlist = (productId: string) => wishlistIds.includes(productId);

  return (
    <WishlistContext.Provider value={{ wishlistIds, toggleWishlist, isInWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
