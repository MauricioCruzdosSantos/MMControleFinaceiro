const CACHE_NAME = 'my-cache-v1'; // Versão do cache

// Durante a instalação do Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/AppFinançasMM.html',
        '/AppFinançasMM-Style.css',
        '/AppFinançasMM-Script.js',
        '/icons/icon-144x144.png',
        '/icons/icon-480x480.png'
      ]).catch((error) => {
        console.error('Erro ao adicionar arquivos ao cache:', error);
      });
    })
  );
  // Força a ativação imediata do service worker
  self.skipWaiting();
});

// Durante a ativação do Service Worker
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME]; // Lista de caches permitidos

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) {
            return caches.delete(cacheName) // Deleta caches antigos
              .then(() => console.log(`Cache ${cacheName} excluído`));
          }
        })
      );
    }).catch((error) => {
      console.error('Erro ao ativar Service Worker:', error);
    })
  );
});

// Durante a captura de requisições
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Se a requisição estiver no cache, retorna do cache, caso contrário, faz a requisição na rede
      if (cachedResponse) {
        console.log('Servindo do cache:', event.request.url);
        return cachedResponse;
      }
      console.log('Requisitando da rede:', event.request.url);
      return fetch(event.request).catch((error) => {
        console.error('Erro ao buscar na rede:', error);
        throw error; // Propaga o erro se a rede falhar
      });
    }).catch((error) => {
      console.error('Erro ao acessar cache:', error);
      throw error; // Propaga o erro no caso de falha no cache
    })
  );
});
