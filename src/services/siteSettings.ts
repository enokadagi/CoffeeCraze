import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { cleanUndefined } from '../lib/utils';

const SETTINGS_ID = 'app';

const LEGACY_PLACEHOLDERS = ['', '/logo.png', '/logo192.svg', '/logo512.svg'];

export function isBrandPlaceholder(url: string | undefined): boolean {
  return !url || LEGACY_PLACEHOLDERS.includes(url);
}

export interface SiteSettings {
  id: string;
  siteName: string;
  siteDescription: string;
  logoUrl: string;
  logoDarkUrl: string;
  logoCompactUrl: string;
  wordmarkUrl: string;
  iconMarkUrl: string;
  authLogoUrl: string;
  faviconUrl: string;
  appleTouchIconUrl: string;
  icon192Url: string;
  icon512Url: string;
  themeColor: string;
  backgroundColor: string;
  ogImageUrl: string;
  socialImageUrl: string;
  updatedAt: string;
  // Business parameters
  exchangeRate: number;               // 1 USD = N LBP (default 89500)
  deliveryFeeLbp: number;             // flat delivery fee in LBP (default 25000)
  freeDeliveryThresholdLbp: number;   // cart total above which delivery is free (default 1500000)
  vatPercent: number;                 // VAT percentage 0-100 (default 0)
  minOrderLbp: number;                // minimum order value in LBP (default 0)
  supportEmail: string;
  supportPhone: string;

  // === HERO SECTION ===
  heroTitle: string;
  heroSubtitle: string;
  heroImage: string;
  heroVideo: string;
  heroCtaText: string;
  heroCtaLink: string;
  heroSecondaryCtaText: string;
  heroSecondaryCtaLink: string;

  // === NAVBAR ===
  navbarLogoText: string;
  navbarSticky: boolean;

  // === FOOTER ===
  footerDescription: string;
  footerCopyright: string;
  footerEmail: string;
  footerPhone: string;
  footerSocialFacebook: string;
  footerSocialInstagram: string;
  footerSocialTwitter: string;
  footerSocialLinkedin: string;
  footerSocialYoutube: string;
  footerLinks: string; // JSON string of {label, url}[]

  // === SEO / META ===
  metaKeywords: string;
  metaRobots: string;
  googleAnalyticsId: string;

  // === BANNERS ===
  announcementText: string;
  announcementLink: string;
  announcementEnabled: boolean;

  // === POPUP / CAMPAIGN ===
  popupEnabled: boolean;
  popupTitle: string;
  popupDescription: string;
  popupImage: string;
  popupCtaText: string;
  popupCtaLink: string;
  popupDelay: number; // seconds before popup appears

  // === COUPON / PROMO ===
  defaultPromoCode: string;
  defaultDiscountPercent: number;

  // === LOYALTY ===
  loyaltyPointsPerDollar: number;
  loyaltyPointsPerOrder: number;
}

const DEFAULTS: SiteSettings = {
  id: SETTINGS_ID,
  siteName: 'CoffeeCraze',
  siteDescription: 'Premium coffee ritual delivery in Lebanon',
  logoUrl: '/logo.png',
  logoDarkUrl: '',
  logoCompactUrl: '',
  wordmarkUrl: '',
  iconMarkUrl: '',
  authLogoUrl: '',
  faviconUrl: '/logo192.svg',
  appleTouchIconUrl: '/logo192.svg',
  icon192Url: '/logo192.svg',
  icon512Url: '/logo512.svg',
  themeColor: '#2d1e16',
  backgroundColor: '#fdfaf7',
  ogImageUrl: '',
  socialImageUrl: '',
  updatedAt: new Date().toISOString(),
  // Business parameter defaults
  exchangeRate: 89500,
  deliveryFeeLbp: 25000,
  freeDeliveryThresholdLbp: 1500000,
  vatPercent: 0,
  minOrderLbp: 0,
  supportEmail: 'coffeecraze@nilelink.app',
  supportPhone: '+961 71 972 495',
  // Hero
  heroTitle: 'Your Daily Ritual, Perfected',
  heroSubtitle: 'Premium coffee delivered to your door',
  heroImage: '',
  heroVideo: '',
  heroCtaText: 'Shop Now',
  heroCtaLink: '/shop',
  heroSecondaryCtaText: 'Learn More',
  heroSecondaryCtaLink: '/about',
  // Navbar
  navbarLogoText: 'CoffeeCraze',
  navbarSticky: true,
  // Footer
  footerDescription: 'Handcrafted coffee experiences delivered to your door. Lebanon\'s premier coffee roastery.',
  footerCopyright: `© ${new Date().getFullYear()} CoffeeCraze. All rights reserved.`,
  footerEmail: 'coffeecraze@nilelink.app',
  footerPhone: '+961 71 972 495',
  footerSocialFacebook: 'https://facebook.com/coffeecraze',
  footerSocialInstagram: 'https://instagram.com/coffeecraze',
  footerSocialTwitter: 'https://twitter.com/coffeecraze',
  footerSocialLinkedin: 'https://linkedin.com/company/coffeecraze',
  footerSocialYoutube: 'https://youtube.com/@coffeecraze',
  footerLinks: JSON.stringify([
    { label: 'Shop', url: '/shop' },
    { label: 'Subscriptions', url: '/subscriptions' },
    { label: 'About', url: '/about' },
    { label: 'Blog', url: '/blog' },
    { label: 'FAQ', url: '/faq' },
    { label: 'Contact', url: '/contact' },
  ]),
  // SEO
  metaKeywords: 'coffee, premium, lebanon, subscription, roastery',
  metaRobots: 'index, follow',
  googleAnalyticsId: '',
  // Banners
  announcementText: '',
  announcementLink: '',
  announcementEnabled: false,
  // Popup
  popupEnabled: false,
  popupTitle: 'Welcome to CoffeeCraze',
  popupDescription: 'Get 10% off your first subscription order!',
  popupImage: '',
  popupCtaText: 'Get 10% Off',
  popupCtaLink: '/subscriptions',
  popupDelay: 10,
  // Coupon
  defaultPromoCode: 'COFFEECRAZE10',
  defaultDiscountPercent: 10,
  // Loyalty
  loyaltyPointsPerDollar: 10,
  loyaltyPointsPerOrder: 100,
};

export const SiteSettingsService = {
  SETTINGS_ID,

  getDefaults(): SiteSettings {
    return DEFAULTS;
  },

  async get(): Promise<SiteSettings> {
    try {
      const snap = await getDoc(doc(db, 'site_settings', SETTINGS_ID));
      if (snap.exists()) {
        return { ...DEFAULTS, ...snap.data() } as SiteSettings;
      }
    } catch {
      console.warn('[SiteSettings] Failed to load settings, using defaults');
    }
    return DEFAULTS;
  },

  async save(settings: Partial<SiteSettings>): Promise<void> {
    const data = cleanUndefined({ ...settings, updatedAt: new Date().toISOString() });
    const ref = doc(db, 'site_settings', SETTINGS_ID);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      await updateDoc(ref, data);
    } else {
      await setDoc(ref, cleanUndefined({ ...DEFAULTS, ...data }));
    }
  },
};
