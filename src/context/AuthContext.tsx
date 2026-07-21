import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, getRedirectResult, User, signOut, sendEmailVerification } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserProfile, UserRole } from '../types';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  refreshEmailVerification: () => Promise<void>;
  updateProfileImage: (imageUrl: string) => Promise<void>;
  isEmailVerified: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEmailVerified, setIsEmailVerified] = useState(false);

  useEffect(() => {
    let unsubscribeSnapshot: () => void = () => {};

    // IMPORTANT: getRedirectResult MUST be called before onAuthStateChanged.
    // onAuthStateChanged can consume the redirect result, leaving getRedirectResult
    // with nothing when called later (e.g. from Auth.tsx).
    getRedirectResult(auth).then((result) => {
      if (result) {
        console.log('[AuthProvider] Redirect sign-in completed for', result.user.email);
      }
    }).catch((err) => {
      console.warn('[AuthProvider] getRedirectResult error (non-fatal):', err?.code || err?.message || err);
    });

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      setIsEmailVerified(user?.emailVerified ?? false);
      
      if (user) {
        const docRef = doc(db, 'users', user.uid);

        // Ensure profile doc exists (fire-and-forget to avoid race with onSnapshot)
        getDoc(docRef).then(async (snap) => {
          if (!snap.exists()) {
            const emailPrefix = user.email ? user.email.split('@')[0] : 'Guest';
            const capitalizedName = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
            const finalDisplayName = user.displayName && !user.displayName.toLowerCase().includes('coffee')
              ? user.displayName
              : capitalizedName;
            const newProfile: UserProfile = {
              uid: user.uid,
              email: user.email || '',
              displayName: finalDisplayName,
              role: UserRole.CUSTOMER,
              loyaltyPoints: 0,
              totalSpent: 0,
              createdAt: new Date().toISOString(),
              onboarded: false,
              emailVerified: user.emailVerified,
              profileImage: user.photoURL || undefined,
            };
            await setDoc(docRef, newProfile, { merge: true }).catch((err) => console.error('Profile creation error:', err));
          }
        }).catch((err) => console.error('Profile check error:', err));
        
        // Listen to real-time changes so profile updates immediately when modified
        unsubscribeSnapshot = onSnapshot(docRef,
          (docSnap) => {
            try {
              if (docSnap.exists()) {
                const profileData = docSnap.data() as UserProfile;
                if (profileData.status === 'disabled' || profileData.status === 'suspended') {
                  toast.error(`Your account has been ${profileData.status}. Logged out.`);
                  signOut(auth).catch(() => {});
                  setProfile(null);
                  setUser(null);
                  return;
                }
                setProfile(profileData);
              }
              setLoading(false);
            } catch (err) {
              console.error('Profile listener error:', err);
              setLoading(false);
            }
          },
          (error) => {
            console.error('Profile listener failed:', error);
            setLoading(false);
          }
        );
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeSnapshot();
    };
  }, []);

  const logout = async () => {
    await signOut(auth);
  };

  const refreshEmailVerification = async () => {
    if (!user) {
      toast.error('User not authenticated');
      return;
    }

    try {
      await user.reload();
      setIsEmailVerified(user.emailVerified);

      if (profile && profile.emailVerified !== user.emailVerified) {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, { emailVerified: user.emailVerified });
        setProfile({ ...profile, emailVerified: user.emailVerified });
      }
    } catch (error) {
      console.error('Failed to refresh verification status:', error);
      toast.error('Unable to refresh verification status. Please try again.');
    }
  };

  const sendVerificationEmail = async () => {
    if (!user) {
      toast.error('User not authenticated');
      return;
    }

    try {
      await sendEmailVerification(user);
      toast.success('Verification email sent! Check your inbox.');
    } catch (error) {
      console.error('Failed to send verification email:', error);
      toast.error('Failed to send verification email. Please try again.');
    }
  };

  const updateProfileImage = async (imageUrl: string) => {
    if (!user || !profile) {
      toast.error('User not authenticated');
      return;
    }

    try {
      const docRef = doc(db, 'users', user.uid);
      await updateDoc(docRef, {
        profileImage: imageUrl,
      });
      setProfile({ ...profile, profileImage: imageUrl });
      toast.success('Profile image updated successfully!');
    } catch (error) {
      console.error('Failed to update profile image:', error);
      toast.error('Failed to update profile image. Please try again.');
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      loading, 
      logout,
      sendVerificationEmail,
      refreshEmailVerification,
      updateProfileImage,
      isEmailVerified
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
