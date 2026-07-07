import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GeminiService } from '../services/gemini';
import { Coffee, ChevronRight, Sparkles, CheckCircle2, ArrowRight, RefreshCw, ShoppingBag } from 'lucide-react';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';
import SEO from '../components/common/SEO';

const QUESTIONS = [
  {
    id: 'roast',
    question: "How do you like your coffee intensity?",
    options: [
      { value: 'light', label: 'Bright & Floral', desc: 'Tea-like, high acidity, complex' },
      { value: 'medium', label: 'Balanced & Nutty', desc: 'Chocolatey, smooth, caramel' },
      { value: 'dark', label: 'Bold & Smoky', desc: 'Low acidity, intense, bitter-sweet' }
    ]
  },
  {
    id: 'method',
    question: "What's your preferred brewing ritual?",
    options: [
      { value: 'espresso', label: 'Espresso Machine', desc: 'Short, concentrated shots' },
      { value: 'pourover', label: 'Pour Over / V60', desc: 'Clean, slow-drip extraction' },
      { value: 'frenchpress', label: 'French Press', desc: 'Full-bodied, immersive brew' },
      { value: 'moka', label: 'Moka Pot', desc: 'Tradition, strong stovetop' }
    ]
  },
  {
    id: 'time',
    question: "When do you seek your ritual?",
    options: [
      { value: 'morning', label: 'First Light', desc: 'The morning wake-up call' },
      { value: 'afternoon', label: 'Afternoon Pause', desc: 'The mid-day reset' },
      { value: 'evening', label: 'Starlit Evening', desc: 'Decaf or late-night focus' }
    ]
  }
];

