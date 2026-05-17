import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Subscription, SubscriptionStatus } from '../../types';
import { Coffee, Calendar, RefreshCw, XCircle, ChevronRight, Package, AlertCircle, ArrowRight, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { format } from 'date-fns';

export default function DashboardSubscriptions() {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const fetchSubs = async () => {
        const q = query(collection(db, 'subscriptions'), where('userId', '==', user.uid));
        const snap = await getDocs(q);
        setSubscriptions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subscription)));
        setLoading(false);
      };
      fetchSubs();
    }
  }, [user]);

  const toggleStatus = async (sub: Subscription) => {
    const newStatus = sub.status === SubscriptionStatus.ACTIVE ? SubscriptionStatus.PAUSED : SubscriptionStatus.ACTIVE;
    try {
      await updateDoc(doc(db, 'subscriptions', sub.id), { status: newStatus });
      setSubscriptions(subscriptions.map(s => s.id === sub.id ? { ...s, status: newStatus } : s));
      toast.success(`Ritual ${statusLabel(newStatus)} successfully`);
    } catch (err) {
      toast.error("Failed to update ritual status");
    }
  };

  const cancelSubscription = async (id: string) => {
    if (!confirm("Are you sure you want to end this coffee journey?")) return;
    try {
      await updateDoc(doc(db, 'subscriptions', id), { status: SubscriptionStatus.CANCELLED });
      setSubscriptions(subscriptions.map(s => s.id === id ? { ...s, status: SubscriptionStatus.CANCELLED } : s));
      toast.success("Ritual cancelled. We'll miss brewing for you.");
    } catch (err) {
      toast.error("Failed to cancel ritual");
    }
  };

  const [editingSub, setEditingSub] = useState<Subscription | null>(null);

  const updateFrequency = async (id: string, freq: any) => {
    try {
      await updateDoc(doc(db, 'subscriptions', id), { frequency: freq });
      setSubscriptions(subscriptions.map(s => s.id === id ? { ...s, frequency: freq } : s));
      toast.success("Extraction cycle updated");
      setEditingSub(null);
    } catch (err) {
      toast.error("Failed to update cycle");
    }
  };

  const statusLabel = (status: SubscriptionStatus) => {
    switch (status) {
      case SubscriptionStatus.ACTIVE: return 'resumed';
      case SubscriptionStatus.PAUSED: return 'paused';
      case SubscriptionStatus.CANCELLED: return 'cancelled';
      default: return '';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-20 relative">
        <header className="flex flex-col md:flex-row items-start md:items-end justify-between gap-12 border-b border-espresso/5 pb-20">
          <div className="space-y-4">
            <span className="stat-label text-caramel">Operational Continuity</span>
            <h1 className="text-5xl md:text-7xl font-display font-black text-espresso tracking-tightest leading-none italic uppercase">Ritual <br/><span className="not-italic text-coffee-400">Cycles.</span></h1>
            <p className="text-lg md:text-xl text-coffee-400 font-serif italic max-w-2xl leading-relaxed">Management of your recurring <span className="text-espresso font-black not-italic uppercase tracking-tightest">{subscriptions.length}</span> automated sensory protocols within the mainframe.</p>
          </div>

          <div className="flex items-center gap-4 md:gap-8 w-full md:w-auto">
            <div className="w-full md:w-auto px-8 md:px-12 py-6 md:py-8 bg-white shadow-premium-xl border border-white rounded-[3rem] md:rounded-[4rem] flex items-center gap-6 md:gap-8 group hover:scale-105 transition-all duration-1000">
              <div className="w-16 h-16 bg-espresso text-caramel rounded-[1.5rem] flex items-center justify-center shadow-premium-lg group-hover:rotate-12 transition-transform duration-700">
                <RefreshCw size={24} strokeWidth={1} className="group-hover:rotate-180 transition-transform duration-1000" />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.4em] text-coffee-300 italic mb-1 uppercase">System Health</p>
                <p className="text-4xl font-display font-black text-espresso italic tracking-tightest uppercase leading-none">{subscriptions.some(s => s.status === SubscriptionStatus.ACTIVE) ? 'Nominal' : 'Dormant'}</p>
              </div>
            </div>
          </div>
        </header>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
            {[1, 2].map(i => (
              <div key={i} className="h-[500px] bg-white/20 backdrop-blur-xl animate-pulse rounded-[5rem] border border-white/40" />
            ))}
          </div>
        ) : subscriptions.length > 0 ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-16">
            {subscriptions.map((sub) => (
              <motion.div 
                key={sub.id} 
                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                className="bg-white border border-white rounded-[6rem] p-16 md:p-20 space-y-16 relative overflow-hidden group shadow-premium-xl hover:shadow-premium-2xl transition-all duration-1000"
              >
                <div className="absolute top-0 right-0 p-20 opacity-[0.03] transition-all duration-1000 group-hover:opacity-[0.1] pointer-events-none group-hover:rotate-12 group-hover:scale-125 grayscale">
                  <Coffee size={400} strokeWidth={0.5} />
                </div>

                <div className="flex justify-between items-start relative z-10">
                  <div className="space-y-8">
                    <div className="flex items-center gap-4 md:gap-8">
                      <span className={cn(
                        "px-6 md:px-10 py-2 md:py-3 rounded-full text-[9px] md:text-[11px] font-black uppercase tracking-[0.4em] border shadow-premium italic transition-all duration-700",
                        sub.status === SubscriptionStatus.ACTIVE ? 'bg-caramel text-white border-caramel' : 
                        sub.status === SubscriptionStatus.PAUSED ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                        'bg-red-50 text-red-600 border-red-100'
                      )}>
                        {sub.status}_PROTOCOL
                      </span>
                      <span className="hidden md:inline-block text-[11px] font-black text-coffee-300 uppercase tracking-[0.5em] leading-none italic opacity-50 underline decoration-caramel/30 underline-offset-8">NODE_ALPHA_6</span>
                    </div>
                    <div>
                        <h3 className="text-5xl md:text-7xl font-display font-black text-espresso tracking-tightest italic leading-[0.8] uppercase">Ritual <br className="hidden md:block"/><span className="not-italic text-caramel-gold uppercase">{sub.planId}</span></h3>
                        <p className="text-[9px] md:text-[11px] text-coffee-400 font-black uppercase tracking-[0.4em] md:tracking-[0.6em] mt-6 md:mt-10 italic bg-cream inline-block px-4 py-2 md:px-6 md:py-3 rounded-[1rem] md:rounded-2xl border border-white shadow-inner">Interval Cycle: {sub.frequency} Extraction Points</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8 md:gap-16 pt-8 md:pt-16 border-t border-espresso/5 relative z-10">
                  <div className="space-y-4">
                    <p className="text-[9px] md:text-[11px] font-black text-coffee-300 uppercase tracking-[0.3em] md:tracking-[0.5em] flex items-center gap-3 md:gap-5 italic">
                      <Calendar size={16} className="text-caramel shrink-0" /> <span className="truncate">Extraction Vector</span>
                    </p>
                    <p className="text-2xl md:text-4xl font-display font-black text-espresso tracking-tightest italic leading-none">
                      {sub.nextDelivery ? format(new Date(sub.nextDelivery), 'MMM dd, yy') : 'Offline'}
                    </p>
                  </div>
                  <div className="space-y-4">
                    <p className="text-[9px] md:text-[11px] font-black text-coffee-300 uppercase tracking-[0.3em] md:tracking-[0.5em] flex items-center gap-3 md:gap-5 italic">
                      <Package size={16} className="text-caramel shrink-0" /> Sensory Keys
                    </p>
                    <p className="text-2xl md:text-4xl font-display font-black text-espresso tracking-tightest italic leading-none">{sub.items.length} Units</p>
                  </div>
                </div>

                <div className="flex flex-col xl:flex-row flex-wrap gap-4 md:gap-8 pt-8 md:pt-10 relative z-10">
                  {sub.status !== SubscriptionStatus.CANCELLED && (
                    <>
                      <button 
                        onClick={() => setEditingSub(sub)}
                        className="w-full xl:flex-grow flex items-center justify-center gap-4 md:gap-6 px-8 md:px-12 py-5 md:py-8 bg-cream border border-espresso/5 text-espresso rounded-[2rem] md:rounded-[2.5rem] text-[9px] md:text-[11px] font-black uppercase tracking-[0.3em] md:tracking-[0.5em] hover:bg-white hover:border-caramel transition-all duration-1000 shadow-premium italic active:scale-95 group/btn"
                      >
                         <RefreshCw size={20} strokeWidth={1} className="group-hover/btn:rotate-180 transition-transform duration-1000" /> Modify Cycle
                      </button>
                      <div className="flex gap-4 w-full xl:w-auto">
                        <button 
                          onClick={() => toggleStatus(sub)}
                          className="flex-grow flex items-center justify-center gap-4 md:gap-6 px-8 md:px-12 py-5 md:py-8 bg-espresso text-white rounded-[2rem] md:rounded-[2.5rem] text-[9px] md:text-[11px] font-black uppercase tracking-[0.3em] md:tracking-[0.5em] hover:bg-caramel transition-all duration-1000 shadow-premium italic active:scale-95 group/btn border border-white/5"
                        >
                          {sub.status === SubscriptionStatus.ACTIVE ? "Suspend" : "Re-Engage"}
                        </button>
                        <button 
                          onClick={() => cancelSubscription(sub.id)}
                          className="flex items-center justify-center gap-4 md:gap-6 px-8 md:px-12 py-5 md:py-8 bg-cream border border-espresso/5 text-espresso/40 hover:text-red-500 hover:bg-white hover:border-red-500 rounded-[2rem] md:rounded-[2.5rem] text-[9px] md:text-[11px] font-black uppercase tracking-[0.3em] md:tracking-[0.4em] transition-all duration-1000 italic shadow-premium"
                        >
                          <XCircle size={20} strokeWidth={1} />
                        </button>
                      </div>
                    </>
                  )}
                  {sub.status === SubscriptionStatus.CANCELLED && (
                    <button className="w-full flex items-center justify-center gap-6 px-12 py-8 bg-cream text-coffee-200 rounded-[2.5rem] text-[12px] font-black uppercase tracking-[0.6em] cursor-not-allowed italic shadow-inner border border-espresso/5">
                      Archival Record Only
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="py-32 md:py-72 bg-white border-2 border-espresso/5 border-dashed rounded-[4rem] md:rounded-[8rem] text-center space-y-12 md:space-y-16 shadow-premium-xl relative overflow-hidden group px-6 md:px-0">
            <div className="mesh-gradient absolute inset-0 opacity-[0.05] pointer-events-none" />
            <div className="w-24 h-24 md:w-40 md:h-40 bg-cream rounded-[3rem] md:rounded-[4rem] flex items-center justify-center mx-auto text-caramel shadow-premium-lg group-hover:rotate-12 transition-transform duration-1000 relative z-10 border border-white">
              <Coffee size={48} className="md:w-[80px] md:h-[80px]" strokeWidth={0.5} />
            </div>
            <div className="space-y-6 md:space-y-8 relative z-10">
              <h3 className="text-4xl md:text-7xl font-display font-black text-espresso italic tracking-tightest uppercase leading-none">Null <br className="md:hidden" /><span className="not-italic text-coffee-400 font-serif normal-case italic md:text-5xl">Rituals Detected.</span></h3>
              <p className="text-lg md:text-2xl text-coffee-400 font-serif italic max-w-2xl mx-auto leading-relaxed">Your subscription manifest is currently offline. Activate recurring extractions for seamless sensory continuity and node priority.</p>
            </div>
            <Link to="/subscriptions" className="btn-premium px-12 md:px-20 py-6 md:py-10 italic uppercase text-[10px] md:text-xs inline-flex items-center relative z-10">
              Initiate Primary Sequence <ArrowRight size={24} className="ml-6 group-hover:translate-x-4 transition-transform duration-700" />
            </Link>
          </div>
        )}

        {/* Edit Frequency Modal */}
        <AnimatePresence>
          {editingSub && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setEditingSub(null)}
                className="absolute inset-0 bg-espresso/60 backdrop-blur-xl"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="w-full max-w-xl bg-white rounded-[5rem] p-16 md:p-20 relative z-10 shadow-premium-2xl"
              >
                <div className="space-y-12">
                   <header className="space-y-4">
                      <span className="stat-label text-caramel">Cycle Modulation</span>
                      <h2 className="text-6xl font-display font-black text-espresso tracking-tightest italic leading-none uppercase">Update <br/>Extraction.</h2>
                   </header>

                   <div className="space-y-8">
                      <p className="text-[11px] font-black text-coffee-300 uppercase tracking-[0.5em] italic">Manage Sensory Components</p>
                      <div className="space-y-4">
                        {editingSub.items.map((item: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between p-6 bg-cream rounded-3xl border border-espresso/5 shadow-inner group/item">
                             <div className="flex items-center gap-6">
                               <div className="w-14 h-14 bg-white rounded-2xl border border-white shadow-premium overflow-hidden">
                                  <img src={item.images?.[0]} className="w-full h-full object-cover grayscale group-hover/item:grayscale-0 transition-all" />
                               </div>
                               <div>
                                 <p className="text-sm font-black text-espresso uppercase italic leading-none">{item.name}</p>
                                 <p className="text-[10px] text-caramel font-black uppercase tracking-widest mt-1 italic">{item.category}</p>
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
                                   toast.success("Component de-initialized");
                                 } catch (err) {
                                   toast.error("Failed to remove component");
                                 }
                               }}
                               className="w-12 h-12 flex items-center justify-center text-coffee-200 hover:text-red-500 hover:bg-white rounded-xl transition-all shadow-premium"
                             >
                               <XCircle size={18} />
                             </button>
                          </div>
                        ))}
                        <Link 
                          to="/shop" 
                          className="w-full py-6 flex items-center justify-center gap-6 border-2 border-dashed border-espresso/10 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.4em] text-coffee-300 hover:border-caramel hover:text-espresso transition-all italic group"
                        >
                          <Plus size={16} className="group-hover:rotate-90 transition-transform" /> Add Component
                        </Link>
                      </div>
                   </div>

                   <div className="space-y-8">
                      <p className="text-[11px] font-black text-coffee-300 uppercase tracking-[0.5em] italic">Extraction Frequency</p>
                      <div className="grid grid-cols-1 gap-4">
                        {['weekly', 'biweekly', 'monthly'].map((freq) => (
                           <button 
                             key={freq}
                             onClick={() => updateFrequency(editingSub.id, freq)}
                             className={cn(
                               "w-full py-8 px-10 rounded-[2rem] text-[11px] font-black uppercase tracking-[0.4em] italic shadow-premium flex items-center justify-between group transition-all duration-700",
                               editingSub.frequency === freq ? "bg-espresso text-white" : "bg-cream text-espresso hover:bg-white"
                             )}
                           >
                             {freq === 'weekly' ? 'High Frequency (Weekly)' : freq === 'biweekly' ? 'Standard Protocol (Bi-Weekly)' : 'Conservative Cycle (Monthly)'}
                             <ChevronRight size={18} className={cn("transition-transform", editingSub.frequency === freq ? "text-caramel rotate-90" : "group-hover:translate-x-2")} />
                           </button>
                        ))}
                      </div>
                   </div>

                   <button 
                    onClick={() => setEditingSub(null)}
                    className="w-full py-8 border border-espresso/5 rounded-full text-[10px] font-black uppercase tracking-[0.6em] text-coffee-200 hover:text-espresso transition-colors italic"
                   >
                     Cancel Operation
                   </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Global Guidance Node */}
        <div className="bg-espresso rounded-[8rem] p-20 md:p-32 text-white relative overflow-hidden group hover:shadow-[0_0_120px_rgba(193,155,118,0.15)] transition-all duration-1000 shadow-premium-2xl border border-white/5">
          <div className="mesh-gradient absolute inset-0 opacity-[0.05] pointer-events-none" />
          <div className="absolute -top-64 -left-64 w-[600px] h-[600px] bg-caramel/10 blur-[200px] rounded-full pointer-events-none group-hover:scale-150 transition-transform duration-2000" />
          <div className="flex flex-col xl:flex-row items-center justify-between gap-24 relative z-10">
            <div className="max-w-3xl space-y-10 text-center xl:text-left">
              <span className="text-[12px] font-black uppercase tracking-[1em] text-caramel leading-none italic mb-4 block">Operational_SOP_V2026</span>
              <h2 className="text-8xl font-display font-black tracking-tightest italic leading-[0.8] uppercase">Modulate Your <br/><span className="not-italic text-coffee-400">Harvest Suite IR.</span></h2>
              <p className="text-coffee-400 text-2xl font-serif italic leading-relaxed">Requirement: Any variation in sensory components must be committed to the mainframe <span className="text-caramel font-black not-italic font-sans text-xs uppercase tracking-widest">48 Hours</span> prior to the next extraction vector for ritual stability.</p>
            </div>
            <button className="btn-premium px-20 py-10 italic text-xs uppercase shadow-caramel/20 whitespace-nowrap group bg-white text-espresso hover:bg-caramel hover:text-white">
              Modify Parameters <ArrowRight size={24} className="ml-6 group-hover:translate-x-6 transition-transform duration-1000" />
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
