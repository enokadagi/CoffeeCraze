import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Bell, Lock, Palette, Globe, Save } from 'lucide-react';
import Seo from '../components/common/SEO';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'sonner';
import DashboardLayout from '../components/layout/DashboardLayout';
import { UserPreferences } from '../types';

export default function Settings() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [preferences, setPreferences] = useState<UserPreferences>({
    emailNotifications: true,
    smsNotifications: false,
    marketingEmails: false,
    preferredDeliveryTime: 'Morning (9:00 AM - 12:00 PM)',
    currency: 'USD',
    language: 'en',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (profile?.preferences) {
      setPreferences(profile.preferences);
    }
  }, [profile, user, navigate]);

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { preferences });
      toast.success('Preferences saved successfully');
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('Failed to save preferences');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-4xl">
        <Seo title="Settings" description="Manage your preferences and account settings." />

        {/* Header */}
        <div className="border-b border-espresso/5 pb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-caramel mb-2">Configuration</p>
          <h1 className="text-4xl font-display font-black text-espresso italic">Settings</h1>
          <p className="text-sm text-text-muted mt-2">Customize your CoffeeCraze experience</p>
        </div>

        {/* Settings Sections */}
        <div className="space-y-6">
          {/* Notifications */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-espresso/5 rounded-2xl p-8 space-y-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-espresso/10 rounded-lg">
                <Bell size={24} className="text-espresso" />
              </div>
              <h2 className="text-xl font-bold text-espresso italic">Notifications</h2>
            </div>

            <div className="space-y-4">
              <SettingToggle
                label="Email Notifications"
                description="Receive updates about your orders and subscriptions"
                checked={preferences.emailNotifications}
                onChange={(checked) =>
                  setPreferences({ ...preferences, emailNotifications: checked })
                }
              />
              <SettingToggle
                label="SMS Notifications"
                description="Get text message alerts for deliveries and important updates"
                checked={preferences.smsNotifications}
                onChange={(checked) =>
                  setPreferences({ ...preferences, smsNotifications: checked })
                }
              />
              <SettingToggle
                label="Marketing Emails"
                description="Receive promotions, new products, and special offers"
                checked={preferences.marketingEmails}
                onChange={(checked) =>
                  setPreferences({ ...preferences, marketingEmails: checked })
                }
              />
            </div>
          </motion.div>

          {/* Delivery Preferences */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white border border-espresso/5 rounded-2xl p-8 space-y-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-espresso/10 rounded-lg">
                <Palette size={24} className="text-espresso" />
              </div>
              <h2 className="text-xl font-bold text-espresso italic">Delivery Preferences</h2>
            </div>

            <div>
              <label htmlFor="preferred-delivery-time" className="text-xs font-bold uppercase tracking-widest text-text-muted block mb-3">
                Preferred Delivery Time
              </label>
              <select
                id="preferred-delivery-time"
                value={preferences.preferredDeliveryTime || ''}
                onChange={(e) =>
                  setPreferences({ ...preferences, preferredDeliveryTime: e.target.value })
                }
                className="w-full px-4 py-3 border border-espresso/10 rounded-lg font-semibold text-espresso bg-white"
              >
                <option>Morning (9:00 AM - 12:00 PM)</option>
                <option>Afternoon (12:00 PM - 4:00 PM)</option>
                <option>Evening (4:00 PM - 8:00 PM)</option>
              </select>
            </div>
          </motion.div>

          {/* Regional Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white border border-espresso/5 rounded-2xl p-8 space-y-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-espresso/10 rounded-lg">
                <Globe size={24} className="text-espresso" />
              </div>
              <h2 className="text-xl font-bold text-espresso italic">Regional Settings</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="preferred-currency" className="text-xs font-bold uppercase tracking-widest text-text-muted block mb-3">
                  Currency
                </label>
                <select
                  id="preferred-currency"
                  value={preferences.currency}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      currency: e.target.value as 'USD' | 'LBP',
                    })
                  }
                  className="w-full px-4 py-3 border border-espresso/10 rounded-lg font-semibold text-espresso bg-white"
                >
                  <option value="USD">USD ($)</option>
                  <option value="LBP">LBP (Ù„.Ù„)</option>
                </select>
              </div>

              <div>
                <label htmlFor="preferred-language" className="text-xs font-bold uppercase tracking-widest text-text-muted block mb-3">
                  Language
                </label>
                <select
                  id="preferred-language"
                  value={preferences.language}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      language: e.target.value as 'en' | 'ar',
                    })
                  }
                  className="w-full px-4 py-3 border border-espresso/10 rounded-lg font-semibold text-espresso bg-white"
                >
                  <option value="en">English</option>
                  <option value="ar">Ø§Ù„Ø¹Ø±Ø¨ÙŠØ©</option>
                </select>
              </div>
            </div>
          </motion.div>

          {/* Privacy & Security */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white border border-espresso/5 rounded-2xl p-8 space-y-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-espresso/10 rounded-lg">
                <Lock size={24} className="text-espresso" />
              </div>
              <h2 className="text-xl font-bold text-espresso italic">Privacy & Security</h2>
            </div>

            <div className="space-y-3">
              <button onClick={() => toast.info('Password reset link will be sent to your email.')} className="w-full p-4 border border-espresso/10 rounded-lg hover:bg-espresso/5 transition-colors text-left">
                <p className="font-bold text-espresso text-sm">Change Password</p>
                <p className="text-xs text-text-muted mt-1">Update your account password</p>
              </button>
              <button onClick={() => toast.info('Two-factor authentication coming soon.')} className="w-full p-4 border border-espresso/10 rounded-lg hover:bg-espresso/5 transition-colors text-left">
                <p className="font-bold text-espresso text-sm">Two-Factor Authentication</p>
                <p className="text-xs text-text-muted mt-1">Add extra security to your account</p>
              </button>
              <button onClick={() => toast.info('Active sessions management coming soon.')} className="w-full p-4 border border-espresso/10 rounded-lg hover:bg-espresso/5 transition-colors text-left">
                <p className="font-bold text-espresso text-sm">Active Sessions</p>
                <p className="text-xs text-text-muted mt-1">Manage devices logged into your account</p>
              </button>
            </div>
          </motion.div>

          {/* Data & Privacy */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-amber-50 border border-amber-200 rounded-2xl p-8 space-y-6"
          >
            <h3 className="font-bold text-amber-900">Data & Privacy</h3>
            <div className="space-y-3 text-sm text-amber-800">
              <p>
                <span className="font-bold">Download Your Data:</span> Get a copy of all your personal data
              </p>
              <p>
                <span className="font-bold">Delete Account:</span> Permanently delete your account and all associated data
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => toast.info('Data export coming soon. You will receive an email with your data.')} className="px-4 py-2 bg-amber-100 text-amber-700 rounded-lg text-xs font-bold hover:bg-amber-200 transition-colors">
                Download Data
              </button>
              <button onClick={() => toast.error('Account deletion requires contacting support. Please email coffeecraze@nilelink.app')} className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-xs font-bold hover:bg-red-200 transition-colors">
                Delete Account
              </button>
            </div>
          </motion.div>
        </div>

        {/* Save Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          onClick={handleSave}
          disabled={loading}
          className="w-full py-4 bg-espresso text-white rounded-lg font-bold hover:bg-espresso/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 text-lg"
        >
          <Save size={20} />
          {loading ? 'Saving...' : 'Save Settings'}
        </motion.button>
      </div>
    </DashboardLayout>
  );
}

// Helper Component
function SettingToggle({
  label,
  description,
  checked,
  onChange,
}: {
  readonly label: string;
  readonly description: string;
  readonly checked: boolean;
  readonly onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between p-4 border border-espresso/5 rounded-lg hover:bg-espresso/5 transition-colors">
      <div>
        <p className="font-semibold text-espresso text-sm">{label}</p>
        <p className="text-xs text-text-muted mt-1">{description}</p>
      </div>
      <button
        type="button"
        aria-label={`Toggle ${label}`}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative w-12 h-6 rounded-full transition-colors',
          checked ? 'bg-green-500' : 'bg-gray-300'
        )}
      >
        <div
          className={cn(
            'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform',
            checked ? 'right-1' : 'left-1'
          )}
        />
      </button>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
