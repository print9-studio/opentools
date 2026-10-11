import { h, card, seg, store } from "../assets/ui.js";
import { fmtNum } from "../assets/lib/money.js";

// [name, width mm, height mm, group, note]
export const PAPERS = [
  ["A0", 841, 1189, "ISO A"], ["A1", 594, 841, "ISO A"], ["A2", 420, 594, "ISO A"], ["A3", 297, 420, "ISO A"],
  ["A4", 210, 297, "ISO A"], ["A5", 148, 210, "ISO A"], ["A6", 105, 148, "ISO A"], ["A7", 74, 105, "ISO A"], ["A8", 52, 74, "ISO A"],
  ["SRA2", 450, 640, "Press sheets"], ["SRA3", 320, 450, "Press sheets"], ["SRA4", 225, 320, "Press sheets"],
  ["13 × 19 in", 330.2, 482.6, "Press sheets", "Print9 standard stock sheet"], ["12 × 18 in", 304.8, 457.2, "Press sheets"],
  ["B3", 353, 500, "ISO B"], ["B4", 250, 353, "ISO B"], ["B5", 176, 250, "ISO B"],
  ["Visiting card (India)", 90, 52, "Cards"], ["Visiting card", 90, 55, "Cards"], ["US business card", 88.9, 50.8, "Cards", "3.5 × 2 in"],
  ["ID card (CR80)", 85.6, 53.98, "Cards", "Same as debit/credit card"], ["Postcard", 148, 105, "Cards", "A6"],
  ["DL envelope", 110, 220, "Envelopes", "Takes A4 folded in 3"], ["C6 envelope", 114, 162, "Envelopes", "Takes A6 / A4 folded twice"],
  ["C5 envelope", 162, 229, "Envelopes", "Takes A5 / A4 folded once"], ["C4 envelope", 229, 324, "Envelopes", "Takes A4 flat"],
  ["10 × 4.5 in (Indian office)", 254, 114.3, "Envelopes"], ["9 × 4 in", 228.6, 101.6, "Envelopes"],
  ["Letter (US)", 215.9, 279.4, "US"], ["Legal (US)", 215.9, 355.6, "US"], ["Tabloid", 279.4, 431.8, "US", "11 × 17 in"],
  ["Photo 4R", 101.6, 152.4, "Photo", "4 × 6 in"], ["Photo 5R", 127, 177.8, "Photo", "5 × 7 in"], ["Photo 6R", 152.4, 203.2, "Photo", "6 × 8 in"],
  ["Photo 8R", 203.2, 254, "Photo", "8 × 10 in"], ["Photo 12 × 18", 304.8, 457.2, "Photo"], ["Passport photo (India)", 35, 45, "Photo"],
];

export default function (root) {
  const unit = seg([["mm", "mm"], ["in", "inch"], ["cm", "cm"]], store.get("paperUnit", "mm"), (v) => { store.set("paperUnit", v); draw(); });
  const q = h("input", { class: "search", type: "search", placeholder: "Filter: A4, SRA3, envelope, card…", "aria-label": "Filter paper sizes" });
  const out = h("div");
  q.addEventListener("input", draw);
  root.append(q, h("div", { style: { marginTop: "10px" } }, unit.el), out);
  function f(mm) {
    const u = unit.get();
    return u === "mm" ? fmtNum(mm, 1) : u === "cm" ? fmtNum(mm / 10, 2) : fmtNum(mm / 25.4, 2);
  }
  function draw() {
    const s = q.value.trim().toLowerCase();
    const rows = PAPERS.filter((p) => !s || (p[0] + " " + p[3] + " " + (p[4] || "")).toLowerCase().includes(s));
    const groups = [...new Set(rows.map((p) => p[3]))];
    out.replaceChildren(...groups.map((g) => card(g, h("table", { class: "tbl" },
      h("thead", null, h("tr", null, h("th", null, "Size"), h("th", { class: "num" }, `W × H (${unit.get()})`))),
      h("tbody", null, rows.filter((p) => p[3] === g).map((p) => h("tr", null,
        h("td", null, h("b", null, p[0]), p[4] ? h("div", { class: "small muted" }, p[4]) : null),
        h("td", { class: "num" }, `${f(p[1])} × ${f(p[2])}`))))))));
    if (!rows.length) out.append(h("div", { class: "empty" }, "No size matches that."));
  }
  draw();
}
