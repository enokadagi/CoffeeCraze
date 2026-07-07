import { ChevronDown, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import SEO from '../components/common/SEO';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  order: number;
  visible: boolean;
}

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const q = query(collection(db, 'faqs'), where('visible', '==', true), orderBy('order'));
        const snap = await getDocs(q);
        if (!snap.empty) {
          setFaqs(snap.docs.map(d => ({ id: d.id, ...d.data() } as FAQItem)));
        }
      } catch (err) {
        console.error('Failed to fetch FAQs:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFaqs();
  }, []);

  const items = faqs;

  return (
    <div className="pt-20 sm:pt-30 md:pt-40 pb-20 sm:pb-30 md:pb-40 min-h-screen bg-cream relative overflow-hidden">
      <SEO title="FAQ" description="Frequently asked questions about CoffeeCraze subscriptions, shipping, and sourcing." />
      <div className="mesh-gradient absolute inset-0 opacity-20 pointer-events-none" />
      
      <div className="page-container max-w-4xl relative z-10">
        <div className="text-center space-y-6 sm:space-y-8 md:space-y-10 mb-16 md:mb-24 lg:mb-32">
          <span className="text-caption text-text-muted">Knowledge Base</span>
          <h1 className="text-h1 font-display font-black text-text tracking-tightest leading-none italic">Frequently Asked <br/><span className="not-italic text-text-muted">Questions.</span></h1>
          <p className="text-body text-text-muted font-medium italic max-w-xl mx-auto">Answers to your sourcing, shipping, and subscription questions.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={32} className="text-caramel animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-16 h-16 bg-cream rounded-full flex items-center justify-center mx-auto mb-6">
              <ChevronDown size={24} className="text-text-muted rotate-180" />
            </div>
            <h3 className="text-xl font-display font-bold text-text-secondary mb-2">No FAQs Yet</h3>
            <p className="text-sm text-text-muted mb-4">FAQ content is being prepared. Check back soon or contact us directly.</p>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-5 md:space-y-6">
            {items.map((faq, i) => (
              <motion.div
                key={faq.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: i * 0.1 }}
                className="group border border-border-light rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden bg-white shadow-premium hover:border-coffee-500 transition-all duration-700"
              >
                <button 
                  onClick={() => setOpen(open === i ? null : i)}
                  className="w-full p-6 sm:p-8 md:p-10 flex items-center justify-between text-left transition-all hover:bg-cream"
                >
                  <span className="text-h3 font-display font-black text-text tracking-tight italic">{faq.question}</span>
                  <div className={cn("w-8 sm:w-10 h-8 sm:h-10 rounded-full flex items-center justify-center border border-border transition-all duration-700 shrink-0 ml-4", open === i ? "bg-coffee-950 text-white rotate-180" : "bg-white text-text-muted group-hover:border-coffee-500 group-hover:text-text-muted")}>
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
                      <div className="px-6 sm:px-8 md:px-10 pb-6 sm:pb-8 md:pb-10 text-body text-text-muted leading-relaxed italic border-t border-border-light/50 pt-6 sm:pt-7 md:pt-8 mx-4 sm:mx-6 md:mx-8">
                        "{faq.answer}"
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
        
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="mt-16 sm:mt-20 md:mt-24 lg:mt-32 p-6 sm:p-8 md:p-10 lg:p-12 bg-coffee-950 rounded-[3rem] sm:rounded-[3.5rem] lg:rounded-[4rem] text-center space-y-6 sm:space-y-8 shadow-premium-lg"
        >
          <h3 className="text-h2 font-display font-black text-white italic tracking-tighter">Query Unresolved?</h3>
          <p className="text-text-muted max-w-sm mx-auto text-body italic">"Transmitting signals to our technical support units is highly encouraged."</p>
          <Link to="/contact" className="inline-block px-8 sm:px-10 py-4 sm:py-5 bg-caramel text-espresso rounded-full text-small font-black uppercase tracking-[0.4em] hover:bg-white hover:text-espresso transition-all shadow-xl">
             OPEN DIRECT CHANNEL
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
