import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import ImageWithFallback from '../common/ImageWithFallback';
import { ShoppingCart, Star, Heart, Eye, Plus, Check, ArrowRight, Sparkles, Clock, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import { Product } from '../../types';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { formatPrice, cn, getDualPricing } from '../../lib/utils';

interface ProductCardProps {
  product: Product;
}

const NEW_DAYS_THRESHOLD = 14;

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [isAdded, setIsAdded] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const { lbp, usd } = getDualPricing(product);

  const isNew = useMemo(() => {
    if (!product.createdAt) return false;
    const daysSinceCreated = (Date.now() - new Date(product.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceCreated <= NEW_DAYS_THRESHOLD;
  }, [product.createdAt]);

  const stockLabel = product.stock > 10 ? 'In Stock' : product.stock > 0 ? `${product.stock} left` : 'Out of Stock';
  const stockClass = product.stock > 10 ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : product.stock > 0 ? 'text-amber-600 bg-amber-50 border-amber-200' : 'text-red-600 bg-red-50 border-red-200';

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
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      className="group relative flex flex-col bg-white rounded-2xl sm:rounded-3xl overflow-hidden border border-border/60 shadow-sm hover:shadow-xl transition-all duration-500 will-change-transform h-full"
    >
      {/* Image Container --- fixed aspect ratio */}
      <Link to={`/product/${product.id}`} className="relative aspect-[4/5] sm:aspect-[4/5] overflow-hidden bg-cream/50">
        <ImageWithFallback
          src={product.images[0]}
          alt={product.name}
          className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-105 ${imgLoaded ? '' : 'opacity-0'}`}
          onLoad={() => setImgLoaded(true)}
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Badges row --- top left */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {isNew && (
            <span className="px-2.5 py-1 bg-blue-500 text-white text-[9px] font-bold uppercase tracking-wider rounded-full shadow-sm flex items-center gap-1">
              <Zap size={10} /> New
            </span>
          )}
          {product.isFeatured && (
            <span className="px-2.5 py-1 bg-amber-500 text-white text-[9px] font-bold uppercase tracking-wider rounded-full shadow-sm flex items-center gap-1">
              <Sparkles size={10} /> Featured
            </span>
          )}
        </div>

        {/* Wishlist button --- top right */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(product);
          }}
          aria-label={isInWishlist(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
          className={cn(
            'absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm backdrop-blur-sm',
            isInWishlist(product.id)
              ? 'bg-red-50 text-red-500 border border-red-200'
              : 'bg-white/80 text-text-muted border border-white/60 hover:bg-espresso hover:text-white'
          )}
        >
          <Heart size={13} className={isInWishlist(product.id) ? 'fill-current' : ''} />
        </button>

        {/* Stock badge --- bottom left */}
        <div className="absolute bottom-3 left-3 z-10">
          <span className={cn('px-2.5 py-1 text-[8px] font-bold uppercase tracking-wider rounded-full border shadow-sm bg-white/90 backdrop-blur-sm', stockClass)}>
            {stockLabel}
          </span>
        </div>

        {/* Quick add button --- bottom right */}
        <div className="absolute bottom-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
          <button
            onClick={handleAddToCart}
            disabled={product.stock <= 0}
            className={cn(
              'w-9 h-9 rounded-full flex items-center justify-center shadow-lg transition-all duration-300',
              isAdded
                ? 'bg-emerald-500 text-white'
                : product.stock <= 0
                  ? 'bg-coffee-200 text-text-muted cursor-not-allowed'
                  : 'bg-espresso text-white hover:bg-caramel hover:text-espresso'
            )}
          >
            {isAdded ? <Check size={14} /> : <Plus size={14} />}
          </button>
        </div>
      </Link>

      {/* Content */}
      <div className="flex flex-col flex-1 p-3.5 sm:p-4 gap-2">
        {/* Category + Rating */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-[9px] font-semibold text-text-muted uppercase tracking-wider truncate">{product.category}</span>
          <div className="flex items-center gap-1 shrink-0">
            <Star size={9} className="fill-amber-400 text-amber-400" />
            <span className="text-[10px] font-semibold text-espresso">{product.rating.toFixed(1)}</span>
          </div>
        </div>

        {/* Title --- max 2 lines */}
        <Link to={`/product/${product.id}`} className="block">
          <h3 className="text-sm sm:text-base font-semibold text-espresso leading-snug line-clamp-2 min-h-[2.5em]">
            {product.name}
          </h3>
        </Link>

        {/* Description --- short */}
        {product.description && (
          <p className="text-[11px] text-text-muted leading-relaxed line-clamp-1 hidden sm:block">
            {product.description}
          </p>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Price + CTA */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-border-light/60">
          <div className="flex flex-col">
            <span className="text-sm sm:text-base font-bold text-espresso leading-tight">{formatPrice(lbp)}</span>
            {usd > 0 && (
              <span className="text-[10px] font-medium text-text-muted">${usd.toFixed(2)} USD</span>
            )}
          </div>
          <button
            onClick={handleAddToCart}
            disabled={product.stock <= 0}
            className={cn(
              'px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all duration-300 shrink-0',
              isAdded
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                : product.stock <= 0
                  ? 'bg-cream text-text-muted cursor-not-allowed'
                  : 'bg-espresso text-white hover:bg-caramel hover:text-espresso shadow-sm'
            )}
          >
            {isAdded ? 'Added' : product.stock <= 0 ? 'Sold Out' : 'Add'}
          </button>
        </div>

        {/* Subscription badge */}
        {product.isSubscriptionEligible && (
          <div className="flex items-center gap-1.5 mt-1">
            <Clock size={10} className="text-caramel" />
            <span className="text-[8px] font-semibold text-caramel uppercase tracking-wider">Subscribe & Save</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
