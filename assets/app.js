// Print9 OpenTools — app shell: home screen, search, routing, theme, offline.
import { h, store } from "./ui.js";

const I = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const ICONS = {
  calc: I('<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M8 6h8M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 19h.01M12 19h4"/>'),
  gst: I('<path d="M19 5 5 19"/><circle cx="7" cy="7" r="2.5"/><circle cx="17" cy="17" r="2.5"/>'),
  bill: I('<path d="M6 2h12v20l-3-2-3 2-3-2-3 2z"/><path d="M9 7h6M9 11h6M9 15h4"/>'),
  words: I('<path d="M4 7V5h16v2M9 20h6M12 5v15"/>'),
  margin: I('<path d="M3 17l6-6 4 4 8-8"/><path d="M14 7h7v7"/>'),
  pct: I('<path d="M19 5 5 19"/><path d="M6.5 6.5h.01M17.5 17.5h.01"/>'),
  emi: I('<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 12h.01M18 12h.01"/>'),
  hsn: I('<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3M8 11h6M11 8v6"/>'),
  id: I('<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="12" r="2.5"/><path d="M14 10h4M14 14h4"/>'),
  card: I('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h4"/>'),
  bank: I('<path d="M3 10 12 4l9 6M5 10v8M9 10v8M15 10v8M19 10v8M3 20h18"/>'),
  pin: I('<path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>'),
  grid: I('<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/>'),
  ruler: I('<path d="M3 17 17 3l4 4L7 21z"/><path d="m7 13 2 2M10 10l2 2M13 7l2 2"/>'),
  image: I('<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 17-5-5-9 8"/>'),
  paper: I('<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5"/>'),
  upi: I('<path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4z"/><path d="M14 14h2v2h-2zM18 18h2v2h-2zM18 14h2M14 18v2"/>'),
  qr: I('<path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"/>'),
  wa: I('<path d="M21 12a9 9 0 0 1-13.4 7.9L3 21l1.2-4.4A9 9 0 1 1 21 12z"/><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5"/>'),
  cal: I('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>'),
  note: I('<path d="M4 4h16v12l-4 4H4z"/><path d="M16 20v-4h4M8 9h8M8 13h5"/>'),
};

export const CATS = [
  ["money", "Money & GST"],
  ["lookup", "Codes & checks"],
  ["print", "Print shop"],
  ["share", "Payments & sharing"],
  ["day", "Everyday"],
];

export const TOOLS = [
  { id: "gst", name: "GST Calculator", desc: "Add or remove GST, CGST/SGST or IGST, round-off", cat: "money", icon: "gst", kw: "tax inclusive exclusive igst cgst sgst reverse" },
  { id: "calc", name: "Calculator", desc: "Everyday calculator with tape and +GST / −GST keys", cat: "money", icon: "calc", kw: "add sum maths" },
  { id: "invoice", name: "Bill Totaliser", desc: "Many items, mixed GST rates, rate-wise summary", cat: "money", icon: "bill", kw: "invoice bill quotation items total" },
  { id: "words", name: "Amount in Words", desc: "Rupees in words for invoices and cheques", cat: "money", icon: "words", kw: "cheque lakh crore" },
  { id: "margin", name: "Price & Margin", desc: "Selling price from cost, margin, markup, discount", cat: "money", icon: "margin", kw: "profit cost selling markup discount wastage" },
  { id: "percent", name: "Percentage", desc: "% of, % change, add or remove %", cat: "money", icon: "pct", kw: "percent increase decrease" },
  { id: "emi", name: "EMI / Loan", desc: "Monthly instalment, interest and year-wise schedule", cat: "money", icon: "emi", kw: "loan interest instalment" },
  { id: "hsn", name: "HSN / SAC Search", desc: "Official GSTN code list + Print9 codes with rates", cat: "lookup", icon: "hsn", kw: "hsn sac code goods services rate tariff" },
  { id: "gstin", name: "GSTIN Check", desc: "Validate a GST number, decode state and PAN", cat: "lookup", icon: "id", kw: "gst number verify company search taxpayer" },
  { id: "pan", name: "PAN Check", desc: "Validate a PAN and see the holder type", cat: "lookup", icon: "card", kw: "pan income tax" },
  { id: "ifsc", name: "IFSC Finder", desc: "Bank and branch details from an IFSC code", cat: "lookup", icon: "bank", kw: "bank branch neft rtgs micr" },
  { id: "pincode", name: "PIN Code Finder", desc: "Post offices, district and state for a PIN", cat: "lookup", icon: "pin", kw: "postal zip area" },
  { id: "impose", name: "Ups Calculator", desc: "How many pieces fit on 13×19, SRA3, A3 with bleed", cat: "print", icon: "grid", kw: "imposition sheet ups layout visiting card bleed" },
  { id: "dpi", name: "Image DPI Check", desc: "Will this photo print sharp at this size?", cat: "print", icon: "image", kw: "resolution pixels print size quality" },
  { id: "units", name: "Unit Converter", desc: "mm, inch, pt, px at DPI, sq ft, sq m", cat: "print", icon: "ruler", kw: "convert length area square feet flex" },
  { id: "papers", name: "Paper Sizes", desc: "A-series, SRA, 13×19, cards and envelopes", cat: "print", icon: "paper", kw: "a4 a3 sra3 size dimensions" },
  { id: "upi", name: "UPI Payment QR", desc: "QR with fixed amount — customer scans and pays", cat: "share", icon: "upi", kw: "gpay phonepe paytm payment qr" },
  { id: "qr", name: "QR Code Maker", desc: "Links, text, Wi-Fi or contact card as a QR", cat: "share", icon: "qr", kw: "qr code wifi vcard url" },
  { id: "wa", name: "WhatsApp Link", desc: "Chat link with a ready message, plus QR", cat: "share", icon: "wa", kw: "whatsapp chat link message" },
  { id: "dates", name: "Date Calculator", desc: "Days between, due dates, working days, FY & quarter", cat: "day", icon: "cal", kw: "days due date financial year quarter" },
  { id: "notes", name: "Quick Notes", desc: "A scratchpad saved on this device only", cat: "day", icon: "note", kw: "notes notepad scratch" },
];

