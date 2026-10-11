// Print9 OpenTools offline support.
// VERSION is replaced automatically on every publish (scripts/stamp_version.py),
// so phones always switch to the newest files after an update.
const VERSION = "dev";
const CACHE = "p9ot-" + VERSION;

const CORE = [
  "./", "index.html", "manifest.webmanifest",
  "assets/app.css", "assets/app.js", "assets/ui.js", "assets/icon.svg", "assets/favicon-32.png", "assets/icon-180.png", "assets/icon-192.png", "assets/logo-light.png", "assets/logo-dark.png",
  "assets/lib/money.js", "assets/lib/gst.js", "assets/lib/ids.js", "assets/lib/words.js", "assets/lib/impose.js",
  "assets/lib/misc.js", "assets/lib/calc.js", "assets/lib/print9-codes.js", "assets/lib/qr.js", "assets/vendor/qrcode.mjs",
  "tools/gst.js", "tools/calc.js", "tools/invoice.js", "tools/words.js", "tools/margin.js", "tools/percent.js",
  "tools/emi.js", "tools/hsn.js", "tools/gstin.js", "tools/pan.js", "tools/ifsc.js", "tools/pincode.js",
  "tools/impose.js", "tools/dpi.js", "tools/units.js", "tools/papers.js", "tools/upi.js", "tools/qr.js",
  "tools/wa.js", "tools/dates.js", "tools/notes.js",
];
// The HSN/SAC database (~1.5 MB, ~350 KB compressed) is fetched in the background after install.
const LATER = ["data/hsn-sac.json", "data/hsn-sac-meta.json"];

self.addEventListener("install", (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await c.addAll(CORE);
    c.addAll(LATER).catch(() => {});
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith("p9ot-") && k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});

// Same-origin files: serve from cache instantly, refresh in the background.
// Other sites (IFSC / PIN code lookups): always go to the network.
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;
  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    const hit = await c.match(e.request, { ignoreSearch: true });
    const net = fetch(e.request).then((r) => {
      if (r && r.ok) c.put(e.request, r.clone());
      return r;
    }).catch(() => null);
    if (hit) { e.waitUntil(net); return hit; }
    const r = await net;
    return r || (e.request.mode === "navigate" ? c.match("index.html") : Response.error());
  })());
});
