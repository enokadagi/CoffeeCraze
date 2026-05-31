import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Bot, User, Sparkles, Loader2 } from 'lucide-react';
import { GeminiService } from '../services/gemini';
import { cn } from '../lib/utils';
import ReactMarkdown from 'react-markdown';
import SEO from '../components/common/SEO';

export default function AiBarista() {
  const [messages, setMessages] = useState<{role: 'user' | 'model', content: string}[]>([
    { role: 'model', content: "Welcome to the CoffeeCraze AI Barista. Tell me your preferred roast, brew method, or flavor mood, and I'll craft the perfect coffee ritual for you." }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const history = messages.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }));
      const response = await GeminiService.getBaristaResponse(userMessage, history);
      setMessages(prev => [...prev, { role: 'model', content: response }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'model', content: "Protocol interruption. Sensory data corrupted. Please restate your requirement." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="pt-16 sm:pt-20 h-screen flex flex-col bg-cream text-black overflow-hidden relative">
      <SEO title="AI Barista" description="Chat with the CoffeeCraze AI Barista for personalized coffee recommendations." />
      <div className="absolute inset-0 bg-gradient-to-br from-white via-cream to-cream/90 opacity-100 pointer-events-none"></div>
      
      <div className="px-4 sm:px-6 md:px-10 py-4 sm:py-6 md:py-10 border-b border-coffee-200 bg-white/95 sticky top-0 z-20 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-cream rounded-[1.5rem] flex items-center justify-center text-coffee-950 shadow-premium relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-tr from-caramel/40 to-transparent group-hover:scale-110 transition-transform duration-700"></div>
              <Sparkles size={24} className="relative z-10" />
            </div>
            <div className="space-y-0.5 sm:space-y-1">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-black text-[#0e372b] tracking-tighter italic">AI Barista <span className="not-italic text-[#0e372b]">v1.0</span></h1>
              <p className="text-[10px] font-black text-[#0e372b] uppercase tracking-[0.4em] leading-none">Flavor Concierge • Beirut Lounge</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-4 px-5 py-2.5 bg-white/80 rounded-full border border-coffee-100 shadow-sm">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
            <span className="text-[10px] font-black text-black uppercase tracking-[0.3em] italic">System Nominal</span>
          </div>
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex-grow min-h-0 overflow-y-auto overflow-x-hidden pt-8 sm:pt-12 pb-32 sm:pb-40 md:pb-48 px-4 sm:px-6 no-scrollbar scroll-smooth"
      >
        <div className="max-w-5xl mx-auto space-y-8 sm:space-y-12">
          <AnimatePresence mode="popLayout" initial={false}>
            {messages.map((msg, i) => (
              <motion.div
                layout
                initial={{ opacity: 0, x: msg.role === 'user' ? 30 : -30, scale: 0.98 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                key={i}
                className={cn(
                  "flex items-start gap-4 sm:gap-6 max-w-[95%] md:max-w-[85%]",
                  msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                )}
              >
                <div 
                  className={cn(
                    "w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-premium",
                    msg.role === 'user' ? "bg-coffee-50 text-black" : "bg-white border border-coffee-50 text-black"
                  )}
                >
                  {msg.role === 'user' ? <User size={20} /> : <div className="text-base sm:text-xl font-display font-black leading-none italic">dg</div>}
                </div>
                <div className={cn(
                  "p-4 sm:p-6 md:p-8 rounded-[1.5rem] sm:rounded-[2rem] lg:rounded-[3rem] text-sm leading-relaxed shadow-premium relative",
                  msg.role === 'user' 
                      ? "bg-coffee-50 text-[#0e372b] rounded-tr-none border border-coffee-200" 
                      : "bg-white text-[#0e372b] border border-coffee-50 rounded-tl-none"
                )}>
                  <div className="markdown-body prose prose-sm text-current max-w-none prose-p:leading-relaxed prose-headings:font-display prose-headings:font-black prose-headings:tracking-tight prose-headings:italic">
                    <ReactMarkdown>
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {isLoading && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="flex items-center gap-4 sm:gap-6 text-coffee-300"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-2xl bg-white border border-coffee-50 flex items-center justify-center animate-pulse shadow-sm">
                 <Loader2 size={20} className="animate-spin text-coffee-300" />
              </div>
              <span className="text-[10px] uppercase font-black tracking-[0.4em] italic leading-none">Overseer processing sensory dataset...</span>
            </motion.div>
          )}
        </div>
      </div>

      <div className="p-4 sm:p-6 md:p-8 bg-gradient-to-t from-white via-white to-transparent absolute bottom-0 left-0 right-0 z-30 pt-12 sm:pt-16 md:pt-20">
        <div className="max-w-5xl mx-auto relative">
          <form onSubmit={handleSend} className="relative group">
            <div className="absolute inset-x-0 bottom-0 top-0 bg-coffee-950/5 blur-3xl opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
            <input 
              type="text" 
              placeholder="Inquire about your sensory allocation protocol..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full pl-6 sm:pl-10 pr-20 sm:pr-24 py-4 sm:py-6 md:py-8 bg-white border border-coffee-100 rounded-[2.5rem] focus:ring-4 focus:ring-coffee-500/10 focus:border-coffee-500 outline-none shadow-premium-lg transition-all duration-500 text-[11px] font-black uppercase tracking-widest relative z-10 focus:bg-[#faf8f5]"
            />
            <button 
              type="submit"
              disabled={!input.trim() || isLoading}
              className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 bg-coffee-950 text-white rounded-full hover:bg-coffee-500 disabled:opacity-50 transition-all duration-500 flex items-center justify-center shadow-2xl shadow-coffee-950/30 z-20 active:scale-90"
            >
              <Send size={18} />
            </button>
          </form>
          <div className="mt-3 sm:mt-4 text-center">
            <span className="text-[9px] font-black text-black/70 uppercase tracking-[0.6em] italic">Ask for roast notes, brew style, or flavor pairings.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
