import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { 
  Truck, Calendar, User, Search, 
  MoreHorizontal, Play, Pause, XCircle, CheckCircle2
} from 'lucide-react';
import { collection, getDocs, query, orderBy, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { formatPrice, cn } from '../../lib/utils';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Subscription, SubscriptionStatus } from '../../types';
import { toast } from 'sonner';

export default function AdminSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        const q = query(collection(db, 'subscriptions'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        const subs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subscription));
        setSubscriptions(subs);
      } catch (error) {
        console.error('Error fetching subscriptions:', error);
        toast.error('Failed to load subscription flows');
      } finally {
        setLoading(false);
      }
    };
    fetchSubscriptions();
  }, []);

  const handleUpdateStatus = async (subId: string, newStatus: SubscriptionStatus) => {
    try {
      await updateDoc(doc(db, 'subscriptions', subId), {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
      setSubscriptions(prev => prev.map(s => s.id === subId ? { ...s, status: newStatus } : s));
      toast.success(`Subscription flow status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Extraction protocol failure');
    }
  };

  const filteredSubs = subscriptions.filter(s => 
    s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.planId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-16 relative">
        <header className="flex flex-col md:flex-row items-start md:items-end justify-between gap-10 border-b border-coffee-50 pb-16">
          <div className="space-y-4">
            <span className="stat-label text-gold-500 italic">Program Administration</span>
            <h1 className="text-7xl font-display font-black text-coffee-950 tracking-tightest leading-none italic uppercase">Ritual <br/><span className="not-italic text-coffee-400">Flows.</span></h1>
            <p className="text-xl text-coffee-400 font-serif italic">Global orchestration of recurring <span className="text-coffee-950 font-black not-italic uppercase">sensory delivery</span> protocols.</p>
          </div>

          <div className="relative w-full md:w-96 group">
            <div className="absolute inset-0 bg-gold-500/5 blur-xl group-hover:bg-gold-500/10 transition-colors duration-1000 rounded-full" />
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gold-500" size={20} />
            <input 
              type="text"
              placeholder="Query supply_link_ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-coffee-50 rounded-full pl-16 pr-8 py-5 text-[11px] font-black uppercase tracking-[0.4em] focus:border-gold-500 transition-all duration-700 outline-none shadow-premium italic placeholder:text-coffee-200 relative z-10"
            />
          </div>
        </header>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-80 bg-white/50 backdrop-blur-xl animate-pulse rounded-[4rem] border border-coffee-50 shadow-premium" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {filteredSubs.map((sub, i) => (
              <motion.div
                key={sub.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05, duration: 0.8 }}
                className="bg-white p-12 rounded-[4rem] border border-coffee-50 shadow-premium hover:shadow-premium-xl group hover:-translate-y-2 transition-all duration-1000 relative overflow-hidden"
              >
                <div className="mesh-gradient absolute inset-0 opacity-0 group-hover:opacity-[0.03] transition-opacity duration-1000 pointer-events-none" />
                <div className="flex items-start justify-between mb-10 relative z-10">
                  <div className="w-16 h-16 bg-coffee-50 rounded-2xl flex items-center justify-center text-gold-500 shadow-premium group-hover:rotate-12 transition-transform duration-700 border border-coffee-100">
                    <Truck size={28} strokeWidth={1} />
                  </div>
                  <div className={cn(
                    "px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.4em] italic border transition-all duration-700",
                    sub.status === SubscriptionStatus.ACTIVE ? "bg-emerald-50 text-emerald-600 border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white" :
                    sub.status === SubscriptionStatus.PAUSED ? "bg-amber-50 text-amber-600 border-amber-100 group-hover:bg-amber-600 group-hover:text-white" :
                    "bg-red-50 text-red-600 border-red-100 group-hover:bg-red-600 group-hover:text-white"
                  )}>
                    {sub.status}_NODE
                  </div>
                </div>

                <div className="space-y-8 mb-10 relative z-10">
                  <div>
                    <h3 className="text-4xl font-display font-black text-coffee-950 tracking-tightest leading-none italic uppercase">{sub.planId}_PROX</h3>
                    <p className="text-[10px] font-black text-coffee-300 uppercase tracking-[0.4em] mt-3 italic">LINK_ID: {sub.id.slice(0, 12)}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-8 pt-8 border-t border-coffee-50">
                    <div className="space-y-2">
                       <p className="text-[10px] font-black text-coffee-200 uppercase tracking-[0.4em] italic leading-none">PROTOCOL</p>
                       <p className="text-lg font-display font-black text-coffee-950 italic leading-none uppercase">{sub.frequency}_CYC</p>
                    </div>
                    <div className="space-y-2">
                       <p className="text-[10px] font-black text-coffee-200 uppercase tracking-[0.4em] italic leading-none">NEXT_EXTRACTION</p>
                       <p className="text-lg font-display font-black text-coffee-950 italic leading-none uppercase">{new Date(sub.nextDelivery).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-10 border-t border-coffee-50 flex items-center justify-between gap-6 relative z-10">
                  <div className="flex gap-4">
                    {sub.status !== SubscriptionStatus.ACTIVE && (
                      <button 
                        onClick={() => handleUpdateStatus(sub.id, SubscriptionStatus.ACTIVE)}
                        className="w-12 h-12 flex items-center justify-center bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all duration-700 shadow-sm border border-emerald-100"
                        title="Resume Ritual"
                      >
                        <Play size={20} className="fill-current" />
                      </button>
                    )}
                    {sub.status === SubscriptionStatus.ACTIVE && (
                      <button 
                        onClick={() => handleUpdateStatus(sub.id, SubscriptionStatus.PAUSED)}
                        className="w-12 h-12 flex items-center justify-center bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-600 hover:text-white transition-all duration-700 shadow-sm border border-amber-100"
                        title="Pause Flow"
                      >
                        <Pause size={20} className="fill-current" />
                      </button>
                    )}
                    <button 
                      onClick={() => handleUpdateStatus(sub.id, SubscriptionStatus.CANCELLED)}
                      className="w-12 h-12 flex items-center justify-center bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all duration-700 shadow-sm border border-red-100"
                      title="Terminate Link"
                    >
                      <XCircle size={20} />
                    </button>
                  </div>
                  <Link 
                    to={`/admin/customers?id=${sub.userId}`}
                    className="w-14 h-14 bg-coffee-950 text-white rounded-2xl flex items-center justify-center hover:bg-gold-500 transition-all duration-700 shadow-premium group/link"
                  >
                    <User size={24} strokeWidth={1.5} className="group-hover/link:scale-110 transition-transform duration-700" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
