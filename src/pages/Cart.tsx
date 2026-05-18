import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Trash2, Plus, Minus, CreditCard, Truck, ShoppingBag, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { formatPrice } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../lib/firebase';

export default function Cart() {
  const { items, removeItem, addItem, total, totalUsd, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Cart, 2: Checkout

  const subtotal = total;
  const subtotalUsd = totalUsd;
  const shipping = subtotal > 1500000 ? 0 : 25000;
  const shippingUsd = subtotalUsd > 16.5 ? 0 : 0.28; // approx
  const grandTotal = subtotal + shipping;
  const grandTotalUsd = subtotalUsd + shippingUsd;

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
          <h1 className="text-fluid-hero font-display font-black text-espresso italic leading-none tracking-tightest">Ritual <br/><span className="not-italic text-caramel">Manifested.</span></h1>
          <p className="text-coffee-400 text-fluid-body md:text-2xl font-serif italic max-w-md mx-auto leading-relaxed">"The distribution protocol has been initiated. Your sensory harvest is now under elite transit."</p>
        </div>
        <div className="pt-8 relative z-10">
          <Link to="/shop" className="btn-premium px-8 md:px-12 py-4 md:py-6 italic group">
            Continue Exploration <ArrowRight size={18} className="group-hover:translate-x-4 transition-transform duration-700" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-40 pb-24 md:pt-56 md:pb-40 grainy-overlay min-h-screen relative overflow-hidden bg-cream">
      <div className="mesh-gradient absolute inset-0 opacity-20 pointer-events-none" />
      
      <div className="page-container relative z-10">
        <header className="mb-16 md:mb-32 space-y-8">
          <span className="stat-label text-caramel">Allocation Suite</span>
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-8 md:gap-12 border-b border-espresso/5 pb-10 md:pb-20">
            <h1 className="text-fluid-hero font-display font-black text-espresso leading-none tracking-tightest italic uppercase">Sensory <br/><span className="not-italic text-coffee-400">Inventory.</span></h1>
            <div className="text-right">
               <span className="text-[11px] font-black text-coffee-300 uppercase tracking-[0.6em] italic block mb-2">{items.length}_ITEMS_ACTIVE</span>
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
                      className="flex flex-col md:flex-row gap-6 md:gap-12 p-6 md:p-12 bg-white shadow-premium-xl border border-white rounded-[3rem] md:rounded-[5rem] hover:shadow-premium-2xl transition-all duration-1000 group relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-64 h-64 bg-cream blur-[80px] opacity-20 -translate-y-1/2 translate-x-1/2 rounded-full pointer-events-none transition-colors group-hover:bg-caramel/10" />
                      
                      <div className="w-full md:w-56 img-product bg-cream rounded-[3.5rem] overflow-hidden flex-shrink-0 shadow-premium group-hover:scale-105 transition-transform duration-1000 border border-white">
                        <img src={item.images[0]} className="w-full h-full object-cover grayscale-[30%] group-hover:grayscale-0 transition-all duration-1000" referrerPolicy="no-referrer" />
                      </div>
                      <div className="flex-grow flex flex-col justify-between py-6 relative z-10">
                        <div className="flex justify-between items-start gap-8">
                          <div className="space-y-3">
                            <h3 className="text-fluid-title font-display font-black text-espresso uppercase tracking-tightest leading-none italic">{item.name}</h3>
                            <p className="text-[11px] text-caramel font-black uppercase tracking-[0.4em] italic leading-none">{item.category}_NODE / {item.selectedVariant ? item.selectedVariant.name : 'PRTCL_A'}</p>
                          </div>
                          <div className="text-right mt-4 md:mt-0">
                             <p className="text-fluid-subtitle font-display font-black text-espresso italic tracking-tightest">{formatPrice(item.price)}</p>
                             {item.priceUsd && item.priceUsd > 0 && <p className="text-sm font-display font-black text-coffee-500 italic uppercase">US ${item.priceUsd.toFixed(2)}</p>}
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between pt-12">
                          <div className="flex items-center gap-8 bg-cream shadow-premium px-6 py-3 rounded-full border border-white group-hover:scale-105 transition-all duration-700">
                            <button 
                              onClick={() => removeItem(item.id)} 
                              className="w-12 h-12 flex items-center justify-center text-coffee-300 hover:text-espresso hover:bg-white rounded-2xl transition-all duration-500 active:scale-75"
                            >
                              <Minus size={20} />
                            </button>
                            <span className="text-xl md:text-2xl font-black w-8 text-center font-display text-espresso italic">{item.quantity}</span>
                            <button 
                              onClick={() => addItem(item)} 
                              className="w-12 h-12 flex items-center justify-center text-coffee-300 hover:text-espresso hover:bg-white rounded-2xl transition-all duration-500 active:scale-75"
                            >
                              <Plus size={20} />
                            </button>
                          </div>
                          
                          <button 
                            onClick={() => removeItem(item.id)} 
                            className="w-12 h-12 md:w-16 md:h-16 flex items-center justify-center text-coffee-200 hover:text-red-500 hover:bg-red-50 rounded-[1.5rem] shadow-premium transition-all duration-700 active:scale-75 border border-transparent hover:border-red-100"
                          >
                            <Trash2 size={24} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="py-16 md:py-40 text-center flex flex-col items-center justify-center space-y-8 md:space-y-16 bg-white/40 backdrop-blur-xl rounded-[3rem] md:rounded-[6rem] border-2 border-dashed border-espresso/10 p-6 md:p-0">
                  <div className="w-24 h-24 md:w-40 md:h-40 bg-white rounded-full flex items-center justify-center shadow-premium-xl text-coffee-100 ring-1 ring-white">
                    <ShoppingBag size={32} strokeWidth={0.5} />
                  </div>
                  <div className="space-y-6">
                    <h2 className="text-fluid-heading font-display font-black text-espresso italic tracking-tightest leading-none">Manifest <br/><span className="not-italic text-coffee-400">Empty.</span></h2>
                    <p className="text-fluid-body md:text-xl text-coffee-400 font-serif italic max-w-sm mx-auto leading-relaxed">No active sensory extractions identified in your neural cache.</p>
                  </div>
                  <Link 
                    to="/shop" 
                    className="btn-premium px-8 md:px-10 py-4 md:py-5 italic group text-[10px]"
                  >
                    Initiate Search <ArrowRight size={20} className="group-hover:translate-x-4 transition-transform duration-700" />
                  </Link>
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Checkout Panel */}
          <div className="lg:col-span-4 sticky top-40 h-fit">
            <div className="p-6 md:p-16 bg-espresso text-white rounded-[3rem] md:rounded-[5rem] shadow-premium-2xl space-y-6 md:space-y-12 relative overflow-hidden group">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(193,155,118,0.2),transparent)] pointer-events-none" />
              
              <div className="space-y-4 relative z-10">
                <span className="stat-label text-caramel font-black">Node Settlement</span>
                <h2 className="text-fluid-title font-display font-black tracking-tightest italic leading-none">Final <br/><span className="not-italic text-white font-black text-fluid-heading tracking-normal">Induction.</span></h2>
              </div>
              
              <div className="space-y-8 text-[11px] font-black uppercase tracking-[0.5em] text-coffee-500 relative z-10 font-sans italic">
                <div className="flex justify-between items-center group/item hover:text-white transition-colors duration-500">
                  <span>Gross Allocation</span>
                  <div className="text-right">
                    <span className="text-white font-display text-fluid-subtitle tracking-tightest not-italic block">{formatPrice(subtotal)}</span>
                    {subtotalUsd > 0 && <span className="text-coffee-400 text-xs font-sans block mt-1">USD ${subtotalUsd.toFixed(2)}</span>}
                  </div>
                </div>
                <div className="flex justify-between items-center group/item hover:text-white transition-colors duration-500">
                  <span>Logistics Protocol</span>
                  <div className="text-right">
                    <span className="text-caramel font-display text-fluid-subtitle tracking-tightest not-italic block">{shipping === 0 ? 'FREE' : formatPrice(shipping)}</span>
                    {shippingUsd > 0 && <span className="text-coffee-400 text-xs font-sans block mt-1">USD ${shippingUsd.toFixed(2)}</span>}
                  </div>
                </div>
                <div className="pt-10 border-t border-white/10 flex justify-between items-center">
                  <span className="text-white text-xs">Total Commitment</span>
                  <div className="text-right">
                    <span className="text-fluid-heading font-display font-black text-caramel-gold tracking-tightest italic block">{formatPrice(grandTotal)}</span>
                    {grandTotalUsd > 0 && <span className="text-coffee-300 text-sm font-black font-sans uppercase tracking-widest block mt-2">USD ${grandTotalUsd.toFixed(2)}</span>}
                  </div>
                </div>
              </div>

              <div className="space-y-8 relative z-10">
                 <div className="p-10 bg-white/5 rounded-[3.5rem] border border-white/5 flex items-start gap-6 group hover:bg-white/10 transition-colors duration-700 shadow-inner">
                    <Truck className="text-caramel flex-shrink-0 mt-1" size={24} />
                    <div className="space-y-1">
                      <p className="text-[11px] font-black uppercase tracking-[0.4em] text-white italic">Elite Logistics</p>
                      <p className="text-[10px] text-coffee-400 font-serif italic leading-relaxed">Verified Transit: 24-48h <br/> Neural Tracking: Active</p>
                    </div>
                 </div>
                 
                 <button 
                  onClick={handleCheckout}
                  disabled={items.length === 0 || loading}
                  className="btn-premium w-full py-4 md:py-5 italic border border-white/20 group text-[11px] md:text-xs hover:bg-caramel hover:text-white transition-all duration-700 uppercase tracking-widest rounded-full"
                 >
                   {loading ? 'TRANSMITTING...' : 'INITIATE CHECKOUT'}
                   <ArrowRight size={20} className="group-hover:translate-x-4 transition-transform duration-700" />
                 </button>

                 <div className="flex items-center justify-center gap-4 text-[10px] text-coffee-500 uppercase font-black tracking-[0.5em] italic">
                    <CreditCard size={16} className="text-caramel" />
                    Secure Transaction Hash
                 </div>
              </div>
            </div>

            <div className="mt-8 md:mt-12 p-6 md:p-12 bg-white shadow-premium-xl border border-white rounded-[3rem] md:rounded-[4rem] group hover:border-caramel transition-all duration-1000">
              <p className="text-[11px] text-coffee-300 font-black uppercase tracking-[0.6em] italic mb-6 text-center group-hover:text-espresso transition-colors">Neural Discount Code</p>
              <div className="flex flex-col sm:flex-row gap-4">
                <input 
                  type="text" 
                  placeholder="CODE_IDENT..." 
                  className="flex-grow bg-cream rounded-full px-6 py-4 text-[10px] font-black uppercase tracking-[0.4em] outline-none focus:ring-4 focus:ring-caramel/10 border border-espresso/5 focus:border-caramel transition-all shadow-inner italic placeholder:text-coffee-50" 
                />
                <button className="bg-espresso text-white rounded-full font-black text-[10px] uppercase tracking-[0.3em] hover:bg-caramel transition-all duration-500 px-6 py-4 active:scale-95 italic">Apply</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
