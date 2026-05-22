import { useState } from 'react';
import { motion } from 'motion/react';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, updateProfile } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import ImageWithFallback from '../components/common/ImageWithFallback';
import { User, Mail, Lock, Coffee, ArrowRight } from 'lucide-react';
import SEO from '../components/common/SEO';
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
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        if (displayName.trim()) {
          await updateProfile(userCredential.user, { displayName: displayName.trim() });
        }
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
    <div className="pt-24 pb-24 px-6 min-h-screen flex items-center justify-center bg-espresso overflow-hidden relative">
      <SEO title="Sign In" description="Sign in or create an account to access your CoffeeCraze ritual." />
      <div className="mesh-gradient absolute inset-0 opacity-10 pointer-events-none" />
      
      {/* Primary Atmospheric Elements */}
      <div className="absolute top-0 right-0 w-[1000px] h-[1000px] bg-caramel-gold/15 rounded-full blur-[280px] opacity-40 -z-0 translate-x-1/4 -translate-y-1/4 animate-pulse-slow" />
      <div className="absolute bottom-0 left-0 w-[700px] h-[700px] bg-mocha/20 rounded-full blur-[220px] opacity-25 -z-0 -translate-x-1/4 translate-y-1/4" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-lg bg-white/10 backdrop-blur-3xl p-6 sm:p-8 lg:p-10 rounded-[2rem] border border-white/10 shadow-premium-lg relative z-10"
      >
        <div className="text-center mb-8 space-y-4">
          <div className="w-16 h-16 bg-cream/10 rounded-2xl flex items-center justify-center mx-auto text-cream shadow-premium">
            <Coffee size={24} strokeWidth={1} />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-cream tracking-tight">{isLogin ? 'Welcome Back' : 'Create Account'}</h1>
            <p className="text-sm text-cream/70">Sign in to access your ritual dashboard</p>
          </div>
        </div>

        <div className="flex p-1 bg-cream/10 rounded-2xl border border-white/10 mb-6">
          <button 
            onClick={() => setIsLogin(true)}
            className={cn(
              "flex-1 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-400",
              isLogin ? 'bg-cream/20 text-cream shadow-premium' : 'text-cream/70 hover:text-cream'
            )}
          >
            Sign In
          </button>
          <button 
            onClick={() => setIsLogin(false)}
            className={cn(
              "flex-1 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-400",
              !isLogin ? 'bg-cream/20 text-cream shadow-premium' : 'text-cream/70 hover:text-cream'
            )}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-1"
            >
              <label className="text-xs font-semibold text-cream/70 tracking-wide">Display Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-cream/50 w-4 h-4" strokeWidth={1.5} />
                <input 
                  type="text" 
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  required={!isLogin}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/10 rounded-2xl focus:bg-white/15 focus:border-cream focus:ring-2 focus:ring-cream/15 outline-none transition-all text-sm placeholder:text-cream/40 text-cream"
                />
              </div>
            </motion.div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-cream/70 tracking-wide">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-cream/50 w-4 h-4" strokeWidth={1.5} />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/10 rounded-2xl focus:bg-white/15 focus:border-cream focus:ring-2 focus:ring-cream/15 outline-none transition-all text-sm placeholder:text-cream/40 text-cream"
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-cream/70 tracking-wide">Password</label>
              {isLogin && (
                <button 
                  type="button" 
                  onClick={handleResetPassword}
                  className="text-xs font-medium text-caramel hover:text-cream transition-colors"
                >
                  Forgot?
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-cream/50 w-4 h-4" strokeWidth={1.5} />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/10 rounded-2xl focus:bg-white/15 focus:border-cream focus:ring-2 focus:ring-cream/15 outline-none transition-all text-sm placeholder:text-cream/40 text-cream"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="btn-premium w-full text-sm"
          >
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
            <ArrowRight size={16} />
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
          <div className="relative flex justify-center">
            <span className="bg-espresso/95 px-4 text-xs text-cream/60">or continue with</span>
          </div>
        </div>

        <button 
          onClick={handleGoogleLogin}
          className="w-full py-3 border border-white/10 bg-cream text-espresso rounded-2xl flex items-center justify-center gap-3 text-sm font-medium hover:bg-white transition-all duration-500 shadow-premium active:scale-[0.98]"
        >
          <ImageWithFallback src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/action/google.svg" alt="Google" className="w-5 h-5" />
          Google
        </button>
      </motion.div>

      {/* Atmospheric Background Vector */}
      <div className="absolute bottom-40 right-40 w-[600px] h-[600px] bg-caramel/5 rounded-full blur-[200px] animate-pulse-slow pointer-events-none" />
    </div>
  );
}
