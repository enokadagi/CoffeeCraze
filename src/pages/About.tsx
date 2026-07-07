import ImageWithFallback from '../components/common/ImageWithFallback';
import { Coffee, Heart, Users, MapPin, Mail, Phone, ArrowRight, Instagram, Twitter, Linkedin } from 'lucide-react';
import { motion } from 'motion/react';
import SEO from '../components/common/SEO';

export default function About() {
  return (
    <div className="pt-16 sm:pt-24 md:pt-32 pb-20 sm:pb-30 md:pb-40 overflow-hidden bg-palette-b-light">
      <SEO title="About" description="Learn about CoffeeCraze's story, philosophy, and commitment to premium coffee." />
      {/* Hero Section */}
      <section className="px-6 max-w-7xl mx-auto mb-20 md:mb-30 lg:mb-40">
        <div className="flex flex-col lg:flex-row items-center gap-8 sm:gap-12 md:gap-16 lg:gap-24">
          <div className="max-w-xl space-y-10 sm:space-y-12">
            <div className="space-y-4">
                <div className="inline-flex items-center gap-3 px-4 sm:px-5 py-2 sm:py-2.5 bg-cream active:bg-cream text-text-secondary rounded-full text-small font-black uppercase tracking-[0.4em] border border-border shadow-sm transition-all italic">
                ESTABLISHED BEIRUT 1994
                </div>
                <h1 className="text-display font-display font-black text-text leading-[0.85] tracking-tightest italic">Beyond the Bean, <br/> <span className="not-italic text-text-muted">The Ritual.</span></h1>
            </div>
            <p className="text-body text-text-muted font-light leading-relaxed italic">CoffeeCraze began in a Beirut roastery with the goal of making every cup feel intentional, elevated, and deeply satisfying.</p>
          </div>
          <div className="relative group">
            <div className="absolute inset-0 bg-coffee-950/5 blur-[100px] rounded-full scale-125 opacity-20"></div>
            <div className="w-[250px] h-[320px] sm:w-[300px] sm:h-[400px] md:w-[400px] md:h-[520px] lg:w-[500px] lg:h-[650px] bg-cream rounded-[3rem] sm:rounded-[4rem] lg:rounded-[5rem] overflow-hidden rotate-2 shadow-premium hover:rotate-0 transition-transform duration-1000 relative z-10">
              <ImageWithFallback src="https://images.unsplash.com/photo-1501339819358-ee5969a2f238?w=800&auto=format&fit=crop&q=80" alt="CoffeeCraze roastery and team" className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-[2s]" referrerPolicy="no-referrer" />
            </div>
            <div className="absolute -bottom-8 sm:-bottom-10 lg:-bottom-12 -left-8 sm:-left-10 lg:-left-12 w-44 sm:w-52 lg:w-60 h-44 sm:h-52 lg:h-60 bg-coffee-950 p-6 sm:p-8 lg:p-10 rounded-[2rem] sm:rounded-[2.5rem] lg:rounded-[3rem] shadow-premium-lg space-y-4 sm:space-y-6 -rotate-6 z-20 hover:scale-105 transition-transform duration-700">
              <div className="w-10 sm:w-12 lg:w-14 h-10 sm:h-12 lg:h-14 bg-white/10 rounded-2xl flex items-center justify-center text-white border border-white/10">
                <Coffee size={20} />
              </div>
              <p className="text-[8px] sm:text-[9px] lg:text-[10px] font-black text-white uppercase tracking-[0.4em] italic leading-relaxed">Direct Trade <br/> Since 1994</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-coffee-950 py-20 sm:py-30 md:py-40 mb-20 md:mb-30 lg:mb-40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-full h-full bg-coffee-500 blur-[300px] opacity-[0.03] -translate-y-1/2 translate-x-1/2"></div>
        <div className="px-6 max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-12 md:gap-16 lg:gap-20 text-center relative z-10">
          {[
            { label: 'Rituals Brewed', val: '2.5M+' },
            { label: 'Direct Farmers', val: '45' },
            { label: 'Roast Profiles', val: '120+' },
            { label: 'Happy Souls', val: '500K' }
          ].map((stat, i) => (
            <div key={i} className="space-y-4">
              <p className="text-h1 font-display font-black text-white tracking-tighter italic">{stat.val}</p>
              <div className="flex flex-col items-center gap-2">
                <span className="w-1 h-1 bg-coffee-500 rounded-full animate-pulse"></span>
                <p className="text-small font-black text-text-muted uppercase tracking-[0.6em]">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Philosophy */}
      <section className="px-6 max-w-7xl mx-auto mb-20 md:mb-30 lg:mb-40">
        <div className="flex flex-col md:flex-row justify-between items-end gap-8 sm:gap-10 md:gap-12 mb-16 sm:mb-20 md:mb-24">
            <div className="space-y-6 max-w-2xl">
                <span className="text-small font-black uppercase tracking-[0.8em] text-text-muted">Our Philosophy</span>
                <h2 className="text-h1 font-display font-black text-text tracking-tight leading-none italic">Our Coffee <br/><span className="not-italic text-text-muted">Ethos.</span></h2>
            </div>
            <p className="text-body text-text-muted font-medium italic max-w-xs pb-4 border-b border-border">"The principles that guide every roast, every relationship, and every cup."</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 md:gap-10 lg:gap-12">
          {[
            { title: 'Ritual Priority', desc: 'We operate under the belief that coffee is a daily anchor of mindfulness.', icon: Heart },
            { title: 'Ethical Sourcing', desc: 'We pay above fair-trade thresholds to secure the future of the farming communities we work with.', icon: Users },
            { title: 'Extraction Mastery', desc: 'Our head roastery teams possess decades of uncompromised craft expertise.', icon: Coffee }
          ].map((v, i) => (
            <div key={i} className="card-responsive bg-[#faf8f5] border border-border-light space-y-8 sm:space-y-10 hover:bg-coffee-950 hover:text-white transition-all duration-700 group shadow-premium hover:shadow-coffee-900/20">
              <div className="w-14 sm:w-16 md:w-20 h-14 sm:h-16 md:h-20 bg-white text-text rounded-[2rem] flex items-center justify-center shadow-premium group-hover:bg-white/10 group-hover:text-white group-hover:border group-hover:border-white/10 transition-all duration-700">
                <v.icon size={24} strokeWidth={1} />
              </div>
              <div className="space-y-4">
                <h3 className="text-h3 font-display font-black tracking-tight italic">{v.title}</h3>
                <p className="text-small text-text-muted group-hover:text-text-muted font-medium italic leading-relaxed">"{v.desc}"</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
