import { useState, useEffect } from 'react';
import { collection, getDocs, orderBy, query, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Order } from '../../types';
import { formatPrice, cn } from '../../lib/utils';
import { ShoppingBag, ChevronRight, Truck, Package, CheckCircle, Clock, Search, Filter, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import SEO from '../../components/common/SEO';
import DashboardLayout from '../../components/layout/DashboardLayout';

const StatusBadge = ({ status }: { status: Order['status'] }) => {
  const styles = {
    pending: 'bg-yellow-50 text-yellow-600 border-yellow-100 shadow-yellow-500/5',
    confirmed: 'bg-blue-50 text-blue-600 border-blue-100 shadow-blue-500/5',
    shipped: 'bg-purple-50 text-purple-600 border-purple-100 shadow-purple-500/5',
    delivered: 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-emerald-500/5',
    cancelled: 'bg-red-50 text-red-600 border-red-100 shadow-red-500/5',
  };

  const icons = {
    pending: <Clock size={12} />,
    confirmed: <CheckCircle size={12} />,
    shipped: <Truck size={12} />,
    delivered: <CheckCircle size={12} />,
    cancelled: <XCircle size={12} />,
  };

  return (
    <span className={cn(
      "px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.4em] border flex items-center gap-3 w-fit italic transition-all duration-700",
      styles[status]
    )}>
      {icons[status]}
      {status}_LOG
    </span>
  );
};

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    setOrders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
    setLoading(false);
  };

  const handleStatusChange = async (id: string, newStatus: Order['status']) => {
    try {
      await updateDoc(doc(db, 'orders', id), { status: newStatus });
      setOrders(orders.map(o => o.id === id ? { ...o, status: newStatus } : o));
      toast.success(`Protocol updated to ${newStatus}`);
    } catch (err) {
      toast.error("Protocol update failed");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-16 relative">
        <SEO title="Orders" description="Manage and fulfill CoffeeCraze customer orders." />
        <header className="flex flex-col md:flex-row items-start md:items-end justify-between gap-10 border-b border-coffee-50 pb-16">
          <div className="space-y-4">
            <span className="stat-label text-gold-500 italic">Fulfillment Matrix</span>
            <h1 className="text-7xl font-display font-black text-coffee-950 tracking-tightest leading-none italic uppercase">Order <br/><span className="not-italic text-coffee-400">Logistics.</span></h1>
            <p className="text-xl text-coffee-400 font-serif italic">Operational control of all active <span className="text-coffee-950 font-black not-italic uppercase">sensory extractions</span>.</p>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <div className="px-8 py-5 bg-white shadow-premium rounded-[2rem] flex items-center gap-6 border border-coffee-50">
              <ShoppingBag size={18} className="text-gold-500" />
              <span className="text-[11px] font-black text-coffee-950 uppercase tracking-[0.4em] italic leading-none">Logs_Count: {orders.length}</span>
            </div>
          </div>
        </header>

        <div className="bg-white border border-coffee-50 rounded-[4rem] overflow-hidden shadow-premium-lg relative group">
          <div className="mesh-gradient absolute inset-0 opacity-[0.02] pointer-events-none transition-opacity duration-1000 group-hover:opacity-[0.05]" />
          <div className="overflow-x-auto relative z-10">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-coffee-950/5 border-b border-coffee-50 font-display italic">
                  <th className="px-10 py-8 text-[11px] font-black text-coffee-400 uppercase tracking-[0.4em]">Log_Identity</th>
                  <th className="px-10 py-8 text-[11px] font-black text-coffee-400 uppercase tracking-[0.4em]">Ritualist_Node</th>
                  <th className="px-10 py-8 text-[11px] font-black text-coffee-400 uppercase tracking-[0.4em]">Extraction_Window</th>
                  <th className="px-10 py-8 text-[11px] font-black text-coffee-400 uppercase tracking-[0.4em]">Items_Manifest</th>
                  <th className="px-10 py-8 text-[11px] font-black text-coffee-400 uppercase tracking-[0.4em]">Extract_Value</th>
                  <th className="px-10 py-8 text-[11px] font-black text-coffee-400 uppercase tracking-[0.4em]">Protocol_Status</th>
                  <th className="px-10 py-8 text-[11px] font-black text-coffee-400 uppercase tracking-[0.4em]">Payment_Gate</th>
                  <th className="px-10 py-8 text-[11px] font-black text-coffee-400 uppercase tracking-[0.4em] text-right">Modulate_Node</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-coffee-50">
                {loading ? (
                  Array(6).fill(0).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={6} className="px-10 py-12 h-24 bg-white/50" />
                    </tr>
                  ))
                ) : orders.map((order) => (
                  <tr key={order.id} className="hover:bg-coffee-50/30 transition-all duration-700 group/row">
                    <td className="px-10 py-8">
                      <p className="font-display font-black text-coffee-950 italic text-xl leading-none uppercase tracking-tight">#{order.id.slice(-8).toUpperCase()}_LOG</p>
                      <p className="text-[10px] font-black text-coffee-300 tracking-[0.4em] uppercase mt-2 italic leading-none">{new Date(order.createdAt).toLocaleDateString()}_TIMESTAMP</p>
                    </td>
                    <td className="px-10 py-8">
                      <p className="font-display font-black text-coffee-950 italic text-lg leading-none uppercase">{order.shippingAddress?.name}</p>
                      <p className="text-[10px] font-black text-coffee-400 uppercase tracking-[0.4em] italic mt-2">{order.shippingAddress?.city}_LOC</p>
                    </td>
                    <td className="px-10 py-8">
                      <p className="font-display font-black text-gold-500 italic text-lg leading-none uppercase">{order.deliveryDate || 'ASAP'}</p>
                      <p className="text-[10px] font-black text-coffee-300 uppercase tracking-[0.4em] italic mt-2">{order.deliveryTime || 'STANDARD_SHIFT'}</p>
                    </td>
                    <td className="px-10 py-8">
                      <p className="text-[11px] font-black text-coffee-400 uppercase tracking-[0.4em] italic leading-none">{order.items.length} Sensory_Units</p>
                    </td>
                    <td className="px-10 py-8 font-display font-black text-coffee-950 italic text-2xl tracking-tighter uppercase whitespace-nowrap">
                       {formatPrice(order.total).split('LBP')[1]} <span className="text-[10px] font-black italic text-coffee-300">LBP_VAL</span>
                    </td>
                    <td className="px-10 py-8"><StatusBadge status={order.status} /></td>
                    <td className="px-10 py-8">
                       <span className={cn(
                         "px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest italic border",
                         order.paymentStatus === 'paid' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-600 border-amber-100"
                       )}>
                         {order.paymentStatus || 'PENDING'}_TX
                       </span>
                    </td>
                    <td className="px-10 py-8 text-right">
                      <select 
                        className="px-6 py-3 bg-white border border-coffee-100 rounded-2xl text-[10px] font-black text-coffee-950 uppercase tracking-[0.3em] italic focus:ring-0 focus:border-gold-500 outline-none transition-all duration-700 shadow-premium group-hover/row:bg-coffee-50 appearance-none cursor-pointer text-center"
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value as any)}
                      >
                         <option value="pending">PENDING_STATUS</option>
                         <option value="confirmed">CONFIRMED_STATUS</option>
                         <option value="shipped">SHIPPED_STATUS</option>
                         <option value="delivered">DELIVERED_STATUS</option>
                         <option value="cancelled">CANCELLED_STATUS</option>
                      </select>
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
