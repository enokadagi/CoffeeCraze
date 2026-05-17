import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import Home from './pages/Home';
import Shop from './pages/Shop';
import Subscriptions from './pages/Subscriptions';
import AiBarista from './pages/AiBarista';
import Auth from './pages/Auth';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import DashboardOverview from './pages/Dashboard/Overview';
import MyOrders from './pages/Dashboard/Orders';
import AccountSettings from './pages/Dashboard/Settings';
import DashboardSubscriptions from './pages/Dashboard/Subscriptions';
import LoyaltyRitual from './pages/Dashboard/Loyalty';
import Wholesale from './pages/Wholesale';
import ProductDetail from './pages/ProductDetail';
import Wishlist from './pages/Wishlist';
import CategoryProducts from './pages/CategoryProducts';
import About from './pages/About';
import Contact from './pages/Contact';
import CoffeeQuiz from './pages/CoffeeQuiz';
import AdminDashboard from './pages/Admin/Dashboard';
import AdminInventory from './pages/Admin/Inventory';
import AdminOrders from './pages/Admin/Orders';
import AdminAnalytics from './pages/Admin/Analytics';
import AdminCustomers from './pages/Admin/Customers';
import AdminWholesale from './pages/Admin/Wholesale';
import AdminSubscriptions from './pages/Admin/Subscriptions';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { Toaster } from 'sonner';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { UserRole } from './types';
import PageTransition from './components/layout/PageTransition';

function AppContent() {
  const location = useLocation();

  return (
    <div className="flex flex-col min-h-screen font-sans">
      <Toaster position="bottom-right" richColors />
      <Header />
      <main className="flex-grow">
        <AnimatePresence mode="wait" initial={false}>
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<PageTransition><Home /></PageTransition>} />
            <Route path="/shop" element={<PageTransition><Shop /></PageTransition>} />
            <Route path="/category/:category" element={<PageTransition><CategoryProducts /></PageTransition>} />
            <Route path="/subscriptions" element={<PageTransition><Subscriptions /></PageTransition>} />
            <Route path="/ai-barista" element={<AiBarista />} />
            <Route path="/coffee-quiz" element={<PageTransition><CoffeeQuiz /></PageTransition>} />
            <Route path="/about" element={<PageTransition><About /></PageTransition>} />
            <Route path="/contact" element={<PageTransition><Contact /></PageTransition>} />
            <Route path="/auth" element={<PageTransition><Auth /></PageTransition>} />
            <Route path="/cart" element={<PageTransition><Cart /></PageTransition>} />
            <Route path="/checkout" element={<ProtectedRoute><PageTransition><Checkout /></PageTransition></ProtectedRoute>} />
            <Route path="/order-success/:id" element={<ProtectedRoute><PageTransition><OrderSuccess /></PageTransition></ProtectedRoute>} />
            <Route path="/wishlist" element={<ProtectedRoute><PageTransition><Wishlist /></PageTransition></ProtectedRoute>} />
            <Route path="/wholesale" element={<PageTransition><Wholesale /></PageTransition>} />
            <Route path="/product/:id" element={<PageTransition><ProductDetail /></PageTransition>} />
            
            {/* Dashboard Routes */}
            <Route path="/dashboard" element={<ProtectedRoute><PageTransition><DashboardOverview /></PageTransition></ProtectedRoute>} />
            <Route path="/dashboard/orders" element={<ProtectedRoute><PageTransition><MyOrders /></PageTransition></ProtectedRoute>} />
            <Route path="/dashboard/subscriptions" element={<ProtectedRoute><PageTransition><DashboardSubscriptions /></PageTransition></ProtectedRoute>} />
            <Route path="/dashboard/loyalty" element={<ProtectedRoute><PageTransition><LoyaltyRitual /></PageTransition></ProtectedRoute>} />
            <Route path="/dashboard/settings" element={<ProtectedRoute><PageTransition><AccountSettings /></PageTransition></ProtectedRoute>} />

            {/* Admin Routes */}
            <Route path="/admin" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]}><PageTransition><AdminDashboard /></PageTransition></ProtectedRoute>} />
            <Route path="/admin/inventory" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]}><PageTransition><AdminInventory /></PageTransition></ProtectedRoute>} />
            <Route path="/admin/orders" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]}><PageTransition><AdminOrders /></PageTransition></ProtectedRoute>} />
            <Route path="/admin/analytics" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]}><PageTransition><AdminAnalytics /></PageTransition></ProtectedRoute>} />
            <Route path="/admin/customers" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]}><PageTransition><AdminCustomers /></PageTransition></ProtectedRoute>} />
            <Route path="/admin/wholesale" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]}><PageTransition><AdminWholesale /></PageTransition></ProtectedRoute>} />
            <Route path="/admin/subscriptions" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]}><PageTransition><AdminSubscriptions /></PageTransition></ProtectedRoute>} />
          </Routes>
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <WishlistProvider>
          <CartProvider>
            <AppContent />
          </CartProvider>
        </WishlistProvider>
      </AuthProvider>
    </Router>
  );
}
