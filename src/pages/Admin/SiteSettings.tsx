import { useState, useEffect } from 'react';
import { SiteSettingsService, SiteSettings } from '../../services/siteSettings';
import { applySiteSettings, invalidateSettingsCache } from '../../hooks/useSiteSettings';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../../lib/firebase';
import { toast } from 'sonner';
import { Settings, Save, Upload, Image, AlertTriangle } from 'lucide-react';
import SEO from '../../components/common/SEO';
import ImageWithFallback from '../../components/common/ImageWithFallback';
import DashboardLayout from '../../components/layout/DashboardLayout';

const ImageField = ({ label, field, settings, onImageUpload, onFieldChange }: { 
  label: string; 
  field: keyof SiteSettings; 
  settings: SiteSettings; 
  onImageUpload: (field: keyof SiteSettings, e: React.ChangeEvent<HTMLInputElement>) => void;
  onFieldChange: (field: keyof SiteSettings, value: string) => void;
}) => (
  <div className="space-y-2">
    <label className="text-xs font-bold uppercase tracking-wider text-text-muted">{label}</label>
    <div className="flex items-center gap-4">
      <div className="w-16 h-16 bg-cream rounded-2xl border border-border overflow-hidden flex items-center justify-center shrink-0">
        {typeof settings[field] === 'string' && (settings[field] as string) ? (
          <ImageWithFallback src={settings[field] as string} alt={label} className="w-full h-full object-cover" />
        ) : (
          <Image size={24} className="text-text-muted" />
        )}
      </div>
      <label className="btn-outline px-4 py-2 rounded-xl text-xs font-bold cursor-pointer border border-coffee-200 text-text-secondary hover:bg-cream transition-all">
        <Upload size={14} className="inline-block mr-1" /> Upload
        <input type="file" accept="image/*" className="hidden" onChange={e => onImageUpload(field, e)} />
      </label>
      <input
        type="text"
        value={(settings[field] as string) || ''}
        onChange={e => onFieldChange(field, e.target.value)}
        className="flex-1 px-4 py-2 bg-white border border-border rounded-xl text-sm outline-none focus:border-caramel transition-all"
        placeholder="URL or leave empty"
      />
    </div>
  </div>
);

