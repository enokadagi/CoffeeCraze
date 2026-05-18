import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Coffee, Truck, Star, ArrowRight, Sparkles, 
  RefreshCcw, ShoppingBag, Clock, ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { formatPrice, cn } from '../../lib/utils';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Order, Subscription, SubscriptionStatus } from '../../types';

export default function DashboardOverview() {
  const { user, profile } = useAuth();
  const [nextDelivery, setNextDelivery] = useState<Subscription | null>(null);
  const [recentOrder, setRecentOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const fetchData = async () => {
        try {
          // Fetch next delivery (active subscription)
          const subsQ = query(
            collection(db, 'subscriptions'),
            where('userId', '==', user.uid),
            where('status', '==', SubscriptionStatus.ACTIVE),
            orderBy('nextDelivery', 'asc'),
            limit(1)
          );
          const subsSnap = await getDocs(subsQ);
          if (!subsSnap.empty) {
            setNextDelivery({ id: subsSnap.docs[0].id, ...subsSnap.docs[0].data() } as Subscription);
          }

          // Fetch recent order
          const ordersQ = query(
            collection(db, 'orders'),
            where('userId', '==', user.uid),
            orderBy('createdAt', 'desc'),
            limit(1)
          );
          const ordersSnap = await getDocs(ordersQ);
          if (!ordersSnap.empty) {
            setRecentOrder({ id: ordersSnap.docs[0].id, ...ordersSnap.docs[0].data() } as Order);
          }
        } catch (error) {
          console.error("Error fetching overview data:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [user]);

  return (
    <DashboardLayout>
      <div className="space-y-8 md:space-y-16 relative">
        <header className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 md:gap-10 border-b border-espresso/5 pb-8 md:pb-16">
          <div className="space-y-4">
            <span className="stat-label text-caramel">Node Status: Active</span>
            <h1 className="text-fluid-hero font-display font-black text-espresso tracking-tightest leading-none italic uppercase">Command <br/><span className="not-italic text-coffee-400">Center.</span></h1>
            <p className="text-fluid-body text-coffee-400 font-serif italic">Welcome back, <span className="text-espresso font-black not-italic uppercase">{profile?.displayName?.split(' ')[0] || 'Operator'}</span>. System ready.</p>
          </div>

          <div className="flex items-center gap-8">
            <div className="px-6 md:px-10 py-4 md:py-6 bg-white shadow-premium rounded-[2.5rem] flex items-center gap-4 md:gap-6 border border-white group hover:shadow-premium-xl transition-all duration-1000">
              <div className="w-12 h-12 bg-espresso text-caramel-gold rounded-2xl flex items-center justify-center shadow-premium group-hover:rotate-12 transition-transform duration-700">
                <Star size={18} className="fill-current" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-coffee-300 italic mb-1">Ritual Credits</p>
                <p className="text-fluid-title font-display font-black text-espresso italic tracking-tighter">{profile?.loyaltyPoints || 0} <span className="text-xs uppercase not-italic text-coffee-300 ml-1">pts</span></p>
              </div>
            </div>
          </div>
        </header>

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-12">
            <div className="lg:col-span-2 h-[450px] bg-white animate-pulse rounded-[5rem] border border-espresso/5 shadow-inner" />
            <div className="h-[450px] bg-white animate-pulse rounded-[5rem] border border-espresso/5 shadow-inner" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-12">
            {/* Primary Command: Next Delivery */}
            <div className="lg:col-span-2 space-y-6 md:space-y-12">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                className="bg-espresso p-6 md:p-12 lg:p-16 rounded-[6rem] text-white relative overflow-hidden shadow-premium-2xl group border border-white/5"
              >
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-caramel blur-[180px] opacity-[0.15] -translate-y-1/2 translate-x-1/2 rounded-full pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-mocha blur-[150px] opacity-[0.1] translate-y-1/2 -translate-x-1/2 rounded-full pointer-events-none"></div>
                
                <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-8 md:gap-16">
                  <div className="space-y-8 md:space-y-14">
                    <div className="inline-flex items-center gap-4 md:gap-6 px-4 md:px-6 py-2 md:py-3 bg-white/5 border border-white/10 rounded-full group-hover:bg-white/10 transition-colors duration-700">
                      <Truck className="text-caramel" size={18} />
                      <span className="text-[11px] font-black uppercase tracking-[0.5em] text-coffee-300 italic">Extraction Logistics Active</span>
                    </div>
                    
                    {nextDelivery ? (
                      <div className="space-y-6 md:space-y-8">
                        <h2 className="text-fluid-hero font-display font-black leading-[0.85] tracking-tightest italic">
                          Next Release <br/>
                          <span className="not-italic text-caramel-gold uppercase text-fluid-heading block mt-4 tracking-normal">
                            {new Date(nextDelivery.nextDelivery).toLocaleDateString('en-US', { day: 'numeric', month: 'long' })}
                          </span>
                        </h2>
                        <p className="text-fluid-body text-coffee-400 font-serif italic max-w-xl leading-relaxed">"Your high-altitude sensory ritual is being harvested. Distribution vector: Beirut Central Hub."</p>
                      </div>
                    ) : (
                      <div className="space-y-6 md:space-y-8">
                        <h2 className="text-fluid-hero font-display font-black leading-[0.85] tracking-tightest italic">
                          Supply Line <br/>
                          <span className="not-italic text-coffee-500 uppercase text-fluid-heading block mt-4 tracking-normal">Inactive</span>
                        </h2>
                        <p className="text-fluid-body text-coffee-400 font-serif italic max-w-xl leading-relaxed">Your extraction cycle is currently dormant. Initialize local automation to persist sensory quality.</p>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-4 md:gap-8">
                      {nextDelivery ? (
                        <Link to="/dashboard/subscriptions" className="btn-premium px-8 md:px-12 py-5 md:py-7 italic group text-xs border border-white/20">
                          Manage Protocol <ArrowRight size={20} className="group-hover:translate-x-4 transition-transform duration-700" />
                        </Link>
                      ) : (
                        <Link to="/subscriptions" className="btn-premium px-8 md:px-12 py-5 md:py-7 italic group text-xs border border-white/20">
                          Initiate Ritual <ArrowRight size={20} className="group-hover:translate-x-4 transition-transform duration-700" />
                        </Link>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 hidden xl:flex">
                     <div className="w-64 h-64 bg-white/5 rounded-[4rem] border border-white/10 flex items-center justify-center relative overflow-hidden group-hover:scale-105 transition-all duration-[1.5s] group-hover:border-caramel/30 shadow-inner">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(193,155,118,0.1),transparent)]" />
                        <div className="text-white opacity-20 group-hover:opacity-40 transition-opacity duration-1000 group-hover:scale-110">
                          <Coffee size={120} strokeWidth={0.5} />
                        </div>
                        <div className="absolute bottom-10 left-10 right-10 h-1 bg-white/5 rounded-full overflow-hidden">
                           <motion.div 
                             initial={{ width: 0 }}
                             animate={{ width: '75%' }}
                             transition={{ duration: 3, delay: 0.5 }}
                             className="h-full bg-caramel"
                           />
                        </div>
                     </div>
                  </div>
                </div>
              </motion.div>

              {/* Advanced Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12">
                <div className="p-6 md:p-10 lg:p-12 bg-white shadow-premium rounded-[5rem] border border-white hover:shadow-premium-2xl transition-all duration-1000 cursor-pointer overflow-hidden relative group">
                  <div className="mesh-gradient absolute inset-0 opacity-10 pointer-events-none translate-y-full group-hover:translate-y-0 transition-transform duration-1000" />
                  <div className="w-14 h-14 md:w-20 md:h-20 bg-espresso text-caramel rounded-3xl flex items-center justify-center shadow-premium mb-6 md:mb-10 transition-all duration-700 group-hover:rotate-6 group-hover:scale-110 relative z-10 border border-white/10">
                    <RefreshCcw size={24} strokeWidth={1} />
                  </div>
                  <div className="space-y-4 relative z-10">
                    <h3 className="text-fluid-heading font-display font-black text-espresso tracking-tightest leading-none italic uppercase">Rapid <br/><span className="not-italic text-coffee-400">Re-Extraction.</span></h3>
                    <p className="text-fluid-body text-coffee-400 font-serif italic leading-relaxed">Instantly synchronize your system with the primary harvest node.</p>
                  </div>
                  <div className="pt-6 md:pt-10 relative z-10">
                    <Link to="/shop" className="text-[11px] font-black uppercase tracking-[0.5em] text-espresso flex items-center gap-4 hover:gap-8 transition-all duration-700 italic group-hover:text-caramel decoration-caramel underline underline-offset-8">
                      DATABASE_CATALOG <ArrowRight size={16} />
                    </Link>
                  </div>
                </div>

                <div className="p-6 md:p-10 lg:p-12 bg-white shadow-premium rounded-[5rem] border border-white hover:shadow-premium-2xl transition-all duration-1000 cursor-pointer overflow-hidden relative group">
                  <div className="mesh-gradient absolute inset-0 opacity-10 pointer-events-none -translate-y-full group-hover:translate-y-0 transition-transform duration-1000" />
                  <div className="w-14 h-14 md:w-20 md:h-20 bg-espresso text-caramel rounded-3xl flex items-center justify-center shadow-premium mb-6 md:mb-10 transition-all duration-700 group-hover:-rotate-6 group-hover:scale-110 relative z-10 border border-white/10">
                    <Sparkles size={24} strokeWidth={1} />
                  </div>
                  <div className="space-y-4 relative z-10">
                    <h3 className="text-fluid-heading font-display font-black text-espresso tracking-tightest leading-none italic uppercase">Neural <br/><span className="not-italic text-coffee-400">Assessment.</span></h3>
                    <p className="text-fluid-body text-coffee-400 font-serif italic leading-relaxed">Refine your sensory coordinates with our proprietary AI engine.</p>
                  </div>
                  <div className="pt-6 md:pt-10 relative z-10">
                    <Link to="/ai-barista" className="text-[11px] font-black uppercase tracking-[0.5em] text-espresso flex items-center gap-4 hover:gap-8 transition-all duration-700 italic group-hover:text-caramel decoration-caramel underline underline-offset-8">
                      START_SESSION <ArrowRight size={16} />
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Neural Insights Panel */}
            <div className="space-y-6 md:space-y-12">
              <div className="p-6 md:p-10 lg:p-12 bg-white shadow-premium-xl rounded-[5rem] border border-white space-y-6 md:space-y-12 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-48 h-48 bg-caramel/5 blur-[60px] rounded-full pointer-events-none" />
                <div className="flex items-center justify-between relative z-10">
                  <span className="stat-label text-caramel">Live Feed</span>
                  <Link to="/dashboard/orders" className="text-[10px] font-black uppercase tracking-[0.4em] text-coffee-400 hover:text-espresso transition-colors italic">Logs Archive</Link>
                </div>

                {recentOrder ? (
                  <div className="space-y-6 md:space-y-12 relative z-10">
                    <div className="flex items-center gap-4 md:gap-8">
                      <div className="w-14 h-14 md:w-20 md:h-20 bg-cream rounded-[2.5rem] flex items-center justify-center text-caramel shrink-0 shadow-premium transition-transform duration-1000 group-hover:rotate-12 border border-white">
                        <ShoppingBag size={24} />
                      </div>
                      <div>
                        <p className="text-fluid-body font-black text-espresso uppercase tracking-tightest italic leading-none mb-2">Protocol #{recentOrder.id.slice(-8)}</p>
                        <p className="text-[11px] font-black text-coffee-300 uppercase tracking-[0.4em] italic leading-none">{new Date(recentOrder.createdAt).toLocaleDateString()}_LOG</p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.4em] text-coffee-200 italic">
                        <span className={cn(recentOrder.status !== 'cancelled' ? "text-caramel" : "")}>IDNT</span>
                        <span className={cn(['confirmed', 'shipped', 'delivered'].includes(recentOrder.status) ? "text-caramel" : "")}>CONF</span>
                        <span className={cn(['shipped', 'delivered'].includes(recentOrder.status) ? "text-caramel" : "")}>DSPCH</span>
                        <span className={cn(recentOrder.status === 'delivered' ? "text-caramel" : "")}>COMPL</span>
                      </div>
                      <div className="h-2 w-full bg-cream rounded-full overflow-hidden shadow-inner ring-4 ring-cream/50">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ 
                            width: recentOrder.status === 'pending' ? '25%' : 
                                   recentOrder.status === 'confirmed' ? '50%' : 
                                   recentOrder.status === 'shipped' ? '75%' : 
                                   recentOrder.status === 'cancelled' ? '0%' : '100%' 
                          }}
                          transition={{ duration: 2.5, ease: [0.22, 1, 0.36, 1] }}
                          className="h-full bg-espresso"
                        />
                      </div>
                      <p className="text-[11px] font-black text-coffee-500 italic uppercase tracking-widest text-center pt-2">System Status: {recentOrder.status}_PROTOCOL</p>
                    </div>
                  </div>
                ) : (
                  <div className="py-12 md:py-20 text-center space-y-8 opacity-20 relative z-10">
                     <Clock className="mx-auto text-coffee-200" size={48} strokeWidth={0.5} />
                     <p className="text-fluid-body font-serif italic text-coffee-400 uppercase tracking-widest">Null Feedback detected.</p>
                  </div>
                )}
              </div>

              {/* Referral Node */}
              <div className="p-6 md:p-10 lg:p-12 bg-espresso text-white rounded-[5rem] shadow-premium-2xl relative overflow-hidden group border border-white/5">
                <div className="absolute inset-x-0 bottom-0 top-1/2 bg-[linear-gradient(to_top,rgba(193,155,118,0.1),transparent)] pointer-events-none" />
                <div className="relative z-10 space-y-6 md:space-y-10">
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                    className="w-12 h-12 md:w-16 md:h-16 bg-white rounded-full flex items-center justify-center text-caramel shadow-premium mb-6 group-hover:scale-110 transition-transform duration-1000"
                  >
                    <Star size={24} className="fill-current" />
                  </motion.div>
                  
                  <div className="space-y-6">
                    <h4 className="text-fluid-heading font-display font-black text-white leading-[0.85] tracking-tightest italic">Expand <br/>The Node <br/><span className="not-italic text-caramel-gold uppercase">Circle.</span></h4>
                    <p className="text-fluid-body text-coffee-400 leading-relaxed font-serif italic">Refer an operator and bridge LBP 250k into your personal extraction credit ledger.</p>
                  </div>

                  <button className="w-full py-4 md:py-6 bg-white text-espresso rounded-[2rem] text-[11px] font-black uppercase tracking-[0.4em] hover:bg-caramel hover:text-white transition-all duration-700 shadow-xl italic group-hover:-translate-y-2 border border-transparent">
                    Inaugurate Friend
                  </button>
                </div>
              </div>

              {/* Protocol Security */}
              <div className="p-6 md:p-10 lg:p-12 bg-white shadow-premium rounded-[4rem] border border-white flex items-start gap-4 md:gap-10 group hover:shadow-premium-xl transition-all duration-1000">
                 <div className="w-12 h-12 md:w-16 md:h-16 bg-espresso text-caramel rounded-3xl flex items-center justify-center shadow-premium shrink-0 group-hover:rotate-12 transition-transform duration-700">
                    <ShieldCheck size={24} />
                 </div>
                 <div className="space-y-2">
                    <h4 className="text-xs font-black text-espresso uppercase tracking-[0.3em] font-display italic">Protocol Integrity</h4>
                    <p className="text-[10px] text-coffee-400 font-serif italic leading-relaxed">End-to-End Extraction Security Active. System Version: 5.1.0-ELITE.</p>
                 </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
