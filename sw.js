// SWEAT4 Trainer-Logbuch – Offline-Cache. Bei Updates VERSION erhöhen.
const VERSION = 'sweat4-v24';
const FILES = ['./', 'index.html', 'manifest.webmanifest', 'uebungen-katalog.js', 'uebungen-medien.js', 'lebensmittel.js', 'uebungen3d.js', 'three.min.js', 'icon-180.png', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png'];
// Fehlende Dateien (z. B. Übungskatalog) dürfen die Installation nicht blockieren
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => Promise.all(FILES.map(f => c.add(f).catch(() => null)))).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION && k !== 'sweat4-thumbs-v4').map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  // Nur eigene Dateien cachen. Fremde Anfragen (Video-Server, Videostreams) gehen unverändert ins Netz –
  // Videos dürfen laut MuscleWiki nicht zwischengespeichert werden.
  if (new URL(e.request.url).origin !== self.location.origin) return;
  // Netzwerk zuerst (für Updates), sonst Cache – so funktioniert die App auch ohne Internet.
  e.respondWith(fetch(e.request).then(r => { const c = r.clone(); caches.open(VERSION).then(x => x.put(e.request, c)); return r; })
    .catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('index.html'))));
});
