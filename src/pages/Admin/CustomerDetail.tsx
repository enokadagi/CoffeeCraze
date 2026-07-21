import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, orderBy, getDocs, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { UserProfile, Order, Subscription, OrderStatus, UserRole, ROLE_LABELS } from '../../types';
import { formatPrice, safeDate, cn } from '../../lib/utils';
import { toast } from 'sonner';
import { ArrowLeft, Mail, Phone, MapPin, Calendar, Shield, ShoppingBag, Package, Clock, Truck, CheckCircle, XCircle, CreditCard, Star } from 'lucide-react';
import SEO from '../../components/common/SEO';
import DashboardLayout from '../../components/layout/DashboardLayout';

export default function AdminCustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<UserProfile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleLoading, setRoleLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    loadCustomer();
    loadOrders();
    loadSubscriptions();
  }, [id]);

  const loadCustomer = async () => {
    try {
      const snap = await getDoc(doc(db, 'users', id!));
      if (snap.exists()) {
        setCustomer(snap.data() as UserProfile);
      } else {
        toast.error('Customer not found');
        navigate('/admin/customers');
      }
    } catch {
      toast.error('Failed to load customer');
      navigate('/admin/customers');
    }
  };

  const loadOrders = async () => {
    try {
      const q = query(collection(db, 'orders'), where('userId', '==', id!), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setOrders(snap.docs.map(d => {
        const data = d.data();
        const createdAt = data.createdAt;
        return {
          id: d.id,
          ...data,
          createdAt: createdAt?.toDate?.()?.toISOString?.() || createdAt || new Date().toISOString(),
        } as Order;
      }));
    } catch { /* non-critical */ }
  };

  const loadSubscriptions = async () => {
    try {
      const q = query(collection(db, 'subscriptions'), where('userId', '==', id!));
      const snap = await getDocs(q);
      setSubscriptions(snap.docs.map(d => ({ id: d.id, ...d.data() } as Subscription)));
    } catch { /* non-critical */ }
  };

  const handleRoleToggle = async () => {
    if (!customer) return;
    setRoleLoading(true);
    try {
      const newRole = customer.role === UserRole.ADMIN ? UserRole.CUSTOMER : UserRole.ADMIN;
      await updateDoc(doc(db, 'users', customer.uid), { role: newRole });
      setCustomer({ ...customer, role: newRole });
      toast.success(`Role updated to ${newRole}`);
    } catch {
      toast.error('Failed to update role');
    } finally {
      setRoleLoading(false);
    }
  };

  const activeOrders = orders.filter(o => o.status !== OrderStatus.DELIVERED && o.status !== OrderStatus.CANCELLED);
  const pastOrders = orders.filter(o => o.status === OrderStatus.DELIVERED || o.status === OrderStatus.CANCELLED);

  const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
      case 'pending': return <Clock size={14} className="text-yellow-500" />;
      case 'confirmed': case 'processing': case 'preparing': case 'ready': return <Package size={14} className="text-blue-500" />;
      case 'shipped': case 'out_for_delivery': return <Truck size={14} className="text-purple-500" />;
      case 'delivered': return <CheckCircle size={14} className="text-green-500" />;
      case 'cancelled': return <XCircle size={14} className="text-red-500" />;
      default: return <Clock size={14} className="text-gray-400" />;
    }
  };

  if (loading && !customer) {
    return (
      <DashboardLayout>
        <div className="animate-pulse space-y-8 p-8">
          <div className="h-8 bg-cream rounded w-64" />
          <div className="h-48 bg-cream rounded-3xl" />
          <div className="h-64 bg-cream rounded-3xl" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <SEO title={customer?.displayName || 'Customer'} description="Customer details and order history" />

        <button onClick={() => navigate('/admin/customers')} className="flex items-center gap-2 text-sm font-bold text-caramel hover:text-espresso transition-colors">
          <ArrowLeft size={16} /> Back to Customers
        </button>

        {/* Customer Info Card */}
        <div className="bg-white border border-border rounded-3xl p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-4 mb-2">
                  <div className="w-16 h-16 bg-cream rounded-2xl flex items-center justify-center text-2xl font-display font-black text-espresso border border-border">
                    {customer?.displayName?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <h1 className="text-2xl font-display font-black text-espresso italic uppercase">{customer?.displayName || 'Unknown'}</h1>
                    <p className="text-xs text-text-muted font-mono mt-1">{customer?.email}</p>
                  </div>
                </div>
              </div>
              <button
                onClick={handleRoleToggle}
                disabled={roleLoading}
                className={cn(
                  "flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider border transition-all",
                  roleLoading ? 'opacity-50' :
                  customer?.role === UserRole.ADMIN ? 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100' :
                  'bg-espresso/5 text-espresso border-espresso/10 hover:bg-espresso hover:text-white'
                )}
              >
                <Shield size={14} />
                {customer?.role === UserRole.ADMIN ? 'Demote to Customer' : 'Make Admin'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-4 bg-cream rounded-2xl">
                <Mail size={16} className="text-caramel shrink-0" />
                <div>
                  <p className="text-[10px] font-black text-text-muted uppercase tracking-wider">Email</p>
                  <p className="text-sm font-bold text-espresso">{customer?.email || '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-cream rounded-2xl">
                <Phone size={16} className="text-caramel shrink-0" />
                <div>
                  <p className="text-[10px] font-black text-text-muted uppercase tracking-wider">Phone</p>
                  <p className="text-sm font-bold text-espresso">{customer?.phone || '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-cream rounded-2xl">
                <MapPin size={16} className="text-caramel shrink-0" />
                <div>
                  <p className="text-[10px] font-black text-text-muted uppercase tracking-wider">Address</p>
                  <p className="text-sm font-bold text-espresso">{customer?.address || '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-cream rounded-2xl">
                <Calendar size={16} className="text-caramel shrink-0" />
                <div>
                  <p className="text-[10px] font-black text-text-muted uppercase tracking-wider">Joined</p>
                  <p className="text-sm font-bold text-espresso">{customer?.createdAt ? safeDate(customer.createdAt).toLocaleDateString() : '—'}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="px-4 py-2 bg-espresso/5 border border-espresso/10 rounded-full text-xs font-black uppercase text-espresso">
                {ROLE_LABELS[customer?.role || UserRole.CUSTOMER] || customer?.role}
              </span>
              <span className="px-4 py-2 bg-blue-50 border border-blue-100 rounded-full text-xs font-black uppercase text-blue-700">
                {customer?.emailVerified ? 'Email Verified' : 'Email Not Verified'}
              </span>
              {customer?.onboarded && (
                <span className="px-4 py-2 bg-green-50 border border-green-100 rounded-full text-xs font-black uppercase text-green-700">
                  Onboarded
                </span>
              )}
              {customer?.status && customer.status !== 'active' && (
                <span className="px-4 py-2 bg-red-50 border border-red-200 rounded-full text-xs font-black uppercase text-red-700">
                  {customer.status}
                </span>
              )}
            </div>
          </div>

          <div className="lg:col-span-1 space-y-4">
            <div className="bg-cream rounded-2xl p-6 text-center space-y-2">
              <Star size={24} className="text-caramel mx-auto" />
              <p className="text-[10px] font-black text-text-muted uppercase tracking-wider">Loyalty Points</p>
              <p className="text-4xl font-display font-black text-espresso">{customer?.loyaltyPoints || 0}</p>
            </div>
            <div className="bg-cream rounded-2xl p-6 text-center space-y-2">
              <ShoppingBag size={24} className="text-caramel mx-auto" />
              <p className="text-[10px] font-black text-text-muted uppercase tracking-wider">Total Orders</p>
              <p className="text-4xl font-display font-black text-espresso">{orders.length}</p>
            </div>
            <div className="bg-cream rounded-2xl p-6 text-center space-y-2">
              <CreditCard size={24} className="text-caramel mx-auto" />
              <p className="text-[10px] font-black text-text-muted uppercase tracking-wider">Total Spent</p>
              <p className="text-lg font-display font-black text-espresso">{formatPrice(customer?.totalSpent || 0)}</p>
            </div>
          </div>
        </div>

        {/* Saved Addresses */}
        {customer?.addresses && customer.addresses.length > 0 && (
          <div className="bg-white border border-border rounded-3xl p-8 space-y-4">
            <h2 className="text-lg font-display font-black text-espresso italic uppercase flex items-center gap-3">
              <MapPin size={20} className="text-caramel" /> Saved Addresses
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {customer.addresses.map((addr, i) => (
                <div key={addr.id || i} className="p-4 bg-cream rounded-2xl border border-border text-sm space-y-1">
                  {addr.name && <p className="font-bold text-espresso">{addr.name}</p>}
                  <p className="text-text-muted">{addr.street || addr.address}{addr.building ? `, Bldg ${addr.building}` : ''}{addr.floor ? `, Fl ${addr.floor}` : ''}</p>
                  <p className="text-text-muted">{[addr.city, addr.region, addr.country].filter(Boolean).join(', ')}</p>
                  {addr.isDefault && <span className="text-[10px] font-black text-caramel uppercase tracking-wider">Default</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active Orders */}
        <div className="bg-white border border-border rounded-3xl overflow-hidden">
          <div className="p-8 pb-0">
            <h2 className="text-lg font-display font-black text-espresso italic uppercase flex items-center gap-3">
              <Package size={20} className="text-caramel" /> Active Orders ({activeOrders.length})
            </h2>
          </div>
          {activeOrders.length === 0 ? (
            <div className="p-8 text-center">
              <Package className="mx-auto text-coffee-200 mb-3" size={32} />
              <p className="text-text-muted italic text-sm">No active orders</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border text-[10px] font-black uppercase tracking-widest text-text-muted">
                    <th className="py-4 px-8">Order ID</th>
                    <th className="py-4 px-8">Date</th>
                    <th className="py-4 px-8">Items</th>
                    <th className="py-4 px-8">Total</th>
                    <th className="py-4 px-8">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {activeOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-cream/30 transition-colors text-sm">
                      <td className="py-4 px-8 font-mono text-xs font-bold text-espresso">#{order.id.slice(-8).toUpperCase()}</td>
                      <td className="py-4 px-8 text-text-muted">{safeDate(order.createdAt).toLocaleDateString()}</td>
                      <td className="py-4 px-8">{order.items.length} items</td>
                      <td className="py-4 px-8 font-bold">{formatPrice(order.total)}</td>
                      <td className="py-4 px-8">
                        <span className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border w-fit">
                          <StatusIcon status={order.status} />
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Past Orders */}
        <div className="bg-white border border-border rounded-3xl overflow-hidden">
          <div className="p-8 pb-0">
            <h2 className="text-lg font-display font-black text-espresso italic uppercase flex items-center gap-3">
              <Clock size={20} className="text-caramel" /> Order History ({pastOrders.length})
            </h2>
          </div>
          {pastOrders.length === 0 ? (
            <div className="p-8 text-center">
              <Clock className="mx-auto text-coffee-200 mb-3" size={32} />
              <p className="text-text-muted italic text-sm">No past orders</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border text-[10px] font-black uppercase tracking-widest text-text-muted">
                    <th className="py-4 px-8">Order ID</th>
                    <th className="py-4 px-8">Date</th>
                    <th className="py-4 px-8">Items</th>
                    <th className="py-4 px-8">Total</th>
                    <th className="py-4 px-8">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {pastOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-cream/30 transition-colors text-sm">
                      <td className="py-4 px-8 font-mono text-xs font-bold text-espresso">#{order.id.slice(-8).toUpperCase()}</td>
                      <td className="py-4 px-8 text-text-muted">{safeDate(order.createdAt).toLocaleDateString()}</td>
                      <td className="py-4 px-8">{order.items.length} items</td>
                      <td className="py-4 px-8 font-bold">{formatPrice(order.total)}</td>
                      <td className="py-4 px-8">
                        <span className={cn(
                          "flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border w-fit",
                          order.status === 'delivered' ? 'bg-green-50 text-green-700 border-green-200' :
                          'bg-red-50 text-red-700 border-red-200'
                        )}>
                          <StatusIcon status={order.status} />
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Subscriptions */}
        {subscriptions.length > 0 && (
          <div className="bg-white border border-border rounded-3xl overflow-hidden">
            <div className="p-8 pb-0">
              <h2 className="text-lg font-display font-black text-espresso italic uppercase flex items-center gap-3">
                <ShoppingBag size={20} className="text-caramel" /> Subscriptions ({subscriptions.length})
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border text-[10px] font-black uppercase tracking-widest text-text-muted">
                    <th className="py-4 px-8">Plan</th>
                    <th className="py-4 px-8">Status</th>
                    <th className="py-4 px-8">Next Delivery</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {subscriptions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-cream/30 transition-colors text-sm">
                      <td className="py-4 px-8 font-bold text-espresso">{sub.planId}</td>
                      <td className="py-4 px-8">
                        <span className={cn(
                          "px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border",
                          sub.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' :
                          sub.status === 'paused' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          'bg-red-50 text-red-700 border-red-200'
                        )}>{sub.status}</span>
                      </td>
                      <td className="py-4 px-8 text-text-muted">{sub.nextDelivery || sub.startDate || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}