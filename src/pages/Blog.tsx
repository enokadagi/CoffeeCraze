import ImageWithFallback from '../components/common/ImageWithFallback';
import { ArrowRight, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import SEO from '../components/common/SEO';

export default function Blog() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPosts() {
      try {
        const q = query(
          collection(db, 'blog_posts'),
          where('status', '==', 'published')
        );
        const snap = await getDocs(q);
        const fetched = snap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as any[];
        // Sort by date or createdAt desc if available
        fetched.sort((a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime());
        setPosts(fetched);
      } catch (err) {
        console.error('Error fetching blog posts:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchPosts();
  }, []);

  return (
    <div className="pt-16 sm:pt-24 md:pt-32 pb-12 sm:pb-16 md:pb-24 min-h-screen relative overflow-hidden bg-cream">
      <SEO title="Blog" description="Read stories, guides, and insights from the heart of CoffeeCraze." />
      <div className="mesh-gradient absolute inset-0 opacity-20 pointer-events-none" />
      
      <div className="page-container relative z-10">
        <div className="text-center space-y-4 mb-16 md:mb-20">
          <span className="text-caption text-caramel">Roastery Notes</span>
          <h1 className="text-h1 font-display font-black text-text tracking-tightest italic">Roastery <span className="not-italic text-text-muted">Journal.</span></h1>
          <p className="text-body text-text-secondary font-medium italic max-w-lg mx-auto leading-relaxed">"Stories, guides, and insights from the heart of CoffeeCraze."</p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <div className="w-8 h-8 border-2 border-caramel border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-text-secondary font-medium">Grinding fresh articles...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-lg text-text-secondary italic font-serif">No journal entries found. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10 xl:gap-12">
            {posts.map((post, i) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: i * 0.15 }}
                className="h-full"
              >
                <Link to={`/blog/${post.id}`} className="block group h-full">
                  <article className="bg-white border border-border rounded-[3rem] overflow-hidden hover:shadow-2xl hover:shadow-coffee-950/10 transition-all duration-700 flex flex-col h-full">
                    <div className="aspect-video overflow-hidden bg-cream">
                      <ImageWithFallback src={post.image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    </div>
                    <div className="p-6 sm:p-8 flex flex-col flex-grow space-y-5 sm:space-y-6">
                      <div className="flex items-center gap-4 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-text-muted">
                        <span className="bg-cream px-3 py-1 rounded-full text-text-secondary">{post.category}</span>
                        <span className="flex items-center gap-1"><Clock size={12} /> {post.date}</span>
                      </div>
                      <h2 className="text-lg sm:text-xl font-display font-bold text-text group-hover:text-text-secondary transition-colors leading-tight">{post.title}</h2>
                      <p className="text-sm sm:text-base text-text-secondary leading-relaxed line-clamp-3 flex-grow">{post.excerpt}</p>
                      <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-text group-hover:gap-4 transition-all pt-2">
                        Read Story <ArrowRight size={16} />
                      </div>
                    </div>
                  </article>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
