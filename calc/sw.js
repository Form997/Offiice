const CACHE_NAME = "haidat-calc-sght-v2";
const CORE_FILES = [
  "./", "./index.html", "./style.css", "./ios.css", "./foldable.css",
  "./app.js", "./manifest.webmanifest",
  "./ai/ai-intelligence.js", "./ai/chart-engine.js", "./ai/chart-presets.js",
  "./ai/chart-surface-3d.js", "./ai/chart-uncertainty.js", "./ai/dashboard-layout.js",
  "./ai/data-science.js", "./ai/dose-response.js", "./ai/pivot-chart-manager.js",
  "./ai/pivot-chart-studio.js", "./ai/pivot-chart.js", "./ai/response-surface.js",
  "./automation/macro-debugger.js", "./automation/macro-engine.js",
  "./automation/macro-history.js", "./automation/macro-library.js",
  "./automation/macro-recorder.js", "./automation/macro-security.js",
  "./engine/account-lifecycle.js", "./engine/auth-api-client.js", "./engine/auth-rbac.js",
  "./engine/axis-dimension-clipboard.js", "./engine/axis-resize-autoscroll.js",
  "./engine/axis-resize-guide.js", "./engine/calculation-scheduler.js",
  "./engine/cell-format.js", "./engine/core.js", "./engine/data-tools.js",
  "./engine/dependency-engine.js", "./engine/fill-series.js",
  "./engine/formula-audit-archive.js", "./engine/formula-audit-signature.js",
  "./engine/formula-diagnostics.js", "./engine/formula-error-intelligence.js",
  "./engine/formula-fix-suggestions.js", "./engine/formula-result-cache.js",
  "./engine/formula-version-history.js", "./engine/formula-version-integrity.js",
  "./engine/freeze-panes.js", "./engine/grid-capacity.js", "./engine/grid-geometry.js",
  "./engine/history-version-sync.js", "./engine/history.js", "./engine/identity-registry.js",
  "./engine/range-clipboard.js", "./engine/repair-audit.js", "./engine/search.js",
  "./engine/sparse-grid.js", "./engine/split-panes.js", "./engine/webauthn-browser.js",
  "./engine/workbook-sheets.js"
];
self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(key => key.startsWith("haidat-calc-") && key !== CACHE_NAME).map(key => caches.delete(key)))
  ).then(() => self.clients.claim()));
});
self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  const isStatic = /\.(?:html|js|css|webmanifest)$/.test(url.pathname);
  if (!isStatic && request.mode !== "navigate") return;
  event.respondWith(caches.match(request).then(cached => {
    if (cached) return cached;
    return fetch(request).then(response => {
      if (response.ok && isStatic) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
      }
      return response;
    }).catch(() => request.mode === "navigate" ? caches.match("./index.html") : Response.error());
  }));
});
