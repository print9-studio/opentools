// QR drawing helper (uses the MIT-licensed qrcode-generator library, bundled locally).
import qrcode from "../vendor/qrcode.mjs";

qrcode.stringToBytes = qrcode.stringToBytesFuncs["UTF-8"];

/** Draw text as a QR code onto a new canvas. ecl: L | M | Q | H */
export function qrCanvas(text, { ecl = "M", scale = 10, margin = 4, caption = "" } = {}) {
  const q = qrcode(0, ecl);
  q.addData(text);
  q.make();
  const n = q.getModuleCount();
  const size = (n + margin * 2) * scale;
  const capH = caption ? Math.round(scale * 5) : 0;
  const c = document.createElement("canvas");
  c.width = size; c.height = size + capH;
  const g = c.getContext("2d");
  g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = "#000";
  for (let r = 0; r < n; r++) for (let col = 0; col < n; col++) if (q.isDark(r, col)) g.fillRect((col + margin) * scale, (r + margin) * scale, scale, scale);
  if (caption) {
    g.fillStyle = "#111"; g.textAlign = "center"; g.textBaseline = "middle";
    g.font = `600 ${Math.round(scale * 2.4)}px -apple-system, Segoe UI, Roboto, Arial, sans-serif`;
    g.fillText(caption.slice(0, 48), size / 2, size + capH / 2 - scale * 0.8);
  }
  return c;
}
