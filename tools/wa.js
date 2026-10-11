import { h, field, card, copy, status, downloadCanvas, store } from "../assets/ui.js";
import { waLink, waNumber, waPretty } from "../assets/lib/misc.js";
import { qrCanvas } from "../assets/lib/qr.js";

export default function (root) {
  const num = h("input", { class: "in mono", type: "text", placeholder: "98400 12345 or +91 98400 12345", inputmode: "tel", autocomplete: "off", "aria-label": "WhatsApp number" });
  const pasteBtn = h("button", { class: "btn ghost", type: "button", style: { flex: "0 0 auto" }, onclick: async () => {
    try { num.value = (await navigator.clipboard.readText()).trim(); run(); }
    catch { num.focus(); }
  } }, "Paste");
  const recog = h("div", { class: "small", style: { marginTop: "6px", minHeight: "18px" } });
  const msg = h("textarea", { class: "in", placeholder: "Hi! Your order from Print9 is ready for pickup." });
  const tpls = store.get("waTemplates", [
    "Hi! Your order from Print9 is ready for pickup.",
    "Hi! Please find the proof attached. Kindly confirm to proceed with printing.",
    "Hi! Gentle reminder: payment of ₹____ for your order is pending. UPI or bank transfer is fine.",
  ]);
  const tplBox = h("div", { class: "btns" }, tpls.map((t) => h("button", { class: "btn small ghost", type: "button", onclick: () => { msg.value = t; run(); } }, t.length > 34 ? t.slice(0, 33) + "…" : t)));
  const out = h("div");
  const quick = h("div");
  [num, msg].forEach((i) => i.addEventListener("input", run));
  root.append(h("div", { class: "cols" },
    card(null, field("WhatsApp number", h("div", { class: "row", style: { flexWrap: "nowrap" } }, num, pasteBtn), "Paste or type 10 digits, or +91 with the number — spaces, dashes and brackets are fine. For other countries, include + and the country code."),
      recog,
      field("Message (optional)", msg), h("div", { class: "small muted" }, "Quick messages:"), tplBox, quick),
    out));

  function run() {
    out.replaceChildren();
    recog.replaceChildren();
    quick.replaceChildren();
    if (!num.value.trim()) return;
    const n = waNumber(num.value);
    const link = waLink(num.value, msg.value.trim());
    if (!n || !link) {
      const d = num.value.replace(/\D/g, "").length;
      out.append(status("bad", d < 10 ? `Only ${d} digits so far — a mobile number has 10.` : "That number doesn't look right. Use 10 digits, or + and the country code."));
      return;
    }
    recog.append(h("span", { style: { color: "var(--ok)", fontWeight: "600" } }, "✓ Sending to " + waPretty(n)));
    const c = qrCanvas(link, { ecl: "M", scale: 8 });
    quick.append(h("div", { class: "btns", style: { marginTop: "14px" } },
      h("a", { class: "btn", href: link, target: "_blank", rel: "noopener", style: { flex: "1 1 auto" } }, "Open chat in WhatsApp ↗"),
      h("button", { class: "btn ghost", type: "button", onclick: () => copy(link, "Link copied") }, "Copy link")));
    out.append(card("Share as link or QR",
      h("div", { class: "small mono", style: { wordBreak: "break-all", margin: "10px 0" } }, link),
      h("div", { class: "qr-box" }, c),
      h("div", { class: "btns", style: { justifyContent: "center" } }, h("button", { class: "btn small ghost", type: "button", onclick: () => downloadCanvas(c, "whatsapp-qr.png") }, "Download QR"))));
  }
}
