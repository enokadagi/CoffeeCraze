import { Link, useLocation } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import Seo from '../components/common/SEO';

export default function SubscriptionConfirmation() {
  const location = useLocation();
  const planName = (location.state as { planName?: string } | null)?.planName;

  return (
    <div className="pt-24 pb-24 min-h-screen bg-cream flex items-center">
      <Seo title="Subscription Confirmed" description="Your subscription has been confirmed." />
      <div className="page-container mx-auto text-center">
        <div className="max-w-2xl mx-auto bg-white/60 backdrop-blur-3xl border border-white/60 rounded-[2rem] p-8 sm:p-12 shadow-premium">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-espresso text-caramel rounded-full flex items-center justify-center shadow-premium-lg">
              <CheckCircle size={36} className="text-white" />
            </div>
          </div>
          <h1 className="text-fluid-heading font-display font-black text-espresso mb-4">Subscription Initialized</h1>
          <p className="text-fluid-body text-coffee-500 mb-6">
            Thank you — your ritual subscription {planName ? `for ${planName}` : ''} is active. You will receive an email with details and the first delivery schedule.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link to="/dashboard/subscriptions" className="btn-premium px-8 py-3">Manage Subscription</Link>
            <Link to="/shop" className="btn-outline px-8 py-3">Continue Shopping</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
