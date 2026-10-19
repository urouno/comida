/* Mi día · service worker
   Guarda la app en el teléfono para que abra sin internet.
   Si algún día cambias index.html, súbele el número a VERSION
   para que el teléfono se traiga la versión nueva. */

const VERSION = 'mi-dia-v1';
const ARCHIVOS = [
  './',
  './index.html',
  './manifest.json',
  './icon-180.png',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(VERSION)
      .then(c => c.addAll(ARCHIVOS))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())   // si falla un archivo, igual instala
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;                       // los POST van directo a Apps Script

  const url = new URL(req.url);

  // Nunca guardes en caché las respuestas de Google: siempre datos frescos,
  // y si no hay red, que falle rápido para que la app use lo del teléfono.
  if (url.hostname.indexOf('google.com') !== -1) return;

  // Tipografías: guárdalas la primera vez y de ahí en adelante sírvelas de caché.
  if (url.hostname.indexOf('gstatic.com') !== -1 || url.hostname.indexOf('googleapis.com') !== -1) {
    e.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(res => {
        const copia = res.clone();
        caches.open(VERSION).then(c => c.put(req, copia));
        return res;
      }).catch(() => hit))
    );
    return;
  }

  // La app: primero la red (para traer cambios), con la caché como respaldo.
  e.respondWith(
    fetch(req)
      .then(res => {
        const copia = res.clone();
        caches.open(VERSION).then(c => c.put(req, copia));
        return res;
      })
      .catch(() => caches.match(req).then(hit => hit || caches.match('./index.html')))
  );
});
