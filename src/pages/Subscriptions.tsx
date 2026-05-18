import { motion } from 'motion/react';
import { Check, ArrowRight, Zap, Coffee, Building2, Utensils, Truck } from 'lucide-react';
const SUBSCRIPTION_PLANS = [
  {
    id: 'sensory-starter',
    name: 'SENSORY_STARTER',
    description: 'Personalized selection of beans and essentials for the foundational ritual.',
    price: 1200000,
    features: ['Curated Local Beans', 'Syrup Add-on Included', 'Priority Provisioning', 'Bi-Weekly Sync']
  },
  {
    id: 'excellence-suite',
    name: 'EXCELLENCE_SUITE',
    description: 'The ultimate orchestral selection for high-performance sensory environments.',
    price: 4500000,
    features: ['Bulk Bean Allocation', 'Powder & Syrup Access', 'Dedicated Support Node', 'Weekly Fleet Logistics'],
    isFeatured: true
  },
  {
    id: 'custom-archival',
    name: 'LEGACY_ARCHIVE',
    description: 'Bespoke sensory architecture for global entities and archival collectors.',
    price: 9500000,
    features: ['Isotopic Sourcing', 'AI Sensory Mapping', '24/7 Agent Node', 'Global Logistics']
  }
];
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export default function Subscriptions() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { addItem } = useCart();

  const handleSelectPlan = (plan: any) => {
    if (!user) {
      toast.error("Security Clearance Required. Please sign in to initiate your ritual subscription.");
      navigate('/auth');
      return;
    }
    
    // Add plan to cart as a product-like object
    addItem({
      id: plan.id,
      name: `${plan.name} Subscription`,
      price: plan.price,
      description: plan.description,
      images: ['https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=800'], // Placeholder for subscription
      category: 'Subscription'
    });
    
    toast.success("Subscription protocol initiated. Synchronizing checkout nodes...");
    navigate('/checkout');
  };

  return (
    <div className="pt-24 pb-32 md:pt-40 md:pb-56 px-4 md:px-6 bg-cream overflow-hidden min-h-screen relative">
      <div className="mesh-gradient absolute inset-0 opacity-[0.05] pointer-events-none" />

      {/* Primary Atmospheric Elements */}
      <div className="absolute top-0 right-0 w-[600px] md:w-[1200px] h-[600px] md:h-[1200px] bg-caramel/10 rounded-full blur-[400px] opacity-30 -z-0 translate-x-1/4 -translate-y-1/4 animate-pulse-slow" />
      <div className="absolute bottom-0 left-0 w-[500px] md:w-[1000px] h-[500px] md:h-[1000px] bg-espresso/5 rounded-full blur-[300px] opacity-20 -z-0 -translate-x-1/4 translate-y-1/4" />

      <div className="max-w-7xl mx-auto text-center mb-16 md:mb-56 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-10 md:space-y-16"
        >
          <span className="text-fluid-small font-black uppercase tracking-[0.6em] md:tracking-[1em] text-caramel block italic leading-none ml-2">Neural_Provisioning_Cycle</span>
          <h1 className="text-fluid-hero font-display font-black text-espresso tracking-tightest leading-[0.9] sm:leading-[0.85] md:leading-[0.8] italic uppercase">
            Zero <span className="not-italic text-coffee-300">Latency.</span> <br className="hidden sm:block" />
            <span className="text-caramel-gold block font-black not-italic sm:ml-8 underline decoration-espresso/10 underline-offset-[0.5rem] sm:underline-offset-[1.5rem]">Pure Excellence.</span>
          </h1>
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12 mt-8 md:mt-24">
            <p className="text-fluid-body text-coffee-400 max-w-xl font-serif italic leading-relaxed">
              "Architected provisioning plans for those who demand the absolute zenith of sensory maintenance. Synchronized from Beirut for a global ritual."
            </p>
            <div className="h-px w-32 bg-caramel/30 hidden md:block" />
            <div className="flex -space-x-6">
               {[1, 2, 3, 4].map(i => (
                 <div key={i} className="w-16 h-16 rounded-full border-4 border-white bg-cream shadow-premium group overflow-hidden ring-1 ring-espresso/5">
                   <img src={`https://images.unsplash.com/photo-${1500000000000 + i * 10000000}?auto=format&fit=crop&q=80&w=200`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                 </div>
               ))}
               <div className="w-16 h-16 rounded-full border-4 border-white bg-espresso flex items-center justify-center text-fluid-small text-white font-black italic shadow-premium ring-1 ring-white/10 uppercase tracking-tighter">
                 +2K
               </div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-12 mb-24 md:mb-56 relative z-10 px-4 md:px-0">
        {[
          { icon: <Coffee strokeWidth={1} />, title: 'Home Ritual', desc: 'Personal Protocol' },
          { icon: <Building2 strokeWidth={1} />, title: 'Hub Choice', desc: 'Institutional Peak' },
          { icon: <Utensils strokeWidth={1} />, title: 'Pro Nodes', desc: 'Legacy Supply' },
          { icon: <Truck strokeWidth={1} />, title: 'Fleet Logic', desc: 'High-Density Ops' },
        ].map((item, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="p-6 md:p-16 bg-white border border-white rounded-[2rem] md:rounded-[5rem] text-center space-y-6 md:space-y-12 shadow-premium-xl hover:shadow-premium-2xl transition-all duration-1000 group hover:-translate-y-8 relative overflow-hidden"
          >
             <div className="absolute inset-0 bg-gradient-to-br from-cream/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
             <div className="w-20 h-20 md:w-36 md:h-36 bg-cream text-espresso rounded-[1.5rem] md:rounded-[4rem] flex items-center justify-center mx-auto shadow-premium-lg group-hover:bg-espresso group-hover:text-caramel transition-all duration-1000 border border-white relative z-10">
                {item.icon}
             </div>
             <div className="space-y-3 md:space-y-6 relative z-10">
               <h3 className="font-display font-black text-fluid-title tracking-tightest italic leading-none uppercase text-espresso">{item.title}</h3>
               <p className="text-fluid-small text-caramel font-black uppercase tracking-[0.3em] md:tracking-[0.8em] italic">"{item.desc}"</p>
             </div>
          </motion.div>
        ))}
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-16 relative z-10 px-4 md:px-0">
        {SUBSCRIPTION_PLANS.map((plan, i) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1], delay: i * 0.2 }}
            className={cn(
              "p-6 md:p-16 rounded-[2rem] md:rounded-[6rem] border transition-all duration-1000 relative overflow-hidden group shadow-premium-2xl flex flex-col justify-between min-h-[500px] lg:min-h-[850px] backdrop-blur-md",
              plan.isFeatured 
                ? 'bg-espresso/95 text-white border-white/10 shadow-2xl shadow-espresso/40' 
                : 'bg-white/40 border-white/60 hover:bg-white/70 shadow-premium'
            )}
          >
             {/* Dynamic Mesh Shine */}
             <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />
             
            {plan.isFeatured && (
              <div className="absolute top-6 right-6 md:top-12 md:right-12 px-4 md:px-10 py-2 md:py-4 bg-caramel text-white text-fluid-small font-black uppercase tracking-[0.3em] md:tracking-[0.6em] rounded-full z-10 shadow-premium italic animate-pulse-slow leading-none border border-white/20">
                DOMINANT_PROTOCOL
              </div>
            )}

            <div className="relative z-10 space-y-8 md:space-y-16">
              <div className="space-y-4 md:space-y-8">
                <div className="flex items-center justify-between">
                  <h3 className={cn(
                    "text-fluid-small font-black uppercase tracking-[0.5em] md:tracking-[0.8em] italic leading-none",
                    plan.isFeatured ? 'text-caramel' : 'text-coffee-300'
                  )}>{plan.name} ALLOCATION</h3>
                  <Zap size={16} className={plan.isFeatured ? "text-caramel animate-pulse" : "text-coffee-100"} />
                </div>
                
                <div className="space-y-4 md:space-y-8">
                  <div className="flex flex-col gap-1 md:gap-2">
                    <p className={cn(
                      "text-fluid-small font-black uppercase tracking-[0.3em] md:tracking-[0.8em] italic opacity-40",
                      plan.isFeatured ? 'text-white' : 'text-espresso'
                    )}>PROVISIONING_VALUE</p>
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <p className="text-fluid-hero font-display font-black tracking-tightest italic leading-[0.8] uppercase flex items-start break-all">
                        <span className="opacity-30 text-[0.25em] not-italic mr-1 block mt-2">LBP</span>
                        {(plan.price / 1000).toLocaleString()}K
                      </p>
                      <span className={cn("text-fluid-small font-black uppercase tracking-[0.2em] md:tracking-[0.4em] italic leading-none opacity-30 pb-2", plan.isFeatured ? 'text-white' : 'text-espresso')}>/ SYNC</span>
                    </div>
                  </div>
                  <p className={cn("text-fluid-body font-serif italic leading-tight text-balance opacity-80", plan.isFeatured ? 'text-coffee-300' : 'text-coffee-500')}>
                    "{plan.description}"
                  </p>
                </div>
              </div>

              <div className="space-y-6 md:space-y-12">
                <p className={cn("text-fluid-small font-black uppercase tracking-[0.5em] md:tracking-[0.8em] italic leading-none", plan.isFeatured ? 'text-caramel' : 'text-espresso')}>System_Permissions:</p>
                <ul className="space-y-4 md:space-y-8">
                  {plan.features.map((feat, j) => (
                    <li key={j} className="flex items-start gap-3 md:gap-6 text-fluid-small font-black italic tracking-tight uppercase leading-none group/feat">
                      <div className={cn("w-6 h-6 md:w-10 md:h-10 rounded-lg md:rounded-2xl flex items-center justify-center flex-shrink-0 shadow-premium border transition-all duration-1000 group-hover/feat:rotate-12 group-hover/feat:scale-110", plan.isFeatured ? 'bg-white/5 border-white/10 text-caramel' : 'bg-white border-espresso/5 text-espresso shadow-inner')}>
                        <Check className="w-3 h-3 md:w-5 md:h-5" strokeWidth={4} />
                      </div>
                      <span className="pt-1 md:pt-3 group-hover/feat:translate-x-2 transition-transform duration-700">{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSelectPlan(plan)}
              className={cn(
                "w-full py-4 md:py-7 rounded-full font-black uppercase tracking-[0.3em] md:tracking-[0.6em] text-fluid-small transition-all duration-1000 flex items-center justify-center gap-3 md:gap-8 shadow-premium italic active:scale-95 group/btn relative overflow-hidden mt-8 md:mt-16",
                plan.isFeatured 
                  ? 'bg-caramel hover:bg-white text-white hover:text-espresso shadow-caramel/20' 
                  : 'bg-espresso hover:bg-caramel text-white shadow-espresso/20'
              )}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              <span className="relative z-10 font-black tracking-[0.8em]">INITIALIZE_RITUAL</span> 
              <ArrowRight className="relative z-10 group-hover:translate-x-4 transition-transform duration-1000 w-3 h-3 md:w-6 md:h-6" />
            </motion.button>

            {/* Background Decorative Vector */}
            <div className={cn(
              "absolute -bottom-64 -right-64 w-[300px] md:w-[600px] h-[300px] md:h-[600px] rounded-full blur-[200px] transition-transform duration-[4s] group-hover:scale-150 opacity-20 pointer-events-none",
              plan.isFeatured ? 'bg-caramel-gold' : 'bg-caramel/30'
            )}></div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