export default function AdminSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    SiteSettingsService.get().then(s => {
      setSettings(s);
      setLoading(false);
    });
  }, []);

  const uploadFile = async (file: File, path: string): Promise<string> => {
    const storageRef = ref(storage, path);
    const uploadTask = uploadBytesResumable(storageRef, file);
    return new Promise<string>((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          // Upload progress could be shown here
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          if (progress > 0 && progress % 25 === 0) {
            console.log(`[SiteSettings] Upload ${path}: ${progress}%`);
          }
        },
        (error) => {
          console.error('[SiteSettings] Upload failed:', error);
          reject(error);
        },
        async () => {
          try {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(url);
          } catch (e) {
            reject(e);
          }
        }
      );
    });
  };

  const handleImageUpload = async (field: keyof SiteSettings, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !settings) return;
    try {
      const url = await uploadFile(file, `site/${field}_${Date.now()}`);
      setSettings({ ...settings, [field]: url });
      toast.success('Image uploaded');
    } catch {
      toast.error('Upload failed');
    }
  };

  const handleFieldChange = (field: keyof SiteSettings, value: string) => {
    setSettings(prev => prev ? { ...prev, [field]: value } : prev);
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      await SiteSettingsService.save(settings);
      invalidateSettingsCache();
      applySiteSettings(settings);
      toast.success('Settings saved');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return (
      <DashboardLayout>
        <div className="animate-pulse space-y-6 p-8">
          <div className="h-8 bg-cream rounded w-64" />
          <div className="h-64 bg-cream rounded-3xl" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <SEO title="Site Settings" description="Manage site-wide appearance and branding" />
        <header className="flex items-center justify-between border-b border-border pb-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-caramel mb-2">Configuration</p>
            <h1 className="text-h1 font-display font-bold text-espresso">Site Settings</h1>
            <p className="text-sm text-text-muted mt-2">Manage branding, icons, and appearance</p>
          </div>
          <button onClick={handleSave} disabled={saving} className="btn btn-primary px-8 py-4 text-sm">
            <Save size={18} className="mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white border border-border rounded-3xl p-8 space-y-6">
            <h2 className="text-lg font-display font-bold text-espresso flex items-center gap-3">
              <Settings size={20} className="text-caramel" /> General
            </h2>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-text-muted">Site Name</label>
                <input type="text" value={settings.siteName} onChange={e => setSettings({ ...settings, siteName: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-border rounded-xl text-sm outline-none focus:border-caramel" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-text-muted">Description</label>
                <textarea value={settings.siteDescription} onChange={e => setSettings({ ...settings, siteDescription: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-border rounded-xl text-sm outline-none focus:border-caramel h-24 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-text-muted">Theme Color</label>
                  <div className="flex gap-2 items-center">
                    <input type="color" value={settings.themeColor} onChange={e => setSettings({ ...settings, themeColor: e.target.value })}
                      className="w-10 h-10 rounded-xl border border-border cursor-pointer" />
                    <input type="text" value={settings.themeColor} onChange={e => setSettings({ ...settings, themeColor: e.target.value })}
                      className="flex-1 px-4 py-3 bg-white border border-border rounded-xl text-sm outline-none focus:border-caramel font-mono" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-text-muted">Background Color</label>
                  <div className="flex gap-2 items-center">
                    <input type="color" value={settings.backgroundColor} onChange={e => setSettings({ ...settings, backgroundColor: e.target.value })}
                      className="w-10 h-10 rounded-xl border border-border cursor-pointer" />
                    <input type="text" value={settings.backgroundColor} onChange={e => setSettings({ ...settings, backgroundColor: e.target.value })}
                      className="flex-1 px-4 py-3 bg-white border border-border rounded-xl text-sm outline-none focus:border-caramel font-mono" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-border rounded-3xl p-8 space-y-6">
            <h2 className="text-lg font-display font-bold text-espresso flex items-center gap-3">
              <Image size={20} className="text-caramel" /> Branding Assets
            </h2>
            <div className="space-y-5">
              <ImageField label="Logo" field="logoUrl" settings={settings} onImageUpload={handleImageUpload} onFieldChange={handleFieldChange} />
              <ImageField label="Favicon" field="faviconUrl" settings={settings} onImageUpload={handleImageUpload} onFieldChange={handleFieldChange} />
              <ImageField label="Apple Touch Icon" field="appleTouchIconUrl" settings={settings} onImageUpload={handleImageUpload} onFieldChange={handleFieldChange} />
              <ImageField label="PWA Icon 192x192" field="icon192Url" settings={settings} onImageUpload={handleImageUpload} onFieldChange={handleFieldChange} />
              <ImageField label="PWA Icon 512x512" field="icon512Url" settings={settings} onImageUpload={handleImageUpload} onFieldChange={handleFieldChange} />
              <ImageField label="OG Image (Social Share)" field="ogImageUrl" settings={settings} onImageUpload={handleImageUpload} onFieldChange={handleFieldChange} />
            </div>
          </div>
        </div>

        {/* Business Rules */}
        <div className="bg-white border border-border rounded-3xl p-8 space-y-6">
          <h2 className="text-lg font-display font-bold text-espresso flex items-center gap-3">
            <Settings size={20} className="text-caramel" /> Business Rules
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-text-muted">Exchange Rate (LBP per 1 USD)</label>
              <input type="number" min="0" value={settings.exchangeRate ?? 89500}
                onChange={e => setSettings({ ...settings, exchangeRate: Number(e.target.value) })}
                className="w-full px-4 py-3 bg-white border border-border rounded-xl text-sm outline-none focus:border-caramel" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-text-muted">Delivery Fee (LBP)</label>
              <input type="number" min="0" value={settings.deliveryFeeLbp ?? 25000}
                onChange={e => setSettings({ ...settings, deliveryFeeLbp: Number(e.target.value) })}
                className="w-full px-4 py-3 bg-white border border-border rounded-xl text-sm outline-none focus:border-caramel" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-text-muted">Free Delivery Threshold (LBP)</label>
              <input type="number" min="0" value={settings.freeDeliveryThresholdLbp ?? 1500000}
                onChange={e => setSettings({ ...settings, freeDeliveryThresholdLbp: Number(e.target.value) })}
                className="w-full px-4 py-3 bg-white border border-border rounded-xl text-sm outline-none focus:border-caramel" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-text-muted">VAT % (0 = no tax)</label>
              <input type="number" min="0" max="100" step="0.1" value={settings.vatPercent ?? 0}
                onChange={e => setSettings({ ...settings, vatPercent: Number(e.target.value) })}
                className="w-full px-4 py-3 bg-white border border-border rounded-xl text-sm outline-none focus:border-caramel" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-text-muted">Minimum Order (LBP, 0 = no minimum)</label>
              <input type="number" min="0" value={settings.minOrderLbp ?? 0}
                onChange={e => setSettings({ ...settings, minOrderLbp: Number(e.target.value) })}
                className="w-full px-4 py-3 bg-white border border-border rounded-xl text-sm outline-none focus:border-caramel" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-text-muted">Support Email</label>
              <input type="email" value={settings.supportEmail ?? ''}
                onChange={e => setSettings({ ...settings, supportEmail: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-border rounded-xl text-sm outline-none focus:border-caramel" />
            </div>
            <div className="space-y-1 sm:col-span-2 lg:col-span-1">
              <label className="text-xs font-bold uppercase tracking-wider text-text-muted">Support Phone</label>
              <input type="tel" value={settings.supportPhone ?? ''}
                onChange={e => setSettings({ ...settings, supportPhone: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-border rounded-xl text-sm outline-none focus:border-caramel" />
            </div>
          </div>
        </div>


        {/* Hero Section */}
        <div className="bg-white border border-border rounded-3xl p-8 space-y-6">
          <h2 className="text-lg font-display font-bold text-espresso flex items-center gap-3">
            <Image size={20} className="text-caramel" /> Hero Section
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-text-muted">Hero Title</label>
              <input type="text" value={settings.heroTitle} onChange={e => setSettings({ ...settings, heroTitle: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-border rounded-xl text-sm outline-none focus:border-caramel" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-text-muted">Hero Subtitle</label>
              <input type="text" value={settings.heroSubtitle} onChange={e => setSettings({ ...settings, heroSubtitle: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-border rounded-xl text-sm outline-none focus:border-caramel" />
            </div>
            <div className="sm:col-span-2">
              <ImageField label="Hero Image" field="heroImage" settings={settings} onImageUpload={handleImageUpload} onFieldChange={handleFieldChange} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-text-muted">Hero Video URL (optional)</label>
              <input type="text" value={settings.heroVideo} onChange={e => setSettings({ ...settings, heroVideo: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-border rounded-xl text-sm outline-none focus:border-caramel" placeholder="https://..." />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-text-muted">CTA Button Text</label>
              <input type="text" value={settings.heroCtaText} onChange={e => setSettings({ ...settings, heroCtaText: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-border rounded-xl text-sm outline-none focus:border-caramel" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-text-muted">CTA Link</label>
              <input type="text" value={settings.heroCtaLink} onChange={e => setSettings({ ...settings, heroCtaLink: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-border rounded-xl text-sm outline-none focus:border-caramel" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-text-muted">Secondary CTA Text</label>
              <input type="text" value={settings.heroSecondaryCtaText} onChange={e => setSettings({ ...settings, heroSecondaryCtaText: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-border rounded-xl text-sm outline-none focus:border-caramel" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-text-muted">Secondary CTA Link</label>
              <input type="text" value={settings.heroSecondaryCtaLink} onChange={e => setSettings({ ...settings, heroSecondaryCtaLink: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-border rounded-xl text-sm outline-none focus:border-caramel" />
            </div>
          </div>
        </div>

        {/* Footer Section */}
        <div className="bg-white border border-border rounded-3xl p-8 space-y-6">
          <h2 className="text-lg font-display font-bold text-espresso flex items-center gap-3">
            <Settings size={20} className="text-caramel" /> Footer & Social
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-text-muted">Footer Description</label>
              <textarea value={settings.footerDescription} onChange={e => setSettings({ ...settings, footerDescription: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-border rounded-xl text-sm outline-none focus:border-caramel h-20 resize-none" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-text-muted">Copyright Text</label>
              <input type="text" value={settings.footerCopyright} onChange={e => setSettings({ ...settings, footerCopyright: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-border rounded-xl text-sm outline-none focus:border-caramel" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-text-muted">Footer Email</label>
              <input type="email" value={settings.footerEmail} onChange={e => setSettings({ ...settings, footerEmail: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-border rounded-xl text-sm outline-none focus:border-caramel" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-text-muted">Footer Phone</label>
              <input type="tel" value={settings.footerPhone} onChange={e => setSettings({ ...settings, footerPhone: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-border rounded-xl text-sm outline-none focus:border-caramel" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-text-muted">Footer Links (JSON)</label>
              <input type="text" value={settings.footerLinks} onChange={e => setSettings({ ...settings, footerLinks: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-border rounded-xl text-sm outline-none focus:border-caramel font-mono text-xs"
                placeholder='[{"label":"Shop","url":"/shop"}]' />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-text-muted">Facebook</label>
              <input type="url" value={settings.footerSocialFacebook} onChange={e => setSettings({ ...settings, footerSocialFacebook: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-border rounded-xl text-sm outline-none focus:border-caramel" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-text-muted">Instagram</label>
              <input type="url" value={settings.footerSocialInstagram} onChange={e => setSettings({ ...settings, footerSocialInstagram: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-border rounded-xl text-sm outline-none focus:border-caramel" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-text-muted">Twitter / X</label>
              <input type="url" value={settings.footerSocialTwitter} onChange={e => setSettings({ ...settings, footerSocialTwitter: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-border rounded-xl text-sm outline-none focus:border-caramel" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-text-muted">LinkedIn</label>
              <input type="url" value={settings.footerSocialLinkedin} onChange={e => setSettings({ ...settings, footerSocialLinkedin: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-border rounded-xl text-sm outline-none focus:border-caramel" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-text-muted">YouTube</label>
              <input type="url" value={settings.footerSocialYoutube} onChange={e => setSettings({ ...settings, footerSocialYoutube: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-border rounded-xl text-sm outline-none focus:border-caramel" />
            </div>
          </div>
        </div>

        {/* SEO */}
        <div className="bg-white border border-border rounded-3xl p-8 space-y-6">
          <h2 className="text-lg font-display font-bold text-espresso flex items-center gap-3">
            <Settings size={20} className="text-caramel" /> SEO & Analytics
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-text-muted">Meta Keywords</label>
              <input type="text" value={settings.metaKeywords} onChange={e => setSettings({ ...settings, metaKeywords: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-border rounded-xl text-sm outline-none focus:border-caramel" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-text-muted">Meta Robots</label>
              <input type="text" value={settings.metaRobots} onChange={e => setSettings({ ...settings, metaRobots: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-border rounded-xl text-sm outline-none focus:border-caramel" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-text-muted">Google Analytics ID</label>
              <input type="text" value={settings.googleAnalyticsId} onChange={e => setSettings({ ...settings, googleAnalyticsId: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-border rounded-xl text-sm outline-none focus:border-caramel" placeholder="G-XXXXXXX" />
            </div>
          </div>
        </div>

        {/* Announcement Bar */}
        <div className="bg-white border border-border rounded-3xl p-8 space-y-6">
          <h2 className="text-lg font-display font-bold text-espresso flex items-center gap-3">
            <Settings size={20} className="text-caramel" /> Announcement Bar
          </h2>
          <div className="flex items-center gap-4">
            <input
              type="checkbox"
              checked={settings.announcementEnabled}
              onChange={e => setSettings({ ...settings, announcementEnabled: e.target.checked })}
              className="w-5 h-5 accent-caramel"
            />
            <span className="text-sm font-bold text-espresso">Show announcement bar</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-text-muted">Announcement Text</label>
              <input type="text" value={settings.announcementText} onChange={e => setSettings({ ...settings, announcementText: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-border rounded-xl text-sm outline-none focus:border-caramel"
                placeholder="Free delivery on orders over 1,500,000 LBP!" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-text-muted">Announcement Link</label>
              <input type="text" value={settings.announcementLink} onChange={e => setSettings({ ...settings, announcementLink: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-border rounded-xl text-sm outline-none focus:border-caramel"
                placeholder="/shop" />
            </div>
          </div>
        </div>

        {/* Popup Campaign */}
        <div className="bg-white border border-border rounded-3xl p-8 space-y-6">
          <h2 className="text-lg font-display font-bold text-espresso flex items-center gap-3">
            <Image size={20} className="text-caramel" /> Popup Campaign
          </h2>
          <div className="flex items-center gap-4">
            <input
              type="checkbox"
              checked={settings.popupEnabled}
              onChange={e => setSettings({ ...settings, popupEnabled: e.target.checked })}
              className="w-5 h-5 accent-caramel"
            />
            <span className="text-sm font-bold text-espresso">Enable popup</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-text-muted">Popup Title</label>
              <input type="text" value={settings.popupTitle} onChange={e => setSettings({ ...settings, popupTitle: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-border rounded-xl text-sm outline-none focus:border-caramel" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-text-muted">Popup Description</label>
              <input type="text" value={settings.popupDescription} onChange={e => setSettings({ ...settings, popupDescription: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-border rounded-xl text-sm outline-none focus:border-caramel" />
            </div>
            <div className="sm:col-span-2">
              <ImageField label="Popup Image" field="popupImage" settings={settings} onImageUpload={handleImageUpload} onFieldChange={handleFieldChange} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-text-muted">Popup CTA Text</label>
              <input type="text" value={settings.popupCtaText} onChange={e => setSettings({ ...settings, popupCtaText: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-border rounded-xl text-sm outline-none focus:border-caramel" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-text-muted">Popup CTA Link</label>
              <input type="text" value={settings.popupCtaLink} onChange={e => setSettings({ ...settings, popupCtaLink: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-border rounded-xl text-sm outline-none focus:border-caramel" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-text-muted">Popup Delay (seconds)</label>
              <input type="number" min="0" value={settings.popupDelay} onChange={e => setSettings({ ...settings, popupDelay: Number(e.target.value) })}
                className="w-full px-4 py-3 bg-white border border-border rounded-xl text-sm outline-none focus:border-caramel" />
            </div>
          </div>
        </div>

        {/* Loyalty Settings */}
        <div className="bg-white border border-border rounded-3xl p-8 space-y-6">
          <h2 className="text-lg font-display font-bold text-espresso flex items-center gap-3">
            <Settings size={20} className="text-caramel" /> Loyalty & Promotions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-text-muted">Points per $1</label>
              <input type="number" min="0" value={settings.loyaltyPointsPerDollar} onChange={e => setSettings({ ...settings, loyaltyPointsPerDollar: Number(e.target.value) })}
                className="w-full px-4 py-3 bg-white border border-border rounded-xl text-sm outline-none focus:border-caramel" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-text-muted">Points per Order</label>
              <input type="number" min="0" value={settings.loyaltyPointsPerOrder} onChange={e => setSettings({ ...settings, loyaltyPointsPerOrder: Number(e.target.value) })}
                className="w-full px-4 py-3 bg-white border border-border rounded-xl text-sm outline-none focus:border-caramel" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-text-muted">Default Promo Code</label>
              <input type="text" value={settings.defaultPromoCode} onChange={e => setSettings({ ...settings, defaultPromoCode: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-border rounded-xl text-sm outline-none focus:border-caramel" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-text-muted">Default Discount %</label>
              <input type="number" min="0" max="100" value={settings.defaultDiscountPercent} onChange={e => setSettings({ ...settings, defaultDiscountPercent: Number(e.target.value) })}
                className="w-full px-4 py-3 bg-white border border-border rounded-xl text-sm outline-none focus:border-caramel" />
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="border border-red-200 rounded-3xl p-8 bg-red-50/30 space-y-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-xl">
              <AlertTriangle size={20} className="text-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-red-700">Danger Zone</h2>
              <p className="text-xs text-red-600/70">Destructive operations — use with caution</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
