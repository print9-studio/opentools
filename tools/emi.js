import { h, field, numIn, seg, kv, card, num } from "../assets/ui.js";
import { fmtNum } from "../assets/lib/money.js";
import { emi } from "../assets/lib/misc.js";

const R = (n) => "₹" + fmtNum(Math.round(n), 0);

export default function (root) {
  const amt = numIn({ placeholder: "Loan amount" });
  const rate = numIn({ placeholder: "e.g. 10.5" });
  const tenure = numIn({ placeholder: "e.g. 5" });
  const unit = seg([["y", "Years"], ["m", "Months"]], "y", run);
  const out = h("div");
  [amt, rate, tenure].forEach((i) => i.addEventListener("input", run));

  function run() {
    out.replaceChildren();
    const P = num(amt.value), r = num(rate.value), t = num(tenure.value);
    if (![P, r, t].every(Number.isFinite)) return;
    const months = unit.get() === "y" ? Math.round(t * 12) : Math.round(t);
    const e = emi(P, r, months);
    if (!e) return;
    out.append(
      card(null, kv([["Monthly EMI", R(e.emi), "total"], ["Total interest", R(e.interest)], ["Total payment", R(e.total)], ["Number of EMIs", String(months), "sub"]])),
      card("Year-wise", h("div", { class: "scroll-x" }, h("table", { class: "tbl" },
        h("thead", null, h("tr", null, h("th", null, "Year"), h("th", { class: "num" }, "Principal"), h("th", { class: "num" }, "Interest"), h("th", { class: "num" }, "Balance"))),
        h("tbody", null, e.years.map((y) => h("tr", null, h("td", null, y.year), h("td", { class: "num" }, R(y.principal)), h("td", { class: "num" }, R(y.interest)), h("td", { class: "num" }, R(y.balance)))))))));
  }

  root.append(h("div", { class: "cols" },
    card(null, field("Loan amount (₹)", amt), field("Interest rate (% per year)", rate), field("Tenure", tenure), unit.el,
      h("div", { class: "note" }, "Standard reducing-balance EMI. Your bank's figure can differ slightly by rounding and processing fees.")),
    out));
}
