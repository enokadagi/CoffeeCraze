import { useState, useEffect, useMemo } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Product } from '../types';
import ProductCard from '../components/shop/ProductCard';
import ImageWithFallback from '../components/common/ImageWithFallback';
import { Search, X, Star, DollarSign, Compass, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import SEO from '../components/common/SEO';

const CATEGORIES = ['All', 'Coffee Beans', 'Ground Coffee', 'Capsules', 'Drip Bags', 'Gift Boxes', 'Brewing Equipment', 'Espresso Machines', 'Accessories', 'Syrups', 'Merchandise'];

export default function Shop() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [filters, setFilters] = useState(() => {
    try {
      const saved = localStorage.getItem('coffee_shop_filters');
      return saved ? JSON.parse(saved) : {
        category: 'All', minPrice: 0, maxPrice: 50000000, minRating: 0, selectedTags: [] as string[]
      };
    } catch {
      return {
        category: 'All', minPrice: 0, maxPrice: 50000000, minRating: 0, selectedTags: [] as string[]
      };
    }
  });

  useEffect(() => {
    localStorage.setItem('coffee_shop_filters', JSON.stringify(filters));
  }, [filters]);

  const resetFilters = () => {
    setFilters({ category: 'All', minPrice: 0, maxPrice: 50000000, minRating: 0, selectedTags: [] });
    localStorage.removeItem('coffee_shop_filters');
  };

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const snap = await getDocs(collection(db, 'products'));
        setProducts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
      } catch (err) {
        console.error('Error fetching products:', err);
        toast.error('Failed to load products. Please refresh.');
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
    const matchesSearch = search.length === 0 || p.name.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = filters.category === 'All' || p.category === filters.category;
    const matchesPrice = p.price >= filters.minPrice && p.price <= filters.maxPrice;
    const matchesRating = p.rating >= filters.minRating;
    const matchesTags = filters.selectedTags.length === 0 || filters.selectedTags.some(t => p.tags.includes(t));
    return matchesSearch && matchesCategory && matchesPrice && matchesRating && matchesTags;
  });

  const searchSuggestions = useMemo(() => {
    if (!search || search.length < 2) return [];
    return products.filter(p => p.name.toLowerCase().includes(search.toLowerCase())).slice(0, 5);
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
    <div className="min-h-screen bg-cream" style={{ padding: '80px 0' }}>
      <SEO title="Shop" description="Browse our curated collection of premium coffee beans, capsules, machines, and accessories." />
      <div className="mesh-gradient fixed inset-0 opacity-10 pointer-events-none" />

      <div className="page-container relative z-10">
        <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-8 mb-12 md:mb-24">
          <div className="space-y-4">
            <span className="text-caption text-caramel">Curated Coffee Shop</span>
            <h1 className="text-display text-text">
              The <span className="text-caramel">Collection.</span>
            </h1>
            <p className="text-body text-text-secondary max-w-xl">
              Browse our premium beans, gear, and curated bundles made to elevate your daily coffee ritual.
            </p>
          </div>

          <div className="relative w-full lg:w-[500px]">
            <div className="relative overflow-hidden rounded-full border border-border bg-surface/80 backdrop-blur-md">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
              <label htmlFor="shop-search" className="sr-only">Search products</label>
              <input
                id="shop-search"
                type="text"
                placeholder="Search coffee, beans, and gear..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setShowSuggestions(true); }}
                onFocus={() => setShowSuggestions(true)}
                className="w-full pl-12 pr-5 py-3.5 bg-transparent text-small font-medium tracking-wide placeholder:text-text-muted outline-none"
              />
            </div>

            <AnimatePresence>
              {showSuggestions && search.length >= 2 && (
                <>
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-full left-0 right-0 mt-3 bg-surface border border-border rounded-xl shadow-md z-50 overflow-hidden"
                  >
                    <div className="p-4 border-b border-border">
                      <span className="text-caption text-caramel">Suggested Matches</span>
                    </div>
                    <div className="p-3 max-h-[400px] overflow-y-auto">
                      {searchSuggestions.length > 0 ? (
                        searchSuggestions.map(p => (
                          <Link
                            key={p.id}
                            to={`/product/${p.id}`}
                            onClick={() => setShowSuggestions(false)}
                            className="flex items-center gap-4 p-3 hover:bg-cream rounded-xl transition-all duration-normal"
                          >
                            <ImageWithFallback src={p.images?.[0] || ''} alt={p.name} className="w-14 h-14 rounded-lg object-cover border border-border" referrerPolicy="no-referrer" />
                            <div>
                              <p className="text-small font-semibold text-text">{p.name}</p>
                              <p className="text-caption text-text-muted">{p.category}</p>
                            </div>
                          </Link>
                        ))
                      ) : (
                        <p className="p-4 text-small text-text-muted text-center">No products match that search. Try a different keyword.</p>
                      )}
                    </div>
                  </motion.div>
                  <div className="fixed inset-0 z-40" onClick={() => setShowSuggestions(false)} />
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Mobile filter toggle */}
        <div className="flex lg:hidden items-center justify-between mb-6">
          <button
            type="button"
            onClick={() => setShowMobileFilters(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-surface border border-border rounded-full text-caption text-text shadow-sm"
          >
            <Compass size={14} className="text-caramel" /> Filters
          </button>
          <span className="text-caption text-text-muted">{filteredProducts.length} products</span>
        </div>

        {/* Mobile filter drawer */}
        <AnimatePresence>
          {showMobileFilters && (
            <>
              <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 lg:hidden" onClick={() => setShowMobileFilters(false)} />
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="fixed inset-y-0 right-0 w-[85vw] max-w-sm bg-surface z-50 lg:hidden overflow-y-auto p-6 shadow-lg"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-caption text-text-muted flex items-center gap-2">
                    <Compass size={14} className="text-caramel" /> Filters
                  </h3>
                  <button type="button" onClick={() => setShowMobileFilters(false)} aria-label="Close filters" className="w-8 h-8 rounded-full bg-cream border border-border flex items-center justify-center">
                    <X size={14} />
                  </button>
                </div>
                <div className="space-y-6">
                  <div role="group" aria-label="Category filter">
                    <h2 className="text-caption text-text-muted">Category</h2>
                    <div className="flex flex-wrap gap-2">
                      {CATEGORIES.map(cat => (
                        <button key={cat} type="button"
                          onClick={() => setFilters(prev => ({ ...prev, category: cat }))}
                          aria-label={`Filter by ${cat}`}
                          aria-pressed={filters.category === cat}
                          className={`px-3 py-2 text-caption font-semibold rounded-full transition-all ${
                            filters.category === cat ? 'bg-espresso text-white' : 'bg-cream text-text-muted border border-border'
                          }`}
                        >{cat}</button>
                      ))}
                    </div>
                  </div>
                  <div role="group" aria-label="Price filter">
                    <h2 className="text-caption text-text-muted">Max Price</h2>
                    <input type="range" min="0" max="50000000" step="500000" value={filters.maxPrice} aria-label={`Maximum price: LBP ${filters.maxPrice.toLocaleString()}`}
                      onChange={e => setFilters(prev => ({ ...prev, maxPrice: parseInt(e.target.value) }))}
                      className="w-full h-1.5 bg-border rounded-full accent-caramel cursor-pointer" />
                    <span className="text-small font-bold text-espresso">LBP {filters.maxPrice.toLocaleString()}</span>
                  </div>
                  <div role="group" aria-label="Rating filter">
                    <h2 className="text-caption text-text-muted">Rating</h2>
                    <div className="flex flex-wrap gap-2">
                      {[5, 4, 3, 2, 1].map(r => (
                        <button key={r} type="button"
                          onClick={() => setFilters(prev => ({ ...prev, minRating: prev.minRating === r ? 0 : r }))}
                          aria-label={`${r} star${r > 1 ? 's' : ''} minimum`}
                          aria-pressed={filters.minRating === r}
                          className={`w-9 h-9 rounded-full border flex items-center justify-center gap-1 text-caption font-semibold ${
                            filters.minRating === r ? 'bg-espresso border-espresso text-white' : 'bg-cream border-border text-text-muted'
                          }`}
                        >{r}<Star size={10} /></button>
                      ))}
                    </div>
                  </div>
                  <button type="button" onClick={() => { resetFilters(); setShowMobileFilters(false); }} aria-label="Reset all filters"
                    className="w-full py-3 text-caption font-bold text-text-muted hover:text-error border border-dashed border-border rounded-full flex items-center justify-center gap-2 transition-all">
                    <X size={14} /> Reset Filters
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-16">
          {/* Desktop Sidebar Filters */}
          <div className="hidden lg:block lg:w-72 space-y-8 lg:sticky lg:top-28 h-fit">
            <div className="space-y-6">
              <h2 className="sr-only">Filters</h2>
              <div className="text-caption text-text-muted flex items-center gap-3 border-b border-border pb-4">
                <Compass size={16} className="text-caramel" /> Filter
              </div>
              <div className="flex flex-wrap lg:flex-col gap-2">
                {CATEGORIES.map(cat => (
                  <button key={cat} type="button"
                    onClick={() => setFilters(prev => ({ ...prev, category: cat }))}
                    className={`px-4 py-2.5 text-caption font-semibold tracking-wide text-left rounded-full transition-all ${
                      filters.category === cat
                        ? 'bg-espresso text-white shadow-sm'
                        : 'text-text-muted hover:bg-surface hover:text-text border border-border'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4 p-5 bg-surface/60 backdrop-blur-md rounded-xl border border-border shadow-sm">
              <h2 className="text-caption text-text-muted flex items-center gap-3">
                <DollarSign size={16} className="text-caramel" /> Price
              </h2>
              <div className="space-y-3 px-1">
                <input type="range" min="0" max="50000000" step="500000" value={filters.maxPrice}
                  onChange={e => setFilters(prev => ({ ...prev, maxPrice: parseInt(e.target.value) }))}
                  className="w-full h-1.5 bg-border rounded-full accent-caramel cursor-pointer" />
                <div className="flex justify-between items-center">
                  <span className="text-caption text-text-muted">Maximum</span>
                  <span className="text-h4 text-espresso">LBP {filters.maxPrice.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-caption text-text-muted flex items-center gap-3">
                <Star size={16} className="text-caramel" /> Minimum Rating
              </h2>
              <div className="flex flex-wrap gap-2">
                {[5, 4, 3, 2, 1].map(r => (
                  <button key={r} type="button"
                    onClick={() => setFilters(prev => ({ ...prev, minRating: prev.minRating === r ? 0 : r }))}
                    className={`w-10 h-10 rounded-full border transition-all duration-normal flex items-center justify-center gap-1 font-semibold shadow-sm ${
                      filters.minRating === r ? 'bg-espresso border-espresso text-white' : 'bg-surface border-border text-text-muted hover:border-caramel hover:text-espresso'
                    }`}
                  >{r}<Star size={12} /></button>
                ))}
              </div>
            </div>

            <button type="button" onClick={resetFilters}
              className="w-full py-2.5 text-caption font-bold text-text-muted hover:text-error border border-dashed border-border rounded-full flex items-center justify-center gap-2 transition-all hover:bg-surface active:scale-95 group">
              <X size={14} className="group-hover:rotate-90 transition-transform duration-300" /> Reset Filters
            </button>
          </div>

          {/* Product Grid */}
          <div className="flex-grow">
            {loading ? (
              <div className="grid-responsive-wide">
                {[1,2,3,4,5,6].map(i => (
                  <div key={i} className="aspect-[4/5] bg-surface rounded-xl animate-pulse border border-border">
                    <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-border/20 to-transparent" />
                  </div>
                ))}
              </div>
            ) : filteredProducts.length > 0 ? (
              <motion.div layout className="grid-responsive-wide">
                <AnimatePresence mode="popLayout">
                  {filteredProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </AnimatePresence>
              </motion.div>
            ) : (
              <div className="py-16 text-center">
                <div className="w-16 h-16 bg-cream rounded-full flex items-center justify-center mx-auto mb-4 border border-border">
                  <Search size={24} className="text-text-muted" />
                </div>
                <h3 className="text-h3 text-text mb-2">No Products Found</h3>
                <p className="text-small text-text-muted mb-6">No products match your current filters. Try adjusting your search.</p>
                <button type="button" onClick={resetFilters} className="btn btn-outline">Reset Filters</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
