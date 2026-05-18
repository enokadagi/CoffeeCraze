import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Star, Heart, Eye, Plus, Minus, Check, X, ArrowRight, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product } from '../../types';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { formatPrice, cn, getDualPricing } from '../../lib/utils';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [isAdded, setIsAdded] = useState(false);
  
  const { lbp, usd } = getDualPricing(product);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group relative bg-[#FDFBF9] shadow-[0_20px_50px_rgba(0,0,0,0.02)] hover:shadow-premium-2xl rounded-[2rem] sm:rounded-[3rem] lg:rounded-[3.5rem] overflow-hidden transition-all duration-1000 border border-white/80 p-3 sm:p-4 hover:-translate-y-4"
    >
      <Link to={`/product/${product.id}`} className="block relative aspect-[3/4] sm:aspect-[4/5] overflow-hidden rounded-[1.5rem] sm:rounded-[2rem] lg:rounded-[2.8rem] mb-4 sm:mb-8 bg-cream">
        <motion.img 
          src={product.images[0]} 
          alt={product.name}
          className="w-full h-full object-cover transition-all duration-1000 scale-[1.02] group-hover:scale-110"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-espresso/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
        
        {/* Quality Indicator Badge */}
        <div className="absolute top-4 sm:top-6 left-4 sm:left-6 z-20">
           <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 sm:px-4 sm:py-2 rounded-full border border-white/60 shadow-premium flex items-center gap-2">
              <Sparkles size={10} className="text-caramel-gold animate-pulse" />
              <span className="text-[8px] font-black uppercase tracking-widest text-espresso">Premium_Node</span>
           </div>
        </div>

        <div className="absolute top-4 sm:top-6 right-4 sm:right-6 z-20">
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleWishlist(product);
            }}
            className={cn(
              "w-8 h-8 sm:w-10 sm:h-10 rounded-full transition-all duration-1000 flex items-center justify-center backdrop-blur-md shadow-premium border",
              isInWishlist(product.id) 
                ? "bg-caramel text-white border-caramel" 
                : "bg-white/60 text-espresso hover:bg-espresso hover:text-white border-white/60"
            )}
          >
            <Heart size={14} className={isInWishlist(product.id) ? "fill-current" : ""} />
          </button>
        </div>

        <div className="absolute bottom-4 sm:bottom-8 left-4 sm:left-6 right-4 sm:right-6 translate-y-12 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-700 z-10">
          <button 
            onClick={handleAddToCart}
            className={cn(
              "w-full py-3 sm:py-4 rounded-full flex items-center justify-center gap-4 text-[10px] font-black uppercase tracking-[0.5em] transition-all duration-700 italic shadow-premium border border-white/20",
              isAdded ? "bg-emerald-500 text-white" : "bg-white/90 backdrop-blur-md text-espresso hover:bg-caramel hover:text-white"
            )}
          >
            {isAdded ? <Check size={16} /> : <Plus size={16} />}
            {isAdded ? "Allocated" : "Quick Add"}
          </button>
        </div>
      </Link>

      <div className="px-4 sm:px-5 pb-3 sm:pb-4 space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-1.5 h-1.5 rounded-full bg-caramel" />
             <span className="text-[9px] font-black text-coffee-300 uppercase tracking-[0.4em] italic">{product.category}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-0.5 sm:px-3 sm:py-1 bg-white shadow-premium rounded-full border border-coffee-50/50">
            <Star size={10} className="fill-caramel-gold text-caramel-gold" />
            <span className="text-[10px] font-black text-espresso">{product.rating.toFixed(1)}</span>
          </div>
        </div>

        <div className="space-y-3">
          <Link to={`/product/${product.id}`} className="block">
            <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-display font-black text-espresso italic group-hover:text-caramel transition-colors tracking-tightest leading-[1.1] uppercase">
              {product.name}
            </h3>
          </Link>
          
          <div className="flex items-center gap-4 overflow-hidden">
             <div className="h-[2px] w-6 sm:w-8 bg-coffee-50 shrink-0" />
             <p className="text-[9px] font-black text-coffee-200 uppercase tracking-[0.3em] italic truncate">
               ID_{product.id.split('-')[1]?.toUpperCase() || product.id.slice(0, 4).toUpperCase()}
             </p>
          </div>
        </div>
        
        <div className="pt-2 flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-3">
          <div className="flex flex-col">
             <span className="text-xl sm:text-2xl md:text-3xl font-display font-black text-espresso tracking-tightest italic leading-none">
               {formatPrice(lbp)}
             </span>
             {usd > 0 && (
               <span className="text-[10px] md:text-xs font-black text-coffee-400 uppercase tracking-widest leading-none mt-1">
                 USD ${usd.toFixed(2)}
               </span>
             )}
          </div>
          <div className="flex items-center gap-3">
            <span className={cn(
               "text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md italic",
               product.stock > 10 ? "text-emerald-500 bg-emerald-50" : product.stock > 0 ? "text-amber-500 bg-amber-50" : "text-red-500 bg-red-50"
            )}>
               {product.stock > 0 ? 'In Stock' : 'Out'}
            </span>
            <Link to={`/product/${product.id}`} className="w-8 h-8 sm:w-10 sm:h-10 bg-cream text-espresso hover:bg-espresso hover:text-white rounded-full flex items-center justify-center transition-all duration-700 shadow-premium group/arrow">
              <ArrowRight size={16} className="group-hover/arrow:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
