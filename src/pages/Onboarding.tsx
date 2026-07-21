import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'sonner';
import { User, Phone, MapPin, ArrowRight, Coffee, UserCheck } from 'lucide-react';

export default function Onboarding() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    displayName: profile?.displayName || '',
    phone: profile?.phone || '',
    street: '',
    building: '',
    floor: '',
    city: 'Beirut',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setLoading(true);
    try {
      const docRef = doc(db, 'users', profile.uid);
      await updateDoc(docRef, {
        displayName: form.displayName,
        phone: form.phone,
        address: `${form.street}, Bldg ${form.building}, Fl ${form.floor}, ${form.city}`,
        onboarded: true,
        updatedAt: new Date().toISOString(),
      });
      toast.success('Profile setup complete! Welcome to CoffeeCraze.');
      navigate('/dashboard', { replace: true });
    } catch {
      toast.error('Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white rounded-[3rem] shadow-premium-xl border border-white/60 overflow-hidden">
        <div className="p-8 sm:p-12 space-y-8">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-espresso text-caramel-gold rounded-[1.5rem] flex items-center justify-center mx-auto shadow-premium">
              <Coffee size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-display font-black text-espresso italic uppercase tracking-tight">Welcome to<br/><span className="not-italic text-caramel">CoffeeCraze</span></h1>
              <p className="text-text-muted font-serif italic mt-2">Set up your ritual profile to get started.</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2">
            {[1, 2].map((s) => (
              <div key={s} className={`w-3 h-3 rounded-full transition-all ${s === step ? 'bg-espresso w-8' : 'bg-coffee-200'}`} />
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {step === 1 ? (
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-text-muted ml-1">Your Name</label>
                  <div className="relative">
                    <User className="absolute left-5 top-1/2 -translate-y-1/2 text-caramel" size={18} />
                    <input
                      type="text" required value={form.displayName}
                      onChange={e => setForm({ ...form, displayName: e.target.value })}
                      placeholder="e.g. Elias Mansour"
                      className="w-full pl-12 pr-5 py-4 bg-cream border border-border rounded-2xl text-sm font-bold text-espresso outline-none focus:border-caramel focus:bg-white transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-text-muted ml-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-caramel" size={18} />
                    <input
                      type="tel" required value={form.phone}
                      onChange={e => setForm({ ...form, phone: e.target.value })}
                      placeholder="+961 71 972 495"
                      className="w-full pl-12 pr-5 py-4 bg-cream border border-border rounded-2xl text-sm font-bold text-espresso outline-none focus:border-caramel focus:bg-white transition-all"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-text-muted ml-1">Street / Area</label>
                  <div className="relative">
                    <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-caramel" size={18} />
                    <input
                      type="text" required value={form.street}
                      onChange={e => setForm({ ...form, street: e.target.value })}
                      placeholder="e.g. 45 Roastery Road"
                      className="w-full pl-12 pr-5 py-4 bg-cream border border-border rounded-2xl text-sm font-bold text-espresso outline-none focus:border-caramel focus:bg-white transition-all"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-text-muted ml-1">Building</label>
                    <input type="text" value={form.building}
                      onChange={e => setForm({ ...form, building: e.target.value })}
                      placeholder="Block B"
                      className="w-full px-5 py-4 bg-cream border border-border rounded-2xl text-sm font-bold text-espresso outline-none focus:border-caramel focus:bg-white transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-text-muted ml-1">Floor</label>
                    <input type="text" value={form.floor}
                      onChange={e => setForm({ ...form, floor: e.target.value })}
                      placeholder="4th"
                      className="w-full px-5 py-4 bg-cream border border-border rounded-2xl text-sm font-bold text-espresso outline-none focus:border-caramel focus:bg-white transition-all" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-text-muted ml-1">City</label>
                  <input type="text" required value={form.city}
                    onChange={e => setForm({ ...form, city: e.target.value })}
                    placeholder="Beirut"
                    className="w-full px-5 py-4 bg-cream border border-border rounded-2xl text-sm font-bold text-espresso outline-none focus:border-caramel focus:bg-white transition-all" />
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              {step === 2 && (
                <button type="button" onClick={() => setStep(1)}
                  className="flex-1 px-6 py-4 border border-border text-espresso font-bold rounded-xl text-xs uppercase tracking-wider hover:bg-cream transition-all">
                  Back
                </button>
              )}
              {step === 1 ? (
                <button type="button" onClick={() => setStep(2)}
                  className="flex-1 px-6 py-4 bg-espresso text-white font-bold rounded-xl text-xs uppercase tracking-wider hover:bg-caramel transition-all flex items-center justify-center gap-2">
                  Next <ArrowRight size={16} />
                </button>
              ) : (
                <button type="submit" disabled={loading}
                  className="flex-1 px-6 py-4 bg-espresso text-white font-bold rounded-xl text-xs uppercase tracking-wider hover:bg-caramel transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  <UserCheck size={16} />
                  {loading ? 'Saving...' : 'Complete Setup'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}