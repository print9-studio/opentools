import { h, field, numIn, seg, kv, card, store, num } from "../assets/ui.js";
import { impose, sheetsNeeded, INCH } from "../assets/lib/impose.js";
import { fmtNum } from "../assets/lib/money.js";

export const SHEETS = [
  ["13x19", "13 × 19 in", 13 * INCH, 19 * INCH],
  ["12x18", "12 × 18 in", 12 * INCH, 18 * INCH],
  ["sra3", "SRA3 320 × 450", 320, 450],
  ["a3", "A3 297 × 420", 297, 420],
  ["a4", "A4 210 × 297", 210, 297],
  ["custom", "Custom", null, null],
];
export const ITEMS = [
  ["card", "Visiting card 90 × 52", 90, 52],
  ["card55", "Card 90 × 55", 90, 55],
  ["id", "ID card 86 × 54", 85.6, 54],
  ["a6", "A6 105 × 148", 105, 148],
  ["a5", "A5 148 × 210", 148, 210],
  ["a4", "A4 210 × 297", 210, 297],
  ["dl", "DL 99 × 210", 99, 210],
  ["custom", "Custom", null, null],
];

export default function (root) {
  const s = store.get("impose", { sheet: "13x19", item: "card", bleed: "4", gap: "0", margin: "5", wastage: "5" });
  const sheetSeg = seg(SHEETS.map(([k, l]) => [k, l]), s.sheet, run);
  const itemSeg = seg(ITEMS.map(([k, l]) => [k, l]), s.item, run);
  const sw = numIn({ placeholder: "mm", value: s.sw || "" }), sh = numIn({ placeholder: "mm", value: s.sh || "" });
  const iw = numIn({ placeholder: "mm", value: s.iw || "" }), ih = numIn({ placeholder: "mm", value: s.ih || "" });
  const bleed = numIn({ value: s.bleed }), gap = numIn({ value: s.gap }), margin = numIn({ value: s.margin });
  const qty = numIn({ placeholder: "e.g. 1000", value: s.qty || "" }), wastage = numIn({ value: s.wastage });
  const sheetCustom = h("div", { class: "row" }, field("Sheet width (mm)", sw), field("Sheet height (mm)", sh));
  const itemCustom = h("div", { class: "row" }, field("Item width (mm)", iw), field("Item height (mm)", ih));
  const out = h("div");
  [sw, sh, iw, ih, bleed, gap, margin, qty, wastage].forEach((i) => i.addEventListener("input", run));

  root.append(h("div", { class: "cols" },
    card(null,
      field("Sheet", sheetSeg.el), sheetCustom,
      field("Item (finished size)", itemSeg.el), itemCustom,
      h("div", { class: "row" }, field("Bleed each side (mm)", bleed), field("Gap between (mm)", gap), field("Sheet margin (mm)", margin)),
      h("div", { class: "row" }, field("Quantity needed", qty), field("Wastage %", wastage)),
      h("div", { class: "note" }, "Print9 standard: 4 mm bleed, no crop marks, so pieces butt together (gap 0). Sheet margin is the edge the press can't print — set it to your machine's figure.")),
    out));

  function run() {
    const st = { sheet: sheetSeg.get(), item: itemSeg.get(), sw: sw.value, sh: sh.value, iw: iw.value, ih: ih.value, bleed: bleed.value, gap: gap.value, margin: margin.value, qty: qty.value, wastage: wastage.value };
    store.set("impose", st);
    sheetCustom.classList.toggle("hide", st.sheet !== "custom");
    itemCustom.classList.toggle("hide", st.item !== "custom");
    const S = SHEETS.find((x) => x[0] === st.sheet), I = ITEMS.find((x) => x[0] === st.item);
    const W = S[2] ?? num(sw.value), H = S[3] ?? num(sh.value);
    const w = I[2] ?? num(iw.value), hh = I[3] ?? num(ih.value);
    out.replaceChildren();
    if (![W, H, w, hh].every((v) => v > 0)) { out.append(card(null, h("div", { class: "muted" }, "Enter the sheet and item sizes."))); return; }
    // Always lay out on a portrait sheet (short side across)
    const sW = Math.min(W, H), sH = Math.max(W, H);
    const r = impose({ sheetW: sW, sheetH: sH, itemW: w, itemH: hh, bleed: num(bleed.value) || 0, gap: num(gap.value) || 0, margin: num(margin.value) || 0 });
    const straight = impose({ sheetW: sW, sheetH: sH, itemW: w, itemH: hh, bleed: num(bleed.value) || 0, gap: num(gap.value) || 0, margin: num(margin.value) || 0, mixed: false });
    const q = num(qty.value);
    const sheets = q > 0 ? sheetsNeeded(q, r.count, num(wastage.value) || 0) : null;
    const m = num(margin.value) || 0;
    const svg = drawSVG(sW, sH, m, r, num(bleed.value) || 0);
    out.append(card(null,
      h("div", { class: "big-out" }, r.count ? `${r.count} up` : "Doesn't fit"),
      h("div", { class: "muted small", style: { marginBottom: "10px" } }, r.count ? `${r.label} · each piece with bleed ${fmtNum(r.boxW, 1)} × ${fmtNum(r.boxH, 1)} mm` : "The item (with bleed) is bigger than the printable area."),
      kv([
        ["Sheet", `${fmtNum(sW, 1)} × ${fmtNum(sH, 1)} mm`],
        ["Printable area", `${fmtNum(r.areaW, 1)} × ${fmtNum(r.areaH, 1)} mm`],
        ["Sheet used by finished pieces", fmtNum(r.usedPct, 1) + "%", "sub"],
        straight.count !== r.count ? ["Straight grid only (simpler cutting)", `${straight.count} up · ${straight.label.toLowerCase()}`, "sub"] : null,
        sheets != null ? ["Sheets to print " + `(${q} pcs + ${num(wastage.value) || 0}% wastage)`, String(sheets), "total"] : null,
      ]),
      svg));
  }

  function drawSVG(W, H, m, r, bl) {
    const NS = "http://www.w3.org/2000/svg";
    const el = (t, a) => { const e = document.createElementNS(NS, t); for (const k in a) e.setAttribute(k, a[k]); return e; };
    const svg = el("svg", { viewBox: `-2 -2 ${W + 4} ${H + 4}`, class: "impose-svg", role: "img", "aria-label": "Layout preview" });
    svg.style.maxHeight = "520px";
    svg.append(el("rect", { x: 0, y: 0, width: W, height: H, fill: "var(--card)", stroke: "var(--muted)", "stroke-width": 0.8 }));
    svg.append(el("rect", { x: m, y: m, width: W - 2 * m, height: H - 2 * m, fill: "none", stroke: "var(--line)", "stroke-dasharray": "3 3", "stroke-width": 0.6 }));
    for (const bx of r.boxes) {
      const col = bx.rot ? "#d7263d" : "#1546b0";
      svg.append(el("rect", { x: m + bx.x, y: m + bx.y, width: bx.w, height: bx.h, fill: bx.rot ? "rgba(215,38,61,.12)" : "rgba(21,70,176,.12)", stroke: col, "stroke-width": 0.4 }));
      if (bl > 0) svg.append(el("rect", { x: m + bx.x + bl, y: m + bx.y + bl, width: bx.w - 2 * bl, height: bx.h - 2 * bl, fill: "none", stroke: col, "stroke-width": 0.3, "stroke-dasharray": "1.5 1" }));
    }
    return svg;
  }
  run();
}
