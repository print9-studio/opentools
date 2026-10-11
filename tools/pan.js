import { h, field, card, status, kv, copy } from "../assets/ui.js";
import { checkPAN, cleanId } from "../assets/lib/ids.js";

export default function (root) {
  const inp = h("input", { class: "in big mono", placeholder: "ABCDE1234F", maxlength: "14", autocapitalize: "characters", autocomplete: "off", spellcheck: "false", "aria-label": "PAN" });
  const out = h("div");
  root.append(card(null, field("PAN", inp)), out);
  inp.addEventListener("input", () => {
    out.replaceChildren();
    const p = cleanId(inp.value);
    if (!p) return;
    if (p.length < 10) { out.append(h("div", { class: "muted" }, `${p.length} of 10 characters…`)); return; }
    const r = checkPAN(p);
    out.append(card(null,
      r.ok ? status("ok", "✓ Valid PAN format") : status("bad", "✗ Not a valid PAN"),
      ...r.errors.map((e) => h("div", { class: "small", style: { color: "var(--bad)" } }, "• " + e)),
      ...(r.warnings || []).map((e) => h("div", { class: "small", style: { color: "var(--warn)" } }, "• " + e)),
      r.type ? kv([["Holder type (4th letter)", r.type], ["5th letter", r.type.startsWith("Individual") ? `First letter of surname: ${r.nameLetter}` : `First letter of the name: ${r.nameLetter}`]]) : null,
      h("div", { class: "btns" }, h("button", { class: "btn small ghost", type: "button", onclick: () => copy(r.pan) }, "Copy PAN")),
      h("div", { class: "note" }, "This checks the format only. To confirm a PAN belongs to someone, use “Verify Your PAN” on the Income Tax e-filing portal.")));
  });
  if (matchMedia("(pointer:fine)").matches) inp.focus();
}
