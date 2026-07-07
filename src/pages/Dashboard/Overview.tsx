import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Coffee, Truck, Star, ArrowRight, Sparkles, Settings,
  CreditCard, Calendar, Package, AlertCircle, CheckCircle, 
  TrendingUp, MessageSquare, ShoppingBag, Zap
} from 'lucide-react';
import SEO from '../../components/common/SEO';
import { useAuth } from '../../context/AuthContext';
import { collection, query, where, getDocs, orderBy, limit, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { cn } from '../../lib/utils';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Order, Subscription, SubscriptionStatus, PaymentStatus, Delivery, DeliveryStatus } from '../../types';
import { formatUSD, formatLBP, formatDualFromLBP } from '../../utils/exchange';
import { formatPrice, formatDate } from '../../lib/utils';
import MetricCard from '../../components/dashboard/MetricCard';
import SubscriptionCard from '../../components/dashboard/SubscriptionCard';
import DeliveryCard from '../../components/dashboard/DeliveryCard';
import OrderHistory from '../../components/dashboard/OrderHistory';

export default function DashboardOverview() {
  const { user, profile, isEmailVerified, sendVerificationEmail } = useAuth();
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

  const handlePauseSubscription = async (subscriptionId: string) => {
    try {
      const subRef = doc(db, 'subscriptions', subscriptionId);
      await updateDoc(subRef, {
        status: SubscriptionStatus.PAUSED,
        pausedAt: new Date().toISOString(),
      });
      toast.success('Subscription paused');
      fetchDashboardData();
    } catch (error) {
      console.error('Failed to pause subscription:', error);
      toast.error('Failed to pause subscription');
    }
  };

  const handleResumeSubscription = async (subscriptionId: string) => {
    try {
      const subRef = doc(db, 'subscriptions', subscriptionId);
      await updateDoc(subRef, {
        status: SubscriptionStatus.ACTIVE,
        pausedAt: null,
      });
      toast.success('Subscription resumed');
      fetchDashboardData();
    } catch (error) {
      console.error('Failed to resume subscription:', error);
      toast.error('Failed to resume subscription');
    }
  };

  const handleManageSubscription = (_subscriptionId: string) => {
    navigate('/dashboard/subscriptions');
  };

  const handleEditSubscription = (_subscriptionId: string) => {
    navigate('/dashboard/subscriptions');
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 md:space-y-12">
        <SEO 
          title="Dashboard" 
          description="Manage your subscriptions, orders, deliveries, and account settings." 
        />

        {/* Email Verification Banner */}
        {!isEmailVerified && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-4 p-5 bg-amber-50 border border-amber-200 rounded-2xl"
          >
            <AlertCircle size={20} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-amber-900 text-sm">Email Not Verified</p>
              <p className="text-xs text-amber-700 mt-1">Please verify your email address to access all features.</p>
            </div>
            <button
              onClick={sendVerificationEmail}
              className="shrink-0 px-4 py-2 bg-amber-600 text-white text-xs font-bold rounded-lg hover:bg-amber-700 transition-colors"
            >
              Resend
            </button>
          </motion.div>
        )}

        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-6 border-b border-espresso/8 pb-6 md:pb-8"
        >
          <div className="space-y-2 md:space-y-3 min-w-0">
            <p className="text-xs font-bold uppercase tracking-widest text-caramel">Welcome Back</p>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-black text-espresso leading-tight">
              Your <span className="text-caramel">Dashboard</span>
            </h1>
            <p className="text-sm text-text-secondary max-w-md leading-relaxed">
              {stats.activeSubscriptions > 0
                ? 'Manage your subscriptions, track deliveries, and stay updated with your coffee ritual.'
                : 'You are a member. Start a subscription to get coffee delivered on your schedule.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full lg:w-auto">
            {!loading && stats.activeSubscriptions === 0 && (
              <Link
                to="/subscriptions"
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-3 bg-espresso text-white rounded-xl text-sm font-bold hover:bg-caramel hover:text-espresso transition-colors shadow-sm"
              >
                <Coffee size={16} /> Start Subscription
              </Link>
            )}
            <button
              onClick={() => navigate('/dashboard/settings')}
              className="p-3 border border-espresso/10 hover:bg-espresso/5 rounded-xl transition-colors text-espresso"
              aria-label="Settings"
            >
              <Settings size={20} />
            </button>
          </div>
        </motion.div>

        {/* Subscriber onboarding --- shown when no active plans */}
        {!loading && stats.activeSubscriptions === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl md:rounded-3xl border border-caramel/25 bg-gradient-to-br from-caramel/10 via-white to-cream p-6 md:p-8 shadow-premium"
          >
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div className="flex-1 space-y-3">
                <p className="text-xs font-bold uppercase tracking-widest text-caramel">Become a Subscriber</p>
                <h2 className="text-xl md:text-2xl font-display font-black text-espresso">
                  Turn your account into a coffee subscription
                </h2>
                <ol className="text-sm text-text-secondary space-y-2 list-none">
                  <li className="flex items-start gap-2"><span className="w-5 h-5 rounded-full bg-caramel text-espresso text-xs font-black flex items-center justify-center shrink-0">1</span> Browse plans on the Subscriptions page</li>
                  <li className="flex items-start gap-2"><span className="w-5 h-5 rounded-full bg-caramel text-espresso text-xs font-black flex items-center justify-center shrink-0">2</span> Pick Starter, Premium, or build a Custom plan</li>
                  <li className="flex items-start gap-2"><span className="w-5 h-5 rounded-full bg-caramel text-espresso text-xs font-black flex items-center justify-center shrink-0">3</span> Manage deliveries here in your dashboard</li>
                </ol>
              </div>
              <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0">
                <Link
                  to="/subscriptions"
                  className="px-6 py-3.5 bg-espresso text-white rounded-xl text-sm font-bold text-center hover:bg-caramel hover:text-espresso transition-colors"
                >
                  View Plans
                </Link>
                <Link
                  to="/custom-plan-builder"
                  className="px-6 py-3.5 border-2 border-espresso text-espresso rounded-xl text-sm font-bold text-center hover:bg-espresso hover:text-white transition-colors"
                >
                  Build Custom Plan
                </Link>
              </div>
            </div>
          </motion.div>
        )}

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
              className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
            >
              <MetricCard
                label="Active Plans"
                value={stats.activeSubscriptions}
                icon={<Coffee size={18} className="text-espresso" />}
                color="primary"
              />
              <MetricCard
                label="Next Delivery"
                value={stats.nextDeliveryDays > 0 ? `${stats.nextDeliveryDays}d` : '---'}
                icon={<Truck size={18} className="text-green-700" />}
                color="success"
              />
              <MetricCard
                label="Total Spent"
                value={formatPrice(stats.totalSpent, profile?.preferences?.currency || 'LBP')}
                icon={<CreditCard size={18} className="text-amber-700" />}
                color="warning"
              />
              <MetricCard
                label="Loyalty Points"
                value={stats.loyaltyPoints}
                icon={<Star size={18} className="text-caramel" />}
                color="primary"
              />
            </motion.div>

            {/* Primary Content Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8">
              {/* Main Column */}
              <div className="xl:col-span-2 space-y-6 md:space-y-8 min-w-0">
                {/* Next Delivery Section */}
                {activeSubscriptions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gradient-to-br from-espresso to-primary rounded-2xl md:rounded-3xl p-6 md:p-8 text-white overflow-hidden relative shadow-lg border border-white/10"
                  >
                    <div className="absolute top-0 right-0 w-64 md:w-96 h-64 md:h-96 bg-caramel/15 blur-[80px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/2" />
                    
                    <div className="relative z-10 space-y-5 md:space-y-6">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/12 border border-white/20 rounded-full">
                        <Truck size={14} className="text-caramel" />
                        <span className="text-xs font-bold uppercase tracking-widest text-white">Next Delivery</span>
                      </div>

                      <div className="space-y-3 md:space-y-4">
                        <div>
                          <p className="text-sm text-white/70 mb-1">Scheduled for</p>
                          <p className="text-2xl sm:text-3xl md:text-4xl font-display font-black">
                            {new Date(activeSubscriptions[0].nextDelivery).toLocaleDateString(
                              profile?.preferences?.language === 'ar' ? 'ar-SA' : 'en-US',
                              { weekday: 'long', month: 'long', day: 'numeric' }
                            )}
                          </p>
                        </div>
                        <p className="text-sm text-white/80 max-w-xl leading-relaxed">
                          Your {activeSubscriptions[0].plan?.frequency || activeSubscriptions[0].frequency} delivery of{' '}
                          <span className="font-bold text-white">
                            {activeSubscriptions[0].plan?.items?.length || activeSubscriptions[0].items?.length || 0} items
                          </span>{' '}
                          to {activeSubscriptions[0].deliveryAddress?.city
                            || (typeof activeSubscriptions[0].address === 'object' ? activeSubscriptions[0].address?.city : null)
                            || 'your address'}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-3 pt-2">
                        <Link
                          to="/dashboard/subscriptions"
                          className="px-5 py-2.5 bg-white text-espresso rounded-xl font-bold text-sm hover:bg-caramel hover:text-espresso transition-all duration-300"
                        >
                          Manage
                        </Link>
                        <button
                          onClick={() => navigate('/subscriptions')}
                          className="px-5 py-2.5 border border-white/30 text-white rounded-xl font-bold text-sm hover:bg-white/15 transition-all duration-300"
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
                        <p className="text-sm text-text-secondary">Manage your subscription plans</p>
                      </div>
                      <Link
                        to="/dashboard/subscriptions"
                        className="text-xs font-bold text-caramel hover:text-espresso transition-colors"
                      >
                        View All →
                      </Link>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
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
                        <p className="text-sm text-text-secondary">Track your shipments</p>
                      </div>
                      <Link
                        to="/dashboard/orders"
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
                          onClick={() => navigate('/dashboard/orders')}
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
                      <p className="text-sm text-text-secondary">Your order history</p>
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
                className="space-y-4 md:space-y-6 min-w-0"
              >
                {/* Payment Status */}
                <div className="bg-white border border-espresso/10 rounded-2xl p-5 md:p-6 space-y-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-espresso/10 rounded-lg">
                      <CreditCard size={20} className="text-espresso" />
                    </div>
                    <h3 className="font-bold text-espresso">Payment Status</h3>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-text-secondary uppercase font-semibold mb-1">Next Payment</p>
                      <p className="text-lg font-bold text-espresso">
                        No payments due
                      </p>
                    </div>
                    <button className="w-full py-2.5 bg-espresso text-white rounded-xl text-sm font-bold hover:bg-caramel hover:text-espresso transition-colors">
                      View Invoices
                    </button>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white border border-espresso/10 rounded-2xl p-5 md:p-6 space-y-1 shadow-sm">
                  <h3 className="font-bold text-espresso mb-3">Quick Actions</h3>
                  {[
                    { to: '/subscriptions', icon: Coffee, label: 'Subscription Plans' },
                    { to: '/shop', icon: ShoppingBag, label: 'Shop' },
                    { to: '/custom-plan-builder', icon: Zap, label: 'Create Custom Plan' },
                    { to: '/ai-barista', icon: Sparkles, label: 'AI Recommendations' },
                    { to: '/dashboard/settings', icon: Settings, label: 'Settings' },
                  ].map(({ to, icon: Icon, label }) => (
                    <Link
                      key={to}
                      to={to}
                      className="flex items-center gap-3 p-3 hover:bg-caramel/10 rounded-xl transition-colors border border-transparent hover:border-caramel/20"
                    >
                      <Icon size={18} className="text-caramel shrink-0" />
                      <span className="text-sm font-semibold text-espresso">{label}</span>
                    </Link>
                  ))}
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
                  <button
                    onClick={() => navigate('/contact')}
                    className="w-full py-2.5 bg-amber-600 text-white rounded-xl text-sm font-bold hover:bg-amber-700 transition-colors"
                  >
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
                    <p className="text-xs text-text-secondary uppercase font-semibold mb-1">Available Points</p>
                    <p className="text-2xl font-bold text-espresso">{stats.loyaltyPoints}</p>
                  </div>
                  <p className="text-xs text-text-secondary italic leading-relaxed">
                    Earn points on every purchase. Redeem for discounts and free items.
                  </p>
                </div>
              </motion.div>
            </div>

          </>
        )}
      </div>
    </DashboardLayout>
  );
}
                      
