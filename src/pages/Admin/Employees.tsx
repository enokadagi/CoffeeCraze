import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { UserProfile, UserRole, ROLE_LABELS, hasRole } from '../../types';
import { Users, Search, Shield, Trash2, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';
import SEO from '../../components/common/SEO';
import DashboardLayout from '../../components/layout/DashboardLayout';

const MANAGEABLE_ROLES = [UserRole.ADMIN, UserRole.PRODUCT_MANAGER, UserRole.WHOLESALE_MANAGER, UserRole.CUSTOMER_SERVICE, UserRole.ANALYST];

export default function AdminEmployees() {
  const [employees, setEmployees] = useState<(UserProfile & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newRole, setNewRole] = useState<UserRole>(UserRole.CUSTOMER_SERVICE);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() } as UserProfile & { id: string }));
      setEmployees(all.filter(u => MANAGEABLE_ROLES.includes(u.role) || u.role === UserRole.SUPER_ADMIN));
    } catch (err) {
      toast.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEmployees(); }, []);

  const handleRoleChange = async (userId: string, role: UserRole) => {
    try {
      await updateDoc(doc(db, 'users', userId), { role });
      setEmployees(employees.map(e => e.id === userId ? { ...e, role } : e));
      toast.success(`Role updated to ${ROLE_LABELS[role]}`);
      setEditingId(null);
    } catch (err) {
      toast.error('Failed to update role');
    }
  };

  const filtered = employees.filter(e =>
    e.displayName?.toLowerCase().includes(search.toLowerCase()) ||
    e.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <SEO title="Employee Management" description="Manage staff roles and permissions" />
        <header className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 border-b border-espresso/5 pb-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-caramel mb-2">Staff Operations</p>
            <h1 className="text-h1 font-display font-bold text-espresso">Employees</h1>
            <p className="text-sm text-text-muted mt-2">Manage employee roles and permissions</p>
          </div>
        </header>

        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
          <input
            type="text"
            placeholder="Search employees..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-border rounded-2xl text-sm outline-none focus:border-caramel transition-all"
          />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-4">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="h-24 bg-white animate-pulse rounded-2xl border border-border" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-border">
            <Users size={40} className="mx-auto text-text-muted mb-4" />
            <p className="text-text-muted">No employees found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((emp) => (
              <motion.div
                key={emp.id}
                layout
                className="bg-white border border-border rounded-2xl p-6 flex items-center justify-between gap-4 hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-12 h-12 bg-caramel/10 rounded-2xl flex items-center justify-center text-caramel font-bold text-lg shrink-0">
                    {emp.displayName?.[0] || '?'}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-espresso text-sm truncate">{emp.displayName}</p>
                    <p className="text-xs text-text-muted truncate">{emp.email}</p>
                    <p className="text-[10px] text-text-muted uppercase tracking-wider mt-0.5">
                      Since {new Date(emp.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {editingId === emp.id ? (
                  <div className="flex items-center gap-2 shrink-0">
                    <select
                      value={newRole}
                      onChange={e => setNewRole(e.target.value as UserRole)}
                      className="px-3 py-2 bg-white border border-coffee-200 rounded-xl text-xs font-bold uppercase tracking-wider outline-none focus:border-caramel"
                    >
                      {MANAGEABLE_ROLES.map(r => (
                        <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleRoleChange(emp.id, newRole)}
                      className="p-2 bg-caramel text-white rounded-xl hover:bg-caramel/90 transition-colors"
                    >
                      <Save size={16} />
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="p-2 bg-cream text-text-secondary rounded-xl hover:bg-coffee-200 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={cn(
                      'px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border',
                      emp.role === UserRole.SUPER_ADMIN ? 'bg-purple-50 text-purple-700 border-purple-200' :
                      emp.role === UserRole.ADMIN ? 'bg-espresso/10 text-espresso border-espresso/20' :
                      'bg-cream text-text-secondary border-coffee-200'
                    )}>
                      {ROLE_LABELS[emp.role]}
                    </span>
                    {emp.role !== UserRole.SUPER_ADMIN && (
                      <button
                        onClick={() => { setEditingId(emp.id); setNewRole(emp.role); }}
                        className="p-2 hover:bg-cream rounded-xl transition-colors text-text-muted hover:text-espresso"
                      >
                        <Shield size={16} />
                      </button>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}