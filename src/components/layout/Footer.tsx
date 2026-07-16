import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Twitter, Facebook, MapPin } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'site_settings', 'app'));
        if (docSnap.exists() && docSnap.data().logoUrl) {
          setLogoUrl(docSnap.data().logoUrl);
        }
      } catch {
        // Silently fall back to static logo
      }
    };
    fetchSettings();
  }, []);

  return (
    <footer className="bg-espresso text-white" style={{ padding: '48px 0' }}>
      <div className="page-container">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-10 lg:gap-16 items-start">
          <div className="space-y-4 max-w-sm">
            <Link to="/" className="inline-flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl overflow-hidden border border-white/10 bg-white/10 shadow-sm">
                <img src={logoUrl || '/logo.png'} alt="" className="w-full h-full object-cover" />
              </div>
              <span className="text-small font-semibold tracking-wide text-white">CoffeeCraze</span>
            </Link>
            <p className="text-small text-white/80 leading-relaxed">
              Curated coffee rituals, premium beans, accessories, and guided recommendations delivered with luxury and ease.
            </p>
            <div className="text-small text-white/70 space-y-1">
              <div>coffeecraze@nilelink.app</div>
              <div>+961 71 972 495</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-2">
            <div>
              <h4 className="text-caption text-white/70 mb-4">Shop</h4>
              <div className="space-y-2.5">
                <Link to="/shop" className="block text-small text-white/80 hover:text-white transition-colors">Collections</Link>
                <Link to="/subscriptions" className="block text-small text-white/80 hover:text-white transition-colors">Subscriptions</Link>
                <Link to="/ai-barista" className="block text-small text-white/80 hover:text-white transition-colors">AI Barista</Link>
              </div>
            </div>
            <div>
              <h4 className="text-caption text-white/70 mb-4">Support</h4>
              <div className="space-y-2.5">
                <Link to="/faq" className="block text-small text-white/80 hover:text-white transition-colors">FAQ</Link>
                <Link to="/contact" className="block text-small text-white/80 hover:text-white transition-colors">Contact</Link>
                <Link to="/about" className="block text-small text-white/80 hover:text-white transition-colors">About</Link>
              </div>
            </div>
            <div className="col-span-full flex items-center gap-3 mt-2">
              <a href="https://www.instagram.com/coffeecraze_lb" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="w-9 h-9 rounded-full flex items-center justify-center bg-white/10 text-white/80 hover:bg-white/20 hover:text-white transition-all">
                <Instagram size={16} />
              </a>
              <a href="https://x.com/CoffeeCrazeLB" target="_blank" rel="noopener noreferrer" aria-label="X (Twitter)" className="w-9 h-9 rounded-full flex items-center justify-center bg-white/10 text-white/80 hover:bg-white/20 hover:text-white transition-all">
                <Twitter size={16} />
              </a>
              <a href="https://www.facebook.com/CoffeeCrazeCC/" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="w-9 h-9 rounded-full flex items-center justify-center bg-white/10 text-white/80 hover:bg-white/20 hover:text-white transition-all">
                <Facebook size={16} />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-small text-white/70">
          <span>&copy; {currentYear} CoffeeCraze. All rights reserved.</span>
          <div className="flex items-center gap-2">
            <MapPin size={14} />
            Beirut, Lebanon
          </div>
        </div>
      </div>
    </footer>
  );
}
