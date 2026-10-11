import { h, card, copy, store, seg, kv } from "../assets/ui.js";
import { toPaise, fmtPaise, fmtNum } from "../assets/lib/money.js";
import { calcInvoice, RATES } from "../assets/lib/gst.js";
import { amountInWords } from "../assets/lib/words.js";

const blank = () => ({ desc: "", qty: "1", price: "", rate: 18, inclusive: false });

export default function (root) {
  let rows = store.get("invoiceRows", [blank()]);
  const saved = store.get("invoiceOpts", { inter: false, round: "nearest" });
  const placeSeg = seg([[false, "Same state — CGST + SGST"], [true, "Other state — IGST"]], saved.inter, run);
  const roundSeg = seg([["off", "No round-off"], ["nearest", "Nearest ₹1"], ["up", "Up"], ["down", "Down"]], saved.round, run);
  const tbody = h("tbody");
  const out = h("div");

  function draw() {
    tbody.replaceChildren(...rows.map((r, i) => {
      const upd = (k) => (e) => { rows[i][k] = e.target.type === "checkbox" ? e.target.checked : (k === "rate" ? parseFloat(e.target.value) : e.target.value); run(); };
      return h("tr", null,
        h("td", null, h("input", { class: "in", value: r.desc, placeholder: "Item", oninput: upd("desc"), style: { minWidth: "130px" } })),
        h("td", null, h("input", { class: "in", value: r.qty, inputmode: "decimal", oninput: upd("qty"), style: { width: "74px" } })),
        h("td", null, h("input", { class: "in", value: r.price, inputmode: "decimal", placeholder: "0.00", oninput: upd("price"), style: { width: "110px" } })),
        h("td", null, h("select", { class: "in", onchange: upd("rate"), style: { width: "86px" } },
          [...RATES, 12, 28].map((x) => h("option", { value: x, selected: x === r.rate }, x + "%")))),
        h("td", { style: { textAlign: "center" } }, h("input", { type: "checkbox", checked: !!r.inclusive, onchange: upd("inclusive"), "aria-label": "Price includes GST", style: { width: "22px", height: "22px" } })),
        h("td", { class: "num", "data-line": i }, ""),
        h("td", null, h("button", { class: "icon-btn", type: "button", "aria-label": "Remove item", onclick: () => { rows.splice(i, 1); if (!rows.length) rows.push(blank()); draw(); run(); } }, "×")));
    }));
  }

  function run() {
    store.set("invoiceRows", rows);
    store.set("invoiceOpts", { inter: placeSeg.get(), round: roundSeg.get() });
    const inv = calcInvoice(rows.map((r) => ({ qty: parseFloat(String(r.qty).replace(/,/g, "")), pricePaise: toPaise(r.price), rate: r.rate, inclusive: r.inclusive })),
      { inter: placeSeg.get(), round: roundSeg.get() });
    inv.lines.forEach((l, i) => {
      const td = tbody.querySelector(`[data-line="${i}"]`);
      if (td) td.textContent = l ? fmtPaise(l.total) : "—";
    });
    const inter = placeSeg.get();
    const sum = h("table", { class: "tbl" },
      h("thead", null, h("tr", null, h("th", null, "Rate"), h("th", { class: "num" }, "Taxable"),
        inter ? h("th", { class: "num" }, "IGST") : [h("th", { class: "num" }, "CGST"), h("th", { class: "num" }, "SGST")])),
      h("tbody", null, inv.summary.map((g) => h("tr", null, h("td", null, fmtNum(g.rate, 3) + "%"), h("td", { class: "num" }, fmtPaise(g.taxable)),
        inter ? h("td", { class: "num" }, fmtPaise(g.igst)) : [h("td", { class: "num" }, fmtPaise(g.cgst)), h("td", { class: "num" }, fmtPaise(g.sgst))]))));
    const words = amountInWords(inv.grand);
    out.replaceChildren(card("Totals",
      kv([
        ["Taxable value", fmtPaise(inv.taxable)],
        inter ? ["IGST", fmtPaise(inv.igst)] : ["CGST", fmtPaise(inv.cgst)],
        inter ? null : ["SGST", fmtPaise(inv.sgst)],
        ["Total GST", fmtPaise(inv.tax), "sub"],
        inv.roundOff ? ["Round-off", (inv.roundOff > 0 ? "+" : "") + fmtPaise(inv.roundOff), "sub"] : null,
        ["Grand total", "₹" + fmtPaise(inv.grand), "total"],
      ]),
      h("div", { class: "small muted", style: { marginTop: "6px" } }, words),
      inv.summary.length ? h("div", { class: "scroll-x", style: { marginTop: "12px" } }, sum) : null,
      h("div", { class: "btns" },
        h("button", { class: "btn small ghost", type: "button", onclick: () => copy(textSummary(inv, inter, words), "Bill copied") }, "Copy bill summary"),
        h("button", { class: "btn small ghost", type: "button", onclick: () => window.print() }, "Print"))));
  }

  function textSummary(inv, inter, words) {
    const lines = rows.map((r, i) => inv.lines[i] ? `${r.desc || "Item " + (i + 1)} — ${r.qty} × ₹${r.price}${r.inclusive ? " (incl. GST)" : ""} @ ${r.rate}% = ₹${fmtPaise(inv.lines[i].total)}` : null).filter(Boolean);
    return [...lines, "",
      `Taxable: ₹${fmtPaise(inv.taxable)}`,
      inter ? `IGST: ₹${fmtPaise(inv.igst)}` : `CGST: ₹${fmtPaise(inv.cgst)}  SGST: ₹${fmtPaise(inv.sgst)}`,
      inv.roundOff ? `Round-off: ${fmtPaise(inv.roundOff)}` : null,
      `Grand total: ₹${fmtPaise(inv.grand)}`, words].filter((x) => x != null).join("\n");
  }

  root.append(
    card(null,
      h("div", { class: "scroll-x" }, h("table", { class: "tbl" },
        h("thead", null, h("tr", null, h("th", null, "Item"), h("th", null, "Qty"), h("th", null, "Price ₹"), h("th", null, "GST"), h("th", null, "Incl.?"), h("th", { class: "num" }, "Line total"), h("th", null, ""))),
        tbody)),
      h("div", { class: "btns" },
        h("button", { class: "btn small", type: "button", onclick: () => { rows.push(blank()); draw(); run(); tbody.lastChild?.querySelector("input")?.focus(); } }, "+ Add item"),
        h("button", { class: "btn small ghost", type: "button", onclick: () => { rows = [blank()]; draw(); run(); } }, "Clear all")),
      h("div", { style: { marginTop: "12px" } }, placeSeg.el, roundSeg.el),
      h("div", { class: "note" }, "Tick “Incl.?” when the price already includes GST. GST is worked out line by line and rounded to the paisa, like standard billing software.")),
    out);
  draw(); run();
}
