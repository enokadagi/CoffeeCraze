import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { OrderService } from '../services/firestore';
import { formatPrice, cn } from '../lib/utils';
import { Truck, CreditCard, ShieldCheck, ArrowRight, ChevronLeft, MapPin, Phone, User } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';

export default function Checkout() {
  const navigate = useNavigate();
  const { items, total, clearCart } = useCart();
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    firstName: profile?.displayName.split(' ')[0] || '',
    lastName: profile?.displayName.split(' ')[1] || '',
    address: '',
    city: '',
    phone: '',
    paymentMethod: 'cod',
    deliveryDate: '',
    deliveryTime: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please login to complete your order");
      return;
    }

    setLoading(true);
    try {
      const orderId = await OrderService.create({
        userId: user.uid,
        items,
        total,
        paymentMethod: formData.paymentMethod,
        paymentStatus: 'pending',
        shippingAddress: {
          name: `${formData.firstName} ${formData.lastName}`,
          address: formData.address,
          city: formData.city,
          phone: formData.phone
        },
        deliveryDate: formData.deliveryDate,
        deliveryTime: formData.deliveryTime,
        status: 'pending'
      });

      toast.success("Order placed successfully!");
      clearCart();
      navigate(`/order-success/${orderId}`);
    } catch (err) {
      toast.error("Failed to place order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    navigate('/shop');
    return null;
  }

  return (
    <div className="pt-20 pb-20 md:pt-40 md:pb-32 grainy-overlay min-h-screen relative overflow-hidden bg-cream">
      <div className="mesh-gradient absolute inset-0 opacity-20 pointer-events-none" />
      
      <div className="page-container relative z-10">
        <header className="mb-16 md:mb-32 space-y-6 md:space-y-8">
          <button onClick={() => navigate('/cart')} className="flex items-center gap-4 text-coffee-400 hover:text-espresso transition-all duration-700 text-[10px] md:text-[11px] font-black uppercase tracking-[0.4em] italic group">
            <div className="w-10 h-10 bg-white shadow-premium rounded-xl flex items-center justify-center group-hover:-translate-x-2 transition-transform">
              <ChevronLeft size={18} /> 
            </div>
            Exit To Archive
          </button>
          
          <div className="flex flex-col md:flex-row items-end justify-between gap-8 md:gap-12 border-b border-espresso/5 pb-12 md:pb-20">
            <h1 className="text-fluid-hero font-display font-black text-espresso leading-none tracking-tightest italic uppercase">Final <br/><span className="not-italic text-caramel">Induction.</span></h1>
            <div className="text-right hidden sm:block">
               <span className="text-[11px] font-black text-coffee-300 uppercase tracking-[0.6em] italic block mb-2">PROTOCOL_VERIFICATION</span>
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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-32">
          {/* Form Section */}
          <div className="lg:col-span-8">
            <form onSubmit={handleSubmit} className="space-y-16 md:space-y-24">
              {/* Delivery Info */}
              <div className="space-y-8 md:space-y-12">
                <div className="flex items-center gap-4 md:gap-6">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-espresso text-caramel-gold rounded-2xl md:rounded-[1.5rem] flex items-center justify-center shadow-premium ring-1 ring-white/20">
                    <MapPin className="w-5 h-5 md:w-6 md:h-6" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-fluid-heading font-display font-black text-espresso italic tracking-tightest">Logistics <span className="not-italic text-coffee-300">Target.</span></h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
                  <div className="space-y-4">
                    <label className="text-[10px] md:text-[11px] font-black text-coffee-300 uppercase tracking-[0.4em] italic ml-6">FIRST_NAME_ID</label>
                    <div className="relative group">
                      <User className="absolute left-6 md:left-8 top-1/2 -translate-y-1/2 text-caramel transition-transform group-focus-within:rotate-12" size={18} />
                      <input 
                        required
                        type="text" 
                        value={formData.firstName}
                        onChange={e => setFormData({...formData, firstName: e.target.value})}
                        placeholder="Sensory"
                        className="w-full pl-14 md:pl-20 pr-6 md:pr-10 py-4 md:py-6 bg-white border border-white rounded-[2rem] md:rounded-[2.5rem] focus:ring-4 focus:ring-caramel/10 outline-none transition-all shadow-premium-lg italic placeholder:text-coffee-50 placeholder:italic text-sm md:text-base"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] md:text-[11px] font-black text-coffee-300 uppercase tracking-[0.4em] italic ml-6">LAST_NAME_ID</label>
                    <input 
                      required
                      type="text" 
                      value={formData.lastName}
                      onChange={e => setFormData({...formData, lastName: e.target.value})}
                      placeholder="Specialist"
                      className="w-full px-6 md:px-10 py-4 md:py-6 bg-white border border-white rounded-[2rem] md:rounded-[2.5rem] focus:ring-4 focus:ring-caramel/10 outline-none transition-all shadow-premium-lg italic placeholder:text-coffee-50 placeholder:italic text-sm md:text-base"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-4">
                    <label className="text-[10px] md:text-[11px] font-black text-coffee-300 uppercase tracking-[0.4em] italic ml-6">PHYSICAL_COORDINATES</label>
                    <div className="relative group">
                      <MapPin className="absolute left-6 md:left-8 top-1/2 -translate-y-1/2 text-caramel transition-transform group-focus-within:scale-125" size={18} />
                      <input 
                        required
                        type="text" 
                        value={formData.address}
                        onChange={e => setFormData({...formData, address: e.target.value})}
                        placeholder="123 Ritual St, Roastery District"
                        className="w-full pl-14 md:pl-20 pr-6 md:pr-10 py-4 md:py-6 bg-white border border-white rounded-[2rem] md:rounded-[2.5rem] focus:ring-4 focus:ring-caramel/10 outline-none transition-all shadow-premium-lg italic placeholder:text-coffee-50 placeholder:italic text-sm md:text-base"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] md:text-[11px] font-black text-coffee-300 uppercase tracking-[0.4em] italic ml-6">CITY_PARAMETER</label>
                    <input 
                      required
                      type="text" 
                      value={formData.city}
                      onChange={e => setFormData({...formData, city: e.target.value})}
                      placeholder="Beirut"
                      className="w-full px-6 md:px-10 py-4 md:py-6 bg-white border border-white rounded-[2rem] md:rounded-[2.5rem] focus:ring-4 focus:ring-caramel/10 outline-none transition-all shadow-premium-lg italic placeholder:text-coffee-50 placeholder:italic text-sm md:text-base"
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] md:text-[11px] font-black text-coffee-300 uppercase tracking-[0.4em] italic ml-6">NEURAL_LINK_CONTACT</label>
                    <div className="relative group">
                      <Phone className="absolute left-6 md:left-8 top-1/2 -translate-y-1/2 text-caramel transition-transform group-focus-within:rotate-12" size={18} />
                      <input 
                        required
                        type="tel" 
                        value={formData.phone}
                        onChange={e => setFormData({...formData, phone: e.target.value})}
                        placeholder="+961 81 234 567"
                        className="w-full pl-14 md:pl-20 pr-6 md:pr-10 py-4 md:py-6 bg-white border border-white rounded-[2rem] md:rounded-[2.5rem] focus:ring-4 focus:ring-caramel/10 outline-none transition-all shadow-premium-lg italic placeholder:text-coffee-50 placeholder:italic text-sm md:text-base"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[11px] font-black text-coffee-300 uppercase tracking-[0.4em] italic ml-6">DELIVERY_DATE</label>
                    <input 
                      required
                      type="date" 
                      value={formData.deliveryDate}
                      onChange={e => setFormData({...formData, deliveryDate: e.target.value})}
                      className="w-full px-10 py-6 bg-white border border-white rounded-[2.5rem] focus:ring-4 focus:ring-caramel/10 outline-none transition-all shadow-premium-lg italic text-espresso"
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[11px] font-black text-coffee-300 uppercase tracking-[0.4em] italic ml-6">DELIVERY_TIME</label>
                    <input 
                      required
                      type="time" 
                      value={formData.deliveryTime}
                      onChange={e => setFormData({...formData, deliveryTime: e.target.value})}
                      className="w-full px-10 py-6 bg-white border border-white rounded-[2.5rem] focus:ring-4 focus:ring-caramel/10 outline-none transition-all shadow-premium-lg italic text-espresso"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="space-y-12">
                <div className="flex items-center gap-6">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-espresso text-caramel-gold rounded-[1.5rem] flex items-center justify-center shadow-premium ring-1 ring-white/20">
                    <CreditCard size={24} strokeWidth={1.5} />
                  </div>
                  <h3 className="text-fluid-heading font-display font-black text-espresso italic tracking-tightest">Settlement <span className="not-italic text-coffee-300">Mode.</span></h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <button 
                    type="button"
                    onClick={() => setFormData({...formData, paymentMethod: 'cod'})}
                    className={cn(
                      "p-5 md:p-8 rounded-[2.5rem] md:rounded-[3rem] border flex items-center gap-6 md:gap-8 transition-all duration-700 relative overflow-hidden group",
                      formData.paymentMethod === 'cod' 
                        ? "border-caramel bg-espresso text-white shadow-premium-2xl scale-105" 
                        : "border-white bg-white text-coffee-400 hover:border-caramel shadow-premium"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all duration-700 shadow-premium group-hover:rotate-6",
                      formData.paymentMethod === 'cod' ? "bg-caramel text-white" : "bg-cream text-caramel"
                    )}>
                      <Truck className="w-[18px] h-[18px] md:w-6 md:h-6" strokeWidth={1} />
                    </div>
                    <div className="text-left relative z-10">
                      <p className={cn("text-fluid-body md:text-xl font-display font-black italic uppercase tracking-tight", formData.paymentMethod === 'cod' ? "text-white" : "text-espresso")}>Tactile Settlement</p>
                      <p className="text-[10px] uppercase font-black tracking-[0.3em] opacity-60 mt-1 italic">CASH_ON_DELIVERY</p>
                    </div>
                    {formData.paymentMethod === 'cod' && (
                      <div className="absolute top-0 right-0 w-32 h-32 bg-caramel/10 blur-3xl rounded-full" />
                    )}
                  </button>

                  <button 
                    disabled
                    type="button"
                    className="p-6 md:p-10 rounded-[2.5rem] md:rounded-[3.5rem] border border-white bg-white/40 opacity-40 cursor-not-allowed flex items-center gap-6 md:gap-8 shadow-inner grayscale"
                  >
                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl md:rounded-[1.5rem] bg-cream text-caramel flex items-center justify-center shadow-premium shrink-0">
                      <CreditCard className="w-6 h-6 md:w-8 md:h-8" strokeWidth={1} />
                    </div>
                    <div className="text-left">
                      <p className="text-fluid-body md:text-xl font-display font-black italic uppercase tracking-tight text-espresso">Encrypted Flux</p>
                      <p className="text-[10px] uppercase font-black tracking-[0.3em] opacity-60 mt-1 italic">CREDIT_CARD_OFFLINE</p>
                    </div>
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="btn-premium w-full py-4 md:py-7 italic group text-xs md:text-sm tracking-[0.2em] relative overflow-hidden rounded-full"
              >
                <div className="absolute inset-0 bg-espresso translate-y-full group-hover:translate-y-0 transition-transform duration-700" />
                <span className="relative z-10 flex items-center justify-center gap-6">
                  {loading ? "SYNCHRONIZING..." : <>ESTABLISH RITUAL COMMITMENT <ArrowRight size={20} className="group-hover:translate-x-6 transition-transform duration-700" /></>}
                </span>
              </button>
            </form>
          </div>

          {/* Summary Sticky */}
          <div className="lg:col-span-4 lg:sticky lg:top-40 h-fit">
            <div className="p-6 md:p-16 bg-white shadow-premium-2xl border border-white rounded-[3rem] md:rounded-[5rem] space-y-6 md:space-y-12 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-64 h-64 bg-cream blur-[80px] opacity-20 -translate-y-1/2 -translate-x-1/2 rounded-full pointer-events-none" />
              
              <div className="space-y-4 relative z-10">
                <span className="stat-label text-caramel">Allocation Overview</span>
                <h3 className="text-fluid-heading font-display font-black text-espresso italic tracking-tightest leading-none">Manifest <span className="not-italic text-coffee-300 md:block">Review.</span></h3>
              </div>

              <div className="space-y-8 relative z-10">
                {items.map(item => (
                  <div key={item.id} className="flex items-center justify-between group/item">
                    <div className="flex items-center gap-4 md:gap-6">
                      <div className="w-12 h-12 md:w-16 md:h-16 bg-cream rounded-xl md:rounded-2xl overflow-hidden shadow-inner border border-white group-hover/item:scale-110 transition-transform duration-700 shrink-0">
                        <img src={item.images[0]} className="w-full h-full object-cover grayscale group-hover/item:grayscale-0 transition-all duration-700" alt="" referrerPolicy="no-referrer" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-black text-espresso uppercase italic tracking-tight">{item.name}</p>
                        <p className="text-[10px] text-coffee-300 font-black uppercase tracking-widest italic">QTY_X{item.quantity}</p>
                      </div>
                    </div>
                    <span className="text-fluid-body md:text-lg font-display font-black text-espresso italic tracking-tightest">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="pt-12 border-t border-espresso/5 space-y-8 relative z-10 italic">
                <div className="flex justify-between text-[11px] font-black uppercase tracking-[0.4em] text-coffee-300">
                  <span>Gross Allocation</span>
                  <span className="text-espresso">{formatPrice(total)}</span>
                </div>
                <div className="flex justify-between text-[11px] font-black uppercase tracking-[0.4em] text-caramel">
                  <span>Logistics protocol</span>
                  <span>FREE</span>
                </div>
                <div className="flex justify-between items-end pt-4">
                  <span className="text-sm font-black uppercase tracking-[0.5em] text-espresso">Commitment</span>
                  <span className="text-fluid-heading font-display font-black text-caramel-gold tracking-tightest italic">{formatPrice(total)}</span>
                </div>
              </div>

              <div className="space-y-6 relative z-10">
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-coffee-300 italic mb-2 block ml-4">Neural_Incentive_Node</span>
                <div className="flex gap-4">
                  <input 
                    type="text" 
                    placeholder="ENTER_COUPON"
                    className="flex-grow px-6 py-4 md:px-8 md:py-5 bg-cream border border-espresso/5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] outline-none focus:border-caramel transition-all italic placeholder:text-coffee-100"
                  />
                  <button type="button" className="px-6 py-4 md:px-8 md:py-5 bg-espresso text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] italic hover:bg-caramel transition-all">Apply</button>
                </div>
              </div>

              <div className="p-10 bg-cream rounded-[3.5rem] border border-white flex gap-6 shadow-inner relative z-10 group/safe overflow-hidden">
                <div className="absolute inset-0 bg-white translate-y-full group-hover/safe:translate-y-0 transition-transform duration-1000 opacity-50" />
                <ShieldCheck className="text-caramel shrink-0 relative z-10" size={24} strokeWidth={1} />
                <p className="text-[10px] text-coffee-400 leading-relaxed font-black uppercase tracking-widest italic relative z-10">
                  <span className="text-espresso">Encrypted Transaction.</span><br/> Your ritual is secured by CC-G7 protocols. 
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
