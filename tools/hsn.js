import { h, card, copy, seg, store, debounce } from "../assets/ui.js";
import { PRINT9_CODES, GOODS_OR_SERVICE_NOTE } from "../assets/lib/print9-codes.js";

const GST_PORTAL = "https://services.gst.gov.in/services/searchhsnsac";
const CBIC_PORTAL = "https://taxinformation.cbic.gov.in/";

let DB = null; // {codes, descs, lower, kind, index: Map code->i, meta}

async function loadDB() {
  if (DB) return DB;
  const r = await fetch("data/hsn-sac.json");
  if (!r.ok) throw new Error("HTTP " + r.status);
  const j = await r.json();
  const codes = [], descs = [], kind = [];
  for (const [c, d] of j.hsn) { codes.push(c); descs.push(d); kind.push("HSN"); }
  for (const [c, d] of j.sac) { codes.push(c); descs.push(d); kind.push("SAC"); }
  const lower = descs.map((d) => d.toLowerCase());
  const index = new Map(codes.map((c, i) => [c + "|" + kind[i], i]));
  DB = { codes, descs, lower, kind, index, meta: { counts: j.counts, fetched: j.fetched_utc, source: j.source } };
  return DB;
}

function find(code, k) {
  const i = DB.index.get(code + "|" + k);
  return i == null ? -1 : i;
}

function parents(i) {
  const c = DB.codes[i], k = DB.kind[i], out = [];
  for (let L = 2; L < c.length; L += 2) {
    const j = find(c.slice(0, L), k);
    if (j >= 0) out.push(j);
  }
  return out;
}

function children(i) {
  const c = DB.codes[i], k = DB.kind[i], out = [];
  for (let j = 0; j < DB.codes.length; j++) {
    if (DB.kind[j] !== k) continue;
    const cj = DB.codes[j];
    if (cj.length > c.length && cj.startsWith(c)) {
      // direct child = no existing code strictly between them
      let direct = true;
      for (let L = c.length + 2; L < cj.length; L += 2) if (find(cj.slice(0, L), k) >= 0) { direct = false; break; }
      if (direct) out.push(j);
    }
  }
  return out;
}

function highlight(text, words) {
  if (!words.length) return [text];
  const esc = words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const re = new RegExp("(" + esc.join("|") + ")", "ig");
  return text.split(re).map((part, n) => (n % 2 ? h("mark", null, part) : part));
}

function shortDesc(d, n = 70) { return d.length > n ? d.slice(0, n - 1) + "…" : d; }

