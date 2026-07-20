import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import { Suspense, lazy, useEffect, type ReactNode } from 'react';
import ErrorBoundary from './components/common/ErrorBoundary';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import PwaInstallPrompt from './components/common/PwaInstallPrompt';
import { useSiteSettings, applySiteSettings } from './hooks/useSiteSettings';
import Home from './pages/Home';
// Lazy load all non-critical route pages for smaller initial bundle sizes.
const Shop = lazy(() => import('./pages/Shop'));
const Subscriptions = lazy(() => import('./pages/Subscriptions'));
const AiBarista = lazy(() => import('./pages/AiBarista'));
const Auth = lazy(() => import('./pages/Auth'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const OrderSuccess = lazy(() => import('./pages/OrderSuccess'));
const SubscriptionConfirmation = lazy(() => import('./pages/SubscriptionConfirmation'));
const Wholesale = lazy(() => import('./pages/Wholesale'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Wishlist = lazy(() => import('./pages/Wishlist'));
const CategoryProducts = lazy(() => import('./pages/CategoryProducts'));
const About = lazy(() => import('./pages/About'));
const Blog = lazy(() => import('./pages/Blog'));
const FAQ = lazy(() => import('./pages/FAQ'));
const Contact = lazy(() => import('./pages/Contact'));
const CoffeeQuiz = lazy(() => import('./pages/CoffeeQuiz'));
const NotFound = lazy(() => import('./pages/NotFound'));
const CustomPlanBuilder = lazy(() => import('./pages/CustomPlanBuilder'));

// Lazy-loaded dashboard and admin routes for code splitting
const DashboardOverview = lazy(() => import('./pages/Dashboard/Overview'));
const MyOrders = lazy(() => import('./pages/Dashboard/Orders'));
const AccountSettings = lazy(() => import('./pages/Dashboard/Settings'));
const DashboardSubscriptions = lazy(() => import('./pages/Dashboard/Subscriptions'));
const LoyaltyRitual = lazy(() => import('./pages/Dashboard/Loyalty'));
const AdminDashboard = lazy(() => import('./pages/Admin/Dashboard'));
const AdminInventory = lazy(() => import('./pages/Admin/Inventory'));
const AdminOrders = lazy(() => import('./pages/Admin/Orders'));
const AdminAnalytics = lazy(() => import('./pages/Admin/Analytics'));
const AdminCustomers = lazy(() => import('./pages/Admin/Customers'));
const AdminWholesale = lazy(() => import('./pages/Admin/Wholesale'));
const AdminSubscriptions = lazy(() => import('./pages/Admin/Subscriptions'));
const AdminPlans = lazy(() => import('./pages/Admin/Plans'));
const AdminCMS = lazy(() => import('./pages/Admin/CMS'));
const BlogDetail = lazy(() => import('./pages/BlogDetail'));
const AdminBlog = lazy(() => import('./pages/Admin/Blog'));
const AdminMessages = lazy(() => import('./pages/Admin/Messages'));
const AdminEmployees = lazy(() => import('./pages/Admin/Employees'));
const AdminSiteSettings = lazy(() => import('./pages/Admin/SiteSettings'));
const DriverDashboard = lazy(() => import('./pages/Driver/Dashboard'));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-transparent">
    <div className="w-8 h-8 border-2 border-espresso/10 border-t-espresso rounded-full animate-spin" />
  </div>
);
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { Toaster } from 'sonner';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { UserRole } from './types';
import PageTransition from './components/layout/PageTransition';
import ScrollToTop from './components/layout/ScrollToTop';

const LazyPage = ({ children }: { children: ReactNode }) => (
  <ErrorBoundary>
    <Suspense fallback={<PageLoader />}>
      <PageTransition>{children}</PageTransition>
    </Suspense>
  </ErrorBoundary>
);


function AppContent() {
  const location = useLocation();
  const siteSettings = useSiteSettings();
  const navigate = useNavigate();

  useEffect(() => {
    if (siteSettings) applySiteSettings(siteSettings);
  }, [siteSettings]);

  useEffect(() => {
    const redirect = sessionStorage.getItem('spa_redirect');
    if (redirect) {
      sessionStorage.removeItem('spa_redirect');
      // Navigate to the correct page using client router, preventing layout refresh issues.
      navigate(redirect, { replace: true });
    }
  }, [navigate]);

  return (
    <div className="flex flex-col min-h-screen font-sans">
      <ScrollToTop />
      <Toaster position="bottom-right" richColors />
      <PwaInstallPrompt />
      <Header />
      <a href="#main-content" className="skip-to-content">Skip to main content</a>
      <main id="main-content" className="flex-grow">
        <AnimatePresence mode="wait" initial={false}>
          <Routes location={location} key={location.pathname}>

            <Route path="/" element={<ErrorBoundary><PageTransition><Home /></PageTransition></ErrorBoundary>} />
            <Route path="/shop" element={<LazyPage><Shop /></LazyPage>} />
            <Route path="/category/:category" element={<LazyPage><CategoryProducts /></LazyPage>} />
            <Route path="/subscriptions" element={<LazyPage><Subscriptions /></LazyPage>} />
            <Route path="/ai-barista" element={<LazyPage><AiBarista /></LazyPage>} />
            <Route path="/coffee-quiz" element={<LazyPage><CoffeeQuiz /></LazyPage>} />
            <Route path="/about" element={<LazyPage><About /></LazyPage>} />
            <Route path="/blog" element={<LazyPage><Blog /></LazyPage>} />
            <Route path="/faq" element={<LazyPage><FAQ /></LazyPage>} />
            <Route path="/contact" element={<LazyPage><Contact /></LazyPage>} />
            <Route path="/auth" element={<LazyPage><Auth /></LazyPage>} />
            <Route path="/cart" element={<LazyPage><Cart /></LazyPage>} />
            <Route path="/checkout" element={<ProtectedRoute><LazyPage><Checkout /></LazyPage></ProtectedRoute>} />
            <Route path="/order-success/:id" element={<ProtectedRoute><LazyPage><OrderSuccess /></LazyPage></ProtectedRoute>} />
            <Route path="/subscription/confirmation" element={<ProtectedRoute><LazyPage><SubscriptionConfirmation /></LazyPage></ProtectedRoute>} />
            <Route path="/wishlist" element={<ProtectedRoute><LazyPage><Wishlist /></LazyPage></ProtectedRoute>} />
            <Route path="/wholesale" element={<LazyPage><Wholesale /></LazyPage>} />
            <Route path="/product/:id" element={<LazyPage><ProductDetail /></LazyPage>} />
            <Route path="/blog/:id" element={<LazyPage><BlogDetail /></LazyPage>} />
            <Route path="/custom-plan-builder" element={<ProtectedRoute><LazyPage><CustomPlanBuilder /></LazyPage></ProtectedRoute>} />
            <Route path="*" element={<LazyPage><NotFound /></LazyPage>} />
            
            {/* Dashboard Routes */}
            <Route path="/dashboard" element={<ProtectedRoute><LazyPage><DashboardOverview /></LazyPage></ProtectedRoute>} />
            <Route path="/dashboard/orders" element={<ProtectedRoute><LazyPage><MyOrders /></LazyPage></ProtectedRoute>} />
            <Route path="/dashboard/subscriptions" element={<ProtectedRoute><LazyPage><DashboardSubscriptions /></LazyPage></ProtectedRoute>} />
            <Route path="/dashboard/loyalty" element={<ProtectedRoute><LazyPage><LoyaltyRitual /></LazyPage></ProtectedRoute>} />
            <Route path="/dashboard/settings" element={<ProtectedRoute><LazyPage><AccountSettings /></LazyPage></ProtectedRoute>} />

            {/* Admin Routes — granular RBAC */}
            <Route path="/admin" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.PRODUCT_MANAGER, UserRole.WHOLESALE_MANAGER, UserRole.CUSTOMER_SERVICE, UserRole.ANALYST, UserRole.SUPER_ADMIN]}><LazyPage><AdminDashboard /></LazyPage></ProtectedRoute>} />
            <Route path="/admin/inventory" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.PRODUCT_MANAGER, UserRole.SUPER_ADMIN]}><LazyPage><AdminInventory /></LazyPage></ProtectedRoute>} />
            <Route path="/admin/orders" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.CUSTOMER_SERVICE, UserRole.SUPER_ADMIN]}><LazyPage><AdminOrders /></LazyPage></ProtectedRoute>} />
            <Route path="/admin/analytics" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.ANALYST, UserRole.PRODUCT_MANAGER, UserRole.WHOLESALE_MANAGER, UserRole.CUSTOMER_SERVICE, UserRole.SUPER_ADMIN]}><LazyPage><AdminAnalytics /></LazyPage></ProtectedRoute>} />
            <Route path="/admin/customers" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.CUSTOMER_SERVICE, UserRole.SUPER_ADMIN]}><LazyPage><AdminCustomers /></LazyPage></ProtectedRoute>} />
            <Route path="/admin/wholesale" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.WHOLESALE_MANAGER, UserRole.SUPER_ADMIN]}><LazyPage><AdminWholesale /></LazyPage></ProtectedRoute>} />
            <Route path="/admin/subscriptions" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.CUSTOMER_SERVICE, UserRole.SUPER_ADMIN]}><LazyPage><AdminSubscriptions /></LazyPage></ProtectedRoute>} />
            <Route path="/admin/plans" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.PRODUCT_MANAGER, UserRole.SUPER_ADMIN]}><LazyPage><AdminPlans /></LazyPage></ProtectedRoute>} />
            <Route path="/admin/cms" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.PRODUCT_MANAGER, UserRole.SUPER_ADMIN]}><LazyPage><AdminCMS /></LazyPage></ProtectedRoute>} />
            <Route path="/admin/blog" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.PRODUCT_MANAGER, UserRole.SUPER_ADMIN]}><LazyPage><AdminBlog /></LazyPage></ProtectedRoute>} />
            <Route path="/admin/messages" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.CUSTOMER_SERVICE, UserRole.SUPER_ADMIN]}><LazyPage><AdminMessages /></LazyPage></ProtectedRoute>} />
            <Route path="/admin/employees" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.SUPER_ADMIN]}><LazyPage><AdminEmployees /></LazyPage></ProtectedRoute>} />
            <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.SUPER_ADMIN]}><LazyPage><AdminSiteSettings /></LazyPage></ProtectedRoute>} />

            {/* Driver Route */}
            <Route path="/driver" element={<ProtectedRoute allowedRoles={[UserRole.DRIVER, UserRole.ADMIN, UserRole.SUPER_ADMIN]}><LazyPage><DriverDashboard /></LazyPage></ProtectedRoute>} />
          </Routes>
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <WishlistProvider>
            <CartProvider>
              <AppContent />
            </CartProvider>
          </WishlistProvider>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}