export default function CoffeeQuiz() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [recommendation, setRecommendation] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleAnswer = (value: string) => {
    const newAnswers = { ...answers, [QUESTIONS[step].id]: value };
    setAnswers(newAnswers);
    
    if (step < QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      getRecommendation(newAnswers);
    }
  };

  const getRecommendation = async (finalAnswers: Record<string, string>) => {
    setLoading(true);
    try {
      const result = await GeminiService.getCoffeeRecommendation(finalAnswers);
      setRecommendation(result);
    } catch (err) {
      setRecommendation({ profile: "Lebanese Ritual Special", reason: "AI suggested a classic local profile.", recommendedCategory: "Medium Roast" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-24 pb-24 md:pt-40 md:pb-40 lg:pt-48 lg:pb-48 px-6 max-w-4xl mx-auto min-h-[80vh] flex flex-col items-center">
      <SEO title="Coffee Quiz" description="Find your perfect coffee match with our interactive coffee quiz." />
      <AnimatePresence mode="wait">
        {!recommendation && !loading && (
          <motion.div 
            key="quiz"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full space-y-12 sm:space-y-16 md:space-y-20"
          >
            <div className="text-center space-y-6 sm:space-y-8">
              <span className="text-[10px] font-black uppercase tracking-[1em] text-text-muted block">Personal Assessment</span>
              <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-display font-black text-text tracking-tighter italic leading-none">Find Your Coffee <br/><span className="not-italic text-text-muted">Soulmate.</span></h1>
              <p className="text-base sm:text-lg md:text-xl text-text-secondary max-w-md mx-auto font-light leading-relaxed">Answer 3 questions and we'll match you with your ideal coffee ritual.</p>
              
              <div className="flex gap-4 justify-center pt-6 sm:pt-8">
                {QUESTIONS.map((_, i) => (
                  <div key={i} className={cn("h-1 w-8 sm:w-12 rounded-full transition-all duration-1000", i <= step ? "bg-coffee-950" : "bg-cream")} />
                ))}
              </div>
            </div>

            <div className="space-y-8 sm:space-y-10 md:space-y-12">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-black text-text text-center tracking-tight">{QUESTIONS[step].question}</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
                {QUESTIONS[step].options.map((option, i) => (
                  <motion.button
                    key={option.value}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    onClick={() => handleAnswer(option.value)}
                    className="group bg-white border border-border-light p-6 sm:p-8 md:p-10 rounded-[2rem] sm:rounded-[3rem] hover:border-coffee-950 hover:shadow-premium transition-all text-left space-y-6 sm:space-y-8 active:scale-95"
                  >
                    <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-2xl bg-cream text-text-muted group-hover:bg-coffee-950 group-hover:text-white transition-all flex items-center justify-center">
                      <Coffee size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-display font-bold text-text tracking-tight">{option.label}</h3>
                      <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-2 leading-relaxed">{option.desc}</p>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {loading && (
          <motion.div 
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center space-y-12 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full"
          >
            <div className="relative">
              <div className="w-24 h-24 sm:w-32 sm:h-32 border-[6px] border-border-light rounded-full animate-spin border-t-coffee-950" />
              <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-text animate-pulse" size={32} />
            </div>
            <div className="text-center space-y-4">
              <h3 className="text-3xl sm:text-4xl font-display font-black text-text tracking-tight">Crafting your coffee match...</h3>
              <p className="text-text-muted font-medium uppercase tracking-widest text-[10px]">Matching your taste profile to the perfect brew</p>
            </div>
          </motion.div>
        )}

        {recommendation && !loading && (
          <motion.div 
            key="result"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full bg-white border border-border-light rounded-[3rem] sm:rounded-[4rem] p-8 sm:p-12 md:p-16 lg:p-24 shadow-premium-lg text-center space-y-12 sm:space-y-14 md:space-y-16 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-16 sm:p-20 opacity-[0.03] pointer-events-none">
              <Coffee size={200} strokeWidth={1} />
            </div>

            <div className="space-y-6 sm:space-y-8 relative z-10">
              <div className="inline-flex items-center gap-3 px-4 sm:px-6 py-2 sm:py-2.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-sm">
                <CheckCircle2 size={16} /> Ritual Match Found
              </div>
              <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-black text-text leading-none tracking-tightest italic">The {recommendation.profile.split(' ')[0]} <br/> <span className="not-italic text-text-muted">{recommendation.profile.split(' ').slice(1).join(' ')}</span></h2>
              <p className="text-lg sm:text-xl md:text-2xl text-text-secondary max-w-2xl mx-auto leading-relaxed font-light italic">\"" {recommendation.reason} \""</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 md:gap-12 pt-8 sm:pt-10">
              <div className="p-6 sm:p-8 md:p-10 bg-cream rounded-[2rem] sm:rounded-[3rem] text-left space-y-4 sm:space-y-6 group hover:bg-coffee-950 hover:text-white transition-all duration-700">
                <h4 className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em]">Recommended Ritual</h4>
                <p className="text-2xl sm:text-3xl font-display font-black tracking-tight leading-none">{recommendation.recommendedCategory}</p>
                <Link to="/shop" className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 hover:gap-5 transition-all pt-4">
                  View Recommendation <ArrowRight size={14} />
                </Link>
              </div>
              <div className="p-6 sm:p-8 md:p-10 bg-coffee-950 text-white rounded-[2rem] sm:rounded-[3rem] text-left space-y-4 sm:space-y-6 relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-32 h-32 sm:w-40 sm:h-40 bg-coffee-500/10 blur-3xl rounded-full"></div>
                <h4 className="text-[10px] font-black text-cream uppercase tracking-[0.3em]">Welcome Offer</h4>
                <p className="text-2xl sm:text-3xl font-display font-black tracking-tight leading-none">15% Induction Credit</p>
                <div className="pt-4 flex items-center justify-between">
                   <p className="text-[10px] font-bold text-cream uppercase tracking-widest">Code: RITUAL15</p>
                   <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border border-white/10 flex items-center justify-center">
                     <CheckCircle2 size={14} />
                   </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center pt-6 sm:pt-8 relative z-10">
              <Link to="/shop" className="px-8 sm:px-10 md:px-12 py-5 sm:py-6 bg-coffee-950 text-white rounded-full text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl shadow-coffee-950/20 hover:bg-coffee-500 transition-all">
                Initiate Allocation
              </Link>
              <button 
                onClick={() => { setRecommendation(null); setStep(0); setAnswers({}); }}
                className="px-8 sm:px-10 md:px-12 py-5 sm:py-6 bg-white border border-border text-text rounded-full text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-cream transition-all"
              >
                <RefreshCw size={18} /> Try Again
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
