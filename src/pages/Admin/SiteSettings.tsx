import { useState, useEffect } from 'react';
import { SiteSettingsService, SiteSettings } from '../../services/siteSettings';
import { applySiteSettings, invalidateSettingsCache } from '../../hooks/useSiteSettings';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db } from '../../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { Settings, Save, Upload, Image } from 'lucide-react';
import SEO from '../../components/common/SEO';
import ImageWithFallback from '../../components/common/ImageWithFallback';
import DashboardLayout from '../../components/layout/DashboardLayout';

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
    const storage = getStorage();
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
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

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      await SiteSettingsService.save(settings);
      const ref = doc(db, 'site_settings', 'app');
      await setDoc(ref, { ...settings, updatedAt: new Date().toISOString() }, { merge: true });
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

  const ImageField = ({ label, field }: { label: string; field: keyof SiteSettings }) => (
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
          <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(field, e)} />
        </label>
        <input
          type="text"
          value={(settings[field] as string) || ''}
          onChange={e => setSettings({ ...settings, [field]: e.target.value })}
          className="flex-1 px-4 py-2 bg-white border border-border rounded-xl text-sm outline-none focus:border-caramel transition-all"
          placeholder="URL or leave empty"
        />
      </div>
    </div>
  );

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
              <ImageField label="Logo" field="logoUrl" />
              <ImageField label="Favicon" field="faviconUrl" />
              <ImageField label="Apple Touch Icon" field="appleTouchIconUrl" />
              <ImageField label="PWA Icon 192x192" field="icon192Url" />
              <ImageField label="PWA Icon 512x512" field="icon512Url" />
              <ImageField label="OG Image (Social Share)" field="ogImageUrl" />
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
