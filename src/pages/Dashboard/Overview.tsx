import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Coffee, Truck, Star, ArrowRight, Sparkles, Bell, Settings,
  CreditCard, Calendar, Package, AlertCircle, CheckCircle, 
  TrendingUp, MessageSquare, ShoppingBag, Zap
} from 'lucide-react';
import SEO from '../../components/common/SEO';
import { useAuth } from '../../context/AuthContext';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { cn } from '../../lib/utils';
import { Link, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Order, Subscription, SubscriptionStatus, PaymentStatus, Delivery, DeliveryStatus } from '../../types';
import { formatUSD, formatLBP, formatDualFromLBP } from '../../utils/exchange';
import MetricCard from '../../components/dashboard/MetricCard';
import SubscriptionCard from '../../components/dashboard/SubscriptionCard';
import DeliveryCard from '../../components/dashboard/DeliveryCard';
import OrderHistory from '../../components/dashboard/OrderHistory';

export default function DashboardOverview() {
  const { user, profile } = useAuth();
  // NOTE: The file contained a duplicated/stray JSX block after the component ended,
  // which caused TS2657/TS1128 parser failures. This component ends cleanly below.

  const navigate = useNavigate();
  
  // Data states
  const [activeSubscriptions, setActiveSubscriptions] = useState<Subscription[]>([]);
  const [upcomingDeliveries, setUpcomingDeliveries] = useState<Delivery[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState({
    totalSpent: 0,
    activeSubscriptions: 0,
    nextDeliveryDays: 0,
    loyaltyPoints: 0,
  });
  
  const [loading, setLoading] = useState(true);

  // Fetch all dashboard data
  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Fetch active subscriptions
      const subsQ = query(
        collection(db, 'subscriptions'),
        where('userId', '==', user!.uid),
        where('status', '==', SubscriptionStatus.ACTIVE),
        orderBy('nextDelivery', 'asc')
      );
      const subsSnap = await getDocs(subsQ);
      const subs = subsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subscription));
      setActiveSubscriptions(subs);

      // Fetch upcoming deliveries (next 7 days)
      const now = new Date();
      const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const startStr = now.toISOString().split('T')[0];
      const endStr = sevenDaysLater.toISOString().split('T')[0];

      const delivQ = query(
        collection(db, 'deliveries'),
        where('userId', '==', user!.uid),
        where('scheduledDate', '>=', startStr),
        where('scheduledDate', '<=', endStr),
        orderBy('scheduledDate', 'asc')
      );
      const delivSnap = await getDocs(delivQ);
      const deliveries = delivSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Delivery));
      setUpcomingDeliveries(deliveries);

      // Fetch recent orders
      const ordersQ = query(
        collection(db, 'orders'),
        where('userId', '==', user!.uid),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      const ordersSnap = await getDocs(ordersQ);
      const orders = ordersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      setRecentOrders(orders);

      // Calculate stats
      const nextDelivery = subs.length > 0 
        ? Math.ceil((new Date(subs[0].nextDelivery).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      setStats({
        totalSpent: orders.reduce((sum, o) => sum + (o.totalLbp || o.total), 0),
        activeSubscriptions: subs.length,
        nextDeliveryDays: nextDelivery,
        loyaltyPoints: profile?.loyaltyPoints || 0,
      });

      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  const handlePauseSubscription = (subscriptionId: string) => {
    // TODO: Implement pause logic
    console.log('Pause subscription:', subscriptionId);
  };

  const handleResumeSubscription = (subscriptionId: string) => {
    // TODO: Implement resume logic
    console.log('Resume subscription:', subscriptionId);
  };

  const handleManageSubscription = (subscriptionId: string) => {
    navigate(`/dashboard/subscriptions/${subscriptionId}`);
  };

  const handleEditSubscription = (subscriptionId: string) => {
    navigate(`/dashboard/subscriptions/${subscriptionId}/edit`);
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 md:space-y-12">
        <SEO 
          title="Dashboard" 
          description="Manage your subscriptions, orders, deliveries, and account settings." 
        />

        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 border-b border-espresso/5 pb-8"
        >
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-caramel">Welcome Back</p>
            <h1 className="text-4xl md:text-5xl font-display font-black text-espresso italic leading-tight">
              Your <span className="text-coffee-400">Command</span> <br/>Center
            </h1>
            <p className="text-sm text-coffee-400 max-w-md">
              Manage your subscriptions, track deliveries, and stay updated with your coffee ritual.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/dashboard/notifications')}
              className="p-3 hover:bg-espresso/5 rounded-xl transition-colors relative"
            >
              <Bell size={20} className="text-espresso" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <button
              onClick={() => navigate('/dashboard/settings')}
              className="p-3 hover:bg-espresso/5 rounded-xl transition-colors"
            >
              <Settings size={20} className="text-espresso" />
            </button>
          </div>
        </motion.div>

        {loading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-white animate-pulse rounded-2xl border border-espresso/5" />
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Key Metrics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
            >
              <MetricCard
                label="Active Plans"
                value={stats.activeSubscriptions}
                icon={<Coffee size={20} className="text-espresso" />}
                color="primary"
              />
              <MetricCard
                label="Next Delivery"
                value={stats.nextDeliveryDays > 0 ? `${stats.nextDeliveryDays}d` : 'Soon'}
                icon={<Truck size={20} className="text-green-600" />}
                color="success"
              />
              <MetricCard
                label="Total Spent"
                value={formatLBP(stats.totalSpent)}
                icon={<CreditCard size={20} className="text-amber-600" />}
                color="warning"
              />
              <MetricCard
                label="Loyalty Points"
                value={stats.loyaltyPoints}
                icon={<Star size={20} className="text-caramel" />}
                color="primary"
              />
            </motion.div>

            {/* Primary Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Column */}
              <div className="lg:col-span-2 space-y-8">
                {/* Next Delivery Section */}
                {activeSubscriptions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gradient-to-br from-espresso to-espresso/90 rounded-3xl p-8 text-white overflow-hidden relative shadow-lg border border-white/10"
                  >
                    <div className="absolute top-0 right-0 w-96 h-96 bg-caramel/10 blur-[100px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/2" />
                    
                    <div className="relative z-10 space-y-6">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 border border-white/20 rounded-full">
                        <Truck size={14} className="text-caramel" />
                        <span className="text-xs font-bold uppercase tracking-widest">Next Delivery</span>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-coffee-300 mb-2">Scheduled for</p>
                          <p className="text-3xl md:text-4xl font-display font-black italic">
                            {new Date(activeSubscriptions[0].nextDelivery).toLocaleDateString('en-US', {
                              weekday: 'long',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                        <p className="text-sm text-coffee-300 max-w-xl">
                          Your {activeSubscriptions[0].plan?.frequency} delivery of{' '}
                          <span className="font-bold text-white">
                            {activeSubscriptions[0].plan?.items?.length} items
                          </span>{' '}
                          to {activeSubscriptions[0].deliveryAddress?.city || 'your address'}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-3 pt-4">
                        <Link
                          to={`/dashboard/subscriptions/${activeSubscriptions[0].id}`}
                          className="px-6 py-3 bg-white text-espresso rounded-lg font-bold text-sm hover:bg-caramel hover:text-white transition-all duration-300"
                        >
                          Manage
                        </Link>
                        <button
                          onClick={() => navigate('/subscriptions')}
                          className="px-6 py-3 border border-white/20 text-white rounded-lg font-bold text-sm hover:bg-white/10 transition-all duration-300"
                        >
                          View Plans
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Active Subscriptions */}
                {activeSubscriptions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-xl font-display font-black text-espresso italic">Active Plans</h2>
                        <p className="text-sm text-coffee-400">Manage your subscription plans</p>
                      </div>
                      <Link
                        to="/dashboard/subscriptions"
                        className="text-xs font-bold text-caramel hover:text-espresso transition-colors"
                      >
                        View All →
                      </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {activeSubscriptions.slice(0, 2).map(sub => (
                        <SubscriptionCard
                          key={sub.id}
                          subscription={sub}
                          onManage={handleManageSubscription}
                          onEdit={handleEditSubscription}
                          onPause={handlePauseSubscription}
                          onResume={handleResumeSubscription}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Upcoming Deliveries */}
                {upcomingDeliveries.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-xl font-display font-black text-espresso italic">Upcoming Deliveries</h2>
                        <p className="text-sm text-coffee-400">Track your shipments</p>
                      </div>
                      <Link
                        to="/dashboard/deliveries"
                        className="text-xs font-bold text-caramel hover:text-espresso transition-colors"
                      >
                        View All →
                      </Link>
                    </div>

                    <div className="space-y-4">
                      {upcomingDeliveries.slice(0, 3).map(delivery => (
                        <DeliveryCard
                          key={delivery.id}
                          delivery={delivery}
                          onClick={() => navigate(`/dashboard/deliveries/${delivery.id}`)}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Order History */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-display font-black text-espresso italic">Recent Orders</h2>
                      <p className="text-sm text-coffee-400">Your order history</p>
                    </div>
                    <Link
                      to="/dashboard/orders"
                      className="text-xs font-bold text-caramel hover:text-espresso transition-colors"
                    >
                      View All →
                    </Link>
                  </div>

                  <div className="bg-white border border-espresso/5 rounded-2xl p-6">
                    <OrderHistory orders={recentOrders} loading={false} />
                  </div>
                </motion.div>
              </div>

              {/* Sidebar */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-6"
              >
                {/* Payment Status */}
                <div className="bg-white border border-espresso/5 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-espresso/10 rounded-lg">
                      <CreditCard size={20} className="text-espresso" />
                    </div>
                    <h3 className="font-bold text-espresso">Payment Status</h3>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-coffee-400 uppercase font-semibold mb-1">Next Payment</p>
                      <p className="text-lg font-bold text-espresso">
                        No payments due
                      </p>
                    </div>
                    <button className="w-full py-2 bg-espresso text-white rounded-lg text-sm font-bold hover:bg-espresso/90 transition-colors">
                      View Invoices
                    </button>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white border border-espresso/5 rounded-2xl p-6 space-y-3">
                  <h3 className="font-bold text-espresso mb-4">Quick Actions</h3>
                  <Link
                    to="/shop"
                    className="flex items-center gap-3 p-3 hover:bg-espresso/5 rounded-lg transition-colors"
                  >
                    <ShoppingBag size={18} className="text-caramel" />
                    <span className="text-sm font-semibold text-espresso">Shop</span>
                  </Link>
                  <Link
                    to="/custom-plan-builder"
                    className="flex items-center gap-3 p-3 hover:bg-espresso/5 rounded-lg transition-colors"
                  >
                    <Zap size={18} className="text-caramel" />
                    <span className="text-sm font-semibold text-espresso">Create Plan</span>
                  </Link>
                  <Link
                    to="/ai-barista"
                    className="flex items-center gap-3 p-3 hover:bg-espresso/5 rounded-lg transition-colors"
                  >
                    <Sparkles size={18} className="text-caramel" />
                    <span className="text-sm font-semibold text-espresso">AI Recommendations</span>
                  </Link>
                  <Link
                    to="/dashboard/settings"
                    className="flex items-center gap-3 p-3 hover:bg-espresso/5 rounded-lg transition-colors"
                  >
                    <Settings size={18} className="text-caramel" />
                    <span className="text-sm font-semibold text-espresso">Settings</span>
                  </Link>
                </div>

                {/* Support Card */}
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 space-y-3">
                  <div className="flex items-center gap-3">
                    <MessageSquare size={20} className="text-amber-600" />
                    <h3 className="font-bold text-amber-900">Need Help?</h3>
                  </div>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    Have questions about your subscription or delivery? Our support team is ready to help.
                  </p>
                  <button className="w-full py-2 bg-amber-600 text-white rounded-lg text-sm font-bold hover:bg-amber-700 transition-colors">
                    Contact Support
                  </button>
                </div>

                {/* Loyalty Info */}
                <div className="bg-gradient-to-br from-caramel/10 to-caramel/5 border border-caramel/20 rounded-2xl p-6 space-y-3">
                  <div className="flex items-center gap-3">
                    <Star size={20} className="text-caramel fill-caramel" />
                    <h3 className="font-bold text-espresso">Loyalty Points</h3>
                  </div>
                  <div>
                    <p className="text-xs text-coffee-400 uppercase font-semibold mb-1">Available Points</p>
                    <p className="text-2xl font-bold text-espresso">{stats.loyaltyPoints}</p>
                  </div>
                  <p className="text-xs text-coffee-400 italic">
                    Earn points on every purchase. Redeem for discounts and free items.
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Empty States */}
            {activeSubscriptions.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-espresso/5 to-caramel/5 border-2 border-dashed border-espresso/20 rounded-3xl p-12 text-center"
              >
                <Coffee size={48} className="mx-auto text-espresso/30 mb-6" />
                <h2 className="text-2xl font-display font-black text-espresso mb-3 italic">
                  No Active Subscriptions
                </h2>
                <p className="text-coffee-400 mb-6 max-w-md mx-auto">
                  Start your coffee ritual today by choosing from our premium subscription plans.
                </p>
                <Link
                  to="/subscriptions"
                  className="inline-block px-8 py-4 bg-espresso text-white rounded-xl font-bold hover:bg-espresso/90 transition-colors"
                >
                  Browse Plans
                </Link>
              </motion.div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
                      
