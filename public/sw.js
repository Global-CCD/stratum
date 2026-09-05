// public/sw.js - Offline-First Service Worker
const CACHE_NAME = 'pe-cache-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/css/main.css',
  '/js/app.js',
  '/js/db.js',
  '/js/validator.js',
  '/js/scoring.js',
  '/js/vectorMath.js',
  '/js/proofGate.js',
  '/js/qaAudit.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then(res => res || fetch(e.request))
  );
});