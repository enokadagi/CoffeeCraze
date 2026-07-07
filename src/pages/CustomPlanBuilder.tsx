import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Coffee, Calendar, Truck, ArrowRight, ArrowLeft, 
  Plus, Minus, ShoppingBag, Sparkles, Check, Info, HelpCircle
} from 'lucide-react';
import Seo from '../components/common/SEO';
import { useAuth } from '../context/AuthContext';
import { ProductService, SubscriptionService } from '../services/firestore';
import { Product, CartItem, SubscriptionStatus, PaymentStatus } from '../types';
import { formatUSD, formatLBP, EXCHANGE_RATE } from '../utils/exchange';
import { toast } from 'sonner';
import ImageWithFallback from '../components/common/ImageWithFallback';
import { cn } from '../lib/utils';

export default function CustomPlanBuilder() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Selected Box Items
  const [boxItems, setBoxItems] = useState<{ product: Product; quantity: number; grind: string }[]>([]);

  // Configuration Choices
  const [frequency, setFrequency] = useState<'weekly' | 'biweekly' | 'monthly'>('monthly');
  const [duration, setDuration] = useState<number>(3); // 1, 3, 6, 12 months
  const [paymentTiming, setPaymentTiming] = useState<'prepaid' | 'monthly' | 'deferred'>('monthly');

  // Logistics & Special Instructions
  const [logistics, setLogistics] = useState({
    street: '',
    building: '',
    floor: '',
    city: 'Beirut',
    phone: profile?.phone || '',
    notes: '',
    gateCode: ''
  });

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const allProducts = await ProductService.getAll();
        // Filter products that are eligible for subscription (e.g. Coffee Category or tagged)
        const subEligible = allProducts.filter(p => p.isSubscriptionEligible || p.category.toLowerCase().includes('coffee'));
        setProducts(subEligible);
      } catch (err) {
        console.error("Failed to load products for custom box:", err);
      } finally {
        setLoadingProducts(false);
      }
    };
    fetchProducts();
  }, []);

  const handleAddProduct = (product: Product) => {
    const existing = boxItems.find(item => item.product.id === product.id);
    if (existing) {
      setBoxItems(boxItems.map(item => 
        item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setBoxItems([...boxItems, { product, quantity: 1, grind: 'Whole Beans' }]);
    }
    toast.success(`${product.name} added to your coffee box!`);
  };

  const handleRemoveProduct = (productId: string) => {
    setBoxItems(boxItems.filter(item => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setBoxItems(boxItems.map(item => {
      if (item.product.id === productId) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const updateGrind = (productId: string, grind: string) => {
    setBoxItems(boxItems.map(item => 
      item.product.id === productId ? { ...item, grind } : item
    ));
  };

  // Calculations
  const calculateCycleTotalUSD = () => {
    return boxItems.reduce((acc, curr) => {
      const price = curr.product.priceUsd || (curr.product.price / EXCHANGE_RATE);
      return acc + (price * curr.quantity);
    }, 0);
  };

  const calculateCycleTotalLBP = () => {
    return calculateCycleTotalUSD() * EXCHANGE_RATE;
  };

  const getDiscountFactor = () => {
    return paymentTiming === 'prepaid' ? 0.90 : 1.0; // 10% off for prepaids
  };

  const calculateGrandTotalUSD = () => {
    const cycleTotal = calculateCycleTotalUSD();
    const cycleCount = frequency === 'weekly' ? duration * 4 : frequency === 'biweekly' ? duration * 2 : duration;
    return cycleTotal * cycleCount * getDiscountFactor();
  };

  const calculateGrandTotalLBP = () => {
    return calculateGrandTotalUSD() * EXCHANGE_RATE;
  };

  const handleNextStep = () => {
    if (step === 1 && boxItems.length === 0) {
      toast.error("Please add at least one coffee product to your box to proceed.");
      return;
    }
    if (step === 3 && (!logistics.street || !logistics.phone)) {
      toast.error("Contact phone and street address parameters are mandatory.");
      return;
    }
    setStep(step + 1);
  };

  const handlePrevStep = () => {
    setStep(step - 1);
  };

  const handleSubmitCustomPlan = async () => {
    if (!user) {
      toast.error("Please sign in to manifest your coffee plan.");
      navigate('/auth?redirect=/custom-plan-builder');
      return;
    }

    try {
      // Map boxItems to CartItems interface
      const items: CartItem[] = boxItems.map(item => ({
        ...item.product,
        productId: item.product.id,
        image: item.product.images?.[0] || '',
        quantity: item.quantity,
        description: `Grind: ${item.grind}. ${item.product.description}`
      }));

      // Construct subscription duration delivery end date
      const deliveryDate = new Date();
      deliveryDate.setDate(deliveryDate.getDate() + (frequency === 'weekly' ? 7 : frequency === 'biweekly' ? 14 : 30));

      const deliveryAddress = {
        street: logistics.street,
        building: logistics.building,
        floor: logistics.floor,
        city: logistics.city,
        email: user.email || '',
        phone: logistics.phone,
        address: `${logistics.street}, Bldg ${logistics.building || 'N/A'}, Fl ${logistics.floor || 'N/A'}, ${logistics.city}`,
      };

      await SubscriptionService.create({
        userId: user.uid,
        planId: `custom-duration-${duration}m`,
        planType: 'custom',
        planName: `Custom Box (${boxItems.length} items)`,
        status: SubscriptionStatus.ACTIVE,
        nextDelivery: deliveryDate.toISOString(),
        frequency,
        preferredDay: 'Friday',
        preferredTime: 'Morning',
        items,
        boxItems: boxItems.map(item => ({
          productId: item.product.id,
          name: item.product.name,
          quantity: item.quantity,
          grind: item.grind,
          priceUsd: item.product.priceUsd || (item.product.price / EXCHANGE_RATE),
        })),
        address: deliveryAddress,
        deliveryAddress,
        history: [],
        paymentStatus: PaymentStatus.PENDING,
        currentPaymentStatus: PaymentStatus.PENDING,
        durationMonths: duration,
        paymentTiming,
        customNotes: logistics.notes,
        deliveryInstructions: logistics.gateCode ? `Gate Code: ${logistics.gateCode}` : '',
        prepaidBalance: paymentTiming === 'prepaid' ? calculateGrandTotalUSD() : 0,
        billingSummary: {
          cycleTotalUSD: calculateCycleTotalUSD(),
          grandTotalUSD: calculateGrandTotalUSD(),
          cycleCount: frequency === 'weekly' ? duration * 4 : frequency === 'biweekly' ? duration * 2 : duration,
          discountApplied: paymentTiming === 'prepaid' ? 0.10 : 0,
        },
        paymentSchedule: [
          {
            type: paymentTiming,
            amount: calculateGrandTotalUSD(),
            amountLbp: calculateGrandTotalLBP(),
            dueDate: deliveryDate.toISOString(),
            status: PaymentStatus.PENDING,
            method: 'cash_on_delivery',
          }
        ],
        totalDeliveries: frequency === 'weekly' ? duration * 4 : frequency === 'biweekly' ? duration * 2 : duration,
        completedDeliveries: 0,
        deliveryHistory: [],
        plan: {
          planId: `custom-duration-${duration}m`,
          items: boxItems.map(item => ({
            productId: item.product.id,
            quantity: item.quantity,
            name: item.product.name,
            price: item.product.priceUsd || (item.product.price / EXCHANGE_RATE),
          })),
          frequency,
          nextDeliveryDate: deliveryDate.toISOString(),
          customizations: `Grind: ${boxItems.map(item => `${item.product.name}(${item.grind})`).join(', ')} | Payment: ${paymentTiming}`,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userEmail: user.email,
        userDisplayName: profile?.displayName || user.email?.split('@')[0] || 'Customer',
      } as any);

      toast.success("Your customized coffee box has been manifested!");
      navigate('/subscription/confirmation', { state: { planName: 'CUSTOM_CREATION' } });
    } catch (err) {
      toast.error("Failed to commit subscription to the mainframe.");
      console.error(err);
    }
  };

  const grindOptions = ['Whole Beans', 'Espresso Grind', 'Filter Grind', 'French Press'];

  return (
    <div className="pt-24 pb-32 md:pt-40 md:pb-56 px-4 md:px-6 bg-cream min-h-screen relative overflow-hidden">
      <Seo title="Custom Coffee Plan Builder" description="Manifest a bespoke coffee box recurring subscription." />
      <div className="mesh-gradient absolute inset-0 opacity-[0.04] pointer-events-none" />

      {/* Atmospheric Effects */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-caramel/10 rounded-full blur-[150px] pointer-events-none -z-0" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-espresso/5 rounded-full blur-[150px] pointer-events-none -z-0" />

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Header */}
        <header className="text-center mb-16 space-y-4">
          <span className="text-caption text-caramel">Custom Coffee Plan</span>
          <h1 className="text-display font-display font-black text-espresso uppercase leading-none tracking-tightest">
            Build Your <span className="text-text-muted">Perfect Box.</span>
          </h1>
          <p className="text-sm font-serif text-text-muted max-w-xl mx-auto">
            Create a recurring coffee plan tailored to the way you drink and enjoy coffee.
          </p>
        </header>

        {/* Steps Breadcrumb */}
        <div className="flex justify-center items-center gap-4 mb-16">
          {[
            { num: 1, label: 'SELECT items' },
            { num: 2, label: 'SET frequency' },
            { num: 3, label: 'CHOOSE delivery' },
            { num: 4, label: 'REVIEW order' }
          ].map((s) => (
            <div key={s.num} className="flex items-center gap-2">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all duration-500",
                step >= s.num ? "bg-espresso text-white shadow-premium" : "bg-white border border-espresso/10 text-text-muted"
              )}>
                {s.num}
              </div>
              <span className={cn(
                "text-[10px] uppercase tracking-widest font-black hidden md:block",
                step === s.num ? "text-espresso" : "text-text-muted"
              )}>{s.label}</span>
              {s.num < 4 && <div className="h-px w-8 bg-espresso/10 hidden md:block" />}
            </div>
          ))}
        </div>

        {/* Main Work Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Step Panels Container */}
          <div className="lg:col-span-8 bg-white/40 border border-white/60 p-6 md:p-10 rounded-3xl shadow-premium backdrop-blur-md min-h-[500px]">
            <AnimatePresence mode="wait">
              
              {/* STEP 1: Select Coffee Products */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-8"
                >
                  <div className="flex justify-between items-center border-b border-espresso/5 pb-4">
                    <h3 className="text-xl font-display font-black text-espresso uppercase tracking-tight">payload products</h3>
                    <span className="text-xs font-bold text-caramel">{products.length} Beans Available</span>
                  </div>

                  {loadingProducts ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-pulse">
                      {[1, 2].map(n => (
                        <div key={n} className="h-64 bg-white/50 rounded-2xl border border-espresso/5" />
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {products.map((prod) => {
                        const inBox = boxItems.find(item => item.product.id === prod.id);
                        return (
                          <div 
                            key={prod.id}
                            className="bg-white border border-white p-5 rounded-2xl shadow-premium hover:shadow-premium-lg hover:-translate-y-1 transition-all duration-500 flex flex-col justify-between"
                          >
                            <div className="space-y-4">
                              <div className="w-full h-40 bg-cream rounded-xl overflow-hidden shadow-inner border border-espresso/5 relative group">
                                <ImageWithFallback 
                                  src={prod.images?.[0] || 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=600'} 
                                  alt={prod.name} 
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                                />
                                {inBox && (
                                  <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-caramel text-white flex items-center justify-center shadow-premium font-black text-xs">
                                    {inBox.quantity}
                                  </div>
                                )}
                              </div>
                              <div className="space-y-1">
                                <h4 className="font-display font-black text-espresso uppercase text-sm tracking-tight">{prod.name}</h4>
                                <p className="text-xs text-text-muted line-clamp-2 italic font-serif">"{prod.description}"</p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-4 mt-4 border-t border-espresso/5">
                              <div className="flex flex-col">
                                <span className="text-xs font-black text-espresso">{formatUSD(prod.priceUsd || (prod.price / EXCHANGE_RATE))}</span>
                                <span className="text-[10px] text-text-muted font-semibold">~ {formatLBP(prod.priceLbp || prod.price)} LBP</span>
                              </div>
                              <button 
                                onClick={() => handleAddProduct(prod)}
                                className="w-8 h-8 rounded-full bg-espresso text-white flex items-center justify-center hover:bg-caramel transition-colors shadow-premium"
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}

              {/* STEP 2: Configure Frequencies & Payment Timing */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-10"
                >
                  <h3 className="text-xl font-display font-black text-espresso border-b border-espresso/5 pb-4 uppercase tracking-tight">Extraction Schedule</h3>
                  
                  {/* Frequency Choice */}
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-text-muted ml-4">Delivery Interval</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {(['weekly', 'biweekly', 'monthly'] as const).map((freq) => (
                        <button
                          key={freq}
                          onClick={() => setFrequency(freq)}
                          className={cn(
                            "py-5 px-4 rounded-2xl font-black uppercase tracking-wider text-xs border transition-all duration-500 shadow-premium flex flex-col items-center justify-center gap-2",
                            frequency === freq ? "bg-espresso text-white border-espresso" : "bg-white text-espresso border-white/80 hover:bg-white"
                          )}
                        >
                          <Calendar size={18} className={frequency === freq ? "text-caramel-gold animate-pulse" : "text-text-muted"} />
                          {freq === 'weekly' ? 'Weekly' : freq === 'biweekly' ? 'Bi-Weekly' : 'Monthly'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Plan Duration */}
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-text-muted ml-4">Plan Duration (Months)</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {[1, 3, 6, 12].map((dur) => (
                        <button
                          key={dur}
                          onClick={() => setDuration(dur)}
                          className={cn(
                            "py-4 rounded-xl font-black uppercase tracking-widest text-xs border transition-all duration-500 shadow-premium",
                            duration === dur ? "bg-espresso text-white border-espresso" : "bg-white text-espresso border-white/80 hover:bg-white"
                          )}
                        >
                          {dur} {dur === 1 ? 'Month' : 'Months'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Payment Timing Selection */}
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-text-muted ml-4 flex items-center gap-2">
                      Payment Logistics Timing <Info size={12} className="text-caramel" />
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {[
                        { id: 'prepaid', title: 'PREPAID', desc: 'Pay full duration in advance and save 10% on your total allocation.' },
                        { id: 'monthly', title: 'MONTHLY CYCLE', desc: 'Cash on delivery at each recurring cycle.' },
                        { id: 'deferred', title: 'DEFERRED LEDGER', desc: 'Pay deferred final settlement block upon duration completion.' }
                      ].map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setPaymentTiming(t.id as any)}
                          className={cn(
                            "p-5 rounded-2xl text-left border transition-all duration-500 shadow-premium flex flex-col justify-between gap-3 h-full",
                            paymentTiming === t.id ? "bg-espresso text-white border-espresso" : "bg-white text-espresso border-white/80 hover:bg-white"
                          )}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="text-xs font-black tracking-widest uppercase">{t.title}</span>
                            {paymentTiming === t.id && <div className="w-2 h-2 rounded-full bg-caramel animate-ping" />}
                          </div>
                          <p className={cn("text-[10px] font-medium leading-relaxed", paymentTiming === t.id ? "text-text-muted" : "text-text-muted")}>{t.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 3: Logistics & Notes */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-8"
                >
                  <h3 className="text-xl font-display font-black text-espresso border-b border-espresso/5 pb-4 uppercase tracking-tight">Delivery coordinates</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.3em] text-text-muted ml-4">Street Address</label>
                      <input 
                        type="text"
                        value={logistics.street}
                        onChange={e => setLogistics({...logistics, street: e.target.value})}
                        placeholder="e.g. 45 Roastery Lane"
                        required
                        className="w-full px-6 py-4 bg-white border border-white rounded-xl focus:ring-4 focus:ring-caramel/10 outline-none transition-all shadow-premium"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.3em] text-text-muted ml-4">Building Name / Block</label>
                      <input 
                        type="text"
                        value={logistics.building}
                        onChange={e => setLogistics({...logistics, building: e.target.value})}
                        placeholder="e.g. Arabica Tower B"
                        className="w-full px-6 py-4 bg-white border border-white rounded-xl focus:ring-4 focus:ring-caramel/10 outline-none transition-all shadow-premium"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.3em] text-text-muted ml-4">Floor / Apt</label>
                      <input 
                        type="text"
                        value={logistics.floor}
                        onChange={e => setLogistics({...logistics, floor: e.target.value})}
                        placeholder="e.g. 4th Floor, Apt 402"
                        className="w-full px-6 py-4 bg-white border border-white rounded-xl focus:ring-4 focus:ring-caramel/10 outline-none transition-all shadow-premium"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.3em] text-text-muted ml-4">City / Region</label>
                      <input 
                        type="text"
                        value={logistics.city}
                        onChange={e => setLogistics({...logistics, city: e.target.value})}
                        className="w-full px-6 py-4 bg-white border border-white rounded-xl focus:ring-4 focus:ring-caramel/10 outline-none transition-all shadow-premium text-espresso"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.3em] text-text-muted ml-4">Contact Phone Link</label>
                      <input 
                        type="tel"
                        value={logistics.phone}
                        onChange={e => setLogistics({...logistics, phone: e.target.value})}
                        placeholder="e.g. +961 71 972 495"
                        required
                        className="w-full px-6 py-4 bg-white border border-white rounded-xl focus:ring-4 focus:ring-caramel/10 outline-none transition-all shadow-premium"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.3em] text-text-muted ml-4">Gate Access Code (If any)</label>
                      <input 
                        type="text"
                        value={logistics.gateCode}
                        onChange={e => setLogistics({...logistics, gateCode: e.target.value})}
                        placeholder="e.g. #9981"
                        className="w-full px-6 py-4 bg-white border border-white rounded-xl focus:ring-4 focus:ring-caramel/10 outline-none transition-all shadow-premium"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-text-muted ml-4">Roastery Notes & Custom Instructions</label>
                    <textarea 
                      value={logistics.notes}
                      onChange={e => setLogistics({...logistics, notes: e.target.value})}
                      placeholder="e.g. Please grind the beans for espresso, deliver between 9am—12pm only."
                      rows={3}
                      className="w-full px-6 py-4 bg-white border border-white rounded-2xl focus:ring-4 focus:ring-caramel/10 outline-none transition-all shadow-premium"
                    />
                  </div>
                </motion.div>
              )}

              {/* STEP 4: Review and Manifestation */}
              {step === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-10"
                >
                  <h3 className="text-xl font-display font-black text-espresso border-b border-espresso/5 pb-4 uppercase tracking-tight">manifest review</h3>

                  <div className="bg-espresso text-white p-6 rounded-2xl space-y-6 shadow-premium">
                    <div className="flex items-center gap-4 text-caramel-gold">
                      <Sparkles size={20} className="animate-spin" />
                      <span className="text-[10px] font-black uppercase tracking-[0.4em] italic">Commitment Parameters Synchronized</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs font-semibold tracking-wide border-b border-white/10 pb-6">
                      <div className="space-y-1">
                        <p className="opacity-40 uppercase text-[9px] tracking-widest">FREQUENCY</p>
                        <p className="uppercase font-black text-sm">{frequency}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="opacity-40 uppercase text-[9px] tracking-widest">PLAN DURATION</p>
                        <p className="font-black text-sm">{duration} Months</p>
                      </div>
                      <div className="space-y-1">
                        <p className="opacity-40 uppercase text-[9px] tracking-widest">BILLING SEQUENCE</p>
                        <p className="uppercase font-black text-sm text-caramel-gold">{paymentTiming}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <p className="text-[10px] uppercase font-black tracking-widest opacity-40">Target Coordinates</p>
                      <p className="text-xs italic leading-relaxed text-coffee-200">
                        {logistics.street}, Building {logistics.building || '(N/A)'}, Floor {logistics.floor || '(N/A)'}, {logistics.city} <br />
                        Phone Link: {logistics.phone} {logistics.notes ? `| Note: "${logistics.notes}"` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-xs uppercase font-black tracking-widest text-text-muted">Payload Overview</h4>
                    <div className="space-y-3">
                      {boxItems.map(item => (
                        <div key={item.product.id} className="flex justify-between items-center bg-cream p-4 rounded-xl border border-espresso/5">
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-lg bg-espresso text-white text-xs flex items-center justify-center font-black">{item.quantity}x</span>
                            <div>
                              <p className="text-xs font-black text-espresso uppercase tracking-tight">{item.product.name}</p>
                              <p className="text-[10px] text-caramel font-semibold">Grind: {item.grind}</p>
                            </div>
                          </div>
                          <span className="text-xs font-bold text-espresso">{formatUSD((item.product.priceUsd || (item.product.price / EXCHANGE_RATE)) * item.quantity)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>

            {/* Wizard Navigation */}
            <div className="flex justify-between items-center pt-8 border-t border-espresso/5 mt-8">
              {step > 1 ? (
                <button 
                  onClick={handlePrevStep}
                  className="btn-outline flex items-center gap-2 text-xs py-3.5 px-6 border-espresso/15 text-espresso hover:bg-espresso hover:text-white"
                >
                  <ArrowLeft size={14} /> Back
                </button>
              ) : <div />}

              {step < 4 ? (
                <button 
                  onClick={handleNextStep}
                  className="btn btn-primary flex items-center gap-2 text-xs py-3.5 px-8"
                >
                  Next Step <ArrowRight size={14} />
                </button>
              ) : (
                <button 
                  onClick={handleSubmitCustomPlan}
                  className="btn btn-primary flex items-center gap-2 text-xs py-4 px-10 text-white hover:bg-espresso"
                >
                  Manifest Custom Box <Check size={14} />
                </button>
              )}
            </div>

          </div>

          {/* RIGHT SIDE: Interactive Box Visualizer & Live Totals */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Visual Box Widget */}
            <div className="bg-espresso text-white p-6 rounded-3xl relative overflow-hidden shadow-premium-xl border border-white/5 group">
              <div className="absolute inset-0 bg-gradient-to-br from-caramel/15 to-transparent pointer-events-none" />
              
              <div className="relative z-10 space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-black tracking-widest text-caramel">Visual volume map</span>
                  <ShoppingBag size={18} className="text-caramel animate-pulse" />
                </div>

                {/* 3D Glass Box Visual Mockup */}
                <div className="h-44 bg-white/5 rounded-2xl border border-white/10 flex flex-col justify-end p-4 relative overflow-hidden shadow-inner">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(193,155,118,0.1),transparent)]" />
                  
                  {boxItems.length === 0 ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-text-muted opacity-40">
                      <Coffee size={40} strokeWidth={1} />
                      <span className="text-[10px] uppercase font-black tracking-widest">box empty</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 items-end max-h-full overflow-y-auto pb-1 custom-scrollbar">
                      {boxItems.map((item, idx) => (
                        <motion.div 
                          key={item.product.id}
                          initial={{ scale: 0, y: 50 }}
                          animate={{ scale: 1, y: 0 }}
                          transition={{ delay: idx * 0.05, type: 'spring' }}
                          className="bg-caramel rounded-lg p-2 text-center text-[10px] font-black uppercase text-white shadow-premium relative group/boxItem"
                        >
                          <Coffee size={14} className="mx-auto text-white/80" />
                          <span className="block truncate max-w-full text-[8px] mt-1 font-sans">{item.product.name.slice(0, 5)}</span>
                          <span className="absolute -top-2 -right-2 bg-espresso border border-white/10 text-white rounded-full w-4 h-4 flex items-center justify-center text-[8px]">{item.quantity}</span>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Live Stats */}
                <div className="space-y-4 pt-4 border-t border-white/10 text-xs">
                  <div className="flex justify-between">
                    <span className="opacity-50 font-bold uppercase tracking-wider">BOX CONTENTS</span>
                    <span className="font-black text-caramel-gold uppercase">{boxItems.reduce((a, b) => a + b.quantity, 0)} Units</span>
                  </div>
                  {boxItems.map(item => (
                    <div key={item.product.id} className="space-y-2">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="truncate max-w-[140px] text-text-muted font-medium">{item.product.name}</span>
                        <div className="flex items-center gap-2 font-mono">
                          <button onClick={() => updateQuantity(item.product.id, -1)} className="hover:text-caramel"><Minus size={10} /></button>
                          <span>{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.product.id, 1)} className="hover:text-caramel"><Plus size={10} /></button>
                        </div>
                      </div>
                      
                      {/* Grind Size Option Selector inside the box listing */}
                      <select 
                        value={item.grind} 
                        onChange={(e) => updateGrind(item.product.id, e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg py-1 px-2 text-[10px] font-semibold text-coffee-200 focus:outline-none"
                      >
                        {grindOptions.map(g => (
                          <option key={g} value={g} className="bg-espresso text-white">{g}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Total Billing Ledger Summary Card */}
            <div className="bg-white border border-white p-6 rounded-3xl shadow-premium space-y-6">
              <span className="text-caption text-espresso">Billing Coordinates</span>
              
              <div className="space-y-4">
                <div className="flex justify-between items-baseline border-b border-espresso/5 pb-3">
                  <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Cycle Payload (USD)</span>
                  <span className="text-lg font-black text-espresso">{formatUSD(calculateCycleTotalUSD())}</span>
                </div>
                <div className="flex justify-between items-baseline border-b border-espresso/5 pb-3">
                  <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Cycle Payload (LBP)</span>
                  <span className="text-xs font-black text-text-muted">~ {formatLBP(calculateCycleTotalLBP())}</span>
                </div>

                {paymentTiming === 'prepaid' && (
                  <div className="flex justify-between items-center text-xs font-black text-emerald-600 bg-emerald-50 px-3 py-2 rounded-xl">
                    <span>10% PREPAID DISCOUNT APPLIED</span>
                    <span>- {formatUSD(calculateGrandTotalUSD() * 0.1)}</span>
                  </div>
                )}

                <div className="pt-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">MANIFESTED DURATION VALUE ({duration}m)</p>
                  <div className="flex justify-between items-baseline mt-2">
                    <span className="text-2xl font-black text-espresso">{formatUSD(calculateGrandTotalUSD())}</span>
                    <span className="text-xs font-bold text-text-muted">~ {formatLBP(calculateGrandTotalLBP())}</span>
                  </div>
                  <p className="text-[9px] text-text-muted italic mt-1 leading-normal font-serif">
                    * Displays calculated value across {frequency === 'weekly' ? duration * 4 : frequency === 'biweekly' ? duration * 2 : duration} cycles.
                  </p>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
