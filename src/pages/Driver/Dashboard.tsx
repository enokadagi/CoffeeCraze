import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { OrderService } from '../../services/firestore';
import { Order, OrderStatus, PaymentStatus } from '../../types';
import { toast } from 'sonner';
import { MapPin, Phone, Navigation, Package, CheckCircle, LogOut, Coffee } from 'lucide-react';
import SEO from '../../components/common/SEO';
import { formatLBP } from '../../utils/exchange';
import { cn } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';

export default function DriverDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const unsub = OrderService.subscribeToDriverOrders(user.uid, (data) => {
      setOrders(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      setLoading(false);
    }, () => {
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  const handleMarkDelivered = async (orderId: string) => {
    if (!window.confirm('Mark this order as delivered and collect cash payment?')) return;

    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status: OrderStatus.DELIVERED,
        paymentStatus: PaymentStatus.PAID,
        deliveredAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      toast.success('Order successfully marked as delivered! Cash collected.');
    } catch (err) {
      console.error('Failed to update order status:', err);
      toast.error('Failed to update delivery status');
    }
  };

  const handleLogout = async () => {
    await logout();
    toast.success('Signed out');
    navigate('/auth');
  };

  const pendingDeliveries = orders.filter(o => o.status !== OrderStatus.DELIVERED && o.status !== OrderStatus.CANCELLED);
  const completedDeliveries = orders.filter(o => o.status === OrderStatus.DELIVERED);

  const getAddressString = (addr: any) => {
    if (!addr) return '';
    return `${addr.street || ''}, ${addr.building ? `Bldg ${addr.building}` : ''}, ${addr.floor ? `Floor ${addr.floor}` : ''}, ${addr.city || ''}, Lebanon`;
  };

  const handleNavigate = (order: Order) => {
    const coords = order.shippingAddress.gpsCoordinates;
    let url = '';
    if (coords && coords.lat && coords.lng) {
      url = `https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`;
    } else {
      const queryStr = getAddressString(order.shippingAddress);
      url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(queryStr)}`;
    }
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-cream pb-12">
      <SEO title="Driver Dashboard" description="Driver dispatch portal" />
      
      {/* Mobile Top Header */}
      <header className="bg-espresso text-white sticky top-0 z-40 px-6 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-caramel rounded-xl flex items-center justify-center text-espresso">
            <Coffee size={20} />
          </div>
          <div>
            <h1 className="text-base font-display font-black tracking-tight uppercase leading-none">CC Dispatch</h1>
            <p className="text-[10px] text-caramel uppercase font-semibold tracking-wider mt-1">Driver Console</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
          aria-label="Logout"
        >
          <LogOut size={18} />
        </button>
      </header>

      <div className="max-w-md mx-auto px-4 mt-6 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex bg-white p-1 rounded-2xl border border-border">
          <button
            onClick={() => setActiveTab('pending')}
            className={cn(
              'flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all',
              activeTab === 'pending'
                ? 'bg-espresso text-white shadow-sm'
                : 'text-text-secondary hover:text-espresso'
            )}
          >
            Assigned ({pendingDeliveries.length})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={cn(
              'flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all',
              activeTab === 'completed'
                ? 'bg-espresso text-white shadow-sm'
                : 'text-text-secondary hover:text-espresso'
            )}
          >
            Completed ({completedDeliveries.length})
          </button>
        </div>

        {/* Deliveries List */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-44 bg-white rounded-2xl border border-border animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {(activeTab === 'pending' ? pendingDeliveries : completedDeliveries).length === 0 ? (
              <div className="text-center py-16 bg-white border border-border rounded-3xl p-6">
                <Package className="mx-auto text-coffee-200 mb-4" size={48} />
                <p className="text-text-muted italic text-sm">No assigned orders in this category</p>
              </div>
            ) : (
              (activeTab === 'pending' ? pendingDeliveries : completedDeliveries).map(order => (
                <div
                  key={order.id}
                  className="bg-white border border-border rounded-3xl p-5 shadow-sm space-y-4 hover:shadow-md transition-shadow"
                >
                  {/* Title Bar */}
                  <div className="flex items-start justify-between gap-4 border-b border-border pb-3">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-caramel">Order Identifier</span>
                      <h2 className="font-bold text-espresso text-base">#{order.id.slice(-8).toUpperCase()}</h2>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Total Due</span>
                      <p className="font-black text-espresso text-base italic">{formatLBP(order.totalLbp ?? order.total)}</p>
                    </div>
                  </div>

                  {/* Customer Information */}
                  <div className="space-y-3 text-sm">
                    {/* Name */}
                    <div>
                      <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">Customer</span>
                      <span className="font-bold text-espresso">{order.shippingAddress.fullName || order.shippingAddress.name}</span>
                    </div>

                    {/* Phone */}
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">Phone Number</span>
                        <a
                          href={`tel:${order.shippingAddress.phone || order.shippingAddress.phoneNumber}`}
                          className="font-bold text-caramel hover:underline"
                        >
                          {order.shippingAddress.phone || order.shippingAddress.phoneNumber || 'N/A'}
                        </a>
                      </div>
                      <a
                        href={`tel:${order.shippingAddress.phone || order.shippingAddress.phoneNumber}`}
                        className="p-2.5 bg-cream hover:bg-caramel/10 text-caramel rounded-xl transition-colors border border-border"
                        aria-label="Call Customer"
                      >
                        <Phone size={16} />
                      </a>
                    </div>

                    {/* Address details */}
                    <div>
                      <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">Address</span>
                      <span className="font-semibold text-espresso">{getAddressString(order.shippingAddress)}</span>
                    </div>

                    {/* Delivery Notes */}
                    {order.customNotes && (
                      <div className="p-3 bg-cream/50 border border-border rounded-xl">
                        <span className="text-[9px] font-black text-text-muted uppercase tracking-widest block mb-0.5">Delivery Notes</span>
                        <span className="text-xs text-text-secondary leading-relaxed">{order.customNotes}</span>
                      </div>
                    )}

                    {/* Delivery Window */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Schedule:</span>
                      <span className="text-xs font-bold text-espresso">{order.deliveryDate} ({order.deliveryTime})</span>
                    </div>

                    {/* GPS Status */}
                    <div className="flex items-center justify-between gap-3 pt-1">
                      <div className="flex items-center gap-1.5">
                        <div className={cn(
                          "w-2.5 h-2.5 rounded-full",
                          order.shippingAddress.gpsCoordinates ? "bg-green-500 animate-pulse" : "bg-gray-300"
                        )} />
                        <span className="text-xs font-semibold text-text-secondary">
                          {order.shippingAddress.gpsCoordinates ? "Live GPS Coordinates Pinned" : "No GPS Pin"}
                        </span>
                      </div>

                      <button
                        onClick={() => handleNavigate(order)}
                        className="flex items-center gap-1.5 px-4 py-2 border border-border hover:border-caramel hover:bg-caramel/5 text-caramel rounded-xl text-xs font-bold transition-all"
                      >
                        <Navigation size={14} /> Route
                      </button>
                    </div>

                    {/* Order Items Details Section */}
                    {order.items && order.items.length > 0 && (
                      <details className="group/details border border-border rounded-xl bg-cream/20">
                        <summary className="flex items-center justify-between p-3 text-xs font-bold text-espresso cursor-pointer hover:bg-cream/40 transition-colors list-none">
                          <span className="flex items-center gap-1.5">
                            <Package size={14} className="text-caramel" />
                            Package Contents ({order.items.reduce((acc, item) => acc + item.quantity, 0)})
                          </span>
                          <span className="text-[10px] text-caramel uppercase group-open/details:hidden">Show</span>
                          <span className="text-[10px] text-text-muted uppercase hidden group-open/details:inline">Hide</span>
                        </summary>
                        <div className="p-3 border-t border-border space-y-2 max-h-48 overflow-y-auto">
                          {order.items.map((item, index) => (
                            <div key={index} className="flex items-center justify-between text-xs gap-3">
                              <div className="min-w-0 flex-1">
                                <span className="font-bold text-espresso block truncate">{item.name}</span>
                                {item.sku && <span className="text-[9px] text-text-muted font-mono">{item.sku}</span>}
                              </div>
                              <span className="px-2 py-0.5 bg-espresso text-white rounded font-mono text-[10px] font-black">
                                x{item.quantity}
                              </span>
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>

                  {/* Action button */}
                  {activeTab === 'pending' && (
                    <button
                      onClick={() => handleMarkDelivered(order.id)}
                      className="w-full py-3.5 bg-espresso hover:bg-caramel text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
                    >
                      <CheckCircle size={16} /> Mark as Delivered
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
