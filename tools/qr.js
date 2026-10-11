import { h, field, card, seg, copy, downloadCanvas, status } from "../assets/ui.js";
import { qrCanvas } from "../assets/lib/qr.js";

const esc = (s) => String(s).replace(/([\\;,:"])/g, "\\$1");

export default function (root) {
  const type = seg([["text", "Link / text"], ["wifi", "Wi-Fi"], ["vcard", "Contact card"]], "text", run);
  const ecl = seg([["M", "Normal"], ["Q", "Strong"], ["H", "Strongest (for logo overlay)"]], "M", run);
  const text = h("textarea", { class: "in", placeholder: "https://print9.in" });
  const ssid = h("input", { class: "in", placeholder: "Network name" });
  const pass = h("input", { class: "in", placeholder: "Password" });
  const sec = seg([["WPA", "WPA/WPA2"], ["WEP", "WEP"], ["nopass", "No password"]], "WPA", run);
  const vn = h("input", { class: "in", placeholder: "Full name" }), vorg = h("input", { class: "in", placeholder: "Company" });
  const vph = h("input", { class: "in", placeholder: "+91 72002 73672", inputmode: "tel" }), vem = h("input", { class: "in", placeholder: "Email", inputmode: "email" });
  const vweb = h("input", { class: "in", placeholder: "Website" }), vadr = h("input", { class: "in", placeholder: "Address" });
  const paneText = h("div", null, field("Link or text", text));
  const paneWifi = h("div", null, field("Wi-Fi name (SSID)", ssid), field("Password", pass), field("Security", sec.el));
  const paneV = h("div", null, field("Name", vn), field("Company", vorg), h("div", { class: "row" }, field("Phone", vph), field("Email", vem)), field("Website", vweb), field("Address", vadr));
  const out = h("div");
  [text, ssid, pass, vn, vorg, vph, vem, vweb, vadr].forEach((i) => i.addEventListener("input", run));

  root.append(h("div", { class: "cols" }, card(null, type.el, paneText, paneWifi, paneV, field("Error correction", ecl.el)), out));

  function payload() {
    const t = type.get();
    if (t === "text") return text.value.trim();
    if (t === "wifi") return ssid.value ? `WIFI:T:${sec.get()};S:${esc(ssid.value)};${sec.get() !== "nopass" ? "P:" + esc(pass.value) + ";" : ""};` : "";
    if (!vn.value.trim()) return "";
    return ["BEGIN:VCARD", "VERSION:3.0", `FN:${esc(vn.value.trim())}`, `N:${esc(vn.value.trim())};;;;`,
      vorg.value && `ORG:${esc(vorg.value)}`, vph.value && `TEL;TYPE=CELL:${vph.value.replace(/[^\d+]/g, "")}`,
      vem.value && `EMAIL:${vem.value.trim()}`, vweb.value && `URL:${vweb.value.trim()}`, vadr.value && `ADR:;;${esc(vadr.value)};;;;`, "END:VCARD"].filter(Boolean).join("\n");
  }

  function run() {
    const t = type.get();
    paneText.classList.toggle("hide", t !== "text"); paneWifi.classList.toggle("hide", t !== "wifi"); paneV.classList.toggle("hide", t !== "vcard");
    out.replaceChildren();
    const p = payload();
    if (!p) { out.append(card(null, h("div", { class: "muted" }, "Fill in the details to make the QR."))); return; }
    let c;
    try { c = qrCanvas(p, { ecl: ecl.get(), scale: 10 }); }
    catch { out.append(status("bad", "Too much text for one QR code — shorten it.")); return; }
    out.append(card(null, h("div", { class: "qr-box" }, c),
      h("div", { class: "btns", style: { justifyContent: "center" } },
        h("button", { class: "btn small", type: "button", onclick: () => downloadCanvas(c, "qr-code.png") }, "Download PNG"),
        h("button", { class: "btn small ghost", type: "button", onclick: () => copy(p, "Copied") }, "Copy content")),
      h("div", { class: "small muted", style: { textAlign: "center", marginTop: "6px" } }, "PNG is 10 px per dot — sharp enough for print up to about 8 cm. Scan-test before printing in bulk.")));
  }
  run();
}
