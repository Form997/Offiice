const CACHE='haidat-writer-v4-7-r1';
const FILES=['./','./index.html','./style.css','./app.js?v=4.7','./canvas-studio.html','./export-studio.js?v=4.7','./manifest.webmanifest','./supabase-config.js?v=2.7','./supabase-auth.js?v=2.7','./collaboration.js?v=3.0'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
 if(e.request.method!=='GET')return;
 const isConfig=new URL(e.request.url).pathname.endsWith('/supabase-config.js');
 if(isConfig){e.respondWith(fetch(e.request).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));}return response;}).catch(()=>caches.match(e.request)));return;}
 e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(response=>{const copy=response.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return response;}).catch(()=>caches.match('./index.html'))));
});
