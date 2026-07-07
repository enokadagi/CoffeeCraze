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
