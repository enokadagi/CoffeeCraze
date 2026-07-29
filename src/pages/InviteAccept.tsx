import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import Seo from '../components/common/SEO';

export default function InviteAccept() {
  const { email } = useParams<{ email: string }>();
  const { user } = useAuth();
  const [status, setStatus] = useState<'loading' | 'accepted' | 'not_found' | 'sign_in'>('loading');
  const [inviteData, setInviteData] = useState<{ name: string; role: string } | null>(null);

  useEffect(() => {
    if (!email) { setStatus('not_found'); return; }
    const decodedEmail = decodeURIComponent(email);

    (async () => {
      const inviteRef = doc(db, 'employee_invites', decodedEmail);
      const snap = await getDoc(inviteRef);
      if (!snap.exists()) { setStatus('not_found'); return; }

      const data = snap.data();
      setInviteData({ name: data.name || '', role: data.role || '' });

      if (!user) { setStatus('sign_in'); return; }

      const userEmail = (user.email || '').toLowerCase();
      if (userEmail !== decodedEmail) {
        setStatus('not_found');
        return;
      }

      await updateDoc(doc(db, 'users', user.uid), {
        role: data.role,
        permissions: data.permissions || [],
        status: 'active',
        updatedAt: new Date().toISOString(),
      });
      await deleteDoc(inviteRef);
      setStatus('accepted');
    })();
  }, [email, user]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="w-8 h-8 border-2 border-espresso/10 border-t-espresso rounded-full animate-spin" />
      </div>
    );
  }

  if (status === 'not_found') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <Seo title="Invitation Not Found" description="This invitation link is invalid or expired." />
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-espresso">Invitation Not Found</h1>
          <p className="text-text-secondary">This invitation link is invalid or has already been used.</p>
          <Link to="/" className="text-caramel hover:underline font-semibold">Go Home</Link>
        </div>
      </div>
    );
  }

  if (status === 'sign_in') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <Seo title="You're Invited!" description="Accept your invitation to join the team." />
        <div className="text-center space-y-4 max-w-md mx-auto p-8">
          <h1 className="text-2xl font-bold text-espresso">You're Invited!</h1>
          {inviteData && <p className="text-text-secondary">You've been invited as <strong>{inviteData.role}</strong>.</p>}
          <p className="text-text-secondary">Sign in with the email address where you received this invitation to accept.</p>
          <Link
            to="/auth"
            className="inline-block px-8 py-3 bg-caramel text-white rounded-xl font-bold hover:bg-espresso transition-colors"
          >
            Sign In to Accept
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream">
      <Seo title="Invitation Accepted!" description="You've joined the team." />
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold text-espresso">Welcome to the Team!</h1>
        <p className="text-text-secondary">Your invitation has been accepted. You now have access as <strong>{inviteData?.role}</strong>.</p>
        <Link to={inviteData?.role === 'driver' ? '/driver' : '/admin'} className="inline-block px-8 py-3 bg-caramel text-white rounded-xl font-bold hover:bg-espresso transition-colors">
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
