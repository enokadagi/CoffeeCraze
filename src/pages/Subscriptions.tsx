import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Check, ArrowRight, Zap, Coffee, Building2, Utensils, Truck } from 'lucide-react';
import Seo from '../components/common/SEO';
import ImageWithFallback from '../components/common/ImageWithFallback';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Address, Plan, PlanItem, SubscriptionStatus, PaymentStatus } from '../types';
import { PlanService, SubscriptionService } from '../services/firestore';
import { formatUSD, formatLBP } from '../utils/exchange';

const DEFAULT_PLANS: Plan[] = [
  {
    id: 'sensory-starter',
    name: 'SENSORY_STARTER',
    description: 'Personalized selection of beans and essentials for the foundational ritual.',
    price: 1200000,
    features: ['Curated Local Beans', 'Syrup Add-on Included', 'Priority Provisioning', 'Bi-Weekly Sync'],
    items: [],
    frequency: 'biweekly',
    minDeliveries: 2,
    isFeatured: false,
    isCustomizable: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'excellence-suite',
    name: 'EXCELLENCE_SUITE',
    description: 'The ultimate orchestral selection for high-performance sensory environments.',
    price: 4500000,
    features: ['Bulk Bean Allocation', 'Powder & Syrup Access', 'Dedicated Support Node', 'Weekly Fleet Logistics'],
    items: [],
    isFeatured: true,
    frequency: 'weekly',
    minDeliveries: 4,
    isCustomizable: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'custom-archival',
    name: 'LEGACY_ARCHIVE',
    description: 'Bespoke sensory architecture for global entities and archival collectors.',
    price: 9500000,
    features: ['Isotopic Sourcing', 'AI Sensory Mapping', '24/7 Agent Node', 'Global Logistics'],
    items: [],
    frequency: 'monthly',
    minDeliveries: 1,
    isFeatured: false,
    isCustomizable: true,
    createdAt: new Date().toISOString(),
  }
];

const getNextDeliveryDate = (frequency: 'weekly' | 'biweekly' | 'monthly') => {
  const date = new Date();
  let increment = 30;
  if (frequency === 'weekly') increment = 7;
  else if (frequency === 'biweekly') increment = 14;
  date.setDate(date.getDate() + increment);
  return date.toISOString();
};

