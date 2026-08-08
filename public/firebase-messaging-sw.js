/* eslint-env serviceworker */
/* global importScripts, firebase */
// Firebase Messaging Service Worker
// This file must be served from the root of the site (public/firebase-messaging-sw.js)
// It uses the compat SDK because importScripts cannot import ES modules directly.

importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

// These placeholders are replaced at build time by the Vite plugin
// `injectFirebaseConfigIntoSw` in vite.config.ts. Do NOT edit the keys —
// they must exactly match the env var names.
firebase.initializeApp({
  apiKey: '__VITE_FIREBASE_API_KEY__',
  authDomain: '__VITE_FIREBASE_AUTH_DOMAIN__',
  projectId: '__VITE_FIREBASE_PROJECT_ID__',
  storageBucket: '__VITE_FIREBASE_STORAGE_BUCKET__',
  messagingSenderId: '__VITE_FIREBASE_MESSAGING_SENDER_ID__',
  appId: '__VITE_FIREBASE_APP_ID__',
});

const messaging = firebase.messaging();

// Background message handler — displays a notification when the app is closed / backgrounded.
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  const notificationTitle = payload.notification?.title || 'CoffeeCraze';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new update from CoffeeCraze.',
    icon: payload.notification?.icon || '/logo192.svg',
    badge: '/logo192.svg',
    data: payload.data || {},
    vibrate: [200, 100, 200],
    tag: payload.data?.tag || 'coffeecraze-notification',
    renotify: true,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click — open the app and navigate to the relevant page if possible.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      return clients.openWindow(targetUrl);
    })
  );
});

// Cache the app shell for offline support.
const CACHE_NAME = 'coffeecraze-shell-v1';
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/logo192.svg',
  '/logo512.svg',
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      )
    ).then(() => self.clients.claim())
  );
});

// Handle push events directly if onBackgroundMessage is not invoked.
self.addEventListener('push', (event) => {
  let data = null;
  try {
    data = event.data?.json();
  } catch {
    data = null;
  }
  const title = data?.notification?.title || data?.title || 'CoffeeCraze';
  const options = {
    body: data?.notification?.body || data?.body || 'You have a new update from CoffeeCraze.',
    icon: data?.notification?.icon || '/logo192.svg',
    badge: '/logo192.svg',
    data: data?.data || data || {},
    vibrate: [200, 100, 200],
    tag: data?.data?.tag || 'coffeecraze-notification',
    renotify: true,
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

