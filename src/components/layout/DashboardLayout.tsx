import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  BarChart3,
  Package,
  Users,
  Settings,
  LogOut,
  LayoutDashboard,
  ShoppingBag,
  Building2,
  Star,
  Truck,
  Heart,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface SidebarItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles?: UserRole[];
}

const SIDEBAR_ITEMS: SidebarItem[] = [
  { label: 'Operations Overview', href: '/admin', icon: LayoutDashboard, roles: [UserRole.ADMIN] },
  { label: 'Harvest Inventory', href: '/admin/inventory', icon: Package, roles: [UserRole.ADMIN] },
  { label: 'Subscription Flows', href: '/admin/subscriptions', icon: Truck, roles: [UserRole.ADMIN] },
  { label: 'Order Pipeline', href: '/admin/orders', icon: ShoppingBag, roles: [UserRole.ADMIN] },
  { label: 'Customer Archive', href: '/admin/customers', icon: Users, roles: [UserRole.ADMIN] },
  { label: 'Wholesale Hub', href: '/admin/wholesale', icon: Building2, roles: [UserRole.ADMIN] },
  { label: 'Analytics Forge', href: '/admin/analytics', icon: BarChart3, roles: [UserRole.ADMIN] },

  { label: 'Ritual Overview', href: '/dashboard', icon: LayoutDashboard, roles: [UserRole.CUSTOMER, UserRole.WHOLESALE] },
  { label: 'My Orders', href: '/dashboard/orders', icon: ShoppingBag, roles: [UserRole.CUSTOMER, UserRole.WHOLESALE] },
  { label: 'Supply Line', href: '/dashboard/subscriptions', icon: Truck, roles: [UserRole.CUSTOMER, UserRole.WHOLESALE] },
  { label: 'Private Wishlist', href: '/wishlist', icon: Heart, roles: [UserRole.CUSTOMER, UserRole.WHOLESALE] },
  { label: 'Loyalty Points', href: '/dashboard/loyalty', icon: Star, roles: [UserRole.CUSTOMER, UserRole.WHOLESALE] },
  { label: 'Protocol Settings', href: '/dashboard/settings', icon: Settings, roles: [UserRole.CUSTOMER, UserRole.WHOLESALE, UserRole.ADMIN] },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { profile, logout } = useAuth();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  const filteredItems = SIDEBAR_ITEMS.filter(item =>
    !item.roles || (profile && item.roles.includes(profile.role))
  );

  return (
    <div className="min-h-screen bg-cream flex pt-16 sm:pt-20 lg:pt-24">
      <div className="mesh-gradient fixed inset-0 opacity-10 pointer-events-none" />

      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-espresso/60 backdrop-blur-xl z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside className={cn(
        "fixed inset-y-0 left-0 w-72 sm:w-80 bg-white/80 backdrop-blur-3xl border-r border-white shadow-premium-xl z-50 transition-all duration-1000 lg:translate-x-0 lg:static lg:block pt-20 sm:pt-24",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 xl:p-10">
          <Link to="/" className="flex items-center gap-4 sm:gap-6 mb-8 sm:mb-12 lg:mb-16 px-2 sm:px-4 group">
            <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-espresso rounded-[1.2rem] sm:rounded-[1.5rem] flex items-center justify-center font-display font-black text-white shadow-premium-lg transition-transform group-hover:rotate-12 duration-700">
              CC
            </div>
            <div>
              <div className="text-lg sm:text-xl font-display font-black tracking-tightest leading-none text-espresso italic uppercase">Coffee</div>
              <div className="text-[8px] sm:text-[9px] lg:text-[10px] font-black text-caramel tracking-[0.3em] sm:tracking-[0.4em] leading-none mt-1 uppercase italic">Archive</div>
            </div>
          </Link>

          <nav className="flex-grow space-y-2 sm:space-y-3 lg:space-y-4 overflow-y-auto pr-2 sm:pr-4">
            <div className="text-[9px] sm:text-[10px] lg:text-[11px] font-black uppercase tracking-[0.6em] sm:tracking-[0.8em] text-coffee-200 mb-6 sm:mb-8 lg:mb-10 px-4 sm:px-6 italic">Workspace</div>
            {filteredItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setIsSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-4 sm:gap-6 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-5 xl:py-6 rounded-[1.5rem] sm:rounded-[2rem] transition-all duration-700 text-[9px] sm:text-[10px] lg:text-[11px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] italic group relative overflow-hidden",
                  location.pathname === item.href
                    ? "bg-espresso text-white shadow-premium-xl scale-[1.02]"
                    : "text-coffee-400 hover:bg-cream hover:text-espresso border border-transparent hover:border-white/60"
                )}
              >
                <item.icon size={20} strokeWidth={1.5} className={cn("shrink-0 transition-transform duration-700", location.pathname === item.href ? "text-caramel-gold" : "group-hover:rotate-12")} />
                <span className="relative z-10">{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-espresso/5">
            <div className="flex items-center gap-4 sm:gap-6 p-3 sm:p-4 lg:p-5 xl:p-6 bg-cream rounded-[1.5rem] sm:rounded-[2rem] lg:rounded-[2.5rem] border border-white shadow-premium mb-4 sm:mb-6 group hover-premium transition-all duration-700">
              <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-espresso text-caramel-gold rounded-[1rem] sm:rounded-[1.2rem] flex items-center justify-center font-black text-lg sm:text-xl lg:text-2xl italic shadow-premium shrink-0 group-hover:rotate-6 transition-transform">
                {profile?.displayName?.[0] || 'U'}
              </div>
              <div className="overflow-hidden min-w-0">
                <p className="text-xs sm:text-sm font-black text-espresso truncate uppercase tracking-tight italic">{profile?.displayName}</p>
                <p className="text-[8px] sm:text-[9px] lg:text-[10px] text-caramel font-black truncate uppercase mt-0.5 sm:mt-1 tracking-[0.1em] sm:tracking-[0.2em] italic opacity-60">{profile?.role}_UNIT</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="w-full flex items-center gap-4 sm:gap-6 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-5 rounded-[1.5rem] sm:rounded-[2rem] text-[9px] sm:text-[10px] lg:text-[11px] font-black uppercase tracking-[0.3em] sm:tracking-[0.4em] text-red-400 hover:bg-red-50 hover:text-red-600 transition-all italic border border-transparent hover:border-red-100"
            >
              <LogOut size={20} strokeWidth={1.5} />
              Disconnect
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        <header className="lg:hidden h-16 sm:h-20 bg-white/80 backdrop-blur-xl border-b border-coffee-50 flex items-center justify-between px-4 sm:px-8 sticky top-16 sm:top-20 z-30">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 sm:p-3 text-espresso hover:bg-cream rounded-2xl transition-all">
            <Menu size={24} />
          </button>
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-espresso rounded-[0.8rem] sm:rounded-[1rem] flex items-center justify-center font-display font-black text-white text-xs sm:text-sm">
            CC
          </div>
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-white shadow-premium bg-cream" />
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 xl:p-12 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
