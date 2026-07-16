import { motion } from 'motion/react';
import { ArrowRight, Sparkles, Compass } from 'lucide-react';
import { Link } from 'react-router-dom';
import Seo from '../components/common/SEO';
import ImageWithFallback from '../components/common/ImageWithFallback';
import { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'sonner';

export default function Home() {
  const [heroContent, setHeroContent] = useState({
    title: 'Premium Coffee. Delivered Fresh.',
    subtitle: 'Premium Coffee • Delivered Fresh',
    description: 'Discover specialty coffee beans, brewing tools, and curated subscriptions delivered directly to your door.',
    image: 'https://images.unsplash.com/photo-1442551320318-79bb0e4511fb?auto=format&fit=crop&q=80&w=2500',
    ctaText: 'Start Subscription',
    ctaLink: '/subscriptions'
  });

  useEffect(() => {
    const fetchHero = async () => {
      try {
        const snap = await getDocs(query(collection(db, 'cms_content'), where('type', '==', 'hero'), where('visible', '==', true)));
        if (!snap.empty) {
          const d = snap.docs[0].data();
          setHeroContent({
            title: d.title || 'Premium Coffee. Delivered Fresh.',
            subtitle: d.subtitle || 'Premium Coffee • Delivered Fresh',
            description: d.body || 'Discover specialty coffee beans, brewing tools, and curated subscriptions delivered directly to your door.',
            image: d.image || 'https://images.unsplash.com/photo-1442551320318-79bb0e4511fb?auto=format&fit=crop&q=80&w=2500',
            ctaText: d.ctaText || 'Start Subscription',
            ctaLink: d.ctaLink || '/subscriptions'
          });
        }
      } catch (err) {
        console.warn('Failed to load CMS hero, using defaults.', err);
        toast.error('Failed to load hero content, using defaults.');
      }
    };
    fetchHero();
  }, []);

  return (
    <div className="relative overflow-hidden bg-cream">
      <Seo title="Home" description="Experience the finest premium coffee ritual delivered to your door by CoffeeCraze." />

      <section className="relative min-h-[70vh] flex flex-col items-center justify-center overflow-hidden" style={{ padding: '80px 0' }}>
        <div className="mesh-gradient absolute inset-0 opacity-50" />

        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.25, 0.15], rotate: [0, 45, 0] }}
            transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
            className="absolute top-[-10%] right-[-5%] w-[80rem] h-[80rem] bg-caramel/5 blur-[200px] rounded-full"
          />
          <motion.div
            animate={{ scale: [1.2, 1, 1.2], opacity: [0.1, 0.2, 0.1], rotate: [0, -45, 0] }}
            transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
            className="absolute bottom-[-20%] left-[-10%] w-[60rem] h-[60rem] bg-espresso/5 blur-[150px] rounded-full"
          />
        </div>

        <div className="relative z-10 w-full max-w-5xl flex flex-col items-center text-center px-5">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="inline-flex items-center gap-3 px-5 py-2 bg-surface/90 border border-border rounded-full shadow-sm mb-10 md:mb-16"
          >
            <div className="w-2 h-2 bg-caramel rounded-full animate-pulse" />
            <span className="text-caption text-text">{heroContent.subtitle}</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="text-display text-text max-w-4xl mb-6 md:mb-12"
          >
            {heroContent.title}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.6, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="text-body text-text-secondary max-w-2xl px-2 mb-8 md:mb-12"
          >
            {heroContent.description}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.4, delay: 1, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col sm:flex-row gap-3 items-center justify-center"
          >
            <Link to={heroContent.ctaLink} className="btn btn-primary btn-lg w-full sm:w-auto">
              {heroContent.ctaText} <ArrowRight size={20} />
            </Link>
            <Link to="/shop" className="btn btn-outline btn-lg w-full sm:w-auto">
              Shop Coffee
            </Link>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 1.2 }}
          animate={{ opacity: 0.4, scale: 1 }}
          transition={{ duration: 5, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 z-0"
        >
          <img src={heroContent.image} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-espresso/80 via-espresso/60 to-espresso/90" />
        </motion.div>
      </section>

      {/* Trusted Coffee Sourcing */}
      <section className="bg-cream" style={{ padding: '80px 0' }}>
        <div className="mesh-gradient absolute inset-0 opacity-[0.06] pointer-events-none" />
        <div className="page-container relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 md:gap-32 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
              viewport={{ once: true }}
              className="lg:col-span-5 space-y-8 md:space-y-12"
            >
              <div className="space-y-4">
                <span className="text-caption text-caramel">Premium Partnerships</span>
                <h2 className="text-h1 text-text">
                  Specialty Coffee <br />
                  <span className="text-espresso underline decoration-caramel/20 underline-offset-8">From Trusted Roasters.</span>
                </h2>
              </div>
              <p className="text-body text-text-secondary leading-relaxed">
                We partner with premium coffee roasters and suppliers to bring fresh beans, brewing equipment, and curated collections directly to your home.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { value: '10,000+', label: 'Orders Delivered' },
                  { value: '95%', label: 'Customer Satisfaction' },
                  { value: '4.9/5', label: 'Coffee Selection Rating' },
                  { value: 'Worldwide', label: 'Global Sourcing' }
                ].map((stat) => (
                  <div key={stat.label} className="rounded-xl bg-surface p-5 shadow-sm">
                    <p className="text-h3 text-espresso mb-1">{stat.value}</p>
                    <p className="text-caption text-text-muted">{stat.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            <div className="lg:col-span-7 relative pt-12 lg:pt-0">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, rotate: -3 }}
                whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ duration: 2, ease: [0.22, 1, 0.36, 1] }}
                viewport={{ once: true }}
                className="relative aspect-video lg:aspect-[16/10] rounded-2xl overflow-hidden shadow-md group"
              >
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&q=80&w=1200"
                  alt="Roasted coffee"
                  className="w-full h-full object-cover transition-transform duration-[10s] group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-espresso/10 mix-blend-multiply" />
              </motion.div>

              <motion.div
                animate={{ y: [0, -15, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -bottom-6 -left-6 bg-surface p-5 rounded-xl shadow-md border border-border hidden sm:block"
              >
                <Compass className="text-caramel mb-2 w-6 h-6" strokeWidth={1} />
                <p className="text-caption text-espresso">Worldwide Sourcing</p>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Subscription Experience */}
      <section className="bg-espresso relative overflow-hidden" style={{ padding: '80px 0' }}>
        <div className="absolute inset-0 mesh-gradient opacity-15" />
        <div className="absolute top-0 right-0 w-[250px] md:w-[700px] h-[250px] md:h-[700px] bg-caramel/10 blur-[100px] md:blur-[200px] rounded-full animate-pulse" />

        <div className="page-container relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 2, ease: [0.22, 1, 0.36, 1] }}
            viewport={{ once: true }}
            className="space-y-8 md:space-y-16"
          >
            <div className="space-y-4">
              <span className="text-caption text-caramel">Subscription Plans</span>
              <h2 className="text-display text-white">
                Coffee Subscriptions <span className="text-white underline decoration-white/5 underline-offset-[1vw]">Made Simple.</span>
              </h2>
              <p className="text-body text-white/80 max-w-3xl mx-auto leading-relaxed">
                Fresh, flexible subscriptions built for every routine—from weekly favorites to specialty small-batch drops.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              {[
                { label: 'Weekly Freshness', description: 'Fresh beans delivered weekly.' },
                { label: 'Bulk Plans', description: 'Premium bags for every routine.' },
                { label: 'Exclusive Coffees', description: 'Curated specialty small-batches.' }
              ].map((plan) => (
                <motion.div
                  key={plan.label}
                  whileHover={{ y: -6 }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className="rounded-xl bg-surface p-6 shadow-md"
                >
                  <p className="text-h3 text-espresso mb-2">{plan.label}</p>
                  <p className="text-small text-text-secondary">{plan.description}</p>
                </motion.div>
              ))}
            </div>

            <div>
              <Link to="/subscriptions" className="btn btn-primary btn-lg">
                Start Subscription <ArrowRight size={20} />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Collections Showcase */}
      <section className="bg-cream relative overflow-hidden" style={{ padding: '80px 0' }}>
        <div className="mesh-gradient absolute inset-0 opacity-[0.03] pointer-events-none" />
        <div className="page-container relative z-10">
          <div className="flex flex-col xl:flex-row justify-between xl:items-end gap-8 mb-12 md:mb-24">
            <div className="max-w-3xl space-y-4">
              <span className="text-caption text-caramel">The Collection</span>
              <h2 className="text-display text-text">
                Explore <span className="text-caramel">our collections</span> for every ritual.
              </h2>
            </div>
            <Link to="/shop" className="group flex items-center gap-3 text-small font-bold tracking-wide text-espresso border-b-2 border-border hover:border-caramel transition-all duration-500 pb-2 shrink-0 w-fit">
              Shop Now <ArrowRight className="group-hover:translate-x-4 transition-transform duration-500 text-caramel w-5 h-5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {[
              { name: 'Single Origin Beans', img: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=1200', link: 'Coffee Beans', tag: 'Coffee Beans' },
              { name: 'Signature Capsules', img: 'https://images.unsplash.com/photo-1521302080487-3c5e29734232?w=1200', link: 'Capsules', tag: 'Capsules' },
              { name: 'Precision Brewers', img: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=1200', link: 'Espresso Machines', tag: 'Espresso Machines' },
              { name: 'Ritual Accessories', img: 'https://images.unsplash.com/photo-1521305878185-3c8946ea66b7?w=1200', link: 'Accessories', tag: 'Accessories' }
            ].map((cat, i) => (
              <motion.div
                key={cat.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: i * 0.15, ease: [0.22, 1, 0.36, 1] }}
                viewport={{ once: true }}
              >
                <Link to={`/category/${cat.link}`} className="group relative block aspect-[4/5] rounded-xl overflow-hidden shadow-sm border border-border/30 hover-lift">
                  <ImageWithFallback src={cat.img} className="w-full h-full object-cover transition-transform duration-[6s] group-hover:scale-110 brightness-90" alt={cat.name} />
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-caption text-white border border-white/20 group-hover:bg-caramel group-hover:text-white transition-all duration-500">{cat.tag}</span>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <h3 className="text-h4 font-bold mb-1">{cat.name}</h3>
                    <p className="text-caption text-caramel opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-2 group-hover:translate-y-0">Shop Now</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Recommendations */}
      <section className="bg-espresso text-white overflow-hidden relative" style={{ padding: '80px 0' }}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05),transparent_70%)]" />
        <div className="page-container relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-10 md:gap-24">
            <div className="relative shrink-0 pt-10 md:pt-20">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
                className="w-[18rem] h-[18rem] sm:w-[25rem] sm:h-[25rem] md:w-[30rem] md:h-[30rem] border border-white/10 rounded-full flex items-center justify-center p-8 md:p-12"
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
                <div className="p-6 md:p-16 bg-surface border border-border rounded-2xl shadow-md flex flex-col items-center gap-4 group hover:border-caramel/30 transition-all duration-500">
                  <Sparkles className="text-caramel group-hover:scale-110 transition-transform duration-500 w-10 h-10 md:w-16 md:h-16" strokeWidth={1} />
                  <div className="text-center space-y-2">
                    <p className="text-caption text-text-muted">Taste Profile</p>
                    <p className="text-body text-text-secondary italic">"Personalized pairing for your next cup."</p>
                  </div>
                </div>
              </motion.div>
            </div>

            <div className="space-y-8 md:space-y-12 text-center lg:text-left max-w-3xl">
              <div className="space-y-4">
                <span className="text-caption text-caramel/80">Curated Rituals</span>
                <h2 className="text-display text-white">
                  Coffee Recommendations <span className="text-caramel block">crafted for your ritual.</span>
                </h2>
                <p className="text-body text-white/70 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                  Find the roast, grind, and delivery cadence tailored to your flavor preferences, brew style, and weekly coffee routine.
                </p>
              </div>
              <Link to="/ai-barista" className="btn btn-primary btn-lg inline-flex items-center gap-3">
                Get Recommendations <Sparkles size={18} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
