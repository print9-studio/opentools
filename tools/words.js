import { h, field, numIn, seg, card, copy, store, status } from "../assets/ui.js";
import { toPaise, fmtPaise } from "../assets/lib/money.js";
import { amountInWords } from "../assets/lib/words.js";

export default function (root) {
  const amount = numIn({ class: "in big", placeholder: "0.00", "aria-label": "Amount" });
  const style = seg([["indian", "Indian (lakh, crore)"], ["intl", "International (million)"]], store.get("wordsStyle", "indian"), run);
  const kase = seg([["title", "Title Case"], ["upper", "UPPER CASE"]], store.get("wordsCase", "title"), run);
  const out = h("div");
  amount.addEventListener("input", run);

  root.append(card(null, field("Amount (₹)", amount), style.el, kase.el), out);

  function run() {
    store.set("wordsStyle", style.get()); store.set("wordsCase", kase.get());
    out.replaceChildren();
    if (!amount.value.trim()) return;
    const p = toPaise(amount.value);
    if (!Number.isFinite(p)) { out.append(status("bad", "That doesn't look like an amount.")); return; }
    if (Math.abs(p) >= 1e17) { out.append(status("bad", "That amount is too large.")); return; }
    let w = amountInWords(p, { style: style.get() });
    if (kase.get() === "upper") w = w.toUpperCase();
    out.append(card(null,
      h("div", { class: "muted small" }, "₹" + fmtPaise(p)),
      h("div", { style: { fontSize: "21px", fontWeight: "700", margin: "6px 0 4px", lineHeight: "1.35" } }, w),
      h("div", { class: "btns" }, h("button", { class: "btn small", type: "button", onclick: () => copy(w, "Words copied") }, "Copy"))));
  }
  if (matchMedia("(pointer:fine)").matches) amount.focus();
}
