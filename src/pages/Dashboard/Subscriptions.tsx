import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Address, Subscription, SubscriptionStatus } from '../../types';
import ImageWithFallback from '../../components/common/ImageWithFallback';
import { Coffee, Calendar, RefreshCw, XCircle, ChevronRight, Package, AlertCircle, ArrowRight, Plus, MapPin, Clock, Edit2, ShieldAlert } from 'lucide-react';
import SEO from '../../components/common/SEO';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { format } from 'date-fns';
import ConfirmDialog from '../../components/common/ConfirmDialog';

export default function DashboardSubscriptions() {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const fetchSubs = async () => {
        try {
          const q = query(collection(db, 'subscriptions'), where('userId', '==', user.uid));
          const snap = await getDocs(q);
          setSubscriptions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subscription)));
        } catch (err) {
          console.error('Failed to fetch subscriptions:', err);
          toast.error('Failed to load subscriptions');
        } finally {
          setLoading(false);
        }
      };
      fetchSubs();
    }
  }, [user]);

  const toggleStatus = async (sub: Subscription) => {
    const newStatus = sub.status === SubscriptionStatus.ACTIVE ? SubscriptionStatus.PAUSED : SubscriptionStatus.ACTIVE;
    try {
      await updateDoc(doc(db, 'subscriptions', sub.id), { status: newStatus });
      setSubscriptions(subscriptions.map(s => s.id === sub.id ? { ...s, status: newStatus } : s));
      toast.success(`Ritual ${newStatus === SubscriptionStatus.ACTIVE ? 'Resumed' : 'Paused'} successfully!`);
    } catch (err) {
      toast.error("Failed to update ritual status");
    }
  };

  const cancelSubscription = (id: string) => setCancelTargetId(id);

  const executeCancel = async () => {
    const id = cancelTargetId!;
    setCancelTargetId(null);
    try {
      await updateDoc(doc(db, 'subscriptions', id), { status: SubscriptionStatus.CANCELLED });
      setSubscriptions(subscriptions.map(s => s.id === id ? { ...s, status: SubscriptionStatus.CANCELLED } : s));
      toast.success("Ritual cancelled. We'll miss brewing for you.");
    } catch (err) {
      toast.error("Failed to cancel ritual");
    }
  };

  const [editingSub, setEditingSub] = useState<Subscription | null>(null);
  const [activeTab, setActiveTab] = useState<'items' | 'logistics' | 'duration'>('items');
  const [cancelTargetId, setCancelTargetId] = useState<string | null>(null);

  // Logistics form state
  const [logisticsForm, setLogisticsForm] = useState({
    street: '',
    building: '',
    floor: '',
    city: 'Beirut',
    preferredTimeSlot: 'Morning (9:00 AM - 12:00 PM)',
    customNotes: '',
    gateCode: ''
  });

  useEffect(() => {
    if (editingSub) {
      const addr = editingSub.address as Address | string | undefined;
      const shippingAddress = typeof addr === 'object' && addr !== null ? addr : undefined;
      setLogisticsForm({
        street: shippingAddress?.street || shippingAddress?.address || '' ,
        building: shippingAddress?.building || '',
        floor: shippingAddress?.floor || '',
        city: shippingAddress?.city || 'Beirut',
        preferredTimeSlot: (editingSub as any).preferredTimeSlot || editingSub.preferredTime || 'Morning (9:00 AM - 12:00 PM)',
        customNotes: (editingSub as any).customNotes || '',
        gateCode: (editingSub as any).gateCode || ''
      });
    }
  }, [editingSub]);

  const saveLogistics = async () => {
    if (!editingSub) return;
    try {
      const updatedFields = {
        address: {
          street: logisticsForm.street,
          building: logisticsForm.building,
          floor: logisticsForm.floor,
          city: logisticsForm.city,
          address: `${logisticsForm.street}, Bldg ${logisticsForm.building}, Fl ${logisticsForm.floor}, ${logisticsForm.city}`
        },
        preferredTimeSlot: logisticsForm.preferredTimeSlot,
        preferredTime: logisticsForm.preferredTimeSlot,
        customNotes: logisticsForm.customNotes,
        gateCode: logisticsForm.gateCode
      };
      await updateDoc(doc(db, 'subscriptions', editingSub.id), updatedFields);
      setSubscriptions(subscriptions.map(s => s.id === editingSub.id ? { ...s, ...updatedFields } as Subscription : s));
      toast.success("Delivery coordinates synced successfully!");
      setEditingSub(null);
    } catch (err) {
      toast.error("Failed to update logistics");
    }
  };

  const updateFrequency = async (id: string, freq: any) => {
    try {
      await updateDoc(doc(db, 'subscriptions', id), { frequency: freq });
      setSubscriptions(subscriptions.map(s => s.id === id ? { ...s, frequency: freq } : s));
      toast.success("Extraction frequency cycle modulated!");
      setEditingSub(null);
    } catch (err) {
      toast.error("Failed to update cycle frequency");
    }
  };

  const skipDeliveryCycle = async (sub: Subscription) => {
    try {
      const currentDate = new Date(sub.nextDelivery || new Date());
      let daysToAdd = 7;
      if (sub.frequency === 'daily') daysToAdd = 1;
      else if (sub.frequency === 'biweekly') daysToAdd = 14;
      else if (sub.frequency === 'monthly') daysToAdd = 30;
      
      currentDate.setDate(currentDate.getDate() + daysToAdd);
      const nextDeliveryStr = currentDate.toISOString().split('T')[0];
      
      await updateDoc(doc(db, 'subscriptions', sub.id), { nextDelivery: nextDeliveryStr });
      setSubscriptions(subscriptions.map(s => s.id === sub.id ? { ...s, nextDelivery: nextDeliveryStr } : s));
      toast.success(`Successfully skipped cycle! Next delivery rescheduled for ${nextDeliveryStr}`);
    } catch (err) {
      toast.error("Failed to skip cycle");
    }
  };

  const extendPlanDuration = async (sub: Subscription, additionalMonths: number) => {
    try {
      const currentDuration = (sub as any).durationMonths || 3;
      const newDuration = currentDuration + additionalMonths;
      
      await updateDoc(doc(db, 'subscriptions', sub.id), { durationMonths: newDuration });
      setSubscriptions(subscriptions.map(s => s.id === sub.id ? { ...s, durationMonths: newDuration } as any : s));
      toast.success(`Ritual cycle extended successfully by ${additionalMonths} months!`);
      setEditingSub(null);
    } catch (err) {
      toast.error("Failed to extend plan duration");
    }
  };

  const timeSlots = [
    'Morning (9:00 AM - 12:00 PM)',
    'Afternoon (12:00 PM - 4:00 PM)',
    'Evening (4:00 PM - 8:00 PM)'
  ];

  return (
    <DashboardLayout>
      <div className="space-y-12 relative">
        <SEO title="My Subscriptions" description="Manage your CoffeeCraze recurring coffee ritual subscriptions." />
        
        <header className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 border-b border-espresso/5 pb-8">
          <div className="space-y-3">
            <span className="text-caption text-caramel">Operational Continuity</span>
            <h1 className="text-4xl font-display font-black text-espresso tracking-tight leading-none uppercase">Ritual <span className="text-text-muted">Cycles.</span></h1>
            <p className="text-base text-text-muted font-serif italic max-w-2xl leading-relaxed">Management of your recurring <span className="text-espresso font-black not-italic uppercase tracking-tightest">{subscriptions.length}</span> automated sensory protocols within the mainframe.</p>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="w-full md:w-auto px-6 py-4 bg-white shadow-premium border border-white rounded-2xl flex items-center gap-4 group transition-all duration-700">
              <div className="w-12 h-12 bg-espresso text-caramel rounded-xl flex items-center justify-center shadow-premium group-hover:rotate-12 transition-transform duration-500">
                <RefreshCw size={18} strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-[10px] font-semibold tracking-wide text-text-muted uppercase">System Health</p>
                <p className="text-lg font-display font-bold text-espresso tracking-tight leading-none mt-1">{subscriptions.some(s => s.status === SubscriptionStatus.ACTIVE) ? 'Nominal' : 'Dormant'}</p>
              </div>
            </div>
          </div>
        </header>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[1, 2].map(i => (
              <div key={i} className="h-[350px] bg-white/20 backdrop-blur-md animate-pulse rounded-3xl border border-white/40 shadow-premium" />
            ))}
          </div>
        ) : subscriptions.length > 0 ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {subscriptions.map((sub) => (
              <motion.div 
                key={sub.id} 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="bg-white border border-white/60 rounded-3xl p-6 sm:p-8 space-y-6 relative overflow-hidden group shadow-premium hover-lift h-full"
              >
                <div className="flex justify-between items-start relative z-10">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        "px-4 py-1.5 rounded-full text-[10px] sm:text-xs font-semibold tracking-wide border shadow-premium transition-all duration-500",
                        sub.status === SubscriptionStatus.ACTIVE ? 'bg-caramel text-white border-caramel' : 
                        sub.status === SubscriptionStatus.PAUSED ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                        'bg-red-50 text-red-600 border-red-100'
                      )}>
                        {sub.status.toUpperCase()}
                      </span>
                      {((sub as any).durationMonths) && (
                        <span className="bg-espresso text-caramel-gold border border-white/10 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">
                          {((sub as any).durationMonths)} MONTHS PLAN
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="text-2xl font-display font-black text-espresso tracking-tight leading-none uppercase">Ritual <span className="text-caramel-gold">#{sub.id.slice(-6).toUpperCase()}</span></h3>
                      <p className="text-[10px] text-text-muted font-bold tracking-widest uppercase mt-3 bg-cream inline-block px-3 py-1.5 rounded-lg border border-white/60">
                        {sub.frequency.toUpperCase()}  -  {sub.items?.length || 0} ITEMS
                      </p>
                    </div>
                  </div>
                </div>

                {/* Subscribed items list */}
                <div className="space-y-3 bg-cream/40 p-4 rounded-2xl border border-espresso/5">
                  <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">Ritual Recipe Components</p>
                  <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                    {sub.items?.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <span className="font-bold text-espresso uppercase truncate max-w-[200px]">{item.name}</span>
                        <span className="text-text-muted font-medium">QTY {item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-espresso/5 relative z-10">
                  <div className="space-y-1">
                    <p className="text-[9px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar size={12} className="text-caramel shrink-0" /> Next Delivery
                    </p>
                    <p className="text-base font-display font-black text-espresso tracking-tight leading-none">
                      {sub.nextDelivery ? format(new Date(sub.nextDelivery), 'MMM dd, yyyy') : 'Offline'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                      <Clock size={12} className="text-caramel shrink-0" /> Slot Lock
                    </p>
                    <p className="text-xs font-bold text-espresso truncate">
                      {(sub as any).preferredTimeSlot || sub.preferredTime || 'Morning Slot'}
                    </p>
                  </div>
                </div>

                {/* Logistics summary info */}
                {sub.address && (
                  <div className="text-[10px] text-text-muted font-medium bg-cream/20 p-3 rounded-xl border border-dashed border-espresso/5 flex items-start gap-2">
                    <MapPin size={12} className="text-caramel shrink-0 mt-0.5" />
                    <span className="truncate">
                      {typeof sub.address === 'object' ? sub.address.address : sub.address}
                    </span>
                  </div>
                )}

                <div className="flex flex-col gap-3 pt-2 relative z-10">
                  {sub.status !== SubscriptionStatus.CANCELLED && (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <button 
                          onClick={() => {
                            setEditingSub(sub);
                            setActiveTab('items');
                          }}
                          className="btn-outline text-xs py-3"
                        >
                           <Edit2 size={12} strokeWidth={2} /> Modify Items
                        </button>
                        <button 
                          onClick={() => {
                            setEditingSub(sub);
                            setActiveTab('logistics');
                          }}
                          className="btn-outline text-xs py-3"
                        >
                           <MapPin size={12} strokeWidth={2} /> Coordinates
                        </button>
                      </div>

                      <div className="flex gap-3">
                        <button 
                          onClick={() => toggleStatus(sub)}
                          className={cn(
                            "btn btn-primary text-xs py-3 flex-1 uppercase tracking-widest",
                            sub.status === SubscriptionStatus.ACTIVE ? "bg-amber-600 hover:bg-amber-700 text-white" : ""
                          )}
                        >
                          {sub.status === SubscriptionStatus.ACTIVE ? "Pause Cycle" : "Resume Cycle"}
                        </button>
                        
                        {sub.status === SubscriptionStatus.ACTIVE && (
                          <button 
                            onClick={() => skipDeliveryCycle(sub)}
                            className="btn-outline text-xs py-3 flex-1 uppercase tracking-widest"
                            title="Skip this upcoming delivery cycle and advance to next period"
                          >
                            Skip Cycle
                          </button>
                        )}
                        
                        <button 
                          onClick={() => {
                            setEditingSub(sub);
                            setActiveTab('duration');
                          }}
                          className="btn-outline text-xs border-caramel/20 text-caramel hover:border-caramel px-4 font-bold"
                          title="Extend duration months"
                        >
                          + Extend
                        </button>
                        
                        <button 
                          onClick={() => cancelSubscription(sub.id)}
                          className="btn-outline text-xs border-red-100 text-red-400 hover:border-red-400 hover:text-red-600 hover:bg-red-50 px-4"
                          title="Terminate Subscription"
                        >
                          <XCircle size={14} strokeWidth={2} />
                        </button>
                      </div>
                    </>
                  )}
                  {sub.status === SubscriptionStatus.CANCELLED && (
                    <button className="w-full py-3 bg-espresso/10 text-espresso/70 rounded-full text-xs font-semibold tracking-wider uppercase cursor-not-allowed border border-espresso/10">
                      Archival Record Only
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="py-16 bg-white border-2 border-espresso/5 border-dashed rounded-3xl text-center space-y-6 shadow-premium relative overflow-hidden group px-6">
            <div className="w-16 h-16 bg-cream rounded-2xl flex items-center justify-center mx-auto text-caramel shadow-premium border border-white">
              <Coffee size={28} strokeWidth={0.5} />
            </div>
            <div className="space-y-2 relative z-10">
              <h3 className="text-2xl font-display font-black text-espresso tracking-tight leading-none uppercase">No Rituals Yet</h3>
              <p className="text-xs text-text-muted max-w-sm mx-auto leading-normal">Your subscription manifest is currently offline. Activate recurring extractions for seamless sensory continuity.</p>
            </div>
            <Link to="/subscriptions" className="btn btn-primary text-xs inline-flex relative z-10">
              Begin Your Journey <ArrowRight size={14} className="ml-2" />
            </Link>
          </div>
        )}

        {/* Dynamic Modulation Drawer / Modal */}
        <AnimatePresence>
          {editingSub && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setEditingSub(null)}
                className="absolute inset-0 bg-espresso/70 backdrop-blur-md"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: 10 }}
                className="w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-8 relative z-10 shadow-premium-2xl border border-espresso/5 overflow-y-auto max-h-[90vh]"
              >
                <div className="space-y-6">
                   <header className="space-y-2 border-b border-espresso/5 pb-4">
                      <span className="text-caption text-caramel">Cycle Modulation Manifest</span>
                      <h2 className="text-2xl font-display font-black text-espresso tracking-tight leading-none uppercase">Modulate Ritual</h2>
                      
                      {/* Navigation tabs */}
                      <div className="flex gap-2 pt-4">
                        <button 
                          onClick={() => setActiveTab('items')}
                          className={cn("px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all", activeTab === 'items' ? "bg-espresso text-white" : "bg-cream text-espresso/50 hover:text-espresso")}
                        >
                          Items & Frequency
                        </button>
                        <button 
                          onClick={() => setActiveTab('logistics')}
                          className={cn("px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all", activeTab === 'logistics' ? "bg-espresso text-white" : "bg-cream text-espresso/50 hover:text-espresso")}
                        >
                          Coordinates
                        </button>
                        <button 
                          onClick={() => setActiveTab('duration')}
                          className={cn("px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all", activeTab === 'duration' ? "bg-espresso text-white" : "bg-cream text-espresso/50 hover:text-espresso")}
                        >
                          Extend Duration
                        </button>
                      </div>
                   </header>

                   {/* Tab 1: Items & Frequency */}
                   {activeTab === 'items' && (
                     <div className="space-y-6">
                        <div className="space-y-3">
                          <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Recipe Blueprint Items</p>
                          <div className="space-y-2">
                            {editingSub.items.map((item: any, idx: number) => (
                              <div key={idx} className="flex items-center justify-between p-3 bg-cream rounded-xl border border-espresso/5">
                                 <div className="flex items-center gap-3">
                                   <div className="w-10 h-10 bg-white rounded-lg border border-white shadow-premium overflow-hidden">
                                       <ImageWithFallback src={item.images?.[0]} alt={item.name} className="w-full h-full object-cover" />
                                   </div>
                                   <div>
                                     <p className="text-xs font-black text-espresso leading-none uppercase truncate max-w-[200px]">{item.name}</p>
                                     <p className="text-[9px] text-caramel font-black tracking-widest mt-1 uppercase">{item.category}</p>
                                   </div>
                                 </div>
                                 <button 
                                   onClick={async () => {
                                     const newItems = editingSub.items.filter((_: any, i: number) => i !== idx);
                                     if (newItems.length === 0) {
                                       toast.error("Ritual requires at least one component");
                                       return;
                                     }
                                     try {
                                       await updateDoc(doc(db, 'subscriptions', editingSub.id), { items: newItems });
                                       setSubscriptions(subscriptions.map(s => s.id === editingSub.id ? { ...s, items: newItems } : s));
                                       setEditingSub({ ...editingSub, items: newItems });
                                       toast.success("Component removed");
                                     } catch (err) {
                                       toast.error("Failed to remove component");
                                     }
                                   }}
                                   className="w-8 h-8 flex items-center justify-center text-text-muted hover:text-red-500 bg-white rounded-lg transition-all shadow-sm"
                                 >
                                   <XCircle size={14} />
                                 </button>
                              </div>
                            ))}
                            <Link 
                              to="/shop" 
                              className="w-full py-3.5 flex items-center justify-center gap-2 border border-dashed border-espresso/20 rounded-xl text-xs font-bold tracking-wider uppercase text-espresso hover:border-caramel hover:bg-caramel/10 transition-all group bg-cream/20"
                            >
                              <Plus size={14} className="group-hover:rotate-90 transition-transform" /> Add Component Bag
                            </Link>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Modulate Supply Speed</p>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                             {(['daily', 'weekly', 'biweekly', 'monthly'] as const).map((freq) => (
                                <button 
                                  key={freq}
                                  onClick={() => updateFrequency(editingSub.id, freq)}
                                  className={cn(
                                    "py-3 rounded-xl text-xs font-black uppercase tracking-wider shadow-premium flex items-center justify-center gap-1.5 transition-all",
                                    editingSub.frequency === freq ? "bg-espresso text-white" : "bg-cream text-espresso hover:bg-white border border-white"
                                  )}
                                >
                                  {freq === 'daily' ? '☀ Daily' : freq === 'weekly' ? 'Weekly' : freq === 'biweekly' ? 'Bi-Weekly' : 'Monthly'}
                                </button>
                             ))}
                          </div>
                        </div>
                     </div>
                   )}

                   {/* Tab 2: Logistics / Coordinates */}
                   {activeTab === 'logistics' && (
                     <div className="space-y-4">
                        <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Logistics Coordinates</p>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-text-muted uppercase tracking-wider ml-1">STREET ADDRESS</label>
                            <input 
                              type="text" 
                              value={logisticsForm.street}
                              onChange={e => setLogisticsForm({...logisticsForm, street: e.target.value})}
                              placeholder="e.g. 45 Roastery Road"
                              className="w-full px-4 py-2.5 bg-cream border border-espresso/5 rounded-xl text-xs font-bold focus:bg-white outline-none focus:border-caramel transition-all text-espresso"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-text-muted uppercase tracking-wider ml-1">BUILDING / BLOCK</label>
                            <input 
                              type="text" 
                              value={logisticsForm.building}
                              onChange={e => setLogisticsForm({...logisticsForm, building: e.target.value})}
                              placeholder="e.g. Block B"
                              className="w-full px-4 py-2.5 bg-cream border border-espresso/5 rounded-xl text-xs font-bold focus:bg-white outline-none focus:border-caramel transition-all text-espresso"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-text-muted uppercase tracking-wider ml-1">FLOOR / APARTMENT</label>
                            <input 
                              type="text" 
                              value={logisticsForm.floor}
                              onChange={e => setLogisticsForm({...logisticsForm, floor: e.target.value})}
                              placeholder="e.g. 4th Floor"
                              className="w-full px-4 py-2.5 bg-cream border border-espresso/5 rounded-xl text-xs font-bold focus:bg-white outline-none focus:border-caramel transition-all text-espresso"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-text-muted uppercase tracking-wider ml-1">CITY / REGION</label>
                            <input 
                              type="text" 
                              value={logisticsForm.city}
                              onChange={e => setLogisticsForm({...logisticsForm, city: e.target.value})}
                              placeholder="e.g. Beirut"
                              className="w-full px-4 py-2.5 bg-cream border border-espresso/5 rounded-xl text-xs font-bold focus:bg-white outline-none focus:border-caramel transition-all text-espresso"
                            />
                          </div>

                          <div className="space-y-1 col-span-2">
                            <label className="text-[9px] font-black text-text-muted uppercase tracking-wider ml-1">DELIVERY TIME-SLOT LOCK</label>
                            <select 
                              value={logisticsForm.preferredTimeSlot}
                              onChange={e => setLogisticsForm({...logisticsForm, preferredTimeSlot: e.target.value})}
                              className="w-full px-4 py-2.5 bg-cream border border-espresso/5 rounded-xl text-xs font-bold focus:bg-white outline-none focus:border-caramel transition-all text-espresso"
                            >
                              {timeSlots.map(slot => (
                                <option key={slot} value={slot}>{slot}</option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-text-muted uppercase tracking-wider ml-1">BUILDING GATE CODE</label>
                            <input 
                              type="text" 
                              value={logisticsForm.gateCode}
                              onChange={e => setLogisticsForm({...logisticsForm, gateCode: e.target.value})}
                              placeholder="e.g. Code #1234"
                              className="w-full px-4 py-2.5 bg-cream border border-espresso/5 rounded-xl text-xs font-bold focus:bg-white outline-none focus:border-caramel transition-all text-espresso"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-text-muted uppercase tracking-wider ml-1">ROASTERY DELIVERY DIRECTIONS</label>
                            <input 
                              type="text" 
                              value={logisticsForm.customNotes}
                              onChange={e => setLogisticsForm({...logisticsForm, customNotes: e.target.value})}
                              placeholder="e.g. Ring double bell"
                              className="w-full px-4 py-2.5 bg-cream border border-espresso/5 rounded-xl text-xs font-bold focus:bg-white outline-none focus:border-caramel transition-all text-espresso"
                            />
                          </div>
                        </div>

                        <button 
                          onClick={saveLogistics}
                          className="btn btn-primary w-full py-3.5 mt-4 text-xs font-black uppercase tracking-wider"
                        >
                          Commit Delivery Coordinates
                        </button>
                     </div>
                   )}

                   {/* Tab 3: Extend Plan Duration */}
                   {activeTab === 'duration' && (
                     <div className="space-y-6 text-center py-4">
                        <div className="w-16 h-16 bg-cream rounded-full flex items-center justify-center text-caramel mx-auto border border-espresso/5">
                          <Clock size={28} />
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-lg font-display font-black text-espresso uppercase">Extend Extraction Cycle Plan</h3>
                          <p className="text-xs text-text-muted font-medium max-w-md mx-auto">Extend your ongoing coffee roastery subscription plan to secure custom rates and seasonal batch selections.</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {[3, 6, 12].map(m => (
                            <button
                              key={m}
                              onClick={() => extendPlanDuration(editingSub, m)}
                              className="p-4 bg-cream border border-espresso/5 hover:border-caramel hover:bg-white rounded-2xl flex flex-col items-center gap-2 group transition-all duration-500"
                            >
                              <span className="text-xl font-display font-black text-espresso group-hover:text-caramel">+{m} Months</span>
                              <span className="text-[9px] font-black text-text-muted uppercase tracking-widest">Extend Protocol</span>
                            </button>
                          ))}
                        </div>
                     </div>
                   )}

                   <button 
                    onClick={() => setEditingSub(null)}
                    className="w-full py-3.5 border border-espresso/20 rounded-xl text-xs font-bold tracking-wider text-espresso hover:bg-espresso/5 transition-colors uppercase bg-cream/20"
                   >
                     Close Manifest Controls
                   </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Global Guidance Node */}
        <div className="bg-primary rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-premium-lg border border-white/5">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6 sm:gap-8 relative z-10">
            <div className="max-w-xl space-y-3 text-center lg:text-left">
              <span className="text-xs font-semibold tracking-wider text-caramel block uppercase">Operational Info Protocol</span>
              <h2 className="text-2xl sm:text-3xl font-display font-bold tracking-tight leading-none uppercase">Modulate Your Harvest Suite</h2>
              <p className="text-white text-xs sm:text-sm leading-relaxed">Any variation in components or logistics coordinates must be committed <span className="text-white font-semibold text-xs uppercase tracking-wider">48 Hours</span> prior to your next scheduled delivery window.</p>
            </div>
            <Link to="/shop" className="btn btn-primary whitespace-nowrap bg-white text-espresso hover:bg-caramel hover:text-white uppercase tracking-widest text-[10px]">
              Browse Database Catalog <ArrowRight size={12} className="ml-1.5" />
            </Link>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={cancelTargetId !== null}
        title="Cancel Ritual"
        message="Are you sure you want to end this coffee journey? This action cannot be undone."
        confirmLabel="Cancel Ritual"
        variant="danger"
        onConfirm={executeCancel}
        onCancel={() => setCancelTargetId(null)}
      />
    </DashboardLayout>
  );
}
