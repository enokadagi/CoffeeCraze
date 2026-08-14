import { createContext, createElement, useContext, useEffect, useState, type ReactNode } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { SiteSettings, SiteSettingsService } from '../services/siteSettings';

const SiteSettingsContext = createContext<SiteSettings | null>(null);

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    const ref = doc(db, 'site_settings', SiteSettingsService.SETTINGS_ID);
    const unsubscribe = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          setSettings({ ...SiteSettingsService.getDefaults(), ...snap.data() } as SiteSettings);
        } else {
          setSettings(SiteSettingsService.getDefaults());
        }
      },
      (err) => {
        console.warn('[SiteSettings] Failed to load settings, using defaults', err);
        setSettings(SiteSettingsService.getDefaults());
      },
    );
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (settings) applySiteSettings(settings);
  }, [settings]);

  return createElement(SiteSettingsContext.Provider, { value: settings }, children);
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext);
}

export function applySiteSettings(settings: SiteSettings) {
  document.title = settings.siteName;
  setMeta('description', settings.siteDescription);
  setMeta('keywords', settings.metaKeywords || '');
  setMeta('robots', settings.metaRobots || 'index, follow');
  setLink('icon', settings.faviconUrl, 'image/svg+xml');
  setLink('apple-touch-icon', settings.appleTouchIconUrl);
  setMeta('theme-color', settings.themeColor);
  setMeta('og:title', settings.siteName);
  setMeta('og:description', settings.siteDescription);
  if (settings.ogImageUrl) setMeta('og:image', settings.ogImageUrl);
  if (settings.socialImageUrl) setMeta('twitter:image', settings.socialImageUrl);
  setMeta('twitter:title', settings.siteName);
  setMeta('twitter:description', settings.siteDescription);
  if (settings.backgroundColor) document.documentElement.style.setProperty('--site-bg', settings.backgroundColor);

  // Load Google Analytics if configured
  if (settings.googleAnalyticsId) {
    const gaId = settings.googleAnalyticsId.trim();
    const existingScript = document.querySelector(`script[data-ga="${gaId}"]`);
    if (!existingScript) {
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
      script.dataset.ga = gaId;
      document.head.appendChild(script);
      const w = window as unknown as { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void };
      w.dataLayer = w.dataLayer || [];
      w.gtag = function (...args: unknown[]) { w.dataLayer!.push(args); };
      w.gtag('js', new Date());
      w.gtag('config', gaId);
    }
  }
}

function setMeta(name: string, content: string) {
  let el = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    if (name.startsWith('og:')) el.setAttribute('property', name);
    else el.setAttribute('name', name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setLink(rel: string, href: string, type?: string) {
  let el = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.rel = rel;
    document.head.appendChild(el);
  }
  el.href = href;
  if (type) el.type = type;
}

// Kept for compatibility with the admin settings page. Snapshot-based settings
// now propagate automatically after saves, so this is a no-op.
export function invalidateSettingsCache() {
  /* no-op: live snapshot handles cache invalidation */
}