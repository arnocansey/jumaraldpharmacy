const CACHE_VERSION = "v2";
const CACHE_NAME = `jumarald-${CACHE_VERSION}`;
const STATIC_CACHE = `jumarald-static-${CACHE_VERSION}`;
const API_CACHE = `jumarald-api-${CACHE_VERSION}`;
const IMAGE_CACHE = `jumarald-images-${CACHE_VERSION}`;

const APP_SHELL = ["/", "/shop", "/cart", "/login", "/offline.html"];

const STATIC_ASSETS = [
  "/manifest.json",
  "/offline.html",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

const API_TIMEOUT = 5000;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(APP_SHELL).catch(() => {
        console.warn("Some app shell resources failed to cache");
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

function timeoutFetch(request, timeout = API_TIMEOUT) {
  return Promise.race([
    fetch(request),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Network timeout")), timeout)
    ),
  ]);
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const { url } = request;

  if (request.method !== "GET") {
    if (request.method === "POST" && url.includes("/api/")) {
      event.respondWith(
        fetch(request).catch(() => {
          const cloned = request.clone();
          return cloned.json().then((body) => {
            const pendingRequest = {
              url: request.url,
              method: request.method,
              body: body,
              timestamp: Date.now(),
            };
            return caches.open(API_CACHE).then((cache) => {
              return cache.put(
                new Request(`/pending-orders/${Date.now()}`),
                new Response(JSON.stringify(pendingRequest), {
                  headers: { "Content-Type": "application/json" },
                })
              );
            }).then(() => {
              self.clients.matchAll().then((clients) => {
                clients.forEach((client) => {
                  client.postMessage({
                    type: "ORDER_QUEUED",
                    data: pendingRequest,
                  });
                });
              });
              return new Response(
                JSON.stringify({
                  success: true,
                  message: "Order queued for when you're back online",
                  queued: true,
                }),
                { headers: { "Content-Type": "application/json" } }
              );
            });
          });
        })
      );
      return;
    }
    return;
  }

  if (url.includes("/api/")) {
    event.respondWith(
      caches.open(API_CACHE).then((cache) => {
        return timeoutFetch(request)
          .then((response) => {
            if (response.ok) {
              const clone = response.clone();
              cache.put(request, clone);
            }
            return response;
          })
          .catch(() => {
            return caches.match(request).then((cached) => {
              return cached || new Response(
                JSON.stringify({ error: "Offline", message: "You are currently offline" }),
                { headers: { "Content-Type": "application/json" }, status: 503 }
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
          return fetch(request)
            .then((response) => {
              if (response.ok) {
                const clone = response.clone();
                cache.put(request, clone);
              }
              return response;
            })
            .catch(() => {
              return new Response(
                '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect fill="#059669" width="200" height="200"/><text fill="white" font-family="sans-serif" font-size="14" text-anchor="middle" x="100" y="105">Jumarald</text></svg>',
                { headers: { "Content-Type": "image/svg+xml" } }
              );
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

  if (url.includes("/fonts/") || url.match(/\.(woff|woff2|ttf|eot)$/)) {
    event.respondWith(
      caches.open(STATIC_CACHE).then((cache) => {
        return caches.match(request).then((cached) => {
          return cached || fetch(request).then((response) => {
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

self.addEventListener("sync", (event) => {
  if (event.tag === "sync-pending-orders") {
    event.waitUntil(syncPendingOrders());
  }
});

async function syncPendingOrders() {
  const cache = await caches.open(API_CACHE);
  const keys = await cache.keys();
  let synced = 0;

  for (const request of keys) {
    if (request.url.startsWith("/pending-orders/")) {
      const response = await cache.match(request);
      if (response) {
        const pendingData = await response.json();
        try {
          await fetch(pendingData.url, {
            method: pendingData.method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(pendingData.body),
          });
          await cache.delete(request);
          synced++;
        } catch (e) {
          break;
        }
      }
    }
  }

  if (synced > 0) {
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage({
          type: "ORDERS_SYNCED",
          count: synced,
        });
      });
    });
  }
}

self.addEventListener("push", (event) => {
  const data = event.data?.json() || {
    title: "Jumarald Pharmacy",
    body: "You have a new notification",
    icon: "/icons/icon-192.png",
    url: "/",
  };

  const options = {
    body: data.body,
    icon: data.icon || "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    vibrate: [200, 100, 200],
    data: { url: data.url || "/" },
    actions: data.actions || [
      { action: "open", title: "Open App" },
      { action: "dismiss", title: "Dismiss" },
    ],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "dismiss") return;

  const url = event.notification.data?.url || "/";
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(url) && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
