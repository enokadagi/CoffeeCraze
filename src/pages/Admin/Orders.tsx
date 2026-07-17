import React, { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, orderBy, query, updateDoc, doc, limit, startAfter, getCountFromServer, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Order } from '../../types';
import { formatPrice, formatLbpNumeric, safeDate, cn } from '../../lib/utils';
import { ShoppingBag, ChevronLeft, ChevronRight, Truck, Package, CheckCircle, Clock, Search, Filter, XCircle, X, User, MapPin, Phone, Mail, FileText, Printer } from 'lucide-react';
import { toast } from 'sonner';
import SEO from '../../components/common/SEO';
import ImageWithFallback from '../../components/common/ImageWithFallback';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { logAdminAction } from '../../utils/auditLog';

const PAGE_SIZE = 20;

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-600 border-yellow-100 shadow-yellow-500/5',
  confirmed: 'bg-blue-50 text-blue-600 border-blue-100 shadow-blue-500/5',
  processing: 'bg-indigo-50 text-indigo-600 border-indigo-100 shadow-indigo-500/5',
  shipped: 'bg-purple-50 text-purple-600 border-purple-100 shadow-purple-500/5',
  delivered: 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-emerald-500/5',
  cancelled: 'bg-red-50 text-red-600 border-red-100 shadow-red-500/5',
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  pending: <Clock size={12} />,
  confirmed: <CheckCircle size={12} />,
  processing: <Package size={12} />,
  shipped: <Truck size={12} />,
  delivered: <CheckCircle size={12} />,
  cancelled: <XCircle size={12} />,
};

const StatusBadge = ({ status }: { status: string }) => {
  return (
    <span className={cn(
      "px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.4em] border flex items-center gap-3 w-fit italic transition-all duration-700",
      STATUS_STYLES[status] || ''
    )}>
      {STATUS_ICONS[status]}
      {status}
    </span>
  );
};

