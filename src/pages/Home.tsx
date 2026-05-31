import { motion } from 'motion/react';
import { ArrowRight, Sparkles, Compass } from 'lucide-react';
import { Link } from 'react-router-dom';
import Seo from '../components/common/SEO';

const PARTICLE_IDS = ['particle-01', 'particle-02', 'particle-03', 'particle-04', 'particle-05', 'particle-06', 'particle-07', 'particle-08'];

export default function Home() {
  return (
    <div className="relative overflow-hidden bg-palette-b-light hero-advanced grainy-overlay">
      <Seo title="Home" description="Experience the finest premium coffee ritual delivered to your door by CoffeeCraze." />
      {/* Homepage Hero */}
      <section className="relative min-h-[65vh] sm:min-h-[55vh] md:min-h-[62vh] lg:min-h-[58vh] flex flex-col items-center justify-center overflow-hidden pt-20 sm:pt-24 pb-20 sm:pb-24 px-4 md:px-10 lg:px-20">
        <div className="mesh-gradient absolute inset-0 opacity-[0.5]" />

        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.15, 0.25, 0.15],
              rotate: [0, 45, 0]
            }}
            transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
            className="absolute top-[-10%] right-[-5%] w-[80rem] h-[80rem] bg-caramel/5 blur-[200px] rounded-full"
          />
          <motion.div
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.1, 0.2, 0.1],
              rotate: [0, -45, 0]
            }}
            transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
            className="absolute bottom-[-20%] left-[-10%] w-[60rem] h-[60rem] bg-espresso/5 blur-[150px] rounded-full"
          />

          {PARTICLE_IDS.map((id, i) => (
            <motion.div
              key={id}
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: [0.1, 0.3, 0.1],
                scale: [1, 1.5, 1],
                x: [0, Math.random() * 200 - 100],
                y: [0, Math.random() * 200 - 100]
              }}
              transition={{
                duration: 15 + i * 3,
                repeat: Infinity,
                ease: 'easeInOut'
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
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="inline-flex items-center gap-3 md:gap-8 px-5 md:px-8 py-2 md:py-3 bg-white/95 border border-espresso/10 rounded-full shadow-premium mb-10 md:mb-16"
          >
            <div className="w-2 h-2 bg-caramel rounded-full animate-pulse" />
            <span className="text-coffee-950 uppercase tracking-[0.2em] text-[0.7rem] md:text-[0.8rem] font-semibold">
              Premium Coffee • Delivered Fresh
            </span>
          </motion.div>

          <header className="relative mb-6 md:mb-16">
            <h1 className="text-fluid-hero font-display font-black leading-[0.9] md:leading-[0.88] tracking-tight text-coffee-950">
              Premium Coffee. <span className="block text-caramel">Delivered Fresh.</span>
            </h1>
          </header>

          <div className="max-w-3xl mx-auto space-y-10 md:space-y-16">
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.6, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="text-fluid-subtitle text-coffee-600 font-serif leading-relaxed px-2 md:px-4 tracking-tight"
            >
              Discover specialty coffee beans, brewing tools, and curated subscriptions delivered directly to your door.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.4, delay: 1, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col sm:flex-row gap-3 md:gap-6 items-center justify-center pt-2 md:pt-6"
            >
              <Link to="/subscriptions" className="btn-premium w-full sm:w-auto justify-center">
                <span className="relative z-10 flex items-center gap-3">
                  Start Subscription <ArrowRight size={20} />
                </span>
              </Link>
              <Link to="/shop" className="btn-secondary w-full sm:w-auto justify-center">
                Shop Coffee
              </Link>
            </motion.div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 1.2 }}
          animate={{ opacity: 0.1, scale: 1 }}
          transition={{ duration: 5, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 pointer-events-none z-0"
        >
          <img
            src="https://images.unsplash.com/photo-1442551320318-79bb0e4511fb?auto=format&fit=crop&q=80&w=2500"
            alt="Fresh coffee beans" 
            className="w-full h-full object-cover grayscale mix-blend-overlay"
          />
        </motion.div>
      </section>

      {/* Trusted Coffee Sourcing */}
      <section className="section-spacing bg-coffee-50 relative z-10 overflow-hidden">
        <div className="mesh-gradient absolute inset-0 opacity-[0.06]" />
        <div className="page-container px-6 md:px-12 lg:px-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 md:gap-32 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
              viewport={{ once: true }}
              className="lg:col-span-5 space-y-8 md:space-y-16"
            >
              <div className="space-y-4 md:space-y-6">
                <span className="stat-label text-caramel tracking-[0.8em]">PREMIUM PARTNERSHIPS</span>
                <h2 className="text-fluid-heading font-display font-black leading-[0.9] tracking-tight uppercase">
                  Specialty Coffee <br />
                  <span className="text-espresso not-italic underline decoration-caramel/10 underline-offset-[1.2rem]">
                    From Trusted Roasters.
                  </span>
                </h2>
              </div>
              <p className="text-fluid-body text-coffee-500 font-serif leading-relaxed pl-0 md:pl-12 border-l-0 md:border-l-2 border-espresso/5">
                We partner with premium coffee roasters and suppliers to bring fresh beans, brewing equipment, and curated collections directly to your home.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-8">
                {[
                  { value: '10,000+', label: 'Orders Delivered' },
                  { value: '95%', label: 'Customer Satisfaction' },
                  { value: '4.9/5', label: 'Coffee Selection Rating' },
                  { value: 'Worldwide', label: 'Global Sourcing' }
                ].map((stat) => (
                  <div key={stat.label} className="rounded-[1.75rem] bg-white/90 p-6 shadow-premium">
                    <p className="text-fluid-title font-display font-black text-espresso mb-2">{stat.value}</p>
                    <p className="text-fluid-small font-semibold uppercase tracking-[0.2em] text-coffee-700">
                      {stat.label}
                    </p>
                  </div>
                ))}
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
                  alt="Roasted coffee" 
                  className="w-full h-full object-cover transition-transform duration-[10s] group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-espresso/10 mix-blend-multiply" />
              </motion.div>

              <motion.div
                animate={{ y: [0, -20, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -bottom-6 -left-6 md:-bottom-10 md:-left-10 bg-cream p-4 md:p-10 rounded-[1.5rem] md:rounded-[3rem] shadow-premium-lg border border-cream-dark hidden sm:block"
              >
                <Compass className="text-caramel mb-2 md:mb-4 w-6 h-6 md:w-8 md:h-8" strokeWidth={1} />
                <p className="text-fluid-small font-black uppercase tracking-[0.3em] md:tracking-[0.4em] text-espresso">Worldwide Sourcing</p>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Subscription Experience */}
      <section className="py-12 sm:py-20 lg:py-28 bg-espresso relative overflow-hidden rounded-[2rem] mx-4 sm:mx-6 lg:mx-12 my-10 sm:my-14">
         <div className="absolute inset-0 mesh-gradient opacity-15" />
         <div className="absolute top-0 right-0 w-[250px] md:w-[700px] h-[250px] md:h-[700px] bg-caramel/10 blur-[100px] md:blur-[200px] rounded-full animate-pulse" />
         
         <div className="page-container relative z-10 text-center px-6 md:px-12">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 2, ease: [0.22, 1, 0.36, 1] }}
              viewport={{ once: true }}
              className="space-y-8 md:space-y-20"
            >
              <div className="space-y-4 md:space-y-8">
                <span className="stat-label text-caramel-gold tracking-[0.8em]">SUBSCRIPTION PLANS</span>
                <h2 className="text-fluid-hero font-display font-black leading-none tracking-tightest text-secondary uppercase">
                   Coffee Subscriptions <span className="not-italic text-caramel underline decoration-white/5 underline-offset-[2vw]">Made Simple.</span>
                </h2>
                <p className="text-fluid-subtitle text-secondary font-serif italic max-w-3xl mx-auto leading-relaxed">
                  Fresh, flexible subscriptions built for every routine—from weekly favorites to specialty small-batch drops.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 pt-4 md:pt-12">
                 {[
                   { label: 'Weekly Freshness', description: 'Fresh beans delivered weekly.' },
                   { label: 'Bulk Plans', description: 'Premium bags for every routine.' },
                   { label: 'Exclusive Coffees', description: 'Curated specialty small-batches.' }
                 ].map((plan) => (
                   <motion.div 
                    key={plan.label}
                    whileHover={{ y: -8 }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className="rounded-[2rem] bg-white/10 border border-white/10 p-6 md:p-8 backdrop-blur-3xl shadow-premium-lg"
                   >
                     <p className="text-fluid-title font-display font-black text-primary mb-3">{plan.label}</p>
                     <p className="text-fluid-small font-serif text-coffee-200 leading-relaxed">{plan.description}</p>
                   </motion.div>
                 ))}
              </div>

              <div className="pt-8 md:pt-16">
                 <Link to="/subscriptions" className="btn-premium px-10 md:px-20 py-4 md:py-5 text-fluid-small md:text-base inline-flex items-center justify-center gap-3 mx-auto shadow-2xl shadow-espresso/30 bg-secondary text-[#0e372b] hover:bg-primary hover:text-secondary">
                    Start Subscription
                 </Link>
              </div>
            </motion.div>
         </div>
      </section>

      {/* Collections Showcase */}
      <section className="section-spacing bg-palette-b-light relative overflow-hidden">
        <div className="mesh-gradient absolute inset-0 opacity-[0.03]" />
        <div className="page-container relative z-10 px-6 md:px-12 lg:px-24">
          <div className="flex flex-col xl:flex-row justify-between xl:items-end gap-10 md:gap-24 mb-12 md:mb-48">
            <div className="max-w-4xl space-y-4 md:space-y-12">
              <span className="stat-label text-caramel tracking-[0.8em] md:tracking-[1.2em]">UNIT_02 / THE_COLLECTION</span>
              <h2 className="text-fluid-hero font-display font-black leading-[0.8] md:leading-[0.7] tracking-tightest text-espresso uppercase">
                Explore <br />
                <span className="text-caramel-gold italic font-light lowercase">our collections</span> for every ritual.
              </h2>
            </div>
            <Link to="/shop" className="group text-fluid-small font-black uppercase tracking-[0.3em] md:tracking-[0.6em] text-espresso flex items-center gap-4 md:gap-8 pb-3 md:pb-8 border-b-2 border-espresso/5 hover:border-caramel transition-all duration-1000 italic shrink-0 w-fit">
              Shop Now <ArrowRight className="group-hover:translate-x-8 transition-transform duration-1000 text-caramel w-5 h-5 md:w-6 md:h-6" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-10">
            {[
              { name: 'Single Origin Beans', img: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=1200', link: 'beans', tag: 'Single Origin' },
              { name: 'Signature Capsules', img: 'https://images.unsplash.com/photo-1521302080487-3c5e29734232?w=1200', link: 'capsules', tag: 'Signature Capsules' },
              { name: 'Precision Brewers', img: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=1200', link: 'machines', tag: 'Precision Brewers' },
              { name: 'Ritual Accessories', img: 'https://images.unsplash.com/photo-1521305878185-3c8946ea66b7?w=1200', link: 'accessories', tag: 'Ritual Accessories' }
            ].map((cat, i) => (
              <motion.div
                key={cat.name}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.2, delay: i * 0.15, ease: [0.22, 1, 0.36, 1] }}
                viewport={{ once: true }}
              >
                <Link to={`/category/${cat.link}`} className="group relative block aspect-[4/5] sm:aspect-[4/6] rounded-[1.5rem] md:rounded-[4rem] overflow-hidden shadow-premium-lg hover-premium border border-espresso/[0.03]">
                  <img src={cat.img} className="w-full h-full object-cover transition-transform duration-[6s] group-hover:scale-125 saturate-[0.8] brightness-[0.9]" alt={cat.name} />
                  <div className="absolute inset-x-0 bottom-0 h-2/3 archive-gradient" />
                  <div className="absolute top-6 left-6 md:top-10 md:left-10">
                    <span className="px-3 md:px-5 py-1 md:py-2 bg-white/10 backdrop-blur-3xl rounded-full text-fluid-small font-black uppercase tracking-[0.3em] md:tracking-[0.5em] text-coffee-950 italic border border-white/10 group-hover:bg-caramel group-hover:text-white transition-all duration-700">{cat.tag}</span>
                  </div>
                  <div className="absolute bottom-6 left-6 right-6 md:bottom-10 md:left-10 md:right-10 text-coffee-950 transform group-hover:-translate-y-4 transition-transform duration-1000">
                    <h3 className="text-fluid-title font-display font-black italic mb-2 md:mb-3 leading-none uppercase tracking-tighter">{cat.name}</h3>
                    <p className="text-fluid-small font-black uppercase tracking-[0.3em] md:tracking-[0.5em] text-caramel opacity-0 group-hover:opacity-100 transition-all duration-1000 italic translate-y-4 group-hover:translate-y-0">Shop Now</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>


      {/* AI Recommendations */}
      <section className="section-spacing bg-coffee-950 text-white overflow-hidden relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05),transparent_70%)]" />
        <div className="page-container relative z-10 px-6 md:px-12">
          <div className="flex flex-col lg:flex-row items-center gap-10 md:gap-32">
            <div className="relative shrink-0 pt-10 md:pt-20">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
                className="w-[18rem] h-[18rem] sm:w-[25rem] sm:h-[25rem] md:w-[35rem] md:h-[35rem] border border-white/10 rounded-full flex items-center justify-center p-8 md:p-12"
              >
                <div className="w-full h-full border border-caramel/20 rounded-full flex items-center justify-center p-8 md:p-12 relative">
                   <div className="absolute inset-0 bg-caramel/10 blur-[60px] md:blur-[100px] rounded-full animate-pulse" />
                </div>
              </motion.div>
              <motion.div
                animate={{ y: [0, -20, 0] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <div className="p-6 md:p-20 bg-white/10 backdrop-blur-3xl border border-white/15 rounded-[2rem] md:rounded-[5rem] shadow-premium-xl flex flex-col items-center gap-4 md:gap-12 group hover:border-caramel/30 transition-all duration-1000">
                   <Sparkles className="text-caramel-gold group-hover:scale-125 transition-transform duration-1000 w-10 h-10 md:w-20 md:h-20" strokeWidth={1} />
                   <div className="text-center space-y-3 md:space-y-6">
                     <p className="text-fluid-small font-black uppercase tracking-[0.3em] md:tracking-[0.8em] text-white italic">Taste Profile</p>
                     <p className="text-fluid-subtitle font-serif italic text-primary">"Personalized pairing for your next cup."</p>
                   </div>
                </div>
              </motion.div>
            </div>

            <div className="space-y-8 md:space-y-20 text-center lg:text-left max-w-4xl">
              <div className="space-y-6 md:space-y-12">
                <span className="stat-label text-caramel-gold">AI-Ready Rituals</span>
                <h2 className="text-fluid-hero font-display font-light leading-[0.9] md:leading-[0.8] tracking-tightest italic">
                  Coffee Recommendations <span className="text-primary font-black not-italic block uppercase">crafted for your ritual.</span>
                </h2>
                <p className="text-fluid-body text-primary font-serif leading-relaxed italic max-w-2xl mx-auto lg:mx-0">
                  Find the roast, grind, and delivery cadence tailored to your flavor preferences, brew style, and weekly coffee routine.
                </p>
              </div>
              <Link to="/ai-barista" className="btn-premium px-10 md:px-20 py-5 md:py-6 text-fluid-small md:text-base group inline-flex items-center justify-center gap-3 shadow-premium-xl">
                Get Recommendations <Sparkles size={20} className="group-hover:scale-125 transition-transform duration-1000 text-caramel-gold" />
              </Link>
            </div>
          </div>
        </div>
      </section>

</div>
  );
}
