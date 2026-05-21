import { useState, useEffect, useMemo } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Product } from '../types';
import ProductCard from '../components/shop/ProductCard';
import ImageWithFallback from '../components/common/ImageWithFallback';
import { Search, X, Star, DollarSign, Compass, ArrowRight, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import SEO from '../components/common/SEO';

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
        setProducts(productsData);
      } catch (err) {
        console.error('Error fetching products:', err);
        toast.error('Failed to load product archive. Please refresh the page.');
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
    <div className="pt-20 pb-20 md:pt-40 md:pb-56 grainy-overlay min-h-screen bg-cream">
      <SEO title="Shop" description="Browse our curated collection of premium coffee beans, capsules, machines, and accessories." />
      <div className="mesh-gradient absolute inset-0 opacity-20 pointer-events-none" />
      
      <div className="page-container relative z-10">
        {/* Header & Search */}
        <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-8 md:gap-16 mb-12 md:mb-40">
          <div className="space-y-8 md:space-y-12">
            <span className="stat-label text-caramel">Sensory Catalog 2026</span>
            <h1 className="text-fluid-hero font-display font-bold text-espresso tracking-tight leading-[1.1] uppercase">The <span className="text-caramel-gold">Archive.</span></h1>
            <p className="text-base sm:text-lg text-coffee-500 max-w-xl leading-relaxed">Each harvesting cycle is audited for isotopic sensory alignment. Explore the world's most exclusive allocations.</p>
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
                className="w-full pl-16 md:pl-20 pr-6 md:pr-10 py-4 md:py-6 bg-transparent focus:bg-white transition-all text-xs sm:text-sm font-medium uppercase tracking-wider placeholder:text-coffee-300 outline-none"
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
                            className="flex items-center gap-4 md:gap-8 p-6 hover:bg-espresso hover:text-white rounded-[3rem] transition-all duration-700 group mt-2 first:mt-0"
                          >
                            <ImageWithFallback src={p.images[0]} alt={p.name} className="w-16 h-16 md:w-20 md:h-20 rounded-[1.5rem] object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 border border-white/40" referrerPolicy="no-referrer" />
                            <div>
                              <p className="text-fluid-title font-display font-black tracking-tight italic uppercase">{p.name}</p>
                              <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40 group-hover:opacity-100 italic transition-all">{p.category}</p>
                            </div>
                          </Link>
                        ))
                      ) : (
                        <p className="p-8 md:p-12 text-sm text-coffee-400 italic text-center font-serif">"Null matches in sensory database."</p>
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
          <div className="w-full lg:w-96 space-y-8 md:space-y-20 lg:sticky lg:top-40 h-fit">
            <div className="space-y-8">
              <h3 className="text-xs font-semibold text-coffee-400 uppercase tracking-wider flex items-center gap-3 border-b border-coffee-50 pb-4">
                 <Compass size={16} strokeWidth={1.5} className="text-caramel" /> Filter
              </h3>
              <div className="flex flex-wrap lg:flex-col gap-2 md:gap-4">
                {CATEGORIES.map(cat => (
                  <button
                    type="button"
                    key={cat}
                    onClick={() => setFilters({ ...filters, category: cat })}
                    className={cn(
                      "px-4 py-3 md:px-6 md:py-3.5 text-xs font-semibold uppercase tracking-wide text-left rounded-full transition-all relative overflow-hidden",
                      filters.category === cat 
                          ? "bg-espresso text-white shadow-premium" 
                          : "text-coffee-500 hover:bg-white hover:text-espresso border border-coffee-50/50"
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

            <div className="space-y-6 p-5 sm:p-6 bg-white/60 backdrop-blur-2xl rounded-2xl border border-white/60 shadow-premium">
              <h3 className="text-xs font-semibold text-coffee-400 uppercase tracking-wider flex items-center gap-3">
                 <DollarSign size={16} strokeWidth={1.5} className="text-caramel" /> Price
              </h3>
              <div className="space-y-4 px-2 pb-2">
                <input 
                  type="range" 
                  min="0" 
                  max="50000000" 
                  step="500000"
                  value={filters.maxPrice}
                  onChange={e => setFilters({ ...filters, maxPrice: parseInt(e.target.value) })}
                  className="w-full appearance-none h-1.5 bg-coffee-100 rounded-full accent-caramel-gold cursor-pointer" 
                />
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-medium text-coffee-400 tracking-wide">Maximum</span>
                  <span className="text-lg font-display font-bold text-espresso tracking-tight">LBP {filters.maxPrice.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="space-y-10">
              <h3 className="text-xs font-semibold text-coffee-400 uppercase tracking-wider flex items-center gap-3">
                 <Star size={16} strokeWidth={1.5} className="text-caramel" /> Minimum Rating
              </h3>
              <div className="flex flex-wrap gap-2">
                {[5, 4, 3, 2, 1].map(r => (
                  <button
                    type="button"
                    key={r}
                    onClick={() => setFilters({ ...filters, minRating: filters.minRating === r ? 0 : r })}
                    className={cn(
                      "w-10 h-10 rounded-full border transition-all duration-400 flex items-center justify-center gap-1 font-semibold shadow-premium active:scale-90",
                      filters.minRating === r ? "bg-espresso border-espresso text-white" : "bg-white border-white/60 text-coffee-400 hover:border-caramel-gold hover:text-espresso"
                    )}
                  >
                    {r}<Star size={12} className={cn(filters.minRating === r ? "fill-caramel-gold text-caramel-gold" : "text-coffee-200")} />
                  </button>
                ))}
              </div>
            </div>

            <button 
              type="button"
              onClick={resetFilters}
              className="w-full py-3 text-xs font-medium tracking-wide text-coffee-400 hover:text-red-500 border border-coffee-50 border-dashed rounded-full flex items-center justify-center gap-3 transition-all hover:bg-white shadow-premium active:scale-95 group"
            >
              <X size={16} className="group-hover:rotate-90 transition-transform duration-500" /> Reset Filters
            </button>
          </div>

          {/* Product Grid */}
          <div className="flex-grow">
            {loading ? (
              <div className="grid-responsive-wide">
                {[1,2,3,4,5,6].map(i => (
                  <div key={i} className="aspect-[4/5] bg-white backdrop-blur-xl rounded-[4rem] animate-pulse relative overflow-hidden border border-white/60">
                      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-coffee-50/20 to-transparent" />
                  </div>
                ))}
              </div>
            ) : filteredProducts.length > 0 ? (
              <motion.div 
                 layout
                 className="grid-responsive-wide"
              >
                <AnimatePresence mode="popLayout">
                  {filteredProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </AnimatePresence>
              </motion.div>
            ) : (
              <div className="py-16 lg:py-24 text-center bg-white/60 backdrop-blur-3xl rounded-2xl lg:rounded-3xl border border-dashed border-coffee-100 shadow-premium space-y-6">
                 <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-full flex items-center justify-center mx-auto text-coffee-200 shadow-premium border border-white/60">
                    <Search strokeWidth={1.5} size={24} />
                 </div>
                 <div className="space-y-3 px-6">
                   <h3 className="text-2xl sm:text-3xl font-display font-bold text-espresso tracking-tight">No Products Found</h3>
                   <p className="text-sm sm:text-base text-coffee-500 max-w-sm mx-auto leading-relaxed">Try adjusting your filters or search terms to discover more products.</p>
                 </div>
                 <button 
                  type="button"
                  onClick={resetFilters}
                  className="btn-premium text-sm mx-auto"
                 >
                   Reset All Filters
                 </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
