import { h, field, numIn, seg, kv, card, store, num } from "../assets/ui.js";
import { fmtNum } from "../assets/lib/money.js";
import { priceFromCost, marginFromPrices } from "../assets/lib/misc.js";
import { RATES } from "../assets/lib/gst.js";

const inr = new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const R = (n) => (Number.isFinite(n) ? "₹" + inr.format(n) : "—");
const P = (n) => (Number.isFinite(n) ? fmtNum(n, 2) + "%" : "—");

export default function (root) {
  const s = store.get("margin", { wastage: "5", margin: "50", basis: "margin", gst: 18 });

  /* --- 1. price from cost --- */
  const cost = numIn({ placeholder: "0.00" });
  const wastage = numIn({ value: s.wastage });
  const pct = numIn({ value: s.margin });
  const basis = seg([["margin", "Margin % (on selling price)"], ["markup", "Markup % (on cost)"]], s.basis, run1);
  const gstSeg = seg(RATES.map((r) => [r, r + "%"]), s.gst, run1);
  const out1 = h("div");
  [cost, wastage, pct].forEach((i) => i.addEventListener("input", run1));

  function run1() {
    store.set("margin", { wastage: wastage.value, margin: pct.value, basis: basis.get(), gst: gstSeg.get() });
    const c = num(cost.value);
    out1.replaceChildren();
    if (!Number.isFinite(c)) return;
    const w = num(wastage.value) || 0;
    const m = num(pct.value) || 0;
    const r = basis.get() === "margin" ? priceFromCost(c, { wastagePct: w, marginPct: m }) : priceFromCost(c, { wastagePct: w, markupPct: m });
    if (!r) { out1.append(h("div", { class: "status bad" }, "Margin must be below 100%.")); return; }
    const g = gstSeg.get();
    out1.append(kv([
      ["Cost incl. wastage", R(r.cost)],
      ["Profit", R(r.profit)],
      ["Margin / Markup", P(r.marginPct) + " / " + P(r.markupPct), "sub"],
      ["Selling price (before GST)", R(r.sp)],
      [`GST ${g}%`, R(r.sp * g / 100), "sub"],
      ["Price to customer (incl. GST)", R(r.sp * (1 + g / 100)), "total"],
    ]));
  }

  /* --- 2. margin from cost and price --- */
  const c2 = numIn({ placeholder: "Cost" }), sp2 = numIn({ placeholder: "Selling price" });
  const out2 = h("div");
  [c2, sp2].forEach((i) => i.addEventListener("input", () => {
    const a = num(c2.value), b = num(sp2.value);
    out2.replaceChildren();
    if (!Number.isFinite(a) || !Number.isFinite(b)) return;
    const r = marginFromPrices(a, b);
    out2.append(kv([["Profit", R(r.profit)], ["Margin (on selling price)", P(r.marginPct)], ["Markup (on cost)", P(r.markupPct)]]));
  }));

  /* --- 3. discount --- */
  const mrp = numIn({ placeholder: "Price" }), disc = numIn({ placeholder: "Discount %" }), net = numIn({ placeholder: "Final price" });
  const out3 = h("div");
  function run3(src) {
    const a = num(mrp.value), d = num(disc.value), n = num(net.value);
    out3.replaceChildren();
    if (!Number.isFinite(a)) return;
    if (src !== "net" && Number.isFinite(d)) {
      const f = a * (1 - d / 100);
      out3.append(kv([["You save", R(a - f)], ["Final price", R(f), "total"]]));
    } else if (Number.isFinite(n)) {
      out3.append(kv([["Discount given", R(a - n)], ["Discount %", P(a ? ((a - n) / a) * 100 : NaN), "total"]]));
    }
  }
  mrp.addEventListener("input", () => run3(disc.value ? "disc" : "net"));
  disc.addEventListener("input", () => { net.value = ""; run3("disc"); });
  net.addEventListener("input", () => { disc.value = ""; run3("net"); });

  root.append(
    card("Selling price from cost",
      h("div", { class: "row" }, field("Cost per piece (₹)", cost), field("Wastage %", wastage)),
      basis.el, field("Percentage", pct, "Print9 default: 50% margin on selling price with 5% wastage."),
      field("GST on selling price", gstSeg.el), out1),
    h("div", { class: "cols" },
      card("Margin from cost and price", h("div", { class: "row" }, field("Cost (₹)", c2), field("Selling price (₹)", sp2)), out2),
      card("Discount", field("Price (₹)", mrp), h("div", { class: "row" }, field("Discount %", disc), field("…or final price (₹)", net)), out3)),
    h("div", { class: "note" }, "Margin = profit ÷ selling price. Markup = profit ÷ cost. A 50% margin is the same as a 100% markup."));
  run1();
}
