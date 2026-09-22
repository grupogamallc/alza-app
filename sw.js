// ALZA product — network-first service worker
const C = "alza-app-v53";
self.addEventListener("install", e => self.skipWaiting());
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // Never cache Supabase / auth / API calls
  if (url.hostname.endsWith("supabase.co") || url.hostname.includes("supabase")) return;
  e.respondWith(
    fetch(req).then(res => {
      if (res && res.status === 200 && url.origin === location.origin) {
        const clone = res.clone();
        caches.open(C).then(c => c.put(req, clone));
      }
      return res;
    }).catch(() => caches.match(req).then(m => m || (req.mode === "navigate" ? caches.match("./index.html") : undefined)))
  );
});

// Recordatorio diario. El push llega sin contenido a proposito: el texto vive
// aqui, asi no viaja nada del usuario por el camino ni hay que cifrarlo.
self.addEventListener("push", e => {
  e.waitUntil(self.registration.showNotification("VIDA ALFA", {
    body: "Tu ritual de hoy te esta esperando.",
    icon: "icon-192.png",
    badge: "icon-192.png",
    tag: "ritual-diario",
    renotify: false
  }));
});

self.addEventListener("notificationclick", e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(ws => {
    for (const w of ws) if ("focus" in w) return w.focus();
    return self.clients.openWindow("./");
  }));
});
