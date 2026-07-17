import { MapPin, Mail, Phone, Send, ArrowRight, Instagram, Twitter, Linkedin, MessageSquare, Clock } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import SEO from '../components/common/SEO';
import ChatWidget from '../components/common/ChatWidget';
import { db } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

export default function Contact() {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target as HTMLFormElement);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const message = formData.get('message') as string;
    try {
      await addDoc(collection(db, 'contact_messages'), {
        name,
        email,
        message,
        status: 'unread',
        createdAt: new Date().toISOString(),
      });
      toast.success("Message sent. We'll respond shortly.");
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      console.error(error);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-16 sm:pt-24 md:pt-32 pb-20 sm:pb-30 md:pb-40 px-4 sm:px-6 lg:px-8 max-w-[90rem] mx-auto min-h-screen bg-espresso text-white relative overflow-hidden">
      <SEO title="Contact" description="Get in touch with CoffeeCraze for support, wholesale inquiries, and more." />
      <div className="absolute top-0 right-0 w-[260px] h-[260px] md:w-[360px] md:h-[360px] lg:w-[520px] lg:h-[520px] bg-cream rounded-full blur-[140px] opacity-20 -z-0 translate-x-1/4 -translate-y-1/4" />
      
      <div className="text-center space-y-6 sm:space-y-8 mb-14 md:mb-20 lg:mb-28 relative z-10">
        <span className="text-small font-black uppercase tracking-[0.8em] text-white/90">Open Channels</span>
        <h1 className="text-display font-display font-black text-white tracking-tightest leading-[0.85] italic">Connect With <br/><span className="not-italic text-caramel">The Soul.</span></h1>
        <p className="text-body text-white/90 font-medium max-w-xl mx-auto leading-relaxed italic">Have a question about your order, subscription, or wholesale needs? Our team is here to help.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 lg:gap-20 relative z-10">
        {/* Info Section */}
        <div className="lg:col-span-5 space-y-10 sm:space-y-14 w-full min-w-0">
          <div className="grid grid-cols-1 gap-8 sm:gap-10">
            <div className="card-responsive bg-cream border border-border-light space-y-6 shadow-premium group hover:bg-coffee-950 hover:text-white transition-all duration-700 text-text">
              <div className="w-10 sm:w-12 md:w-14 h-10 sm:h-12 md:h-14 bg-white text-text rounded-2xl flex items-center justify-center shadow-premium group-hover:bg-white/10 group-hover:text-white transition-all">
                <Mail size={20} strokeWidth={1.5} />
              </div>
              <div className="space-y-4">
                <h3 className="text-small font-black text-text group-hover:text-white transition-colors duration-700 uppercase tracking-[0.3em]">Customer Support</h3>
                <p className="text-small font-medium italic leading-relaxed text-text group-hover:text-coffee-200 transition-colors duration-700">Questions about your order, shipment, or subscription? We're ready to assist.</p>
                <a href="mailto:coffeecraze@nilelink.app" className="text-h3 font-display font-black tracking-tighter block text-text group-hover:text-white hover:text-caramel transition-colors duration-700">coffeecraze@nilelink.app</a>
                <a href="tel:+96171972495" className="text-h3 font-display font-black tracking-tighter block text-text group-hover:text-white hover:text-caramel transition-colors duration-700 mt-2">+961 71 972 495</a>
              </div>
            </div>
            <div className="card-responsive bg-cream border border-border-light space-y-6 shadow-premium group hover:bg-coffee-950 hover:text-white transition-all duration-700 text-text">
              <div className="w-10 sm:w-12 md:w-14 h-10 sm:h-12 md:h-14 bg-white text-text rounded-2xl flex items-center justify-center shadow-premium group-hover:bg-white/10 group-hover:text-white transition-all">
                <MessageSquare size={20} strokeWidth={1.5} />
              </div>
              <div className="space-y-4">
                <h3 className="text-small font-black text-text group-hover:text-white transition-colors duration-700 uppercase tracking-[0.3em]">Wholesale Inquiries</h3>
                <p className="text-small font-medium italic leading-relaxed text-text group-hover:text-coffee-200 transition-colors duration-700">Request support for wholesale pricing, supply, or business partnerships.</p>
                <a href="mailto:coffeecraze@nilelink.app" className="text-h3 font-display font-black tracking-tighter block text-text group-hover:text-white hover:text-caramel transition-colors duration-700">coffeecraze@nilelink.app</a>
              </div>
            </div>
          </div>

          <div className="p-8 sm:p-10 md:p-12 bg-coffee-950 rounded-[3rem] sm:rounded-[3.5rem] lg:rounded-[4rem] text-white space-y-8 sm:space-y-10 md:space-y-12 relative overflow-hidden shadow-premium-lg group hover:scale-[1.02] transition-transform duration-700">
            <div className="absolute top-0 right-0 p-8 sm:p-10 md:p-12 opacity-[0.03] group-hover:scale-125 transition-transform duration-[10s]">
              <Clock size={120} />
            </div>
            <div className="space-y-4 relative z-10">
              <h3 className="text-h2 font-display font-black italic tracking-tighter">Extraction <br/><span className="text-caramel not-italic">Windows</span></h3>
                <p className="text-small text-white/80 font-medium italic">Visit us for a coffee tasting and roastery experience in Beirut.</p>
            </div>
            <div className="space-y-4 sm:space-y-5 md:space-y-6 relative z-10">
              <div className="flex justify-between items-center border-b border-white/5 pb-5 sm:pb-6">
                <span className="text-small font-black uppercase tracking-[0.3em] text-cream/70">Mon - Fri</span>
                <span className="text-body font-black italic text-cream">08:00 — 20:00</span>
              </div>
              <div className="flex justify-between items-center border-b border-white/5 pb-5 sm:pb-6">
                <span className="text-small font-black uppercase tracking-[0.3em] text-cream/70">Saturday</span>
                <span className="text-body font-black italic text-cream">09:00 — 18:00</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-small font-black uppercase tracking-[0.3em] text-cream/70">Sunday</span>
                <span className="text-body font-black italic text-cream/60">Closed</span>
              </div>
            </div>
          </div>
        </div>

        {/* Form Section */}
        <div className="lg:col-span-7 bg-cream border border-border-light rounded-[3rem] sm:rounded-[4rem] lg:rounded-[5rem] p-6 sm:p-8 md:p-12 lg:p-16 xl:p-20 shadow-premium-lg relative text-text w-full min-w-0">
          <div className="absolute top-0 left-0 w-16 sm:w-20 md:w-24 h-16 sm:h-20 md:h-24 bg-cream/20 blur-3xl opacity-50 rounded-full"></div>
          <form onSubmit={handleSubmit} className="space-y-8 sm:space-y-10 md:space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 md:gap-10">
                <div className="space-y-4">
                    <label className="text-small font-black text-text uppercase tracking-[0.4em] pl-4">Signature</label>
                    <input 
                        required
                        type="text" 
                        name="name"
                        placeholder="Your Name"
                        className="w-full px-6 sm:px-8 py-4 sm:py-5 md:py-6 bg-white border border-border-light rounded-[2rem] focus:bg-white focus:ring-4 focus:ring-coffee-500/5 focus:border-coffee-500 outline-none transition-all text-small font-black uppercase tracking-widest placeholder:text-text-muted text-text"
                    />
                </div>
                <div className="space-y-4">
                      <label className="text-small font-black text-text uppercase tracking-[0.4em] pl-4">Email Address</label>
                    <input 
                        required
                        type="email" 
                        name="email"
                        placeholder="your@email.com"
                        className="w-full px-6 sm:px-8 py-4 sm:py-5 md:py-6 bg-white border border-border-light rounded-[2rem] focus:bg-white focus:ring-4 focus:ring-coffee-500/5 focus:border-coffee-500 outline-none transition-all text-small font-black uppercase tracking-widest placeholder:text-text-muted text-text"
                    />
                </div>
            </div>
            <div className="space-y-4">
                    <label className="text-small font-black text-text uppercase tracking-[0.4em] pl-4">Message</label>
              <textarea 
                required
                rows={6}
                name="message"
                placeholder="How can we help you?"
                className="w-full px-6 sm:px-8 py-6 sm:py-7 md:py-8 bg-white border border-border-light rounded-[2.5rem] focus:bg-white focus:ring-4 focus:ring-coffee-500/5 focus:border-coffee-500 outline-none transition-all resize-none text-body font-medium italic placeholder:text-text-secondary text-text"
              ></textarea>
            </div>
            <button 
              disabled={loading}
              className="w-full py-4 sm:py-5 md:py-6 lg:py-7 bg-coffee-950 text-white rounded-full text-small font-black uppercase tracking-[0.5em] flex items-center justify-center gap-6 hover:bg-coffee-500 transition-all shadow-premium-lg active:scale-95 disabled:bg-coffee-800 disabled:text-white/50 disabled:cursor-not-allowed duration-500"
            >
              {loading ? "Sending..." : <>Send Message <Send size={18} /></>}
            </button>
          </form>
          <div className="mt-10 sm:mt-12 flex flex-wrap justify-center gap-4 pt-8 sm:pt-10 border-t border-border-light opacity-70 hover:opacity-100 transition-all duration-700">
<a href="https://www.instagram.com/coffeecraze_lb" target="_blank" rel="noopener noreferrer" className="text-text-secondary hover:text-text transition-colors uppercase text-[11px] font-black tracking-widest">Instagram</a>
              <a href="https://x.com/CoffeeCrazeLB" target="_blank" rel="noopener noreferrer" className="text-text-secondary hover:text-text transition-colors uppercase text-[11px] font-black tracking-widest">X (Twitter)</a>
              <a href="https://www.facebook.com/CoffeeCrazeCC/" target="_blank" rel="noopener noreferrer" className="text-text-secondary hover:text-text transition-colors uppercase text-[11px] font-black tracking-widest">Facebook</a>
          </div>
        </div>
      </div>
      <ChatWidget />
    </div>
  );
}
