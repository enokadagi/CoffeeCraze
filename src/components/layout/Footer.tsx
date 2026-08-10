import { Link } from 'react-router-dom';
import { Instagram, Twitter, Facebook, Linkedin, Youtube, MapPin } from 'lucide-react';
import { useSiteSettings } from '../../hooks/useSiteSettings';
import ImageWithFallback from '../common/ImageWithFallback';

interface FooterLink {
  label: string;
  url: string;
}

function parseFooterLinks(raw: string): FooterLink[] {
  try {
    const parsed = JSON.parse(raw || '[]');
    if (Array.isArray(parsed)) return parsed as FooterLink[];
  } catch {
    // fall back to defaults
  }
  return [
    { label: 'Collections', url: '/shop' },
    { label: 'Subscriptions', url: '/subscriptions' },
    { label: 'About', url: '/about' },
    { label: 'Blog', url: '/blog' },
    { label: 'FAQ', url: '/faq' },
    { label: 'Contact', url: '/contact' },
  ];
}

export default function Footer() {
  const settings = useSiteSettings();
  const links = parseFooterLinks(settings?.footerLinks || '');

  const socials = [
    { href: settings?.footerSocialInstagram, label: 'Instagram', Icon: Instagram },
    { href: settings?.footerSocialTwitter, label: 'X (Twitter)', Icon: Twitter },
    { href: settings?.footerSocialFacebook, label: 'Facebook', Icon: Facebook },
    { href: settings?.footerSocialLinkedin, label: 'LinkedIn', Icon: Linkedin },
    { href: settings?.footerSocialYoutube, label: 'YouTube', Icon: Youtube },
  ].filter(s => s.href);

  return (
    <footer className="bg-espresso text-white" style={{ padding: '48px 0' }}>
      <div className="page-container">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-10 lg:gap-16 items-start">
          <div className="space-y-4 max-w-sm">
            <Link to="/" className="inline-flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl overflow-hidden border border-white/10 bg-white/10 shadow-sm">
                <ImageWithFallback src={settings?.wordmarkUrl || settings?.logoUrl || '/logo.png'} alt="CoffeeCraze logo" className="w-full h-full object-cover" />
              </div>
              <span className="text-small font-semibold tracking-wide text-white">{settings?.siteName || 'CoffeeCraze'}</span>
            </Link>
            <p className="text-small text-white/80 leading-relaxed">
              {settings?.footerDescription || 'Curated coffee rituals, premium beans, accessories, and guided recommendations delivered with luxury and ease.'}
            </p>
            <div className="text-small text-white/70 space-y-1">
              <div>{settings?.footerEmail || 'coffeecraze@nilelink.app'}</div>
              <div>{settings?.footerPhone || '+961 71 972 495'}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-2">
            <div>
              <h4 className="text-caption text-white/70 mb-4">Shop</h4>
              <div className="space-y-2.5">
                {links.slice(0, 3).map(l => (
                  <Link key={l.url} to={l.url} className="block text-small text-white/80 hover:text-white transition-colors">
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-caption text-white/70 mb-4">Support</h4>
              <div className="space-y-2.5">
                {links.slice(3).map(l => (
                  <Link key={l.url} to={l.url} className="block text-small text-white/80 hover:text-white transition-colors">
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>
            {socials.length > 0 && (
              <div className="col-span-full flex items-center gap-3 mt-2">
                {socials.map(({ href, label, Icon }) => (
                  <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="w-9 h-9 rounded-full flex items-center justify-center bg-white/10 text-white/80 hover:bg-white/20 hover:text-white transition-all">
                    <Icon size={16} />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-small text-white/70">
          <span>{settings?.footerCopyright || `© ${new Date().getFullYear()} CoffeeCraze. All rights reserved.`}</span>
          <div className="flex items-center gap-2">
            <MapPin size={14} />
            Beirut, Lebanon
          </div>
        </div>
      </div>
    </footer>
  );
}

