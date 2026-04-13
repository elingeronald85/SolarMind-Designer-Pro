// ─────────────────────────────────────────────────────────────────────────────
// SolarMind Designer Pro — service-worker.js  v7.0
// OBLIGATORIO en la misma carpeta que index.html en el repositorio GitHub.
// ─────────────────────────────────────────────────────────────────────────────
const CACHE = 'solarmind-v7';

const PRECACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-512-maskable.png',
  './apple-touch-icon.png',
  'https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.23.2/babel.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.all(PRECACHE.map(url =>
        c.add(new Request(url, { mode:'cors', credentials:'same-origin' })).catch(()=>{})
      )))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  // No interceptar APIs de datos
  if (url.hostname.includes('supabase.co') ||
      url.hostname.includes('anthropic.com') ||
      url.hostname.includes('generativelanguage')) return;

  // CDN: cache-first
  if (url.hostname.includes('cdnjs.cloudflare.com') ||
      url.hostname.includes('fonts.googleapis.com') ||
      url.hostname.includes('fonts.gstatic.com')) {
    e.respondWith(
      caches.match(e.request).then(c => c || fetch(e.request).then(r => {
        if (r && r.status === 200) {
          const cl = r.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, cl));
        }
        return r;
      }).catch(() => new Response('', {status:503})))
    );
    return;
  }

  // App: network-first con fallback a caché
  e.respondWith(
    fetch(e.request)
      .then(r => {
        if (r && r.status === 200 && r.type !== 'opaque') {
          const cl = r.clone();
          caches.open(CACHE).then(c => c.put(e.request, cl));
        }
        return r;
      })
      .catch(() => caches.match(e.request)
        .then(c => c || caches.match('./index.html')
          .then(root => root || new Response(
            '<h2 style="font-family:sans-serif;padding:2rem;color:#f59e0b">SolarMind — Sin conexión</h2>',
            {headers:{'Content-Type':'text/html;charset=utf-8'}}
          ))
        )
      )
  );
});

self.addEventListener('message', e => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});
