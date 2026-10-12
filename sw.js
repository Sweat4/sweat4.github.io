// SWEAT4 Trainer-Logbuch – Offline-Cache. Bei Updates VERSION erhöhen.
const VERSION = 'sweat4-v31';
const FILES = ['./', 'index.html', 'manifest.webmanifest', 'uebungen-katalog.js', 'uebungen-medien.js', 'lebensmittel.js', 'sprache-en.js', 'uebungen3d.js', 'three.min.js', 'icon-180.png', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png'];
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

/* ---------- Push-Mitteilungen ----------
   Der Briefkasten schickt Push-Nachrichten OHNE Inhalt (keine Trainings- oder Gesundheitsdaten).
   Der Text wird hier auf dem Gerät erzeugt – passend zu Rolle (Trainer/Kunde) und Sprache aus der lokalen Datenbank. */
function readMeta() {
  return new Promise(res => {
    try {
      const r = indexedDB.open('trainer-logbuch');
      r.onerror = () => res({});
      r.onsuccess = () => {
        const db = r.result; if (!db.objectStoreNames.contains('meta')) return res({});
        const out = {}, tx = db.transaction('meta', 'readonly'), st = tx.objectStore('meta');
        ['role', 'lang'].forEach(k => { const g = st.get(k); g.onsuccess = () => { out[k] = g.result; }; });
        tx.oncomplete = () => res(out); tx.onerror = () => res(out);
      };
    } catch (e) { res({}); }
  });
}
const PUSH_TXT = {
  de: { trainer: 'Neue Aktivität deiner Kunden – tippe, um die Meldungen zu öffnen.', client: 'Neue Nachricht von deinem Trainer – tippe zum Lesen.', test: 'Test: Push-Mitteilungen funktionieren ✓' },
  en: { trainer: 'New activity from your clients – tap to open your notifications.', client: 'New message from your trainer – tap to read.', test: 'Test: push notifications work ✓' },
};
self.addEventListener('push', e => {
  e.waitUntil(readMeta().then(m => {
    let kind = ''; try { kind = e.data ? (e.data.json().t || '') : ''; } catch (x) {}
    const lang = m.lang && m.lang.value === 'en' ? 'en' : 'de', role = m.role && m.role.value === 'client' ? 'client' : 'trainer';
    const body = kind === 'test' ? PUSH_TXT[lang].test : PUSH_TXT[lang][role];
    return self.registration.showNotification('SWEAT4', { body, icon: 'icon-192.png', badge: 'icon-192.png', tag: 'sweat4-' + role, renotify: true, data: { url: role === 'client' ? '#/nachrichten' : '#/meldungen' } });
  }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const target = new URL((e.notification.data && e.notification.data.url) || '', self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for (const c of list) if (c.url.startsWith(self.registration.scope)) { c.navigate ? c.navigate(target).catch(() => {}) : null; return c.focus(); }
    return self.clients.openWindow(target);
  }));
});
