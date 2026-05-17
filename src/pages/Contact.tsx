import { MapPin, Mail, Phone, Send, ArrowRight, Instagram, Twitter, Linkedin, MessageSquare, Clock } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import ChatWidget from '../components/common/ChatWidget';

export default function Contact() {
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      toast.success("Signal received. Transmitting protocol to the roastery.");
      setLoading(false);
      (e.target as HTMLFormElement).reset();
    }, 1500);
  };

  return (
    <div className="pt-32 pb-40 px-6 max-w-7xl mx-auto min-h-screen bg-white relative">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-coffee-50 rounded-full blur-[150px] opacity-20 -z-0 translate-x-1/4 -translate-y-1/4" />
      
      <div className="text-center space-y-8 mb-32 relative z-10">
        <span className="text-[10px] font-black uppercase tracking-[0.8em] text-coffee-400">Open Channels</span>
        <h1 className="text-6xl md:text-8xl font-display font-black text-coffee-950 tracking-tightest leading-[0.85] italic">Connect With <br/><span className="not-italic text-coffee-500">The Soul.</span></h1>
        <p className="text-xl text-coffee-400 font-medium max-w-xl mx-auto leading-relaxed italic">"Have a query regarding your sensory protocol or interested in high-density wholesale? Our master units are online."</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24 relative z-10">
        {/* Info Section */}
        <div className="lg:col-span-5 space-y-16">
          <div className="grid grid-cols-1 gap-10">
            <div className="p-10 bg-[#faf8f5] border border-coffee-50 rounded-[3rem] space-y-6 shadow-premium group hover:bg-coffee-950 hover:text-white transition-all duration-700">
              <div className="w-14 h-14 bg-white text-coffee-950 rounded-2xl flex items-center justify-center shadow-premium group-hover:bg-white/10 group-hover:text-white transition-all">
                <Mail size={24} strokeWidth={1.5} />
              </div>
              <div className="space-y-4">
                <h3 className="text-[11px] font-black text-coffee-400 uppercase tracking-[0.3em] group-hover:text-coffee-300">Support Node</h3>
                <p className="text-sm font-medium italic leading-relaxed">"Questions concerning extraction orders or recurrent subscriptions?"</p>
                <a href="mailto:coffeecraze@nilelink.app" className="text-lg font-display font-black tracking-tighter block hover:text-coffee-500 transition-colors">coffeecraze@nilelink.app</a>
                <a href="tel:+96171972495" className="text-lg font-display font-black tracking-tighter block hover:text-coffee-500 transition-colors mt-2">+961 71 972 495</a>
              </div>
            </div>
            <div className="p-10 bg-[#faf8f5] border border-coffee-50 rounded-[3rem] space-y-6 shadow-premium group hover:bg-coffee-950 hover:text-white transition-all duration-700">
              <div className="w-14 h-14 bg-white text-coffee-950 rounded-2xl flex items-center justify-center shadow-premium group-hover:bg-white/10 group-hover:text-white transition-all">
                <MessageSquare size={24} strokeWidth={1.5} />
              </div>
              <div className="space-y-4">
                <h3 className="text-[11px] font-black text-coffee-400 uppercase tracking-[0.3em] group-hover:text-coffee-300">Institutional Hub</h3>
                <p className="text-sm font-medium italic leading-relaxed">"High-density supply for your infrastructure or neural media inquiries."</p>
                <a href="mailto:coffeecraze@nilelink.app" className="text-lg font-display font-black tracking-tighter block hover:text-coffee-500 transition-colors">coffeecraze@nilelink.app</a>
              </div>
            </div>
          </div>

          <div className="p-12 bg-coffee-950 rounded-[4rem] text-white space-y-12 relative overflow-hidden shadow-premium-lg group hover:scale-[1.02] transition-transform duration-700">
            <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:scale-125 transition-transform duration-[10s]">
              <Clock size={200} />
            </div>
            <div className="space-y-4 relative z-10">
              <h3 className="text-4xl font-display font-black italic tracking-tighter">Extraction <br/><span className="text-coffee-500 not-italic">Windows</span></h3>
              <p className="text-coffee-400 text-sm font-medium italic">Visit us for a sensory taste experience in the heart of Beirut.</p>
            </div>
            <div className="space-y-6 relative z-10">
              <div className="flex justify-between items-center border-b border-white/5 pb-6">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Neural Mon - Fri</span>
                <span className="text-sm font-black italic">08:00 — 20:00</span>
              </div>
              <div className="flex justify-between items-center border-b border-white/5 pb-6">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Neural Saturday</span>
                <span className="text-sm font-black italic">09:00 — 18:00</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Extraction Sunday</span>
                <span className="text-sm font-black italic text-coffee-500">Reserved for Maintenance</span>
              </div>
            </div>
          </div>
        </div>

        {/* Form Section */}
        <div className="lg:col-span-7 bg-white border border-coffee-50 rounded-[5rem] p-12 md:p-20 shadow-premium-lg relative">
          <div className="absolute top-0 left-0 w-24 h-24 bg-coffee-100/20 blur-3xl opacity-50 rounded-full"></div>
          <form onSubmit={handleSubmit} className="space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-4">
                    <label className="text-[10px] font-black text-coffee-400 uppercase tracking-[0.4em] pl-4">Signature</label>
                    <input 
                        required
                        type="text" 
                        placeholder="IDENT_NAME"
                        className="w-full px-8 py-6 bg-[#faf8f5] border border-coffee-50 rounded-[2rem] focus:bg-white focus:ring-4 focus:ring-coffee-500/5 focus:border-coffee-500 outline-none transition-all text-xs font-black uppercase tracking-widest placeholder:text-coffee-100"
                    />
                </div>
                <div className="space-y-4">
                    <label className="text-[10px] font-black text-coffee-400 uppercase tracking-[0.4em] pl-4">Protocol Email</label>
                    <input 
                        required
                        type="email" 
                        placeholder="TRANSIT_MAIL"
                        className="w-full px-8 py-6 bg-[#faf8f5] border border-coffee-50 rounded-[2rem] focus:bg-white focus:ring-4 focus:ring-coffee-500/5 focus:border-coffee-500 outline-none transition-all text-xs font-black uppercase tracking-widest placeholder:text-coffee-100"
                    />
                </div>
            </div>
            <div className="space-y-4">
              <label className="text-[10px] font-black text-coffee-400 uppercase tracking-[0.4em] pl-4">Input Manifest</label>
              <textarea 
                required
                rows={6}
                placeholder="Elaborate on your sensory requirement..."
                className="w-full px-8 py-8 bg-[#faf8f5] border border-coffee-50 rounded-[2.5rem] focus:bg-white focus:ring-4 focus:ring-coffee-500/5 focus:border-coffee-500 outline-none transition-all resize-none text-sm font-medium italic placeholder:text-coffee-100"
              ></textarea>
            </div>
            <button 
              disabled={loading}
              className="w-full py-7 bg-coffee-950 text-white rounded-full text-[10px] font-black uppercase tracking-[0.5em] flex items-center justify-center gap-6 hover:bg-coffee-500 transition-all shadow-premium-lg active:scale-95 disabled:bg-coffee-100 disabled:text-coffee-400 duration-500"
            >
              {loading ? "TRANSMITTING DATA..." : <>TRANSMIT SIGNAL <Send size={18} /></>}
            </button>
          </form>
          <div className="mt-12 flex justify-center gap-10 pt-10 border-t border-coffee-50 opacity-40 grayscale hover:grayscale-0 transition-all duration-700">
             <a href="#" className="hover:text-coffee-950 transition-colors uppercase text-[9px] font-black tracking-widest">Instagram</a>
             <a href="#" className="hover:text-coffee-950 transition-colors uppercase text-[9px] font-black tracking-widest">Twitter</a>
             <a href="#" className="hover:text-coffee-950 transition-colors uppercase text-[9px] font-black tracking-widest">LinkedIn</a>
          </div>
        </div>
      </div>
      <ChatWidget />
    </div>
  );
}
