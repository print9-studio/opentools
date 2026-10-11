import { h, field, card, status, kv, copy } from "../assets/ui.js";
import { checkIFSC, cleanId } from "../assets/lib/ids.js";

// Razorpay's free public IFSC API (data from RBI's published lists).
const API = "https://ifsc.razorpay.com/";

export default function (root) {
  const inp = h("input", { class: "in big mono", placeholder: "SBIN0001234", maxlength: "14", autocapitalize: "characters", autocomplete: "off", spellcheck: "false", "aria-label": "IFSC" });
  const out = h("div");
  root.append(card(null, field("IFSC code", inp, "11 characters: 4 letters for the bank, then 0, then 6 for the branch. Needs internet.")), out);
  let seq = 0;
  inp.addEventListener("input", async () => {
    const my = ++seq;
    out.replaceChildren();
    const s = cleanId(inp.value);
    if (!s) return;
    if (s.length < 11) { out.append(h("div", { class: "muted" }, `${s.length} of 11 characters…`)); return; }
    const c = checkIFSC(s);
    if (!c.ok) { out.append(status("bad", "Not a valid IFSC format (5th character must be 0).")); return; }
    out.append(h("div", { class: "muted" }, "Looking up…"));
    try {
      const r = await fetch(API + encodeURIComponent(c.ifsc));
      if (my !== seq) return;
      out.replaceChildren();
      if (r.status === 404) { out.append(status("bad", "No bank branch found for " + c.ifsc + ". Check the code.")); return; }
      if (!r.ok) throw new Error("HTTP " + r.status);
      const d = await r.json();
      const yes = (v) => (v === true ? "Yes" : v === false ? "No" : "—");
      const text = [`${d.BANK} — ${d.BRANCH}`, `IFSC: ${d.IFSC}`, d.MICR ? `MICR: ${d.MICR}` : "", d.ADDRESS, `${d.CITY || ""}, ${d.DISTRICT || ""}, ${d.STATE || ""}`].filter(Boolean).join("\n");
      out.append(card(d.BANK || "Bank",
        kv([
          ["Branch", d.BRANCH || "—"], ["IFSC", h("span", { class: "mono" }, d.IFSC)], ["MICR", d.MICR || "—"],
          ["Address", d.ADDRESS || "—"], ["City / District", [d.CITY, d.DISTRICT].filter(Boolean).join(" / ") || "—"], ["State", d.STATE || "—"],
          d.CONTACT ? ["Contact", d.CONTACT] : null,
          ["NEFT / RTGS / IMPS / UPI", [d.NEFT, d.RTGS, d.IMPS, d.UPI].map(yes).join(" / ")],
        ]),
        h("div", { class: "btns" }, h("button", { class: "btn small ghost", type: "button", onclick: () => copy(text, "Branch details copied") }, "Copy details")),
        h("div", { class: "small muted", style: { marginTop: "8px" } }, "Source: Razorpay IFSC (from RBI lists). Always confirm account details with the payee.")));
    } catch {
      if (my !== seq) return;
      out.replaceChildren(status("warn", "Couldn't reach the IFSC service. Check your internet and try again."));
    }
  });
  if (matchMedia("(pointer:fine)").matches) inp.focus();
}
