import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { User, Mail, Phone, MapPin, Camera, Save, Shield } from 'lucide-react';
import { toast } from 'sonner';
import SEO from '../../components/common/SEO';
import DashboardLayout from '../../components/layout/DashboardLayout';

export default function AccountSettings() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    phone: '',
    street: '',
    building: '',
    floor: '',
    city: 'Beirut'
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        displayName: profile.displayName || '',
        email: profile.email || '',
        phone: profile.phone || '',
        street: (profile as any).street || profile.address || '',
        building: (profile as any).building || '',
        floor: (profile as any).floor || '',
        city: (profile as any).city || 'Beirut'
      });
    }
  }, [profile]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    
    setLoading(true);
    try {
      const docRef = doc(db, 'users', profile.uid);
      const compositeAddress = `${formData.street}, Bldg ${formData.building}, Fl ${formData.floor}, ${formData.city}`;
      await updateDoc(docRef, {
        displayName: formData.displayName,
        phone: formData.phone,
        address: compositeAddress,
        street: formData.street,
        building: formData.building,
        floor: formData.floor,
        city: formData.city
      });
      toast.success("Profile coordinates synced with CC Mainframe");
    } catch (err) {
      toast.error("Failed to update profile coordinates");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-12">
        <SEO title="Account Settings" description="Update your CoffeeCraze profile, contact info, and delivery preferences." />
        <header className="space-y-3">
          <span className="stat-label text-caramel">System Parameters</span>
          <h1 className="text-4xl md:text-5xl font-display font-black text-espresso leading-none tracking-tightest italic uppercase">Account <br/><span className="not-italic text-coffee-400">Archive.</span></h1>
          <p className="text-base text-coffee-400 font-serif italic max-w-2xl leading-relaxed">Refine your sensory identity and logistics coordinates within the CC mainframe.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white shadow-premium border border-white rounded-3xl p-8 text-center space-y-8 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-36 h-36 bg-caramel/5 blur-[40px] rounded-full pointer-events-none" />
              
              <div className="relative inline-block mx-auto">
                <div className="w-32 h-32 rounded-2xl bg-cream flex items-center justify-center text-4xl font-display font-black text-espresso/10 border border-white group-hover:scale-102 transition-transform duration-500 shadow-inner overflow-hidden">
                  {profile?.displayName?.[0] || 'U'}
                </div>
                <button className="absolute -bottom-3 -right-3 w-10 h-10 bg-espresso text-caramel rounded-xl border-4 border-white shadow-premium flex items-center justify-center hover:scale-105 transition-all duration-500">
                  <Camera size={16} strokeWidth={1.5} />
                </button>
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-display font-black text-espresso tracking-tight italic uppercase">{profile?.displayName}</h3>
                <p className="text-[9px] text-caramel font-black uppercase tracking-[0.3em] italic mb-1">{profile?.role}_CLEARANCE</p>
              </div>

              <div className="pt-6 border-t border-espresso/5 grid grid-cols-2 gap-4">
                <div className="text-center group/stat">
                   <p className="text-[9px] font-black text-coffee-300 uppercase tracking-[0.3em] mb-1 group-hover/stat:text-espresso transition-colors italic">Neural Credits</p>
                   <p className="text-2xl font-display font-black text-espresso italic tracking-tighter">{profile?.loyaltyPoints || 0}</p>
                </div>
                <div className="text-center group/stat">
                   <p className="text-[9px] font-black text-coffee-300 uppercase tracking-[0.3em] mb-1 group-hover/stat:text-espresso transition-colors italic">Clearance</p>
                   <p className="text-xl font-display font-black text-espresso italic tracking-tighter uppercase">{profile?.role || 'Customer'}</p>
                </div>
              </div>
            </div>

            <div className="p-6 bg-espresso rounded-3xl text-white flex items-center gap-6 shadow-premium-2xl relative overflow-hidden group hover:scale-[1.01] transition-all duration-500 cursor-pointer border border-white/5">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(193,155,118,0.15),transparent)]" />
              <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-500 border border-white/5 group-hover:bg-caramel group-hover:text-espresso">
                <Shield size={20} strokeWidth={1.5} />
              </div>
              <div className="space-y-0.5 relative z-10">
                <p className="text-lg font-display font-black tracking-tight leading-none italic">Security Protocol</p>
                <p className="text-[9px] text-coffee-400 font-semibold tracking-widest uppercase">Verified active clearance</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleUpdate} className="lg:col-span-8 bg-white shadow-premium border border-white rounded-3xl p-6 sm:p-10 space-y-8 relative overflow-hidden">
            <div className="absolute bottom-0 right-0 w-72 h-72 bg-cream blur-[80px] opacity-30 translate-y-1/2 translate-x-1/2 rounded-full pointer-events-none" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
              <div className="space-y-2 col-span-2 md:col-span-1">
                <label className="text-[9px] font-black text-coffee-300 uppercase tracking-[0.3em] italic ml-4">Display Name</label>
                <div className="relative group">
                  <User className="absolute left-6 top-1/2 -translate-y-1/2 text-caramel transition-transform" size={16} />
                  <input 
                    type="text" 
                    required
                    value={formData.displayName}
                    onChange={e => setFormData({...formData, displayName: e.target.value})}
                    className="w-full pl-14 pr-6 py-4 bg-cream shadow-inner border border-espresso/5 rounded-2xl focus:bg-white focus:border-caramel outline-none transition-all font-display font-black text-espresso text-base italic tracking-tight"
                  />
                </div>
              </div>

              <div className="space-y-2 col-span-2 md:col-span-1">
                <label className="text-[9px] font-black text-coffee-300 uppercase tracking-[0.3em] italic ml-4">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-coffee-200" size={16} />
                  <input 
                    disabled
                    type="email" 
                    value={formData.email}
                    className="w-full pl-14 pr-6 py-4 bg-cream/50 border border-espresso/5 rounded-2xl text-espresso/30 cursor-not-allowed font-medium italic tracking-widest text-xs"
                  />
                </div>
              </div>

              <div className="space-y-2 col-span-2 md:col-span-1">
                <label className="text-[9px] font-black text-coffee-300 uppercase tracking-[0.3em] italic ml-4">Phone Number</label>
                <div className="relative group">
                  <Phone className="absolute left-6 top-1/2 -translate-y-1/2 text-caramel transition-transform" size={16} />
                  <input 
                    type="tel" 
                    required
                    placeholder="+961 71 972 495"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    className="w-full pl-14 pr-6 py-4 bg-cream shadow-inner border border-espresso/5 rounded-2xl focus:bg-white focus:border-caramel outline-none transition-all font-display font-black text-espresso text-base italic tracking-tight"
                  />
                </div>
              </div>

              <div className="space-y-2 col-span-2 md:col-span-1">
                <label className="text-[9px] font-black text-coffee-300 uppercase tracking-[0.3em] italic ml-4">City / Region</label>
                <div className="relative group">
                  <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 text-caramel transition-transform" size={16} />
                  <input 
                    type="text" 
                    required
                    value={formData.city}
                    onChange={e => setFormData({...formData, city: e.target.value})}
                    className="w-full pl-14 pr-6 py-4 bg-cream shadow-inner border border-espresso/5 rounded-2xl focus:bg-white focus:border-caramel outline-none transition-all font-display font-black text-espresso text-base italic tracking-tight"
                  />
                </div>
              </div>

              <div className="space-y-2 col-span-2">
                <label className="text-[9px] font-black text-coffee-300 uppercase tracking-[0.3em] italic ml-4">Street address</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. 45 Roastery Road"
                  value={formData.street}
                  onChange={e => setFormData({...formData, street: e.target.value})}
                  className="w-full px-6 py-4 bg-cream shadow-inner border border-espresso/5 rounded-2xl focus:bg-white focus:border-caramel outline-none transition-all font-display font-black text-espresso text-base italic tracking-tight"
                />
              </div>

              <div className="space-y-2 col-span-2 md:col-span-1">
                <label className="text-[9px] font-black text-coffee-300 uppercase tracking-[0.3em] italic ml-4">Building Name / Block</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Block B"
                  value={formData.building}
                  onChange={e => setFormData({...formData, building: e.target.value})}
                  className="w-full px-6 py-4 bg-cream shadow-inner border border-espresso/5 rounded-2xl focus:bg-white focus:border-caramel outline-none transition-all font-display font-black text-espresso text-base italic tracking-tight"
                />
              </div>

              <div className="space-y-2 col-span-2 md:col-span-1">
                <label className="text-[9px] font-black text-coffee-300 uppercase tracking-[0.3em] italic ml-4">Floor / Apartment</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. 4th Floor"
                  value={formData.floor}
                  onChange={e => setFormData({...formData, floor: e.target.value})}
                  className="w-full px-6 py-4 bg-cream shadow-inner border border-espresso/5 rounded-2xl focus:bg-white focus:border-caramel outline-none transition-all font-display font-black text-espresso text-base italic tracking-tight"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 relative z-10">
              <button 
                type="submit"
                disabled={loading}
                className="btn-premium px-10 py-5 italic group text-xs uppercase tracking-widest rounded-full"
              >
                {loading ? "TRANSMITTING..." : <><Save size={16} /> Save Changes</>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
