import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, User, Sparkles, Loader2 } from 'lucide-react';
import { GeminiService, AiContext } from '../services/gemini';
import { cn } from '../lib/utils';
import ReactMarkdown from 'react-markdown';
import SEO from '../components/common/SEO';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, getDocs, orderBy, limit as fLimit, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

type Message = { role: 'user' | 'model'; content: string };

const SUGGESTIONS = [
  'Recommend a light roast for mornings',
  'Best espresso beans for lattes?',
  'How to brew pour-over coffee?',
  'What\'s a good gift for a coffee lover?',
];

export default function AiBarista() {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      content:
        "Welcome to the **CoffeeCraze Concierge** ☕\n\nTell me your preferred roast, brew method, or flavor mood and I'll find the perfect coffee ritual for you.",
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [aiContext, setAiContext] = useState<AiContext | undefined>(undefined);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    const loadContext = async () => {
      const ctx: AiContext = {
        userName: profile?.displayName || undefined,
        userEmail: profile?.email || undefined,
        currentPage: 'AI Barista',
      };
      try {
        const productsSnap = await getDocs(query(collection(db, 'products'), where('isActive', '==', true), fLimit(30)));
        ctx.products = productsSnap.docs.map(d => ({ id: d.id, ...d.data() as any }));
        const plansSnap = await getDocs(query(collection(db, 'plans'), fLimit(10)));
        ctx.plans = plansSnap.docs.map(d => ({ id: d.id, ...d.data() as any }));
        const cartSnap = await getDoc(doc(db, 'carts', user.uid));
        if (cartSnap.exists()) {
          const cartData = cartSnap.data();
          ctx.cartItems = (cartData.items || []).map((i: any) => ({ id: i.id || i.productId, name: i.name, quantity: i.quantity, price: i.price }));
        }
        const ordersSnap = await getDocs(query(collection(db, 'orders'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'), fLimit(5)));
        ctx.recentOrders = ordersSnap.docs.map(d => {
          const o = d.data() as any;
          return { id: d.id, status: o.status, total: o.total, createdAt: o.createdAt };
        });
      } catch (e) {
        console.warn('Failed to load AI context:', e);
      }
      setAiContext(ctx);
    };
    loadContext();
  }, [user]);

  // Auto-scroll to bottom whenever messages or loading state changes
  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  const handleSend = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || isLoading) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: msg }]);
    setIsLoading(true);

    try {
      const history = messages.map((m) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      }));
      const response = await GeminiService.getBaristaResponse(msg, history, aiContext);
      setMessages((prev) => [...prev, { role: 'model', content: response }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'model', content: 'Sorry, something went wrong. Please try again.' },
      ]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    /*
     * Layout: fixed viewport height with flex-col so the chat area fills the
     * remaining space and scrolls independently. The input bar is always visible
     * at the bottom.
     */
    <div
      className="flex flex-col bg-cream"
      style={{ height: '100dvh', paddingTop: 'env(safe-area-inset-top)' }}
    >
      <SEO
        title="Coffee Concierge"
        description="Chat with our AI Coffee Concierge for personalised coffee recommendations."
      />

      {/* --------------- */}
      <header className="flex-shrink-0 bg-white border-b border-border shadow-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 flex items-center gap-4 h-16 sm:h-20">
          {/* Icon */}
          <div className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 rounded-2xl bg-mocha flex items-center justify-center shadow-md">
            <Sparkles size={18} className="text-caramel" />
          </div>

          {/* Title */}
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-xl font-black text-walnut tracking-tight leading-none uppercase truncate">
              Coffee Concierge
            </h1>
            <p className="text-[10px] sm:text-xs font-semibold text-caramel uppercase tracking-widest leading-none mt-1">
              AI  -  Powered by Gemini
            </p>
          </div>

          {/* Status pill */}
          <div className="hidden sm:flex items-center gap-2 px-4 py-1.5 bg-cream rounded-full border border-border">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black text-walnut uppercase tracking-widest">
              Online
            </span>
          </div>
        </div>
      </header>

      {/* --------------- */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto overflow-x-hidden"
        style={{ scrollBehavior: 'smooth' }}
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">

          {/* Suggestion chips --- only shown when just the welcome message exists */}
          {messages.length === 1 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap gap-2 pt-2"
            >
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSend(s)}
                  className="px-4 py-2 bg-white border border-border rounded-full text-xs font-semibold text-mocha hover:bg-mocha hover:text-white hover:border-mocha transition-all duration-300 shadow-sm"
                >
                  {s}
                </button>
              ))}
            </motion.div>
          )}

          {/* Message bubbles */}
          <AnimatePresence mode="popLayout" initial={false}>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                layout
                initial={{ opacity: 0, y: 16, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.93 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className={cn(
                  'flex items-end gap-3',
                  msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                )}
              >
                {/* Avatar */}
                <div
                  className={cn(
                    'flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-2xl flex items-center justify-center shadow-sm',
                    msg.role === 'user'
                      ? 'bg-mocha text-white'
                      : 'bg-white border border-border text-mocha'
                  )}
                >
                  {msg.role === 'user' ? (
                    <User size={14} />
                  ) : (
                    <Sparkles size={14} />
                  )}
                </div>

                {/* Bubble */}
                <div
                  className={cn(
                    'max-w-[80%] sm:max-w-[72%] px-4 py-3 sm:px-5 sm:py-4 rounded-2xl text-sm sm:text-[15px] leading-relaxed shadow-sm',
                    msg.role === 'user'
                      ? 'bg-mocha text-white rounded-br-md'
                      : 'bg-white border border-border text-walnut rounded-bl-md'
                  )}
                >
                  <div className="prose prose-sm max-w-none [&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:my-2 [&_ol]:my-2 [&_strong]:font-bold [&_a]:text-caramel prose-headings:font-bold prose-headings:text-current">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing indicator */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-end gap-3"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 flex-shrink-0 rounded-2xl bg-white border border-border flex items-center justify-center shadow-sm">
                <Loader2 size={14} className="text-caramel animate-spin" />
              </div>
              <div className="px-4 py-3 bg-white border border-border rounded-2xl rounded-bl-md shadow-sm">
                <div className="flex items-center gap-1.5">
                  {[0, 1, 2].map((dot) => (
                    <span
                      key={dot}
                      className="w-2 h-2 bg-caramel rounded-full animate-bounce"
                      style={{ animationDelay: `${dot * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Bottom spacer so last message is never hidden by the input bar */}
          <div className="h-2" aria-hidden="true" />
        </div>
      </div>

      {/* --------------- */}
      <div className="flex-shrink-0 bg-white border-t border-border shadow-lg">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <form
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="flex items-center gap-2 sm:gap-3"
          >
            <input
              ref={inputRef}
              type="text"
              placeholder="Ask about roast, brew style, or flavor…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              className="flex-1 min-w-0 px-4 sm:px-5 py-3 sm:py-3.5 bg-cream border border-border rounded-full text-sm text-walnut placeholder:text-walnut/60 outline-none focus:border-caramel focus:ring-2 focus:ring-caramel/10 transition-all duration-300 disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              aria-label="Send message"
              className="flex-shrink-0 w-11 h-11 sm:w-12 sm:h-12 bg-mocha text-cream rounded-full flex items-center justify-center hover:bg-mocha/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-md active:scale-90"
            >
              <Send size={16} />
            </button>
          </form>
          <p className="text-center text-[10px] text-walnut/40 font-medium uppercase tracking-widest mt-2">
            Powered by Gemini  -  Ask anything about coffee
          </p>
        </div>
      </div>
    </div>
  );
}
