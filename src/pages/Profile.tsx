import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Edit2, Save, X, LogOut } from 'lucide-react';
import Seo from '../components/common/SEO';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'sonner';
import DashboardLayout from '../components/layout/DashboardLayout';
import { UserProfile, Address } from '../types';

export default function Profile() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showAddressForm, setShowAddressForm] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (profile) {
      setFormData(profile);
      setAddresses(profile.addresses || []);
    }
  }, [profile, user, navigate]);

  const handleUpdate = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        displayName: formData.displayName,
        phone: formData.phone,
        address: formData.address,
        addresses,
        updatedAt: new Date().toISOString(),
      });
      
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (!profile) {
    return <DashboardLayout><div className="text-center py-20">Loading...</div></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-4xl">
        <Seo title="Profile" description="Manage your profile and account information." />

        {/* Header */}
        <div className="flex items-start justify-between border-b border-espresso/5 pb-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-caramel mb-2">Account</p>
            <h1 className="text-4xl font-display font-black text-espresso italic">Your Profile</h1>
            <p className="text-sm text-coffee-400 mt-2">Manage your personal information</p>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center gap-2 px-6 py-3 bg-espresso text-white rounded-lg font-bold hover:bg-espresso/90 transition-colors"
          >
            {isEditing ? (
              <>
                <X size={18} />
                Cancel
              </>
            ) : (
              <>
                <Edit2 size={18} />
                Edit
              </>
            )}
          </button>
        </div>

        {/* Profile Info */}
        <motion.div
          layout
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        >
          {/* Main Profile */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-espresso/5 rounded-2xl p-8 space-y-6">
              <h2 className="text-xl font-bold text-espresso italic mb-6">Personal Information</h2>

              {/* Name */}
              <div>
                <label htmlFor="profile-display-name" className="text-xs font-bold uppercase tracking-widest text-coffee-400 block mb-2">
                  Full Name
                </label>
                <input
                  id="profile-display-name"
                  type="text"
                  value={formData.displayName || ''}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 border border-espresso/10 rounded-lg bg-white disabled:bg-gray-50 font-semibold text-espresso"
                />
              </div>

              {/* Email (read-only) */}
              <div>
                <label htmlFor="profile-email" className="text-xs font-bold uppercase tracking-widest text-coffee-400 block mb-2">
                  Email Address
                </label>
                <input
                  id="profile-email"
                  type="email"
                  value={profile.email}
                  disabled
                  className="w-full px-4 py-3 border border-espresso/10 rounded-lg bg-gray-50 font-semibold text-espresso"
                />
                <p className="text-xs text-coffee-400 mt-2">Cannot be changed</p>
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="profile-phone" className="text-xs font-bold uppercase tracking-widest text-coffee-400 block mb-2">
                  Phone Number
                </label>
                <input
                  id="profile-phone"
                  type="tel"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  disabled={!isEditing}
                  placeholder="+961 XX XXX XXXX"
                  className="w-full px-4 py-3 border border-espresso/10 rounded-lg bg-white disabled:bg-gray-50 font-semibold text-espresso"
                />
              </div>

              {/* Address */}
              <div>
                <label htmlFor="profile-address" className="text-xs font-bold uppercase tracking-widest text-coffee-400 block mb-2">
                  Default Address
                </label>
                <input
                  id="profile-address"
                  type="text"
                  value={formData.address || ''}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  disabled={!isEditing}
                  placeholder="Your delivery address"
                  className="w-full px-4 py-3 border border-espresso/10 rounded-lg bg-white disabled:bg-gray-50 font-semibold text-espresso"
                />
              </div>

              {/* Account Details */}
              <div className="pt-6 border-t border-espresso/5 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-coffee-400">Account Created</span>
                  <span className="font-bold text-espresso">
                    {new Date(profile.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-coffee-400">Last Login</span>
                  <span className="font-bold text-espresso">
                    {profile.lastLogin ? new Date(profile.lastLogin).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>

              {/* Save Button */}
              {isEditing && (
                <button
                  onClick={handleUpdate}
                  disabled={loading}
                  className="w-full py-3 bg-espresso text-white rounded-lg font-bold hover:bg-espresso/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  <Save size={18} />
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Info */}
            <div className="bg-gradient-to-br from-espresso/5 to-caramel/5 border border-espresso/10 rounded-2xl p-6 space-y-4">
              <h3 className="font-bold text-espresso">Account Status</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-coffee-400">Status</span>
                  <span className="inline-flex items-center gap-2 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Active
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-coffee-400">Role</span>
                  <span className="font-bold capitalize text-espresso">{profile.role}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-coffee-400">Loyalty Points</span>
                  <span className="font-bold text-espresso">{profile.loyaltyPoints}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white border border-espresso/5 rounded-2xl p-6 space-y-3">
              <button className="w-full py-3 border border-espresso/20 text-espresso rounded-lg font-bold hover:bg-espresso/5 transition-colors text-sm">
                Change Password
              </button>
              <button className="w-full py-3 border border-espresso/20 text-espresso rounded-lg font-bold hover:bg-espresso/5 transition-colors text-sm">
                Privacy Settings
              </button>
              <button className="w-full py-3 border border-red-200 text-red-600 rounded-lg font-bold hover:bg-red-50 transition-colors text-sm flex items-center justify-center gap-2">
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </div>
        </motion.div>

        {/* Addresses Section */}
        <div className="bg-white border border-espresso/5 rounded-2xl p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-espresso italic">Saved Addresses</h2>
            {isEditing && (
              <button
                onClick={() => setShowAddressForm(!showAddressForm)}
                className="px-4 py-2 bg-espresso text-white rounded-lg text-sm font-bold hover:bg-espresso/90 transition-colors"
              >
                + Add Address
              </button>
            )}
          </div>

          {addresses.length > 0 ? (
            <div className="space-y-3">
              {addresses.map((addr, idx) => (
                <div key={idx} className="p-4 border border-espresso/10 rounded-lg hover:bg-espresso/5 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-bold text-espresso text-sm mb-1">{addr.city}</p>
                      <p className="text-xs text-coffee-400">
                        {addr.street} {addr.building && `Bldg ${addr.building}`}
                        {addr.floor && ` Floor ${addr.floor}`}
                      </p>
                      {addr.isDefault && (
                        <span className="inline-block mt-2 px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded">
                          Default
                        </span>
                      )}
                    </div>
                    {isEditing && (
                      <button className="text-xs text-caramel hover:text-espresso">Edit</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-coffee-400 text-center py-8">No addresses saved yet</p>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
