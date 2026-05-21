import { Link } from 'react-router-dom';
import { Coffee, Instagram, Twitter, Facebook, Mail, Phone, MapPin, Globe, ArrowRight } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = [
    {
      title: 'The Archive',
      links: [
        { label: 'Coffee Beans', href: '/category/Coffee%20Beans' },
        { label: 'Sensory Vessels', href: '/shop' },
        { label: 'Precision Tools', href: '/shop' },
        { label: 'Gift Protocols', href: '/shop' }
      ]
    },
    {
      title: 'The Ritual',
      links: [
        { label: 'Subscription Sync', href: '/subscriptions' },
        { label: 'Curated Tiers', href: '/subscriptions' },
        { label: 'Office Supply', href: '/wholesale' },
        { label: 'Wholesale Gate', href: '/wholesale' }
      ]
    },
    {
      title: 'The Agency',
      links: [
        { label: 'Our Journal', href: '/blog' },
        { label: 'Beirut Origins', href: '/about' },
        { label: 'Coffee Quiz', href: '/coffee-quiz' },
        { label: 'AI Barista', href: '/ai-barista' }
      ]
    },
    {
      title: 'Support',
      links: [
        { label: 'FAQ', href: '/faq' },
        { label: 'Contact', href: '/contact' },
        { label: 'Privacy Terminal', href: '#' },
        { label: 'Security Protocol', href: '#' }
      ]
    }
  ];

  return (
    <footer className="bg-espresso/95 text-cream pt-12 sm:pt-16 lg:pt-20 pb-8 sm:pb-10 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(at_bottom_right,rgba(210,218,209,0.16),transparent_72%)] opacity-40" />
      <div className="page-container relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 sm:gap-10 lg:gap-14 pb-10 sm:pb-14 border-b border-white/10">
          {/* Brand Column */}
          <div className="lg:col-span-4 space-y-5 sm:space-y-6">
            <Link to="/" className="flex items-center gap-3 sm:gap-4 group w-fit">
              <div className="w-10 h-10 sm:w-12 bg-cream/10 text-cream rounded-2xl flex items-center justify-center font-display font-black text-base sm:text-lg shadow-premium transition-all duration-500 group-hover:-rotate-6 border border-cream/15">
                CC
              </div>
              <div className="text-[10px] sm:text-[11px] font-semibold tracking-[0.35em] leading-none uppercase text-cream/80">
                COFFEE <span className="text-caramel">CRAZE</span>
              </div>
            </Link>
            <p className="text-sm sm:text-base text-cream/70 leading-relaxed max-w-sm">
              Architecting the morning ritual through archival harvests and sensory precision.
            </p>
            <div className="space-y-1 text-xs text-cream/60 tracking-wide">
               <a href="mailto:coffeecraze@nilelink.app" className="block hover:text-cream transition-colors">coffeecraze@nilelink.app</a>
               <a href="tel:+96171972495" className="block hover:text-cream transition-colors">+961 71 972 495</a>
            </div>
            <div className="flex gap-3 pt-2">
              {[Instagram, Twitter, Facebook].map((Icon, i) => (
                <a key={i} href="#" className="w-9 h-9 flex items-center justify-center bg-white/5 rounded-full text-cream/70 hover:text-cream hover:bg-white/10 transition-all duration-500 border border-white/10">
                  <Icon size={16} strokeWidth={1.5} />
                </a>
              ))}
            </div>
          </div>

          {/* Link Columns */}
          <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-8 sm:gap-10">
            {footerLinks.map((section) => (
              <div key={section.title} className="space-y-3 sm:space-y-4">
                <h4 className="text-[10px] sm:text-[11px] font-semibold text-cream uppercase tracking-[0.28em]">{section.title}</h4>
                <div className="flex flex-col gap-2">
                  {section.links.map((link) => (
                    <Link key={link.label} to={link.href} className="text-[11px] sm:text-sm text-cream/70 hover:text-cream transition-colors">
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-cream/60 tracking-wide">
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6">
            <p>© {currentYear} CoffeeCraze. All rights reserved.</p>
            <p className="flex items-center gap-2"><MapPin size={12} className="text-caramel opacity-80 shrink-0" /> Beirut, Lebanon</p>
          </div>
          <div className="flex items-center gap-4 opacity-70">
            <span className="flex items-center gap-2"><Globe size={12} className="text-caramel" /> 2026</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
