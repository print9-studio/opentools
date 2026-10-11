import { h, field, numIn, seg, kv, card, copy, store, status } from "../assets/ui.js";
import { toPaise, fmtPaise, fmtNum } from "../assets/lib/money.js";
import { calcGST, RATES, OLD_RATES } from "../assets/lib/gst.js";

export default function (root) {
  const saved = store.get("gst", { rate: 18, mode: "add", inter: false, round: "nearest" });
  const amount = numIn({ class: "in big", placeholder: "0.00", "aria-label": "Amount" });
  const custom = numIn({ placeholder: "Other %", style: { maxWidth: "120px" }, "aria-label": "Other GST rate" });
  const rateOpts = [...RATES, ...OLD_RATES].map((r) => [r, r + "%" + (OLD_RATES.includes(r) ? " (old)" : "")]);
  const allRates = rateOpts.map(([r]) => r);
  const rateSeg = seg(rateOpts, allRates.includes(saved.rate) ? saved.rate : null, () => { custom.value = ""; run(); });
  if (!allRates.includes(saved.rate) && saved.rate != null) custom.value = saved.rate;
  const modeSeg = seg([["add", "Add GST"], ["remove", "Remove GST (price incl. GST)"]], saved.mode, run);
  const placeSeg = seg([[false, "Same state (TN) — CGST + SGST"], [true, "Other state — IGST"]], saved.inter, run);
  const roundSeg = seg([["off", "No round-off"], ["nearest", "Nearest ₹1"], ["up", "Up"], ["down", "Down"]], saved.round, run);

  const out = h("div");
  amount.addEventListener("input", run);
  custom.addEventListener("input", () => { rateSeg.set(null); run(); });

  root.append(h("div", { class: "split" },
    h("div", { class: "split-a" }, card(null,
      field("Amount (₹)", amount),
      field("GST rate", h("div", null, rateSeg.el, custom), "Rates in force: 0, 0.25, 1.5, 3, 5, 18, 40%. 12% and 28% only for checking bills dated before 22 Sep 2025."))),
    h("div", { class: "split-o" }, out),
    h("div", { class: "split-b" }, card(null,
      field("Type", modeSeg.el),
      field("Place of supply", placeSeg.el),
      field("Round-off", roundSeg.el)))));

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
    const g = calcGST(p, r, { mode, inter, round });
    const half = fmtNum(r / 2, 3);
    const rows = [
      ["Taxable value", fmtPaise(g.taxable)],
      inter ? [`IGST @ ${fmtNum(r, 3)}%`, fmtPaise(g.igst)] : null,
      !inter ? [`CGST @ ${half}%`, fmtPaise(g.cgst)] : null,
      !inter ? [`SGST @ ${half}%`, fmtPaise(g.sgst)] : null,
      ["Total GST", fmtPaise(g.tax), "sub"],
      ["Total", fmtPaise(g.total)],
      g.roundOff ? ["Round-off", (g.roundOff > 0 ? "+" : "") + fmtPaise(g.roundOff), "sub"] : null,
      ["Grand total", "₹" + fmtPaise(g.grand), "total"],
    ];
    const text = [
      `Taxable value: ₹${fmtPaise(g.taxable)}`,
      inter ? `IGST @ ${fmtNum(r, 3)}%: ₹${fmtPaise(g.igst)}` : `CGST @ ${half}%: ₹${fmtPaise(g.cgst)}\nSGST @ ${half}%: ₹${fmtPaise(g.sgst)}`,
      `Total GST: ₹${fmtPaise(g.tax)}`,
      g.roundOff ? `Round-off: ${fmtPaise(g.roundOff)}` : "",
      `Grand total: ₹${fmtPaise(g.grand)}`,
    ].filter(Boolean).join("\n");
    out.append(card(mode === "add" ? "Price + GST" : "GST inside the price", kv(rows),
      h("div", { class: "btns" },
        h("button", { class: "btn small ghost", type: "button", onclick: () => copy(text, "Break-up copied") }, "Copy break-up"),
        h("button", { class: "btn small ghost", type: "button", onclick: () => copy(fmtPaise(g.grand).replace(/,/g, ""), "Total copied") }, "Copy total"))));
    const bp = Math.round(r * 100);
    const back = inter ? Math.round((g.taxable * bp) / 10000) : 2 * Math.round((g.taxable * bp) / 20000);
    if (mode === "remove" && back !== g.tax) {
      out.append(h("div", { class: "note" }, "GST differs by 1 paisa from the exact rate so that taxable value + GST adds up exactly to your amount. This is normal when removing GST."));
    }
  }
  run();
  if (matchMedia("(pointer:fine)").matches) amount.focus();
}
