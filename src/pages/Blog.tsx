import ImageWithFallback from '../components/common/ImageWithFallback';
import { ArrowRight, Clock, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import SEO from '../components/common/SEO';

const POSTS = [
  { id: 1, title: 'The Art of the Lebanese Morning Ritual', excerpt: 'Discover how coffee shapes the culture of Beirut and beyond.', category: 'Culture', date: 'May 12, 2026', image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&auto=format&fit=crop&q=80' },
  { id: 2, title: 'Perfecting Your V60 Technique', excerpt: 'A masterclass in slow-drip extraction for the home barista.', category: 'Guide', date: 'May 10, 2026', image: 'https://images.unsplash.com/photo-1544787210-2213d84ad964?w=800&auto=format&fit=crop&q=80' },
  { id: 3, title: 'Sourcing Sustainably in Ethiopia', excerpt: 'Our journey to the birthplace of coffee and the farmers we support.', category: 'Origin', date: 'May 05, 2026', image: 'https://images.unsplash.com/photo-1524350300060-d39f6647d0ee?w=800&auto=format&fit=crop&q=80' }
];

export default function Blog() {
  return (
    <div className="pt-16 sm:pt-24 md:pt-32 pb-12 sm:pb-16 md:pb-24 min-h-screen relative overflow-hidden bg-cream">
      <SEO title="Blog" description="Read stories, guides, and insights from the heart of CoffeeCraze." />
      <div className="mesh-gradient absolute inset-0 opacity-20 pointer-events-none" />
      
      <div className="page-container relative z-10">
        <div className="text-center space-y-4 mb-16 md:mb-20">
          <span className="stat-label text-caramel">Roastery Notes</span>
          <h1 className="text-fluid-heading font-display font-black text-coffee-950 tracking-tightest italic">Roastery <span className="not-italic text-coffee-400">Journal.</span></h1>
          <p className="text-fluid-body text-coffee-400 font-medium italic max-w-lg mx-auto leading-relaxed">"Stories, guides, and insights from the heart of CoffeeCraze."</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10 xl:gap-12">
          {POSTS.map((post, i) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: i * 0.15 }}
            >
              <Link to={`/blog/${post.id}`} className="block group">
                <article className="bg-white border border-coffee-100 rounded-[3rem] overflow-hidden hover:shadow-2xl hover:shadow-coffee-950/10 transition-all duration-700 h-full">
                  <div className="aspect-video overflow-hidden">
                    <ImageWithFallback src={post.image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  </div>
                  <div className="p-6 sm:p-8 space-y-5 sm:space-y-6">
                    <div className="flex items-center gap-4 text-fluid-small font-bold uppercase tracking-widest text-coffee-400">
                      <span className="bg-coffee-50 px-3 py-1 rounded-full text-coffee-600">{post.category}</span>
                      <span className="flex items-center gap-1"><Clock size={12} /> {post.date}</span>
                    </div>
                    <h2 className="text-fluid-title font-display font-bold text-coffee-950 group-hover:text-coffee-600 transition-colors leading-tight">{post.title}</h2>
                    <p className="text-fluid-body text-coffee-500 leading-relaxed line-clamp-3">{post.excerpt}</p>
                    <div className="flex items-center gap-2 text-fluid-small font-bold text-coffee-950 group-hover:gap-4 transition-all">
                      Read Story <ArrowRight size={16} />
                    </div>
                  </div>
                </article>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
