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
    <footer className="bg-espresso text-white pt-16 sm:pt-24 lg:pt-32 pb-12 sm:pb-16 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(at_bottom_right,rgba(195,146,78,0.1),transparent_70%)] opacity-30" />
      <div className="page-container relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 sm:gap-16 lg:gap-24 pb-16 sm:pb-20 lg:pb-24 border-b border-white/5">
          <div className="lg:col-span-4 space-y-6 sm:space-y-8 lg:space-y-10">
            <Link to="/" className="flex items-center gap-4 sm:gap-6 group w-fit">
              <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-white text-espresso rounded-[1rem] sm:rounded-[1.25rem] flex items-center justify-center font-display font-black text-lg sm:text-xl lg:text-2xl shadow-premium transition-all duration-1000 group-hover:rotate-12 group-hover:scale-110">
                CC
              </div>
              <div className="text-[10px] sm:text-[11px] lg:text-[12px] font-black tracking-[0.6em] sm:tracking-[0.8em] leading-none uppercase italic">
                COFFEE<span className="text-caramel">CRAZE</span>
              </div>
            </Link>
            <p className="text-sm sm:text-base lg:text-lg text-coffee-400 font-serif italic leading-relaxed max-w-sm">
              Architecting the morning ritual through archival harvests and sensory precision.
            </p>
            <div className="space-y-1 sm:space-y-2 pt-2 sm:pt-4 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-coffee-300 italic">
               <a href="mailto:coffeecraze@nilelink.app" className="block hover:text-caramel transition-colors">coffeecraze@nilelink.app</a>
               <a href="tel:+96171972495" className="block hover:text-caramel transition-colors">+961 71 972 495</a>
            </div>
            <div className="flex gap-4 sm:gap-6 pt-2 sm:pt-4">
              {[Instagram, Twitter, Facebook].map((Icon, i) => (
                <a key={i} href="#" className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 flex items-center justify-center bg-white/5 rounded-full text-coffee-400 hover:text-caramel hover:bg-white/10 transition-all duration-700 hover:translate-y-[-4px] group border border-white/5">
                  <Icon size={18} strokeWidth={1.5} />
                </a>
              ))}
            </div>
          </div>

          <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-8 sm:gap-12 lg:gap-16">
            {footerLinks.map((section) => (
              <div key={section.title} className="space-y-4 sm:space-y-6 lg:space-y-8">
                <h4 className="text-[10px] sm:text-[11px] font-black text-white uppercase tracking-[0.4em] sm:tracking-[0.5em] italic">{section.title}</h4>
                <div className="flex flex-col gap-2 sm:gap-3 lg:gap-4">
                  {section.links.map((link) => (
                    <Link key={link.label} to={link.href} className="text-[9px] sm:text-[10px] font-black text-coffee-500 uppercase tracking-[0.1em] sm:tracking-[0.2em] hover:text-caramel transition-colors italic whitespace-nowrap">
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 sm:mt-12 lg:mt-16 flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8 lg:gap-12 text-[8px] sm:text-[9px] lg:text-[10px] font-black uppercase tracking-[0.3em] sm:tracking-[0.4em] lg:tracking-[0.6em] text-coffee-700 italic">
          <div className="flex flex-col md:flex-row items-center gap-4 sm:gap-6 lg:gap-16">
            <p>© {currentYear} ARCHIVAL_CC. DESIGNED_BY_OVERSEER.</p>
            <p className="flex items-center gap-2 sm:gap-4"><MapPin size={12} className="text-caramel opacity-40 shrink-0" /> BEIRUT_V1.4_HUB</p>
          </div>
          <div className="flex items-center gap-6 sm:gap-10 opacity-60">
            <span className="flex items-center gap-2 sm:gap-3"><Globe size={12} className="text-caramel" /> SYNC_2026_UTC</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
