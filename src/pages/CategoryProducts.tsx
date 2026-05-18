import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ProductService } from '../services/firestore';
import { Product } from '../types';
import ProductCard from '../components/shop/ProductCard';
import { ChevronLeft, LayoutGrid } from 'lucide-react';

export default function CategoryProducts() {
  const { category } = useParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (category) {
      ProductService.getByCategory(category).then(data => {
        setProducts(data);
        setLoading(false);
      });
    }
  }, [category]);

  return (
    <div className="pt-16 sm:pt-24 md:pt-32 pb-12 sm:pb-16 md:pb-24 min-h-screen relative overflow-hidden bg-cream">
      <div className="mesh-gradient absolute inset-0 opacity-20 pointer-events-none" />
      
      <div className="page-container relative z-10">
        <div className="space-y-4 mb-12">
          <Link to="/shop" className="inline-flex items-center gap-2 text-coffee-400 hover:text-coffee-950 transition-colors text-fluid-small font-medium group">
            <ChevronLeft size={16} className="group-hover:-translate-x-2 transition-transform duration-500" /> All Collections
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-10 sm:w-12 h-10 sm:h-12 bg-coffee-50 text-coffee-500 rounded-xl flex items-center justify-center shadow-premium">
              <LayoutGrid size={20} />
            </div>
            <h1 className="text-fluid-heading font-display font-black text-coffee-950 capitalize italic tracking-tightest">{category}<span className="not-italic text-coffee-400">.</span></h1>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="aspect-[4/5] bg-white animate-pulse rounded-[3rem] border border-espresso/5 shadow-inner" />
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="py-16 sm:py-20 md:py-24 text-center space-y-8">
            <p className="text-fluid-body text-coffee-400 italic">No rituals found in this category yet.</p>
            <Link to="/shop" className="btn-premium px-8 sm:px-10 py-4 sm:py-5 inline-flex">
              View All Rituals
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
