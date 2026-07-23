import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Edit2, Save, X, LogOut, Camera, Mail, ShieldCheck, AlertTriangle, RefreshCw } from 'lucide-react';
import Seo from '../components/common/SEO';
import ImageWithFallback from '../components/common/ImageWithFallback';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { sendPasswordResetEmail, signOut } from 'firebase/auth';
import { auth, db, storage } from '../lib/firebase';
import { toast } from 'sonner';
import DashboardLayout from '../components/layout/DashboardLayout';
import { UserProfile, Address } from '../types';
import { cn, cleanUndefined } from '../lib/utils';

export default function Profile() {
  const { user, profile, updateProfileImage, sendVerificationEmail, refreshEmailVerification, isEmailVerified, logout } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshingStatus, setRefreshingStatus] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    setUploadingImage(true);
    try {
      const storagePath = `profiles/${user.uid}/${Date.now()}-${file.name}`;
      const sRef = storageRef(storage, storagePath);
      const uploadTask = uploadBytesResumable(sRef, file);

      await new Promise<void>((resolve, reject) => {
        uploadTask.on('state_changed', null, reject, async () => {
          try {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            await updateProfileImage(url);
            resolve();
          } catch (e) {
            reject(e);
          }
        });
      });

      toast.success('Profile image updated');
    } catch (err) {
      console.error('Upload failed:', err);
      toast.error('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleUpdate = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, cleanUndefined({
        displayName: formData.displayName || '',
        phone: formData.phone || '',
        address: formData.address || '',
        addresses: addresses || [],
        updatedAt: new Date().toISOString(),
      }));

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
    return <DashboardLayout><div className="text-center py-20 text-text-muted">Loading...</div></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-4xl">
        <Seo title="Profile" description="Manage your profile and account information." />

        {/* Header */}
        <div className="flex items-start justify-between border-b border-espresso/5 pb-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-caramel mb-2">Account</p>
            <h1 className="text-4xl font-display font-black text-espresso">Your Profile</h1>
            <p className="text-sm text-text-muted mt-2">Manage your personal information</p>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center gap-2 px-6 py-3 bg-espresso text-white rounded-lg font-bold hover:bg-caramel transition-colors"
          >
            {isEditing ? (
              <><X size={18} />Cancel</>
            ) : (
              <><Edit2 size={18} />Edit</>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Profile */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Image Card */}
            <div className="bg-white border border-espresso/5 rounded-2xl p-8">
              <div className="flex items-center gap-6">
                <div className="relative group">
                  <div className={cn(
                    "w-24 h-24 rounded-2xl overflow-hidden border-2 border-espresso/10 shadow-premium flex items-center justify-center",
                    profile.profileImage ? "" : "bg-espresso/5"
                  )}>
                    {profile.profileImage ? (
                      <ImageWithFallback src={profile.profileImage} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl font-black text-espresso/30">
                        {profile.displayName?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="absolute -bottom-2 -right-2 w-9 h-9 bg-caramel text-white rounded-full flex items-center justify-center shadow-premium hover:bg-espresso transition-colors"
                  >
                    {uploadingImage ? (
                      <RefreshCw size={14} className="animate-spin" />
                    ) : (
                      <Camera size={14} />
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-espresso">{profile.displayName}</h2>
                  <p className="text-sm text-text-muted">{profile.email}</p>
                  <span className="inline-block mt-1 px-3 py-1 bg-espresso/10 text-espresso text-xs font-bold rounded-full capitalize">{profile.role}</span>
                </div>
              </div>
            </div>

            {/* Email Verification */}
            <div className={cn(
              "border rounded-2xl p-6",
              isEmailVerified ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"
            )}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  {isEmailVerified ? (
                    <ShieldCheck size={24} className="text-green-600 shrink-0" />
                  ) : (
                    <AlertTriangle size={24} className="text-amber-600 shrink-0" />
                  )}
                  <div>
                    <p className="font-bold text-sm">
                      {isEmailVerified ? 'Email Verified' : 'Email Not Verified'}
                    </p>
                    <p className="text-xs mt-1">
                      {isEmailVerified
                        ? 'Your email address has been verified.'
                        : 'Please verify your email address to access all features.'}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {!isEmailVerified && (
                    <button
                      onClick={sendVerificationEmail}
                      className="shrink-0 px-4 py-2 bg-amber-600 text-white text-xs font-bold rounded-lg hover:bg-amber-700 transition-colors"
                    >
                      Resend
                    </button>
                  )}
                  <button
                    onClick={async () => {
                      setRefreshingStatus(true);
                      await refreshEmailVerification();
                      setRefreshingStatus(false);
                    }}
                    className="shrink-0 px-4 py-2 bg-white text-espresso text-xs font-bold rounded-lg border border-espresso/10 hover:bg-cream transition-colors"
                    disabled={refreshingStatus}
                  >
                    {refreshingStatus ? 'Refreshing…' : 'Refresh Status'}
                  </button>
                </div>
              </div>
            </div>

            {/* Personal Information */}
            <div className="bg-white border border-espresso/5 rounded-2xl p-8 space-y-6">
              <h2 className="text-xl font-bold text-espresso mb-6">Personal Information</h2>

              <div>
                <label htmlFor="profile-display-name" className="text-xs font-bold uppercase tracking-widest text-text-muted block mb-2">
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

              <div>
                <label htmlFor="profile-email" className="text-xs font-bold uppercase tracking-widest text-text-muted block mb-2">
                  Email Address
                </label>
                <div className="flex items-center gap-3">
                  <input
                    id="profile-email"
                    type="email"
                    value={profile.email}
                    disabled
                    className="flex-1 px-4 py-3 border border-espresso/10 rounded-lg bg-gray-50 font-semibold text-espresso"
                  />
                  {!isEmailVerified && (
                    <button
                      onClick={sendVerificationEmail}
                      className="shrink-0 px-4 py-3 bg-espresso text-white text-xs font-bold rounded-lg hover:bg-caramel transition-colors"
                    >
                      Verify
                    </button>
                  )}
                </div>
                <p className="text-xs text-text-muted mt-2">Cannot be changed</p>
              </div>

              <div>
                <label htmlFor="profile-phone" className="text-xs font-bold uppercase tracking-widest text-text-muted block mb-2">
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

              <div>
                <label htmlFor="profile-address" className="text-xs font-bold uppercase tracking-widest text-text-muted block mb-2">
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

              <div className="pt-6 border-t border-espresso/5 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-muted">Account Created</span>
                  <span className="font-bold text-espresso">
                    {new Date(profile.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-muted">Last Login</span>
                  <span className="font-bold text-espresso">
                    {profile.lastLogin ? new Date(profile.lastLogin).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>

              {isEditing && (
                <button
                  onClick={handleUpdate}
                  disabled={loading}
                  className="w-full py-3 bg-espresso text-white rounded-lg font-bold hover:bg-caramel disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  <Save size={18} />
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white border border-espresso/5 rounded-2xl p-6 space-y-4">
              <h3 className="font-bold text-espresso">Account Status</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">Status</span>
                  <span className="inline-flex items-center gap-2 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Active
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">Email</span>
                  <span className={cn(
                    "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold",
                    isEmailVerified ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                  )}>
                    <Mail size={12} />
                    {isEmailVerified ? 'Verified' : 'Unverified'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">Role</span>
                  <span className="font-bold capitalize text-espresso">{profile.role}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">Loyalty Points</span>
                  <span className="font-bold text-espresso">{profile.loyaltyPoints}</span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-espresso/5 rounded-2xl p-6 space-y-3">
              <button
                onClick={async () => {
                  try {
                    await sendPasswordResetEmail(auth, user.email);
                    toast.success('Password reset link sent to your email.');
                  } catch {
                    toast.error('Failed to send reset email.');
                  }
                }}
                className="w-full py-3 border border-espresso/20 text-espresso rounded-lg font-bold hover:bg-espresso/5 transition-colors text-sm"
              >
                Change Password
              </button>
              <button
                onClick={() => toast.info('Coming soon')}
                className="w-full py-3 border border-espresso/20 text-espresso rounded-lg font-bold hover:bg-espresso/5 transition-colors text-sm"
              >
                Privacy Settings
              </button>
              <button
                onClick={async () => {
                  await signOut(auth);
                  toast.success("You've been signed out.");
                  navigate('/');
                }}
                className="w-full py-3 border border-red-200 text-red-600 rounded-lg font-bold hover:bg-red-50 transition-colors text-sm flex items-center justify-center gap-2"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Addresses Section */}
        <div className="bg-white border border-espresso/5 rounded-2xl p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-espresso">Saved Addresses</h2>
            {isEditing && (
              <button
                onClick={() => setShowAddressForm(!showAddressForm)}
                className="px-4 py-2 bg-espresso text-white rounded-lg text-sm font-bold hover:bg-caramel transition-colors"
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
                      <p className="text-xs text-text-muted">
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
                      <button onClick={() => toast.info('Edit address feature coming soon.')} className="text-xs text-caramel hover:text-espresso">Edit</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-muted text-center py-8">No addresses saved yet</p>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
