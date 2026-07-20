import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, ArrowRight, Zap, Coffee, Building2, Utensils, Truck, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import Seo from '../components/common/SEO';
import ImageWithFallback from '../components/common/ImageWithFallback';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Address, Plan, PlanItem, SubscriptionStatus, PaymentStatus } from '../types';
import { PlanService, SubscriptionService } from '../services/firestore';
import { formatUSD } from '../utils/exchange';

const getNextDeliveryDate = (frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly') => {
  const date = new Date();
  let increment = 30;
  if (frequency === 'daily') increment = 1;
  else if (frequency === 'weekly') increment = 7;
  else if (frequency === 'biweekly') increment = 14;
  date.setDate(date.getDate() + increment);
  return date.toISOString();
};

export default function Subscriptions() {
  const { user, profile, isEmailVerified } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [creatingPlan, setCreatingPlan] = useState<string | null>(null);
  const [pendingPlan, setPendingPlan] = useState<Plan | null>(null);
  const [preferredTimeSlot, setPreferredTimeSlot] = useState('Morning (9:00 AM - 12:00 PM)');
  const [deliveryStartDate, setDeliveryStartDate] = useState(
    (() => { const d = new Date(); d.setDate(d.getDate() + 3); return d.toISOString().split('T')[0]; })()
  );
  const timeSlots = [
    'Morning (9:00 AM - 12:00 PM)',
    'Afternoon (12:00 PM - 4:00 PM)',
    'Evening (4:00 PM - 8:00 PM)'
  ];

  useEffect(() => {
    const loadPlans = async () => {
      try {
        const remotePlans = await PlanService.getAll();
        setPlans(remotePlans.map((plan) => ({
          ...plan,
          frequency: plan.frequency || 'monthly'
        })));
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
      toast.error('Please sign in to start your subscription.');
      navigate('/auth?redirect=/subscriptions');
      return;
    }

    if (!isEmailVerified) {
      toast.error('Please verify your email before starting a subscription. Go to your Profile to resend the verification email.');
      return;
    }

    if (plan.isCustomizable) {
      navigate('/custom-plan-builder');
      return;
    }

    setPendingPlan(plan);
  };

  const confirmSubscription = async () => {
    if (!pendingPlan || !user) return;
    setCreatingPlan(pendingPlan.id);
    setPendingPlan(null);

    try {
      const item: PlanItem = {
        productId: pendingPlan.id,
        name: pendingPlan.name,
        price: pendingPlan.price,
        quantity: 1,
      };

      await SubscriptionService.create({
        userId: user.uid,
        planId: pendingPlan.id,
        status: SubscriptionStatus.ACTIVE,
        nextDelivery: deliveryStartDate,
        frequency: pendingPlan.frequency || 'monthly',
        preferredDay: profile?.address ? new Date().toLocaleDateString('en-US', { weekday: 'long' }) : 'Standard',
        preferredTime: preferredTimeSlot,
        preferredTimeSlot: preferredTimeSlot,
        items: [item],
        address: {
          name: profile?.displayName || '',
          email: profile?.email || '',
          address: profile?.address || '',
          phone: profile?.phone || ''
        },
        history: [],
        paymentStatus: PaymentStatus.PENDING
      });

      toast.success('Subscription initialized successfully.');
      navigate('/subscription/confirmation', { state: { planName: pendingPlan.name } });
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
          <span className="text-small font-black uppercase tracking-[0.6em] md:tracking-[1em] text-caramel block italic leading-none ml-2">Subscription Plans</span>
          <h1 className="text-display font-display font-black text-espresso tracking-tightest leading-[0.95] sm:leading-[0.9] md:leading-[0.85] uppercase">
            Fresh Coffee <span className="text-caramel">Delivered</span> <br className="hidden sm:block" />
            <span className="text-caramel block font-black sm:ml-8 underline decoration-espresso/10 underline-offset-[0.5rem] sm:underline-offset-[1.5rem]">On Your Schedule.</span>
          </h1>
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12 mt-8 md:mt-24">
            <p className="text-body text-primary max-w-xl font-serif leading-relaxed">
              Pick a plan that keeps your pantry stocked, simplifies ordering, and gives you flexibility with every delivery.
            </p>
            <div className="h-px w-32 bg-caramel/30 hidden md:block" />
            <div className="flex -space-x-6">
               {[1, 2, 3, 4].map((value) => (
                 <div key={`member-${value}`} className="w-16 h-16 rounded-full border-4 border-white bg-cream shadow-premium group overflow-hidden ring-1 ring-espresso/5">
                   <ImageWithFallback src={`https://images.unsplash.com/photo-${1500000000000 + value * 10000000}?auto=format&fit=crop&q=80&w=200`} alt="Customer photo" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                 </div>
               ))}
               <div className="w-16 h-16 rounded-full border-4 border-white bg-espresso flex items-center justify-center text-small text-white font-black italic shadow-premium ring-1 ring-white/10 uppercase tracking-tighter">
                 +2K
               </div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-12 mb-24 md:mb-56 relative z-10 px-4 md:px-0">
        {[
          { icon: <Coffee strokeWidth={1} />, title: 'Home Ritual', desc: 'Personal Plan' },
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
               <h3 className="font-display font-black text-h2 tracking-tightest italic leading-none uppercase text-espresso">{item.title}</h3>
               <p className="text-small text-caramel font-black uppercase tracking-[0.3em] md:tracking-[0.8em] italic">"{item.desc}"</p>
             </div>
          </motion.div>
        ))}
      </div>

      <div className="max-w-7xl mx-auto space-y-10 px-4 md:px-0 relative z-10">
        <div className="grid gap-6 md:grid-cols-3 md:gap-8 mb-12">
          <div className="rounded-3xl bg-white/90 border border-white/70 p-6 md:p-8 shadow-premium overflow-hidden h-full">
            <h2 className="text-lg font-display font-black uppercase tracking-[0.2em] text-espresso mb-4">How it works</h2>
            <ul className="space-y-4 text-sm text-text-secondary leading-relaxed">
              <li className="flex items-start gap-3">
                <span className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-caramel text-white font-black">1</span>
                Choose the plan that fits your routine.
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-caramel text-white font-black">2</span>
                Receive fresh coffee on the cadence you want.
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-caramel text-white font-black">3</span>
                Manage deliveries, swaps, and payment from your account.
              </li>
            </ul>
          </div>
          <div className="rounded-3xl bg-espresso/95 border border-white/10 p-6 md:p-8 shadow-xl text-white h-full">
            <h2 className="text-lg font-display font-black uppercase tracking-[0.2em] mb-4">Why subscribe?</h2>
            <p className="text-sm leading-relaxed text-white/80">Enjoy convenience, better value, and consistent coffee without reordering every week. Ideal for busy homes and offices that want premium coffee delivered reliably.</p>
          </div>
          <div className="rounded-3xl bg-white/90 border border-white/70 p-6 md:p-8 shadow-premium overflow-hidden h-full">
            <h2 className="text-lg font-display font-black uppercase tracking-[0.2em] mb-4">Plan benefits</h2>
            <div className="space-y-3 text-sm text-text-secondary leading-relaxed">
              <p className="font-semibold">Flexible frequency</p>
              <p>Modify delivery cadence, pause anytime, and manage orders on your schedule.</p>
              <p className="font-semibold">Premium selection</p>
              <p>Curated beans, capsules, and gear from trusted producers.</p>
            </div>
          </div>
        </div>
      </div>
      {/* Plan cards */}
      <div className="max-w-7xl mx-auto relative z-10 px-4 md:px-0">
        <div className="text-center mb-10 md:mb-14 space-y-4">
          <h2 className="text-2xl md:text-3xl font-display font-black text-espresso uppercase tracking-wide">
            Choose Your Plan
          </h2>
          <p className="text-sm md:text-base text-text-secondary max-w-2xl mx-auto leading-relaxed">
            {user
              ? 'Pick a plan below to start your subscription. You can pause, swap items, or change delivery frequency anytime from your dashboard.'
              : 'Browse our plans below. Sign in to subscribe --- it only takes a minute.'}
          </p>
          {!user && (
            <Link
              to="/auth?redirect=/subscriptions"
              className="inline-flex items-center gap-2 mt-2 px-6 py-3 bg-espresso text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-caramel hover:text-espresso transition-all shadow-premium"
            >
              Sign In to Subscribe <ArrowRight size={14} />
            </Link>
          )}
        </div>

        <div className="rounded-[2rem] md:rounded-[2.5rem] bg-white/60 border border-espresso/8 p-4 sm:p-6 md:p-10 shadow-premium-lg backdrop-blur-sm">
          {loadingPlans ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
              {[1,2,3].map(i => (
                <div key={i} className="h-72 bg-white/50 rounded-2xl md:rounded-3xl animate-pulse border border-espresso/10" />
              ))}
            </div>
          ) : plans.length === 0 ? (
            <div className="py-16 text-center">
              <h3 className="text-xl font-display font-bold text-text-secondary mb-2">Subscription Plans Coming Soon</h3>
              <p className="text-sm text-text-muted mb-8">Our subscription plans are being prepared. Check back shortly or contact us for early access.</p>
              <Link to="/contact" className="btn-outline px-8 py-3">Contact Us</Link>
            </div>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: i * 0.12 }}
                className={cn(
                  'relative flex flex-col rounded-2xl md:rounded-3xl border p-6 md:p-8 transition-all duration-500 group overflow-hidden h-full',
                  plan.isFeatured
                    ? 'bg-espresso text-white border-caramel/40 shadow-xl shadow-espresso/25 ring-2 ring-caramel/50 hover:shadow-2xl hover:shadow-espresso/30 hover:-translate-y-1'
                    : 'bg-white border-espresso/10 shadow-premium hover:shadow-premium-lg hover:border-caramel/30 hover:-translate-y-1'
                )}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-caramel/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                {plan.isFeatured && (
                  <div className="absolute top-5 right-5 px-3 py-1.5 bg-caramel text-espresso text-[10px] font-black uppercase tracking-[0.25em] rounded-full z-10 shadow-md flex items-center gap-1.5">
                    <Sparkles size={10} /> BEST VALUE
                  </div>
                )}

                <div className="relative z-10 flex flex-col flex-1 gap-6">
                  {/* Plan header */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-3 pr-16">
                      <h3 className={cn(
                        'text-xs font-black uppercase tracking-[0.2em] leading-snug',
                        plan.isFeatured ? 'text-caramel' : 'text-espresso'
                      )}>
                        {plan.name.replace(/_/g, ' ')}
                      </h3>
                      <Zap size={16} className={cn(
                        'shrink-0',
                        plan.isFeatured ? 'text-caramel' : 'text-caramel'
                      )} />
                    </div>

                    {/* Price block */}
                    <div className="rounded-2xl p-4 border bg-white border-espresso/10 shadow-sm">
                      <p className="text-[10px] font-bold uppercase tracking-[0.15em] mb-2 text-black">
                        Per delivery cycle
                      </p>
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <p className="text-3xl md:text-4xl font-display font-black tracking-tight leading-none text-black">
                          {formatUSD(plan.price / 89500)}
                        </p>
                        <span className="text-xs font-semibold text-black">
                          / cycle
                        </span>
                      </div>
                      <p className={cn(
                        'text-sm font-semibold mt-2',
                        plan.isFeatured ? 'text-caramel' : 'text-text-secondary'
                      )}>
                        ~ {plan.price.toLocaleString()} LBP
                      </p>
                    </div>

                    <p className={cn(
                      'text-sm leading-relaxed',
                      plan.isFeatured ? 'text-white/85' : 'text-text-secondary'
                    )}>
                      {plan.description}
                    </p>
                  </div>

                  {/* Features */}
                  <div className="flex-1 space-y-3">
                    <p className={cn(
                      'text-[10px] font-bold uppercase tracking-[0.2em]',
                      plan.isFeatured ? 'text-caramel' : 'text-espresso'
                    )}>
                      What's included
                    </p>
                    <ul className="space-y-2.5">
                      {plan.features.map((feat) => (
                        <li key={feat} className="flex items-center gap-3 text-sm group/feat">
                          <div className={cn(
                            'w-5 h-5 rounded-md flex items-center justify-center shrink-0 border transition-transform duration-300 group-hover/feat:scale-110',
                            plan.isFeatured
                              ? 'bg-caramel/20 border-caramel/40 text-caramel'
                              : 'bg-caramel/10 border-caramel/25 text-espresso'
                          )}>
                            <Check className="w-3 h-3" strokeWidth={3} />
                          </div>
                          <span className={cn(
                            'font-medium leading-snug',
                            plan.isFeatured ? 'text-white' : 'text-espresso'
                          )}>
                            {feat}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* CTA */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelectPlan(plan)}
                    disabled={creatingPlan !== null}
                    className={cn(
                      'w-full py-3.5 md:py-4 rounded-full font-bold uppercase tracking-[0.2em] text-xs transition-all duration-300 flex items-center justify-center gap-2 shadow-md group/btn relative overflow-hidden mt-auto',
                      plan.isFeatured
                        ? 'bg-caramel text-white hover:bg-white hover:text-espresso'
                        : 'bg-espresso text-white hover:bg-caramel hover:text-white',
                      creatingPlan !== null && creatingPlan !== plan.id && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    <span className="relative z-10">
                      {creatingPlan === plan.id
                        ? 'Starting...'
                        : plan.isCustomizable && plan.name.includes('CUSTOM')
                          ? 'Build Custom Plan'
                          : 'Start Subscription'}
                    </span>
                    <ArrowRight size={16} className="relative z-10 group-hover/btn:translate-x-1 transition-transform" />
                  </motion.button>
                </div>

                <div className={cn(
                  'absolute -bottom-32 -right-32 w-64 h-64 rounded-full blur-[100px] opacity-25 pointer-events-none transition-transform duration-700 group-hover:scale-125',
                  plan.isFeatured ? 'bg-caramel' : 'bg-caramel/40'
                )} />
              </motion.div>
            ))}
          </div>
          )}
        </div>

        {/* How members become subscribers */}
        <div className="mt-12 md:mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
          {[
            { step: '1', title: 'Create Account', desc: 'Sign in or register for free to access subscriptions.' },
            { step: '2', title: 'Choose a Plan', desc: 'Pick Starter, Premium, or build a fully custom plan.' },
            { step: '3', title: 'Manage in Dashboard', desc: 'Track deliveries, pause, swap items, and update payment.' },
          ].map((item) => (
            <div
              key={item.step}
              className="p-5 md:p-6 bg-white border border-espresso/8 rounded-2xl shadow-premium hover:shadow-premium-lg hover:border-caramel/25 transition-all duration-300 h-full"
            >
              <span className="inline-flex w-8 h-8 items-center justify-center rounded-full bg-caramel text-espresso text-sm font-black mb-3">
                {item.step}
              </span>
              <h4 className="font-bold text-espresso text-sm mb-1">{item.title}</h4>
              <p className="text-xs text-text-secondary leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Delivery Time Slot Modal */}
      <AnimatePresence>
        {pendingPlan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPendingPlan(null)}
              className="absolute inset-0 bg-espresso/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-premium-2xl space-y-6"
            >
              <div className="text-center space-y-2">
                <Truck size={32} className="mx-auto text-caramel" />
                <h2 className="text-xl font-display font-black text-espresso uppercase">Schedule Delivery</h2>
                <p className="text-xs text-text-muted">Set your preferred delivery window for {pendingPlan.name}</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-wider">Delivery Time Slot</label>
                  <select
                    value={preferredTimeSlot}
                    onChange={e => setPreferredTimeSlot(e.target.value)}
                    className="w-full px-4 py-3 bg-cream border border-espresso/5 rounded-xl text-sm font-bold focus:bg-white outline-none focus:border-caramel transition-all"
                  >
                    {timeSlots.map(slot => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-wider">First Delivery Date</label>
                  <input
                    type="date"
                    value={deliveryStartDate}
                    onChange={e => setDeliveryStartDate(e.target.value)}
                    min={(() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0]; })()}
                    className="w-full px-4 py-3 bg-cream border border-espresso/5 rounded-xl text-sm font-bold focus:bg-white outline-none focus:border-caramel transition-all"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setPendingPlan(null)} className="btn-outline flex-1 text-xs py-3">Back</button>
                <button onClick={confirmSubscription} className="btn btn-primary flex-1 text-xs py-3">
                  Confirm Subscription
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
