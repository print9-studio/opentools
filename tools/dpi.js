import { h, field, numIn, seg, kv, card, num, status } from "../assets/ui.js";
import { fmtNum } from "../assets/lib/money.js";

const verdict = (dpi) => dpi >= 300 ? ["ok", "Sharp — great for print (300+ DPI)"]
  : dpi >= 200 ? ["ok", "Good — fine for most prints (200–300 DPI)"]
  : dpi >= 150 ? ["warn", "OK for large prints viewed from a distance (150–200 DPI)"]
  : ["bad", "Low — will look soft or pixelated (below 150 DPI)"];

export default function (root) {
  let px = null; // {w, h, name}
  const file = h("input", { type: "file", accept: "image/*", class: "hide" });
  const drop = h("div", { class: "drop", role: "button", tabindex: "0", onclick: () => file.click(), onkeydown: (e) => { if (e.key === "Enter") file.click(); } },
    "Tap to choose a photo, or drop an image here", h("div", { class: "small" }, "The image stays on your device — nothing is uploaded."));
  const pw = numIn({ placeholder: "pixels" }), ph = numIn({ placeholder: "pixels" });
  const tw = numIn({ placeholder: "width" }), th = numIn({ placeholder: "height" });
  const unit = seg([["mm", "mm"], ["in", "inch"], ["cm", "cm"]], "mm", run);
  const out = h("div");
  [pw, ph, tw, th].forEach((i) => i.addEventListener("input", () => { if (i === pw || i === ph) px = null; run(); }));

  file.addEventListener("change", () => file.files[0] && load(file.files[0]));
  drop.addEventListener("dragover", (e) => { e.preventDefault(); drop.classList.add("over"); });
  drop.addEventListener("dragleave", () => drop.classList.remove("over"));
  drop.addEventListener("drop", (e) => { e.preventDefault(); drop.classList.remove("over"); const f = e.dataTransfer.files[0]; if (f) load(f); });

  function load(f) {
    const url = URL.createObjectURL(f);
    const img = new Image();
    img.onload = () => { px = { w: img.naturalWidth, h: img.naturalHeight, name: f.name }; pw.value = px.w; ph.value = px.h; URL.revokeObjectURL(url); run(); };
    img.onerror = () => { out.replaceChildren(status("bad", "Couldn't read that file as an image (HEIC from iPhone may need converting to JPG first).")); };
    img.src = url;
  }

  function run() {
    out.replaceChildren();
    const W = num(pw.value), H = num(ph.value);
    if (!(W > 0 && H > 0)) return;
    const u = unit.get(), perIn = u === "mm" ? 25.4 : u === "cm" ? 2.54 : 1;
    const size = (dpi) => `${fmtNum((W / dpi) * perIn, 1)} × ${fmtNum((H / dpi) * perIn, 1)} ${u}`;
    const rows = [
      px ? ["File", px.name] : null,
      ["Pixels", `${W} × ${H} (${fmtNum((W * H) / 1e6, 1)} MP)`],
      ["Max size at 300 DPI (sharp)", size(300)],
      ["Max size at 200 DPI (good)", size(200)],
      ["Max size at 150 DPI (large/distant)", size(150)],
    ];
    const a = num(tw.value), b = num(th.value);
    let v = null;
    if (a > 0 && b > 0) {
      // Match orientation: compare long side to long side
      const [pl, ps] = W >= H ? [W, H] : [H, W];
      const [tl, ts] = a >= b ? [a, b] : [b, a];
      const dpi = Math.min(pl / (tl / perIn), ps / (ts / perIn));
      rows.push([`Effective DPI at ${a} × ${b} ${u}`, fmtNum(dpi, 0) + " DPI", "total"]);
      v = verdict(dpi);
    }
    out.append(card(null, kv(rows), v ? status(v[0], v[1]) : null));
  }

  root.append(h("div", { class: "cols" },
    card(null, drop, file,
      h("div", { class: "row", style: { marginTop: "12px" } }, field("Width (px)", pw), field("Height (px)", ph)),
      field("Print size unit", unit.el),
      h("div", { class: "row" }, field("Print width", tw), field("Print height", th)),
      h("div", { class: "note" }, "Pick a photo or type its pixel size, then the print size to see if it will come out sharp.")),
    out));
}