const $main = document.getElementById("app");
const byId = Object.fromEntries(TOOLS.map((t) => [t.id, t]));

/* ---------- theme ---------- */
const THEMES = ["auto", "light", "dark"];
function applyTheme(t) {
  if (t === "auto") document.documentElement.removeAttribute("data-theme");
  else document.documentElement.setAttribute("data-theme", t);
  const b = document.getElementById("themeBtn");
  if (b) b.title = b.ariaLabel = `Theme: ${t} (tap to change)`;
}
applyTheme(store.get("theme", "auto"));
document.getElementById("themeBtn").addEventListener("click", () => {
  const t = THEMES[(THEMES.indexOf(store.get("theme", "auto")) + 1) % THEMES.length];
  store.set("theme", t); applyTheme(t);
});

/* ---------- home ---------- */
let homeQuery = "";
function toolCard(t) {
  return h("a", { class: "tcard", href: "#/" + t.id },
    h("div", { class: "ticon", html: ICONS[t.icon] }),
    h("div", null, h("div", { class: "tname" }, t.name), h("div", { class: "tdesc" }, t.desc)));
}
function renderHome() {
  document.title = "Print9 OpenTools";
  const input = h("input", {
    class: "search", type: "search", placeholder: "Find a tool… (press / to search)", value: homeQuery,
    "aria-label": "Find a tool", autocomplete: "off",
  });
  const list = h("div");
  const draw = () => {
    const q = input.value.trim().toLowerCase();
    homeQuery = input.value;
    list.replaceChildren();
    if (q) {
      const words = q.split(/\s+/);
      const hits = TOOLS.filter((t) => words.every((w) => (t.name + " " + t.desc + " " + t.kw).toLowerCase().includes(w)));
      list.append(hits.length ? h("div", { class: "grid", style: { marginTop: "14px" } }, hits.map(toolCard)) : h("div", { class: "empty" }, "No tool matches that. Try “gst”, “hsn”, “qr”…"));
      return;
    }
    const recent = store.get("recent", []).map((id) => byId[id]).filter(Boolean).slice(0, 4);
    if (recent.length) list.append(h("div", { class: "sec-title" }, "Recently used"), h("div", { class: "grid" }, recent.map(toolCard)));
    for (const [cat, label] of CATS) {
      list.append(h("div", { class: "sec-title" }, label), h("div", { class: "grid" }, TOOLS.filter((t) => t.cat === cat).map(toolCard)));
    }
  };
  input.addEventListener("input", draw);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { const first = list.querySelector(".tcard"); if (first) location.hash = first.getAttribute("href"); }
  });
  draw();
  $main.replaceChildren(input, list);
  if (homeQuery && matchMedia("(pointer:fine)").matches) input.focus();
}

/* ---------- tool page ---------- */
async function renderTool(id) {
  const t = byId[id];
  if (!t) { location.hash = ""; return; }
  document.title = t.name + " · Print9 OpenTools";
  const body = h("div", null, h("div", { class: "muted" }, "Loading…"));
  $main.replaceChildren(
    h("div", { class: "tool-head" },
      h("a", { class: "icon-btn back", href: "#/", "aria-label": "Back to all tools", html: I('<path d="M15 18l-6-6 6-6"/>') }),
      h("h1", null, t.name)),
    body);
  const recent = [id, ...store.get("recent", []).filter((x) => x !== id)].slice(0, 8);
  store.set("recent", recent);
  try {
    const mod = await import(`../tools/${id}.js`);
    body.replaceChildren();
    await mod.default(body);
  } catch (err) {
    console.error(err);
    body.replaceChildren(h("div", { class: "status bad" }, "This tool couldn't load. Check your connection and try again."));
  }
  window.scrollTo(0, 0);
}

function route() {
  const m = /^#\/([\w-]+)/.exec(location.hash);
  if (m) renderTool(m[1]); else renderHome();
}
addEventListener("hashchange", route);
addEventListener("keydown", (e) => {
  if (e.key === "/" && !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) {
    e.preventDefault();
    if (location.hash && location.hash !== "#/") location.hash = "#/";
    setTimeout(() => document.querySelector(".search")?.focus(), 0);
  }
});
route();

/* ---------- offline ---------- */
if ("serviceWorker" in navigator && location.protocol === "https:") {
  addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
}
