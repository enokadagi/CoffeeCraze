import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Compass, ArrowRight } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-cream grainy-overlay relative overflow-hidden pt-32 pb-24">
      <div className="mesh-gradient absolute inset-0 opacity-20 pointer-events-none" />
      <div className="page-container relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-12 md:space-y-16"
        >
          <div className="w-20 h-20 md:w-32 md:h-32 bg-white rounded-full flex items-center justify-center mx-auto shadow-premium-xl border border-white/60">
            <Compass className="text-caramel w-10 h-10 md:w-16 md:h-16" strokeWidth={1} />
          </div>
          <div className="space-y-6">
            <span className="stat-label text-caramel tracking-[0.8em]">ERROR_404</span>
            <h1 className="text-fluid-hero font-display font-black text-espresso tracking-tightest italic uppercase">
              Lost <br/><span className="not-italic text-coffee-400">Signal.</span>
            </h1>
            <p className="text-fluid-body text-coffee-500 font-serif italic max-w-xl mx-auto leading-relaxed">
              "The coordinates you seek exist beyond our current archival maps.
              Return to the hub and recalibrate your search parameters."
            </p>
          </div>
          <Link to="/" className="btn-premium btn-lg inline-flex group">
            Return to Hub <ArrowRight size={18} className="group-hover:translate-x-4 transition-transform duration-700" />
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
