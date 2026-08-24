const CACHE_NAME = 'pedidos-ti-v3';
const STATIC_ASSETS = [
  '/pedidos-ti/',
  '/pedidos-ti/index.html',
  '/pedidos-ti/tecnico.html',
  '/pedidos-ti/gerente.html',
  '/pedidos-ti/manifest.json',
  '/pedidos-ti/icon-192x192.png',
  '/pedidos-ti/icon-512x512.png'
];

// Instalação: pré-cacheia assets estáticos
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Ativação: limpa caches antigos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: network-first para API do Supabase/EmailJS, cache-first para assets
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Deixa passar sem cache: Supabase, EmailJS, APIs externas
  if (
    url.hostname.includes('supabase.co') ||
    url.hostname.includes('emailjs.com') ||
    url.hostname.includes('api.emailjs.com')
  ) {
    return; // fetch normal, sem interceptar
  }

  // Network-first para páginas HTML (navegação): sempre busca a versão mais nova,
  // só usa o cache se estiver offline. Evita servir telas desatualizadas após deploy.
  if (event.request.mode === 'navigate' || event.request.destination === 'document') {
    event.respondWith(
      fetch(event.request).then(response => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      }).catch(() => caches.match(event.request).then(cached => cached || caches.match('/pedidos-ti/index.html')))
    );
    return;
  }

  // Cache-first para os demais assets locais (ícones, manifest, etc.)
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // Só cacheia respostas válidas de mesma origem
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      }).catch(() => {
        // Offline fallback para páginas HTML
        if (event.request.destination === 'document') {
          return caches.match('/pedidos-ti/index.html');
        }
      });
    })
  );
});

// ── PUSH: exibe o pop-up de lembrete quando a notificação chega ──
self.addEventListener('push', event => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (_) { data = { title: 'Pedidos — Cetec Palmas', body: event.data ? event.data.text() : '' }; }

  const title = data.title || 'Pedidos — Cetec Palmas';
  const options = {
    body: data.body || '',
    icon: '/pedidos-ti/icon-192x192.png',
    badge: '/pedidos-ti/icon-192x192.png',
    tag: data.tag || undefined,
    data: { url: data.url || '/pedidos-ti/gerente.html' }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// Clique na notificação: foca uma aba já aberta do painel, ou abre uma nova
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const targetUrl = event.notification.data && event.notification.data.url ? event.notification.data.url : '/pedidos-ti/gerente.html';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientsArr => {
      const existing = clientsArr.find(c => c.url.includes(targetUrl.split('/').pop()));
      if (existing) return existing.focus();
      return self.clients.openWindow(targetUrl);
    })
  );
});
