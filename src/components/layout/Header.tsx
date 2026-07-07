import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Coffee, ShoppingCart, User, Menu, X, Heart, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useSiteSettings } from '../../hooks/useSiteSettings';
import { UserRole } from '../../types';

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, profile } = useAuth();
  const { items } = useCart();
  const { wishlistIds } = useWishlist();
  const siteSettings = useSiteSettings();
  const mobilePanelRef = useRef<HTMLDivElement>(null);
  const hamburgerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!isMobileMenuOpen) {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.left = '';
      hamburgerRef.current?.focus();
      return;
    }
    const scrollY = window.scrollY;
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    document.body.style.left = '0';
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.left = '';
      window.scrollTo(0, scrollY);
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const panel = mobilePanelRef.current;
    if (!panel) return;
    const focusable = panel.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    first?.focus();
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last?.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
    };
    panel.addEventListener('keydown', handler);
    return () => panel.removeEventListener('keydown', handler);
  }, [isMobileMenuOpen]);

  const navLinks = [
    { name: 'Collections', path: '/shop' },
    { name: 'Subscriptions', path: '/subscriptions' },
    { name: 'Journal', path: '/about' },
    { name: 'Blog', path: '/blog' },
    { name: 'FAQ', path: '/faq' },
  ];

  const isStaff = profile?.role === UserRole.ADMIN || profile?.role === UserRole.SUPER_ADMIN || profile?.role === UserRole.PRODUCT_MANAGER || profile?.role === UserRole.WHOLESALE_MANAGER || profile?.role === UserRole.CUSTOMER_SERVICE || profile?.role === UserRole.ANALYST;
  const dashboardPath = isStaff ? '/admin' : '/dashboard';

  return (
    <>
      <header
        role="banner"
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled
            ? 'bg-surface/95 backdrop-blur-xl shadow-sm border-b border-border'
            : 'bg-transparent border-b border-transparent'
        }`}
        style={{ padding: '12px 20px' }}
      >
        <div className="max-w-[1800px] mx-auto flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3 shrink-0" aria-label="CoffeeCraze Home">
            <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-border-light shadow-sm">
              <img src={siteSettings?.logoUrl || '/logo.png'} alt="" className="w-full h-full object-cover" />
            </div>
          </Link>

          <nav aria-label="Main navigation" className="hidden lg:flex items-center gap-8 xl:gap-12">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className="text-sm font-semibold tracking-wide text-text hover:text-caramel transition-colors duration-normal hover-lift"
              >
                {link.name}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/wishlist"
              aria-label={`Wishlist (${wishlistIds.length} items)`}
              className="relative p-2.5 rounded-full transition-all duration-normal text-text-secondary hover:text-caramel hover:bg-cream hidden md:flex"
            >
              <Heart className={`w-5 h-5 transition-transform hover:scale-110 ${wishlistIds.length > 0 ? 'fill-caramel text-caramel' : ''}`} />
              {wishlistIds.length > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-caramel text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs">
                  {wishlistIds.length}
                </span>
              )}
            </Link>

            <Link
              to="/cart"
              aria-label={`Shopping cart (${items.length} items)`}
              className="relative p-2.5 rounded-full transition-all duration-normal text-text-secondary hover:text-caramel hover:bg-cream"
            >
              <ShoppingCart className="w-5 h-5 transition-transform hover:scale-110" />
              <AnimatePresence>
                {items.length > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute top-0 right-0 w-4 h-4 bg-caramel text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs"
                  >
                    {items.length}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>

            <div className="hidden lg:block w-px h-5 bg-border mx-1" />

            {user ? (
              <Link
                to={dashboardPath}
                className="flex items-center gap-2 pl-3 pr-1 py-1 rounded-full transition-all duration-normal border border-border-light bg-surface/50 hover:bg-cream hover-lift"
              >
                <span className="hidden xl:block text-caption text-text-secondary mr-1">
                  {profile?.displayName?.split(' ')[0]}
                </span>
                <div className="w-8 h-8 rounded-full bg-cream text-text flex items-center justify-center shadow-xs">
                  <User size={15} />
                </div>
              </Link>
            ) : (
              <Link to="/auth" className="btn btn-primary btn-sm">
                Sign In
              </Link>
            )}

            <button
              ref={hamburgerRef}
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMobileMenuOpen}
              className="lg:hidden w-10 h-10 flex items-center justify-center rounded-full transition-all duration-normal text-text hover:bg-cream"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[998] lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-hidden="true"
            />

            <motion.div
              ref={mobilePanelRef}
              initial={{ opacity: 0, x: '100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '100%' }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
              className="fixed top-0 right-0 bottom-0 w-full sm:max-w-[420px] bg-surface z-[1000] flex flex-col shadow-xl lg:hidden overflow-y-auto"
              style={{ touchAction: 'pan-y' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute inset-0 mesh-gradient opacity-[0.06] pointer-events-none" />

              <button
                className="absolute top-5 right-5 w-10 h-10 flex items-center justify-center rounded-full text-text-muted hover:text-text hover:bg-cream transition-colors z-10"
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                <X size={22} />
              </button>

              <div className="flex flex-col min-h-full px-8 pt-20 pb-10 gap-8 relative z-10">
                <nav aria-label="Mobile navigation" className="flex-1 flex flex-col justify-center gap-2">
                  {navLinks.map((link, i) => (
                    <motion.div
                      key={link.name}
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.08 * i + 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <Link
                        to={link.path}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="text-2xl font-bold text-text tracking-tight flex items-center justify-between py-4 border-b border-border group hover:text-caramel transition-colors duration-normal"
                      >
                        <span>{link.name}</span>
                        <ArrowRight className="opacity-0 group-hover:opacity-100 transition-all -translate-x-4 group-hover:translate-x-0 text-caramel w-5 h-5" />
                      </Link>
                    </motion.div>
                  ))}
                </nav>

                <div className="flex flex-col gap-6 pt-6 border-t border-border">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="space-y-3"
                  >
                    <span className="text-caption text-text-muted block">Account</span>
                    <div className="flex flex-col gap-2">
                      <Link
                        to={user ? dashboardPath : '/auth'}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="text-base font-semibold tracking-tight text-text hover:text-caramel transition-colors"
                      >
                        {user ? 'Dashboard' : 'Sign In'}
                      </Link>
                      <Link
                        to="/cart"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="text-base font-semibold tracking-tight text-text hover:text-caramel transition-colors"
                      >
                        Cart {items.length > 0 && `(${items.length})`}
                      </Link>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="flex items-center justify-between text-text-muted"
                  >
                    <div>
                      <p className="text-caption mb-1">Current Time</p>
                      <p className="text-small font-medium opacity-60">
                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} UTC
                      </p>
                    </div>
                    <div className="w-10 h-10 bg-cream rounded-full flex items-center justify-center text-caramel">
                      <Coffee size={14} />
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
