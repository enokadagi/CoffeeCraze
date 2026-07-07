import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, Coffee, Bell } from 'lucide-react';
import { NotificationService } from '../../services/notification';

const LS_KEY = 'pwa-prompt-dismissed';
const DAY_MS = 86400000;

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [show, setShow] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };
    window.addEventListener('beforeinstallprompt', handler);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstallable(false);
      return;
    }

    const stored = localStorage.getItem(LS_KEY);
    if (stored) {
      try {
        const { count, lastDismissed } = JSON.parse(stored);
        const elapsed = Date.now() - lastDismissed;
        const delay = count >= 3 ? 30 * DAY_MS : count >= 1 ? 7 * DAY_MS : 3 * DAY_MS;
        if (elapsed < delay) return;
      } catch { /* ignore */ }
    }

    const check = () => setIsInstallable(true);
    const timer = setTimeout(check, 5000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (isInstallable) {
      const stored = localStorage.getItem(LS_KEY);
      if (stored) {
        try {
          const { count, lastDismissed } = JSON.parse(stored);
          const elapsed = Date.now() - lastDismissed;
          const delay = count >= 3 ? 30 * DAY_MS : count >= 1 ? 7 * DAY_MS : 3 * DAY_MS;
          if (elapsed < delay) return;
        } catch { /* ignore */ }
      }
      setShow(true);
    }
  }, [isInstallable]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    if (result.outcome === 'accepted') {
      setShow(false);
      setIsInstallable(false);
      localStorage.removeItem(LS_KEY);
      setShowNotificationPrompt(true);
    }
    setDeferredPrompt(null);
  };

  const handleAllowNotifications = async () => {
    setShowNotificationPrompt(false);
    await NotificationService.requestPermission();
  };

  const handleDismissNotifications = () => {
    setShowNotificationPrompt(false);
  };

  const handleDismiss = () => {
    setShow(false);
    const stored = localStorage.getItem(LS_KEY);
    let count = 0;
    if (stored) {
      try { count = (JSON.parse(stored).count || 0) + 1; } catch { count = 1; }
    } else {
      count = 1;
    }
    localStorage.setItem(LS_KEY, JSON.stringify({ count, lastDismissed: Date.now() }));
  };

  return (
    <>
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 left-4 right-4 z-[9999] max-w-md mx-auto"
          >
            <div className="bg-[var(--color-surface)] border border-border rounded-3xl shadow-premium-xl p-5 flex items-center gap-4">
              <div className="w-14 h-14 bg-caramel/10 rounded-2xl flex items-center justify-center shrink-0">
                <Coffee size={24} className="text-caramel" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-espresso">Install CoffeeCraze</p>
                <p className="text-xs text-text-muted mt-0.5">Get the full experience, order faster, and enjoy offline access.</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleInstall}
                  className="w-10 h-10 bg-caramel text-white rounded-xl flex items-center justify-center hover:bg-caramel/90 transition-colors"
                  aria-label="Install app"
                >
                  <Download size={18} />
                </button>
                <button
                  onClick={handleDismiss}
                  className="w-10 h-10 bg-cream text-text-muted rounded-xl flex items-center justify-center hover:bg-cream transition-colors"
                  aria-label="Dismiss"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showNotificationPrompt && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 left-4 right-4 z-[9999] max-w-md mx-auto"
          >
            <div className="bg-[var(--color-surface)] border border-border rounded-3xl shadow-premium-xl p-5 flex items-center gap-4">
              <div className="w-14 h-14 bg-caramel/10 rounded-2xl flex items-center justify-center shrink-0">
                <Bell size={24} className="text-caramel" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-espresso">Stay Updated</p>
                <p className="text-xs text-text-muted mt-0.5">Get notified when your order status changes or a new delivery is on its way.</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleAllowNotifications}
                  className="px-3 py-2 bg-caramel text-white text-xs font-bold rounded-xl hover:bg-caramel/90 transition-colors whitespace-nowrap"
                >
                  Allow
                </button>
                <button
                  onClick={handleDismissNotifications}
                  className="px-3 py-2 bg-cream text-text-muted text-xs font-bold rounded-xl hover:bg-cream transition-colors"
                >
                  Skip
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