export default function (root) {
  const tabs = seg([["search", "Search all codes"], ["print9", "Print9 codes & GST rates"]], store.get("hsnTab", "search"), (v) => { store.set("hsnTab", v); show(); });
  const q = h("input", { class: "search", type: "search", placeholder: "Type a code (4911) or words (visiting card, mug, printing)…", autocomplete: "off", "aria-label": "Search HSN or SAC" });
  const kindSeg = seg([["all", "All"], ["HSN", "Goods (HSN)"], ["SAC", "Services (SAC)"]], "all", () => search());
  const info = h("div", { class: "small muted", style: { margin: "8px 2px" } }, "Loading the official code list…");
  const results = h("div");
  const detail = h("div");
  const searchPane = h("div", null, q, h("div", { style: { marginTop: "10px" } }, kindSeg.el), info, detail, results);
  const p9Pane = h("div");
  root.append(tabs.el, searchPane, p9Pane);

  let limit = 50;

  function show() {
    const s = tabs.get() === "search";
    searchPane.classList.toggle("hide", !s);
    p9Pane.classList.toggle("hide", s);
    if (!s && !p9Pane.firstChild) drawPrint9();
  }

  function rateLinks() {
    return h("div", { class: "btns" },
      h("a", { class: "btn small ghost", href: CBIC_PORTAL, target: "_blank", rel: "noopener" }, "Official GST rate (CBIC) ↗"),
      h("a", { class: "btn small ghost", href: GST_PORTAL, target: "_blank", rel: "noopener" }, "GST portal HSN search ↗"));
  }

  function openDetail(i) {
    const ps = parents(i), kids = children(i);
    const code = DB.codes[i];
    const p9 = PRINT9_CODES.filter((x) => x.code === code);
    const tree = h("div", { class: "tree" },
      ps.map((j, n) => h("div", { style: { "--lvl": n } }, h("span", { class: "code" }, DB.codes[j]), " — ", DB.descs[j])),
      h("div", { class: "cur", style: { "--lvl": ps.length } }, h("span", { class: "code" }, code), " — ", DB.descs[i]),
      kids.slice(0, 200).map((j) => h("div", { style: { "--lvl": ps.length + 1, cursor: "pointer" }, onclick: () => openDetail(j) }, h("span", { class: "code" }, DB.codes[j]), " — ", DB.descs[j])));
    detail.replaceChildren(card(null,
      h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", flexWrap: "wrap" } },
        h("div", null, h("span", { class: "badge" }, DB.kind[i] === "SAC" ? "SAC · service" : "HSN · goods"), " ", h("span", { class: "code", style: { fontSize: "22px" } }, code)),
        h("button", { class: "btn small ghost", type: "button", onclick: () => { detail.replaceChildren(); } }, "Close")),
      h("div", { style: { margin: "8px 0 12px", fontWeight: "600" } }, DB.descs[i]),
      p9.map((x) => h("div", { class: "status " + (x.basis === "notified" ? "ok" : "warn") }, `GST ${x.rate}% — ${x.item}. ${x.basis === "notified" ? "Source: " : ""}${x.src}`)),
      h("div", { class: "small muted", style: { marginBottom: "6px" } }, kids.length ? `Code family (${kids.length} sub-code${kids.length > 1 ? "s" : ""} — tap one to open):` : "Code family:"),
      tree,
      h("div", { class: "btns" },
        h("button", { class: "btn small", type: "button", onclick: () => copy(code, "Code copied") }, "Copy code"),
        h("button", { class: "btn small ghost", type: "button", onclick: () => copy(`${code} - ${DB.descs[i]}`, "Copied") }, "Copy code + description")),
      p9.length ? null : h("div", { class: "note" }, "GST rates are not part of the official HSN/SAC list. Check the rate for this code on the CBIC or GST portal:"),
      p9.length ? null : rateLinks()));
    detail.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function search() {
    if (!DB) return;
    const raw = q.value.trim();
    const k = kindSeg.get();
    results.replaceChildren();
    if (!raw) { results.append(h("div", { class: "muted", style: { padding: "8px 2px" } }, "Examples: 4911 · 9989 · visiting card · ceramic mug · lamination · printing")); return; }
    const digits = raw.replace(/[\s.]/g, "");
    let hits = [];
    let words = [];
    if (/^\d+$/.test(digits)) {
      for (let i = 0; i < DB.codes.length; i++) if ((k === "all" || DB.kind[i] === k) && DB.codes[i].startsWith(digits)) hits.push(i);
      hits.sort((a, b) => DB.codes[a].length - DB.codes[b].length || DB.codes[a].localeCompare(DB.codes[b]));
    } else {
      words = raw.toLowerCase().split(/\s+/).filter(Boolean);
      const bounds = words.map((w) => new RegExp("\\b" + w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
      const scored = [];
      for (let i = 0; i < DB.codes.length; i++) {
        if (k !== "all" && DB.kind[i] !== k) continue;
        const l = DB.lower[i];
        if (!words.every((w) => l.includes(w))) continue;
        let s = 0;
        bounds.forEach((re) => { if (re.test(l)) s += 2; });
        if (DB.codes[i].length === 4) s += 1; // headings first among equals
        scored.push([i, s]);
      }
      scored.sort((a, b) => b[1] - a[1] || DB.codes[a[0]].localeCompare(DB.codes[b[0]]));
      hits = scored.map((x) => x[0]);
    }
    // Shop words ("mug", "visiting card") rarely appear in the official wording,
    // so also match Print9's own code list, which carries everyday names.
    if (words.length) {
      const p9 = PRINT9_CODES.filter((x) => words.every((w) => ((x.kw || "") + " " + x.item).toLowerCase().includes(w)));
      if (p9.length) {
        results.append(card(`Print9 codes for “${raw}”`,
          ...p9.map((x) => {
            const i = /^\d+$/.test(x.code) ? find(x.code, x.code.startsWith("99") ? "SAC" : "HSN") : -1;
            return h("div", { class: "hit", role: "button", tabindex: "0", onclick: () => (i >= 0 ? openDetail(i) : null) },
              h("div", null, h("span", { class: "code" }, x.alt || x.code), " ", h("b", null, x.rate + "% GST"), " ",
                h("span", { class: "badge " + (x.basis === "notified" ? "green" : "amber") }, x.basis === "notified" ? "Notified" : "Confirm")),
              h("div", null, x.item),
              x.note ? h("div", { class: "crumb" }, x.note) : null);
          }),
          h("div", { class: "small muted", style: { marginTop: "6px" } }, "Everyday names linked to official codes by Print9 — the official description opens when you tap.")));
      }
    }
    if (!hits.length) {
      results.append(card(null, h("div", null, "No matching words in the official GSTN descriptions."),
        h("div", { class: "small muted", style: { marginTop: "6px" } }, "Try fewer or simpler words (e.g. “mug” instead of “coffee mugs”), or the first 2–4 digits of the code.")));
      return;
    }
    results.append(h("div", { class: "small muted", style: { margin: "4px 2px" } }, `${hits.length.toLocaleString("en-IN")} match${hits.length > 1 ? "es" : ""}`));
    const list = h("div", { class: "card", style: { padding: "4px 14px" } });
    for (const i of hits.slice(0, limit)) {
      const ps = parents(i);
      const crumb = ps.length ? ps.map((j) => shortDesc(DB.descs[j], 48)).join(" › ") : "";
      list.append(h("div", { class: "hit", onclick: () => openDetail(i), role: "button", tabindex: "0", onkeydown: (e) => { if (e.key === "Enter") openDetail(i); } },
        h("div", null, h("span", { class: "code" }, DB.codes[i]), " ", h("span", { class: "badge" }, DB.kind[i]), " ", ...highlight(DB.descs[i], words)),
        crumb ? h("div", { class: "crumb" }, crumb) : null));
    }
    results.append(list);
    if (hits.length > limit) results.append(h("div", { class: "btns" }, h("button", { class: "btn small ghost", type: "button", onclick: () => { limit += 100; search(); } }, `Show more (${(hits.length - limit).toLocaleString("en-IN")} left)`)));
  }

  function drawPrint9() {
    const groups = [...new Set(PRINT9_CODES.map((x) => x.group))];
    p9Pane.append(
      h("div", { class: "note", style: { marginTop: 0, marginBottom: "12px" } },
        h("b", null, "How to read this: "), h("span", { class: "badge green" }, "Notified"), " = rate read from the official notification text (source shown). ",
        h("span", { class: "badge amber" }, "Confirm"), " = standard rate or widely reported rate — ask your CA once before relying on it. Checked 11 Oct 2026."),
      ...groups.map((g) => card(g, h("div", { class: "scroll-x" }, h("table", { class: "tbl" },
        h("thead", null, h("tr", null, h("th", null, "Code"), h("th", null, "Item"), h("th", { class: "num" }, "GST"))),
        h("tbody", null, PRINT9_CODES.filter((x) => x.group === g).map((x) => h("tr", null,
          h("td", null, h("a", { href: "#", class: "code", onclick: (e) => { e.preventDefault(); if (/^\d+$/.test(x.code)) { tabs.set("search", true); q.value = x.code; limit = 50; search(); } } }, x.alt || x.code)),
          h("td", null, x.item, h("div", { class: "small muted" }, h("span", { class: "badge " + (x.basis === "notified" ? "green" : "amber") }, x.basis === "notified" ? "Notified" : "Confirm"), " ", x.src), x.note ? h("div", { class: "small", style: { marginTop: "3px" } }, x.note) : null),
          h("td", { class: "num", style: { fontSize: "18px", fontWeight: "800" } }, x.rate + "%")))))))),
      card("Goods or service?", h("div", { class: "small" }, GOODS_OR_SERVICE_NOTE)),
      rateLinks());
  }

  q.addEventListener("input", debounce(() => { limit = 50; detail.replaceChildren(); search(); }, 110));
  show();
  loadDB().then((db) => {
    const m = db.meta;
    info.replaceChildren(`Official GSTN HSN/SAC list · ${m.counts.HSN.toLocaleString("en-IN")} goods codes + ${m.counts.SAC.toLocaleString("en-IN")} service codes · refreshed ${new Date(m.fetched + "T00:00:00Z").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} · `,
      h("a", { href: m.source, rel: "noopener" }, "source file"));
    search();
  }).catch(() => {
    info.replaceChildren(h("span", { class: "status bad" }, "Couldn't load the code list. Connect to the internet once; after that it works offline."));
  });
  if (matchMedia("(pointer:fine)").matches && tabs.get() === "search") q.focus();
}
