import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Profile, UserRole } from '../../types';
import { Users, Search, MoreVertical, Shield, Star, Mail, Edit2, Ban } from 'lucide-react';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';
import DashboardLayout from '../../components/layout/DashboardLayout';

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    setCustomers(snap.docs.map(doc => ({ ...doc.data() } as Profile)));
    setLoading(false);
  };

  const toggleAdmin = async (uid: string, currentRole: UserRole) => {
    const newRole = currentRole === UserRole.ADMIN ? UserRole.CUSTOMER : UserRole.ADMIN;
    try {
      await updateDoc(doc(db, 'users', uid), { role: newRole });
      setCustomers(customers.map(c => c.uid === uid ? { ...c, role: newRole } : c));
      toast.success(`Protocol updated to ${newRole}`);
    } catch (err) {
      toast.error("Failed to update user protocol");
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-16 relative">
        <header className="flex flex-col md:flex-row items-start md:items-end justify-between gap-10 border-b border-coffee-50 pb-16">
          <div className="space-y-4">
            <span className="stat-label text-gold-500 italic">Network Intelligence</span>
            <h1 className="text-7xl font-display font-black text-coffee-950 tracking-tightest leading-none italic uppercase">Ritualist <br/><span className="not-italic text-coffee-400">Nodes.</span></h1>
            <p className="text-xl text-coffee-400 font-serif italic">Global mapping of the <span className="text-coffee-950 font-black not-italic uppercase">CoffeeCraze sensory collective</span>.</p>
          </div>

          <div className="relative w-full md:w-96 group">
            <div className="absolute inset-0 bg-gold-500/5 blur-xl group-hover:bg-gold-500/10 transition-colors duration-1000 rounded-full" />
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gold-500" size={20} />
            <input 
              type="text" 
              placeholder="Query node_identity..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-16 pr-8 py-5 bg-white border border-coffee-50 rounded-full text-[11px] font-black uppercase tracking-[0.4em] focus:border-gold-500 transition-all duration-700 outline-none shadow-premium italic placeholder:text-coffee-200 relative z-10"
            />
          </div>
        </header>

        <div className="bg-white border border-coffee-50 rounded-[4rem] overflow-hidden shadow-premium-lg relative group">
          <div className="mesh-gradient absolute inset-0 opacity-[0.02] pointer-events-none transition-opacity duration-1000 group-hover:opacity-[0.05]" />
          <div className="overflow-x-auto relative z-10">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-coffee-950/5 border-b border-coffee-50 italic">
                  <th className="px-10 py-8 text-[11px] font-black text-coffee-400 uppercase tracking-[0.4em]">Node_Identity</th>
                  <th className="px-10 py-8 text-[11px] font-black text-coffee-400 uppercase tracking-[0.4em]">Auth_Protocol</th>
                  <th className="px-10 py-8 text-[11px] font-black text-coffee-400 uppercase tracking-[0.4em]">Loyalty_Nodes</th>
                  <th className="px-10 py-8 text-[11px] font-black text-coffee-400 uppercase tracking-[0.4em] text-right">Modulate_Node</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-coffee-50">
                {loading ? (
                  Array(6).fill(0).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={4} className="px-10 py-12 h-24 bg-white/50" />
                    </tr>
                  ))
                ) : filteredCustomers.map((customer) => (
                  <tr key={customer.uid} className="hover:bg-coffee-50/30 transition-all duration-700 group/row">
                    <td className="px-10 py-8">
                      <div className="flex items-center gap-10">
                        <div className="w-16 h-16 bg-white border border-coffee-100 rounded-2xl flex items-center justify-center font-display font-black text-xl italic text-coffee-200 shadow-premium transition-transform duration-700 group-hover/row:scale-110 group-hover/row:text-gold-500">
                          {customer.displayName[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-display font-black text-coffee-950 italic text-xl leading-none uppercase tracking-tight">{customer.displayName}</p>
                          <p className="text-[10px] font-black text-coffee-300 tracking-[0.4em] uppercase mt-2 italic leading-none">{customer.email}_ID</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <span className={cn(
                        "px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.4em] italic border transition-all duration-700",
                        customer.role === UserRole.ADMIN ? 'bg-purple-50 text-purple-600 border-purple-100 group-hover/row:bg-purple-600 group-hover/row:text-white' :
                        customer.role === UserRole.WHOLESALE ? 'bg-blue-50 text-blue-600 border-blue-100 group-hover/row:bg-blue-600 group-hover/row:text-white' :
                        'bg-coffee-50 text-coffee-600 border-coffee-100 group-hover/row:bg-coffee-950 group-hover/row:text-white'
                      )}>
                        {customer.role}_PROTOCOL
                      </span>
                    </td>
                    <td className="px-10 py-8">
                      <div className="flex items-center gap-4">
                        <Star className="text-gold-500 fill-gold-500 group-hover/row:animate-spin-slow" size={18} />
                        <span className="font-display font-black text-coffee-950 italic text-2xl tracking-tighter uppercase whitespace-nowrap">
                           {customer.loyaltyPoints || 0} <span className="text-[10px] font-black italic text-coffee-300">UNITS</span>
                        </span>
                      </div>
                    </td>
                    <td className="px-10 py-8 text-right">
                      <div className="flex items-center justify-end gap-6">
                        <button 
                          onClick={() => toggleAdmin(customer.uid, customer.role)}
                          className="w-14 h-14 bg-white border border-coffee-50 text-coffee-300 hover:text-purple-600 hover:bg-purple-50 hover:border-purple-100 rounded-2xl flex items-center justify-center transition-all duration-700 shadow-premium italic"
                          title={customer.role === UserRole.ADMIN ? "Demote to User" : "Make Admin"}
                        >
                          <Shield size={22} strokeWidth={1.5} />
                        </button>
                        <button className="w-14 h-14 bg-white border border-coffee-50 text-coffee-300 hover:text-red-500 hover:bg-red-50 hover:border-red-100 rounded-2xl flex items-center justify-center transition-all duration-700 shadow-premium italic">
                          <Ban size={22} strokeWidth={1.5} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
