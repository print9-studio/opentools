import { h, field, card, copy, status, downloadCanvas, store } from "../assets/ui.js";
import { waLink } from "../assets/lib/misc.js";
import { qrCanvas } from "../assets/lib/qr.js";

export default function (root) {
  const num = h("input", { class: "in mono", placeholder: "Customer's mobile, e.g. 98400 12345", inputmode: "tel" });
  const msg = h("textarea", { class: "in", placeholder: "Hi! Your order from Print9 is ready for pickup." });
  const tpls = store.get("waTemplates", [
    "Hi! Your order from Print9 is ready for pickup.",
    "Hi! Please find the proof attached. Kindly confirm to proceed with printing.",
    "Hi! Gentle reminder: payment of ₹____ for your order is pending. UPI or bank transfer is fine.",
  ]);
  const tplBox = h("div", { class: "btns" }, tpls.map((t) => h("button", { class: "btn small ghost", type: "button", onclick: () => { msg.value = t; run(); } }, t.length > 34 ? t.slice(0, 33) + "…" : t)));
  const out = h("div");
  [num, msg].forEach((i) => i.addEventListener("input", run));
  root.append(h("div", { class: "cols" },
    card(null, field("WhatsApp number", num, "10-digit Indian numbers get +91 added. For other countries include the country code."),
      field("Message (optional)", msg), h("div", { class: "small muted" }, "Quick messages:"), tplBox),
    out));

  function run() {
    out.replaceChildren();
    if (!num.value.trim()) return;
    const link = waLink(num.value, msg.value.trim());
    if (!link) { out.append(status("bad", "That number doesn't look right.")); return; }
    const c = qrCanvas(link, { ecl: "M", scale: 8 });
    out.append(card(null,
      h("div", { class: "btns" },
        h("a", { class: "btn", href: link, target: "_blank", rel: "noopener" }, "Open chat in WhatsApp ↗"),
        h("button", { class: "btn ghost", type: "button", onclick: () => copy(link, "Link copied") }, "Copy link")),
      h("div", { class: "small mono", style: { wordBreak: "break-all", margin: "10px 0" } }, link),
      h("div", { class: "qr-box" }, c),
      h("div", { class: "btns", style: { justifyContent: "center" } }, h("button", { class: "btn small ghost", type: "button", onclick: () => downloadCanvas(c, "whatsapp-qr.png") }, "Download QR"))));
  }
}
