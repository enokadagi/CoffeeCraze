import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

const SETTINGS_ID = 'app';

export interface SiteSettings {
  id: string;
  siteName: string;
  siteDescription: string;
  logoUrl: string;
  faviconUrl: string;
  appleTouchIconUrl: string;
  icon192Url: string;
  icon512Url: string;
  themeColor: string;
  backgroundColor: string;
  ogImageUrl: string;
  updatedAt: string;
  // Business parameters
  exchangeRate: number;               // 1 USD = N LBP (default 89500)
  deliveryFeeLbp: number;             // flat delivery fee in LBP (default 25000)
  freeDeliveryThresholdLbp: number;   // cart total above which delivery is free (default 1500000)
  vatPercent: number;                 // VAT percentage 0-100 (default 0)
  minOrderLbp: number;                // minimum order value in LBP (default 0)
  supportEmail: string;
  supportPhone: string;
}

const DEFAULTS: SiteSettings = {
  id: SETTINGS_ID,
  siteName: 'CoffeeCraze',
  siteDescription: 'Premium coffee ritual delivery in Lebanon',
  logoUrl: '/logo.png',
  faviconUrl: '/logo192.svg',
  appleTouchIconUrl: '/logo192.svg',
  icon192Url: '/logo192.svg',
  icon512Url: '/logo512.svg',
  themeColor: '#2d1e16',
  backgroundColor: '#fdfaf7',
  ogImageUrl: '',
  updatedAt: new Date().toISOString(),
  // Business parameter defaults
  exchangeRate: 89500,
  deliveryFeeLbp: 25000,
  freeDeliveryThresholdLbp: 1500000,
  vatPercent: 0,
  minOrderLbp: 0,
  supportEmail: 'coffeecraze@nilelink.app',
  supportPhone: '+961 71 972 495',
};

export const SiteSettingsService = {
  async get(): Promise<SiteSettings> {
    try {
      const snap = await getDoc(doc(db, 'site_settings', SETTINGS_ID));
      if (snap.exists()) {
        return { ...DEFAULTS, ...snap.data() } as SiteSettings;
      }
    } catch { /* use defaults */ }
    return DEFAULTS;
  },

  async save(settings: Partial<SiteSettings>): Promise<void> {
    const data = { ...settings, updatedAt: new Date().toISOString() };
    const ref = doc(db, 'site_settings', SETTINGS_ID);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      await updateDoc(ref, data);
    } else {
      await setDoc(ref, { ...DEFAULTS, ...data });
    }
  },
};
