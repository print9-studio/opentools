import { h, field, numIn, card, num } from "../assets/ui.js";
import { fmtNum } from "../assets/lib/money.js";
import { LENGTH, AREA } from "../assets/lib/misc.js";

function converter(title, table, defaults, note) {
  const keys = Object.keys(table);
  const ins = {};
  const grid = h("div", { class: "row" });
  for (const k of keys) {
    ins[k] = numIn({ placeholder: "0" });
    grid.append(field(k, ins[k]));
    ins[k].addEventListener("input", () => update(k));
  }
  function update(src) {
    const v = num(ins[src].value);
    for (const k of keys) {
      if (k === src) continue;
      ins[k].value = Number.isFinite(v) ? String(+((v * table[src]) / table[k]).toPrecision(8)) : "";
    }
  }
  if (defaults) { ins[defaults[0]].value = defaults[1]; update(defaults[0]); }
  return card(title, grid, note ? h("div", { class: "note" }, note) : null);
}

function pxCard() {
  const dpi = numIn({ value: "300" }), px = numIn({ placeholder: "pixels" }), mm = numIn({ placeholder: "mm" }), inch = numIn({ placeholder: "inch" });
  const fix = (src) => {
    const d = num(dpi.value);
    if (!(d > 0)) return;
    if (src === "px" || src === "dpi") { const p = num(px.value); mm.value = Number.isFinite(p) ? fmtNum((p / d) * 25.4, 2).replace(/,/g, "") : ""; inch.value = Number.isFinite(p) ? fmtNum(p / d, 3).replace(/,/g, "") : ""; }
    if (src === "mm") { const m = num(mm.value); px.value = Number.isFinite(m) ? Math.round((m / 25.4) * d) : ""; inch.value = Number.isFinite(m) ? fmtNum(m / 25.4, 3).replace(/,/g, "") : ""; }
    if (src === "inch") { const i = num(inch.value); px.value = Number.isFinite(i) ? Math.round(i * d) : ""; mm.value = Number.isFinite(i) ? fmtNum(i * 25.4, 2).replace(/,/g, "") : ""; }
  };
  dpi.addEventListener("input", () => fix("dpi")); px.addEventListener("input", () => fix("px"));
  mm.addEventListener("input", () => fix("mm")); inch.addEventListener("input", () => fix("inch"));
  return card("Pixels ↔ print size", h("div", { class: "row" }, field("DPI", dpi), field("Pixels", px), field("mm", mm), field("inch", inch)),
    h("div", { class: "note" }, "e.g. a 90 mm card at 300 DPI needs 1063 px."));
}

export default function (root) {
  root.append(
    converter("Length", LENGTH, ["in", "1"], "pt = typographic point (1/72 inch). Type in any box; the rest update."),
    pxCard(),
    converter("Area", AREA, ["sq ft", "1"], "Handy for flex, vinyl and sunboard priced per sq ft. 1 sq m = 10.764 sq ft."),
  );
}
