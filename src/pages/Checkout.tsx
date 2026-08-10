import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { OrdersApi, OrdersApiError, type ServerQuote } from '../services/ordersApi';
import { useSiteSettings } from '../hooks/useSiteSettings';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import Seo from '../components/common/SEO';
import LocationPicker from '../components/checkout/LocationPicker';
import { cn } from '../lib/utils';
import { LEBANON_CITIES } from '../data/lebanonCities';
import {
  CreditCard,
  ShieldCheck,
  ArrowRight,
  ChevronLeft,
  MapPin,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  RefreshCw,
  Server,
} from 'lucide-react';

export default function Checkout() {
  const navigate = useNavigate();
  const { items, total, clearCart, appliedCoupon, setAppliedCoupon } = useCart();
  const { user, profile, isEmailVerified } = useAuth();
  const siteSettings = useSiteSettings();

  const [step, setStep] = useState(1); // 1: Shipping, 2: Payment, 3: Scheduling, 4: Review
  const [loading, setLoading] = useState(false);

  // Server-confirmed quote (Phase 1: the client never computes or writes totals)
  const [serverQuote, setServerQuote] = useState<ServerQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const requestIdRef = useRef<string>(crypto.randomUUID());

  const today = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    // Shipping Info
    firstName: profile?.displayName?.split(' ')[0] || '',
    lastName: profile?.displayName?.split(' ')?.slice(1).join(' ') || '',
    phone: profile?.phone || '',
    street: '',
    building: '',
    floor: '',
    city: '',

    // Delivery Scheduling
    deliveryDate: '',
    deliveryTimeWindow: 'Morning (9:00 AM - 12:00 PM)',

    // Payment
    paymentMethod: 'cash_on_delivery',

    // Additional
    customNotes: '',
    gateCode: '',

    // Geolocation
    gpsCoordinates: null as { lat: number; lng: number } | null,
  });

  const handleGpsChange = useCallback((pos: { lat: number; lng: number }) => {
    setFormData((prev) => ({ ...prev, gpsCoordinates: pos }));
  }, []);

  useEffect(() => {
    if (!items.length) {
      navigate('/shop');
    }
  }, [items.length, navigate]);

  useEffect(() => {
    if (!profile) return;

    const [firstName = '', ...lastNameParts] = profile.displayName?.split(' ') || [];

    // Find default saved address or fallback to first saved address
    const defaultAddress = profile.addresses?.find(a => a.isDefault || a.id === profile.defaultAddressId) || profile.addresses?.[0];

    setFormData((prev) => ({
      ...prev,
      firstName: prev.firstName || firstName,
      lastName: prev.lastName || lastNameParts.join(' '),
      phone: prev.phone || profile.phone || '',
      street: prev.street || defaultAddress?.street || defaultAddress?.address || '',
      building: prev.building || defaultAddress?.building || '',
      floor: prev.floor || defaultAddress?.floor || '',
      city: prev.city || defaultAddress?.city || '',
      gateCode: prev.gateCode || defaultAddress?.gateCode || '',
      customNotes: prev.customNotes || defaultAddress?.instructions || '',
      gpsCoordinates: prev.gpsCoordinates || defaultAddress?.gpsCoordinates || null,
    }));
  }, [profile]);

  const timeSlots = [
    'Morning (9:00 AM - 12:00 PM)',
    'Afternoon (12:00 PM - 4:00 PM)',
    'Evening (4:00 PM - 8:00 PM)',
  ];

  const paymentMethods = [
    { id: 'cash_on_delivery', label: 'Cash on Delivery', note: 'Pay the courier in LBP or USD when your order arrives.', icon: '💵' },
  ];

  // Client-side estimate (display only — the server quote is authoritative)
  const exchangeRate = siteSettings?.exchangeRate ?? 89500;
  const deliveryFeeLbp = siteSettings?.deliveryFeeLbp ?? 25000;
  const freeDeliveryThresholdLbp = siteSettings?.freeDeliveryThresholdLbp ?? 1500000;

  const subtotalLbp = total;
  const shippingLbp = subtotalLbp > freeDeliveryThresholdLbp ? 0 : deliveryFeeLbp;
  const couponDiscountLbp = appliedCoupon ? Math.floor(subtotalLbp * (appliedCoupon.discountPercent / 100)) : 0;
  const grandTotalLbp = Math.max(0, subtotalLbp + shippingLbp - couponDiscountLbp);
  const grandTotalUsd = grandTotalLbp / exchangeRate;

  const loadQuote = useCallback(async () => {
    if (!user) return;
    setQuoteLoading(true);
    setQuoteError(null);
    try {
      const token = await user.getIdToken();
      const itemsForQuote = items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        ...(item.selectedVariant?.id ? { variantId: item.selectedVariant.id } : {}),
      }));
      const res = await OrdersApi.quote(itemsForQuote, appliedCoupon?.code ?? null, token);
      setServerQuote(res.quote);
    } catch (err) {
      console.error('[Checkout] quote failed:', err);
      setServerQuote(null);
      if (err instanceof OrdersApiError && err.status === 401) {
        setQuoteError('Session expired. Please reload the page and try again.');
      } else {
        setQuoteError('Could not confirm prices with our server. Online ordering is temporarily unavailable — please call us at +961 71 972 495 or email contact@coffeecraze.com.');
      }
    } finally {
      setQuoteLoading(false);
    }
  }, [user, items, appliedCoupon]);

  // Fetch the authoritative quote when the customer reaches the Review step.
  useEffect(() => {
    if (step === 4 && !serverQuote && !quoteLoading) {
      loadQuote();
    }
  }, [step, serverQuote, quoteLoading, loadQuote]);

  let buttonLabel = 'Continue';
  if (loading) {
    buttonLabel = 'Processing...';
  } else if (step === 4) {
    buttonLabel = 'Place Order';
  }

  const quoteBlocked = step === 4 && !!quoteError;
  const quoteHasBlockers = step === 4 && !!serverQuote && !serverQuote.ok;

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();

    if (!user) {
      toast.error('Please login to complete your order');
      return;
    }

    if (!isEmailVerified) {
      toast.error('Please verify your email before placing an order. Go to your Profile to resend the verification email.');
      return;
    }

    // Force refresh the Firebase ID token so the API sees the verified email
    try {
      await user.getIdToken(true);
    } catch {
      toast.error('Session refresh failed. Please reload and try again.');
      return;
    }

    if (step < 4) {
      setStep(step + 1);
      return;
    }

    if (!formData.deliveryDate) {
      toast.error('Please select a delivery date');
      return;
    }

    if (quoteBlocked) {
      toast.error('Online ordering is temporarily unavailable. Please contact us at +961 71 972 495.');
      return;
    }
    if (quoteHasBlockers) {
      toast.error('Some items in your cart cannot be ordered. Please review the warnings and try again.');
      return;
    }

    const token = await user.getIdToken();
    const shippingAddress = {
      fullName: `${formData.firstName} ${formData.lastName}`.trim(),
      street: formData.street,
      building: formData.building,
      floor: formData.floor,
      city: formData.city,
      phone: formData.phone,
      gateCode: formData.gateCode,
      instructions: formData.customNotes,
      gpsCoordinates: formData.gpsCoordinates,
    };

    setLoading(true);
    try {
      const res = await OrdersApi.create(
        {
          requestId: requestIdRef.current,
          items: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            ...(item.selectedVariant?.id ? { variantId: item.selectedVariant.id } : {}),
          })),
          couponCode: appliedCoupon?.code ?? null,
          shipping: shippingAddress,
          deliveryDate: formData.deliveryDate,
          deliveryTime: formData.deliveryTimeWindow,
          customNotes: formData.customNotes,
        },
        token
      );

      if (!res.ok || !res.orderId) {
        if (res.quote) setServerQuote(res.quote);
        toast.error(res.error ?? 'Order could not be placed. Please review your cart and try again.');
        setLoading(false);
        return;
      }
      const orderId = res.orderId;

      // Save shippingAddress to user profile if not already present
      try {
        const userRef = doc(db, 'users', user.uid);
        const existingAddresses = profile?.addresses || [];
        const isAlreadySaved = existingAddresses.some(
          (a) => a.street === shippingAddress.street && a.city === shippingAddress.city && a.building === shippingAddress.building
        );
        if (!isAlreadySaved) {
          const addressToSave = {
            id: `addr-${Date.now()}`,
            fullName: shippingAddress.fullName,
            name: shippingAddress.fullName,
            email: user.email || '',
            street: shippingAddress.street,
            building: shippingAddress.building,
            floor: shippingAddress.floor,
            apartment: '',
            city: shippingAddress.city,
            country: 'Lebanon',
            phone: shippingAddress.phone,
            phoneNumber: shippingAddress.phone,
            isDefault: existingAddresses.length === 0,
            instructions: formData.customNotes,
            gateCode: formData.gateCode,
            landmark: '',
            postalCode: '',
            ...(formData.gpsCoordinates ? { gpsCoordinates: formData.gpsCoordinates } : {}),
          };
          await updateDoc(userRef, {
            addresses: [...existingAddresses, addressToSave],
            address: profile?.address || `${shippingAddress.street}, ${shippingAddress.city}`,
          });
        }
      } catch (err) {
        console.error('[Checkout] Profile update failed (order still created):', (err as Error)?.message, err);
      }

      toast.success('Order placed successfully!');
      clearCart();
      setAppliedCoupon(null);
      navigate(`/order-success/${orderId}`);
    } catch (err) {
      console.error('[Checkout] OrderService.create FAILED:', err);
      if (err instanceof OrdersApiError) {
        if (err.status === 409 && (err.details as { quote?: ServerQuote })?.quote) {
          setServerQuote((err.details as { quote: ServerQuote }).quote);
        }
        if (err.status === 401) toast.error('Session expired. Please reload and try again.');
        else toast.error(err.message);
      } else {
        toast.error('Network error. Check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    navigate('/shop');
    return null;
  }

  const summaryItems = serverQuote ? serverQuote.items : items;

  return (
    <div className="min-h-screen bg-cream py-12 md:py-24">
      <Seo title="Checkout" description="Complete your CoffeeCraze order" />

      <div className="page-container">
        <div className="mb-12">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-caramel hover:text-espresso transition-colors mb-6"
          >
            <ChevronLeft size={18} />
            Back
          </button>
          <h1 className="text-5xl font-display font-black text-espresso italic mb-2">Checkout</h1>
          <p className="text-text-secondary">Complete your order in a few steps</p>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="flex items-center justify-between mb-8">
              {[1, 2, 3, 4].map((s) => (
                <div key={s} className="flex items-center">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all',
                      step >= s
                        ? 'bg-espresso text-white'
                        : 'bg-white border-2 border-espresso/20 text-text-muted'
                    )}
                  >
                    {step > s ? <CheckCircle2 size={20} /> : s}
                  </div>
                  {s < 4 && (
                    <div
                      className={cn(
                        'h-1 flex-1 mx-2 transition-all',
                        step > s ? 'bg-espresso' : 'bg-espresso/20'
                      )}
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between gap-2 text-center text-[10px] sm:text-xs font-bold uppercase tracking-widest">
              <span className={cn("flex-1", step >= 1 ? 'text-espresso' : 'text-text-muted')}>Ship</span>
              <span className="text-coffee-200">→</span>
              <span className={cn("flex-1", step >= 2 ? 'text-espresso' : 'text-text-muted')}>Pay</span>
              <span className="text-coffee-200">→</span>
              <span className={cn("flex-1", step >= 3 ? 'text-espresso' : 'text-text-muted')}>Sched</span>
              <span className="text-coffee-200">→</span>
              <span className={cn("flex-1", step >= 4 ? 'text-espresso' : 'text-text-muted')}>Review</span>
            </div>

            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-white rounded-2xl p-8 space-y-6"
                >
                  <h2 className="text-2xl font-bold text-espresso italic mb-6 flex items-center gap-3">
                    <MapPin size={24} /> Shipping Address
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="checkout-first-name" className="sr-only">
                        First Name
                      </label>
                      <input
                        id="checkout-first-name"
                        type="text"
                        placeholder="First Name"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className="w-full px-4 py-3 border border-espresso/10 rounded-lg font-semibold text-espresso"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="checkout-last-name" className="sr-only">
                        Last Name
                      </label>
                      <input
                        id="checkout-last-name"
                        type="text"
                        placeholder="Last Name"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className="w-full px-4 py-3 border border-espresso/10 rounded-lg font-semibold text-espresso"
                        required
                      />
                    </div>
                  </div>

                  <label htmlFor="checkout-phone" className="sr-only">
                    Phone Number
                  </label>
                  <input
                    id="checkout-phone"
                    type="tel"
                    placeholder="Phone Number"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="col-span-2 px-4 py-3 border border-espresso/10 rounded-lg font-semibold text-espresso w-full"
                    required
                  />

                  <label htmlFor="checkout-street" className="sr-only">
                    Street Address
                  </label>
                  <input
                    id="checkout-street"
                    type="text"
                    placeholder="Street Address"
                    value={formData.street}
                    onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                    className="w-full px-4 py-3 border border-espresso/10 rounded-lg font-semibold text-espresso"
                    required
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <input
                      type="text"
                      placeholder="Building"
                      value={formData.building}
                      onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                      className="w-full px-4 py-3 border border-espresso/10 rounded-lg font-semibold text-espresso"
                    />
                    <input
                      type="text"
                      placeholder="Floor"
                      value={formData.floor}
                      onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                      className="w-full px-4 py-3 border border-espresso/10 rounded-lg font-semibold text-espresso"
                    />
                    <div className="relative">
                      <select
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full px-4 py-3 border border-espresso/10 rounded-lg font-semibold text-espresso appearance-none bg-white"
                        required
                      >
                        <option value="">Select City *</option>
                        {LEBANON_CITIES.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                      <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                    </div>
                  </div>

                  <label htmlFor="checkout-gate-code" className="sr-only">
                    Gate Code
                  </label>
                  <input
                    id="checkout-gate-code"
                    type="text"
                    placeholder="Gate Code (optional)"
                    value={formData.gateCode}
                    onChange={(e) => setFormData({ ...formData, gateCode: e.target.value })}
                    className="w-full px-4 py-3 border border-espresso/10 rounded-lg font-semibold text-espresso"
                  />

                  {/* Live GPS Location with map */}
                  <LocationPicker
                    position={formData.gpsCoordinates}
                    onPositionChange={handleGpsChange}
                  />
                  {formData.gpsCoordinates && (
                    <button
                      type="button"
                      onClick={() => setFormData((p) => ({ ...p, gpsCoordinates: null }))}
                      className="text-xs text-text-muted hover:text-red-500 underline transition-colors"
                    >
                      Clear pinned location
                    </button>
                  )}

                  <label htmlFor="checkout-instructions" className="sr-only">
                    Delivery Instructions
                  </label>
                  <textarea
                    id="checkout-instructions"
                    placeholder="Delivery Instructions (optional)"
                    value={formData.customNotes}
                    onChange={(e) => setFormData({ ...formData, customNotes: e.target.value })}
                    className="w-full px-4 py-3 border border-espresso/10 rounded-lg font-semibold text-espresso h-24"
                  />
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-white rounded-2xl p-8 space-y-6"
                >
                  <h2 className="text-2xl font-bold text-espresso italic mb-6 flex items-center gap-3">
                    <CreditCard size={24} /> Payment Method
                  </h2>

                  <div className="space-y-3">
                    {paymentMethods.map((method) => (
                      <label
                        key={method.id}
                        className={cn(
                          'flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all',
                          formData.paymentMethod === method.id
                            ? 'border-espresso bg-espresso/10'
                            : 'border-espresso/20 bg-white'
                        )}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={method.id}
                          checked={formData.paymentMethod === method.id}
                          onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                          className="w-4 h-4 mr-4"
                        />
                        <span className="text-2xl mr-3">{method.icon}</span>
                        <span className="flex-1">
                          <span className="block font-bold text-espresso">{method.label}</span>
                          <span className="block text-xs text-text-muted mt-0.5">{method.note}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-white rounded-2xl p-8 space-y-6"
                >
                  <h2 className="text-2xl font-bold text-espresso italic mb-6 flex items-center gap-3">
                    <Calendar size={24} /> Delivery Scheduling
                  </h2>

                  <div>
                    <label htmlFor="checkout-delivery-date" className="text-xs font-bold uppercase tracking-widest text-text-muted block mb-2">
                      Delivery Date
                    </label>
                    <input
                      id="checkout-delivery-date"
                      type="date"
                      min={today}
                      value={formData.deliveryDate}
                      onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                      className="w-full px-4 py-3 border border-espresso/10 rounded-lg font-semibold text-espresso"
                      required
                    />
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-text-muted block mb-3">
                      Preferred Time Window
                    </p>
                    <div className="space-y-2">
                      {timeSlots.map((slot) => (
                        <label
                          key={slot}
                          className="flex items-center p-3 border border-espresso/10 rounded-lg cursor-pointer hover:bg-espresso/5 transition-all"
                        >
                          <input
                            type="radio"
                            name="timeSlot"
                            value={slot}
                            checked={formData.deliveryTimeWindow === slot}
                            onChange={(e) => setFormData({ ...formData, deliveryTimeWindow: e.target.value })}
                            className="w-4 h-4"
                          />
                          <Clock size={18} className="ml-3 text-caramel" />
                          <span className="ml-2 font-semibold text-espresso">{slot}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="checkout-instructions" className="text-xs font-bold uppercase tracking-widest text-text-muted block mb-2">
                      Special Instructions (optional)
                    </label>
                    <textarea
                      id="checkout-instructions"
                      value={formData.customNotes}
                      onChange={(e) => setFormData({ ...formData, customNotes: e.target.value })}
                      className="w-full px-4 py-3 border border-espresso/10 rounded-lg font-semibold text-espresso h-24"
                    />
                  </div>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-white rounded-2xl p-8 space-y-6"
                >
                  <h2 className="text-2xl font-bold text-espresso italic mb-6 flex items-center gap-3">
                    <CheckCircle2 size={24} /> Review Order
                  </h2>

                  <div className="space-y-4">
                    <div className="border-b border-espresso/10 pb-4">
                      <p className="text-xs font-bold uppercase tracking-widest text-text-muted mb-2">Shipping To</p>
                      <p className="font-semibold text-espresso">
                        {formData.firstName} {formData.lastName}
                      </p>
                      <p className="text-sm text-text-muted">
                        {formData.street}, {formData.building && `Bldg ${formData.building}`}
                        {formData.floor && `, Floor ${formData.floor}`}, {formData.city}
                      </p>
                      <p className="text-sm text-text-muted">{formData.phone}</p>
                    </div>

                    <div className="border-b border-espresso/10 pb-4">
                      <p className="text-xs font-bold uppercase tracking-widest text-text-muted mb-2">
                        Delivery Date & Time
                      </p>
                      <p className="font-semibold text-espresso">
                        {new Date(formData.deliveryDate).toLocaleDateString()} • {formData.deliveryTimeWindow}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-text-muted mb-2">Payment</p>
                      <p className="font-semibold text-espresso">
                        {paymentMethods.find((m) => m.id === formData.paymentMethod)?.label}
                      </p>
                    </div>
                  </div>

                  {quoteLoading && (
                    <div className="bg-espresso/5 border border-espresso/10 rounded-lg p-4 flex items-center gap-3">
                      <RefreshCw size={20} className="text-caramel animate-spin flex-shrink-0" />
                      <p className="text-sm text-espresso">Confirming prices with our server...</p>
                    </div>
                  )}

                  {quoteBlocked && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                      <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-red-800">
                        <p className="font-bold mb-1">Ordering unavailable right now</p>
                        <p>{quoteError}</p>
                        <button
                          type="button"
                          onClick={() => { setServerQuote(null); loadQuote(); }}
                          className="mt-2 inline-flex items-center gap-1 font-semibold underline"
                        >
                          <RefreshCw size={14} /> Try again
                        </button>
                      </div>
                    </div>
                  )}

                  {quoteHasBlockers && serverQuote && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                      <AlertCircle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-amber-800">
                        <p className="font-bold mb-1">Your order cannot be completed</p>
                        <ul className="list-disc pl-4 space-y-0.5">
                          {serverQuote.blockers.map((b, i) => <li key={i}>{b}</li>)}
                        </ul>
                      </div>
                    </div>
                  )}

                  {serverQuote && serverQuote.ok && serverQuote.items.some((it) => it.priceChanged) && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                      <AlertCircle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-amber-800">
                        <p className="font-bold mb-1">Prices updated</p>
                        <p>Some prices changed since you added items to your cart. The totals below are the final confirmed prices.</p>
                      </div>
                    </div>
                  )}

                  {serverQuote && serverQuote.ok && !quoteHasBlockers && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-start gap-3">
                      <Server size={20} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-emerald-800">
                        <p className="font-bold mb-1">Prices confirmed</p>
                        <p>Totals were verified against our current catalog. Placing the order reserves the items and locks these prices.</p>
                      </div>
                    </div>
                  )}

                  {!quoteLoading && !quoteBlocked && !serverQuote && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                      <AlertCircle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-amber-800">
                        <p className="font-bold mb-1">Please Review</p>
                        <p>Make sure all details are correct before confirming your order.</p>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex gap-4 mt-8">
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="flex-1 py-4 border-2 border-espresso text-espresso rounded-lg font-bold hover:bg-espresso/5 transition-all flex items-center justify-center gap-2"
                >
                  <ChevronLeft size={20} />
                  Previous
                </button>
              )}
              <button
                type="submit"
                disabled={loading || quoteBlocked || quoteHasBlockers}
                className="flex-1 py-4 bg-espresso text-white rounded-lg font-bold hover:bg-espresso/90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {buttonLabel}
                {!loading && <ArrowRight size={20} />}
              </button>
            </div>
          </div>

          <div className="h-fit sticky top-8">
            <div className="bg-white rounded-2xl p-8 border border-espresso/5 space-y-6">
              <h3 className="text-xl font-bold text-espresso italic">Order Summary</h3>

              {serverQuote && (
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full px-3 py-1 w-fit">
                  <Server size={12} /> Server-confirmed prices
                </div>
              )}

              <div className="space-y-3 max-h-64 overflow-y-auto">
                {summaryItems.map((item, idx) => {
                  const name = (item as { name?: string }).name ?? 'Item';
                  const qty = (item as { quantity?: number }).quantity ?? 1;
                  const unitPrice = 'unitPriceLbp' in item ? (item as { unitPriceLbp: number }).unitPriceLbp : (item as { price?: number }).price ?? 0;
                  const variantName = 'variantName' in item && item.variantName ? ` • ${item.variantName}` : '';
                  const statusBadge = 'status' in item && item.status !== 'ok' ? (item as { status: string }).status : null;
                  return (
                    <div
                      key={idx}
                      className={cn('flex items-center justify-between text-sm pb-3 border-b border-espresso/5', statusBadge && 'opacity-70')}
                    >
                      <div>
                        <p className="font-semibold text-espresso">{name}</p>
                        <p className="text-xs text-text-muted">
                          {variantName}×{qty}
                        </p>
                        {statusBadge && (
                          <p className="text-[11px] font-semibold text-red-600 uppercase">
                            {statusBadge === 'insufficient_stock' ? `Only ${(item as { availableStock?: number }).availableStock ?? 0} left` : 'Unavailable'}
                          </p>
                        )}
                      </div>
                      <p className="font-bold text-espresso">{unitPrice ? unitPrice.toLocaleString() : ''}</p>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-3 border-t border-espresso/10 pt-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-muted">Subtotal (LBP)</span>
                  <span className="font-semibold text-espresso">
                    {(serverQuote ? serverQuote.subtotalLbp : Math.max(0, subtotalLbp)).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-muted">Delivery</span>
                  <span className="font-semibold text-espresso">
                    {(serverQuote ? serverQuote.shippingLbp : shippingLbp).toLocaleString()} LBP
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-muted">Total (USD)</span>
                  <span className="font-semibold text-espresso">
                    ${(serverQuote ? serverQuote.totalUsd : grandTotalUsd).toFixed(2)}
                  </span>
                </div>
                {appliedCoupon && (
                  <div className="flex items-center justify-between text-sm text-emerald-600">
                    <span>Coupon ({appliedCoupon.code})</span>
                    <span className="font-semibold">
                      -{(serverQuote ? serverQuote.discountLbp : couponDiscountLbp).toLocaleString()} LBP
                    </span>
                  </div>
                )}
                <div className="bg-espresso/5 border border-espresso/10 rounded-lg p-4 flex items-center justify-between">
                  <span className="font-bold text-espresso">Final Total</span>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-espresso italic">
                      ${(serverQuote ? serverQuote.totalUsd : grandTotalUsd).toFixed(2)}
                    </p>
                    <p className="text-xs text-text-muted">
                      ~ {(serverQuote ? serverQuote.totalLbp : Math.round(grandTotalLbp)).toLocaleString()} LBP
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-text-muted justify-center">
                <ShieldCheck size={16} /> Secure Checkout
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
