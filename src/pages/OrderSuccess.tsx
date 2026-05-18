import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, Package, ArrowRight, ShoppingBag } from 'lucide-react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';

export default function OrderSuccess() {
  const { id } = useParams();

  useEffect(() => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#3e2723', '#8d6e63', '#d7ccc8']
    });
  }, []);

  return (
    <div className="pt-16 sm:pt-24 md:pt-32 pb-12 sm:pb-16 md:pb-24 min-h-screen bg-cream relative overflow-hidden">
      <div className="mesh-gradient absolute inset-0 opacity-20 pointer-events-none" />
      
      <div className="page-container flex flex-col items-center text-center relative z-10">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-16 sm:w-20 md:w-24 h-16 sm:h-20 md:h-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-8 shadow-premium-lg"
        >
          <CheckCircle size={32} />
        </motion.div>

        <div className="space-y-4 mb-10 sm:mb-12">
          <span className="stat-label text-green-500">Transmission Complete</span>
          <h1 className="text-fluid-heading font-display font-black text-coffee-950 tracking-tightest italic">Your Ritual is <br/><span className="not-italic text-coffee-400">Confirmed!</span></h1>
          <p className="text-fluid-body text-coffee-400 font-medium italic max-w-md mx-auto leading-relaxed">"Order #{id} has been placed. We're getting your beans ready for roasting."</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 md:gap-8 w-full max-w-2xl mb-10 sm:mb-12">
          <div className="p-6 sm:p-8 bg-white border border-coffee-100 rounded-[1.5rem] sm:rounded-[2rem] space-y-4 shadow-premium hover:shadow-premium-lg transition-all duration-700">
            <div className="w-10 sm:w-12 h-10 sm:h-12 bg-coffee-50 text-coffee-500 rounded-xl flex items-center justify-center">
              <Package size={20} />
            </div>
            <div className="text-left">
              <h3 className="text-fluid-subtitle font-display font-black text-coffee-950 tracking-tight">Preparation</h3>
              <p className="text-fluid-small text-coffee-500 leading-relaxed">Our master roasters are selecting the best batches for your order.</p>
            </div>
          </div>
          <div className="p-6 sm:p-8 bg-white border border-coffee-100 rounded-[1.5rem] sm:rounded-[2rem] space-y-4 shadow-premium hover:shadow-premium-lg transition-all duration-700">
            <div className="w-10 sm:w-12 h-10 sm:h-12 bg-coffee-50 text-coffee-500 rounded-xl flex items-center justify-center">
              <ShoppingBag size={20} />
            </div>
            <div className="text-left">
              <h3 className="text-fluid-subtitle font-display font-black text-coffee-950 tracking-tight">Delivery</h3>
              <p className="text-fluid-small text-coffee-500 leading-relaxed">Expect your delivery within 24-48 hours. Stay ritualized.</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <Link 
            to="/dashboard/orders" 
            className="btn-premium px-8 sm:px-10 py-4 sm:py-5"
          >
            Track My Order <ArrowRight size={20} className="group-hover:translate-x-4 transition-transform duration-700" />
          </Link>
          <Link 
            to="/shop" 
            className="btn-outline px-8 sm:px-10 py-4 sm:py-5"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
