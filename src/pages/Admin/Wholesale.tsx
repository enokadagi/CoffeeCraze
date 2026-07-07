import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { WholesaleAccount, UserRole } from '../../types';
import { Building2, Search, CheckCircle, XCircle, Clock, MoreVertical, Coffee, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';
import SEO from '../../components/common/SEO';
import DashboardLayout from '../../components/layout/DashboardLayout';

export default function AdminWholesale() {
  const [accounts, setAccounts] = useState<(WholesaleAccount & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    setLoading(true);
    const q = query(collection(db, 'wholesale_accounts'));
    const snap = await getDocs(q);
    setAccounts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)));
    setLoading(false);
  };

  const handleStatusChange = async (id: string, userId: string, newStatus: WholesaleAccount['status']) => {
    try {
      await updateDoc(doc(db, 'wholesale_accounts', id), { status: newStatus });
      
      // If approved, update the user role to wholesale
      if (newStatus === 'approved') {
        await updateDoc(doc(db, 'users', userId), { role: UserRole.WHOLESALE });
      } else if (newStatus === 'rejected') {
        await updateDoc(doc(db, 'users', userId), { role: UserRole.CUSTOMER });
      }

      setAccounts(accounts.map(a => a.id === id ? { ...a, status: newStatus } : a));
      toast.success(`Account ${newStatus} successfully`);
    } catch (err) {
      toast.error("Failed to update wholesale status");
    }
  };

  const filteredAccounts = accounts.filter(a => 
    a.businessName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-16 relative">
        <SEO title="Wholesale Partners" description="Manage CoffeeCraze wholesale partner accounts and approvals." />
        <header className="flex flex-col md:flex-row items-start md:items-end justify-between gap-10 border-b border-border-light pb-16">
          <div className="space-y-4">
            <span className="text-caption text-gold-500 italic">Supply Line Mastery</span>
            <h1 className="text-7xl font-display font-black text-espresso tracking-tightest leading-none italic uppercase">Wholesale <br/><span className="not-italic text-gold-500">Partners.</span></h1>
            <p className="text-xl text-text-muted font-serif italic">Global management of <span className="text-espresso font-black not-italic uppercase">high-volume extraction</span> partnerships.</p>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <div className="px-8 py-5 bg-white shadow-premium rounded-[2rem] flex items-center gap-8 border border-border-light group hover:border-emerald-100 transition-all duration-700">
              <div className="w-10 h-10 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-700">
                <CheckCircle size={18} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-gold-500 uppercase tracking-[0.4em] italic mb-1 leading-none">ACTIVE_NODES</span>
                <span className="text-3xl font-display font-black text-text italic leading-none">{accounts.filter(a => a.status === 'approved').length}</span>
              </div>
            </div>
            <div className="px-8 py-5 bg-white shadow-premium rounded-[2rem] flex items-center gap-8 border border-border-light group hover:border-amber-100 transition-all duration-700">
              <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-700">
                <Clock size={18} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-gold-500 uppercase tracking-[0.4em] italic mb-1 leading-none">PENDING_NODES</span>
                <span className="text-3xl font-display font-black text-amber-600 italic leading-none">{accounts.filter(a => a.status === 'pending').length}</span>
              </div>
            </div>
          </div>
        </header>

        <div className="relative max-w-xl group">
          <div className="absolute inset-0 bg-gold-500/5 blur-xl group-hover:bg-gold-500/10 transition-colors duration-1000 rounded-full" />
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gold-500" size={20} />
          <input 
            type="text" 
            placeholder="Query business_identity..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-16 pr-8 py-5 bg-white border border-border-light rounded-full text-[11px] font-black uppercase tracking-[0.4em] focus:border-gold-500 transition-all duration-700 outline-none shadow-premium italic placeholder:text-coffee-200 relative z-10"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {loading ? (
             Array(3).fill(0).map((_, i) => (
                <div key={i} className="h-80 bg-white/50 backdrop-blur-xl animate-pulse rounded-[4rem] border border-border-light shadow-premium" />
             ))
          ) : filteredAccounts.map((account, i) => (
            <motion.div 
              key={account.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05, duration: 1 }}
              className="bg-white p-12 rounded-[4rem] border border-border-light shadow-premium-lg hover:shadow-premium-xl transition-all duration-1000 group hover:-translate-y-4 relative overflow-hidden"
            >
              <div className="mesh-gradient absolute inset-0 opacity-0 group-hover:opacity-[0.03] transition-opacity duration-1000 pointer-events-none" />
              <div className="flex justify-between items-start mb-10 relative z-10">
                <div className="w-16 h-16 bg-cream text-gold-500 rounded-2xl flex items-center justify-center shadow-premium border border-border group-hover:rotate-12 transition-transform duration-700">
                  <Building2 size={28} strokeWidth={1} />
                </div>
                <div className={cn(
                  "px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.4em] italic border transition-all duration-700 shadow-sm",
                  account.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                  account.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                  'bg-red-50 text-red-600 border-red-100'
                )}>
                  {account.status}_NODE
                </div>
              </div>

              <div className="mb-10 relative z-10 space-y-4">
                <h3 className="text-4xl font-display font-black text-text italic uppercase tracking-tightest leading-none line-clamp-2">{account.businessName}</h3>
                <p className="text-[11px] text-text-muted font-black uppercase tracking-[0.4em] italic">{account.businessType}_SECTOR</p>
              </div>

              <div className="pt-10 mb-10 border-t border-border-light space-y-6 relative z-10">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-gold-500 uppercase tracking-[0.4em] italic leading-none">TAX_IDENTITY</span>
                  <span className="font-mono text-[11px] font-black text-text uppercase tracking-widest bg-cream px-3 py-1 rounded-lg">{account.taxId}</span>
                </div>
              </div>

              <div className="flex gap-4 relative z-10">
                {account.status === 'pending' && (
                  <>
                    <button 
                      onClick={() => handleStatusChange(account.id, account.userId, 'approved')}
                      className="flex-1 py-5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.3em] transition-all duration-700 shadow-emerald-500/10 flex items-center justify-center gap-3 italic"
                    >
                      <CheckCircle size={16} /> APPROVE_LINK
                    </button>
                    <button 
                      onClick={() => handleStatusChange(account.id, account.userId, 'rejected')}
                      className="flex-1 py-5 border border-red-50 text-red-500 rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.3em] hover:bg-red-50 transition-all duration-700 flex items-center justify-center gap-3 italic"
                    >
                      <XCircle size={16} /> REJECT
                    </button>
                  </>
                )}
                {account.status === 'approved' && (
                  <button className="w-full py-5 bg-coffee-950 text-white rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.4em] flex items-center justify-center gap-4 italic shadow-premium">
                    <Coffee size={18} strokeWidth={1} /> DOMINANT_PARTNER
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {!loading && filteredAccounts.length === 0 && (
          <div className="py-40 text-center bg-white rounded-[5rem] border border-border-light shadow-premium relative overflow-hidden group">
            <div className="mesh-gradient absolute inset-0 opacity-[0.02]" />
            <div className="relative z-10 space-y-8">
               <div className="w-24 h-24 bg-cream text-coffee-200 rounded-[3rem] flex items-center justify-center mx-auto shadow-inner group-hover:scale-110 transition-transform duration-1000">
                  <Search size={40} strokeWidth={1} />
               </div>
               <p className="text-xl text-text-muted font-serif italic">No wholesale nodes found in current coordinate mapping.</p>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
