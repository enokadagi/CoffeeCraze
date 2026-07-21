import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Profile, UserRole } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Users, Search, Shield, Star, Ban, ExternalLink } from 'lucide-react';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';
import SEO from '../../components/common/SEO';
import DashboardLayout from '../../components/layout/DashboardLayout';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { logAdminAction } from '../../utils/auditLog';

export default function AdminCustomers() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { user: currentUser } = useAuth();
  const [confirmTarget, setConfirmTarget] = useState<{ uid: string; action: 'toggleAdmin' | 'delete'; role: UserRole } | null>(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setCustomers(snap.docs.map(d => ({ ...d.data() } as Profile)));
    } catch (err) {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const canManage = currentUser && (currentUser.uid === confirmTarget?.uid ? false : true);

  const executeAction = async () => {
    if (!confirmTarget) return;
    const { uid, action, role } = confirmTarget;
    setConfirmTarget(null);
    try {
      if (action === 'toggleAdmin') {
        const newRole = role === UserRole.ADMIN ? UserRole.CUSTOMER : UserRole.ADMIN;
        await updateDoc(doc(db, 'users', uid), { role: newRole });
        setCustomers(customers.map(c => c.uid === uid ? { ...c, role: newRole } : c));
        logAdminAction(currentUser?.uid || '', currentUser?.email || '', 'toggle_admin_role', 'users', uid, { from: role, to: newRole });
        toast.success(`Role updated to ${newRole}`);
      } else if (action === 'delete') {
        await deleteDoc(doc(db, 'users', uid));
        setCustomers(customers.filter(c => c.uid !== uid));
        logAdminAction(currentUser?.uid || '', currentUser?.email || '', 'delete_user', 'users', uid, {});
        toast.success('User removed');
      }
    } catch (err) {
      toast.error(action === 'toggleAdmin' ? 'Failed to update role' : 'Failed to remove user');
    }
  };

  const filteredCustomers = customers.filter(c => 
    (c.displayName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-16 relative">
        <SEO title="Customers" description="Manage CoffeeCraze customer accounts and user roles." />
        <header className="flex flex-col md:flex-row items-start md:items-end justify-between gap-10 border-b border-border-light pb-16">
          <div className="space-y-4">
            <span className="text-caption text-gold-500 italic">Network Intelligence</span>
            <h1 className="text-7xl font-display font-black text-text tracking-tightest leading-none italic uppercase">Ritualist <br/><span className="not-italic text-text-muted">Nodes.</span></h1>
            <p className="text-xl text-text-muted font-serif italic">Global mapping of the <span className="text-text font-black not-italic uppercase">CoffeeCraze sensory collective</span>.</p>
          </div>

          <div className="relative w-full md:w-96 group">
            <div className="absolute inset-0 bg-gold-500/5 blur-xl group-hover:bg-gold-500/10 transition-colors duration-1000 rounded-full" />
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gold-500" size={20} />
            <input 
              type="text" 
              placeholder="Query node_identity..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-16 pr-8 py-5 bg-white border border-border-light rounded-full text-[11px] font-black uppercase tracking-[0.4em] focus:border-gold-500 transition-all duration-700 outline-none shadow-premium italic placeholder:text-coffee-200 relative z-10"
            />
          </div>
        </header>

        <div className="bg-white border border-border-light rounded-[4rem] overflow-hidden shadow-premium-lg relative group">
          <div className="mesh-gradient absolute inset-0 opacity-[0.02] pointer-events-none transition-opacity duration-1000 group-hover:opacity-[0.05]" />
          <div className="overflow-x-auto relative z-10">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-coffee-950/5 border-b border-border-light italic">
                  <th className="px-10 py-8 text-[11px] font-black text-text-muted uppercase tracking-[0.4em]">Node_Identity</th>
                  <th className="px-10 py-8 text-[11px] font-black text-text-muted uppercase tracking-[0.4em]">Auth_Protocol</th>
                  <th className="px-10 py-8 text-[11px] font-black text-text-muted uppercase tracking-[0.4em]">Loyalty_Nodes</th>
                  <th className="px-10 py-8 text-[11px] font-black text-text-muted uppercase tracking-[0.4em] text-right">Modulate_Node</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-coffee-50">
                {loading ? (
                  Array(6).fill(0).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={4} className="px-10 py-12 h-24 bg-white/50" />
                    </tr>
                  ))
                ) : filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-10 py-16 text-center">
                      <p className="text-text-muted italic text-lg">{searchTerm ? 'No customers match your search.' : 'No customers yet.'}</p>
                    </td>
                  </tr>
                ) : filteredCustomers.map((customer) => (
                  <tr key={customer.uid} onClick={() => navigate(`/admin/customers/${customer.uid}`)} className="hover:bg-cream/30 transition-all duration-700 group/row cursor-pointer">
                    <td className="px-10 py-8">
                      <div className="flex items-center gap-10">
                        <div className="w-16 h-16 bg-white border border-border rounded-2xl flex items-center justify-center font-display font-black text-xl italic text-coffee-200 shadow-premium transition-transform duration-700 group-hover/row:scale-110 group-hover/row:text-gold-500">
                          {(customer.displayName?.[0] || '?').toUpperCase()}
                        </div>
                        <div>
                          <p className="font-display font-black text-text italic text-xl leading-none uppercase tracking-tight">{customer.displayName}</p>
                          <p className="text-[10px] font-black text-text-muted tracking-[0.4em] uppercase mt-2 italic leading-none">{customer.email}_ID</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <span className={cn(
                        "px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.4em] italic border transition-all duration-700",
                        customer.role === UserRole.ADMIN ? 'bg-purple-50 text-purple-600 border-purple-100 group-hover/row:bg-purple-600 group-hover/row:text-white' :
                        customer.role === UserRole.WHOLESALE ? 'bg-blue-50 text-blue-600 border-blue-100 group-hover/row:bg-blue-600 group-hover/row:text-white' :
                        'bg-cream text-text-secondary border-border group-hover/row:bg-coffee-950 group-hover/row:text-white'
                      )}>
                        {customer.role}_PROTOCOL
                      </span>
                    </td>
                    <td className="px-10 py-8">
                      <div className="flex items-center gap-4">
                        <Star className="text-gold-500 fill-gold-500 group-hover/row:animate-spin-slow" size={18} />
                        <span className="font-display font-black text-text italic text-2xl tracking-tighter uppercase whitespace-nowrap">
                           {customer.loyaltyPoints || 0} <span className="text-[10px] font-black italic text-text-muted">UNITS</span>
                        </span>
                      </div>
                    </td>
                    <td className="px-10 py-8 text-right">
                      <div className="flex items-center justify-end gap-6">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setConfirmTarget({ uid: customer.uid, action: 'toggleAdmin', role: customer.role }) }}
                          disabled={customer.uid === currentUser?.uid}
                          className={cn(
                            "w-14 h-14 border rounded-2xl flex items-center justify-center transition-all duration-700 shadow-premium italic",
                            customer.uid === currentUser?.uid
                              ? "bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed"
                              : "bg-white border-border-light text-text-muted hover:text-purple-600 hover:bg-purple-50 hover:border-purple-100"
                          )}
                          title={customer.uid === currentUser?.uid ? "Cannot modify your own account" : (customer.role === UserRole.ADMIN ? "Demote to User" : "Make Admin")}
                        >
                          <Shield size={22} strokeWidth={1.5} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setConfirmTarget({ uid: customer.uid, action: 'delete', role: customer.role }) }}
                          disabled={customer.uid === currentUser?.uid}
                          className={cn(
                            "w-14 h-14 border rounded-2xl flex items-center justify-center transition-all duration-700 shadow-premium italic",
                            customer.uid === currentUser?.uid
                              ? "bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed"
                              : "bg-white border-border-light text-text-muted hover:text-red-500 hover:bg-red-50 hover:border-red-100"
                          )}
                          title={customer.uid === currentUser?.uid ? "Cannot delete your own account" : "Remove user"}
                        >
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
      <ConfirmDialog
        open={confirmTarget !== null}
        title={confirmTarget?.action === 'delete' ? 'Remove User' : 'Change Role'}
        message={confirmTarget?.action === 'delete' ? 'Permanently remove this user from the system?' : `${confirmTarget?.role === UserRole.ADMIN ? 'Demote' : 'Promote'} this user to ${confirmTarget?.role === UserRole.ADMIN ? 'Customer' : 'Admin'}?`}
        confirmLabel={confirmTarget?.action === 'delete' ? 'Remove' : 'Confirm'}
        variant={confirmTarget?.action === 'delete' ? 'danger' : 'default'}
        onConfirm={executeAction}
        onCancel={() => setConfirmTarget(null)}
      />
    </DashboardLayout>
  );
}
