/* ==========================================================================
   Service Worker — PWA Template
   Sistema de versão baseado em /sw-version.txt

   Como funciona:
   1. A primeira linha de sw-version.txt é a versão (ex: "1.0.0").
   2. As linhas seguintes são os caminhos (a partir da raiz) a cachear.
   3. O nome do cache inclui a versão (ex: "pwa-cache-1.0.0").
   4. Ao instalar, o SW baixa sw-version.txt, lê a versão e a lista de
      arquivos, e popula um cache novo com esse nome.
   5. Ao ativar, o SW apaga qualquer cache antigo cujo nome não bata com
      a versão atual — efetivamente "atualizando" tudo de uma vez.
   6. Enquanto a versão não mudar, nada é rebaixado: os arquivos servem
      direto do cache (carregamento rápido, funciona offline).

   ⚠️ IMPORTANTE — LEIA ANTES DE ATUALIZAR A VERSÃO:
   O navegador só percebe que existe uma atualização de Service Worker
   quando o ARQUIVO service-worker.js muda, byte a byte (é assim que a
   spec funciona — ele NÃO fica observando o sw-version.txt sozinho).
   Por isso, a linha SW_BUILD abaixo existe só para isso: sempre que você
   mudar a versão em sw-version.txt, mude também esse número aqui embaixo
   (só precisa bater com a versão do .txt, não precisa ser sofisticado).
   Sem isso, o navegador nunca vai detectar a atualização automaticamente.
   ========================================================================== */

const SW_BUILD = '1.0.0'; // <-- manter sincronizado com a 1ª linha de sw-version.txt

const VERSION_FILE = '/sw-version.txt';
const CACHE_PREFIX = 'pwa-cache-';

// Fallback de emergência: caso o sw-version.txt falhe no primeiro install
// e o navegador ainda não tenha nada em cache, ao menos a index carrega.
const FALLBACK_FILES = ['/', '/index.html'];

/* ------------------------------------------------------------------------
   Helpers
   ------------------------------------------------------------------------ */

// Busca sw-version.txt sempre da rede (never cache), parseia versão + lista
async function fetchVersionManifest() {
  const response = await fetch(VERSION_FILE, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Não foi possível buscar ${VERSION_FILE}: ${response.status}`);
  }
  const text = await response.text();
  const lines = text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  const version = lines[0];
  const files = lines.slice(1);

  return { version, files };
}

function cacheNameFor(version) {
  return `${CACHE_PREFIX}${version}`;
}

/* ------------------------------------------------------------------------
   INSTALL — baixa a lista de arquivos da versão atual para um cache novo
   ------------------------------------------------------------------------ */
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const { version, files } = await fetchVersionManifest();
        const cacheName = cacheNameFor(version);
        const cache = await caches.open(cacheName);

        // addAll falha inteiro se 1 arquivo der 404 — então baixamos
        // individualmente e só avisamos no console quando algo falhar,
        // sem travar a instalação do PWA por causa de 1 arquivo quebrado.
        await Promise.all(
          files.map(async (path) => {
            try {
              const req = new Request(path, { cache: 'no-store', redirect: 'follow' });
              let res = await fetch(req);

              // Uma Response marcada como "redirected" não pode ser
              // reaproveitada depois em respondWith() de navegação,
              // então reconstruímos uma Response limpa antes de salvar.
              if (res.redirected) {
                res = new Response(res.body, {
                  status: res.status,
                  statusText: res.statusText,
                  headers: res.headers,
                });
              }

              if (res.ok) {
                await cache.put(path, res);
              } else {
                console.warn(`[SW] Falhou ao cachear (${res.status}):`, path);
              }
            } catch (err) {
              console.warn('[SW] Erro ao cachear:', path, err);
            }
          })
        );

        console.log(`[SW] Instalado com sucesso — versão ${version} (${files.length} arquivos)`);
      } catch (err) {
        console.warn('[SW] Falha ao ler sw-version.txt no install, usando fallback:', err);
        const cache = await caches.open(cacheNameFor('fallback'));
        await cache.addAll(FALLBACK_FILES);
      }

      // Ativa o novo SW imediatamente, sem esperar as abas fecharem
      self.skipWaiting();
    })()
  );
});

/* ------------------------------------------------------------------------
   ACTIVATE — apaga caches de versões antigas
   ------------------------------------------------------------------------ */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      let currentCacheName = null;
      try {
        const { version } = await fetchVersionManifest();
        currentCacheName = cacheNameFor(version);
      } catch {
        // Se não conseguir buscar a versão agora, mantém todos os caches
        // que já existem (não apaga nada às cegas).
      }

      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith(CACHE_PREFIX) && key !== currentCacheName && currentCacheName !== null)
          .map((key) => {
            console.log('[SW] Removendo cache antigo:', key);
            return caches.delete(key);
          })
      );

      await self.clients.claim();
    })()
  );
});

/* ------------------------------------------------------------------------
   FETCH — estratégia: cache-first para arquivos já conhecidos, com
   fallback de rede para o que ainda não estiver cacheado. O próprio
   sw-version.txt nunca vem do cache — é sempre buscado fresco da rede,
   porque é ele quem dita a verdade sobre qual é a versão atual.
   ------------------------------------------------------------------------ */
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Só interceptamos GET; POST/PUT etc. passam direto
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Não cacheia requisições de outros domínios (ex: fontes do Google, CDN)
  if (url.origin !== self.location.origin) return;

  // sw-version.txt NUNCA vem do cache — sempre rede, é ele quem dita a verdade
  if (url.pathname === VERSION_FILE) {
    event.respondWith(fetch(request, { cache: 'no-store' }));
    return;
  }

  event.respondWith(
    (async () => {
      const cached = await caches.match(request, { ignoreSearch: true });
      if (cached) {
        return cached;
      }

      // Não estava em cache (arquivo novo, ainda não versionado) — busca da
      // rede e guarda no cache da versão atual para a próxima vez.
      try {
        let response = await fetch(request, { redirect: 'follow' });

        // Se a resposta veio de um redirect (ex: /index.html -> /), o
        // Cache Storage e o respondWith() de navegação não aceitam
        // reutilizar uma Response marcada como redirecionada, então
        // reconstruímos uma Response limpa com o mesmo corpo/headers.
        if (response.redirected) {
          response = new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
          });
        }

        if (response.ok) {
          const { version } = await fetchVersionManifest().catch(() => ({ version: null }));
          if (version) {
            const cache = await caches.open(cacheNameFor(version));
            cache.put(request, response.clone());
          }
        }
        return response;
      } catch (err) {
        // Offline e sem cache para essa URL — se for navegação (HTML),
        // devolve a index como fallback amigável.
        if (request.mode === 'navigate') {
          const fallback = await caches.match('/index.html');
          if (fallback) return fallback;
        }
        throw err;
      }
    })()
  );
});

/* ------------------------------------------------------------------------
   MESSAGE — permite forçar checagem manual de versão a partir da página
   (ex: botão "verificar atualizações")
   ------------------------------------------------------------------------ */
self.addEventListener('message', (event) => {
  if (event.data === 'CHECK_VERSION') {
    self.registration.update();
  }
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
