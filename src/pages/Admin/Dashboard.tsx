import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Users, ShoppingBag, Coffee as CoffeeIcon, 
  ChevronRight, ArrowUpRight, TrendingUp, DollarSign, RefreshCw,
  Truck, User
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { formatPrice, cn } from '../../lib/utils';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { UserRole } from '../../types';

const data = [
  { name: 'Mon', revenue: 4000000, orders: 24 },
  { name: 'Tue', revenue: 3000000, orders: 18 },
  { name: 'Wed', revenue: 5000000, orders: 32 },
  { name: 'Thu', revenue: 2780000, orders: 15 },
  { name: 'Fri', revenue: 6890000, orders: 42 },
  { name: 'Sat', revenue: 8390000, orders: 55 },
  { name: 'Sun', revenue: 7490000, orders: 48 },
];

export default function AdminDashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [counts, setCounts] = useState({
    products: 0,
    orders: 0,
    customers: 0,
    subscriptions: 0
  });

  // Protection
  useEffect(() => {
    if (profile && profile.role !== UserRole.ADMIN) {
      navigate('/');
    }
  }, [profile, navigate]);

  useEffect(() => {
    const fetchCounts = async () => {
      const productsSnap = await getDocs(collection(db, 'products'));
      const ordersSnap = await getDocs(collection(db, 'orders'));
      const customersSnap = await getDocs(query(collection(db, 'users'), where('role', '!=', UserRole.ADMIN)));
      const subsSnap = await getDocs(collection(db, 'subscriptions'));

      setCounts({
        products: productsSnap.size,
        orders: ordersSnap.size,
        customers: customersSnap.size,
        subscriptions: subsSnap.size
      });
    };
    fetchCounts();
  }, []);

  const stats = [
    { label: 'Total Revenue', value: 'LBP 125,400k', icon: <DollarSign />, color: 'bg-emerald-500', trend: '+12.5%' },
    { label: 'Ritual Members', value: counts.customers.toLocaleString(), icon: <Users />, color: 'bg-coffee-500', trend: '+8.2%' },
    { label: 'Active Subscriptions', value: counts.subscriptions.toLocaleString(), icon: <CoffeeIcon />, color: 'bg-amber-500', trend: '+15.3%' },
    { label: 'Open Orders', value: counts.orders.toLocaleString(), icon: <ShoppingBag />, color: 'bg-blue-500', trend: '-2.1%' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8 md:space-y-16 relative">
        <header className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 md:gap-10 border-b border-coffee-50 pb-8 md:pb-16">
          <div className="space-y-4">
            <span className="stat-label text-gold-500 italic">Enterprise Oversight</span>
            <h1 className="text-fluid-hero font-display font-black text-coffee-950 tracking-tightest leading-none italic uppercase">Operations <br/><span className="not-italic text-coffee-400">Center.</span></h1>
            <p className="text-fluid-body text-coffee-400 font-serif italic">Strategic monitoring of the <span className="text-coffee-950 font-black not-italic uppercase">CoffeeCraze</span> sensory ecosystem.</p>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <div className="px-6 md:px-8 py-4 md:py-5 bg-white shadow-premium rounded-[2rem] flex items-center gap-6 border border-coffee-50">
              <div className="w-3 h-3 bg-emerald-500 rounded-full animate-ping"></div>
              <span className="text-[11px] font-black text-coffee-950 uppercase tracking-[0.4em] italic leading-none">Global_Nodes: Online</span>
            </div>
            <div className="px-6 md:px-8 py-4 md:py-5 bg-coffee-950 shadow-premium-lg rounded-[2rem] flex items-center gap-6 border border-white/10">
              <TrendingUp size={18} className="text-gold-500" />
              <span className="text-[11px] font-black text-white uppercase tracking-[0.4em] italic leading-none">Efficiency: 98.4%</span>
            </div>
          </div>
        </header>

        {/* Core KPI Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-10">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="bg-white p-6 md:p-10 lg:p-12 rounded-[4rem] border border-coffee-50 shadow-premium hover:shadow-premium-xl relative overflow-hidden group hover:-translate-y-2 transition-all duration-1000"
            >
              <div className="mesh-gradient absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-1000 pointer-events-none" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6 md:mb-10">
                  <div className={cn("w-10 h-10 md:w-14 md:h-14 rounded-2xl flex items-center justify-center text-white shadow-xl transition-transform duration-700 group-hover:rotate-12", stat.color)}>
                    {stat.icon}
                  </div>
                  <div className={cn("px-4 py-2 rounded-full text-[10px] font-black italic border transition-colors duration-700", 
                    stat.trend.startsWith('+') ? 'bg-emerald-50 text-emerald-600 border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white' : 'bg-red-50 text-red-600 border-red-100 group-hover:bg-red-600 group-hover:text-white'
                  )}>
                    {stat.trend}
                  </div>
                </div>
                <h3 className="text-coffee-300 text-[11px] font-black uppercase tracking-[0.4em] mb-4 italic leading-none">{stat.label}_METRIC</h3>
                <p className="text-fluid-heading font-display font-black text-coffee-950 tracking-tightest italic leading-none uppercase">{stat.value}</p>
              </div>
              <div className="absolute top-0 right-0 w-48 h-48 bg-coffee-50/50 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2 group-hover:bg-gold-500/10 transition-colors duration-1000"></div>
            </motion.div>
          ))}
        </div>

        {/* Insights Vector */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-12">
          {/* Next Deliveries Section */}
          <div className="xl:col-span-1 bg-white p-6 md:p-12 lg:p-16 rounded-[5rem] border border-coffee-50 shadow-premium-lg relative overflow-hidden group h-fit">
            <div className="flex items-center justify-between mb-8 md:mb-16 relative z-10">
              <div className="space-y-4">
                <span className="stat-label text-gold-500">Logistics_Queue</span>
                <h2 className="text-fluid-heading font-display font-black text-coffee-950 italic uppercase tracking-tightest leading-none">Next <br/><span className="not-italic text-coffee-400">Extractions.</span></h2>
              </div>
              <div className="w-10 h-10 md:w-14 md:h-14 bg-coffee-50 rounded-2xl flex items-center justify-center text-gold-500 shadow-premium border border-coffee-100">
                <Truck size={24} strokeWidth={1} />
              </div>
            </div>

            <div className="space-y-10 relative z-10">
              {/* This would be populated from subscriptions where nextDelivery is soon */}
              {[1, 2, 3].map((_, i) => (
                <div key={i} className="p-4 md:p-8 bg-cream/50 rounded-[3rem] border border-white hover:border-gold-500/30 transition-all duration-700 group/item">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4 md:gap-6">
                      <div className="w-12 h-12 rounded-xl bg-espresso flex items-center justify-center text-caramel shadow-premium">
                        <User size={18} />
                      </div>
                      <div>
                        <p className="font-display font-black text-coffee-950 italic leading-none uppercase tracking-tight">RITUALIST_#{942 - i}</p>
                        <p className="text-[10px] font-black text-coffee-300 tracking-[0.4em] uppercase mt-2 italic">BEIRUT_LOC</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-display font-black text-gold-500 italic leading-none uppercase">MAY_{15 + i}</p>
                      <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em] italic mt-2">14:00_FLOW</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="px-5 py-2 bg-white rounded-full text-[9px] font-black uppercase tracking-widest text-coffee-400 border border-coffee-50 italic">ESPRESSO_ALLOCATION</div>
                    <div className="px-5 py-2 bg-coffee-950 text-white rounded-full text-[9px] font-black uppercase tracking-widest italic">PAID</div>
                  </div>
                </div>
              ))}
              <Link to="/admin/subscriptions" className="btn-premium w-full py-4 md:py-6 italic text-xs uppercase ring-1 ring-coffee-50 group/more">
                View Full Queue <ChevronRight size={18} className="ml-4 group-hover/more:translate-x-4 transition-transform duration-700" />
              </Link>
            </div>
          </div>

          <div className="xl:col-span-2 bg-white p-6 md:p-12 lg:p-16 rounded-[5rem] border border-coffee-50 shadow-premium-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 md:p-16 opacity-[0.03] transition-opacity duration-1000 group-hover:opacity-[0.08] pointer-events-none">
              <TrendingUp size={300} strokeWidth={0.5} />
            </div>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 md:mb-16 gap-4 md:gap-8 relative z-10">
              <div className="space-y-4">
                <span className="stat-label text-gold-500">Flux Analysis</span>
                <h2 className="text-fluid-heading font-display font-black text-coffee-950 italic uppercase tracking-tightest leading-none">Market <br/><span className="not-italic text-coffee-400">Diffusion.</span></h2>
              </div>
              <div className="flex bg-coffee-50/50 p-2 rounded-[1.5rem] border border-coffee-100 backdrop-blur-sm">
                <button className="px-6 py-3 bg-white text-coffee-950 shadow-premium rounded-xl text-[10px] font-black uppercase tracking-[0.3em] font-display italic">Cycle_7D</button>
                <button className="px-6 py-3 text-coffee-400 hover:text-coffee-950 rounded-xl text-[10px] font-black uppercase tracking-[0.3em] font-display italic transition-colors">Cycle_30D</button>
              </div>
            </div>
            <div className="h-[450px] w-full relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8c6a4d" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#d9c5b2" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '2rem', 
                      border: '1px solid rgba(140, 106, 77, 0.1)', 
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      backdropFilter: 'blur(10px)',
                      boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)',
                      padding: '1.5rem',
                      fontFamily: 'Inter, sans-serif'
                    }}
                    cursor={{ stroke: '#8c6a4d', strokeWidth: 1, strokeDasharray: '5 5' }}
                  />
                  <XAxis dataKey="name" hide />
                  <YAxis hide domain={['dataMin - 1000000', 'dataMax + 1000000']} />
                  <Area type="monotone" dataKey="revenue" stroke="#8c6a4d" strokeWidth={5} fillOpacity={1} fill="url(#colorRev)" />
                </AreaChart>
              </ResponsiveContainer>
              <div className="flex justify-between px-4 pt-8 border-t border-coffee-50/50">
                 {data.map(d => (
                   <span key={d.name} className="text-[10px] font-black text-coffee-300 uppercase tracking-[0.3em] italic">{d.name}_CYC</span>
                 ))}
              </div>
            </div>
          </div>

          <div className="bg-coffee-950 text-white p-6 md:p-12 lg:p-16 rounded-[5rem] border border-white/5 shadow-premium-xl relative overflow-hidden group">
            <div className="mesh-gradient absolute inset-0 opacity-[0.05] pointer-events-none" />
            <div className="flex items-center justify-between mb-8 md:mb-16 relative z-10">
              <div className="space-y-4">
                <span className="stat-label text-gold-500">Live_Protocol</span>
                <h2 className="text-fluid-heading font-display font-black text-white italic uppercase tracking-tightest leading-none">Extraction <br/><span className="not-italic text-coffee-500">Logging.</span></h2>
              </div>
              <button className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-gold-500 hover:bg-gold-500 hover:text-white transition-all duration-700">
                <RefreshCw size={20} className="group-hover:rotate-180 transition-transform duration-1000" />
              </button>
            </div>
            
            <div className="space-y-6 md:space-y-12 relative z-10">
              {[1, 2, 3, 4, 5].map((_, i) => (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 + 0.5 }}
                  key={i} 
                  className="flex items-center justify-between group/row border-b border-white/5 pb-8 last:border-0"
                >
                  <div className="flex items-center gap-6">
                    <div className="w-10 h-10 md:w-14 md:h-14 bg-white/5 rounded-2xl flex items-center justify-center group-hover/row:bg-gold-500 group-hover/row:text-white transition-all duration-500 shadow-xl border border-white/10">
                      <ShoppingBag size={20} strokeWidth={1} />
                    </div>
                    <div>
                      <p className="text-fluid-body font-display font-black text-white italic uppercase leading-none tracking-tight">LOG_#{842 - i}</p>
                      <p className="text-[10px] font-black text-coffee-500 uppercase tracking-[0.4em] italic mt-2">TIMESTAMP: {i + 1}M_AGO</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-fluid-body font-display font-black text-gold-500 italic tracking-tighter leading-none">{formatPrice(Math.random() * 2000000 + 400000).split('LBP')[1]}K</p>
                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em] italic mt-2">NOMINAL_AUTH</p>
                  </div>
                </motion.div>
              ))}
              <div className="pt-8">
                <Link to="/admin/orders" className="btn-premium w-full py-4 md:py-6 italic text-xs uppercase ring-1 ring-white/20 shadow-none hover:shadow-gold-500/20 group/audit">
                  Audit All Logs <ChevronRight size={18} className="ml-4 group-hover/audit:translate-x-4 transition-transform duration-700" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
