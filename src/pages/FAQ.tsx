import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const FAQS = [
  { q: "Where do you source your beans?", a: "We source directly from sustainable farms in Ethiopia, Colombia, and the mountains of Lebanon." },
  { q: "How long does shipping take?", a: "Most orders arrive within 24-48 hours within Lebanon. International shipping takes 5-7 business days." },
  { q: "Can I cancel my subscription?", a: "Yes, you can pause or cancel anytime through your dashboard with no hidden fees." },
  { q: "Are your capsules biodegradable?", a: "Absolutely. Our ritual capsules are 100% compostable and plastic-free." }
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="pt-40 pb-40 px-6 max-w-4xl mx-auto min-h-screen bg-white">
      <div className="text-center space-y-10 mb-32">
        <span className="text-[10px] font-black uppercase tracking-[1em] text-coffee-400 block italic">Knowledge Base</span>
        <h1 className="text-7xl font-display font-black text-coffee-950 tracking-tightest leading-none italic">Frequent Sensory <br/><span className="not-italic text-coffee-500">Inquiries.</span></h1>
        <p className="text-xl text-coffee-400 font-medium italic max-w-xl mx-auto">"Clarifying the protocol for our global roastery nodes and daily rituals."</p>
      </div>

      <div className="space-y-6 relative z-10">
        {FAQS.map((faq, i) => (
          <div key={i} className="group border border-coffee-50 rounded-[2.5rem] overflow-hidden bg-[#faf8f5] shadow-premium hover:border-coffee-500 transition-all duration-700">
            <button 
              onClick={() => setOpen(open === i ? null : i)}
              className="w-full p-10 flex items-center justify-between text-left transition-all group-hover:bg-white"
            >
              <span className="text-xl font-display font-black text-coffee-950 tracking-tight italic">{faq.q}</span>
              <div className={cn("w-10 h-10 rounded-full flex items-center justify-center border border-coffee-100 transition-all duration-700", open === i ? "bg-coffee-950 text-white rotate-180" : "bg-white text-coffee-400 group-hover:border-coffee-500 group-hover:text-coffee-500")}>
                <ChevronDown size={18} />
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
                  <div className="px-10 pb-10 text-lg text-coffee-400 leading-relaxed italic border-t border-coffee-50/50 pt-8 mt-1 mx-4">
                    "{faq.a}"
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
      
      <div className="mt-32 p-12 bg-coffee-950 rounded-[4rem] text-center space-y-8 shadow-premium-lg">
        <h3 className="text-3xl font-display font-black text-white italic tracking-tighter">Query Unresolved?</h3>
        <p className="text-coffee-400 max-w-sm mx-auto text-sm italic">"Transmitting signals to our technical support units is highly encouraged."</p>
        <button className="px-10 py-5 bg-coffee-500 text-coffee-950 rounded-full text-[10px] font-black uppercase tracking-[0.4em] hover:bg-white transition-all shadow-xl">
           OPEN DIRECT CHANNEL
        </button>
      </div>
    </div>
  );
}
