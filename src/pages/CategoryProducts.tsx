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
    <div className="pt-32 pb-24 px-6 max-w-7xl mx-auto">
      <div className="space-y-4 mb-12">
        <Link to="/shop" className="flex items-center gap-2 text-coffee-400 hover:text-coffee-950 transition-colors text-sm font-medium">
          <ChevronLeft size={16} /> All Collections
        </Link>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-coffee-50 text-coffee-500 rounded-xl flex items-center justify-center">
            <LayoutGrid size={24} />
          </div>
          <h1 className="text-4xl font-display font-bold text-coffee-950 capitalize">{category}</h1>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map(i => (
            <div key={i} className="aspect-[4/5] bg-coffee-100 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="py-24 text-center space-y-6">
          <p className="text-coffee-400">No rituals found in this category yet.</p>
          <Link to="/shop" className="px-8 py-3 bg-coffee-950 text-white rounded-full font-bold inline-block">
            View All Rituals
          </Link>
        </div>
      )}
    </div>
  );
}
