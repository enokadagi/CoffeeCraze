import { motion } from 'motion/react';
import { ArrowRight, Coffee, ShieldCheck, Zap, Star, Sparkles, Globe, Quote, Compass } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

export default function Home() {
  return (
    <div className="relative overflow-hidden bg-cream grainy-overlay">
      {/* Cinematic Cinematic Hero Section 2026 */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-24 pb-32 md:pt-32 md:pb-40 px-4 md:px-10 lg:px-20">
        <div className="mesh-gradient absolute inset-0 opacity-[0.5]" />
        
        {/* Architectural Atmospheric Nodes */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.15, 0.25, 0.15],
              rotate: [0, 45, 0]
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute top-[-10%] right-[-5%] w-[80rem] h-[80rem] bg-caramel/5 blur-[200px] rounded-full"
          />
          <motion.div 
            animate={{ 
              scale: [1.2, 1, 1.2],
              opacity: [0.1, 0.2, 0.1],
              rotate: [0, -45, 0]
            }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-[-20%] left-[-10%] w-[60rem] h-[60rem] bg-espresso/5 blur-[150px] rounded-full"
          />
          
          {/* Floating 'Sensory Particles' */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ 
                opacity: [0.1, 0.3, 0.1], 
                scale: [1, 1.5, 1],
                x: [0, Math.random() * 200 - 100],
                y: [0, Math.random() * 200 - 100],
              }}
              transition={{ 
                duration: 15 + i * 3, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
              className="absolute w-1.5 h-1.5 bg-caramel/40 rounded-full blur-[1px]"
              style={{ 
                top: `${20 + Math.random() * 60}%`, 
                left: `${20 + Math.random() * 60}%` 
              }}
            />
          ))}
        </div>

        <div className="relative z-10 w-full max-w-[1800px] flex flex-col items-center text-center px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
            className="inline-flex items-center gap-3 md:gap-8 px-6 md:px-16 py-3 md:py-6 bg-white/10 backdrop-blur-3xl border border-white/20 rounded-full shadow-premium mb-12 md:mb-32 group cursor-default relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-[2s]" />
            <div className="w-2 md:w-3 h-2 md:h-3 bg-caramel-gold animate-pulse rounded-full shadow-[0_0_15px_rgba(198,148,82,0.5)]" />
            <span className="text-espresso uppercase tracking-[0.8rem] md:tracking-[1.5rem] text-fluid-small font-black italic ml-3 md:ml-6">ARCHIVAL_SYNC // PROTOCOL_01</span>
          </motion.div>

          <header className="relative mb-6 md:mb-20">
            <h1 className="text-fluid-hero font-display font-black leading-[0.85] md:leading-[0.8] tracking-tightest text-balance text-espresso relative italic uppercase">
              <span className="text-reveal-mask">
                <motion.span 
                  initial={{ y: "150%", skewY: 15 }}
                  animate={{ y: 0, skewY: 0 }}
                  transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
                  className="block origin-bottom"
                >
                  Sensory_
                </motion.span>
              </span>
              <span className="text-reveal-mask">
                <motion.span 
                  initial={{ y: "150%", skewY: 15 }}
                  animate={{ y: 0, skewY: 0 }}
                  transition={{ duration: 1.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
                  className="block text-caramel italic font-light not-italic font-black decoration-caramel/10 underline underline-offset-[1rem] md:underline-offset-[1.5rem] origin-bottom"
                >
                  Excellence.
                </motion.span>
              </span>
            </h1>
          </header>

          <div className="max-w-4xl mx-auto space-y-10 md:space-y-24">
            <motion.p 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.8, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="text-fluid-subtitle text-espresso/60 font-serif italic leading-tight text-balance px-2 md:px-4 max-w-4xl mx-auto tracking-tight"
            >
              "Architecting the ritual for <span className="text-espresso">discerning citizens</span>."
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.5, delay: 1.1, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col sm:flex-row gap-3 md:gap-8 items-center justify-center pt-2 md:pt-8"
            >
              <Link to="/subscriptions" className="btn-premium px-6 md:px-16 py-3 md:py-7 text-fluid-small md:text-base group">
                 <span className="relative z-10 flex items-center gap-4 md:gap-8">
                    GET THE RITUAL <ArrowRight size={20} className="group-hover:translate-x-4 transition-transform duration-1000" />
                 </span>
              </Link>
              <Link to="/shop" className="btn-outline px-6 md:px-12 py-3 md:py-6 text-fluid-small">
                <span className="relative z-10">THE ARCHIVE</span>
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Dynamic Product Visual Layer */}
        <motion.div 
          initial={{ opacity: 0, scale: 1.2 }}
          animate={{ opacity: 0.1, scale: 1 }}
          transition={{ duration: 5, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 pointer-events-none z-0"
        >
          <img 
            src="https://images.unsplash.com/photo-1442551320318-79bb0e4511fb?auto=format&fit=crop&q=80&w=2500" 
            alt="Sensory Texture" 
            className="w-full h-full object-cover grayscale mix-blend-overlay"
          />
        </motion.div>
      </section>

      {/* Layered Content System */}
      <section className="section-spacing bg-white relative z-10 overflow-hidden">
        <div className="page-container px-6 md:px-12 lg:px-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 md:gap-32 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
              viewport={{ once: true }}
              className="lg:col-span-5 space-y-8 md:space-y-20"
            >
              <div className="space-y-4 md:space-y-8">
                 <span className="stat-label text-caramel tracking-[0.8em]">UNIT_01 / FOUNDATION</span>
                 <h2 className="text-fluid-heading font-display font-black leading-[0.9] tracking-tightest italic uppercase">
                   Beirut <br/><span className="text-espresso not-italic underline decoration-caramel/10 underline-offset-[1.5rem]">Identity.</span>
                 </h2>
              </div>
              <p className="text-fluid-body text-coffee-500 font-serif italic leading-relaxed pl-6 md:pl-12 border-l-2 border-espresso/5">
                Architectural heritage meets sensory exploration. We curate harvests that resonate with the frequency of perfection.
              </p>
              
              <div className="grid grid-cols-2 gap-6 md:gap-16 pt-4 md:pt-8">
                 <div className="space-y-3 md:space-y-6">
                    <p className="text-fluid-title font-display font-black text-espresso italic">98.4%</p>
                    <p className="text-fluid-small font-black uppercase tracking-[0.3em] md:tracking-[0.4em] text-caramel leading-none">Extraction_Precision</p>
                 </div>
                 <div className="space-y-3 md:space-y-6">
                    <p className="text-fluid-title font-display font-black text-espresso italic">2026</p>
                    <p className="text-fluid-small font-black uppercase tracking-[0.3em] md:tracking-[0.4em] text-caramel leading-none">Next_Gen_Auth</p>
                 </div>
              </div>
            </motion.div>

            <div className="lg:col-span-7 relative pt-12 lg:pt-0">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, rotate: -5 }}
                whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ duration: 2, ease: [0.22, 1, 0.36, 1] }}
                viewport={{ once: true }}
                className="relative aspect-video lg:aspect-[16/10] rounded-[2rem] md:rounded-[5rem] overflow-hidden shadow-premium-xl group"
              >
                <img 
                  src="https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&q=80&w=1200" 
                  alt="High Art Coffee" 
                  className="w-full h-full object-cover transition-transform duration-[10s] group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-espresso/10 mix-blend-multiply" />
              </motion.div>
              
              {/* Floating Badge */}
              <motion.div 
                animate={{ y: [0, -20, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-6 -left-6 md:-bottom-10 md:-left-10 bg-white p-4 md:p-10 rounded-[1.5rem] md:rounded-[3rem] shadow-premium-lg border border-cream hidden sm:block"
              >
                 <Compass className="text-caramel mb-2 md:mb-4 w-6 h-6 md:w-8 md:h-8" strokeWidth={1} />
                 <p className="text-fluid-small font-black uppercase tracking-[0.3em] md:tracking-[0.4em] text-espresso">Global Mapping</p>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Subscription Call: Automated Ritual */}
      <section className="py-12 md:py-64 bg-espresso relative overflow-hidden rounded-[2rem] md:rounded-[8rem] mx-2 md:mx-12 my-6 md:my-32">
         <div className="absolute inset-0 mesh-gradient opacity-15" />
         <div className="absolute top-0 right-0 w-[250px] md:w-[800px] h-[250px] md:h-[800px] bg-caramel/10 blur-[100px] md:blur-[200px] rounded-full animate-pulse" />
         
         <div className="page-container relative z-10 text-center px-6 md:px-12">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 2, ease: [0.22, 1, 0.36, 1] }}
              viewport={{ once: true }}
              className="space-y-8 md:space-y-24"
            >
              <div className="space-y-4 md:space-y-10">
                <span className="stat-label text-caramel-gold tracking-[0.8em]">CONTINUOUS_PROVISIONING</span>
                <h2 className="text-fluid-hero font-display font-black leading-none tracking-tightest text-white italic uppercase">
                   Sensory <span className="not-italic text-coffee-300 underline decoration-white/5 underline-offset-[2vw]">Rituals.</span>
                </h2>
                <p className="text-fluid-subtitle text-coffee-400 font-serif italic max-w-3xl mx-auto leading-relaxed">
                  "An automated supply line of the world's most elusive harvests. Structured for the modern connoisseur."
                </p>
              </div>

              <div className="flex flex-wrap justify-center gap-3 md:gap-10 pt-4 md:pt-12">
                 {[
                   { label: 'STANDARD_NODE', perk: 'Weekly_Freshness' },
                   { label: 'ARCHIVAL_TIER', perk: 'High_Volume_Access' },
                   { label: 'EXECUTIVE_PROTOCOL', perk: 'Private_Harvests' }
                 ].map((perk, i) => (
                   <motion.div 
                    key={i}
                    whileHover={{ scale: 1.05, y: -10 }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    className="px-4 md:px-12 py-4 md:py-8 bg-white/5 border border-white/10 rounded-[1.5rem] md:rounded-[3rem] backdrop-blur-3xl group hover:border-caramel-gold transition-all duration-1000"
                   >
                     <p className="text-fluid-small font-black text-white uppercase tracking-[0.3em] md:tracking-[0.5em] mb-2 md:mb-3">{perk.label}</p>
                     <p className="text-fluid-small font-black text-caramel uppercase tracking-[0.2em] md:tracking-[0.3em] italic group-hover:text-caramel-gold transition-colors">{perk.perk}</p>
                   </motion.div>
                 ))}
              </div>

              <div className="pt-8 md:pt-24">
                 <Link to="/subscriptions" className="btn-premium px-10 md:px-24 py-5 md:py-8 text-fluid-small md:text-base group overflow-hidden shadow-2xl shadow-espresso/40">
                    <span className="relative z-10">BEGIN_THE_JOURNEY</span>
                    <div className="absolute inset-0 bg-caramel translate-y-full group-hover:translate-y-0 transition-transform duration-1000" />
                 </Link>
              </div>
            </motion.div>
         </div>
      </section>

      {/* Sensory Exploration Grid - Redesigned */}
      <section className="section-spacing bg-white relative overflow-hidden">
        <div className="mesh-gradient absolute inset-0 opacity-[0.03]" />
        <div className="page-container relative z-10 px-6 md:px-12 lg:px-24">
          <div className="flex flex-col xl:flex-row justify-between xl:items-end gap-10 md:gap-24 mb-12 md:mb-48">
            <div className="max-w-4xl space-y-4 md:space-y-12">
              <span className="stat-label text-caramel tracking-[0.8em] md:tracking-[1.2em]">UNIT_02 / THE_ARCHIVE</span>
              <h2 className="text-fluid-hero font-display font-black leading-[0.8] md:leading-[0.7] tracking-tightest text-espresso uppercase">Explore <br/><span className="text-caramel-gold italic font-light lowercase">Sensory</span> universes.</h2>
            </div>
            <Link to="/shop" className="group text-fluid-small font-black uppercase tracking-[0.3em] md:tracking-[0.6em] text-espresso flex items-center gap-4 md:gap-8 pb-3 md:pb-8 border-b-2 border-espresso/5 hover:border-caramel transition-all duration-1000 italic shrink-0 w-fit">
              View Full Protocol <ArrowRight className="group-hover:translate-x-8 transition-transform duration-1000 text-caramel w-5 h-5 md:w-6 md:h-6" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-10">
            {[
              { name: 'Coffee Beans', img: 'https://images.unsplash.com/photo-1559056191-48396f41da64?w=800', link: 'beans', tag: 'TERROIR' },
              { name: 'Vessels', img: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=800', link: 'accessories', tag: 'CURATION' },
              { name: 'Instruments', img: 'https://images.unsplash.com/photo-1574944855474-061803730704?w=800', link: 'machines', tag: 'ENGINEERING' },
              { name: 'Artifacts', img: 'https://images.unsplash.com/photo-1544787210-2213d84ad964?w=800', link: 'capsules', tag: 'PRECISION' }
            ].map((cat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.2, delay: i * 0.15, ease: [0.22, 1, 0.36, 1] }}
                viewport={{ once: true }}
              >
                <Link to={`/category/${cat.link}`} className="group relative block aspect-[4/5] sm:aspect-[4/6] rounded-[1.5rem] md:rounded-[4rem] overflow-hidden shadow-premium-lg hover-premium border border-espresso/[0.03]">
                  <img src={cat.img} className="w-full h-full object-cover transition-transform duration-[6s] group-hover:scale-125 saturate-[0.8] brightness-[0.9]" alt={cat.name} />
                  <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-espresso/80 via-espresso/20 to-transparent" />
                  <div className="absolute top-6 left-6 md:top-10 md:left-10">
                    <span className="px-3 md:px-5 py-1 md:py-2 bg-white/10 backdrop-blur-3xl rounded-full text-fluid-small font-black uppercase tracking-[0.3em] md:tracking-[0.5em] text-white italic border border-white/10 group-hover:bg-caramel group-hover:text-white transition-all duration-700">{cat.tag}</span>
                  </div>
                  <div className="absolute bottom-6 left-6 right-6 md:bottom-10 md:left-10 md:right-10 text-white transform group-hover:-translate-y-4 transition-transform duration-1000">
                    <h3 className="text-fluid-title font-display font-black italic mb-2 md:mb-3 leading-none uppercase tracking-tighter">{cat.name}</h3>
                    <p className="text-fluid-small font-black uppercase tracking-[0.3em] md:tracking-[0.5em] text-caramel opacity-0 group-hover:opacity-100 transition-all duration-1000 italic translate-y-4 group-hover:translate-y-0">Access_Granted</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>


      {/* The AI Overseer Interface - 2026 Enhanced */}
      <section className="section-spacing bg-mocha overflow-hidden relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(180,83,9,0.1),transparent_70%)]" />
        <div className="page-container relative z-10 px-6 md:px-12">
          <div className="flex flex-col lg:flex-row items-center gap-10 md:gap-32">
            <div className="relative shrink-0 pt-10 md:pt-20">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                className="w-[18rem] h-[18rem] sm:w-[25rem] sm:h-[25rem] md:w-[35rem] md:h-[35rem] border border-white/5 rounded-full flex items-center justify-center p-8 md:p-12"
              >
                <div className="w-full h-full border border-caramel/20 rounded-full flex items-center justify-center p-8 md:p-12 relative">
                   <div className="absolute inset-0 bg-caramel/5 blur-[60px] md:blur-[100px] rounded-full animate-pulse" />
                </div>
              </motion.div>
              <motion.div 
                animate={{ y: [0, -20, 0] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <div className="p-6 md:p-20 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2rem] md:rounded-[5rem] shadow-premium-xl flex flex-col items-center gap-4 md:gap-12 group hover:border-caramel/30 transition-all duration-1000">
                   <Sparkles className="text-caramel-gold group-hover:scale-125 transition-transform duration-1000 w-10 h-10 md:w-20 md:h-20" strokeWidth={1} />
                   <div className="text-center space-y-3 md:space-y-6">
                     <p className="text-fluid-small font-black uppercase tracking-[0.3em] md:tracking-[0.8em] text-white italic">Node Status</p>
                     <p className="text-fluid-subtitle font-serif italic text-coffee-200">"Archival Precision Enabled"</p>
                   </div>
                </div>
              </motion.div>
            </div>

            <div className="space-y-8 md:space-y-20 text-center lg:text-left max-w-4xl">
              <div className="space-y-6 md:space-y-12">
                <span className="stat-label text-caramel-gold">Cognitive Extraction Chain</span>
                <h2 className="text-fluid-hero font-display font-light text-white leading-[0.9] md:leading-[0.8] tracking-tightest italic">The <span className="text-white font-black not-italic block uppercase">AI Overseer.</span></h2>
                <p className="text-fluid-body text-coffee-400 font-serif leading-relaxed italic max-w-2xl mx-auto lg:mx-0">
                  "I synthesize thousands of archival variables to ensure your morning ritual matches the exact frequency of your unique sensory profile."
                </p>
              </div>
              <Link to="/ai-barista" className="btn-premium px-10 md:px-24 py-5 md:py-9 text-fluid-small md:text-base group inline-flex shadow-premium-xl">
                Consult The Overseer <Sparkles size={20} className="group-hover:scale-150 transition-transform duration-1000 text-caramel-gold" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Global Influence / Trust Section - Polished */}
      <section className="section-spacing bg-cream py-16 md:py-64">
        <div className="page-container px-6 md:px-12">
          <div className="flex flex-col items-center text-center mb-16 md:mb-40 space-y-6 md:space-y-12">
            <span className="stat-label text-caramel">Resonance Network</span>
            <h2 className="text-fluid-hero font-display font-black leading-[0.8] md:leading-[0.7] tracking-tightest text-espresso uppercase">
              The <span className="italic font-light text-coffee-300">Resonant</span> Collective.
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-24 opacity-30 grayscale hover:grayscale-0 transition-all duration-1000">
            {['VOGUE', 'ROBB REPORT', 'FORBES', 'GQ'].map((brand, i) => (
              <div key={i} className="flex items-center justify-center border-y border-coffee-100 py-8 md:py-20 group">
                <span className="text-fluid-title font-black tracking-[0.3em] md:tracking-[0.5em] text-espresso group-hover:text-caramel transition-colors duration-1000 cursor-default italic uppercase">{brand}</span>
              </div>
            ))}
          </div>

          <div className="mt-16 md:mt-64 pt-12 md:pt-40 border-t border-coffee-100 grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-24">
            {[
              { q: "The protocol has fundamentally altered my understanding of morning sensory input.", a: "S. Haddad / ARCHITECT" },
              { q: "Finally, a subscription that respects the complexity of the bean. Truly world-class logistics.", a: "M. Karam / COLLECTOR" },
              { q: "The Overseer knows my palate better than I do. Unsettlingly accurate.", a: "L. Mansour / CRITIC" }
            ].map((testimonial, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.5, delay: i * 0.2, ease: [0.22, 1, 0.36, 1] }}
                viewport={{ once: true }}
                className="space-y-6 md:space-y-12 group p-6 md:p-12 rounded-[2rem] md:rounded-[4rem] hover:bg-white transition-all duration-1000 hover:shadow-premium"
              >
                <div className="flex gap-1.5 md:gap-2">
                  {[1, 2, 3, 4, 5].map(j => <Star key={j} className="w-3.5 h-3.5 md:w-4 md:h-4 fill-caramel-gold text-caramel-gold opacity-40 group-hover:opacity-100 transition-opacity" />)}
                </div>
                <p className="text-fluid-subtitle font-serif italic leading-relaxed text-espresso opacity-90">"{testimonial.q}"</p>
                <p className="text-fluid-small font-black uppercase tracking-[0.3em] md:tracking-[0.5em] text-coffee-300 group-hover:text-caramel transition-colors">— {testimonial.a}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
