import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { OrderService } from '../../services/firestore';
import { Order } from '../../types';
import { formatPrice, cn } from '../../lib/utils';
import { ShoppingBag, Search, ChevronRight, Package, Truck, CheckCircle, Clock, X, MapPin, ArrowUpDown, Filter, Calendar, ChevronLeft, CreditCard, XCircle, ArrowRight } from 'lucide-react';
import SEO from '../../components/common/SEO';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import ReferralSystem from '../../components/dashboard/ReferralSystem';

const StatusIcon = ({ status }: { status: Order['status'] }) => {
  switch (status) {
    case 'pending': return <Clock size={16} className="text-yellow-500" />;
    case 'confirmed': return <Package size={16} className="text-blue-500" />;
    case 'shipped': return <Truck size={16} className="text-purple-500" />;
    case 'delivered': return <CheckCircle size={16} className="text-green-500" />;
    case 'cancelled': return <XCircle size={16} className="text-red-500" />;
    default: return <Clock size={16} className="text-gray-400" />;
  }
};

export default function MyOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // Sorting, Filtering, and Pagination state
  const [sortField, setSortField] = useState<'createdAt' | 'total'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    if (user) {
      OrderService.getByUserId(user.uid).then(data => {
        setOrders(data);
        setLoading(false);
      });
    }
  }, [user]);

  const filteredAndSortedOrders = orders
    .filter(order => {
      if (!dateRange.start && !dateRange.end) return true;
      const orderDate = new Date(order.createdAt);
      if (dateRange.start && orderDate < new Date(dateRange.start)) return false;
      if (dateRange.end) {
        const endDate = new Date(dateRange.end);
        endDate.setHours(23, 59, 59, 999);
        if (orderDate > endDate) return false;
      }
      return true;
    })
    .sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortOrder === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });

  const totalPages = Math.ceil(filteredAndSortedOrders.length / itemsPerPage);
  const paginatedOrders = filteredAndSortedOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const toggleSort = (field: 'createdAt' | 'total') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  const getTrackingSteps = (status: Order['status']) => {
    const steps = [
      { label: 'Order Placed', date: 'Oct 24, 10:00 AM', status: 'completed' },
      { label: 'Processing', date: 'Oct 24, 02:30 PM', status: status === 'pending' ? 'current' : 'completed' },
      { label: 'Quality Extraction', date: 'Oct 25, 09:15 AM', status: status === 'confirmed' ? 'current' : (['shipped', 'delivered'].includes(status) ? 'completed' : 'pending') },
      { label: 'In Transit', date: 'Oct 26, 11:00 AM', status: status === 'shipped' ? 'current' : (status === 'delivered' ? 'completed' : 'pending') },
      { label: 'Delivered', date: 'Oct 27, 04:45 PM', status: status === 'delivered' ? 'current' : 'pending' },
    ];
    return steps;
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 md:space-y-16 relative">
        <SEO title="My Orders" description="View and track your CoffeeCraze ritual orders." />
        <header className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 md:gap-10 border-b border-white pb-8 md:pb-16">
          <div className="space-y-4">
            <span className="stat-label text-caramel italic">Extraction Archive</span>
            <h1 className="text-fluid-hero font-display font-black text-espresso tracking-tightest leading-none italic uppercase">Ritual <br/><span className="not-italic text-coffee-400">Vault.</span></h1>
            <p className="text-fluid-body text-coffee-400 font-serif italic">Total of <span className="text-espresso font-black not-italic uppercase">{orders.length}</span> recorded protocols in your sensory ledger.</p>
          </div>

          <div className="flex flex-wrap items-center gap-8">
            <div className="px-6 md:px-10 py-4 md:py-6 bg-white/40 backdrop-blur-xl rounded-[2.5rem] flex items-center gap-4 md:gap-6 border border-white/60 shadow-premium group hover:bg-white/60 transition-all duration-1000">
              <div className="w-12 h-12 bg-espresso text-caramel-gold rounded-2xl flex items-center justify-center shadow-premium group-hover:rotate-12 transition-transform duration-700">
                <ShoppingBag size={18} className="fill-current" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-coffee-300 italic mb-1">Total Extraction Cycle</p>
                <p className="text-fluid-title font-display font-black text-espresso italic tracking-tighter">LBP {formatPrice(orders.reduce((acc, o) => acc + o.total, 0)).split('LBP')[1]}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Advanced Filtration Hub */}
        {!loading && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col xl:flex-row gap-6 md:gap-10 p-6 md:p-10 lg:p-12 bg-white shadow-premium-lg rounded-[4rem] border border-white relative overflow-hidden group"
          >
            <div className="mesh-gradient absolute inset-0 opacity-5 pointer-events-none" />
            
            <div className="flex flex-col md:flex-row gap-6 md:gap-10 flex-grow relative z-10">
              <div className="flex-grow space-y-4">
                <label className="text-[11px] font-black uppercase tracking-[0.5em] text-coffee-300 italic block ml-6">DATE_PARAMETER_RANGE</label>
                <div className="flex items-center gap-4 md:gap-6 bg-cream/60 backdrop-blur-md border border-white rounded-[2rem] px-6 md:px-8 py-4 md:py-5 shadow-inner ring-1 ring-white">
                  <Calendar size={18} className="text-caramel" />
                  <div className="flex items-center gap-4 w-full">
                    <input 
                      type="date" 
                      value={dateRange.start}
                      onChange={(e) => { setDateRange({ ...dateRange, start: e.target.value }); setCurrentPage(1); }}
                      className="text-[11px] font-black uppercase tracking-[0.2em] outline-none bg-transparent w-full cursor-pointer focus:text-caramel transition-colors"
                    />
                    <span className="text-coffee-200 font-serif">to</span>
                    <input 
                      type="date" 
                      value={dateRange.end}
                      onChange={(e) => { setDateRange({ ...dateRange, end: e.target.value }); setCurrentPage(1); }}
                      className="text-[11px] font-black uppercase tracking-[0.2em] outline-none bg-transparent w-full cursor-pointer focus:text-caramel transition-colors"
                    />
                  </div>
                  {(dateRange.start || dateRange.end) && (
                    <button onClick={() => { setDateRange({ start: '', end: '' }); setCurrentPage(1); }} className="p-2 hover:bg-red-50 text-red-400 hover:text-red-600 transition-all rounded-full group">
                      <X size={16} className="group-hover:rotate-90 transition-transform" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-end gap-4 md:gap-6 relative z-10">
                <button 
                  onClick={() => toggleSort('createdAt')}
                  className={cn(
                    "px-6 md:px-10 py-4 md:py-5 rounded-[2rem] text-[11px] font-black uppercase tracking-[0.4em] flex items-center gap-4 transition-all duration-700 italic border",
                    sortField === 'createdAt' ? "bg-espresso text-caramel-gold border-espresso shadow-premium-lg scale-105" : "bg-white border-coffee-100 text-coffee-400 hover:border-caramel hover:text-caramel"
                  )}
                >
                  Chronology {sortField === 'createdAt' && (sortOrder === 'asc' ? '↑' : '↓')}
                  <ArrowUpDown size={14} />
                </button>
                <button 
                  onClick={() => toggleSort('total')}
                  className={cn(
                    "px-6 md:px-10 py-4 md:py-5 rounded-[2rem] text-[11px] font-black uppercase tracking-[0.4em] flex items-center gap-4 transition-all duration-700 italic border",
                    sortField === 'total' ? "bg-espresso text-caramel-gold border-espresso shadow-premium-lg scale-105" : "bg-white border-coffee-100 text-coffee-400 hover:border-caramel hover:text-caramel"
                  )}
                >
                  Valuation {sortField === 'total' && (sortOrder === 'asc' ? '↑' : '↓')}
                  <ArrowUpDown size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {loading ? (
          <div className="space-y-12">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-white/20 backdrop-blur-xl animate-pulse rounded-[4rem] border border-white/40" />
            ))}
          </div>
        ) : paginatedOrders.length > 0 ? (
          <div className="space-y-10">
            {paginatedOrders.map((order) => (
              <motion.div 
                key={order.id} 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                className="bg-white border border-white rounded-[4rem] p-6 md:p-10 lg:p-14 hover:shadow-premium-xl transition-all duration-1000 group relative overflow-hidden cursor-pointer"
              >
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-cream/20 blur-[100px] opacity-[0.5] -translate-y-1/2 translate-x-1/2 rounded-full pointer-events-none group-hover:bg-caramel/10 transition-colors duration-1000"></div>
                
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 md:gap-16 relative z-10">
                  <div className="flex items-center gap-4 md:gap-10">
                    <div className="w-16 h-16 md:w-24 md:h-24 bg-cream rounded-[2.5rem] flex items-center justify-center shrink-0 text-caramel group-hover:bg-espresso group-hover:text-caramel-gold transition-all duration-1000 shadow-premium group-hover:rotate-6">
                      <ShoppingBag size={24} strokeWidth={1} />
                    </div>
                    <div className="space-y-4">
                       <div className="flex items-center gap-4">
                          <span className="text-[10px] font-black text-coffee-300 uppercase tracking-[0.4em] italic leading-none">ID://</span>
                          <span className="text-fluid-body font-display font-black text-espresso uppercase tracking-tighter italic">#{order.id.slice(-12).toUpperCase()}</span>
                       </div>
                       <h3 className="text-fluid-title font-display font-black text-espresso tracking-tightest italic">
                         {order.items.length} {order.items.length === 1 ? 'Ritual Core' : 'Sensory Primitives'}
                       </h3>
                       <p className="text-fluid-body font-serif italic">
                         Extracted on {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                       </p>
                    </div>
                  </div>

                  <div className="flex-grow max-w-[320px] hidden xl:block">
                    <div className="space-y-5">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.5em] text-coffee-200 italic">
                         <span className={cn(order.status !== 'cancelled' ? "text-caramel" : "")}>IDNT</span>
                         <span className={cn(['confirmed', 'shipped', 'delivered'].includes(order.status) ? "text-caramel" : "")}>CONF</span>
                         <span className={cn(['shipped', 'delivered'].includes(order.status) ? "text-caramel" : "")}>DSPCH</span>
                      </div>
                      <div className="h-2 w-full bg-cream rounded-full overflow-hidden shadow-inner ring-4 ring-cream/30">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ 
                            width: order.status === 'pending' ? '25%' : 
                                   order.status === 'confirmed' ? '50%' : 
                                   order.status === 'shipped' ? '75%' : 
                                   order.status === 'cancelled' ? '0%' : '100%' 
                          }}
                          transition={{ duration: 2, ease: [0.22, 1, 0.36, 1] }}
                          className={cn(
                            "h-full transition-all duration-1000",
                            order.status === 'cancelled' ? 'bg-red-500' : 'bg-espresso'
                          )}
                        />
                      </div>
                      <p className="text-[11px] font-black text-coffee-400 uppercase tracking-widest italic flex items-center gap-3">
                        {order.status === 'delivered' ? 'Protocol Secured.' : 'Logistic Vector: Active Cycle'}
                        <span className="w-1.5 h-1.5 rounded-full bg-caramel animate-pulse" />
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between lg:justify-end gap-4 md:gap-16">
                    <div className="text-left xl:text-right">
                      <p className="text-[11px] font-black text-coffee-300 uppercase tracking-[0.4em] mb-2 italic">Ledger Value</p>
                      <p className="text-fluid-title font-display font-black text-espresso italic tracking-tightest">{formatPrice(order.total)}</p>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className={cn(
                        "px-6 md:px-10 py-3 md:py-4 rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.4em] flex items-center gap-4 border shadow-premium italic transition-all duration-700",
                        order.status === 'delivered' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                        order.status === 'shipped' ? "bg-amber-50 text-amber-600 border-amber-100" :
                        order.status === 'confirmed' ? "bg-blue-50 text-blue-600 border-blue-100" :
                        order.status === 'cancelled' ? "bg-red-50 text-red-600 border-red-100" :
                        "bg-caramel/10 text-caramel border-caramel/20"
                      )}>
                        <StatusIcon status={order.status} />
                        {order.status}_NODE
                      </div>

                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedOrderId(expandedOrderId === order.id ? null : order.id);
                        }}
                        className={cn(
                          "w-12 h-12 md:w-16 md:h-16 bg-white border border-coffee-100 text-espresso rounded-[1.5rem] flex items-center justify-center hover:bg-cream transition-all duration-500 hover:shadow-premium active:scale-90",
                          expandedOrderId === order.id && "bg-espresso text-caramel-gold border-espresso shadow-premium-lg"
                        )}
                      >
                        <motion.div
                          animate={{ rotate: expandedOrderId === order.id ? 90 : 0 }}
                          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                        >
                          <ChevronRight size={20} />
                        </motion.div>
                      </button>

                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOrder(order);
                        }}
                        className="w-12 h-12 md:w-16 md:h-16 bg-espresso text-caramel-gold rounded-[1.5rem] flex items-center justify-center hover:bg-caramel hover:text-white transition-all duration-700 shadow-premium-lg active:scale-95 group/btn overflow-hidden"
                      >
                        <motion.div whileHover={{ y: -5 }}>
                          <Package size={20} strokeWidth={1} />
                        </motion.div>
                      </button>
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {expandedOrderId === order.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                    <div className="pt-8 md:pt-16 mt-8 md:mt-16 border-t border-cream space-y-8 md:space-y-16">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12">
                          <div className="space-y-6">
                            <h4 className="text-[12px] font-black uppercase tracking-[0.5em] text-espresso italic">Logistical Hub</h4>
                            <div className="p-6 md:p-10 bg-cream shadow-premium rounded-[3.5rem] border border-white flex items-start gap-8 group/loc">
                              <div className="w-10 h-10 md:w-14 md:h-14 bg-white rounded-2xl flex items-center justify-center text-caramel shrink-0 group-hover/loc:bg-espresso group-hover:text-caramel-gold transition-colors duration-700 shadow-premium">
                                <MapPin size={20} />
                              </div>
                              <div className="space-y-2">
                                <p className="text-fluid-body font-display font-black text-espresso italic uppercase tracking-tighter">{order.shippingAddress?.fullName}</p>
                                <p className="text-fluid-body text-coffee-400 font-serif italic leading-relaxed">
                                  {order.shippingAddress?.address}, {order.shippingAddress?.city}<br/>
                                  {order.shippingAddress?.region}_SECTOR
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-6">
                            <h4 className="text-[12px] font-black uppercase tracking-[0.5em] text-espresso italic">Financial Settlement</h4>
                            <div className="p-6 md:p-10 bg-cream shadow-premium rounded-[3.5rem] border border-white flex items-center gap-8 group/pay">
                              <div className="w-10 h-10 md:w-14 md:h-14 bg-white rounded-2xl flex items-center justify-center text-caramel shrink-0 group-hover/pay:bg-espresso group-hover:text-caramel-gold transition-colors duration-700 shadow-premium">
                                <CreditCard size={20} />
                              </div>
                              <div className="space-y-1">
                                <p className="text-fluid-body font-display font-black text-espresso uppercase tracking-tighter italic">{order.paymentMethod === 'cash_on_delivery' ? 'Deferred Settlement' : 'Encrypted Card'}</p>
                                <p className="text-[11px] text-coffee-300 font-black uppercase tracking-[0.4em] italic leading-none">{order.paymentMethod === 'cash_on_delivery' ? 'CASH_ON_DELIVERY' : 'STRIPE_GATEWAY_AUTH'}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-6 md:space-y-10">
                          <div className="flex items-center justify-between border-b border-cream pb-6">
                            <h4 className="text-[12px] font-black uppercase tracking-[0.5em] text-espresso italic">Primitive Components</h4>
                            {order.trackingId && (order.status === 'shipped' || order.status === 'delivered') && (
                            <a 
                              href={`https://www.aramex.com/express/track-results?trackNumbers=${order.trackingId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[12px] font-black uppercase tracking-[0.4em] text-caramel hover:text-espresso flex items-center gap-4 transition-all duration-700 italic border-b-2 border-transparent hover:border-caramel pb-2 group/track"
                            >
                              <Truck size={16} className="group-hover/track:translate-x-2 transition-transform" /> VECTOR: {order.trackingId}
                            </a>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                          {order.items.map((item, idx) => (
                            <motion.div 
                              key={idx} 
                              whileHover={{ scale: 1.02 }}
                              className="flex items-center justify-between p-4 md:p-8 bg-white shadow-premium rounded-[3rem] border border-cream group/item"
                            >
                              <div className="flex items-center gap-4 md:gap-10">
                                <div className="relative overflow-hidden w-16 h-16 md:w-24 md:h-24 rounded-[1.5rem] shrink-0 border border-cream shadow-inner">
                                  <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-1000 grayscale group-hover/item:grayscale-0" referrerPolicy="no-referrer" />
                                  <div className="absolute inset-0 ring-1 ring-inset ring-black/5 rounded-[1.5rem]" />
                                </div>
                                <div className="space-y-2">
                                  <p className="text-fluid-body font-display font-black text-espresso italic uppercase leading-none tracking-tight">{item.name}</p>
                                  <p className="text-[11px] text-coffee-400 font-black uppercase tracking-[0.4em] italic mb-2">QUANTITY_X{item.quantity}</p>
                                  <p className="text-[10px] text-caramel font-black uppercase tracking-[0.3em] font-serif">Valuation: {formatPrice(item.price)}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-fluid-title font-display font-black text-espresso italic tracking-tighter">{formatPrice(item.price * item.quantity)}</p>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
                </AnimatePresence>
              </motion.div>
            ))}

            {/* Pagination Logistics */}
            <div className="pt-10 md:pt-20 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-10 border-t border-cream px-4 md:px-8">
              <p className="text-[12px] font-black text-coffee-300 uppercase tracking-[0.5em] italic">
                Logs {Math.min(filteredAndSortedOrders.length, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(filteredAndSortedOrders.length, currentPage * itemsPerPage)} // Total {filteredAndSortedOrders.length} Rituals
              </p>
              <div className="flex items-center gap-6">
                <button 
                  disabled={currentPage === 1}
                  onClick={(e) => { e.stopPropagation(); setCurrentPage(prev => Math.max(1, prev - 1)); }}
                  className="w-12 h-12 md:w-16 md:h-16 bg-white border border-coffee-100 rounded-[1.5rem] flex items-center justify-center text-espresso disabled:opacity-20 hover:bg-caramel hover:text-white transition-all duration-700 shadow-premium active:scale-90"
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="flex items-center gap-4">
                  {[...Array(totalPages)].map((_, i) => (
                    <button 
                      key={i}
                      onClick={(e) => { e.stopPropagation(); setCurrentPage(i + 1); }}
                      className={cn(
                        "w-10 h-10 md:w-12 md:h-12 rounded-[1rem] text-[12px] font-black transition-all duration-500 italic",
                        currentPage === i + 1 ? "bg-espresso text-caramel-gold shadow-premium-lg scale-110" : "bg-white border-coffee-50 text-coffee-400 hover:text-caramel hover:border-caramel"
                      )}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button 
                  disabled={currentPage === totalPages}
                  onClick={(e) => { e.stopPropagation(); setCurrentPage(prev => Math.min(totalPages, prev + 1)); }}
                  className="w-12 h-12 md:w-16 md:h-16 bg-white border border-coffee-100 rounded-[1.5rem] flex items-center justify-center text-espresso disabled:opacity-20 hover:bg-caramel hover:text-white transition-all duration-700 shadow-premium active:scale-90"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-20 md:py-48 text-center bg-white border-2 border-coffee-50 border-dashed rounded-[6rem] space-y-12 relative overflow-hidden group">
            <div className="mesh-gradient absolute inset-0 opacity-5 pointer-events-none" />
            <div className="w-20 h-20 md:w-32 md:h-32 bg-coffee-50 rounded-[3.5rem] flex items-center justify-center mx-auto text-gold-500 shadow-premium group-hover:rotate-12 transition-transform duration-1000 relative z-10">
              <ShoppingBag size={32} strokeWidth={0.5} />
            </div>
            <div className="space-y-6 relative z-10">
              <h3 className="text-fluid-heading font-display font-black text-coffee-950 italic leading-none uppercase tracking-tightest">Null Logs <br/><span className="not-italic text-coffee-400">Detected.</span></h3>
              <p className="text-fluid-body text-coffee-400 font-serif italic max-w-md mx-auto">Your sensory journey is awaiting its primary extraction initialization.</p>
            </div>
            <Link to="/shop" className="btn-premium px-10 md:px-16 py-6 md:py-8 italic uppercase text-[11px] relative z-10 inline-flex">
              Initiate Primary Protocol <ArrowRight size={18} className="ml-4" />
            </Link>
          </div>
        )}

        <div className="pt-12 md:pt-24">
          <ReferralSystem />
        </div>
      </div>

      {/* Tracking Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedOrder(null)}
              className="absolute inset-0 bg-coffee-950/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-3xl bg-white rounded-[4rem] shadow-premium-lg overflow-hidden flex flex-col"
            >
              <div className="p-6 md:p-12 lg:p-16 space-y-6 md:space-y-12">
                <div className="flex items-start justify-between">
                  <div className="space-y-4 w-full">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-[0.4em] text-coffee-400">Log Protocol</span>
                      <div className={cn(
                        "px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border",
                        selectedOrder.status === 'delivered' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                        selectedOrder.status === 'shipped' ? "bg-amber-50 text-amber-600 border-amber-100" :
                        selectedOrder.status === 'cancelled' ? "bg-red-50 text-red-600 border-red-100" :
                        "bg-coffee-50 text-coffee-600 border-coffee-100"
                      )}>
                        {selectedOrder.status}
                      </div>
                    </div>
                    <div className="flex gap-2 h-1.5 w-full">
                      {['pending', 'confirmed', 'shipped', 'delivered'].map((s, i) => {
                        const statusOrder = ['pending', 'confirmed', 'shipped', 'delivered'];
                        const currentIndex = statusOrder.indexOf(selectedOrder.status);
                        const isActive = currentIndex >= i && selectedOrder.status !== 'cancelled';
                        return (
                          <div 
                            key={s} 
                            className={cn(
                              "flex-grow h-full rounded-full transition-all duration-1000 delay",
                              isActive ? "bg-coffee-950" : "bg-coffee-100"
                            )}
                            style={{ transitionDelay: `${i * 150}ms` }}
                          />
                        );
                      })}
                    </div>
                    <h2 className="text-fluid-heading font-display font-black text-coffee-950 italic leading-none overflow-hidden">
                      Ritual <span className="not-italic text-coffee-500">Tracking.</span>
                    </h2>
                    <p className="text-[10px] font-black text-coffee-300 uppercase tracking-widest mt-2 leading-none">Order UUID: {selectedOrder.id}</p>
                  </div>
                  <button onClick={() => setSelectedOrder(null)} className="w-10 h-10 md:w-14 md:h-14 bg-coffee-50 rounded-2xl flex items-center justify-center text-coffee-400 hover:text-coffee-950 transition-all active:scale-95 ml-8 shrink-0">
                    <X size={20} />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="p-6 md:p-10 bg-[#faf8f5] rounded-[3rem] border border-coffee-50 group hover:bg-coffee-950 hover:text-white transition-all duration-700">
                    <div className="flex items-center gap-4 mb-6">
                       <MapPin className="text-coffee-300 group-hover:text-white" size={20} />
                       <span className="text-[10px] font-black uppercase tracking-widest">Protocol Destination</span>
                    </div>
                    <div>
                      <p className="text-fluid-body font-display font-black tracking-tight">{selectedOrder.shippingAddress?.name || 'Elias Mansour'}</p>
                      <p className="text-sm opacity-60 font-medium italic mt-1">{selectedOrder.shippingAddress?.address || 'Beirut Waterfront, District 4'}</p>
                      <p className="text-[10px] font-black text-coffee-400 group-hover:text-coffee-500 uppercase tracking-widest mt-4">Standard Zone 1</p>
                    </div>
                  </div>

                  <div className={cn(
                    "p-6 md:p-10 rounded-[3rem] border transition-all duration-700 group",
                    selectedOrder.status === 'delivered' ? "bg-emerald-50/50 border-emerald-100 hover:bg-emerald-600 hover:text-white" :
                    selectedOrder.status === 'shipped' ? "bg-amber-50/50 border-amber-100 hover:bg-amber-600 hover:text-white" :
                    selectedOrder.status === 'confirmed' ? "bg-blue-50/50 border-blue-100 hover:bg-blue-600 hover:text-white" :
                    selectedOrder.status === 'cancelled' ? "bg-red-50/50 border-red-100 hover:bg-red-600 hover:text-white" :
                    "bg-coffee-50 rounded-[3rem] border-coffee-50 hover:bg-coffee-950 hover:text-white"
                  )}>
                    <div className="flex items-center gap-4 mb-6">
                       <Truck className="text-coffee-300 group-hover:text-white" size={20} />
                       <span className="text-[10px] font-black uppercase tracking-widest">Logistics Provider</span>
                    </div>
                    <div>
                      <p className="text-fluid-body font-display font-black tracking-tight">Ritual Fleet Express</p>
                      <p className="text-sm opacity-60 font-medium italic mt-1 uppercase tracking-tight">Status: {selectedOrder.status}</p>
                      {selectedOrder.trackingId && (
                        <a 
                          href={`https://www.aramex.com/express/track-results?trackNumbers=${selectedOrder.trackingId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest mt-4 border-b border-current pb-1"
                        >
                          Ref: {selectedOrder.trackingId} <ChevronRight size={10} />
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-6 md:space-y-10 px-4">
                  {getTrackingSteps(selectedOrder.status).map((step, i) => (
                    <div key={i} className="flex gap-8 relative">
                      {i !== getTrackingSteps(selectedOrder.status).length - 1 && (
                        <div className={cn(
                          "absolute left-5 top-10 w-0.5 h-12",
                          step.status === 'completed' ? 'bg-coffee-950' : 'bg-coffee-100'
                        )} />
                      )}
                      <div className={cn(
                        "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 relative z-10 transition-all duration-500 shadow-sm",
                        step.status === 'completed' ? 'bg-coffee-950 text-white' : 
                        step.status === 'current' ? 'bg-white border-2 border-coffee-950 text-coffee-950 ring-8 ring-coffee-50' : 
                        'bg-white border border-coffee-100 text-coffee-200'
                      )}>
                        {step.status === 'completed' ? <CheckCircle size={18} /> : <span className="text-sm font-black font-display">{i + 1}</span>}
                      </div>
                      <div className="py-1">
                        <h4 className={cn(
                          "text-fluid-body font-display font-black tracking-tight",
                          step.status === 'pending' ? 'text-coffee-200' : 'text-coffee-950'
                        )}>{step.label}</h4>
                        <p className={cn(
                          "text-[9px] font-black uppercase tracking-widest mt-1",
                          step.status === 'pending' ? 'text-coffee-100' : 'text-coffee-400'
                        )}>{step.date}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <button 
                  onClick={() => setSelectedOrder(null)}
                  className="w-full py-4 md:py-6 bg-coffee-950 text-white rounded-full text-[10px] font-black uppercase tracking-[0.3em] hover:bg-coffee-500 transition-all shadow-2xl shadow-coffee-950/20 active:scale-95"
                >
                  Close Log Audit
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
