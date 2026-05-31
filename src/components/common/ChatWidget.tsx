import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, User, Bot, Loader2 } from 'lucide-react';
import { GeminiService } from '../../services/gemini';
import { cn } from '../../lib/utils';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'model', content: string }[]>([
    { role: 'model', content: "Mornings from Beirut. I'm your digital concierge. How can I assist your ritual today?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    try {
      const history = [...messages, { role: 'user', content: userMessage }].map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }));
      const response = await GeminiService.getBaristaResponse(userMessage, history);
      setMessages(prev => [...prev, { role: 'model', content: response }]);
      toast.success('Message delivered successfully.');
    } catch (err) {
      toast.error('Message failed to send. Please try again.');
      setMessages(prev => [...prev, { role: 'model', content: "Apologies, the brew was interrupted. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Trigger Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 w-12 h-12 sm:w-16 sm:h-16 bg-coffee-950 text-white rounded-2xl shadow-2xl flex items-center justify-center z-50 hover:bg-coffee-500 transition-colors"
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 50, x: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 50, x: 20 }}
            className="fixed bottom-24 right-4 sm:bottom-28 sm:right-8 w-[95vw] sm:w-[90vw] md:w-96 h-[400px] sm:h-[500px] max-h-[80vh] sm:max-h-[70vh] bg-cream border border-coffee-200 rounded-[1.5rem] sm:rounded-[2rem] lg:rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.12)] z-50 flex flex-col overflow-hidden text-[#0e372b]"
          >
            {/* Header */}
            <div className="p-4 sm:p-6 bg-coffee-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-coffee-500 rounded-xl flex items-center justify-center">
                  <Bot size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Ritual Concierge</h3>
                  <p className="text-[10px] text-coffee-300 uppercase tracking-widest font-bold">Online & Ready</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div 
              ref={scrollRef}
              className="flex-grow overflow-y-auto p-4 sm:p-6 space-y-4 no-scrollbar"
            >
              {messages.map((msg, i) => (
                <div 
                  key={i}
                  className={cn(
                    "flex flex-col max-w-[85%]",
                    msg.role === 'user' ? "items-end ml-auto" : "items-start"
                  )}
                >
                  <div className={cn(
                    "p-3 sm:p-4 rounded-2xl text-xs leading-relaxed",
                    msg.role === 'user' ? "bg-coffee-50 text-[#0e372b] rounded-tr-none border border-coffee-200" : "bg-white text-[#0e372b] rounded-tl-none border border-coffee-200"
                  )}>
                    <div className="markdown-body text-[#0e372b] whitespace-pre-wrap">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex items-center gap-2 text-coffee-400">
                  <Loader2 size={12} className="animate-spin" />
                  <span className="text-[10px] italic font-bold">Brewing response...</span>
                </div>
              )}
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-3 sm:p-4 border-t border-coffee-800 bg-coffee-950">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Ask a question..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="w-full pl-4 pr-12 py-3 bg-coffee-900 border-none rounded-xl text-xs text-white placeholder:text-coffee-500 focus:ring-2 focus:ring-coffee-500 outline-none"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  aria-label="Send message"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-caramel text-coffee-950 rounded-lg disabled:opacity-50"
                >
                  <Send size={14} />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
