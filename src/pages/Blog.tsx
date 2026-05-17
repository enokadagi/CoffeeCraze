import { ArrowRight, Clock, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';

const POSTS = [
  { id: 1, title: 'The Art of the Lebanese Morning Ritual', excerpt: 'Discover how coffee shapes the culture of Beirut and beyond.', category: 'Culture', date: 'May 12, 2026', image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&auto=format&fit=crop&q=80' },
  { id: 2, title: 'Perfecting Your V60 Technique', excerpt: 'A masterclass in slow-drip extraction for the home barista.', category: 'Guide', date: 'May 10, 2026', image: 'https://images.unsplash.com/photo-1544787210-2213d84ad964?w=800&auto=format&fit=crop&q=80' },
  { id: 3, title: 'Sourcing Sustainably in Ethiopia', excerpt: 'Our journey to the birthplace of coffee and the farmers we support.', category: 'Origin', date: 'May 05, 2026', image: 'https://images.unsplash.com/photo-1524350300060-d39f6647d0ee?w=800&auto=format&fit=crop&q=80' }
];

export default function Blog() {
  return (
    <div className="pt-32 pb-24 px-6 max-w-7xl mx-auto">
      <div className="text-center space-y-4 mb-20">
        <h1 className="text-5xl font-display font-bold text-coffee-950">Roastery Journal</h1>
        <p className="text-coffee-500">Stories, guides, and insights from the heart of CoffeeCraze.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
        {POSTS.map(post => (
          <article key={post.id} className="group bg-white border border-coffee-100 rounded-[3rem] overflow-hidden hover:shadow-2xl hover:shadow-coffee-950/5 transition-all">
            <div className="aspect-video overflow-hidden">
              <img src={post.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            </div>
            <div className="p-8 space-y-6">
              <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-coffee-400">
                <span className="bg-coffee-50 px-3 py-1 rounded-full text-coffee-600">{post.category}</span>
                <span className="flex items-center gap-1"><Clock size={12} /> {post.date}</span>
              </div>
              <h2 className="text-2xl font-display font-bold text-coffee-950 group-hover:text-coffee-600 transition-colors leading-tight">{post.title}</h2>
              <p className="text-sm text-coffee-500 leading-relaxed line-clamp-3">{post.excerpt}</p>
              <button className="flex items-center gap-2 text-sm font-bold text-coffee-950 hover:gap-4 transition-all">
                Read Story <ArrowRight size={16} />
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
