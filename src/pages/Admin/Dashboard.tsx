import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Users, ShoppingBag, Coffee, TrendingUp, AlertTriangle,
  Package, Truck, DollarSign, CalendarDays, Settings,
  BarChart3, PieChart, Activity, Clock
} from 'lucide-react';
import SEO from '../../components/common/SEO';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { cn } from '../../lib/utils';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { UserRole, Order, Subscription, SubscriptionStatus, DeliveryStatus } from '../../types';
import { formatUSD, formatLBP } from '../../utils/exchange';
import { BarChart, Bar, LineChart, Line, Tooltip, ResponsiveContainer, XAxis, YAxis, Legend } from 'recharts';

interface AdminStats {
  totalCustomers: number;
  totalProducts: number;
  totalSubscriptions: number;
  activeSubscriptions: number;
  lowStockItems: number;
  pendingOrders: number;
  overdueLedger: number;
  weeklyRevenue: { name: string; revenue: number }[];
  totalRevenueLBP: number;
  totalRevenueUSD: number;
}

export default function AdminDashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState<AdminStats>({
    totalCustomers: 0,
    totalProducts: 0,
    totalSubscriptions: 0,
    activeSubscriptions: 0,
    lowStockItems: 0,
    pendingOrders: 0,
    overdueLedger: 0,
    weeklyRevenue: [],
    totalRevenueLBP: 0,
    totalRevenueUSD: 0,
  });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'overview' | 'operations' | 'analytics'>('overview');

  // Protection
  useEffect(() => {
    if (profile && profile.role !== UserRole.ADMIN) {
      navigate('/');
    }
  }, [profile, navigate]);

  useEffect(() => {
    if (profile?.role === UserRole.ADMIN) {
      fetchAdminData();
    }
  }, [profile]);

  const fetchAdminData = async () => {
    try {
      // Fetch collections
      const [productsSnap, ordersSnap, customersSnap, subsSnap, wholesaleSnap] = await Promise.all([
        getDocs(collection(db, 'products')),
        getDocs(collection(db, 'orders')),
        getDocs(query(collection(db, 'users'), where('role', '!=', UserRole.ADMIN))),
        getDocs(collection(db, 'subscriptions')),
        getDocs(query(collection(db, 'wholesaleAccounts'), where('status', '==', 'pending')))
      ]);

      // Products analysis
      const productsList = productsSnap.docs.map(doc => doc.data());
      const lowStockCount = productsList.filter((p: any) => (p.stock ?? 0) < 10).length;

      // Subscriptions analysis
      const subsList = subsSnap.docs.map(doc => doc.data());
      const activeCount = subsList.filter((s: any) => s.status === SubscriptionStatus.ACTIVE).length;

      // Orders analysis
      const allOrders = ordersSnap.docs.map(doc => {
        const data = doc.data();
        const createdAt = data.createdAt;
        return {
          id: doc.id,
          ...data,
          createdAt: createdAt instanceof Timestamp
            ? createdAt.toDate().toISOString()
            : (createdAt || new Date().toISOString())
        } as Order;
      });

      const pendingOrdersCount = allOrders.filter(o => o.status === 'pending' || o.status === 'confirmed').length;
      const revenueLBP = allOrders.reduce((acc, o) => acc + (o.totalLbp || o.total || 0), 0);
      const revenueUSD = revenueLBP / 89500; // Approximate exchange rate

      // Weekly revenue calculation
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const dayRevenue = [0, 0, 0, 0, 0, 0, 0];
      allOrders.forEach(order => {
        const d = new Date(order.createdAt);
        const day = d.getDay();
        dayRevenue[day] += order.totalLbp || order.total || 0;
      });

      const weeklyData = dayNames.map((name, idx) => ({
        name,
        revenue: dayRevenue[idx] / 1000000 // Convert to millions for display
      }));

      setStats({
        totalCustomers: customersSnap.size,
        totalProducts: productsSnap.size,
        totalSubscriptions: subsSnap.size,
        activeSubscriptions: activeCount,
        lowStockItems: lowStockCount,
        pendingOrders: pendingOrdersCount,
        overdueLedger: 0, // Would need payment data
        weeklyRevenue: weeklyData,
        totalRevenueLBP: revenueLBP,
        totalRevenueUSD: revenueUSD,
      });

      setLoading(false);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="h-20 bg-white animate-pulse rounded-2xl" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-white animate-pulse rounded-2xl" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <SEO title="Admin Dashboard" description="Manage operations, inventory, subscriptions, and analytics." />

        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-espresso/5 pb-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-caramel mb-2">Admin Control Center</p>
            <h1 className="text-4xl md:text-5xl font-display font-black text-espresso italic">Operations Hub</h1>
            <p className="text-sm text-coffee-400 mt-2">Platform management & analytics</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-3 border-b border-espresso/5">
          {(['overview', 'operations', 'analytics'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'px-6 py-3 font-bold text-sm uppercase tracking-widest border-b-2 transition-all',
                tab === t
                  ? 'border-espresso text-espresso'
                  : 'border-transparent text-coffee-400 hover:text-espresso'
              )}
            >
              {t === 'overview' ? 'Overview' : t === 'operations' ? 'Operations' : 'Analytics'}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {tab === 'overview' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricBox
                label="Total Customers"
                value={stats.totalCustomers}
                icon={<Users size={24} />}
                trend="up"
              />
              <MetricBox
                label="Active Subscriptions"
                value={stats.activeSubscriptions}
                icon={<Coffee size={24} />}
                trend="up"
              />
              <MetricBox
                label="Pending Orders"
                value={stats.pendingOrders}
                icon={<Package size={24} />}
                alert={stats.pendingOrders > 5}
              />
              <MetricBox
                label="Low Stock Items"
                value={stats.lowStockItems}
                icon={<AlertTriangle size={24} />}
                alert={stats.lowStockItems > 0}
              />
            </div>

            {/* Revenue Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white border border-espresso/5 rounded-2xl p-8 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-widest text-caramel mb-4">Total Revenue</p>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-coffee-400 mb-1">LBP</p>
                    <p className="text-3xl font-bold text-espresso font-display italic">
                      {formatLBP(stats.totalRevenueLBP)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-coffee-400 mb-1">USD</p>
                    <p className="text-2xl font-bold text-caramel font-display italic">
                      ${stats.totalRevenueUSD.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-espresso/5 rounded-2xl p-8 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-widest text-caramel mb-4">Platform Stats</p>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-coffee-400">Total Products</span>
                    <span className="font-bold text-espresso">{stats.totalProducts}</span>
                  </div>
                  <div className="flex items-center justify-between pb-3 border-b border-espresso/5">
                    <span className="text-coffee-400">Total Subscriptions</span>
                    <span className="font-bold text-espresso">{stats.totalSubscriptions}</span>
                  </div>
                  <button
                    onClick={() => navigate('/admin/inventory')}
                    className="w-full py-2 bg-espresso text-white rounded-lg font-bold text-xs hover:bg-espresso/90 transition-colors"
                  >
                    View Inventory
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-br from-espresso/5 to-caramel/5 border border-espresso/10 rounded-2xl p-8">
              <h3 className="font-bold text-espresso text-lg mb-6 italic">Quick Actions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <ActionButton
                  icon={<Package size={20} />}
                  label="Manage Products"
                  onClick={() => navigate('/admin/products')}
                />
                <ActionButton
                  icon={<Coffee size={20} />}
                  label="Manage Plans"
                  onClick={() => navigate('/admin/plans')}
                />
                <ActionButton
                  icon={<Users size={20} />}
                  label="View Customers"
                  onClick={() => navigate('/admin/customers')}
                />
                <ActionButton
                  icon={<ShoppingBag size={20} />}
                  label="Order Management"
                  onClick={() => navigate('/admin/orders')}
                />
                <ActionButton
                  icon={<DollarSign size={20} />}
                  label="Payment Tracking"
                  onClick={() => navigate('/admin/payments')}
                />
                <ActionButton
                  icon={<Truck size={20} />}
                  label="Delivery Management"
                  onClick={() => navigate('/admin/deliveries')}
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Operations Tab */}
        {tab === 'operations' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-white border border-espresso/5 rounded-2xl p-8 shadow-sm">
              <h3 className="font-bold text-espresso text-lg mb-6 italic">Operational Tasks</h3>
              <div className="space-y-3">
                <TaskItem
                  title="Pending Subscription Approvals"
                  count={5}
                  priority="high"
                />
                <TaskItem
                  title="Failed Deliveries to Retry"
                  count={2}
                  priority="medium"
                />
                <TaskItem
                  title="Overdue Payments"
                  count={stats.overdueLedger}
                  priority="high"
                />
                <TaskItem
                  title="Low Stock Alerts"
                  count={stats.lowStockItems}
                  priority={stats.lowStockItems > 5 ? 'high' : 'medium'}
                />
                <TaskItem
                  title="Open Support Tickets"
                  count={3}
                  priority="medium"
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Analytics Tab */}
        {tab === 'analytics' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-white border border-espresso/5 rounded-2xl p-8 shadow-sm">
              <h3 className="font-bold text-espresso text-lg mb-6 italic">Weekly Revenue</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.weeklyRevenue}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="revenue" fill="#1a0f0a" name="Revenue (Millions LBP)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}

// Helper Components
function MetricBox({
  label,
  value,
  icon,
  trend,
  alert,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  trend?: 'up' | 'down';
  alert?: boolean;
}) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className={cn(
        'p-6 rounded-2xl border transition-all duration-300',
        alert
          ? 'bg-red-50 border-red-200'
          : 'bg-white border-espresso/5 hover:shadow-md'
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={cn(
          'p-3 rounded-lg',
          alert ? 'bg-red-100 text-red-600' : 'bg-espresso/10 text-espresso'
        )}>
          {icon}
        </div>
        {trend && (
          <span className={cn(
            'text-xs font-bold px-2 py-1 rounded-full',
            trend === 'up'
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          )}>
            {trend === 'up' ? '↑' : '↓'} 12%
          </span>
        )}
      </div>
      <p className="text-xs font-bold uppercase tracking-widest text-coffee-400 mb-1">{label}</p>
      <p className="text-3xl font-bold text-espresso italic">{value}</p>
    </motion.div>
  );
}

function ActionButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 p-4 bg-white border border-espresso/5 rounded-xl hover:bg-espresso/5 hover:border-espresso/20 transition-all duration-300 text-left"
    >
      <div className="p-2 bg-espresso/10 rounded-lg text-espresso">{icon}</div>
      <span className="font-bold text-sm text-espresso">{label}</span>
    </button>
  );
}

function TaskItem({
  title,
  count,
  priority,
}: {
  title: string;
  count: number;
  priority: 'high' | 'medium' | 'low';
}) {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      <div className="flex items-center gap-4">
        <div
          className={cn(
            'w-2 h-2 rounded-full',
            priority === 'high'
              ? 'bg-red-500'
              : priority === 'medium'
                ? 'bg-amber-500'
                : 'bg-green-500'
          )}
        />
        <span className="font-semibold text-sm text-espresso">{title}</span>
      </div>
      <span className="px-3 py-1 bg-white border border-espresso/10 rounded-full text-xs font-bold text-espresso">
        {count}
      </span>
    </div>
  );
}

