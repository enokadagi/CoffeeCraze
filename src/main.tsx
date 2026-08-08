import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './styles/design-system/index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Register the Firebase Messaging service worker for push notifications.
// Runs after the app is fully loaded to avoid blocking first paint.
// Vite's dev server middleware (vite.config.ts) also injects the Firebase config
// as `__VITE_FIREBASE_*__` placeholders, so SW registration works in dev too.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/firebase-messaging-sw.js')
      .then((registration) => {
        console.log('[SW] Service worker registered:', registration.scope);
      })
      .catch((err) => {
        console.warn('[SW] Service worker registration failed:', err);
      });
  });
}
