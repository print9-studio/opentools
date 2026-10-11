import { h, field, numIn, seg, kv, card, copy, store, status } from "../assets/ui.js";
import { toPaise, fmtPaise, fmtNum } from "../assets/lib/money.js";
import { calcGST, RATES, OLD_RATES } from "../assets/lib/gst.js";

export default function (root) {
  const saved = store.get("gst", { rate: 18, mode: "add", inter: false, round: "nearest" });
  const amount = numIn({ class: "in big", placeholder: "0.00", "aria-label": "Amount" });
  const custom = numIn({ placeholder: "Other %", style: { maxWidth: "110px", minHeight: "36px", padding: "6px 10px", fontSize: "15px" }, "aria-label": "Other GST rate" });
  const rateOpts = [...RATES, ...OLD_RATES].map((r) => [r, r + "%" + (OLD_RATES.includes(r) ? " (old)" : "")]);
  const allRates = rateOpts.map(([r]) => r);
  const rateSeg = seg(rateOpts, allRates.includes(saved.rate) ? saved.rate : null, () => { custom.value = ""; run(); });
  if (!allRates.includes(saved.rate) && saved.rate != null) custom.value = saved.rate;
  const modeSeg = seg([["add", "+ Add GST"], ["remove", "− Remove GST (price incl. GST)"]], saved.mode, run);
  const placeSeg = seg([[false, "Same state (TN) — CGST + SGST"], [true, "Other state — IGST"]], saved.inter, run);
  const roundSeg = seg([["off", "No round-off"], ["nearest", "Nearest ₹1"], ["up", "Up"], ["down", "Down"]], saved.round, run);

  const out = h("div");
  const roundField = field("Round-off", roundSeg.el);
  amount.addEventListener("input", run);
  custom.addEventListener("input", () => { rateSeg.set(null); run(); });

  root.append(h("div", { class: "split" },
    h("div", { class: "split-a" }, card(null,
      field("Amount (₹)", amount),
      modeSeg.el,
      field("GST rate", h("div", { class: "rate-wrap" }, rateSeg.el, custom), "Rates in force: 0, 0.25, 1.5, 3, 5, 18, 40%. 12% and 28% only for checking bills dated before 22 Sep 2025."))),
    h("div", { class: "split-o" }, out),
    h("div", { class: "split-b" }, card(null,
      field("Place of supply", placeSeg.el),
      roundField))));

  function rate() {
    const c = custom.value.trim();
    if (c !== "") return parseFloat(c);
    return rateSeg.get();
  }

  function run() {
    const r = rate();
    const mode = modeSeg.get(), inter = placeSeg.get(), round = roundSeg.get();
    store.set("gst", { rate: r, mode, inter, round });
    const p = toPaise(amount.value);
    out.replaceChildren();
    if (amount.value.trim() === "") { out.append(card(null, h("div", { class: "muted" }, "Type an amount to see the GST break-up."))); return; }
    if (!Number.isFinite(p)) { out.append(status("bad", "That doesn't look like an amount.")); return; }
    if (!(r >= 0 && r <= 100)) { out.append(status("bad", "Pick a GST rate.")); return; }
    const removing = mode === "remove";
    // Round-off only applies when adding GST; when removing, the amount typed is already the final price.
    const g = calcGST(p, r, { mode, inter, round: removing ? "off" : round });
    roundField.classList.toggle("hide", removing);
    const half = fmtNum(r / 2, 3);
    const taxRows = [
      inter ? [`IGST @ ${fmtNum(r, 3)}%`, fmtPaise(g.igst)] : null,
      !inter ? [`CGST @ ${half}%`, fmtPaise(g.cgst)] : null,
      !inter ? [`SGST @ ${half}%`, fmtPaise(g.sgst)] : null,
    ];
    const hero = removing
      ? h("div", { class: "hero" },
          h("div", { class: "hero-tile main" }, h("div", { class: "hero-label" }, "Amount without GST"), h("div", { class: "hero-val" }, "₹" + fmtPaise(g.taxable))),
          h("div", { class: "hero-tile gst" }, h("div", { class: "hero-label" }, `GST removed (${fmtNum(r, 3)}%)`), h("div", { class: "hero-val" }, "₹" + fmtPaise(g.tax))))
      : h("div", { class: "hero" },
          h("div", { class: "hero-tile main" }, h("div", { class: "hero-label" }, "Total with GST"), h("div", { class: "hero-val" }, "₹" + fmtPaise(g.grand))),
          h("div", { class: "hero-tile gst" }, h("div", { class: "hero-label" }, `GST added (${fmtNum(r, 3)}%)`), h("div", { class: "hero-val" }, "₹" + fmtPaise(g.tax))));
    const rows = removing
      ? [["Amount entered (incl. GST)", fmtPaise(p), "sub"], ...taxRows, ["GST removed", "−" + fmtPaise(g.tax)], ["Amount without GST (taxable value)", "₹" + fmtPaise(g.taxable), "total"]]
      : [["Taxable value", fmtPaise(g.taxable)], ...taxRows, ["Total GST", fmtPaise(g.tax), "sub"],
         g.roundOff ? ["Total", fmtPaise(g.total)] : null,
         g.roundOff ? ["Round-off", (g.roundOff > 0 ? "+" : "") + fmtPaise(g.roundOff), "sub"] : null,
         ["Grand total", "₹" + fmtPaise(g.grand), "total"]];
    const gstText = inter ? `IGST @ ${fmtNum(r, 3)}%: ₹${fmtPaise(g.igst)}` : `CGST @ ${half}%: ₹${fmtPaise(g.cgst)}\nSGST @ ${half}%: ₹${fmtPaise(g.sgst)}`;
    const text = removing
      ? [`Amount incl. GST: ₹${fmtPaise(p)}`, gstText, `GST removed: ₹${fmtPaise(g.tax)}`, `Amount without GST: ₹${fmtPaise(g.taxable)}`].join("\n")
      : [`Taxable value: ₹${fmtPaise(g.taxable)}`, gstText, `Total GST: ₹${fmtPaise(g.tax)}`, g.roundOff ? `Round-off: ${fmtPaise(g.roundOff)}` : "", `Grand total: ₹${fmtPaise(g.grand)}`].filter(Boolean).join("\n");
    const mainVal = removing ? g.taxable : g.grand;
    out.append(card(null, hero, kv(rows),
      h("div", { class: "btns" },
        h("button", { class: "btn small ghost", type: "button", onclick: () => copy(text, "Break-up copied") }, "Copy break-up"),
        h("button", { class: "btn small ghost", type: "button", onclick: () => copy(fmtPaise(mainVal).replace(/,/g, ""), "Copied") }, removing ? "Copy amount without GST" : "Copy total"),
        h("button", { class: "btn small ghost", type: "button", onclick: () => copy(fmtPaise(g.tax).replace(/,/g, ""), "GST copied") }, "Copy GST"))));
    const bp = Math.round(r * 100);
    const back = inter ? Math.round((g.taxable * bp) / 10000) : 2 * Math.round((g.taxable * bp) / 20000);
    if (mode === "remove" && back !== g.tax) {
      out.append(h("div", { class: "note" }, "GST differs by 1 paisa from the exact rate so that taxable value + GST adds up exactly to your amount. This is normal when removing GST."));
    }
  }
  run();
  if (matchMedia("(pointer:fine)").matches) amount.focus();
}
