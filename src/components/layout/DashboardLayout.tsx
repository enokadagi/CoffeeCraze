import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  BarChart3, Package, Users, Settings, LogOut, LayoutDashboard,
  ShoppingBag, Building2, Star, Truck, Heart, Menu, X,
  BookOpen, MessageSquare, Shield, Palette
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSiteSettings } from '../../hooks/useSiteSettings';
import { UserRole, hasRole } from '../../types';

interface SidebarItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles?: UserRole[];
}

const SIDEBAR_ITEMS: SidebarItem[] = [
  { label: 'Operations Overview', href: '/admin', icon: LayoutDashboard, roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.PRODUCT_MANAGER, UserRole.WHOLESALE_MANAGER, UserRole.CUSTOMER_SERVICE, UserRole.ANALYST] },
  { label: 'Harvest Inventory', href: '/admin/inventory', icon: Package, roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.PRODUCT_MANAGER] },
  { label: 'Subscription Flows', href: '/admin/subscriptions', icon: Truck, roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.CUSTOMER_SERVICE] },
  { label: 'Order Pipeline', href: '/admin/orders', icon: ShoppingBag, roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.CUSTOMER_SERVICE] },
  { label: 'Customer Archive', href: '/admin/customers', icon: Users, roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.CUSTOMER_SERVICE] },
  { label: 'Wholesale Hub', href: '/admin/wholesale', icon: Building2, roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.WHOLESALE_MANAGER] },
  { label: 'Analytics Forge', href: '/admin/analytics', icon: BarChart3, roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.ANALYST, UserRole.PRODUCT_MANAGER, UserRole.WHOLESALE_MANAGER, UserRole.CUSTOMER_SERVICE] },
  { label: 'Plan Management', href: '/admin/plans', icon: Star, roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.PRODUCT_MANAGER] },
  { label: 'Content CMS', href: '/admin/cms', icon: LayoutDashboard, roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.PRODUCT_MANAGER] },
  { label: 'Blog Journal', href: '/admin/blog', icon: BookOpen, roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.PRODUCT_MANAGER] },
  { label: 'Customer Messages', href: '/admin/messages', icon: MessageSquare, roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.CUSTOMER_SERVICE] },
  { label: 'Employee Access', href: '/admin/employees', icon: Shield, roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN] },
  { label: 'Site Settings', href: '/admin/settings', icon: Palette, roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN] },

  { label: 'Ritual Overview', href: '/dashboard', icon: LayoutDashboard, roles: [UserRole.CUSTOMER, UserRole.WHOLESALE] },
  { label: 'My Orders', href: '/dashboard/orders', icon: ShoppingBag, roles: [UserRole.CUSTOMER, UserRole.WHOLESALE] },
  { label: 'Supply Line', href: '/dashboard/subscriptions', icon: Truck, roles: [UserRole.CUSTOMER, UserRole.WHOLESALE] },
  { label: 'Private Wishlist', href: '/wishlist', icon: Heart, roles: [UserRole.CUSTOMER, UserRole.WHOLESALE] },
  { label: 'Loyalty Points', href: '/dashboard/loyalty', icon: Star, roles: [UserRole.CUSTOMER, UserRole.WHOLESALE] },
  { label: 'Protocol Settings', href: '/dashboard/settings', icon: Settings, roles: [UserRole.CUSTOMER, UserRole.WHOLESALE, UserRole.ADMIN] },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { profile, logout } = useAuth();
  const siteSettings = useSiteSettings();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  const filteredItems = SIDEBAR_ITEMS.filter(item =>
    !item.roles || (profile && hasRole(profile.role, item.roles))
  );

  return (
    <div className="min-h-screen bg-cream flex" style={{ paddingTop: '64px' }}>
      <div className="mesh-gradient fixed inset-0 opacity-10 pointer-events-none" />

      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 w-64 sm:w-72 bg-espresso z-50 shadow-lg transition-transform duration-300 lg:translate-x-0 lg:static lg:block ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ paddingTop: '64px' }}
      >
        <div className="h-full flex flex-col p-4 lg:p-6 text-white/90">
          <Link to="/" className="flex items-center gap-4 mb-8 lg:mb-12 px-2 group">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl overflow-hidden border border-white/10 shadow-sm bg-white/10">
              <img src={siteSettings?.logoUrl || '/logo.png'} alt="" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="text-lg font-bold tracking-tight leading-none text-white uppercase">Coffee</div>
              <div className="text-caption text-caramel leading-none mt-1">Archive</div>
            </div>
          </Link>

          <nav className="flex-grow space-y-1 overflow-y-auto pr-1">
            <div className="text-caption text-white/50 px-3 mb-3">Workspace</div>
            {filteredItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-normal text-small font-medium ${
                    isActive
                      ? 'bg-caramel/20 text-caramel'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <item.icon size={18} strokeWidth={1.5} className={`shrink-0 ${isActive ? 'text-caramel' : ''}`} />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-6 pt-6 border-t border-white/10">
            <div className="flex items-center gap-3 p-2.5 bg-white/5 rounded-lg mb-3">
              <div className="w-9 h-9 bg-caramel rounded-lg flex items-center justify-center font-bold text-espresso shrink-0">
                {profile?.displayName?.[0] || 'U'}
              </div>
              <div className="overflow-hidden min-w-0">
                <p className="text-small font-semibold text-white truncate">{profile?.displayName}</p>
                <p className="text-caption text-caramel/80 truncate mt-0.5">
                  {profile?.role === UserRole.SUPER_ADMIN ? 'Founder'
                    : profile?.role === UserRole.ADMIN ? 'Overseer'
                    : profile?.role === UserRole.PRODUCT_MANAGER ? 'Curator'
                    : profile?.role === UserRole.WHOLESALE_MANAGER ? 'Wholesale'
                    : profile?.role === UserRole.CUSTOMER_SERVICE ? 'Support'
                    : profile?.role === UserRole.ANALYST ? 'Analyst'
                    : 'Member'}
                </p>
              </div>
            </div>
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-small font-semibold text-white/80 bg-white/10 hover:bg-caramel hover:text-espresso transition-all duration-normal"
            >
              <LogOut size={16} strokeWidth={1.5} />
              Disconnect
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        <header className="lg:hidden flex items-center justify-between px-4 h-16 bg-surface/90 backdrop-blur-md border-b border-border sticky top-0 z-30">
          <button
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            aria-label="Open sidebar"
            className="p-2.5 rounded-full text-text hover:bg-cream transition-all"
          >
            <Menu size={22} />
          </button>
          <div className="w-9 h-9 bg-cream rounded-xl flex items-center justify-center font-bold text-text text-xs">
            CC
          </div>
          <div className="w-9 h-9 rounded-full border border-border bg-cream" />
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 xl:p-12 overflow-y-auto">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
