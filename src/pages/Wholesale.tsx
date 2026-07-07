import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Building2, Briefcase, TrendingUp, Handshake, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { cn } from '../lib/utils';
import { toast } from 'sonner';
import SEO from '../components/common/SEO';

export default function Wholesale() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
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
        businessName: formData.businessName,
        businessType: formData.businessType,
        estimatedVolume: formData.estimatedVolume,
        location: formData.location,
        contactPerson: formData.contactPerson,
        website: formData.website,
        userId: user.uid,
        userEmail: user.email ?? null,
        status: 'pending',
        createdAt: serverTimestamp(),
      });

      setSubmitted(true);
      toast.success('Inquiry submitted. Our team will contact you within 48 hours.');
    } catch (err) {
      console.error(err);
      toast.error("Request failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="pt-20 sm:pt-30 md:pt-40 pb-20 sm:pb-30 md:pb-40 px-6 text-center max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[60vh] space-y-12">
        <div className="w-20 sm:w-24 md:w-32 h-20 sm:h-24 md:h-32 bg-green-100 text-green-600 rounded-[3rem] flex items-center justify-center shadow-premium-lg scale-110 animate-bounce">
          <CheckCircle2 size={40} strokeWidth={1} />
        </div>
        <div className="space-y-6">
          <h1 className="text-h1 font-display font-black text-espresso tracking-tighter">Inquiry Received</h1>
          <p className="text-body text-text-secondary font-medium leading-relaxed max-w-lg">Thank you for requesting a wholesale partnership. Our team will review your submission and respond within 48 hours.</p>
        </div>
        <button onClick={() => navigate(user ? '/dashboard' : '/')} className="text-small font-black uppercase tracking-[0.4em] text-text-secondary hover:text-espresso transition-colors">Return to Dashboard</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-espresso">
      <SEO title="Wholesale" description="Partner with CoffeeCraze for high-volume premium coffee supply for your business." />
      {/* Hero */}
      <section className="pt-24 sm:pt-32 md:pt-40 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 sm:gap-12 md:gap-16 lg:gap-20 items-center mb-20 md:mb-30 lg:mb-40">
          <div className="lg:col-span-6 space-y-12">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-white/10 text-caramel rounded-full text-small font-black uppercase tracking-[0.4em] border border-white/10 transition-all">
                  WHOLESALE PARTNERS
              </div>
              <h1 className="text-display font-display font-black text-cream tracking-tightest leading-[0.8]">Scale Your <br/><span className="text-caramel">Coffee.</span></h1>
            </div>
            <p className="text-h3 text-cream leading-relaxed max-w-xl">
              We support premium cafes and businesses with reliable wholesale supply, streamlined service, and fast local delivery.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 md:gap-10 pt-8">
              {[
                { icon: <TrendingUp size={20} />, text: 'Volume Pricing' },
                { icon: <Handshake size={20} />, text: 'Dedicated Support' },
                { icon: <Building2 size={20} />, text: 'Roastery Quality' },
                { icon: <Briefcase size={20} />, text: 'Reliable Delivery' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4 group">
                  <div className="w-10 sm:w-12 h-10 sm:h-12 bg-white/10 rounded-2xl flex items-center justify-center text-caramel shadow-premium group-hover:bg-caramel group-hover:text-espresso transition-all duration-500">
                    {item.icon}
                  </div>
                  <span className="text-small font-black uppercase tracking-[0.2em] text-cream">{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="lg:col-span-6 bg-cream p-6 sm:p-8 md:p-12 lg:p-16 xl:p-20 rounded-[3rem] sm:rounded-[4rem] lg:rounded-[5rem] border border-white/10 shadow-premium-lg relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-20 sm:w-24 md:w-32 h-20 sm:h-24 md:h-32 bg-caramel/20 blur-3xl opacity-40"></div>
            <h2 className="text-h2 font-display font-black text-espresso mb-8 sm:mb-10 md:mb-12 tracking-tighter">Inquiry <span className="text-caramel">Manifest.</span></h2>
            <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                <div className="space-y-4">
                  <label className="text-small font-black text-text-muted uppercase tracking-[0.3em] pl-4">Entity Name</label>
                  <input 
                    required
                    type="text" 
                    value={formData.businessName}
                    onChange={e => setFormData({...formData, businessName: e.target.value})}
                    className="w-full px-6 sm:px-8 py-3 sm:py-4 md:py-5 bg-white border border-espresso/10 rounded-[2rem] focus:ring-4 focus:ring-caramel/10 focus:border-caramel outline-none transition-all text-small font-black uppercase tracking-widest placeholder:text-text-muted"
                    placeholder="Business Name"
                  />
                </div>
                <div className="space-y-4">
                  <label className="text-small font-black text-text-muted uppercase tracking-[0.3em] pl-4">Sector Type</label>
                  <select
                    title="Sector Type"
                    value={formData.businessType}
                    onChange={e => setFormData({...formData, businessType: e.target.value})}
                    className="w-full px-6 sm:px-8 py-3 sm:py-4 md:py-5 bg-white border border-espresso/10 rounded-[2rem] focus:ring-4 focus:ring-caramel/10 focus:border-caramel outline-none transition-all text-small font-black uppercase tracking-widest cursor-pointer"
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
                <label className="text-small font-black text-text-muted uppercase tracking-[0.3em] pl-4">Location</label>
                <input 
                  required
                  type="text" 
                  value={formData.location}
                  onChange={e => setFormData({...formData, location: e.target.value})}
                  className="w-full px-6 sm:px-8 py-3 sm:py-4 md:py-5 bg-white border border-espresso/10 rounded-[2rem] focus:ring-4 focus:ring-caramel/10 focus:border-caramel outline-none transition-all text-small font-black uppercase tracking-widest placeholder:text-text-muted"
                  placeholder="City, Region"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                 <div className="space-y-4">
                  <label className="text-small font-black text-text-muted uppercase tracking-[0.3em] pl-4">Extraction Volume</label>
                  <select
                    title="Extraction Volume"
                    value={formData.estimatedVolume}
                    onChange={e => setFormData({...formData, estimatedVolume: e.target.value})}
                    className="w-full px-6 sm:px-8 py-3 sm:py-4 md:py-5 bg-white border border-espresso/10 rounded-[2rem] focus:ring-4 focus:ring-caramel/10 focus:border-caramel outline-none transition-all text-small font-black uppercase tracking-widest cursor-pointer"
                  >
                    <option>5-10kg / month</option>
                    <option>10-25kg / month</option>
                    <option>25-100kg / month</option>
                    <option>100kg+ / month</option>
                  </select>
                </div>
                <div className="space-y-4">
                  <label className="text-small font-black text-text-muted uppercase tracking-[0.3em] pl-4">Website</label>
                  <input 
                    type="text" 
                    value={formData.website}
                    onChange={e => setFormData({...formData, website: e.target.value})}
                    className="w-full px-6 sm:px-8 py-3 sm:py-4 md:py-5 bg-white border border-espresso/10 rounded-[2rem] focus:ring-4 focus:ring-caramel/10 focus:border-caramel outline-none transition-all text-small font-black uppercase tracking-widest placeholder:text-text-muted"
                    placeholder="Website URL"
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full py-4 sm:py-5 md:py-6 bg-espresso text-cream rounded-full text-small font-black uppercase tracking-[0.6em] flex items-center justify-center gap-6 hover:bg-caramel hover:text-espresso transition-all shadow-premium active:scale-95 disabled:opacity-50 duration-500"
              >
                {loading ? 'Submitting...' : 'Submit Inquiry'}
                <ArrowRight size={18} />
              </button>
              <div className="flex items-center justify-center gap-4 text-text-muted">
                  <span className="w-12 h-px bg-current"></span>
                  <p className="text-[8px] font-black uppercase tracking-[0.8em]">Response within 48 hours</p>
                  <span className="w-12 h-px bg-current"></span>
              </div>
            </form>
          </motion.div>
        </div>
      </section>

      {/* Featured Partners */}
      <section className="px-6 overflow-hidden relative" style={{ backgroundColor: '#4A2E1F' }}>
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-12 sm:gap-16 md:gap-20 lg:gap-24 relative z-10">
           <div className="max-w-lg space-y-8 sm:space-y-10 text-center lg:text-left">
             <span className="text-small font-black text-caramel uppercase tracking-[1em]">Trusted Partners</span>
             <h2 className="text-h1 font-display font-black text-cream leading-none tracking-tighter">Trusted by <br/><span className="text-caramel">Finest Coffee Teams.</span></h2>
             <p className="text-body text-cream leading-relaxed">Join over 150 coffee partners who rely on our wholesale service for quality, consistency, and fast delivery.</p>
           </div>
            <div className="flex flex-wrap justify-center lg:justify-end gap-8 sm:gap-10 lg:gap-12 opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-1000">
              {['Cafe Beirut', 'The Roastery', 'Brew Lab', 'Origin House', 'Summit Coffee'].map(name => (
                 <div key={name} className="px-8 sm:px-10 py-5 sm:py-6 border border-white/10 rounded-[2rem] text-cream font-display font-black text-h2 tracking-tighter hover:border-caramel transition-all cursor-default">{name.toUpperCase().slice(0, 12)}</div>
              ))}
            </div>
        </div>
      </section>
    </div>
  );
}
