import { useState } from 'react';
import { motion } from 'motion/react';
import { Building2, Briefcase, TrendingUp, Handshake, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

export default function Wholesale() {
  const { user, profile } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    businessName: '',
    businessType: 'Coffee Shop',
    estimatedVolume: '10-25kg / month',
    location: '',
    contactPerson: profile?.displayName || '',
    website: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
       toast.error("Authentication node required for high-density partnership.");
       return;
    }
    setLoading(true);
    try {
      await addDoc(collection(db, 'wholesale_accounts'), {
        ...formData,
        userId: user.uid,
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      toast.error("Transmission failed. Re-evaluate link.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="pt-40 pb-40 px-6 text-center max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[60vh] space-y-12 bg-white">
        <div className="w-32 h-32 bg-emerald-50 text-emerald-500 rounded-[3rem] flex items-center justify-center shadow-premium-lg scale-110 animate-bounce">
          <CheckCircle2 size={56} strokeWidth={1} />
        </div>
        <div className="space-y-6">
          <h1 className="text-6xl font-display font-black text-coffee-950 tracking-tighter italic">Signal Synchronized</h1>
          <p className="text-xl text-coffee-400 italic font-medium leading-relaxed max-w-lg">"Thank you for requesting institutional partnership. Our allocation team will synchronize with your business within 48 cycles."</p>
        </div>
        <button onClick={() => setSubmitted(false)} className="text-[10px] font-black uppercase tracking-[0.4em] text-coffee-300 hover:text-coffee-950 transition-colors">Return to Hub</button>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-40 px-6 bg-white min-h-screen">
      {/* Hero */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-20 items-center mb-40">
        <div className="lg:col-span-6 space-y-12">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-coffee-50 active:bg-coffee-100 text-coffee-500 rounded-full text-[10px] font-black uppercase tracking-[0.4em] border border-coffee-100 shadow-sm transition-all italic">
                INSTITUTIONAL PARTNERSHIP
            </div>
            <h1 className="text-7xl md:text-[9rem] font-display font-black text-coffee-950 tracking-tightest leading-[0.8] italic">Scale Your <br/><span className="not-italic text-coffee-500">Excellence.</span></h1>
          </div>
          <p className="text-2xl text-coffee-400 font-light italic leading-relaxed max-w-xl">
            "We provide high-density roasting protocols, sensory training, and dedicated node support for premium Lebanese establishments."
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 pt-8">
            {[
              { icon: <TrendingUp size={20} />, text: 'High-Density Pricing' },
              { icon: <Handshake size={20} />, text: 'Neural Node Sync' },
              { icon: <Building2 size={20} />, text: 'Asset Maintenance' },
              { icon: <Briefcase size={20} />, text: 'Staff Calibration' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4 text-coffee-950 group">
                <div className="w-12 h-12 bg-coffee-50 rounded-2xl flex items-center justify-center text-coffee-500 shadow-premium group-hover:bg-coffee-950 group-hover:text-white transition-all duration-500 italic">
                  {item.icon}
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] italic">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="lg:col-span-6 bg-white p-12 md:p-20 rounded-[5rem] border border-coffee-50 shadow-premium-lg relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-coffee-50 blur-3xl opacity-40"></div>
          <h2 className="text-4xl font-display font-black text-coffee-950 mb-12 italic tracking-tighter">Inquiry <span className="not-italic text-coffee-500">Manifest.</span></h2>
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-coffee-400 uppercase tracking-[0.3em] pl-4 italic">Entity Name</label>
                <input 
                  required
                  type="text" 
                  value={formData.businessName}
                  onChange={e => setFormData({...formData, businessName: e.target.value})}
                  className="w-full px-8 py-5 bg-[#faf8f5] border border-coffee-50 rounded-[2rem] focus:bg-white focus:ring-4 focus:ring-coffee-500/5 focus:border-coffee-500 outline-none transition-all text-xs font-black uppercase tracking-widest placeholder:text-coffee-100"
                  placeholder="IDENT_INSTITUTE"
                />
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black text-coffee-400 uppercase tracking-[0.3em] pl-4 italic">Sector Type</label>
                <select 
                  value={formData.businessType}
                  onChange={e => setFormData({...formData, businessType: e.target.value})}
                  className="w-full px-8 py-5 bg-[#faf8f5] border border-coffee-50 rounded-[2rem] focus:bg-white focus:ring-4 focus:ring-coffee-500/5 focus:border-coffee-500 outline-none transition-all text-xs font-black uppercase tracking-widest cursor-pointer"
                >
                  <option>Coffee Shop</option>
                  <option>Restaurant</option>
                  <option>Office</option>
                  <option>Hotel</option>
                  <option>Distributor</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-coffee-400 uppercase tracking-[0.3em] pl-4 italic">Location Node</label>
              <input 
                required
                type="text" 
                value={formData.location}
                onChange={e => setFormData({...formData, location: e.target.value})}
                className="w-full px-8 py-5 bg-[#faf8f5] border border-coffee-50 rounded-[2rem] focus:bg-white focus:ring-4 focus:ring-coffee-500/5 focus:border-coffee-500 outline-none transition-all text-xs font-black uppercase tracking-widest placeholder:text-coffee-100"
                placeholder="BEIRUT_COORDINATES"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-4">
                <label className="text-[10px] font-black text-coffee-400 uppercase tracking-[0.3em] pl-4 italic">Extraction Volume</label>
                <select 
                  value={formData.estimatedVolume}
                  onChange={e => setFormData({...formData, estimatedVolume: e.target.value})}
                  className="w-full px-8 py-5 bg-[#faf8f5] border border-coffee-50 rounded-[2rem] focus:bg-white focus:ring-4 focus:ring-coffee-500/5 focus:border-coffee-500 outline-none transition-all text-xs font-black uppercase tracking-widest cursor-pointer"
                >
                  <option>5-10kg / month</option>
                  <option>10-25kg / month</option>
                  <option>25-100kg / month</option>
                  <option>100kg+ / month</option>
                </select>
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black text-coffee-400 uppercase tracking-[0.3em] pl-4 italic">Neural Presence</label>
                <input 
                  type="text" 
                  value={formData.website}
                  onChange={e => setFormData({...formData, website: e.target.value})}
                  className="w-full px-8 py-5 bg-[#faf8f5] border border-coffee-50 rounded-[2rem] focus:bg-white focus:ring-4 focus:ring-coffee-500/5 focus:border-coffee-500 outline-none transition-all text-xs font-black uppercase tracking-widest placeholder:text-coffee-100"
                  placeholder="@BRAND_IDENT"
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-6 bg-coffee-950 text-white rounded-full text-[9px] font-black uppercase tracking-[0.6em] flex items-center justify-center gap-6 hover:bg-coffee-500 transition-all shadow-premium active:scale-95 disabled:bg-coffee-100 duration-500 italic"
            >
              {loading ? 'SYNCHRONIZING...' : 'INITIALIZE PARTNERSHIP'}
              <ArrowRight size={18} />
            </button>
            <div className="flex items-center justify-center gap-4 text-coffee-200">
                <span className="w-12 h-px bg-current"></span>
                <p className="text-[8px] font-black uppercase tracking-[0.8em]">Latency: 48 Cycles</p>
                <span className="w-12 h-px bg-current"></span>
            </div>
          </form>
        </motion.div>
      </div>

      {/* Featured Partners */}
      <section className="bg-coffee-950 -mx-6 py-40 px-6 overflow-hidden relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-full bg-white/5"></div>
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-24 relative z-10">
           <div className="max-w-lg space-y-10 text-center lg:text-left">
             <span className="text-[10px] font-black text-coffee-500 uppercase tracking-[1em] italic">Network Nodes</span>
             <h2 className="text-6xl font-display font-black text-white leading-none italic tracking-tighter">Trusted by <br/><span className="text-coffee-500 not-italic">Finest Units.</span></h2>
             <p className="text-xl text-coffee-400 font-light italic leading-relaxed">"Join a decentralized network of over 150+ partners who depend on the Ritual Protocol for daily excellence."</p>
           </div>
           <div className="flex flex-wrap justify-center lg:justify-end gap-12 opacity-30 grayscale contrast-150 hover:grayscale-0 hover:opacity-100 transition-all duration-1000">
             {[1,2,3,4,5].map(i => (
                <div key={i} className="px-10 py-6 border border-white/10 rounded-[2rem] text-white font-display font-black text-3xl italic tracking-tighter hover:border-coffee-500 transition-all cursor-default">INSTITUTE_{i}</div>
             ))}
           </div>
        </div>
      </section>
    </div>
  );
}
