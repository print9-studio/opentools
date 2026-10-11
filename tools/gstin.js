import { h, field, card, copy, status, kv, seg } from "../assets/ui.js";
import { checkGSTIN, cleanId } from "../assets/lib/ids.js";

const PORTAL = "https://services.gst.gov.in/services/searchtp";
const HOME_STATE = "33"; // Print9 is registered in Tamil Nadu

export default function (root) {
  const mode = seg([["one", "Check one"], ["many", "Check a list"]], "one", show);
  const one = h("input", { class: "in big mono", placeholder: "33ABCDE1234F1Z5", maxlength: "20", autocapitalize: "characters", autocomplete: "off", spellcheck: "false", "aria-label": "GSTIN" });
  const many = h("textarea", { class: "in mono", placeholder: "Paste GSTINs — one per line, or separated by commas/spaces" });
  const out = h("div");
  const paneOne = card(null, field("GSTIN", one), h("div", { class: "small muted" }, "Checks the format and the built-in check digit, so typing mistakes are caught instantly."));
  const paneMany = card(null, field("GSTINs", many));
  root.append(mode.el, paneOne, paneMany, out);
  one.addEventListener("input", runOne);
  many.addEventListener("input", runMany);

  function show() {
    const o = mode.get() === "one";
    paneOne.classList.toggle("hide", !o); paneMany.classList.toggle("hide", o);
    o ? runOne() : runMany();
  }

  function runOne() {
    out.replaceChildren();
    const g = cleanId(one.value);
    if (!g) {
      out.append(card("Company name and address", h("div", { class: "small" },
        "The government doesn't allow other websites to fetch taxpayer details automatically (the GST portal search needs a captcha). After checking a GSTIN here, tap “Search on GST portal” — the number is copied for you to paste there."),
        h("div", { class: "btns" }, h("a", { class: "btn small ghost", href: PORTAL, target: "_blank", rel: "noopener" }, "Open GST portal search ↗"))));
      return;
    }
    if (g.length < 15) { out.append(h("div", { class: "muted", style: { padding: "4px 2px" } }, `${g.length} of 15 characters…`)); return; }
    const r = checkGSTIN(g);
    out.append(card(null,
      r.ok ? status("ok", "✓ Valid GSTIN format and check digit") : status("bad", "✗ Not a valid GSTIN"),
      ...r.errors.map((e) => h("div", { class: "small", style: { color: "var(--bad)", margin: "4px 0" } }, "• " + e)),
      ...r.warnings.map((w) => h("div", { class: "small", style: { color: "var(--warn)", margin: "4px 0" } }, "• " + w)),
      kv([
        ["GSTIN", h("span", { class: "mono" }, r.gstin)],
        ["State", r.state ? `${r.state} (${r.stateCode})` : r.stateCode],
        ["PAN", h("span", { class: "mono" }, r.pan)],
        r.panType ? ["PAN holder type", r.panType] : null,
        r.ok ? ["Registration no. under this PAN in the state", String(r.entityCount)] : null,
        r.ok && r.state ? ["Tax on Print9 sale (from Tamil Nadu)", r.stateCode === HOME_STATE ? "Same state → CGST + SGST" : "Other state → IGST"] : null,
      ]),
      h("div", { class: "btns" },
        h("a", { class: "btn small", href: PORTAL, target: "_blank", rel: "noopener", onclick: () => copy(r.gstin, "GSTIN copied — paste it on the portal") }, "Search on GST portal ↗"),
        h("button", { class: "btn small ghost", type: "button", onclick: () => copy(r.gstin) }, "Copy GSTIN"),
        h("button", { class: "btn small ghost", type: "button", onclick: () => copy(r.pan, "PAN copied") }, "Copy PAN")),
      h("div", { class: "note" }, "A valid format means the number is correctly formed — not that the registration is active. The GST portal shows legal name, trade name, address and status (Active / Cancelled).")));
  }

  function runMany() {
    out.replaceChildren();
    const list = [...new Set(many.value.toUpperCase().split(/[\s,;]+/).map(cleanId).filter(Boolean))];
    if (!list.length) return;
    const res = list.map(checkGSTIN);
    const bad = res.filter((r) => !r.ok).length;
    out.append(card(`${res.length} checked · ${res.length - bad} valid · ${bad} invalid`,
      h("div", { class: "scroll-x" }, h("table", { class: "tbl" },
        h("thead", null, h("tr", null, h("th", null, "GSTIN"), h("th", null, "Result"), h("th", null, "State"))),
        h("tbody", null, res.map((r) => h("tr", null,
          h("td", { class: "mono" }, r.gstin),
          h("td", { style: { color: r.ok ? "var(--ok)" : "var(--bad)", fontWeight: "600" } }, r.ok ? "Valid" : r.errors[0]),
          h("td", null, r.state || "—")))))),
      h("div", { class: "btns" }, h("button", { class: "btn small ghost", type: "button", onclick: () => copy(res.map((r) => `${r.gstin}\t${r.ok ? "Valid" : "Invalid: " + r.errors[0]}\t${r.state || ""}`).join("\n"), "Results copied") }, "Copy results (paste into Excel)"))));
  }
  show();
  if (matchMedia("(pointer:fine)").matches) one.focus();
}
