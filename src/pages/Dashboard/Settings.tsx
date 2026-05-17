import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { User, Mail, Phone, MapPin, Camera, Save, Shield } from 'lucide-react';
import { toast } from 'sonner';
import DashboardLayout from '../../components/layout/DashboardLayout';

export default function AccountSettings() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    displayName: profile?.displayName || '',
    email: profile?.email || '',
    phone: profile?.phone || '',
    address: profile?.address || ''
  });

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    
    setLoading(true);
    try {
      const docRef = doc(db, 'users', profile.uid);
      await updateDoc(docRef, {
        displayName: formData.displayName,
        phone: formData.phone,
        address: formData.address,
      });
      toast.success("Profile updated successfully");
    } catch (err) {
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-12">
        <header className="space-y-4">
          <span className="stat-label text-caramel">System Parameters</span>
          <h1 className="text-7xl font-display font-black text-espresso leading-none tracking-tightest italic uppercase">Account <br/><span className="not-italic text-coffee-400">Archive.</span></h1>
          <p className="text-xl text-coffee-400 font-serif italic max-w-2xl leading-relaxed">Refine your sensory identity and logistics coordinates within the CC mainframe.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          {/* Profile Card */}
          <div className="lg:col-span-4 space-y-12">
            <div className="bg-white shadow-premium-xl border border-white rounded-[5rem] p-16 text-center space-y-12 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-48 h-48 bg-caramel/5 blur-[60px] rounded-full pointer-events-none" />
              
              <div className="relative inline-block mx-auto">
                <div className="w-48 h-48 rounded-[4rem] bg-cream flex items-center justify-center text-6xl font-display font-black text-espresso/10 border border-white group-hover:scale-105 transition-transform duration-1000 shadow-inner overflow-hidden">
                  {profile?.displayName?.[0] || 'U'}
                </div>
                <button className="absolute -bottom-6 -right-6 w-20 h-20 bg-espresso text-caramel rounded-[1.5rem] border-[10px] border-white shadow-premium flex items-center justify-center hover:scale-110 active:scale-95 transition-all group-hover:rotate-12 duration-700">
                  <Camera size={28} strokeWidth={1} />
                </button>
              </div>

              <div className="space-y-2">
                <h3 className="text-4xl font-display font-black text-espresso tracking-tightest italic">{profile?.displayName}</h3>
                <p className="text-[11px] text-caramel font-black uppercase tracking-[0.4em] italic mb-1">{profile?.role}_CLEARANCE</p>
              </div>

              <div className="pt-12 border-t border-espresso/5 grid grid-cols-2 gap-10">
                <div className="text-center group/stat">
                   <p className="text-[10px] font-black text-coffee-300 uppercase tracking-[0.4em] mb-2 group-hover/stat:text-espresso transition-colors italic">Neural Units</p>
                   <p className="text-4xl font-display font-black text-espresso italic tracking-tightest">{profile?.loyaltyPoints || 0}</p>
                </div>
                <div className="text-center group/stat">
                   <p className="text-[10px] font-black text-coffee-300 uppercase tracking-[0.4em] mb-2 group-hover/stat:text-espresso transition-colors italic">Audits</p>
                   <p className="text-4xl font-display font-black text-espresso italic tracking-tightest">0</p>
                </div>
              </div>
            </div>

            <div className="p-12 bg-espresso rounded-[4rem] text-white flex items-center gap-8 shadow-premium-2xl relative overflow-hidden group hover:scale-[1.02] transition-all duration-700 cursor-pointer border border-white/5">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(193,155,118,0.2),transparent)]" />
              <div className="w-20 h-20 bg-white/5 rounded-[1.5rem] flex items-center justify-center group-hover:scale-110 transition-transform duration-700 border border-white/5 group-hover:bg-caramel group-hover:text-espresso">
                <Shield size={32} strokeWidth={1} />
              </div>
              <div className="space-y-1 relative z-10">
                <p className="text-2xl font-display font-black tracking-tightest italic leading-none">Security <br/><span className="text-caramel not-italic text-lg tracking-normal">Rotate Key</span></p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleUpdate} className="lg:col-span-8 bg-white shadow-premium-xl border border-white rounded-[5rem] p-12 md:p-20 space-y-16 relative overflow-hidden">
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-cream blur-[120px] opacity-30 translate-y-1/2 translate-x-1/2 rounded-full pointer-events-none" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 relative z-10">
              <div className="space-y-4">
                <label className="text-[11px] font-black text-coffee-300 uppercase tracking-[0.4em] italic ml-6">Display Name</label>
                <div className="relative group">
                  <User className="absolute left-8 top-1/2 -translate-y-1/2 text-caramel group-focus-within:rotate-12 transition-transform" size={20} />
                  <input 
                    type="text" 
                    value={formData.displayName}
                    onChange={e => setFormData({...formData, displayName: e.target.value})}
                    className="w-full pl-20 pr-10 py-7 bg-cream shadow-inner border border-espresso/5 rounded-[2.5rem] focus:bg-white focus:border-caramel focus:ring-8 focus:ring-caramel/5 outline-none transition-all font-display font-black text-espresso text-xl italic tracking-tight italic"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-[11px] font-black text-coffee-300 uppercase tracking-[0.4em] italic ml-6">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-8 top-1/2 -translate-y-1/2 text-coffee-200" size={20} />
                  <input 
                    disabled
                    type="email" 
                    value={formData.email}
                    className="w-full pl-20 pr-10 py-7 bg-cream/50 border border-espresso/5 rounded-[2.5rem] text-espresso/30 cursor-not-allowed font-medium italic tracking-widest text-sm"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-[11px] font-black text-coffee-300 uppercase tracking-[0.4em] italic ml-6">Phone Number</label>
                <div className="relative group">
                  <Phone className="absolute left-8 top-1/2 -translate-y-1/2 text-caramel group-focus-within:rotate-12 transition-transform" size={20} />
                  <input 
                    type="tel" 
                    placeholder="+961 81 234 567"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    className="w-full pl-20 pr-10 py-7 bg-cream shadow-inner border border-espresso/5 rounded-[2.5rem] focus:bg-white focus:border-caramel focus:ring-8 focus:ring-caramel/5 outline-none transition-all font-display font-black text-espresso text-xl italic tracking-tight italic"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-[11px] font-black text-coffee-300 uppercase tracking-[0.4em] italic ml-6">Shipping Address</label>
                <div className="relative group">
                  <MapPin className="absolute left-8 top-1/2 -translate-y-1/2 text-caramel group-focus-within:scale-110 transition-transform" size={20} />
                  <input 
                    type="text" 
                    placeholder="Beirut, District 5"
                    value={formData.address}
                    onChange={e => setFormData({...formData, address: e.target.value})}
                    className="w-full pl-20 pr-10 py-7 bg-cream shadow-inner border border-espresso/5 rounded-[2.5rem] focus:bg-white focus:border-caramel focus:ring-8 focus:ring-caramel/5 outline-none transition-all font-display font-black text-espresso text-xl italic tracking-tight italic"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-8 relative z-10">
              <button 
                type="submit"
                disabled={loading}
                className="btn-premium px-16 py-8 italic group text-xs uppercase tracking-widest rounded-full"
              >
                {loading ? "TRANSMITTING..." : <><Save size={20} /> Save Changes</>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
