import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import SEO from '../components/common/SEO';

const FAQS = [
  { q: "Where do you source your beans?", a: "We source directly from sustainable farms in Ethiopia, Colombia, and the mountains of Lebanon." },
  { q: "How long does shipping take?", a: "Most orders arrive within 24-48 hours within Lebanon. International shipping takes 5-7 business days." },
  { q: "Can I cancel my subscription?", a: "Yes, you can pause or cancel anytime through your dashboard with no hidden fees." },
  { q: "Are your capsules biodegradable?", a: "Absolutely. Our ritual capsules are 100% compostable and plastic-free." }
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="pt-20 sm:pt-30 md:pt-40 pb-20 sm:pb-30 md:pb-40 min-h-screen bg-cream relative overflow-hidden">
      <SEO title="FAQ" description="Frequently asked questions about CoffeeCraze subscriptions, shipping, and sourcing." />
      <div className="mesh-gradient absolute inset-0 opacity-20 pointer-events-none" />
      
      <div className="page-container max-w-4xl relative z-10">
        <div className="text-center space-y-6 sm:space-y-8 md:space-y-10 mb-16 md:mb-24 lg:mb-32">
          <span className="stat-label text-coffee-400">Knowledge Base</span>
          <h1 className="text-fluid-heading font-display font-black text-coffee-950 tracking-tightest leading-none italic">Frequent Sensory <br/><span className="not-italic text-coffee-500">Inquiries.</span></h1>
          <p className="text-fluid-body text-coffee-400 font-medium italic max-w-xl mx-auto">"Clarifying the protocol for our global roastery nodes and daily rituals."</p>
        </div>

        <div className="space-y-4 sm:space-y-5 md:space-y-6">
          {FAQS.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: i * 0.1 }}
              className="group border border-coffee-50 rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden bg-white shadow-premium hover:border-coffee-500 transition-all duration-700"
            >
              <button 
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full p-6 sm:p-8 md:p-10 flex items-center justify-between text-left transition-all hover:bg-cream"
              >
                <span className="text-fluid-subtitle font-display font-black text-coffee-950 tracking-tight italic">{faq.q}</span>
                <div className={cn("w-8 sm:w-10 h-8 sm:h-10 rounded-full flex items-center justify-center border border-coffee-100 transition-all duration-700 shrink-0 ml-4", open === i ? "bg-coffee-950 text-white rotate-180" : "bg-white text-coffee-400 group-hover:border-coffee-500 group-hover:text-coffee-500")}>
                  <ChevronDown size={16} />
                </div>
              </button>
              <AnimatePresence>
                {open === i && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 sm:px-8 md:px-10 pb-6 sm:pb-8 md:pb-10 text-fluid-body text-coffee-400 leading-relaxed italic border-t border-coffee-50/50 pt-6 sm:pt-7 md:pt-8 mx-4 sm:mx-6 md:mx-8">
                      "{faq.a}"
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="mt-16 sm:mt-20 md:mt-24 lg:mt-32 p-6 sm:p-8 md:p-10 lg:p-12 bg-coffee-950 rounded-[3rem] sm:rounded-[3.5rem] lg:rounded-[4rem] text-center space-y-6 sm:space-y-8 shadow-premium-lg"
        >
          <h3 className="text-fluid-title font-display font-black text-white italic tracking-tighter">Query Unresolved?</h3>
          <p className="text-coffee-400 max-w-sm mx-auto text-fluid-body italic">"Transmitting signals to our technical support units is highly encouraged."</p>
          <Link to="/contact" className="inline-block px-8 sm:px-10 py-4 sm:py-5 bg-coffee-500 text-coffee-950 rounded-full text-fluid-small font-black uppercase tracking-[0.4em] hover:bg-white transition-all shadow-xl">
             OPEN DIRECT CHANNEL
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
