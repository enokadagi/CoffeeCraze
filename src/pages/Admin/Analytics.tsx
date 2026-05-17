import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Order } from '../../types';
import { formatPrice } from '../../lib/utils';
import { BarChart3, TrendingUp, Users, DollarSign, ArrowUpRight, ArrowDownRight, Package } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { motion } from 'motion/react';

export default function AdminAnalytics() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    activeCustomers: 0,
    inventoryCount: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [ordersSnap, productsSnap, usersSnap] = await Promise.all([
        getDocs(collection(db, 'orders')),
        getDocs(collection(db, 'products')),
        getDocs(collection(db, 'users'))
      ]);

      const orders = ordersSnap.docs.map(doc => doc.data() as Order);
      const revenue = orders.reduce((acc, curr) => acc + curr.total, 0);

      setStats({
        totalRevenue: revenue,
        totalOrders: orders.length,
        activeCustomers: usersSnap.size,
        inventoryCount: productsSnap.docs.reduce((acc, curr) => acc + (curr.data().stock || 0), 0)
      });
      setLoading(false);
    };
    fetchData();
  }, []);

  const data = [
    { name: 'Mon', revenue: 4000 },
    { name: 'Tue', revenue: 3000 },
    { name: 'Wed', revenue: 2000 },
    { name: 'Thu', revenue: 2780 },
    { name: 'Fri', revenue: 1890 },
    { name: 'Sat', revenue: 2390 },
    { name: 'Sun', revenue: 3490 },
  ];

  const StatCard = ({ title, value, icon: Icon, trend, trendValue }: any) => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-coffee-100 p-10 rounded-[3.5rem] shadow-premium hover:shadow-premium-xl transition-all duration-1000 group relative overflow-hidden"
    >
      <div className="mesh-gradient absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-1000 pointer-events-none" />
      <div className="flex items-center justify-between mb-8 relative z-10">
        <div className="w-14 h-14 bg-mocha/5 rounded-2xl flex items-center justify-center text-caramel shadow-premium group-hover:rotate-12 transition-transform duration-700 border border-mocha/10">
          <Icon size={24} strokeWidth={1.5} />
        </div>
        {trend && (
          <div className={`flex items-center gap-2 text-[10px] font-black px-4 py-2 rounded-full italic border ${trend === 'up' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
            {trend === 'up' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {trendValue}%
          </div>
        )}
      </div>
      <div className="relative z-10">
        <p className="text-[11px] font-black text-coffee-300 uppercase tracking-[0.4em] mb-3 italic">{title}_VECTOR</p>
        <h3 className="text-4xl font-display font-black text-espresso italic tracking-tightest uppercase">{value}</h3>
      </div>
    </motion.div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-20 relative">
        <header className="flex flex-col md:flex-row items-start md:items-end justify-between gap-10 border-b border-coffee-100 pb-16">
          <div className="space-y-4">
            <span className="stat-label text-caramel italic">Deep Sensory Analysis</span>
            <h1 className="text-7xl font-display font-black text-espresso tracking-tightest leading-none italic uppercase">Performance <br/><span className="not-italic text-coffee-300">Vault.</span></h1>
            <p className="text-xl text-coffee-400 font-serif italic">Real-time quantification of the <span className="text-espresso font-black not-italic uppercase">CoffeeCraze</span> ecosystem dynamics.</p>
          </div>

          <div className="flex items-center gap-6">
             <div className="px-10 py-6 bg-espresso text-white rounded-[2rem] flex items-center gap-6 border border-white/10 shadow-premium group hover:bg-caramel transition-all duration-1000 italic">
               <BarChart3 size={24} className="text-caramel group-hover:text-white transition-colors duration-700" />
               <span className="text-[11px] font-black uppercase tracking-[0.4em]">Live_Feed: Active</span>
             </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <StatCard title="Total Revenue" value={formatPrice(stats.totalRevenue).split('LBP')[1] + 'K'} icon={DollarSign} trend="up" trendValue="12.5" />
          <StatCard title="Total Orders" value={stats.totalOrders} icon={TrendingUp} trend="up" trendValue="8.2" />
          <StatCard title="Active Ritualists" value={stats.activeCustomers} icon={Users} trend="up" trendValue="15.0" />
          <StatCard title="Stock Units" value={stats.inventoryCount} icon={Package} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
          {/* Revenue Vector */}
          <div className="bg-white border border-coffee-100 p-12 md:p-16 rounded-[5rem] shadow-premium-lg space-y-12 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-16 opacity-[0.02] transition-opacity duration-1000 group-hover:opacity-[0.06] pointer-events-none">
              <TrendingUp size={240} strokeWidth={0.5} />
            </div>
            <div className="flex items-center justify-between relative z-10">
              <div className="space-y-4">
                <span className="stat-label text-caramel">Flux_Vector</span>
                <h3 className="text-4xl font-display font-black text-espresso italic uppercase tracking-tightest leading-none">Revenue <br/><span className="not-italic text-coffee-300">Diffusion.</span></h3>
              </div>
              <div className="w-12 h-12 bg-mocha/5 rounded-2xl flex items-center justify-center text-coffee-300">
                <BarChart3 size={20} />
              </div>
            </div>
            <div className="h-96 w-full relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#C0A080" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#C0A080" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '2rem', 
                      border: 'none', 
                      boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)',
                      padding: '1.5rem',
                      fontFamily: 'Inter, sans-serif'
                    }}
                    cursor={{ stroke: '#C0A080', strokeWidth: 1 }}
                  />
                  <XAxis dataKey="name" hide />
                  <YAxis hide />
                  <Area type="monotone" dataKey="revenue" stroke="#C0A080" strokeWidth={5} fillOpacity={1} fill="url(#colorRev)" />
                </AreaChart>
              </ResponsiveContainer>
              <div className="flex justify-between px-4 pt-8 border-t border-coffee-100">
                 {data.map(d => (
                   <span key={d.name} className="text-[10px] font-black text-coffee-200 uppercase tracking-[0.4em] italic leading-none">{d.name}</span>
                 ))}
              </div>
            </div>
          </div>

          {/* Sensory Performance Vector */}
          <div className="bg-white border border-coffee-100 p-12 md:p-16 rounded-[5rem] shadow-premium-lg space-y-12 relative overflow-hidden group">
            <div className="mesh-gradient absolute inset-0 opacity-[0.02] pointer-events-none" />
            <div className="flex items-center justify-between relative z-10">
              <div className="space-y-4">
                <span className="stat-label text-caramel">Sensory_Node_Bias</span>
                <h3 className="text-4xl font-display font-black text-espresso italic uppercase tracking-tightest leading-none">Category <br/><span className="not-italic text-coffee-300">Bias.</span></h3>
              </div>
              <div className="w-12 h-12 bg-mocha/5 rounded-2xl flex items-center justify-center text-coffee-300">
                <BarChart3 size={20} />
              </div>
            </div>
            <div className="h-96 w-full relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { name: 'Beans', sales: 4500 },
                  { name: 'Nodes', sales: 3000 },
                  { name: 'Cells', sales: 2000 },
                  { name: 'Gear', sales: 1500 },
                ]}>
                  <Tooltip 
                    cursor={{ fill: 'transparent' }} 
                    contentStyle={{ borderRadius: '2rem', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)' }} 
                  />
                  <Bar dataKey="sales" fill="#C0A080" radius={[12, 12, 0, 0]} barSize={60} />
                  <XAxis dataKey="name" hide />
                </BarChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-4 gap-4 pt-8 border-t border-coffee-100">
                 {['Beans', 'Nodes', 'Cells', 'Gear'].map(name => (
                   <span key={name} className="text-[10px] font-black text-coffee-200 uppercase tracking-[0.4em] italic text-center leading-none">{name}</span>
                 ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
