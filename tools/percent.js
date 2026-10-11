import { h, field, numIn, card, num } from "../assets/ui.js";
import { fmtNum } from "../assets/lib/money.js";

const F = (n) => (Number.isFinite(n) ? fmtNum(n, 4) : "—");

function block(title, labels, compute) {
  const ins = labels.map((l) => numIn({ placeholder: l }));
  const out = h("div", { class: "big-out", style: { fontSize: "24px", marginTop: "4px" } }, "—");
  const run = () => {
    const v = ins.map((i) => num(i.value));
    out.textContent = v.every(Number.isFinite) ? compute(...v) : "—";
  };
  ins.forEach((i) => i.addEventListener("input", run));
  return card(title, h("div", { class: "row" }, ins.map((i, k) => field(labels[k], i))), out);
}

export default function (root) {
  root.append(h("div", { class: "cols" },
    block("What is X% of Y?", ["X %", "Y"], (x, y) => F((x / 100) * y)),
    block("X is what % of Y?", ["X", "Y"], (x, y) => (y ? F((x / y) * 100) + "%" : "—")),
    block("% change from A to B", ["From A", "To B"], (a, b) => (a ? (b >= a ? "+" : "") + F(((b - a) / Math.abs(a)) * 100) + "%" : "—")),
    block("Add X% to a number", ["Number", "X %"], (n, x) => F(n * (1 + x / 100))),
    block("Remove X% from a number", ["Number", "X %"], (n, x) => F(n * (1 - x / 100))),
    block("Number before X% was added", ["Final number", "X %"], (n, x) => (x > -100 ? F(n / (1 + x / 100)) : "—"))));
}
