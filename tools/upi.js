import { h, field, numIn, card, copy, store, status, downloadCanvas } from "../assets/ui.js";
import { toPaise, fmtPaise } from "../assets/lib/money.js";
import { upiLink } from "../assets/lib/misc.js";
import { qrCanvas } from "../assets/lib/qr.js";

export default function (root) {
  const s = store.get("upi", { vpa: "", name: "Print9" });
  const vpa = h("input", { class: "in mono", placeholder: "yourname@okhdfcbank", value: s.vpa, autocapitalize: "none", autocomplete: "off", spellcheck: "false" });
  const name = h("input", { class: "in", placeholder: "Print9", value: s.name });
  const amount = numIn({ class: "in big", placeholder: "0.00 (leave blank for any amount)" });
  const note = h("input", { class: "in", placeholder: "e.g. Invoice P9/2026/045", maxlength: "80" });
  const out = h("div");
  [vpa, name, amount, note].forEach((i) => i.addEventListener("input", run));

  root.append(h("div", { class: "cols" },
    card(null,
      field("Your UPI ID", vpa, "Saved on this device for next time."),
      field("Name shown to the payer", name),
      field("Amount (₹)", amount),
      field("Note / invoice number (optional)", note),
      h("div", { class: "note" }, "The customer scans with any UPI app (GPay, PhonePe, Paytm, bank apps) and sees the amount filled in. Make a small test payment once to confirm your UPI ID is right.")),
    out));

  function run() {
    store.set("upi", { vpa: vpa.value.trim(), name: name.value });
    out.replaceChildren();
    if (!vpa.value.trim()) { out.append(card(null, h("div", { class: "muted" }, "Enter your UPI ID to make the QR."))); return; }
    const p = amount.value.trim() ? toPaise(amount.value) : NaN;
    if (amount.value.trim() && !(p > 0)) { out.append(status("bad", "Amount must be more than zero.")); return; }
    const link = upiLink({ vpa: vpa.value, name: name.value, amountPaise: p, note: note.value });
    if (!link) { out.append(status("bad", "That UPI ID doesn't look right (it should look like name@bank).")); return; }
    const caption = (p > 0 ? `₹${fmtPaise(p)} · ` : "") + (name.value.trim() || vpa.value.trim());
    const c = qrCanvas(link, { ecl: "M", scale: 10, caption });
    out.append(card(null,
      h("div", { class: "qr-box" }, c),
      h("div", { style: { textAlign: "center", marginTop: "8px", fontWeight: "700" } }, p > 0 ? `Pay ₹${fmtPaise(p)}` : "Any amount", " to ", vpa.value.trim()),
      h("div", { class: "btns", style: { justifyContent: "center" } },
        h("button", { class: "btn small", type: "button", onclick: () => downloadCanvas(c, `upi-qr${p > 0 ? "-" + (p / 100).toFixed(2) : ""}.png`) }, "Download PNG"),
        h("button", { class: "btn small ghost", type: "button", onclick: () => copy(link, "Payment link copied") }, "Copy UPI link"),
        h("button", { class: "btn small ghost", type: "button", onclick: () => window.print() }, "Print"))));
  }
  run();
}
