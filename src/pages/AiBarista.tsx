import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Bot, User, Sparkles, Loader2 } from 'lucide-react';
import { GeminiService } from '../services/gemini';
import { cn } from '../lib/utils';
import ReactMarkdown from 'react-markdown';

export default function AiBarista() {
  const [messages, setMessages] = useState<{role: 'user' | 'model', content: string}[]>([
    { role: 'model', content: "Sensory protocol initiated. I am the AI Overseer. Mornings in Beirut are better with a precise extraction. Tell me, what kind of ritual are you seeking today?" }
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
    <div className="pt-20 h-[100dvh] flex flex-col bg-white overflow-hidden relative">
      <div className="absolute inset-0 bg-coffee-50 opacity-10 pointer-events-none"></div>
      
      <div className="px-10 py-10 border-b border-coffee-50 bg-white/90 backdrop-blur-xl sticky top-0 z-20">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-coffee-950 rounded-[1.5rem] flex items-center justify-center text-white shadow-premium relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-tr from-coffee-500/30 to-transparent group-hover:scale-110 transition-transform duration-700"></div>
              <Sparkles size={28} className="relative z-10" />
            </div>
            <div className="space-y-1">
              <h1 className="text-4xl font-display font-black text-coffee-950 tracking-tighter italic">Overseer <span className="not-italic text-coffee-500">v1.0</span></h1>
              <p className="text-[10px] font-black text-coffee-400 uppercase tracking-[0.4em] leading-none">Neural Extraction Concierge • Beirut Unit</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-4 px-5 py-2.5 bg-[#faf8f5] rounded-full border border-coffee-50 shadow-sm">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
            <span className="text-[10px] font-black text-coffee-950 uppercase tracking-[0.3em] italic">System Nominal</span>
          </div>
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex-grow overflow-y-auto overflow-x-hidden pt-12 pb-48 px-6 no-scrollbar scroll-smooth"
      >
        <div className="max-w-5xl mx-auto space-y-12">
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
                  "flex items-start gap-6 max-w-[95%] md:max-w-[85%]",
                  msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                )}
              >
                <div 
                  className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-premium",
                    msg.role === 'user' ? "bg-coffee-950 text-white" : "bg-white border border-coffee-50 text-coffee-950"
                  )}
                >
                  {msg.role === 'user' ? <User size={24} /> : <div className="text-xl font-display font-black leading-none italic">dg</div>}
                </div>
                <div className={cn(
                  "p-8 rounded-[3rem] text-sm leading-relaxed shadow-premium relative",
                  msg.role === 'user' 
                    ? "bg-coffee-950 text-white rounded-tr-none" 
                    : "bg-white border border-coffee-50 text-coffee-900 rounded-tl-none"
                )}>
                  <div className="markdown-body prose prose-coffee prose-sm max-w-none prose-p:leading-relaxed prose-headings:font-display prose-headings:font-black prose-headings:text-coffee-950 prose-headings:tracking-tight prose-headings:italic">
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
              className="flex items-center gap-6 text-coffee-300"
            >
              <div className="w-14 h-14 rounded-2xl bg-white border border-coffee-50 flex items-center justify-center animate-pulse shadow-sm">
                 <Loader2 className="animate-spin w-5 h-5 text-coffee-300" />
              </div>
              <span className="text-[10px] uppercase font-black tracking-[0.4em] italic leading-none">Overseer processing sensory dataset...</span>
            </motion.div>
          )}
        </div>
      </div>

      <div className="p-8 bg-gradient-to-t from-white via-white to-transparent absolute bottom-0 left-0 right-0 z-30 pt-20">
        <div className="max-w-5xl mx-auto relative">
          <form onSubmit={handleSend} className="relative group">
            <div className="absolute inset-x-0 bottom-0 top-0 bg-coffee-950/5 blur-3xl opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
            <input 
              type="text" 
              placeholder="Inquire about your sensory allocation protocol..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full pl-10 pr-24 py-8 bg-white border border-coffee-100 rounded-[2.5rem] focus:ring-4 focus:ring-coffee-500/10 focus:border-coffee-500 outline-none shadow-premium-lg transition-all duration-500 text-[11px] font-black uppercase tracking-widest relative z-10 focus:bg-[#faf8f5]"
            />
            <button 
              type="submit"
              disabled={!input.trim() || isLoading}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-coffee-950 text-white rounded-full hover:bg-coffee-500 disabled:opacity-50 transition-all duration-500 flex items-center justify-center shadow-2xl shadow-coffee-950/30 z-20 active:scale-90"
            >
              <Send size={18} />
            </button>
          </form>
          <div className="mt-4 text-center">
            <span className="text-[9px] font-black text-coffee-300 uppercase tracking-[0.6em] italic">Secure Neutral Connection • Beirut v1.0</span>
          </div>
        </div>
      </div>
    </div>
  );
}
