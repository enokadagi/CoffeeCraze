import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { signInWithPopup, signInWithRedirect, signInWithCredential, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, sendEmailVerification, updateProfile } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import ImageWithFallback from '../components/common/ImageWithFallback';
import { User, Mail, Lock, Coffee, ArrowRight } from 'lucide-react';
import SEO from '../components/common/SEO';
import { cn } from '../lib/utils';

export default function Auth() {
  const { user: authUser, loading: authLoading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  // Support both ?redirect= query param and ProtectedRoute's state.from
  const getRedirectPath = () => {
    const redirectParam = searchParams.get('redirect');
    if (redirectParam) return redirectParam;
    const fromState = location.state as { from?: { pathname: string } } | null;
    if (fromState?.from?.pathname) return fromState.from.pathname;
    return '/';
  };

  // If user is already authenticated (e.g. after redirect sign-in), navigate away
  useEffect(() => {
    if (!authLoading && authUser) {
      navigate(getRedirectPath(), { replace: true });
    }
  }, [authUser, authLoading]);

  // Load Google Identity Services script
  const gsiLoadedRef = useRef(false);

  useEffect(() => {
    if (typeof google !== 'undefined' && google.accounts) {
      gsiLoadedRef.current = true;
      return;
    }
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.defer = true;
    s.onload = () => { gsiLoadedRef.current = true; };
    document.head.appendChild(s);
  }, []);

  const handleGoogleLogin = async () => {
    if (!auth) {
      toast.error('Firebase Auth not initialized.');
      return;
    }

    setLoading(true);

    // --- Primary method: GSI (Google Identity Services) popup ---
    // This bypasses Firebase's own OAuth handler and talks directly to Google.
    // Works on any domain authorized in the Google OAuth client config.
    if (gsiLoadedRef.current && typeof google !== 'undefined' && google.accounts) {
      try {
        const tokenClient = google.accounts.oauth2.initTokenClient({
          client_id: '571039033130-8e87npd00r57hug1e0pvo0b0a6bl1gl6.apps.googleusercontent.com',
          scope: 'openid profile email',
          callback: async (tokenResponse) => {
            if (tokenResponse.error) {
              console.error('GSI token error:', tokenResponse.error);
              setLoading(false);
              toast.error('Google sign-in failed: ' + tokenResponse.error);
              return;
            }
            try {
              const idToken = tokenResponse.id_token;
              const accessToken = tokenResponse.access_token;
              if (idToken) {
                const credential = GoogleAuthProvider.credential(idToken);
                await signInWithCredential(auth, credential);
              } else if (accessToken) {
                const credential = GoogleAuthProvider.credential(null, accessToken);
                await signInWithCredential(auth, credential);
              } else {
                throw new Error('No token returned from Google');
              }
              toast.success("Welcome back — you're signed in.");
              navigate(getRedirectPath(), { replace: true });
            } catch (credErr) {
              console.error('signInWithCredential error:', credErr);
              setLoading(false);
              toast.error('Google sign-in failed. Try again.');
            }
          },
        });
        tokenClient.requestAccessToken();
        return; // callback will handle navigation
      } catch (gsiErr) {
        console.warn('GSI init failed, falling back to popup:', gsiErr);
      }
    }

    // --- Fallback 1: Firebase signInWithPopup ---
    try {
      await signInWithPopup(auth, googleProvider);
      toast.success("Welcome back — you're signed in.");
      navigate(getRedirectPath(), { replace: true });
    } catch (popupErr) {
      const code = (popupErr as any)?.code || '';
      const message = (popupErr as any)?.message || String(popupErr);
      console.warn('Popup sign-in failed:', { code, message });

      if (code.includes('popup-closed-by-user') || code.includes('cancelled-popup-request')) {
        toast.error("Sign in cancelled.");
        return;
      }
      if (code.includes('popup-blocked') || code.includes('unauthorized-domain') ||
          message.includes('popup-blocked') || message.includes('unauthorized-domain') ||
          message.includes('cross-origin') || message.includes('DOMException')) {
        // Fallback 2: redirect
        console.log('Falling back to signInWithRedirect');
        try {
          await signInWithRedirect(auth, googleProvider);
          return;
        } catch (redirectErr) {
          console.error('Redirect also failed:', redirectErr);
          toast.error(`Google sign-in not supported on this domain. Use coffeecraze.nilelink.app instead.`);
        }
      } else {
        toast.error(`Google sign-in error: ${code || message}. Use coffeecraze.nilelink.app.`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      toast.error("Please enter your email address first.");
      return;
    }
    try {
      setResetting(true);
      await sendPasswordResetEmail(auth, email);
      toast.success("Password reset link sent to your email.");
    } catch (err) {
      toast.error("Failed to send password reset email.");
    } finally {
      setResetting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success("Welcome back \u2014 you're signed in.");
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        if (displayName.trim()) {
          await updateProfile(userCredential.user, { displayName: displayName.trim() });
        }
        await sendEmailVerification(userCredential.user);
        toast.success("Account created successfully! Please check your email to verify your address.");
      }
      navigate(getRedirectPath(), { replace: true });
    } catch (err) {
      const code = (err as any)?.code || '';
      if (code.includes('invalid-credential') || code.includes('auth/invalid-credential')) {
        toast.error('Invalid email or password. Please try again.');
      } else if (code.includes('email-already-in-use')) {
        toast.error('An account with this email already exists.');
      } else if (code.includes('weak-password')) {
        toast.error('Password must be at least 6 characters.');
      } else if (code.includes('user-not-found') || code.includes('wrong-password')) {
        toast.error('Invalid email or password. Please try again.');
      } else {
        toast.error('Authentication failed. Please try again.');
      }
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
            <div className="w-16 h-16 bg-caramel/20 rounded-2xl flex items-center justify-center mx-auto text-caramel shadow-premium">
            <Coffee size={24} strokeWidth={1} />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-cream tracking-tight">{isLogin ? 'Welcome Back' : 'Create Account'}</h1>
            <p className="text-sm text-cream/90">Access your coffee ritual, orders, and subscription experience.</p>
          </div>

          <div className="flex p-1 bg-cream/10 rounded-2xl border border-white/10 mb-6">
            <button 
              onClick={() => setIsLogin(true)}
              className={cn(
                "flex-1 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-400",
                isLogin ? 'bg-caramel text-espresso shadow-premium' : 'text-cream/70 hover:text-cream hover:bg-white/5'
              )}
            >
              Sign In
            </button>
            <button 
              onClick={() => setIsLogin(false)}
              className={cn(
                "flex-1 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-400",
                !isLogin ? 'bg-caramel text-espresso shadow-premium' : 'text-cream/70 hover:text-cream hover:bg-white/5'
              )}
            >
              Register
            </button>
          </div>
        </div>

        {!isLogin && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-amber-500/20 border border-amber-400/30 rounded-2xl space-y-3"
          >
            <p className="text-xs text-amber-200 text-center">
              Verify your email to unlock orders, subscriptions, and premium recommendations.
            </p>
            <button
              type="button"
              onClick={async () => {
                if (!auth.currentUser) { toast.error('Sign in first to resend verification.'); return; }
                setVerifying(true);
                try {
                  await sendEmailVerification(auth.currentUser);
                  toast.success('Verification email sent. Please check your inbox.');
                } catch (err) {
                  toast.error('Failed to send verification email.');
                } finally {
                  setVerifying(false);
                }
              }}
              disabled={verifying}
              className="w-full py-2 text-xs font-bold uppercase tracking-wider text-amber-200 border border-amber-400/30 rounded-xl hover:bg-amber-500/20 transition-colors disabled:opacity-50"
            >
              {verifying ? 'Sending...' : 'Resend Verification Email'}
            </button>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-1"
            >
                <label className="text-xs font-semibold text-caramel tracking-wide">Display Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-caramel/70 w-4 h-4" strokeWidth={1.5} />
                <input 
                  type="text" 
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  required={!isLogin}
                  className="w-full pl-10 pr-4 py-3 bg-white/15 border border-white/20 rounded-2xl focus:bg-white/20 focus:border-caramel focus:ring-2 focus:ring-caramel/20 outline-none transition-all text-sm placeholder:text-cream/60 text-cream"
                />
              </div>
            </motion.div>
          )}

          <div className="space-y-1">
              <label className="text-xs font-semibold text-caramel tracking-wide">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-caramel/70 w-4 h-4" strokeWidth={1.5} />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full pl-10 pr-4 py-3 bg-white/15 border border-white/20 rounded-2xl focus:bg-white/20 focus:border-caramel focus:ring-2 focus:ring-caramel/20 outline-none transition-all text-sm placeholder:text-cream/60 text-cream"
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-caramel tracking-wide">Password</label>
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
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-caramel/70 w-4 h-4" strokeWidth={1.5} />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"
                required
                className="w-full pl-10 pr-4 py-3 bg-white/15 border border-white/20 rounded-2xl focus:bg-white/20 focus:border-caramel focus:ring-2 focus:ring-caramel/20 outline-none transition-all text-sm placeholder:text-cream/60 text-cream"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full text-sm"
          >
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
            <ArrowRight size={16} />
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
          <div className="relative flex justify-center">
              <span className="bg-espresso/95 px-4 text-xs text-cream">or continue with</span>
          </div>
        </div>

        <button 
          onClick={handleGoogleLogin}
          className="w-full py-3 border border-white/10 bg-cream text-espresso rounded-2xl flex items-center justify-center gap-3 text-sm font-medium hover:bg-white transition-all duration-500 shadow-premium active:scale-[0.98]"
        >
          <ImageWithFallback src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/action/google.svg" alt="Google" className="w-5 h-5" />
          Continue with Google
        </button>
      </motion.div>

      {/* Atmospheric Background Vector */}
      <div className="absolute bottom-40 right-40 w-[600px] h-[600px] bg-caramel/5 rounded-full blur-[200px] animate-pulse-slow pointer-events-none" />
    </div>
  );
}
