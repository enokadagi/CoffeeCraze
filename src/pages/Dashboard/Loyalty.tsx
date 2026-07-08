import SEO from '../../components/common/SEO';
import { useAuth } from '../../context/AuthContext';
import { Star, Zap, ShoppingBag, Gift, ArrowRight, TrendingUp, History } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { motion } from 'motion/react';
import { formatPrice, cn } from '../../lib/utils';

export default function LoyaltyRitual() {
  const { profile } = useAuth();
  const points = profile?.loyaltyPoints || 0;
  
  const rewards = [
    { title: 'Free Ritual Bag', points: 500, desc: 'Any 250g bag of your choice.', icon: ShoppingBag },
    { title: 'Roastery Visit', points: 1200, desc: 'Exclusive tour & tasting for two.', icon: Gift },
    { title: 'Masterclass', points: 2500, desc: 'One-on-one session with our roaster.', icon: Zap },
  ];

  const nextReward = rewards.find(r => r.points > points) || rewards[2];
  const progress = Math.min((points / nextReward.points) * 100, 100);

  return (
    <DashboardLayout>
      <div className="space-y-16">
        <SEO title="Loyalty" description="Earn and redeem CoffeeCraze loyalty points with every purchase." />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-12 border-b border-espresso/5 pb-16">
          <div className="space-y-4">
            <span className="text-caption text-caramel">Earning Protocol</span>
            <h1 className="text-7xl font-display font-black text-espresso tracking-tightest leading-none italic uppercase">Loyalty <br/><span className="not-italic text-text-muted">Ritual.</span></h1>
            <p className="text-xl text-text-muted font-serif italic">Every extraction intensifies your node's clearance level.</p>
          </div>
          <div className="p-10 bg-white shadow-premium-xl border border-white rounded-[3.5rem] flex items-center gap-8 group hover:scale-105 transition-all duration-700">
            <div className="w-20 h-20 bg-cream text-caramel-gold rounded-[1.5rem] flex items-center justify-center shadow-inner group-hover:rotate-12 transition-transform duration-700 border border-white">
              <Star size={36} fill="currentColor" />
            </div>
            <div>
               <p className="text-[11px] font-black text-text-muted uppercase tracking-[0.4em] italic mb-1">Accumulated Resonance</p>
               <p className="text-4xl font-display font-black text-espresso italic tracking-tightest">{points} UNITS</p>
            </div>
          </div>
        </div>

        {/* Progress Section */}
        <div className="bg-espresso rounded-[6rem] p-12 md:p-20 text-white overflow-hidden relative shadow-premium-2xl border border-white/5 group">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-caramel blur-[180px] opacity-[0.15] -translate-y-1/2 translate-x-1/2 rounded-full pointer-events-none group-hover:opacity-[0.25] transition-opacity duration-[2s]"></div>
          
          <div className="max-w-2xl space-y-14 relative z-10">
            <div className="space-y-4">
               <div className="inline-flex items-center gap-4 px-5 py-2 bg-white/5 border border-white/10 rounded-full">
                  <TrendingUp className="text-caramel" size={16} />
                  <span className="text-[10px] font-black uppercase tracking-[0.5em] text-text-muted italic">Next Milestone Identified</span>
               </div>
               <h2 className="text-6xl font-display font-black leading-none tracking-tightest italic uppercase">{nextReward.title}</h2>
               <p className="text-2xl text-text-muted font-serif italic leading-relaxed">{nextReward.desc}</p>
            </div>
            
            <div className="space-y-6">
              <div className="flex justify-between text-[11px] font-black uppercase tracking-[0.5em] italic">
                <span className="text-caramel">{points} / {nextReward.points} RESONANCE</span>
                <span className="text-white/40">{Math.round(progress)}% COALESCED</span>
              </div>
              <div className="h-4 bg-white/5 rounded-full overflow-hidden border border-white/5 shadow-inner">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 2.5, ease: [0.22, 1, 0.36, 1] }}
                  className="h-full bg-caramel shadow-[0_0_20px_rgba(193,155,118,0.5)]" 
                />
              </div>
            </div>
            
            <p className="text-sm text-text-muted italic font-serif">Bridge an additional <span className="text-caramel font-black not-italic font-sans text-xs uppercase tracking-widest">{nextReward.points - points} resonators</span> to unlock this sensory enhancement.</p>
          </div>

          <div className="absolute bottom-0 right-0 p-16 opacity-5 group-hover:opacity-10 transition-opacity duration-1000 group-hover:scale-110">
            <TrendingUp size={300} strokeWidth={0.5} />
          </div>
        </div>

        {/* Rewards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {rewards.map((reward, i) => {
            const isUnlocked = points >= reward.points;
            return (
              <div key={i} className="bg-white border border-white p-12 rounded-[5rem] space-y-10 hover:shadow-premium-2xl transition-all duration-1000 group relative overflow-hidden shadow-premium-xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-cream blur-[40px] opacity-20 -translate-y-1/2 translate-x-1/2 rounded-full pointer-events-none" />
                
                <div className={cn(
                  "w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-premium transition-all duration-700 group-hover:scale-110 group-hover:rotate-6",
                  isUnlocked ? 'bg-espresso text-caramel border border-white/10' : 'bg-cream text-espresso/40 border border-white shadow-inner'
                )}>
                  <reward.icon size={28} strokeWidth={1.5} />
                </div>
                <div className="space-y-3">
                  <h4 className="text-3xl font-display font-black text-espresso tracking-tightest leading-tight italic uppercase">{reward.title}</h4>
                  <p className="text-lg text-text-muted font-serif italic leading-relaxed">{reward.desc}</p>
                </div>
                <div className="flex items-center justify-between pt-6">
                  <span className="text-[11px] font-black text-text-muted uppercase tracking-[0.4em] italic">{reward.points}_UNITS</span>
                  <button 
                    disabled={!isUnlocked}
                    className={cn(
                      "px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.3em] transition-all duration-700 italic border shadow-premium",
                      isUnlocked 
                        ? 'bg-espresso text-white hover:bg-caramel hover:text-white border-espresso/10 hover:border-caramel-gold active:scale-90' 
                        : 'bg-cream text-espresso/50 cursor-not-allowed border-white'
                    )}
                  >
                    {isUnlocked ? 'Induct Reward' : 'Dormant'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

          {/* Earning History */}
          <div className="bg-white border border-white rounded-[5rem] overflow-hidden shadow-premium-2xl relative">
            <div className="p-12 border-b border-espresso/5 flex items-center gap-6 bg-cream/30">
               <div className="w-12 h-12 bg-espresso text-caramel rounded-2xl flex items-center justify-center shadow-premium">
                  <History size={20} strokeWidth={1.5} />
               </div>
               <h3 className="text-4xl font-display font-black text-espresso italic tracking-tightest uppercase">Accumulation <span className="not-italic text-text-muted">Log.</span></h3>
            </div>
            <div className="py-20 text-center space-y-6">
              <div className="w-16 h-16 bg-cream rounded-[2rem] flex items-center justify-center mx-auto text-coffee-200 shadow-inner">
                <History size={24} strokeWidth={1} />
              </div>
              <p className="text-lg text-text-muted font-serif italic">No accumulation history yet. Points are earned by completing orders and referring friends.</p>
            </div>
          </div>
      </div>
    </DashboardLayout>
  );
}
