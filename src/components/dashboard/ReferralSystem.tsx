import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Gift, Copy, Share2, Check, Zap } from 'lucide-react';
import { toast } from 'sonner';

export default function ReferralSystem() {
  const { profile } = useAuth();
  const [copied, setCopied] = useState(false);

  const referralCode = profile?.referralCode || profile?.uid.slice(0, 8).toUpperCase() || 'RITUALIST10';
  const referralLink = `${window.location.origin}/auth?ref=${referralCode}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success("Referral link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-coffee-950 rounded-[2.5rem] p-6 sm:p-8 md:p-12 text-white relative overflow-hidden group">
      {/* Decorative Orbs */}
      <div className="absolute top-0 right-0 w-32 h-32 sm:w-48 sm:h-48 lg:w-64 lg:h-64 bg-coffee-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-24 h-24 sm:w-32 sm:h-32 lg:w-48 lg:h-48 bg-white/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

      <div className="flex flex-col lg:flex-row items-center gap-8 sm:gap-10 lg:gap-12 relative z-10">
        <div className="flex-1 space-y-6 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-coffee-500 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-xl shadow-coffee-500/20">
            <Gift size={12} /> Share the Ritual
          </div>
          <h2 className="text-3xl sm:text-4xl font-display font-bold leading-tight">Gift a Coffee,<br />Get <span className="text-coffee-300">Free Beans</span>.</h2>
          <p className="text-base sm:text-lg text-white/60 font-light max-w-md">Invite a friend to start their CoffeeCraze ritual. They get 15% off, and you earn 200 loyalty points for every successful referral.</p>
        </div>

        <div className="w-full max-w-md bg-white p-6 sm:p-8 rounded-[2rem] space-y-6 text-coffee-950">
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-coffee-400">
              <span className="flex items-center gap-2"><Zap size={14} className="text-yellow-500" /> Quick Share</span>
              <span>Your Code: {referralCode}</span>
            </div>
            <div className="relative">
              <input 
                type="text" 
                readOnly 
                value={referralLink}
                className="w-full pl-4 pr-32 py-3 sm:py-5 bg-coffee-50 border border-coffee-100 rounded-2xl text-xs font-mono font-medium outline-none"
              />
              <button 
                onClick={copyToClipboard}
                className="absolute right-2 top-2 bottom-2 px-6 bg-coffee-950 text-white rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-coffee-800 transition-all"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
          
          <div className="pt-6 border-t border-coffee-50 flex items-center justify-between gap-4">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="w-8 h-8 sm:w-10 sm:h-10 border-4 border-white rounded-full bg-coffee-100" />
              ))}
              <div className="w-8 h-8 sm:w-10 sm:h-10 border-4 border-white rounded-full bg-coffee-950 flex items-center justify-center text-[10px] font-bold text-white">
                +12
              </div>
            </div>
            <p className="text-[10px] font-bold text-coffee-400 uppercase tracking-widest text-right">
              Join 500+ Ritualists<br />sharing the love.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
