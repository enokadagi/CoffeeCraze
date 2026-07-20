import { useState, useEffect } from 'react';
import { db, auth } from '../../lib/firebase';
import { collection, doc, getDocs, setDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';
import { UserRole, UserProfile, ROLE_LABELS } from '../../types';
import { toast } from 'sonner';
import { Shield, UserPlus, Trash2, Mail, Check, X, ShieldAlert, Key, Edit, RefreshCw } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import SEO from '../../components/common/SEO';
import { cn } from '../../lib/utils';

interface EmployeeInvite {
  email: string;
  name: string;
  role: UserRole;
  permissions: string[];
  invitedAt: string;
  status: 'pending';
}

const AVAILABLE_PERMISSIONS = [
  { id: 'products', label: 'Products & Catalog', desc: 'Create, edit, and delete products' },
  { id: 'inventory', label: 'Inventory Management', desc: 'Update stock levels and manage SKUs' },
  { id: 'orders', label: 'Order Processing', desc: 'View, update, and manage orders' },
  { id: 'subscriptions', label: 'Subscriptions', desc: 'Manage subscription plans and customer schedules' },
  { id: 'wholesale', label: 'Wholesale Accounts', desc: 'Approve and manage wholesale partners' },
  { id: 'cms', label: 'CMS & Blog', desc: 'Edit homepage content, banners, and blog posts' },
  { id: 'messages', label: 'Customer Service', desc: 'Read and reply to contact messages' },
  { id: 'drivers', label: 'Driver Operations', desc: 'Assign orders and manage deliveries' },
  { id: 'employees', label: 'Staff Management', desc: 'Manage staff roles, statuses, and permissions' },
  { id: 'settings', label: 'System Settings', desc: 'Configure exchange rates, fees, and global parameters' },
];

export default function Employees() {
  const [employees, setEmployees] = useState<UserProfile[]>([]);
  const [invites, setInvites] = useState<EmployeeInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'staff' | 'invites'>('staff');

  // Edit / Invite Modals
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<UserProfile | null>(null);

  // Form states
  const [inviteForm, setInviteForm] = useState({
    email: '',
    name: '',
    role: UserRole.CUSTOMER_SERVICE,
    permissions: [] as string[],
  });

  const [editForm, setEditForm] = useState({
    role: UserRole.CUSTOMER_SERVICE,
    status: 'active' as 'active' | 'disabled' | 'suspended',
    permissions: [] as string[],
  });

  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch users from Firestore
      const usersSnap = await getDocs(collection(db, 'users'));
      const staffList = usersSnap.docs
        .map((d) => ({ id: d.id, ...d.data() } as unknown as UserProfile))
        .filter((u) => u.role && u.role !== UserRole.CUSTOMER && u.role !== UserRole.WHOLESALE);

      setEmployees(staffList);

      // Fetch invites
      const invitesSnap = await getDocs(collection(db, 'employee_invites'));
      const invitesList = invitesSnap.docs.map((d) => ({
        email: d.id,
        ...d.data(),
      } as EmployeeInvite));

      setInvites(invitesList);
    } catch (err) {
      console.error('Error fetching employee data:', err);
      toast.error('Failed to load employee directory');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteForm.email || !inviteForm.name) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      const emailLower = inviteForm.email.toLowerCase();
      // Check if already in staff
      const exists = employees.some((emp) => emp.email.toLowerCase() === emailLower);
      if (exists) {
        toast.error('User is already registered as staff');
        return;
      }

      // Add to invites collection
      const inviteRef = doc(db, 'employee_invites', emailLower);
      const invitePayload: EmployeeInvite = {
        email: emailLower,
        name: inviteForm.name,
        role: inviteForm.role,
        permissions: inviteForm.permissions,
        invitedAt: new Date().toISOString(),
        status: 'pending',
      };

      await setDoc(inviteRef, invitePayload);
      toast.success(`Invitation created successfully for ${emailLower}`);
      setShowInviteModal(false);
      setInviteForm({
        email: '',
        name: '',
        role: UserRole.CUSTOMER_SERVICE,
        permissions: [],
      });
      fetchData();
    } catch (err) {
      console.error('Error inviting employee:', err);
      toast.error('Failed to invite employee');
    }
  };

  const handleEditOpen = (emp: UserProfile) => {
    setSelectedEmployee(emp);
    setEditForm({
      role: emp.role || UserRole.CUSTOMER_SERVICE,
      status: emp.status || 'active',
      permissions: emp.permissions || [],
    });
    setShowEditModal(true);
  };

  const handleEditSave = async () => {
    if (!selectedEmployee) return;

    try {
      const userRef = doc(db, 'users', selectedEmployee.uid);
      await updateDoc(userRef, {
        role: editForm.role,
        status: editForm.status,
        permissions: editForm.permissions,
        updatedAt: new Date().toISOString(),
      });

      toast.success('Employee credentials successfully modified');
      setShowEditModal(false);
      setSelectedEmployee(null);
      fetchData();
    } catch (err) {
      console.error('Failed to update employee:', err);
      toast.error('Failed to update employee details');
    }
  };

  const handleDeleteEmployee = async (emp: UserProfile) => {
    if (!window.confirm(`Are you sure you want to remove ${emp.displayName} from staff?`)) return;

    try {
      // Revert their role back to customer
      const userRef = doc(db, 'users', emp.uid);
      await updateDoc(userRef, {
        role: UserRole.CUSTOMER,
        permissions: [],
        status: 'active',
        updatedAt: new Date().toISOString(),
      });

      toast.success(`${emp.displayName} removed from staff`);
      fetchData();
    } catch (err) {
      console.error('Failed to remove employee:', err);
      toast.error('Failed to remove employee');
    }
  };

  const handleDeleteInvite = async (email: string) => {
    if (!window.confirm(`Cancel invitation for ${email}?`)) return;

    try {
      await deleteDoc(doc(db, 'employee_invites', email));
      toast.success('Invitation cancelled');
      fetchData();
    } catch (err) {
      console.error('Failed to delete invite:', err);
      toast.error('Failed to delete invite');
    }
  };

  const handleTriggerPasswordReset = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success(`Password reset email successfully triggered for ${email}`);
    } catch (err) {
      console.error('Error sending reset email:', err);
      toast.error('Failed to trigger password reset email');
    }
  };

  const toggleInvitePermission = (permId: string) => {
    setInviteForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permId)
        ? prev.permissions.filter((p) => p !== permId)
        : [...prev.permissions, permId],
    }));
  };

  const toggleEditPermission = (permId: string) => {
    setEditForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permId)
        ? prev.permissions.filter((p) => p !== permId)
        : [...prev.permissions, permId],
    }));
  };

  const filteredStaff = employees.filter(
    (emp) =>
      emp.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <SEO title="Staff Management" description="Configure employee permissions, invite active drivers, and update status clearances." />

        {/* Header */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-caramel mb-2">Operations</p>
            <h1 className="text-h1 font-display font-black text-espresso italic">Staff Registry</h1>
            <p className="text-sm text-text-muted mt-2">Manage employee permissions, roles, and status clearances</p>
          </div>
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2 px-6 py-3.5 bg-espresso text-white rounded-xl text-sm font-bold hover:bg-caramel hover:text-white transition-colors"
          >
            <UserPlus size={18} /> Invite Staff
          </button>
        </header>

        {/* Search & Tabs */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex bg-cream p-1 rounded-xl border border-border shrink-0 self-start">
            <button
              onClick={() => setActiveTab('staff')}
              className={cn(
                'px-5 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all',
                activeTab === 'staff'
                  ? 'bg-espresso text-white shadow-sm'
                  : 'text-text-secondary hover:text-espresso'
              )}
            >
              Active Staff ({employees.length})
            </button>
            <button
              onClick={() => setActiveTab('invites')}
              className={cn(
                'px-5 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all',
                activeTab === 'invites'
                  ? 'bg-espresso text-white shadow-sm'
                  : 'text-text-secondary hover:text-espresso'
              )}
            >
              Pending Invites ({invites.length})
            </button>
          </div>

          <div className="flex-1 max-w-md">
            <label htmlFor="staff-search" className="sr-only">
              Search staff
            </label>
            <input
              id="staff-search"
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-sm outline-none focus:border-caramel"
            />
          </div>
        </div>

        {/* Directory Tables */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-cream rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : activeTab === 'staff' ? (
          filteredStaff.length === 0 ? (
            <div className="text-center py-20 bg-white border border-border rounded-3xl">
              <Shield className="mx-auto text-coffee-200 mb-4" size={48} />
              <p className="text-text-muted italic text-sm">No staff members found matching search parameters</p>
            </div>
          ) : (
            <div className="bg-white border border-border rounded-3xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-cream/40 border-b border-border text-xs font-bold uppercase tracking-widest text-text-muted">
                      <th className="py-4 px-6">Name</th>
                      <th className="py-4 px-6">Role</th>
                      <th className="py-4 px-6">Permissions</th>
                      <th className="py-4 px-6">Status</th>
                      <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredStaff.map((emp) => (
                      <tr key={emp.uid} className="hover:bg-cream/10 transition-colors text-sm">
                        <td className="py-5 px-6">
                          <div className="font-bold text-espresso">{emp.displayName}</div>
                          <div className="text-xs text-text-muted font-mono">{emp.email}</div>
                        </td>
                        <td className="py-5 px-6">
                          <span className="px-3 py-1 bg-espresso/5 border border-espresso/10 rounded-full text-xs font-black uppercase text-espresso">
                            {ROLE_LABELS[emp.role] || emp.role}
                          </span>
                        </td>
                        <td className="py-5 px-6 max-w-xs">
                          {emp.role === UserRole.SUPER_ADMIN || emp.role === UserRole.ADMIN ? (
                            <span className="text-xs text-green-700 font-bold">All Permissions (Bypassed)</span>
                          ) : emp.permissions && emp.permissions.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {emp.permissions.map((p) => (
                                <span
                                  key={p}
                                  className="px-2 py-0.5 bg-caramel/10 border border-caramel/20 rounded text-[10px] font-bold text-caramel capitalize"
                                >
                                  {p}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-text-muted italic">No granular permissions</span>
                          )}
                        </td>
                        <td className="py-5 px-6">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border',
                              emp.status === 'disabled'
                                ? 'bg-red-50 text-red-700 border-red-200'
                                : emp.status === 'suspended'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-green-50 text-green-700 border-green-200'
                            )}
                          >
                            <span
                              className={cn(
                                'w-2 h-2 rounded-full',
                                emp.status === 'disabled'
                                  ? 'bg-red-500'
                                  : emp.status === 'suspended'
                                  ? 'bg-amber-500'
                                  : 'bg-green-500'
                              )}
                            />
                            {emp.status || 'active'}
                          </span>
                        </td>
                        <td className="py-5 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleTriggerPasswordReset(emp.email)}
                              className="p-2 border border-border hover:bg-cream/30 hover:border-caramel rounded-xl transition-all text-text-secondary hover:text-caramel"
                              title="Reset Password"
                            >
                              <Key size={16} />
                            </button>
                            <button
                              onClick={() => handleEditOpen(emp)}
                              className="p-2 border border-border hover:bg-cream/30 hover:border-caramel rounded-xl transition-all text-text-secondary hover:text-caramel"
                              title="Edit Permissions"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteEmployee(emp)}
                              className="p-2 border border-border hover:bg-red-50 hover:border-red-200 rounded-xl transition-all text-text-secondary hover:text-red-600"
                              title="Remove Staff Clearance"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        ) : invites.length === 0 ? (
          <div className="text-center py-20 bg-white border border-border rounded-3xl">
            <Mail className="mx-auto text-coffee-200 mb-4" size={48} />
            <p className="text-text-muted italic text-sm">No pending staff invitations</p>
          </div>
        ) : (
          <div className="bg-white border border-border rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-cream/40 border-b border-border text-xs font-bold uppercase tracking-widest text-text-muted">
                    <th className="py-4 px-6">Name</th>
                    <th className="py-4 px-6">Invited Email</th>
                    <th className="py-4 px-6">Target Role</th>
                    <th className="py-4 px-6">Permissions Granted</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {invites.map((inv) => (
                    <tr key={inv.email} className="hover:bg-cream/10 transition-colors text-sm">
                      <td className="py-5 px-6 font-bold text-espresso">{inv.name}</td>
                      <td className="py-5 px-6 font-mono text-xs text-text-secondary">{inv.email}</td>
                      <td className="py-5 px-6">
                        <span className="px-3 py-1 bg-espresso/5 border border-espresso/10 rounded-full text-xs font-black uppercase text-espresso">
                          {ROLE_LABELS[inv.role] || inv.role}
                        </span>
                      </td>
                      <td className="py-5 px-6 max-w-xs">
                        {inv.permissions && inv.permissions.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {inv.permissions.map((p) => (
                              <span
                                key={p}
                                className="px-2 py-0.5 bg-caramel/10 border border-caramel/20 rounded text-[10px] font-bold text-caramel capitalize"
                              >
                                {p}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-text-muted italic">No granular permissions</span>
                        )}
                      </td>
                      <td className="py-5 px-6 text-right">
                        <button
                          onClick={() => handleDeleteInvite(inv.email)}
                          className="p-2 border border-border hover:bg-red-50 hover:border-red-200 rounded-xl transition-all text-text-secondary hover:text-red-600"
                          title="Revoke Invitation"
                        >
                          <X size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Invite Modal */}
        {showInviteModal && (
          <div className="fixed inset-0 bg-espresso/45 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
            <div className="bg-white border border-border rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-premium max-h-[90vh] overflow-y-auto">
              <header className="flex items-center justify-between border-b border-border pb-4">
                <h3 className="text-lg font-display font-black text-espresso flex items-center gap-2 italic uppercase">
                  <UserPlus size={20} className="text-caramel" /> Invite Employee
                </h3>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="p-1 hover:bg-cream rounded-lg transition-colors text-text-muted hover:text-espresso"
                >
                  <X size={20} />
                </button>
              </header>

              <form onSubmit={handleInviteSubmit} className="space-y-4">
                <div>
                  <label htmlFor="invite-name" className="text-xs font-bold uppercase tracking-widest text-text-muted block mb-2">
                    Employee Name
                  </label>
                  <input
                    id="invite-name"
                    type="text"
                    required
                    value={inviteForm.name}
                    onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                    className="w-full px-4 py-3 border border-border rounded-xl text-sm outline-none focus:border-caramel"
                    placeholder="Full Name"
                  />
                </div>

                <div>
                  <label htmlFor="invite-email" className="text-xs font-bold uppercase tracking-widest text-text-muted block mb-2">
                    Email Address
                  </label>
                  <input
                    id="invite-email"
                    type="email"
                    required
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                    className="w-full px-4 py-3 border border-border rounded-xl text-sm outline-none focus:border-caramel"
                    placeholder="name@coffeecraze.app"
                  />
                </div>

                <div>
                  <label htmlFor="invite-role" className="text-xs font-bold uppercase tracking-widest text-text-muted block mb-2">
                    Logistics Role
                  </label>
                  <select
                    id="invite-role"
                    value={inviteForm.role}
                    onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value as UserRole })}
                    className="w-full px-4 py-3 border border-border rounded-xl text-sm outline-none focus:border-caramel bg-white font-semibold text-espresso"
                  >
                    <option value={UserRole.ADMIN}>Admin</option>
                    <option value={UserRole.OWNER}>Owner</option>
                    <option value={UserRole.MANAGER}>Manager</option>
                    <option value={UserRole.ACCOUNTING}>Accounting</option>
                    <option value={UserRole.PRODUCT_MANAGER}>Product Manager</option>
                    <option value={UserRole.WHOLESALE_MANAGER}>Wholesale Manager</option>
                    <option value={UserRole.CUSTOMER_SERVICE}>Customer Service</option>
                    <option value={UserRole.INVENTORY}>Inventory</option>
                    <option value={UserRole.WAREHOUSE}>Warehouse</option>
                    <option value={UserRole.BARISTA}>Barista</option>
                    <option value={UserRole.MARKETING}>Marketing</option>
                    <option value={UserRole.SUPPLIER_MANAGER}>Supplier Manager</option>
                    <option value={UserRole.DRIVER}>Driver / Dispatch</option>
                    <option value={UserRole.SUPPORT}>Support</option>
                    <option value={UserRole.ANALYST}>Analyst</option>
                  </select>
                </div>

                <div className="pt-2">
                  <p className="text-xs font-bold uppercase tracking-widest text-text-muted mb-3">
                    Granular Access Permissions
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto border border-border p-3 rounded-2xl bg-cream/10">
                    {AVAILABLE_PERMISSIONS.map((perm) => (
                      <label
                        key={perm.id}
                        className={cn(
                          'flex items-start gap-2.5 p-2 rounded-xl border-2 cursor-pointer transition-all',
                          inviteForm.permissions.includes(perm.id)
                            ? 'bg-caramel/10 border-caramel'
                            : 'bg-white border-transparent'
                        )}
                      >
                        <input
                          type="checkbox"
                          className="mt-1"
                          checked={inviteForm.permissions.includes(perm.id)}
                          onChange={() => toggleInvitePermission(perm.id)}
                        />
                        <div>
                          <div className="text-xs font-bold text-espresso">{perm.label}</div>
                          <div className="text-[10px] text-text-muted leading-tight mt-0.5">{perm.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t border-border mt-6">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="px-5 py-3 border border-border text-espresso font-bold rounded-xl text-xs uppercase tracking-wider hover:bg-cream"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-3 bg-espresso text-white font-bold rounded-xl text-xs uppercase tracking-wider hover:bg-caramel hover:text-white"
                  >
                    Submit Invitation
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && selectedEmployee && (
          <div className="fixed inset-0 bg-espresso/45 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
            <div className="bg-white border border-border rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-premium max-h-[90vh] overflow-y-auto">
              <header className="flex items-center justify-between border-b border-border pb-4">
                <h3 className="text-lg font-display font-black text-espresso flex items-center gap-2 italic uppercase">
                  <ShieldAlert size={20} className="text-caramel" /> Edit Staff Access
                </h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-1 hover:bg-cream rounded-lg transition-colors text-text-muted hover:text-espresso"
                >
                  <X size={20} />
                </button>
              </header>

              <div className="space-y-4">
                <div className="p-4 bg-cream/40 border border-border rounded-2xl">
                  <div className="text-xs text-text-muted font-bold uppercase tracking-wider">Employee</div>
                  <div className="text-sm font-black text-espresso mt-0.5">{selectedEmployee.displayName}</div>
                  <div className="text-xs font-mono text-text-secondary mt-0.5">{selectedEmployee.email}</div>
                </div>

                <div>
                  <label htmlFor="edit-role" className="text-xs font-bold uppercase tracking-widest text-text-muted block mb-2">
                    Assigned Role
                  </label>
                  <select
                    id="edit-role"
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value as UserRole })}
                    className="w-full px-4 py-3 border border-border rounded-xl text-sm outline-none focus:border-caramel bg-white font-semibold text-espresso"
                  >
                    <option value={UserRole.ADMIN}>Admin</option>
                    <option value={UserRole.OWNER}>Owner</option>
                    <option value={UserRole.MANAGER}>Manager</option>
                    <option value={UserRole.ACCOUNTING}>Accounting</option>
                    <option value={UserRole.PRODUCT_MANAGER}>Product Manager</option>
                    <option value={UserRole.WHOLESALE_MANAGER}>Wholesale Manager</option>
                    <option value={UserRole.CUSTOMER_SERVICE}>Customer Service</option>
                    <option value={UserRole.INVENTORY}>Inventory</option>
                    <option value={UserRole.WAREHOUSE}>Warehouse</option>
                    <option value={UserRole.BARISTA}>Barista</option>
                    <option value={UserRole.MARKETING}>Marketing</option>
                    <option value={UserRole.SUPPLIER_MANAGER}>Supplier Manager</option>
                    <option value={UserRole.DRIVER}>Driver</option>
                    <option value={UserRole.SUPPORT}>Support</option>
                    <option value={UserRole.ANALYST}>Analyst</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="edit-status" className="text-xs font-bold uppercase tracking-widest text-text-muted block mb-2">
                    Account Clearance Status
                  </label>
                  <select
                    id="edit-status"
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
                    className="w-full px-4 py-3 border border-border rounded-xl text-sm outline-none focus:border-caramel bg-white font-semibold text-espresso"
                  >
                    <option value="active">Active Clearance</option>
                    <option value="suspended">Suspended (Access Temporarily Blocked)</option>
                    <option value="disabled">Disabled (Permanently Revoked)</option>
                  </select>
                </div>

                <div className="pt-2">
                  <p className="text-xs font-bold uppercase tracking-widest text-text-muted mb-3">
                    Granular Access Permissions
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto border border-border p-3 rounded-2xl bg-cream/10">
                    {AVAILABLE_PERMISSIONS.map((perm) => (
                      <label
                        key={perm.id}
                        className={cn(
                          'flex items-start gap-2.5 p-2 rounded-xl border-2 cursor-pointer transition-all',
                          editForm.permissions.includes(perm.id)
                            ? 'bg-caramel/10 border-caramel'
                            : 'bg-white border-transparent'
                        )}
                      >
                        <input
                          type="checkbox"
                          className="mt-1"
                          checked={editForm.permissions.includes(perm.id)}
                          onChange={() => toggleEditPermission(perm.id)}
                        />
                        <div>
                          <div className="text-xs font-bold text-espresso">{perm.label}</div>
                          <div className="text-[10px] text-text-muted leading-tight mt-0.5">{perm.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t border-border mt-6">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-5 py-3 border border-border text-espresso font-bold rounded-xl text-xs uppercase tracking-wider hover:bg-cream"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleEditSave}
                    className="px-5 py-3 bg-espresso text-white font-bold rounded-xl text-xs uppercase tracking-wider hover:bg-caramel hover:text-white"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}