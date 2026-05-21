import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Coffee, ShoppingCart, User, Menu, X, Heart, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { cn } from '../../lib/utils';
import { UserRole } from '../../types';

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, profile } = useAuth();
  const { items } = useCart();
  const { wishlistIds } = useWishlist();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'COLLECTIONS', path: '/shop' },
    { name: 'RITUALS', path: '/subscriptions' },
    { name: 'JOURNAL', path: '/about' },
    { name: 'BLOG', path: '/blog' },
    { name: 'FAQ', path: '/faq' },
  ];

  const dashboardPath = profile?.role === UserRole.ADMIN ? '/admin' : '/dashboard';

  return (
    <header
      role="banner"
      className="fixed top-0 left-0 right-0 z-50 bg-espresso/95 backdrop-blur-3xl shadow-premium py-3 sm:py-4 lg:py-4 px-4 sm:px-8 lg:px-12 border-b border-white/5"
    >
      <div className="max-w-[1800px] mx-auto flex flex-wrap items-center justify-between gap-2 sm:gap-4">
        <Link to="/" className="flex items-center gap-3 shrink-0" aria-label="CoffeeCraze Home">
          <div className={cn(
            "w-10 h-10 sm:w-11 sm:h-11 lg:w-12 lg:h-12 rounded-full flex items-center justify-center font-display font-black text-sm sm:text-lg lg:text-2xl shadow-premium-lg border-2 relative overflow-hidden",
            isScrolled ? "bg-cream/10 text-cream border-cream/20" : "bg-cream/10 text-cream border-cream/10"
          )}>
            <span className="relative z-10">CC</span>
          </div>
          <span className="sr-only">CoffeeCraze</span>
        </Link>

        <nav aria-label="Main navigation" className="hidden lg:flex items-center gap-6 xl:gap-10">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className="text-xs xl:text-sm font-semibold uppercase tracking-[0.12em] xl:tracking-[0.15em] transition-all duration-500 relative group text-cream/80 hover:text-cream"
            >
              <span className="relative z-10">{link.name}</span>
              <span className="absolute -bottom-1.5 left-0 w-0 h-px bg-caramel-gold transition-all duration-500 group-hover:w-full" />
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3 lg:gap-6">
          <div className="flex items-center gap-0 sm:gap-1">
            <Link to="/wishlist" aria-label={`Wishlist (${wishlistIds.length} items)`} className="relative p-2 sm:p-2.5 lg:p-3 rounded-2xl transition-all duration-500 hidden md:flex group text-cream/70 hover:text-cream bg-white/5 border border-white/10 hover:bg-white/10">
              <Heart className={cn("w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:scale-110", wishlistIds.length > 0 ? "fill-caramel text-caramel" : "text-cream/70")} />
              {wishlistIds.length > 0 && (
                <span className="absolute top-0.5 right-0.5 bg-cream text-espresso text-[7px] sm:text-[8px] w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full flex items-center justify-center font-black shadow-lg">
                  {wishlistIds.length}
                </span>
              )}
            </Link>

            <Link to="/cart" aria-label={`Shopping cart (${items.length} items)`} className="relative p-2 sm:p-2.5 lg:p-3 rounded-2xl transition-all duration-500 group text-cream/70 hover:text-cream bg-white/5 border border-white/10 hover:bg-white/10">
              <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:scale-110" />
              <AnimatePresence>
                {items.length > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className={cn(
                      "absolute top-0.5 right-0.5 text-[7px] sm:text-[8px] w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full flex items-center justify-center font-black shadow-lg",
                      isScrolled ? "bg-cream text-espresso" : "bg-cream text-espresso"
                    )}
                  >
                    {items.length}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          </div>

          <div className={cn(
            "h-3 sm:h-4 w-px mx-0 sm:mx-1 hidden lg:block transition-colors duration-1000",
            isScrolled ? "bg-coffee-100" : "bg-white/10"
          )}></div>

          {user ? (
            <Link
              to={dashboardPath}
              className="flex items-center gap-2 sm:gap-3 py-1 sm:py-1.5 pl-3 sm:pl-4 lg:pl-5 pr-1 sm:pr-1.5 rounded-full transition-all duration-1000 group border border-cream/15 bg-white/5 hover:bg-white/10 active:scale-95 shadow-premium"
            >
              <div className="text-right leading-none hidden xl:block space-y-0.5 mr-1 sm:mr-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-cream">
                  {profile?.displayName?.split(' ')[0]}
                </p>
                <p className="text-[10px] font-medium text-caramel uppercase tracking-wide opacity-80">
                  {profile?.role === UserRole.ADMIN ? 'OVERSEER' : 'CITIZEN'}
                </p>
              </div>
              <div className={cn(
                "w-7 h-7 sm:w-8 sm:h-8 lg:w-9 lg:h-9 rounded-full flex items-center justify-center shadow-lg transition-all duration-1000",
                isScrolled ? "bg-cream text-espresso" : "bg-mocha text-cream"
              )}>
                <User size={16} />
              </div>
            </Link>
          ) : (
            <Link
              to="/auth"
              className="px-5 sm:px-7 lg:px-9 py-2 sm:py-2.5 lg:py-3 rounded-full text-[11px] sm:text-xs font-semibold uppercase tracking-[0.08em] transition-all duration-500 shadow-premium bg-cream/10 text-cream hover:bg-cream"
            >
              Access
            </Link>
          )}

          <button
            aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isMobileMenuOpen}
            className={cn(
              "lg:hidden w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 flex items-center justify-center rounded-2xl transition-all duration-500 relative z-[70]",
              isScrolled ? "text-white" : "text-white"
            )}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} strokeWidth={1.5} /> : <Menu size={24} strokeWidth={1.5} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-espresso/60 backdrop-blur-md z-[60] lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, x: "100%" }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: "100%" }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="fixed top-0 bottom-0 right-0 w-full sm:w-[420px] bg-espresso z-[60] flex flex-col px-6 sm:px-8 lg:px-12 py-20 sm:py-24 shadow-2xl lg:hidden overflow-y-auto"
            >
              <div className="absolute inset-0 mesh-gradient opacity-[0.08] pointer-events-none" />
              <button
                className="absolute top-4 sm:top-6 right-4 sm:right-6 w-8 sm:w-10 h-8 sm:h-10 flex items-center justify-center rounded-2xl text-white/50 hover:text-white transition-colors z-[70]"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <X size={24} strokeWidth={1.5} />
              </button>

              <nav aria-label="Mobile navigation" className="space-y-2 sm:space-y-3 relative z-10 mt-4 sm:mt-8">
                {[...navLinks, { name: 'BLOG', path: '/blog' }, { name: 'FAQ', path: '/faq' }].map((link, i) => (
                  <motion.div
                    key={link.name}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * i + 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <Link
                      to={link.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-2xl sm:text-3xl font-display font-bold text-cream tracking-tight leading-none block uppercase hover:text-caramel transition-all duration-500 group flex items-center justify-between py-2 border-b border-white/10"
                    >
                      <span>{link.name}.</span>
                      <ArrowRight className="opacity-0 group-hover:opacity-100 transition-all -translate-x-4 group-hover:translate-x-0 text-caramel w-4 h-4 sm:w-5 sm:h-5" />
                    </Link>
                  </motion.div>
                ))}
              </nav>

              <div className="mt-auto pt-8 sm:pt-12 relative z-10 flex flex-col gap-6 sm:gap-10">
                 <motion.div
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: 0.4 }}
                   className="space-y-4 sm:space-y-6"
                 >
                   <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-coffee-500 block">Connected Protocols</span>
                   <div className="flex flex-col gap-3 sm:gap-4">
                     <Link
                      to={user ? dashboardPath : "/auth"}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-base sm:text-lg font-display font-semibold tracking-tight uppercase text-white hover:text-caramel transition-colors"
                     >
                      {user ? 'Dashboard' : 'Member Login'}
                     </Link>
                     <Link
                      to="/cart"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-base sm:text-lg font-display font-semibold tracking-tight uppercase text-white hover:text-caramel transition-colors"
                     >
                      Inventory Gate
                     </Link>
                   </div>
                 </motion.div>

                 <motion.div
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   transition={{ delay: 0.5 }}
                   className="flex items-center justify-between"
                 >
                    <div>
                      <p className="text-[10px] font-semibold text-coffee-600 uppercase tracking-[0.15em] mb-1">System Clock</p>
                      <p className="text-xs font-display font-medium text-white/40 uppercase tracking-wider leading-none">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} UTC</p>
                    </div>
                    <div className="w-8 sm:w-10 h-8 sm:h-10 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-caramel">
                      <Coffee size={14} strokeWidth={1} />
                    </div>
                 </motion.div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
