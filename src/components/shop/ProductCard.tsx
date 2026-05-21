import { useState } from 'react';
import { Link } from 'react-router-dom';
import ImageWithFallback from '../common/ImageWithFallback';
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
      className="group relative bg-white shadow-premium hover:shadow-premium-lg rounded-2xl lg:rounded-3xl overflow-hidden transition-all duration-500 border border-white/80 p-3 sm:p-4 hover:-translate-y-1 hover-lift"
    >
      <Link to={`/product/${product.id}`} className="block relative aspect-[3/4] sm:aspect-[4/5] overflow-hidden rounded-xl lg:rounded-2xl mb-4 bg-cream">
        <ImageWithFallback
          src={product.images[0]}
          alt={product.name}
          className="w-full h-full object-cover transition-all duration-700 scale-100 group-hover:scale-105"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-espresso/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        
        <div className="absolute top-3 left-3 z-20">
           <div className="bg-white/90 backdrop-blur-md px-2.5 py-1.5 rounded-full border border-white/60 shadow-premium flex items-center gap-1.5">
              <Sparkles size={8} className="text-caramel-gold" />
              <span className="text-[7px] font-semibold tracking-wider text-espresso uppercase">Premium</span>
           </div>
        </div>

        <div className="absolute top-3 right-3 z-20">
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleWishlist(product);
            }}
            className={cn(
              "w-8 h-8 rounded-full transition-all duration-500 flex items-center justify-center backdrop-blur-md shadow-premium border",
              isInWishlist(product.id) 
                ? "bg-caramel text-white border-caramel" 
                : "bg-white/70 text-espresso hover:bg-espresso hover:text-white border-white/60"
            )}
          >
            <Heart size={12} className={isInWishlist(product.id) ? "fill-current" : ""} />
          </button>
        </div>

        <div className="absolute bottom-3 left-3 right-3 translate-y-0 opacity-100 sm:translate-y-8 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100 transition-all duration-500 z-10">
          <button 
            onClick={handleAddToCart}
            className={cn(
              "w-full py-2.5 rounded-full flex items-center justify-center gap-2 text-[10px] font-semibold tracking-wider transition-all duration-500 shadow-premium border border-white/20 backdrop-blur-md",
              isAdded ? "bg-emerald-500 text-white" : "bg-white/90 text-espresso hover:bg-espresso hover:text-white"
            )}
          >
            {isAdded ? <Check size={14} /> : <Plus size={14} />}
            {isAdded ? "Added" : "Quick Add"}
          </button>
        </div>
      </Link>

      <div className="px-3 sm:px-4 pb-2 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-medium text-coffee-400 uppercase tracking-wider">{product.category}</span>
          <div className="flex items-center gap-1 px-2 py-0.5 bg-white shadow-premium rounded-full">
            <Star size={9} className="fill-caramel-gold text-caramel-gold" />
            <span className="text-[10px] font-semibold text-espresso">{product.rating.toFixed(1)}</span>
          </div>
        </div>

        <Link to={`/product/${product.id}`} className="block">
          <h3 className="text-fluid-title font-display font-semibold text-espresso leading-[1.08] tracking-tight">
            {product.name}
          </h3>
        </Link>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
          <div className="flex flex-col min-w-0">
             <span className="text-fluid-title font-display font-bold text-espresso tracking-tight leading-none">
               {formatPrice(lbp)}
             </span>
             {usd > 0 && (
               <span className="text-fluid-subtitle font-medium text-coffee-500 leading-none mt-0.5">
                 ${usd.toFixed(2)} USD
               </span>
             )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn(
               "text-[9px] font-semibold tracking-wide px-2 py-0.5 rounded",
               product.stock > 10 ? "text-emerald-600 bg-emerald-50" : product.stock > 0 ? "text-amber-600 bg-amber-50" : "text-red-600 bg-red-50"
            )}>
               {product.stock > 0 ? 'In Stock' : 'Out'}
            </span>
            <Link to={`/product/${product.id}`} className="w-8 h-8 bg-cream text-espresso hover:bg-espresso hover:text-white rounded-full flex items-center justify-center transition-all duration-500 shadow-premium">
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
