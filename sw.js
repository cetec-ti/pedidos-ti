const CACHE_NAME = 'pedidos-ti-v2';
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
