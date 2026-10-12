/* Webseite sweat4.github.io: kein Service Worker.
   Diese Datei entfernt einen versehentlich registrierten Service Worker wieder
   (die App unter /sweat4/ hat ihren eigenen und ist davon nicht betroffen). */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil((async () => {
  await self.registration.unregister();
  const list = await self.clients.matchAll({ type: 'window' });
  for (const c of list) { try { c.navigate(c.url); } catch (err) {} }
})()));