export default function Subscriptions() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Plan[]>(DEFAULT_PLANS);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [creatingPlan, setCreatingPlan] = useState<string | null>(null);

  useEffect(() => {
    const loadPlans = async () => {
      try {
        const remotePlans = await PlanService.getAll();
        if (remotePlans.length > 0) {
          setPlans(remotePlans.map((plan) => ({
            ...plan,
            frequency: plan.frequency || 'monthly'
          })));
        }
      } catch (error) {
        console.warn('Unable to fetch remote plans, using default plan definitions.', error);
      } finally {
        setLoadingPlans(false);
      }
    };
    loadPlans();
  }, []);

  const handleSelectPlan = async (plan: Plan) => {
    if (!user) {
      toast.error('Security clearance required. Please sign in to initiate your ritual subscription.');
      navigate('/auth?redirect=/subscriptions');
      return;
    }

    setCreatingPlan(plan.id);

    try {
      const item: PlanItem = {
        productId: plan.id,
        name: plan.name,
        price: plan.price,
        quantity: 1,
      };

      await SubscriptionService.create({
        userId: user.uid,
        planId: plan.id,
        status: SubscriptionStatus.ACTIVE,
        nextDelivery: getNextDeliveryDate(plan.frequency || 'monthly'),
        frequency: plan.frequency || 'monthly',
        preferredDay: profile?.address ? new Date().toLocaleDateString('en-US', { weekday: 'long' }) : 'Standard',
        preferredTime: 'Morning',
        items: [item],
        address: {
          name: profile?.displayName || '',
          email: profile?.email || '',
          address: profile?.address || '',
          phone: profile?.phone || ''
        },
        history: [],
        paymentStatus: PaymentStatus.PAID
      });

      toast.success('Subscription initialized successfully.');
      navigate('/subscription/confirmation', { state: { planName: plan.name } });
    } catch (error) {
      console.error('Failed to create subscription:', error);
      toast.error('Failed to initiate your subscription. Please try again.');
    } finally {
      setCreatingPlan(null);
    }
  };

  return (
    <div className="pt-24 pb-32 md:pt-40 md:pb-56 px-4 md:px-6 bg-cream overflow-hidden min-h-screen relative">
      <Seo title="Subscriptions" description="Subscribe to automated premium coffee delivery rituals." />
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
               {[1, 2, 3, 4].map((value) => (
                 <div key={`member-${value}`} className="w-16 h-16 rounded-full border-4 border-white bg-cream shadow-premium group overflow-hidden ring-1 ring-espresso/5">
                   <ImageWithFallback src={`https://images.unsplash.com/photo-${1500000000000 + value * 10000000}?auto=format&fit=crop&q=80&w=200`} alt="Community member" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
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
            key={item.title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="p-6 md:p-8 bg-white border border-white rounded-2xl text-center space-y-4 shadow-premium hover:shadow-premium-lg transition-all duration-1000 group hover:-translate-y-4 relative overflow-hidden"
          >
             <div className="absolute inset-0 bg-gradient-to-br from-cream/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
             <div className="w-16 h-16 bg-cream text-espresso rounded-xl flex items-center justify-center mx-auto shadow-premium group-hover:bg-espresso group-hover:text-caramel transition-all duration-1000 border border-white relative z-10">
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
        {(loadingPlans ? DEFAULT_PLANS : plans).map((plan, i) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1], delay: i * 0.2 }}
            className={cn(
              "p-6 md:p-8 rounded-3xl border transition-all duration-1000 relative overflow-hidden group shadow-premium flex flex-col justify-between min-h-[480px] lg:min-h-[600px] backdrop-blur-md",
              plan.isFeatured 
                ? 'bg-espresso text-white border-white/10 shadow-xl shadow-espresso/30' 
                : 'bg-white/40 border-white/60 hover:bg-white/70 shadow-premium'
            )}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />
            {plan.isFeatured && (
              <div className="absolute top-6 right-6 px-4 py-1.5 bg-caramel text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-full z-10 shadow-premium italic animate-pulse-slow leading-none border border-white/20">
                DOMINANT_PROTOCOL
              </div>
            )}

            <div className="relative z-10 space-y-6 md:space-y-10">
              <div className="space-y-4 md:space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className={cn(
                    "text-xs font-black uppercase tracking-[0.3em] italic leading-none",
                    plan.isFeatured ? 'text-caramel' : 'text-coffee-300'
                  )}>{plan.name} ALLOCATION</h3>
                  <Zap size={14} className={plan.isFeatured ? 'text-caramel animate-pulse' : 'text-coffee-100'} />
                </div>
                <div className="space-y-4">
                  <div className="flex flex-col gap-1">
                    <p className={cn(
                      "text-[10px] font-black uppercase tracking-[0.2em] italic opacity-40",
                      plan.isFeatured ? 'text-white' : 'text-espresso'
                    )}>PROVISIONING_VALUE</p>
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <p className="text-3xl md:text-4xl font-display font-black tracking-tightest italic leading-none uppercase">
                        {formatUSD(plan.price / 89500)}
                      </p>
                      <span className={cn(
                        "text-[10px] font-black uppercase tracking-[0.1em] italic leading-none opacity-30",
                        plan.isFeatured ? 'text-white' : 'text-espresso'
                      )}>/ cycle</span>
                    </div>
                    <p className={cn(
                      "text-[11px] font-semibold opacity-60",
                      plan.isFeatured ? 'text-caramel-gold' : 'text-coffee-500'
                    )}>
                      ≈ {formatLBP(plan.price)} LBP
                    </p>
                  </div>
                  <p className={cn("text-sm font-serif italic leading-tight text-balance opacity-80", plan.isFeatured ? 'text-coffee-300' : 'text-coffee-500')}>
                    "{plan.description}"
                  </p>
                </div>
              </div>

              <div className="space-y-4 md:space-y-6">
                <p className={cn("text-xs font-black uppercase tracking-[0.3em] italic leading-none", plan.isFeatured ? 'text-caramel' : 'text-espresso')}>System_Permissions:</p>
                <ul className="space-y-3 md:space-y-4">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-3 text-xs font-black italic tracking-tight uppercase leading-none group/feat">
                      <div className={cn(
                        "w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0 shadow-premium border transition-all duration-1000 group-hover/feat:rotate-12 group-hover/feat:scale-110",
                        plan.isFeatured ? 'bg-white/5 border-white/10 text-caramel' : 'bg-white border-espresso/5 text-espresso shadow-inner'
                      )}>
                        <Check className="w-2.5 h-2.5" strokeWidth={4} />
                      </div>
                      <span className="pt-1 group-hover/feat:translate-x-2 transition-transform duration-700">{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSelectPlan(plan)}
              disabled={creatingPlan !== null}
              className={cn(
                "w-full py-3.5 rounded-full font-black uppercase tracking-[0.3em] text-xs transition-all duration-1000 flex items-center justify-center gap-3 shadow-premium italic active:scale-95 group/btn relative overflow-hidden mt-6 md:mt-10",
                plan.isFeatured
                  ? 'bg-caramel hover:bg-white text-white hover:text-espresso shadow-caramel/20'
                  : 'bg-espresso hover:bg-caramel text-white shadow-espresso/20'
              )}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              <span className="relative z-10 font-black tracking-[0.4em]">{creatingPlan === plan.id ? 'INITIALIZING...' : 'INITIALIZE_RITUAL'}</span>
              <ArrowRight className="relative z-10 group-hover:translate-x-4 transition-transform duration-1000 w-4 h-4" />
            </motion.button>

            <div className={cn(
              "absolute -bottom-64 -right-64 w-[300px] md:w-[600px] h-[300px] md:h-[600px] rounded-full blur-[200px] transition-transform duration-[4s] group-hover:scale-150 opacity-20 pointer-events-none",
              plan.isFeatured ? 'bg-caramel-gold' : 'bg-caramel/30'
            )} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
