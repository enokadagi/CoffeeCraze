import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Search, ShoppingCart, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext';
import { Product } from '../types';
import { SAMPLE_PRODUCTS } from '../lib/sampleData';
import { collection, getDocs, query, where, documentId } from 'firebase/firestore';
import { db } from '../lib/firebase';
import ProductCard from '../components/shop/ProductCard';

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
        // Since we have a mix of sample data and potentially real data
        // We check sample products first
        const sampleWishlist = SAMPLE_PRODUCTS
          .map((p, i) => ({ id: `p-${i}`, ...p } as Product))
          .filter(p => wishlistIds.includes(p.id));

        // If some IDs are not in samples, we'd fetch from Firestore
        // For this demo/app structure, we'll assume samples + Firestore
        const remainingIds = wishlistIds.filter(id => !id.startsWith('p-'));
        
        let firestoreProducts: Product[] = [];
        if (remainingIds.length > 0) {
          const q = query(collection(db, 'products'), where(documentId(), 'in', remainingIds));
          const querySnapshot = await getDocs(q);
          firestoreProducts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        }

        setProducts([...sampleWishlist, ...firestoreProducts]);
      } catch (err) {
        console.error("Error fetching wishlist products:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchWishlistProducts();
  }, [wishlistIds]);

  return (
    <div className="pt-56 pb-40 grainy-overlay min-h-screen relative overflow-hidden bg-cream">
      <div className="mesh-gradient absolute inset-0 opacity-20 pointer-events-none" />
      
      <div className="page-container relative z-10 mx-auto max-w-7xl px-6">
        <header className="mb-32 space-y-8 text-center md:text-left">
          <span className="stat-label text-caramel">Saved Coordinates</span>
          <div className="flex flex-col md:flex-row items-end justify-between gap-12 border-b border-espresso/5 pb-20">
            <h1 className="text-8xl font-display font-black text-espresso leading-none tracking-tightest italic uppercase">Private <br/><span className="not-italic text-coffee-400">Wishlist.</span></h1>
            <div className="text-right hidden md:block">
               <span className="text-[11px] font-black text-coffee-300 uppercase tracking-[0.6em] italic block mb-2">{products.length}_UNIT_ARCHIVED</span>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
          {[1, 2, 4, 5].map(i => (
            <div key={i} className="aspect-[4/5] bg-white animate-pulse rounded-[3rem] border border-espresso/5 shadow-inner" />
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-12">
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
        <div className="py-60 text-center flex flex-col items-center justify-center space-y-16 bg-white/40 backdrop-blur-xl rounded-[6rem] border-2 border-dashed border-espresso/10">
          <div className="w-40 h-40 bg-white rounded-full flex items-center justify-center shadow-premium-xl text-coffee-100 ring-1 ring-white">
            <Heart size={64} strokeWidth={0.5} />
          </div>
          <div className="space-y-6">
            <h2 className="text-6xl font-display font-black text-espresso italic tracking-tightest leading-none">Archive <br/><span className="not-italic text-coffee-400">Empty.</span></h2>
            <p className="text-xl text-coffee-400 font-serif italic max-w-sm mx-auto leading-relaxed">No sensory protocols have been flagged for future extraction.</p>
          </div>
          <Link 
            to="/shop" 
            className="btn-premium px-16 py-7 italic group"
          >
            Explore Databank <ArrowRight size={20} className="group-hover:translate-x-4 transition-transform duration-700" />
          </Link>
        </div>
      )}
      </div>
    </div>
  );
}
