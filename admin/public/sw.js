const CACHE_VERSION = "v1-admin";
const STATIC_CACHE = `jumarald-admin-static-${CACHE_VERSION}`;
const API_CACHE = `jumarald-admin-api-${CACHE_VERSION}`;
const IMAGE_CACHE = `jumarald-admin-images-${CACHE_VERSION}`;

const APP_SHELL = ["/", "/orders", "/prescriptions", "/inventory", "/login", "/offline.html"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(APP_SHELL).catch(() => {
        console.warn("Some admin app shell resources failed to cache");
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== API_CACHE && key !== IMAGE_CACHE)
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const { url } = request;

  if (request.method !== "GET") return;

  if (url.includes("/api/")) {
    event.respondWith(
      caches.open(API_CACHE).then((cache) => {
        return fetch(request)
          .then((response) => {
            if (response.ok) {
              const clone = response.clone();
              cache.put(request, clone);
            }
            return response;
          })
          .catch(() => {
            return caches.match(request).then((cached) => {
              return (
                cached ||
                new Response(
                  JSON.stringify({ error: "Offline", message: "Admin operations require internet connection" }),
                  { headers: { "Content-Type": "application/json" }, status: 503 }
                )
              );
            });
          });
      })
    );
    return;
  }

  if (url.includes("/icons/") || url.includes("/images/") || url.match(/\.(png|jpg|jpeg|gif|svg|webp|ico)$/)) {
    event.respondWith(
      caches.open(IMAGE_CACHE).then((cache) => {
        return caches.match(request).then((cached) => {
          if (cached) return cached;
          return fetch(request).then((response) => {
            if (response.ok) {
              const clone = response.clone();
              cache.put(request, clone);
            }
            return response;
          });
        });
      })
    );
    return;
  }

  if (url.includes("/_next/static/")) {
    event.respondWith(
      caches.open(STATIC_CACHE).then((cache) => {
        return caches.match(request).then((cached) => {
          if (cached) return cached;
          return fetch(request).then((response) => {
            if (response.ok) {
              const clone = response.clone();
              cache.put(request, clone);
            }
            return response;
          });
        });
      })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => {
          if (request.mode === "navigate") {
            return caches.match("/offline.html");
          }
          return cached;
        });

      return cached || networkFetch;
    })
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
