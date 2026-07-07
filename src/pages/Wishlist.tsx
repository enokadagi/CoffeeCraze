import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Search, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext';
import { Product } from '../types';
import { collection, getDocs, query, where, documentId } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'sonner';
import ProductCard from '../components/shop/ProductCard';
import SEO from '../components/common/SEO';

export default function Wishlist() {
  const { wishlistIds } = useWishlist();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWishlistProducts = async () => {
      if (wishlistIds.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        let firestoreProducts: Product[] = [];
        if (wishlistIds.length > 0) {
          const q = query(collection(db, 'products'), where(documentId(), 'in', wishlistIds.slice(0, 30)));
          const querySnapshot = await getDocs(q);
          firestoreProducts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        }

        setProducts(firestoreProducts);
      } catch (err) {
        console.error("Error fetching wishlist products:", err);
        toast.error("Failed to load your wishlist. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchWishlistProducts();
  }, [wishlistIds]);

  return (
    <div className="pt-24 sm:pt-40 md:pt-56 pb-16 sm:pb-24 md:pb-40 min-h-screen relative overflow-hidden bg-cream">
      <SEO title="Wishlist" description="Your saved coffee selections and favorite ritual products." />
      <div className="mesh-gradient absolute inset-0 opacity-20 pointer-events-none" />
      
      <div className="page-container relative z-10">
        <header className="mb-16 md:mb-24 lg:mb-32 space-y-8 text-center sm:text-left">
          <span className="text-caption text-caramel">Saved Coordinates</span>
          <div className="flex flex-col sm:flex-row items-end justify-between gap-6 sm:gap-8 lg:gap-12 border-b border-espresso/5 pb-10 sm:pb-14 md:pb-20">
            <h1 className="text-display font-display font-black text-espresso leading-none tracking-tightest uppercase">Saved <br/><span className="text-caramel">Favorites.</span></h1>
            <div className="text-right hidden sm:block">
                <span className="text-[11px] font-black text-text-secondary uppercase tracking-[0.6em] block mb-2">{products.length} items saved</span>
               <div className="h-1 w-32 bg-caramel/20 rounded-full ml-auto overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 2 }}
                    className="h-full bg-caramel"
                  />
               </div>
            </div>
          </div>
        </header>

      {loading ? (
        <div className="grid-responsive">
          {[1, 2, 4, 5].map(i => (
            <div key={i} className="aspect-[4/5] bg-white animate-pulse rounded-[3rem] border border-espresso/5 shadow-inner" />
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8 lg:gap-10 xl:gap-12">
          <AnimatePresence>
            {products.map((product) => (
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="py-20 sm:py-40 md:py-60 text-center flex flex-col items-center justify-center space-y-16 bg-white/40 backdrop-blur-xl rounded-[4rem] sm:rounded-[5rem] lg:rounded-[6rem] border-2 border-dashed border-espresso/10">
          <div className="w-24 sm:w-32 md:w-40 h-24 sm:h-32 md:h-40 bg-white rounded-full flex items-center justify-center shadow-premium-xl text-coffee-100 ring-1 ring-white">
            <Heart size={40} strokeWidth={0.5} />
          </div>
          <div className="space-y-6">
            <h2 className="text-h1 font-display font-black text-espresso tracking-tightest leading-none">No Favorites <br/><span className="text-caramel">Yet.</span></h2>
            <p className="text-body text-text-secondary max-w-sm mx-auto leading-relaxed">Save your favorite coffees and accessories here so you can reorder in one easy checkout.</p>
          </div>
          <Link 
            to="/shop" 
            className="btn btn-primary px-8 sm:px-12 md:px-16 py-4 sm:py-5 md:py-7 group"
          >
            Shop Coffee <ArrowRight size={20} className="group-hover:translate-x-4 transition-transform duration-700" />
          </Link>
        </div>
      )}
      </div>
    </div>
  );
}
