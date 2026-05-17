import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Coffee, ShoppingCart, User, Menu, X, LogIn, Heart, ArrowRight } from 'lucide-react';
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
  ];

  const dashboardPath = profile?.role === UserRole.ADMIN ? '/admin' : '/dashboard';

  return (
    <header 
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-1000 px-6 md:px-12",
        isScrolled ? "bg-espresso shadow-premium py-3 md:py-4" : "bg-transparent py-4 md:py-8"
      )}
    >
      <div className="max-w-[1800px] mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-4 group">
          <div className={cn(
            "w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center font-display font-black text-2xl transition-all duration-1000 group-hover:rotate-[360deg] shadow-premium-lg border-2 relative overflow-hidden",
            isScrolled ? "bg-white text-espresso border-white/20" : "bg-white text-espresso border-white/40"
          )}>
            <span className="relative z-10 scale-90">CC</span>
          </div>
          <div className="hidden sm:block">
            <div className={cn(
              "text-[12px] font-black tracking-[0.8em] leading-none uppercase transition-colors duration-1000 italic",
              isScrolled ? "text-white" : "text-white"
            )}>
              COFFEE<span className="text-caramel">CRAZE</span>
            </div>
          </div>
        </Link>

        {/* Global Nav - Professional & Minimal */}
        <nav className="hidden lg:flex items-center gap-16">
          {navLinks.map((link) => (
            <Link 
              key={link.name} 
              to={link.path}
              className={cn(
                "text-[11px] font-black uppercase tracking-[0.6em] transition-all duration-700 relative group italic",
                isScrolled ? "text-white/60 hover:text-white" : "text-white/80 hover:text-white"
              )}
            >
              <span className="relative z-10">{link.name}</span>
              <span className="absolute -bottom-2 left-0 w-0 h-0.5 bg-caramel transition-all duration-700 group-hover:w-full" />
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4 md:gap-8">
          <div className="flex items-center gap-1 md:gap-2">
            <Link to="/wishlist" className={cn(
              "relative p-3 rounded-2xl transition-all duration-500 hidden md:flex group hover-lift",
              isScrolled ? "text-coffee-400 hover:text-espresso" : "text-white/40 hover:text-white"
            )}>
              <Heart className={cn("w-5 h-5 transition-transform group-hover:scale-110", wishlistIds.length > 0 ? "fill-caramel text-caramel" : "")} />
              {wishlistIds.length > 0 && (
                <span className="absolute top-1.5 right-1.5 bg-espresso text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center font-black shadow-lg">
                  {wishlistIds.length}
                </span>
              )}
            </Link>

            <Link to="/cart" className={cn(
              "relative p-3 rounded-2xl transition-all duration-500 group hover-lift",
              isScrolled ? "text-coffee-400 hover:text-espresso" : "text-white/40 hover:text-white"
            )}>
              <ShoppingCart className="w-5 h-5 transition-transform group-hover:scale-110" />
              <AnimatePresence>
                {items.length > 0 && (
                  <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className={cn(
                      "absolute top-1.5 right-1.5 text-[8px] w-4 h-4 rounded-full flex items-center justify-center font-black shadow-lg",
                      isScrolled ? "bg-espresso text-white" : "bg-white text-espresso"
                    )}
                  >
                    {items.length}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          </div>
          
          <div className={cn(
            "h-4 w-px mx-2 hidden lg:block transition-colors duration-1000",
            isScrolled ? "bg-coffee-100" : "bg-white/10"
          )}></div>

          {user ? (
            <Link 
              to={dashboardPath} 
              className={cn(
                "flex items-center gap-3 py-1.5 pl-5 pr-1.5 rounded-full transition-all duration-1000 group border active:scale-95 shadow-premium hover-premium",
                isScrolled ? "bg-espresso border-espresso" : "bg-white/5 border-white/10 backdrop-blur-xl"
              )}
            >
              <div className="text-right leading-none hidden xl:block space-y-1 mr-2">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white">
                  {profile?.displayName?.split(' ')[0]}
                </p>
                <p className="text-[8px] font-black text-caramel-gold uppercase tracking-[0.1em] italic opacity-80">
                  {profile?.role === UserRole.ADMIN ? 'OVERSEER' : 'CITIZEN'}
                </p>
              </div>
              <div className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center shadow-lg transition-all duration-1000",
                isScrolled ? "bg-white text-espresso" : "bg-espresso text-white"
              )}>
                <User size={16} />
              </div>
            </Link>
          ) : (
            <Link 
              to="/auth" 
              className={cn(
                "px-8 md:px-12 py-3.5 md:py-4 rounded-full text-[10px] font-black uppercase tracking-[0.5em] transition-all duration-1000 active:scale-95 italic shadow-premium hover-premium",
                isScrolled ? "bg-espresso text-white hover:bg-mocha" : "bg-white text-espresso hover:bg-cream"
              )}
            >
              Access
            </Link>
          )}

          <button 
            className={cn(
              "lg:hidden w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-2xl transition-all duration-500 relative z-[70]",
              isScrolled ? "text-white" : "text-white"
            )}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={32} strokeWidth={1.5} /> : <Menu size={32} strokeWidth={1.5} />}
          </button>
        </div>
      </div>

      {/* Advanced Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-espresso/40 backdrop-blur-sm z-[60] lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, x: "100%" }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: "100%" }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="fixed top-0 bottom-0 right-0 w-[85vw] sm:w-[400px] bg-espresso z-[60] flex flex-col px-6 md:px-12 py-24 shadow-2xl lg:hidden overflow-y-auto"
            >
              <div className="absolute inset-0 mesh-gradient opacity-[0.08] pointer-events-none" />
              <button 
                className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-2xl text-white/50 hover:text-white transition-colors z-[70]"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <X size={28} strokeWidth={1.5} />
              </button>
              
              <nav className="space-y-4 relative z-10 mt-8">
                {navLinks.map((link, i) => (
                  <motion.div
                    key={link.name}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * i + 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <Link
                      to={link.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-4xl sm:text-5xl font-display font-black text-white italic tracking-tightest leading-none block uppercase hover:text-caramel transition-all duration-700 group flex items-center justify-between py-2 border-b border-white/5"
                    >
                      <span>{link.name}.</span>
                      <ArrowRight className="opacity-0 group-hover:opacity-100 transition-all -translate-x-4 group-hover:translate-x-0 text-caramel-gold w-6 h-6" />
                    </Link>
                  </motion.div>
                ))}
              </nav>

              <div className="mt-auto pt-12 relative z-10 flex flex-col gap-10">
                 <motion.div 
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: 0.4 }}
                   className="space-y-6"
                 >
                   <span className="text-[10px] font-black uppercase tracking-[0.5em] text-coffee-500 italic block">Connected Protocols</span>
                   <div className="flex flex-col gap-4">
                     <Link 
                      to="/auth" 
                      onClick={() => setIsMobileMenuOpen(false)} 
                      className="text-xl font-display font-black italic tracking-tighter uppercase text-white hover:text-caramel transition-colors"
                     >
                      Member_Login
                     </Link>
                     <Link 
                      to="/cart" 
                      onClick={() => setIsMobileMenuOpen(false)} 
                      className="text-xl font-display font-black italic tracking-tighter uppercase text-white hover:text-caramel transition-colors"
                     >
                      Inventory_Gate
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
                      <p className="text-[9px] font-black text-coffee-600 uppercase tracking-[0.4em] italic mb-1">SYSTEM_CLOCK</p>
                      <p className="text-sm font-display font-black text-white/40 italic uppercase tracking-widest leading-none">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}_UTC</p>
                    </div>
                    <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-caramel">
                      <Coffee size={16} strokeWidth={1} />
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
