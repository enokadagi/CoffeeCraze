import { useState, useEffect, useMemo } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Product } from '../types';
import ProductCard from '../components/shop/ProductCard';
import { Search, Filter, SlidersHorizontal, X, LayoutGrid, List, ChevronDown, Star, Tag, DollarSign, Compass, FilterX, ArrowRight, Sparkles, Coffee } from 'lucide-react';
import { SAMPLE_PRODUCTS } from '../lib/sampleData';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';

const CATEGORIES = ['All', 'Coffee Beans', 'Capsules', 'Espresso Machines', 'Accessories', 'Syrups'];

export default function Shop() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Persistent Filter States
  const [filters, setFilters] = useState(() => {
    const saved = localStorage.getItem('coffee_shop_filters');
    return saved ? JSON.parse(saved) : {
      category: 'All',
      minPrice: 0,
      maxPrice: 50000000,
      minRating: 0,
      selectedTags: [] as string[]
    };
  });

  useEffect(() => {
    localStorage.setItem('coffee_shop_filters', JSON.stringify(filters));
  }, [filters]);

  const resetFilters = () => {
    const defaults = {
      category: 'All',
      minPrice: 0,
      maxPrice: 50000000,
      minRating: 0,
      selectedTags: []
    };
    setFilters(defaults);
    localStorage.removeItem('coffee_shop_filters');
  };

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const querySnapshot = await getDocs(collection(db, 'products'));
        const productsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        
        if (productsData.length === 0) {
           setProducts(SAMPLE_PRODUCTS.map((p, i) => ({ id: `p-${i}`, ...p } as Product)));
        } else {
           setProducts(productsData);
        }
      } catch (err) {
        setProducts(SAMPLE_PRODUCTS.map((p, i) => ({ id: `p-${i}`, ...p } as Product)));
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    products.forEach(p => p.tags?.forEach(t => tags.add(t)));
    return Array.from(tags);
  }, [products]);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                         p.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = filters.category === 'All' || p.category === filters.category;
    const matchesPrice = p.price >= filters.minPrice && p.price <= filters.maxPrice;
    const matchesRating = p.rating >= filters.minRating;
    const matchesTags = filters.selectedTags.length === 0 || 
                       filters.selectedTags.some(t => p.tags.includes(t));
    
    return matchesSearch && matchesCategory && matchesPrice && matchesRating && matchesTags;
  });

  const searchSuggestions = useMemo(() => {
    if (!search || search.length < 2) return [];
    return products
      .filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
      .slice(0, 5);
  }, [search, products]);

  const toggleTag = (tag: string) => {
    setFilters(prev => ({
      ...prev,
      selectedTags: prev.selectedTags.includes(tag)
        ? prev.selectedTags.filter(t => t !== tag)
        : [...prev.selectedTags, tag]
    }));
  };

  return (
    <div className="pt-32 pb-32 md:pt-56 md:pb-56 grainy-overlay min-h-screen bg-cream">
      <div className="mesh-gradient absolute inset-0 opacity-20 pointer-events-none" />
      
      <div className="page-container relative z-10">
        {/* Header & Search */}
        <div className="flex flex-col lg:flex-row items-end justify-between gap-12 md:gap-16 mb-20 md:mb-40">
          <div className="space-y-8 md:space-y-12">
            <span className="stat-label text-caramel">Sensory Catalog / 2026</span>
            <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-[10rem] font-display font-black text-espresso tracking-tightest leading-[0.8] sm:leading-[0.75] italic uppercase">The <br/><span className="not-italic text-caramel-gold">Archive.</span></h1>
            <p className="text-lg md:text-2xl text-coffee-500 font-serif italic max-w-xl leading-relaxed">"Each harvesting cycle is audited for isotopic sensory alignment. Explore the world's most exclusive allocations."</p>
          </div>

          <div className="relative w-full lg:w-[600px] group">
            <div className="relative overflow-hidden rounded-full shadow-premium border border-white/60 bg-white/40 backdrop-blur-3xl">
              <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-caramel-gold group-focus-within:scale-125 transition-transform duration-700 z-20" size={24} />
              <input 
                type="text" 
                placeholder="SEARCH_THE_ARCHIVE..." 
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                className="w-full pl-16 md:pl-22 pr-8 md:pr-10 py-6 md:py-9 bg-transparent focus:bg-white transition-all text-[10px] md:text-xs font-black uppercase tracking-[0.3em] md:tracking-[0.5em] placeholder:text-coffee-200 outline-none italic"
              />
            </div>

            <AnimatePresence>
              {showSuggestions && search.length >= 2 && (
                <>
                  <motion.div 
                     initial={{ opacity: 0, y: 15, scale: 0.95 }}
                     animate={{ opacity: 1, y: 0, scale: 1 }}
                     exit={{ opacity: 0, y: 15, scale: 0.95 }}
                     className="absolute top-full left-0 right-0 mt-8 bg-white/80 backdrop-blur-3xl border border-white/60 rounded-[4rem] shadow-premium-xl z-50 overflow-hidden"
                  >
                    <div className="p-8 bg-mocha/5 border-b border-white/40">
                      <span className="text-[10px] font-black text-caramel uppercase tracking-[0.8em] italic">Neural Matches Detected</span>
                    </div>
                    <div className="p-6 max-h-[500px] overflow-y-auto custom-scrollbar">
                      {searchSuggestions.length > 0 ? (
                        searchSuggestions.map(p => (
                          <Link 
                            key={p.id} 
                            to={`/product/${p.id}`}
                            onClick={() => setShowSuggestions(false)}
                            className="flex items-center gap-8 p-6 hover:bg-espresso hover:text-white rounded-[3rem] transition-all duration-700 group mt-2 first:mt-0"
                          >
                            <img src={p.images[0]} className="w-20 h-20 rounded-[1.5rem] object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 border border-white/40" referrerPolicy="no-referrer" />
                            <div>
                              <p className="text-2xl font-display font-black tracking-tight italic uppercase">{p.name}</p>
                              <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40 group-hover:opacity-100 italic transition-all">{p.category}</p>
                            </div>
                          </Link>
                        ))
                      ) : (
                        <p className="p-12 text-sm text-coffee-400 italic text-center font-serif">"Null matches in sensory database."</p>
                      )}
                    </div>
                  </motion.div>
                  <div className="fixed inset-0 z-40" onClick={() => setShowSuggestions(false)} />
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-16 md:gap-32">
          {/* Sidebar Filters */}
          <div className="w-full lg:w-96 space-y-12 md:space-y-20 lg:sticky lg:top-40 h-fit">
            <div className="space-y-8">
              <h3 className="text-[10px] sm:text-xs font-black text-coffee-300 uppercase tracking-[0.3em] md:tracking-[0.4em] flex items-center gap-4 md:gap-6 italic border-b border-coffee-50 pb-6">
                 <Compass size={18} strokeWidth={1.5} className="text-caramel" /> Filter Protocol
              </h3>
              <div className="flex flex-wrap lg:flex-col gap-3 md:gap-4">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setFilters({ ...filters, category: cat })}
                    className={cn(
                      "px-5 py-4 md:px-8 md:py-5 text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] md:tracking-[0.4em] text-left rounded-full transition-all relative overflow-hidden group italic",
                      filters.category === cat 
                          ? "bg-espresso text-white shadow-premium" 
                          : "text-coffee-400 hover:bg-white hover:text-espresso border border-coffee-50/50"
                    )}
                  >
                    <span className="relative z-10">{cat}</span>
                    {filters.category === cat && (
                      <motion.div layoutId="filter-active" className="absolute inset-0 bg-espresso z-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-12 p-8 md:p-12 bg-white/40 backdrop-blur-2xl rounded-[3rem] md:rounded-[4rem] border border-white/60 shadow-premium group">
              <h3 className="text-[10px] sm:text-xs font-black text-coffee-300 uppercase tracking-[0.3em] md:tracking-[0.4em] flex items-center gap-4 md:gap-6 italic">
                 <DollarSign size={20} strokeWidth={1.5} className="text-caramel" /> Pricing Cap
              </h3>
              <div className="space-y-10 px-4 pb-4">
                <input 
                  type="range" 
                  min="0" 
                  max="50000000" 
                  step="500000"
                  value={filters.maxPrice}
                  onChange={e => setFilters({ ...filters, maxPrice: parseInt(e.target.value) })}
                  className="w-full appearance-none h-2 bg-coffee-50 rounded-full accent-caramel-gold cursor-pointer" 
                />
                <div className="flex flex-col gap-3">
                  <span className="text-[9px] font-black text-coffee-200 uppercase tracking-[0.5em] italic">Max Threshold</span>
                  <span className="text-3xl font-display font-black text-espresso tracking-tightest italic">LBP {filters.maxPrice.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="space-y-10">
              <h3 className="text-[10px] sm:text-xs font-black text-coffee-300 uppercase tracking-[0.3em] md:tracking-[0.4em] flex items-center gap-4 md:gap-6 italic">
                 <Star size={20} strokeWidth={1.5} className="text-caramel" /> Quality Grade
              </h3>
              <div className="flex flex-wrap gap-3 md:gap-4">
                {[5, 4, 3, 2, 1].map(r => (
                  <button
                    key={r}
                    onClick={() => setFilters({ ...filters, minRating: filters.minRating === r ? 0 : r })}
                    className={cn(
                      "w-12 h-12 md:w-16 md:h-16 rounded-full border transition-all duration-700 flex items-center justify-center gap-1 md:gap-2 font-black shadow-premium active:scale-90 italic",
                      filters.minRating === r ? "bg-espresso border-espresso text-white" : "bg-white border-white/60 text-coffee-300 hover:border-caramel-gold hover:text-espresso"
                    )}
                  >
                    {r}<Star size={14} className={cn(filters.minRating === r ? "fill-caramel-gold text-caramel-gold" : "text-coffee-100")} />
                  </button>
                ))}
              </div>
            </div>

            <button 
              onClick={resetFilters}
              className="w-full py-6 text-[10px] font-black uppercase tracking-[0.6em] text-coffee-300 hover:text-red-500 border border-coffee-50 border-dashed rounded-full flex items-center justify-center gap-6 transition-all hover:bg-white italic shadow-premium active:scale-95 group"
            >
              <X size={18} className="group-hover:rotate-90 transition-transform duration-700" /> Reset Protocols
            </button>
          </div>

          {/* Product Grid */}
          <div className="flex-grow">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                {[1,2,3,4,5,6].map(i => (
                  <div key={i} className="aspect-[4/5] bg-white backdrop-blur-xl rounded-[4rem] animate-pulse relative overflow-hidden border border-white/60">
                      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-coffee-50/20 to-transparent" />
                  </div>
                ))}
              </div>
            ) : filteredProducts.length > 0 ? (
              <motion.div 
                 layout
                 className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12"
              >
                <AnimatePresence mode="popLayout">
                  {filteredProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </AnimatePresence>
              </motion.div>
            ) : (
              <div className="py-32 md:py-72 text-center bg-white/40 backdrop-blur-3xl rounded-[4rem] md:rounded-[6rem] border border-dashed border-coffee-100 shadow-premium space-y-12 md:space-y-16">
                 <div className="w-24 h-24 md:w-40 md:h-40 bg-white rounded-full flex items-center justify-center mx-auto text-coffee-100 shadow-premium-xl border border-white/60">
                    <Search strokeWidth={1} className="text-caramel opacity-20 w-8 h-8 md:w-16 md:h-16" />
                 </div>
                 <div className="space-y-8 md:space-y-10 px-6">
                   <h3 className="text-4xl md:text-6xl font-display font-black text-espresso italic tracking-tightest uppercase leading-none">No Allocations Found</h3>
                   <p className="text-lg md:text-2xl text-coffee-400 max-w-sm mx-auto font-serif italic leading-relaxed">"Re-evaluate your search parameters to find authorized archives."</p>
                 </div>
                 <button 
                  onClick={resetFilters}
                  className="btn-premium px-12 md:px-14 py-5 md:py-6 text-[10px] md:text-[11px] italic mx-auto"
                 >
                   INITIALIZE FULL-ACCESS
                 </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
