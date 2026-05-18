import { useState } from 'react';
import { motion } from 'motion/react';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { AuthService } from '../services/auth';
import { toast } from 'sonner';
import { User, Mail, Lock, Coffee, ArrowRight } from 'lucide-react';

import { cn } from '../lib/utils';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const navigate = useNavigate();

  const handleResetPassword = async () => {
    if (!email) {
      toast.error("Please enter your ritual email address first.");
      return;
    }
    try {
      setResetting(true);
      await sendPasswordResetEmail(auth, email);
      toast.success("Protocol reset link transmitted.");
    } catch (err) {
      toast.error("Failed to transmit reset protocol.");
    } finally {
      setResetting(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      await signInWithPopup(auth, googleProvider);
      toast.success("Biometric verification successful. Welcome.");
      navigate('/');
    } catch (err) {
      toast.error("Neural verification failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success("Access granted. Protocol initiated.");
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        toast.success("Account manifested. Welcome to the Collective.");
      }
      navigate('/');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Identification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-20 sm:pt-30 md:pt-40 pb-20 sm:pb-30 md:pb-40 px-6 min-h-screen flex items-center justify-center bg-cream overflow-hidden relative">
      <div className="mesh-gradient absolute inset-0 opacity-[0.05] pointer-events-none" />
      
      {/* Primary Atmospheric Elements */}
      <div className="absolute top-0 right-0 w-[1200px] h-[1200px] bg-caramel/10 rounded-full blur-[300px] opacity-30 -z-0 translate-x-1/4 -translate-y-1/4 animate-pulse-slow" />
      <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-espresso/5 rounded-full blur-[250px] opacity-20 -z-0 -translate-x-1/4 translate-y-1/4" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-xl bg-white p-6 sm:p-8 md:p-12 lg:p-16 xl:p-24 rounded-[4rem] sm:rounded-[5rem] lg:rounded-[6rem] border border-white shadow-premium-2xl relative z-10 group overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-cream/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />
        
        <div className="text-center mb-12 sm:mb-14 md:mb-16 space-y-8 sm:space-y-10 relative z-10">
          <div className="w-20 sm:w-24 md:w-28 h-20 sm:h-24 md:h-28 bg-espresso rounded-[2rem] flex items-center justify-center mx-auto text-caramel shadow-premium-lg transform -rotate-12 group-hover:rotate-0 transition-all duration-1000 border border-white/5 group-hover:scale-110">
            <Coffee size={32} strokeWidth={1} />
          </div>
          <div className="space-y-4">
            <span className="text-fluid-small font-black uppercase tracking-[0.8em] text-caramel block italic leading-none ml-2">Terminal_Access</span>
            <h1 className="text-fluid-heading font-display font-black text-espresso tracking-tightest leading-none italic uppercase">Ritual <br/><span className="not-italic text-coffee-300">Gateway.</span></h1>
            <p className="text-fluid-body text-coffee-400 font-serif italic leading-relaxed">"Verification required for sensory allocation."</p>
          </div>
        </div>

        <div className="flex p-1.5 bg-cream shadow-inner border border-espresso/5 rounded-full mb-10 sm:mb-12 relative z-10 backdrop-blur-xl">
          <button 
            onClick={() => setIsLogin(true)}
            className={cn(
              "flex-grow py-3 sm:py-4 rounded-full text-fluid-small font-black uppercase tracking-[0.4em] transition-all duration-700 italic",
              isLogin ? 'bg-white text-espresso shadow-premium' : 'text-coffee-300 hover:text-espresso'
            )}
          >
            ACCESS_NODE
          </button>
          <button 
            onClick={() => setIsLogin(false)}
            className={cn(
              "flex-grow py-3 sm:py-4 rounded-full text-fluid-small font-black uppercase tracking-[0.4em] transition-all duration-700 italic",
              !isLogin ? 'bg-white text-espresso shadow-premium' : 'text-coffee-300 hover:text-espresso'
            )}
          >
            MANIFEST_NODE
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 sm:space-y-10 relative z-10">
          {!isLogin && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3"
            >
              <label className="text-fluid-small font-black text-coffee-300 uppercase tracking-[0.5em] pl-6 italic">SIGNATURE_CORE</label>
              <div className="relative group/field">
                <User className="absolute left-8 top-1/2 -translate-y-1/2 text-caramel/50 w-5 h-5 group-focus-within/field:text-caramel transition-colors duration-700" strokeWidth={1} />
                <input 
                  type="text" 
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="RITUAL_IDENTITY"
                  required={!isLogin}
                  className="w-full pl-12 sm:pl-14 md:pl-16 lg:pl-20 xl:pl-22 pr-6 md:pr-8 py-3 sm:py-4 md:py-5 lg:py-6 xl:py-7 bg-cream shadow-inner border border-espresso/5 rounded-[2rem] focus:bg-white focus:border-caramel focus:ring-8 focus:ring-caramel/5 outline-none transition-all duration-700 placeholder:text-coffee-200 text-fluid-body font-display font-black text-espresso italic tracking-tight"
                />
              </div>
            </motion.div>
          )}

          <div className="space-y-3">
            <label className="text-fluid-small font-black text-coffee-300 uppercase tracking-[0.5em] pl-6 italic">NEURAL_ID</label>
            <div className="relative group/field">
              <Mail className="absolute left-8 top-1/2 -translate-y-1/2 text-caramel/50 w-5 h-5 group-focus-within/field:text-caramel transition-colors duration-700" strokeWidth={1} />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="EMAIL_VECTOR"
                required
                className="w-full pl-12 sm:pl-14 md:pl-16 lg:pl-20 xl:pl-22 pr-6 md:pr-8 py-3 sm:py-4 md:py-5 lg:py-6 xl:py-7 bg-cream shadow-inner border border-espresso/5 rounded-[2rem] focus:bg-white focus:border-caramel focus:ring-8 focus:ring-caramel/5 outline-none transition-all duration-700 placeholder:text-coffee-200 text-fluid-body font-display font-black text-espresso italic tracking-tight"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center pr-6">
              <label className="text-fluid-small font-black text-coffee-300 uppercase tracking-[0.5em] pl-6 italic">CRYPTO_CIPHER</label>
              {isLogin && (
                <button 
                  type="button" 
                  onClick={handleResetPassword}
                  className="text-fluid-small font-black text-caramel hover:text-espresso uppercase tracking-[0.3em] transition-all italic underline underline-offset-8 decoration-caramel/30"
                >
                  RETRIEVE?
                </button>
              )}
            </div>
            <div className="relative group/field">
              <Lock className="absolute left-8 top-1/2 -translate-y-1/2 text-caramel/50 w-5 h-5 group-focus-within/field:text-caramel transition-colors duration-700" strokeWidth={1} />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="w-full pl-12 sm:pl-14 md:pl-16 lg:pl-20 xl:pl-22 pr-6 md:pr-8 py-3 sm:py-4 md:py-5 lg:py-6 xl:py-7 bg-cream shadow-inner border border-espresso/5 rounded-[2rem] focus:bg-white focus:border-caramel focus:ring-8 focus:ring-caramel/5 outline-none transition-all duration-700 placeholder:text-coffee-200 text-fluid-body font-display font-black text-espresso italic tracking-widest"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-4 sm:py-5 md:py-6 lg:py-7 bg-espresso hover:bg-caramel text-white rounded-[1.5rem] sm:rounded-[2rem] md:rounded-full text-[9px] sm:text-[10px] md:text-[11px] lg:text-[12px] font-black uppercase tracking-[0.3em] sm:tracking-[0.4em] lg:tracking-[0.6em] shadow-premium transition-all duration-1000 flex items-center justify-center gap-3 sm:gap-4 lg:gap-6 xl:gap-8 active:scale-95 disabled:opacity-50 group/btn italic relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            <span className="relative z-10">{loading ? 'SYNCHRONIZING...' : (isLogin ? 'INITIATE_ACCESS' : 'MANIFEST_NODE')}</span>
            <ArrowRight size={20} className="relative z-10 group-hover:translate-x-4 transition-transform duration-700" />
          </button>
        </form>

        <div className="relative my-12 sm:my-14 md:my-16">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-espresso/5"></div></div>
          <div className="relative flex justify-center text-fluid-small uppercase tracking-[0.8em] text-coffee-200 italic font-black">
            <span className="bg-white px-8 sm:px-10 italic">SECONDARY_INDUCTION</span>
          </div>
        </div>

        <button 
          onClick={handleGoogleLogin}
          className="w-full py-4 sm:py-5 border border-espresso/5 bg-cream rounded-full flex items-center justify-center gap-6 text-espresso text-fluid-small font-black uppercase tracking-[0.4em] italic hover:bg-espresso hover:text-white transition-all duration-1000 shadow-premium active:scale-95 group/google group"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/action/google.svg" className="w-5 h-5 group-hover:scale-110 group-hover:brightness-0 group-hover:invert transition-all duration-1000" />
          GOOGLE_PROTOCOL
        </button>
      </motion.div>

      {/* Atmospheric Background Vector */}
      <div className="absolute bottom-40 right-40 w-[600px] h-[600px] bg-caramel/5 rounded-full blur-[200px] animate-pulse-slow pointer-events-none" />
    </div>
  );
}
