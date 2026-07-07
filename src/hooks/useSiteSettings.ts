import { useEffect, useState } from 'react';
import { SiteSettings, SiteSettingsService } from '../services/siteSettings';

let cached: SiteSettings | null = null;
let listeners: Array<(s: SiteSettings) => void> = [];
function notify(s: SiteSettings) { listeners.forEach(fn => fn(s)); }

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings | null>(cached);

  useEffect(() => {
    if (cached) {
      setSettings(cached);
      return;
    }
    SiteSettingsService.get().then(s => {
      cached = s;
      setSettings(s);
      notify(s);
    });
    listeners.push(setSettings);
    return () => { listeners = listeners.filter(fn => fn !== setSettings); };
  }, []);

  return settings;
}

export function applySiteSettings(settings: SiteSettings) {
  document.title = settings.siteName;
  setMeta('description', settings.siteDescription);
  setLink('icon', settings.faviconUrl, 'image/svg+xml');
  setLink('apple-touch-icon', settings.appleTouchIconUrl);
  setMeta('theme-color', settings.themeColor);
  setMeta('og:title', settings.siteName);
  setMeta('og:description', settings.siteDescription);
  if (settings.ogImageUrl) setMeta('og:image', settings.ogImageUrl);
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

export function invalidateSettingsCache() {
  cached = null;
}
