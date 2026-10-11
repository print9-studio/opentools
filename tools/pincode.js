import { h, field, card, status, copy } from "../assets/ui.js";
import { checkPIN } from "../assets/lib/ids.js";

// India Post data via the free postalpincode.in API.
const API = "https://api.postalpincode.in/pincode/";

export default function (root) {
  const inp = h("input", { class: "in big mono", placeholder: "600097", inputmode: "numeric", maxlength: "6", autocomplete: "off", "aria-label": "PIN code" });
  const out = h("div");
  root.append(card(null, field("PIN code", inp, "6 digits. Needs internet.")), out);
  let seq = 0;
  inp.addEventListener("input", async () => {
    const my = ++seq;
    out.replaceChildren();
    const c = checkPIN(inp.value);
    if (!c.pin) return;
    if (c.pin.length < 6) return;
    if (!c.ok) { out.append(status("bad", "Not a valid PIN code (6 digits, first digit 1–9).")); return; }
    out.append(h("div", { class: "muted" }, "Looking up…"));
    try {
      const r = await fetch(API + c.pin);
      if (!r.ok) throw new Error("HTTP " + r.status);
      const j = await r.json();
      if (my !== seq) return;
      out.replaceChildren();
      const po = j && j[0] && j[0].PostOffice;
      if (!po || !po.length) { out.append(status("bad", "No post office found for " + c.pin + ".")); return; }
      const f = po[0];
      out.append(card(`${f.District}, ${f.State}`,
        h("div", { class: "small muted", style: { marginBottom: "8px" } }, `${po.length} post office${po.length > 1 ? "s" : ""} · ${f.Division || ""} division · ${f.Region || ""} region`),
        h("div", { class: "scroll-x" }, h("table", { class: "tbl" },
          h("thead", null, h("tr", null, h("th", null, "Post office"), h("th", null, "Type"), h("th", null, "Delivery"))),
          h("tbody", null, po.map((p) => h("tr", null, h("td", null, p.Name), h("td", null, p.BranchType || "—"), h("td", null, p.DeliveryStatus || "—")))))),
        h("div", { class: "btns" }, h("button", { class: "btn small ghost", type: "button", onclick: () => copy(`${f.District}, ${f.State} - ${c.pin}`, "Copied") }, "Copy “District, State - PIN”")),
        h("div", { class: "small muted", style: { marginTop: "8px" } }, "Source: India Post data via postalpincode.in.")));
    } catch {
      if (my !== seq) return;
      out.replaceChildren(status("warn", "Couldn't reach the PIN code service. Check your internet and try again."));
    }
  });
  if (matchMedia("(pointer:fine)").matches) inp.focus();
}
