import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, addDoc, updateDoc, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Product, Review } from '../types';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { formatPrice, cn, getDualPricing } from '../lib/utils';
import { ShoppingCart, Star, Heart, ArrowLeft, Truck, ShieldCheck, Zap, MessageSquare, ArrowRight, ThumbsUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ProductCard from '../components/shop/ProductCard';
import { toast } from 'sonner';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { user, profile } = useAuth();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);

  useEffect(() => {
    if (product?.variants && product.variants.length > 0 && !selectedVariant) {
       setSelectedVariant(product.variants[0]);
    }
  }, [product, selectedVariant]);

  const isWholesale = profile?.role === 'wholesale';
  
  // Base pricing based on variant or product
  const basePricingObj = {
     priceLbp: selectedVariant?.priceLbp || selectedVariant?.price || product?.priceLbp || product?.price || 0,
     priceUsd: selectedVariant?.priceUsd || product?.priceUsd || 0
  };
  
  const dualBase = getDualPricing(basePricingObj as any);
  
  let currentPriceLbp = dualBase.lbp;
  let currentPriceUsd = dualBase.usd;
  
  if (isWholesale) {
    const wholesaleObj = {
      priceLbp: product?.wholesalePriceLbp || currentPriceLbp,
      priceUsd: product?.wholesalePriceUsd || currentPriceUsd
    };
    const dualWholesale = getDualPricing(wholesaleObj as any);
    currentPriceLbp = dualWholesale.lbp;
    currentPriceUsd = dualWholesale.usd;
    
    if (quantity >= 10) {
      currentPriceLbp *= 0.85; // 15% volume discount
      currentPriceUsd *= 0.85;
    }
  }
  
  const currentImage = selectedVariant?.image || product?.images[activeImage];

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const docRef = doc(db, 'products', id);
        const docSnap = await getDoc(docRef);

        let currentProduct: Product | null = null;

        if (docSnap.exists()) {
          currentProduct = { id: docSnap.id, ...docSnap.data() } as Product;
        }
        
        if (currentProduct) {
          setProduct(currentProduct);
          
          // Fetch related products (Category based + potential tags logic)
          const relatedQ = query(
            collection(db, 'products'),
            where('category', '==', currentProduct.category),
            limit(10)
          );
          const relatedSnap = await getDocs(relatedQ);
          const related = relatedSnap.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as Product))
            .filter(p => p.id !== id)
            .sort((a, b) => {
               // Boost items with matching tags
               const aTags = a.tags?.filter(t => currentProduct?.tags.includes(t)).length || 0;
               const bTags = b.tags?.filter(t => currentProduct?.tags.includes(t)).length || 0;
               return bTags - aTags;
            })
            .slice(0, 4);
          
          setRelatedProducts(related);
        }

        // Fetch reviews
        const reviewsQuery = query(collection(db, 'reviews'), where('productId', '==', id));
        const reviewsSnap = await getDocs(reviewsQuery);
        setReviews(reviewsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review)));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id || !product) {
       toast.error("Protocol authentication error. Signal lost.");
       return;
    }
    setSubmittingReview(true);
    try {
      const reviewData = {
        productId: id,
        userId: user.uid,
        userName: profile?.displayName || 'Anonymous',
        rating: newReview.rating,
        comment: newReview.comment,
        createdAt: new Date().toISOString(),
      };
      
      const docRef = await addDoc(collection(db, 'reviews'), reviewData);
      const newReviewObj = { id: docRef.id, ...reviewData };
      setReviews(prev => [newReviewObj, ...prev]);
      toast.success("Engagement protocol logged successfully.");

      // Update product rating (naive average for now)
      const newReviewCount = (product.reviewCount || 0) + 1;
      const newRating = ((product.rating * (product.reviewCount || 0)) + newReview.rating) / newReviewCount;
      
      setProduct(prev => prev ? { ...prev, rating: parseFloat(newRating.toFixed(1)), reviewCount: newReviewCount } : null);
      try {
        await updateDoc(doc(db, 'products', id), {
          rating: parseFloat(newRating.toFixed(1)),
          reviewCount: newReviewCount
        });
      } catch (e) { /* Ignore sample data */ }

      setNewReview({ rating: 5, comment: '' });
    } catch (err) {
      console.error(err);
      toast.error("Transmission failed. Retry cycle.");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) return (
    <div className="pt-40 pb-40 md:pt-60 md:pb-60 flex flex-col items-center justify-center space-y-8 bg-cream min-h-screen">
      <div className="w-24 h-24 border-4 border-mocha/20 border-t-espresso rounded-full animate-spin shadow-premium"></div>
      <p className="text-[10px] font-black uppercase tracking-[0.8em] text-coffee-300 italic">Synchronizing Roast Node...</p>
    </div>
  );

  if (!product) return (
    <div className="pt-40 md:pt-60 text-center min-h-screen bg-cream">
      <h1 className="text-4xl font-display font-black text-espresso italic">NODE_NOT_FOUND</h1>
      <button onClick={() => navigate('/shop')} className="mt-8 px-8 py-4 bg-espresso text-white rounded-full text-[10px] font-black uppercase tracking-widest italic">Return to Catalog</button>
    </div>
  );

  return (
    <div className="pt-24 pb-24 md:pt-40 md:pb-40 lg:pt-56 lg:pb-56 grainy-overlay min-h-screen bg-cream">
      <div className="mesh-gradient absolute inset-0 opacity-20 pointer-events-none" />
      
      <div className="page-container relative z-10">
        <button onClick={() => navigate(-1)} className="group flex items-center gap-4 sm:gap-6 mb-8 sm:mb-12 md:mb-24 text-coffee-300 hover:text-espresso transition-all text-[11px] font-black uppercase tracking-[0.6em] italic">
          <ArrowLeft size={16} strokeWidth={3} className="group-hover:-translate-x-3 transition-transform duration-700" /> Protocol Return
        </button>

        {/* Main Grid: Cinematic Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 md:gap-16 lg:gap-32 mb-16 sm:mb-24 md:mb-32 lg:mb-56 items-start">
          {/* Immersive Imagery */}
          <div className="lg:col-span-7 space-y-6 sm:space-y-8 md:space-y-12">
            <div className="aspect-square md:aspect-[4/5] bg-white backdrop-blur-3xl rounded-[3rem] md:rounded-[6rem] overflow-hidden border border-white/60 shadow-premium-xl relative group">
              <AnimatePresence mode="wait">
                <motion.img 
                  key={activeImage}
                  initial={{ scale: 1.1, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
                  src={currentImage} 
                  className="w-full h-full object-cover grayscale transition-all duration-[2s] group-hover:grayscale-0 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
              </AnimatePresence>
              
              <div className="absolute top-6 sm:top-8 md:top-12 left-6 sm:left-8 md:left-12 flex flex-col gap-3 sm:gap-4">
                {product.isSubscriptionEligible && (
                  <span className="px-4 sm:px-6 md:px-8 py-2 sm:py-3 bg-espresso text-caramel-gold text-[10px] font-black uppercase tracking-[0.4em] rounded-full shadow-premium italic border border-caramel-gold/20">Ritual Authorized</span>
                )}
                <span className="px-4 sm:px-6 md:px-8 py-2 sm:py-3 bg-caramel-gold text-white text-[10px] font-black uppercase tracking-[0.4em] rounded-full shadow-premium italic">Premium Allocation</span>
              </div>

              <button 
                onClick={() => toggleWishlist(product)}
                className={cn(
                  "absolute top-6 sm:top-8 md:top-12 right-6 sm:right-8 md:right-12 w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-white/40 backdrop-blur-2xl rounded-full shadow-premium ring-1 ring-white/60 transition-all duration-700 active:scale-90 flex items-center justify-center hover-premium",
                  isInWishlist(product.id) 
                    ? "text-red-500 bg-white" 
                    : "text-coffee-400 hover:text-white hover:bg-espresso"
                )}
              >
                <Heart size={24} className={isInWishlist(product.id) ? "fill-current" : ""} />
              </button>
            </div>

            <div className="flex flex-wrap md:flex-nowrap gap-4 md:gap-8 px-4 md:px-8">
              {product.images.map((img, i) => (
                <button 
                  key={i} 
                  onClick={() => {
                    setActiveImage(i);
                    // clear variant image selection when manual gallery clicked if we want, or just leave it
                    if (selectedVariant?.image) setSelectedVariant({...selectedVariant, image: undefined});
                  }}
                  className={cn(
                    "w-16 h-16 sm:w-20 sm:h-20 md:w-32 md:h-32 rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden border-2 transition-all duration-1000 relative group shadow-premium hover-premium",
                    (currentImage === img) 
                      ? "border-caramel-gold bg-white shadow-premium translate-y-[-12px]" 
                      : "border-transparent opacity-40 grayscale hover:opacity-100 hover:grayscale-0"
                  )}
                >
                  <img src={img} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-125" referrerPolicy="no-referrer" />
                </button>
              ))}
            </div>
          </div>

          {/* Technical Specifications */}
          <div className="lg:col-span-5 space-y-8 sm:space-y-10 md:space-y-20 pt-8 md:pt-12">
            <div className="space-y-6 sm:space-y-8 md:space-y-12">
               <div className="flex items-center justify-between">
                  <span className="stat-label text-caramel-gold uppercase">{product.category} ARCHIVE</span>
                  <div className="flex items-center gap-3 px-4 md:px-6 py-2 md:py-2.5 bg-white shadow-premium rounded-full">
                     <Star size={14} className="fill-caramel-gold text-caramel-gold" />
                     <span className="text-sm font-black text-espresso tracking-tighter italic">{product.rating.toFixed(1)}</span>
                  </div>
               </div>
               
               <h1 className="text-3xl sm:text-4xl lg:text-6xl font-display font-black text-espresso leading-[1] md:leading-[1.1] tracking-tightest italic uppercase">
                 {product.name}
               </h1>

               <div className="flex flex-col gap-2 border-l-4 border-caramel pl-4 sm:pl-6 md:pl-8">
                  <div className="flex items-center gap-4 mb-2">
                     <span className={cn(
                       "px-4 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-full italic",
                       product.stock > 10 ? "bg-emerald-500/10 text-emerald-600" : product.stock > 0 ? "bg-amber-500/10 text-amber-600" : "bg-red-500/10 text-red-600"
                     )}>
                       {product.stock > 10 ? 'In Stock' : product.stock > 0 ? `Low Stock (${product.stock} left)` : 'Out of Stock'}
                     </span>
                  </div>
                  <div className="flex flex-col md:flex-row md:items-end gap-2 md:gap-4 text-espresso">
                     <span className="text-3xl md:text-4xl font-display font-black tracking-tightest italic leading-none">
                       {formatPrice(currentPriceLbp)}
                     </span>
                  </div>
                  {currentPriceUsd > 0 && (
                    <div className="flex flex-col md:flex-row md:items-end gap-1 md:gap-3 text-coffee-500 mt-2">
                       <span className="text-xl md:text-2xl font-display font-black tracking-tightest italic leading-none">
                         ${currentPriceUsd.toFixed(2)}
                       </span>
                       <span className="text-[9px] font-black uppercase tracking-[0.3em] italic md:mb-0.5">USD</span>
                    </div>
                  )}
               </div>
            </div>

            <div className="p-4 sm:p-6 md:p-8 lg:p-10 bg-white/60 backdrop-blur-3xl border border-white/60 rounded-[2rem] md:rounded-[3rem] shadow-premium-lg group hover:bg-white transition-colors duration-1000 space-y-6 sm:space-y-8 md:space-y-10">
               <p className="text-coffee-600 leading-relaxed font-serif italic text-base md:text-lg">"{product.description}"</p>
               
               {product.variants && product.variants.length > 0 && (
                 <div className="space-y-4 sm:space-y-6 pt-4 sm:pt-6 border-t border-espresso/5">
                   <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-coffee-400 italic">Select Configuration</h3>
                   <div className="flex flex-wrap gap-3 sm:gap-4">
                     {product.variants.map((v) => (
                       <button
                         key={v.id}
                         onClick={() => setSelectedVariant(v)}
                         className={cn(
                           "px-4 sm:px-5 md:px-6 py-3 sm:py-4 rounded-[2rem] border transition-all text-sm font-black italic tracking-wider shadow-sm",
                           selectedVariant?.id === v.id
                             ? "border-caramel bg-espresso text-white scale-105"
                             : "border-espresso/10 bg-white text-espresso hover:border-caramel hover:text-caramel"
                         )}
                       >
                         {v.name}
                       </button>
                     ))}
                   </div>
                 </div>
               )}
               
               <div className="flex flex-wrap gap-2 sm:gap-3 pt-4 sm:pt-6 border-t border-espresso/5">
                  {product.tags.map(tag => (
                    <span key={tag} className="px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 bg-espresso text-white rounded-full text-[8.5px] font-black uppercase tracking-[0.35em] italic shadow-premium hover:bg-caramel-gold transition-all duration-700 cursor-default">
                      {tag}
                    </span>
                  ))}
               </div>
            </div>

            <div className="space-y-6 sm:space-y-8">
              <div className="flex flex-col md:flex-row items-center gap-4 sm:gap-6">
                <div className="flex items-center bg-white border border-espresso/10 rounded-full shadow-premium md:w-auto w-full justify-between px-4 py-2">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-espresso hover:bg-cream transition-colors text-xl font-black"
                  >-</button>
                  <span className="w-12 sm:w-16 text-center font-display font-black text-xl sm:text-2xl italic">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-espresso hover:bg-cream transition-colors text-xl font-black"
                  >+</button>
                </div>
                <button 
                  onClick={() => {
                    const productToAdd = { ...product, price: currentPriceLbp, priceUsd: currentPriceUsd };
                    if (selectedVariant) {
                       addItem({ ...productToAdd, selectedVariant }, quantity);
                    } else {
                       addItem(productToAdd, quantity);
                    }
                    setQuantity(1);
                    toast.success("Allocation Synchronized.");
                  }}
                  className="flex-grow w-full md:w-auto py-4 md:py-5 bg-espresso text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] md:tracking-[0.5em] transition-all hover:bg-caramel-gold hover:text-white flex items-center justify-center gap-4 md:gap-6 shadow-premium-xl active:scale-[0.98] duration-700 italic group/btn ring-1 ring-white/10"
                >
                  <ShoppingCart size={18} strokeWidth={2.5} className="group-hover:rotate-12 transition-transform duration-700" /> 
                  Add {quantity} to Cart
                </button>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:gap-8">
                <div className="flex items-center gap-4 sm:gap-6 md:gap-10 p-4 sm:p-6 md:p-10 bg-white/60 backdrop-blur-xl rounded-[2.5rem] md:rounded-[4rem] border border-white/60 group hover:shadow-premium-xl transition-all duration-1000">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-espresso text-caramel-gold rounded-2xl md:rounded-3xl flex items-center justify-center shadow-premium transition-all duration-700 group-hover:rotate-12 shrink-0">
                    <Truck size={28} />
                  </div>
                  <div className="space-y-1 sm:space-y-2">
                    <p className="text-sm font-black text-espresso uppercase tracking-widest italic">Beirut Logistic Node</p>
                    <p className="text-[10px] font-black text-coffee-300 uppercase tracking-[0.3em] italic leading-none">Global Latency: Optimal Distribution</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sensory Alignment: RELATED PRODUCTS */}
        {relatedProducts.length > 0 && (
          <section className="mb-16 sm:mb-24 md:mb-32 lg:mb-56 space-y-12 sm:space-y-16 md:space-y-24">
            <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-8 sm:gap-10 md:gap-16 border-b border-coffee-50 pb-8 sm:pb-12 md:pb-20">
              <div className="space-y-4 sm:space-y-6 md:space-y-8">
                <span className="stat-label text-caramel-gold uppercase">Neural Sync</span>
                <h2 className="text-5xl md:text-7xl font-display font-black text-espresso italic tracking-tightest leading-none">Shared <br/><span className="not-italic text-coffee-400">Genotypes.</span></h2>
              </div>
              <Link to="/shop" className="group text-[11px] font-black uppercase tracking-[0.6em] text-espresso pb-4 border-b-4 border-coffee-50 hover:border-caramel-gold transition-all duration-700 italic inline-flex items-center gap-6">
                Full Database Protocol <ArrowRight size={20} className="group-hover:translate-x-4 transition-transform duration-700" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12">
              {relatedProducts.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}

        {/* Social Validation Protocol: REVIEWS */}
        <div className="space-y-12 sm:space-y-16 md:space-y-32">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8 sm:gap-12 lg:gap-24 p-6 sm:p-8 md:p-12 lg:p-20 bg-espresso text-white rounded-[3rem] lg:rounded-[6rem] relative overflow-hidden shadow-premium-xl">
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(140,106,77,0.2),transparent)]" />
             <div className="relative z-10 space-y-6 sm:space-y-8 md:space-y-10 max-w-2xl text-center lg:text-left">
              <span className="stat-label text-caramel-gold uppercase">Global Registry</span>
              <h2 className="text-5xl md:text-7xl font-display font-black leading-[0.9] md:leading-[0.8] tracking-tightest italic">Trusted By <br/><span className="text-white font-black not-italic block uppercase">The Elite.</span></h2>
              <p className="text-lg md:text-xl text-coffee-400 font-serif italic leading-relaxed">"Verification logs aggregated from verified neural roastery nodes."</p>
            </div>
            <div className="relative z-10 flex items-center gap-12 lg:gap-32 w-full lg:w-auto justify-center">
               <div className="text-center">
                  <span className="block text-7xl md:text-9xl font-display font-black text-caramel-gold tracking-tightest italic">{product.rating}</span>
                  <span className="text-[9px] md:text-[10px] font-black text-coffee-500 uppercase tracking-[0.4em] italic leading-none block mt-2">Node Score</span>
               </div>
               <div className="text-center">
                  <span className="block text-7xl md:text-9xl font-display font-black text-white tracking-tightest italic">{product.reviewCount}</span>
                  <span className="text-[9px] md:text-[10px] font-black text-coffee-500 uppercase tracking-[0.4em] italic leading-none block mt-2">Logs</span>
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-16">
            {reviews.length > 0 ? (
              reviews.map(review => (
                <motion.div 
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  key={review.id} 
                  className="p-6 sm:p-8 md:p-12 lg:p-16 bg-white border border-white/60 rounded-[3rem] md:rounded-[5rem] shadow-premium hover:shadow-premium-xl transition-all duration-1000 flex flex-col justify-between group hover-premium"
                >
                  <div className="space-y-6 sm:space-y-8 md:space-y-10">
                     <div className="flex items-center justify-between">
                       <div className="flex gap-1 sm:gap-2">
                         {[...Array(5)].map((_, i) => (
                           <Star key={i} size={14} className={cn(i < review.rating ? "fill-caramel-gold text-caramel-gold" : "text-coffee-100")} />
                         ))}
                       </div>
                       <div className="px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 bg-emerald-500/10 text-emerald-500 text-[9px] font-black uppercase tracking-widest rounded-full flex items-center gap-2 italic">
                          <ShieldCheck size={12} /> VERIFIED_ORIGIN
                       </div>
                     </div>
                     <p className="text-xl sm:text-2xl md:text-3xl text-espresso font-serif italic leading-snug">"{review.comment}"</p>
                  </div>

                  <div className="flex items-center gap-4 md:gap-6 pt-6 sm:pt-8 md:pt-12 border-t border-coffee-50 mt-6 sm:mt-8 md:mt-12">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 bg-espresso text-caramel-gold rounded-2xl md:rounded-3xl flex items-center justify-center font-black text-lg sm:text-xl md:text-2xl italic shadow-premium group-hover:rotate-12 transition-transform duration-700">{review.userName[0]}</div>
                    <div className="space-y-1">
                      <p className="font-black text-sm text-espresso uppercase tracking-widest italic">{review.userName}</p>
                      <p className="text-[9px] text-coffee-300 font-black uppercase tracking-[0.3em]">{new Date(review.createdAt).toLocaleDateString()}_PROTOCOL</p>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="lg:col-span-3 py-16 sm:py-24 md:py-44 bg-white rounded-[3rem] md:rounded-[6rem] border-2 border-dashed border-mocha/20 flex flex-col items-center justify-center space-y-6 sm:space-y-8 md:space-y-10 shadow-premium">
                <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 bg-cream rounded-full flex items-center justify-center shadow-premium-lg text-coffee-100 border border-white">
                  <MessageSquare size={40} />
                </div>
                <div className="text-center space-y-3 sm:space-y-4 px-6 md:px-0">
                  <h3 className="text-2xl sm:text-3xl md:text-4xl font-display font-black text-espresso italic tracking-tightest uppercase">Archive Empty</h3>
                  <p className="text-lg sm:text-xl text-coffee-400 font-serif italic max-w-sm mx-auto">Be the first node to validate this specific ritual harvest.</p>
                </div>
              </div>
            )}
          </div>

          {/* New Review Entry Protocol */}
          <div className="flex justify-center pt-12 sm:pt-16 md:pt-24 px-4 md:px-0">
             <div className="w-full max-w-5xl p-6 sm:p-8 md:p-16 lg:p-20 bg-white shadow-premium-xl rounded-[3rem] md:rounded-[7rem] border border-white/60 relative overflow-hidden text-center space-y-8 sm:space-y-10 md:space-y-16">
                <div className="mesh-gradient absolute inset-0 opacity-10 pointer-events-none" />
                <div className="space-y-4 sm:space-y-6 md:space-y-8 relative z-10">
                  <h3 className="text-3xl sm:text-4xl md:text-6xl font-display font-black text-espresso italic tracking-tighter leading-none uppercase">Post Your <br className="md:hidden" /><span className="not-italic text-caramel">Validation.</span></h3>
                  <p className="text-base sm:text-lg md:text-2xl text-coffee-400 font-serif italic max-w-xl mx-auto leading-relaxed">Personal roastery logs stabilize the local consensus network.</p>
                </div>
                
                {user ? (
                  <form onSubmit={handleReviewSubmit} className="max-w-2xl mx-auto space-y-6 sm:space-y-8 md:space-y-12 text-left relative z-10">
                    <div className="space-y-6 sm:space-y-8 text-center">
                      <div className="inline-flex gap-2 md:gap-6 p-4 sm:p-6 md:p-10 bg-cream rounded-[2.5rem] md:rounded-[4rem] border border-white shadow-premium justify-center mx-auto">
                        {[1, 2, 3, 4, 5].map(star => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setNewReview({ ...newReview, rating: star })}
                            className="hover:scale-150 transition-all duration-700 active:scale-90"
                          >
                            <Star 
                              size={32} 
                              className={cn(
                                "transition-colors duration-700",
                                star <= newReview.rating ? "fill-caramel-gold text-caramel-gold shadow-glow" : "text-coffee-50"
                              )} 
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-6 sm:space-y-8">
                      <textarea 
                        value={newReview.comment}
                        onChange={e => setNewReview({ ...newReview, comment: e.target.value })}
                        required
                        placeholder="INITIATE_SENSORY_LOG..."
                        className="w-full p-8 sm:p-10 md:p-12 bg-cream border border-white rounded-[5rem] h-48 sm:h-64 focus:bg-white focus:ring-[20px] focus:ring-espresso/5 focus:border-caramel-gold outline-none transition-all resize-none text-lg sm:text-xl font-serif italic placeholder:text-coffee-200 shadow-inner"
                      />
                    </div>
                    <button 
                      disabled={submittingReview}
                      type="submit" 
                      className="btn-premium w-full py-5 sm:py-7 text-sm group italic"
                    >
                      {submittingReview ? 'SYNCHRONIZING...' : 'UPLOAD PROTOCOL LOG'}
                      <ArrowRight size={20} className="group-hover:translate-x-6 transition-transform duration-700" />
                    </button>
                  </form>
                ) : (
                  <div className="space-y-8 sm:space-y-12 relative z-10">
                     <button 
                       onClick={() => navigate('/auth')}
                       className="btn-premium px-12 sm:px-16 md:px-20 py-6 sm:py-8 italic"
                     >
                       AUTHORIZE_CREDENTIALS
                     </button>
                     <p className="text-[11px] font-black text-coffee-300 uppercase tracking-[1em] italic">Identity Protocol Required</p>
                  </div>
                )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
