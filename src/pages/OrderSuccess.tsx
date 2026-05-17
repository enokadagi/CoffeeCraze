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
    <div className="pt-32 pb-24 px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-24 h-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-8"
      >
        <CheckCircle size={48} />
      </motion.div>

      <div className="space-y-4 mb-12">
        <h1 className="text-4xl md:text-5xl font-display font-bold text-coffee-950">Your Ritual is Confirmed!</h1>
        <p className="text-coffee-500 max-w-sm mx-auto">Order #{id} has been placed. We're getting your beans ready for roasting.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-2xl mb-12">
        <div className="p-8 bg-white border border-coffee-100 rounded-[2rem] space-y-4">
          <div className="w-12 h-12 bg-coffee-50 text-coffee-500 rounded-xl flex items-center justify-center">
            <Package size={24} />
          </div>
          <div className="text-left">
            <h3 className="font-bold text-coffee-950">Preparation</h3>
            <p className="text-xs text-coffee-500 leading-relaxed">Our master roasters are selecting the best batches for your order.</p>
          </div>
        </div>
        <div className="p-8 bg-white border border-coffee-100 rounded-[2rem] space-y-4">
          <div className="w-12 h-12 bg-coffee-50 text-coffee-500 rounded-xl flex items-center justify-center">
            <ShoppingBag size={24} />
          </div>
          <div className="text-left">
            <h3 className="font-bold text-coffee-950">Delivery</h3>
            <p className="text-xs text-coffee-500 leading-relaxed">Expect your delivery within 24-48 hours. Stay ritualized.</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <Link 
          to="/dashboard/orders" 
          className="px-10 py-4 bg-coffee-950 text-white rounded-full font-bold flex items-center justify-center gap-2 hover:bg-coffee-800 transition-all shadow-xl shadow-coffee-950/20"
        >
          Track My Order <ArrowRight size={20} />
        </Link>
        <Link 
          to="/shop" 
          className="px-10 py-4 bg-white text-coffee-950 border border-coffee-100 rounded-full font-bold flex items-center justify-center gap-2 hover:bg-coffee-50 transition-all"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