export default function AdminOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [firstDoc, setFirstDoc] = useState<any>(null);
  const [pageStack, setPageStack] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [drivers, setDrivers] = useState<{ id: string; displayName: string; email: string }[]>([]);
  const [driverAssigning, setDriverAssigning] = useState(false);

  // Fetch available drivers once on mount
  useEffect(() => {
    const loadDrivers = async () => {
      try {
        const snap = await getDocs(query(collection(db, 'users'), where('role', '==', 'driver')));
        setDrivers(snap.docs.map(d => ({ id: d.id, displayName: d.data().displayName || 'Driver', email: d.data().email || '' })));
      } catch { /* non-critical */ }
    };
    loadDrivers();
  }, []);

  const fetchOrders = useCallback(async (direction: 'next' | 'prev' | 'init' = 'init') => {
    setLoading(true);
    try {
      if (direction === 'init') {
        const countSnap = await getCountFromServer(collection(db, 'orders'));
        setTotalCount(countSnap.data().count);
      }

      let q;
      if (direction === 'next' && lastDoc) {
        q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), startAfter(lastDoc), limit(PAGE_SIZE));
      } else if (direction === 'prev' && pageStack.length > 0) {
        const prevCursor = pageStack[pageStack.length - 1];
        q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), startAfter(prevCursor), limit(PAGE_SIZE));
      } else {
        q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(PAGE_SIZE));
      }

      const snap = await getDocs(q);
      const docs = snap.docs;
      setOrders(docs.map(d => {
        const data = d.data() as any;
        // Safely convert Firestore Timestamps to ISO strings
        const createdAt = data.createdAt;
        const safeCreatedAt = (createdAt && typeof createdAt.toDate === 'function')
          ? createdAt.toDate().toISOString()
          : (typeof createdAt === 'string' ? createdAt : new Date().toISOString());
        return { id: d.id, ...data, createdAt: safeCreatedAt } as Order;
      }));

      if (docs.length > 0) {
        if (direction === 'next') {
          setPageStack(prev => [...prev, lastDoc]);
        } else if (direction === 'prev' && pageStack.length > 0) {
          setPageStack(prev => prev.slice(0, -1));
        }
        setFirstDoc(docs[0]);
        setLastDoc(docs[docs.length - 1]);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  }, [lastDoc, pageStack]);

  useEffect(() => {
    fetchOrders('init');
  }, []);

  const handleStatusChange = async (id: string, newStatus: Order['status']) => {
    try {
      const oldStatus = orders.find(o => o.id === id)?.status;
      await updateDoc(doc(db, 'orders', id), { status: newStatus, updatedAt: new Date().toISOString() });
      setOrders(orders.map(o => o.id === id ? { ...o, status: newStatus } : o));
      logAdminAction(user?.uid || '', user?.email || '', 'update_order_status', 'orders', id, { from: oldStatus, to: newStatus });
      toast.success(`Order status updated to ${newStatus}`);
    } catch (err) {
      toast.error("Failed to update order status");
    }
  };

  const handleDriverAssign = async (orderId: string, driverId: string) => {
    if (!driverId) return;
    setDriverAssigning(true);
    try {
      const driver = drivers.find(d => d.id === driverId);
      await updateDoc(doc(db, 'orders', orderId), {
        driverId,
        driverName: driver?.displayName || '',
        updatedAt: new Date().toISOString(),
      });
      setOrders(orders.map(o => o.id === orderId ? { ...o, driverId, driverName: driver?.displayName || '' } as any : o));
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, driverId, driverName: driver?.displayName || '' } as any : prev);
      }
      logAdminAction(user?.uid || '', user?.email || '', 'assign_driver', 'orders', orderId, { driverId, driverName: driver?.displayName });
      toast.success(`Driver ${driver?.displayName} assigned`);
    } catch (err) {
      toast.error('Failed to assign driver');
    } finally {
      setDriverAssigning(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-16 relative">
        <SEO title="Orders" description="Manage and fulfill CoffeeCraze customer orders." />
        <header className="flex flex-col md:flex-row items-start md:items-end justify-between gap-10 border-b border-border-light pb-16">
          <div className="space-y-4">
            <span className="text-caption text-gold-500 italic">Fulfillment Matrix</span>
            <h1 className="text-7xl font-display font-black text-text tracking-tightest leading-none italic uppercase">Order <br/><span className="not-italic text-text-muted">Logistics.</span></h1>
            <p className="text-xl text-text-muted font-serif italic">Operational control of all active <span className="text-text font-black not-italic uppercase">sensory extractions</span>.</p>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <div className="px-8 py-5 bg-white shadow-premium rounded-[2rem] flex items-center gap-6 border border-border-light">
              <ShoppingBag size={18} className="text-caramel" />
              <span className="text-[11px] font-black text-text uppercase tracking-[0.4em] italic leading-none">Total Orders: {orders.length}</span>
            </div>
          </div>
        </header>

        <div className="bg-white border border-border-light rounded-[4rem] overflow-hidden shadow-premium-lg relative group">
          <div className="mesh-gradient absolute inset-0 opacity-[0.02] pointer-events-none transition-opacity duration-1000 group-hover:opacity-[0.05]" />
          <div className="overflow-x-auto relative z-10">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-coffee-950/5 border-b border-border-light font-display italic">
                  <th className="px-10 py-8 text-[11px] font-black text-text-muted uppercase tracking-[0.4em]">Order ID</th>
                  <th className="px-10 py-8 text-[11px] font-black text-text-muted uppercase tracking-[0.4em]">Customer</th>
                  <th className="px-10 py-8 text-[11px] font-black text-text-muted uppercase tracking-[0.4em]">Delivery Window</th>
                  <th className="px-10 py-8 text-[11px] font-black text-text-muted uppercase tracking-[0.4em]">Items</th>
                  <th className="px-10 py-8 text-[11px] font-black text-text-muted uppercase tracking-[0.4em]">Total</th>
                  <th className="px-10 py-8 text-[11px] font-black text-text-muted uppercase tracking-[0.4em]">Status</th>
                  <th className="px-10 py-8 text-[11px] font-black text-text-muted uppercase tracking-[0.4em]">Payment</th>
                  <th className="px-10 py-8 text-[11px] font-black text-text-muted uppercase tracking-[0.4em] text-right">Update Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-coffee-50">
                {loading ? (
                  Array(6).fill(0).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={8} className="px-10 py-12 h-24 bg-white/50" />
                    </tr>
                  ))
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-10 py-16 text-center">
                      <p className="text-text-muted italic text-lg">No orders yet.</p>
                    </td>
                  </tr>
                ) : orders.map((order) => (
                  <tr key={order.id} className="hover:bg-cream/30 transition-all duration-700 group/row cursor-pointer" onClick={() => setSelectedOrder(order)}>
                    <td className="px-10 py-8">
                      <p className="font-display font-black text-text italic text-xl leading-none uppercase tracking-tight">#{order.id.slice(-8).toUpperCase()}</p>
                      <p className="text-[10px] font-black text-text-muted tracking-[0.4em] uppercase mt-2 italic leading-none">{safeDate(order.createdAt).toLocaleDateString()}</p>
                    </td>
                    <td className="px-10 py-8">
                      <p className="font-display font-black text-text italic text-lg leading-none uppercase">{order.shippingAddress?.name}</p>
                      <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.4em] italic mt-2">{order.shippingAddress?.city || '—'}</p>
                    </td>
                    <td className="px-10 py-8">
                      <p className="font-display font-black text-caramel italic text-lg leading-none uppercase">{order.deliveryDate || 'ASAP'}</p>
                      <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.4em] italic mt-2">{order.deliveryTime || 'Standard'}</p>
                    </td>
                    <td className="px-10 py-8">
                      <p className="text-[11px] font-black text-text-muted uppercase tracking-[0.4em] italic leading-none">{order.items.length} Sensory_Units</p>
                    </td>
                    <td className="px-10 py-8 font-display font-black text-text italic text-2xl tracking-tighter uppercase whitespace-nowrap">
                       LBP {formatLbpNumeric(order.total)} <span className="text-[10px] font-black italic text-text-muted">LBP</span>
                    </td>
                    <td className="px-10 py-8"><StatusBadge status={order.status} /></td>
                    <td className="px-10 py-8">
                       <span className={cn(
                         "px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest italic border",
                         order.paymentStatus === 'paid' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-600 border-amber-100"
                       )}>
                         {order.paymentStatus || 'pending'}
                       </span>
                    </td>
                    <td className="px-10 py-8 text-right">
                      <select 
                        className="px-6 py-3 bg-white border border-border rounded-2xl text-[10px] font-black text-text uppercase tracking-[0.3em] italic focus:ring-0 focus:border-gold-500 outline-none transition-all duration-700 shadow-premium group-hover/row:bg-cream appearance-none cursor-pointer text-center"
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value as any)}
                      >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {!loading && totalCount > 0 && (
          <div className="flex items-center justify-between px-4 py-4 bg-white border border-border-light rounded-[2rem] shadow-premium">
            <p className="text-[11px] font-black text-text-muted uppercase tracking-[0.3em] italic">
              {totalCount} Orders — Page {pageStack.length + 1}
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => { setPage(p => p - 1); fetchOrders('prev'); }}
                disabled={pageStack.length === 0}
                className="p-3 bg-cream text-text-secondary rounded-xl hover:bg-cream transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs font-black text-text italic">
                {pageStack.length + 1} / {Math.max(1, Math.ceil(totalCount / PAGE_SIZE))}
              </span>
              <button
                onClick={() => { setPage(p => p + 1); fetchOrders('next'); }}
                disabled={orders.length < PAGE_SIZE}
                className="p-3 bg-cream text-text-secondary rounded-xl hover:bg-cream transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-espresso/60 backdrop-blur-sm" onClick={() => setSelectedOrder(null)} />
          <div className="bg-white rounded-[2rem] w-full max-w-3xl relative z-10 max-h-[90vh] overflow-y-auto shadow-premium-xl border border-espresso/10">
            <div className="p-6 sm:p-8 border-b border-border-light flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-xl">
              <div>
                <h2 className="text-2xl font-display font-black uppercase tracking-tight text-espresso">Order #{selectedOrder.id.slice(-8).toUpperCase()}</h2>
                <p className="text-xs text-text-muted font-medium mt-1">Created {safeDate(selectedOrder.createdAt).toLocaleString()}</p>
              </div>
              <button aria-label="Close" onClick={() => setSelectedOrder(null)} className="p-3 bg-cream text-espresso rounded-full hover:bg-espresso hover:text-cream transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 sm:p-8 space-y-8">
              {/* Customer Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-cream rounded-2xl p-6 space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-text-muted flex items-center gap-2">
                    <User size={14} /> Customer
                  </h3>
                  <div className="space-y-3">
                    <p className="font-bold text-espresso text-lg">{selectedOrder.shippingAddress?.name || 'N/A'}</p>
                    <p className="text-sm text-text-secondary flex items-center gap-2">
                      <Mail size={14} className="text-text-muted" /> {selectedOrder.shippingAddress?.email || 'N/A'}
                    </p>
                    <p className="text-sm text-text-secondary flex items-center gap-2">
                      <Phone size={14} className="text-text-muted" /> {selectedOrder.shippingAddress?.phone || 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="bg-cream rounded-2xl p-6 space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-text-muted flex items-center gap-2">
                    <MapPin size={14} /> Delivery Address
                  </h3>
                  <div className="space-y-2 text-sm text-text-secondary">
                    {selectedOrder.shippingAddress?.address && <p>{selectedOrder.shippingAddress.address}</p>}
                    {selectedOrder.shippingAddress?.street && <p>{selectedOrder.shippingAddress.street}</p>}
                    <p>
                      {[selectedOrder.shippingAddress?.city, selectedOrder.shippingAddress?.region, selectedOrder.shippingAddress?.country].filter(Boolean).join(', ')}
                    </p>
                    {selectedOrder.shippingAddress?.building && <p>Building: {selectedOrder.shippingAddress.building}</p>}
                    {selectedOrder.shippingAddress?.apartment && <p>Apt: {selectedOrder.shippingAddress.apartment}</p>}
                    {selectedOrder.gateCode && <p className="font-mono text-caramel">Gate Code: {selectedOrder.gateCode}</p>}
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="bg-cream rounded-2xl p-6 space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-text-muted flex items-center gap-2">
                  <Package size={14} /> Items ({selectedOrder.items.length})
                </h3>
                <div className="divide-y divide-border-light">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                      <div className="flex items-center gap-4">
                        {item.image && (
                          <ImageWithFallback src={item.image} alt={item.name} className="w-12 h-12 rounded-xl object-cover bg-white" />
                        )}
                        <div>
                          <p className="font-bold text-espresso text-sm">{item.name}</p>
                          <p className="text-xs text-text-muted">Qty: {item.quantity}</p>
                        </div>
                      </div>
                      <p className="font-bold text-espresso">{formatPrice(item.price * item.quantity)}</p>
                    </div>
                  ))}
                </div>
                <div className="border-t border-border-light pt-4 flex justify-between items-center">
                  <p className="font-bold text-text-muted uppercase text-xs tracking-wider">Total</p>
                  <p className="font-black text-espresso text-xl">{formatPrice(selectedOrder.total)}</p>
                </div>
              </div>

              {/* Status & Timeline */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-cream rounded-2xl p-6 space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-text-muted flex items-center gap-2">
                    <Clock size={14} /> Status
                  </h3>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={selectedOrder.status} />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest italic border",
                      selectedOrder.paymentStatus === 'paid' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-600 border-amber-100"
                    )}>
                      Payment: {selectedOrder.paymentStatus}
                    </span>
                    {selectedOrder.trackingId && (
                      <span className="text-xs text-text-muted flex items-center gap-1">
                        <Truck size={12} /> Track: {selectedOrder.trackingId}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {['pending', 'confirmed', 'processing', 'shipped', 'delivered'].map((step, i) => {
                      const statusOrder = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
                      const currentIdx = statusOrder.indexOf(selectedOrder.status);
                      const stepIdx = statusOrder.indexOf(step);
                      const isComplete = stepIdx <= currentIdx;
                      return (
                        <div key={step} className={cn(
                          "px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider border transition-all",
                          isComplete ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-white text-text-muted border-border-light"
                        )}>
                          {step}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-cream rounded-2xl p-6 space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-text-muted flex items-center gap-2">
                    <FileText size={14} /> Actions
                  </h3>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-wider">Update Status</label>
                    <select
                      className="w-full px-4 py-3 bg-white border border-border rounded-xl text-xs font-bold text-text uppercase tracking-wider focus:ring-2 focus:ring-caramel/20 focus:border-caramel outline-none"
                      value={selectedOrder.status}
                      onChange={(e) => {
                        const newStatus = e.target.value as Order['status'];
                        handleStatusChange(selectedOrder.id, newStatus);
                        setSelectedOrder({ ...selectedOrder, status: newStatus });
                      }}
                    >
                       <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    {drivers.length > 0 && (
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-text-muted uppercase tracking-wider">Assign Driver</label>
                        <select
                          className="w-full px-4 py-3 bg-white border border-border rounded-xl text-xs font-bold text-text focus:ring-2 focus:ring-caramel/20 focus:border-caramel outline-none"
                          value={(selectedOrder as any).driverId || ''}
                          onChange={(e) => handleDriverAssign(selectedOrder.id, e.target.value)}
                          disabled={driverAssigning}
                        >
                          <option value="">— No driver assigned —</option>
                          {drivers.map(d => (
                            <option key={d.id} value={d.id}>{d.displayName} ({d.email})</option>
                          ))}
                        </select>
                        {(selectedOrder as any).driverName && (
                          <p className="text-[10px] text-emerald-600 font-bold mt-1">✓ Assigned: {(selectedOrder as any).driverName}</p>
                        )}
                      </div>
                    )}
                    <button
                      onClick={() => window.print()}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-espresso text-cream rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-espresso/90 transition-colors"
                    >
                      <Printer size={14} /> Print Invoice
                    </button>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedOrder.customNotes && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
                  <h3 className="text-xs font-black uppercase tracking-widest text-amber-700 mb-2">Customer Notes</h3>
                  <p className="text-sm text-amber-800">{selectedOrder.customNotes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
