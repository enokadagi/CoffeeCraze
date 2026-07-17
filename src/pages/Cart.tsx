import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Trash2, Plus, Minus, CreditCard, Truck, ShoppingBag, ArrowRight, Tag, CheckCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import ImageWithFallback from '../components/common/ImageWithFallback';
import { formatPrice, formatLbpNumeric } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { collection, getDocs, query, where, updateDoc, doc, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';
import SEO from '../components/common/SEO';
import { useSiteSettings } from '../hooks/useSiteSettings';
import { toast } from 'sonner';

export default function Cart() {
  const { items, removeItem, addItem, updateQuantity, total, totalUsd, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const siteSettings = useSiteSettings();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Cart, 2: Checkout

  // Coupon state
  const [couponInput, setCouponInput] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountPercent: number } | null>(null);

  const deliveryFeeLbp = siteSettings?.deliveryFeeLbp ?? 25000;
  const freeDeliveryThresholdLbp = siteSettings?.freeDeliveryThresholdLbp ?? 1500000;

  const subtotal = total;
  const subtotalUsd = totalUsd;
  const shipping = subtotal > freeDeliveryThresholdLbp ? 0 : deliveryFeeLbp;
  const shippingUsd = shipping > 0 ? shipping / (siteSettings?.exchangeRate ?? 89500) : 0;
  const couponDiscount = appliedCoupon ? Math.floor(subtotal * (appliedCoupon.discountPercent / 100)) : 0;
  const grandTotal = subtotal + shipping - couponDiscount;
  const grandTotalUsd = subtotalUsd + shippingUsd - (couponDiscount / (siteSettings?.exchangeRate ?? 89500));

  const handleApplyCoupon = async () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    if (!user) { toast.error('Please sign in to apply a coupon'); return; }
    setCouponLoading(true);
    try {
      const snap = await getDocs(query(collection(db, 'coupons'), where('code', '==', code), where('active', '==', true)));
      if (snap.empty) { toast.error('Invalid or expired coupon code'); return; }
      const couponDoc = snap.docs[0];
      const couponData = couponDoc.data();
      if (couponData.usageLimit > 0 && couponData.usedCount >= couponData.usageLimit) {
        toast.error('This coupon has reached its usage limit'); return;
      }
      setAppliedCoupon({ code, discountPercent: couponData.discountPercent });
      await updateDoc(doc(db, 'coupons', couponDoc.id), { usedCount: increment(1) });
      toast.success(`Coupon applied! ${couponData.discountPercent}% off`);
    } catch (err) {
      console.error('Coupon error:', err);
      toast.error('Failed to apply coupon');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleCheckout = () => {
    if (!user) {
      navigate('/auth?redirect=/checkout');
      return;
    }
    navigate('/checkout');
  };

  if (step === 3) {
    return (
      <div className="pt-40 pb-24 md:pt-60 md:pb-40 px-6 text-center max-w-3xl mx-auto space-y-16 flex flex-col items-center justify-center min-h-screen relative overflow-hidden">
        <div className="mesh-gradient absolute inset-0 opacity-20 pointer-events-none" />
        <motion.div 
          initial={{ scale: 0.5, opacity: 0, rotate: -20 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="w-32 h-32 md:w-48 md:h-48 bg-white/40 backdrop-blur-3xl text-caramel rounded-[4rem] flex items-center justify-center shadow-premium-xl ring-1 ring-white/60 relative z-10"
        >
          <Truck size={40} strokeWidth={1} />
        </motion.div>
        <div className="space-y-8 relative z-10">
          <h1 className="text-display font-display font-black text-espresso italic leading-none tracking-tightest">Ritual <br/><span className="not-italic text-caramel">Manifested.</span></h1>
          <p className="text-text-secondary text-body md:text-2xl font-serif italic max-w-md mx-auto leading-relaxed">Your order is confirmed and on its way. Expect roasted coffee delivered with care.</p>
        </div>
        <div className="pt-8 relative z-10">
          <Link to="/shop" className="btn btn-primary px-8 md:px-12 py-4 md:py-6 italic group">
            Continue Exploration <ArrowRight size={18} className="group-hover:translate-x-4 transition-transform duration-700" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-40 pb-24 md:pt-56 md:pb-40 min-h-screen relative overflow-hidden bg-cream">
      <SEO title="Cart" description="Review your coffee selections and proceed to checkout." />
      <div className="mesh-gradient absolute inset-0 opacity-20 pointer-events-none" />
      
      <div className="page-container relative z-10">
        <header className="mb-8 sm:mb-12 lg:mb-16 space-y-4 sm:space-y-6">
          <span className="text-caption text-caramel">Your Cart</span>
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 sm:gap-8 border-b border-espresso/5 pb-6 sm:pb-10">
            <h1 className="text-display font-display font-bold text-espresso leading-none tracking-tight uppercase">Your <span className="text-text-muted">Cart.</span></h1>
            <div className="text-right">
               <span className="text-xs font-semibold text-text-muted tracking-wide">{items.length} item{items.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-32">
          {/* Cart Items */}
          <div className="lg:col-span-8">
            <AnimatePresence mode="popLayout">
              {items.length > 0 ? (
                <div className="space-y-12">
                  {items.map((item) => (
                    <motion.div 
                      key={item.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                      className="flex flex-col sm:flex-row gap-4 sm:gap-6 p-4 sm:p-6 bg-white shadow-premium border border-white/60 rounded-2xl lg:rounded-3xl transition-all duration-500 group"
                    >
                      <div className="w-full sm:w-40 lg:w-48 aspect-square sm:aspect-[4/5] bg-cream rounded-xl lg:rounded-2xl overflow-hidden flex-shrink-0 shadow-premium border border-white/60">
                        <ImageWithFallback src={item.image || item.images?.[0] || ''} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      <div className="flex-grow flex flex-col justify-between py-2 sm:py-3 gap-3 sm:gap-4">
                        <div className="flex justify-between items-start gap-4">
                          <div className="space-y-1">
                            <h3 className="text-lg sm:text-xl lg:text-2xl font-display font-bold text-espresso tracking-tight leading-none uppercase">{item.name}</h3>
                            <p className="text-xs font-medium text-caramel tracking-wide">{item.category || 'Coffee'}  -  {item.selectedVariant ? item.selectedVariant.name : 'Standard'}</p>
                          </div>
                          <div className="text-right shrink-0">
                             <p className="text-xl sm:text-2xl font-display font-bold text-espresso tracking-tight">{formatPrice(item.price)}</p>
                             {item.priceUsd && item.priceUsd > 0 && <p className="text-xs font-medium text-text-muted">${item.priceUsd.toFixed(2)} USD</p>}
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between pt-2 border-t border-espresso/5">
                          <div className="flex items-center gap-3 bg-cream shadow-premium px-3 py-1.5 rounded-full border border-white/60">
                            <button 
                              onClick={() => updateQuantity(item.id, item.quantity - 1)} 
                              className="w-8 h-8 flex items-center justify-center text-text-muted hover:text-espresso hover:bg-white rounded-xl transition-all duration-400 active:scale-75"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="text-base font-semibold w-6 text-center text-espresso">{item.quantity}</span>
                            <button 
                              onClick={() => updateQuantity(item.id, item.quantity + 1)} 
                              className="w-8 h-8 flex items-center justify-center text-text-muted hover:text-espresso hover:bg-white rounded-xl transition-all duration-400 active:scale-75"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                          
                          <button 
                            onClick={() => removeItem(item.id)} 
                            className="w-10 h-10 flex items-center justify-center text-text-muted hover:text-red-500 hover:bg-red-50 rounded-xl transition-all duration-400 border border-transparent hover:border-red-100"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="py-16 md:py-24 text-center flex flex-col items-center justify-center space-y-6 sm:space-y-8 bg-white/60 backdrop-blur-xl rounded-2xl lg:rounded-3xl border-2 border-dashed border-espresso/10 p-8">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-full flex items-center justify-center shadow-premium text-text-muted border border-white/60">
                    <ShoppingBag size={28} strokeWidth={0.5} />
                  </div>
                  <div className="space-y-3">
                    <h2 className="text-2xl sm:text-3xl font-display font-bold text-espresso tracking-tight">Your Cart is Empty</h2>
                    <p className="text-sm sm:text-base text-text-secondary max-w-sm mx-auto leading-relaxed">No items in your cart yet. Browse our collection to find your perfect brew.</p>
                  </div>
                  <Link 
                    to="/shop" 
                    className="btn btn-primary text-sm"
                  >
                    Browse Products <ArrowRight size={16} />
                  </Link>
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Checkout Panel */}
          <div className="lg:col-span-4 sticky top-40 h-fit space-y-4 sm:space-y-6">
            <div className="p-5 sm:p-6 lg:p-8 bg-espresso text-white rounded-2xl lg:rounded-3xl shadow-premium-lg relative overflow-hidden">
              <div className="space-y-1 sm:space-y-2 relative z-10 mb-4 sm:mb-6">
                <span className="text-caption text-caramel">Order Summary</span>
                <h2 className="text-xl sm:text-2xl font-display font-bold tracking-tight">Checkout</h2>
              </div>
              
              <div className="space-y-3 sm:space-y-4 text-sm text-cream relative z-10">
                <div className="flex justify-between items-center py-2">
                  <span>Subtotal</span>
                  <div className="text-right">
                    <span className="text-white font-semibold tracking-tight block">{formatPrice(subtotal)}</span>
                    {subtotalUsd > 0 && <span className="text-cream text-xs block mt-0.5">${subtotalUsd.toFixed(2)} USD</span>}
                  </div>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span>Shipping</span>
                  <span className="text-caramel font-semibold">{shipping === 0 ? 'Free' : formatPrice(shipping)}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between items-center py-2 text-emerald-400">
                    <span className="flex items-center gap-1.5"><CheckCircle size={13} /> Coupon ({appliedCoupon.code})</span>
                    <span className="font-semibold">-{formatLbpNumeric(couponDiscount)} LBP</span>
                  </div>
                )}
                <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                  <span className="text-white text-sm font-semibold">Total</span>
                  <div className="text-right">
                    <span className="text-xl sm:text-2xl font-display font-bold text-caramel-gold tracking-tight">{formatPrice(grandTotal)}</span>
                    {grandTotalUsd > 0 && <span className="text-cream text-xs block mt-0.5">${grandTotalUsd.toFixed(2)} USD</span>}
                  </div>
                </div>
              </div>

              <div className="space-y-4 relative z-10 mt-6">
                 <div className="p-4 bg-white/5 rounded-xl border border-white/5 flex items-start gap-3">
                    <Truck className="text-caramel shrink-0 mt-0.5" size={18} />
                    <div className="space-y-0.5">
                      <p className="text-xs font-semibold text-white tracking-wide">Elite Shipping</p>
                      <p className="text-[11px] text-cream">24-48h delivery with real-time tracking</p>
                    </div>
                 </div>
                 
                 <button 
                  onClick={handleCheckout}
                  disabled={items.length === 0 || loading}
                  className="btn btn-primary w-full text-sm"
                 >
                   {loading ? 'Processing...' : 'Checkout'}
                   <ArrowRight size={16} />
                 </button>

                 <div className="flex items-center justify-center gap-2 text-[11px] text-white/70">
                    <CreditCard size={14} className="text-caramel" />
                    Secure payment
                 </div>
              </div>
            </div>

            <div className="p-5 sm:p-6 bg-white shadow-premium border border-white/60 rounded-2xl lg:rounded-3xl">
              {appliedCoupon ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-600">
                    <Tag size={14} />
                    <span className="text-xs font-bold">{appliedCoupon.code} — {appliedCoupon.discountPercent}% off</span>
                  </div>
                  <button onClick={() => { setAppliedCoupon(null); setCouponInput(''); }} className="text-[10px] text-red-400 hover:text-red-600 font-bold uppercase tracking-wider">Remove</button>
                </div>
              ) : (
                <>
                  <p className="text-xs text-text-muted font-semibold tracking-wide mb-4 text-center">Have a discount code?</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter code"
                      value={couponInput}
                      onChange={e => setCouponInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleApplyCoupon()}
                      className="flex-grow bg-cream rounded-full px-4 py-2.5 text-xs outline-none focus:ring-2 focus:ring-caramel/20 border border-espresso/5 focus:border-caramel transition-all"
                    />
                    <button
                      onClick={handleApplyCoupon}
                      disabled={couponLoading || !couponInput.trim()}
                      className="bg-espresso text-white rounded-full text-xs font-semibold hover:bg-caramel transition-all duration-500 px-5 py-2.5 disabled:opacity-50"
                    >
                      {couponLoading ? '...' : 'Apply'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
