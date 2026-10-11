// Imposition ("how many ups") for a print sheet. All sizes in mm.

/** Fit a simple grid of w x h boxes into area W x H with gap g between boxes. */
function grid(W, H, w, h, g) {
  if (w <= 0 || h <= 0 || W < w || H < h) return { cols: 0, rows: 0 };
  const cols = Math.floor((W + g) / (w + g) + 1e-9);
  const rows = Math.floor((H + g) / (h + g) + 1e-9);
  return { cols, rows };
}

/**
 * Best layout of items on a sheet.
 * @param {object} p
 *   sheetW, sheetH  sheet size
 *   itemW, itemH    finished (trim) size
 *   bleed           bleed on each side (Print9 standard: 4 mm)
 *   gap             space between pieces (0 when bleeds butt together)
 *   margin          unprintable margin on every sheet edge
 *   mixed           false = straight grids only (simpler guillotine cutting)
 * @returns {{count, boxes:[{x,y,w,h,rot}], boxW, boxH, areaW, areaH, usedPct, label}}
 * Tries the item upright, rotated, and a main grid plus a rotated strip in
 * the leftover space (both directions), and keeps the layout with most pieces.
 */
export function impose(p) {
  const bleed = Math.max(0, +p.bleed || 0);
  const gap = Math.max(0, +p.gap || 0);
  const margin = Math.max(0, +p.margin || 0);
  const W = +p.sheetW - 2 * margin, H = +p.sheetH - 2 * margin;
  const bw = +p.itemW + 2 * bleed, bh = +p.itemH + 2 * bleed;
  const empty = { count: 0, boxes: [], boxW: bw, boxH: bh, areaW: W, areaH: H, usedPct: 0, label: "Does not fit" };
  if (!(W > 0 && H > 0 && bw > 0 && bh > 0)) return empty;

  const candidates = [];
  const place = (cols, rows, w, h, ox, oy, rot) => {
    const out = [];
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++)
        out.push({ x: ox + c * (w + gap), y: oy + r * (h + gap), w, h, rot });
    return out;
  };

  for (const [w, h, rot] of [[bw, bh, false], [bh, bw, true]]) {
    const g = grid(W, H, w, h, gap);
    const main = place(g.cols, g.rows, w, h, 0, 0, rot);
    candidates.push({ boxes: main, label: rot ? "All rotated" : "All upright" });
    if (!g.cols || !g.rows || p.mixed === false) continue;
    // leftover strip on the right
    const usedW = g.cols * w + (g.cols - 1) * gap;
    const restW = W - usedW - gap;
    const gr = grid(restW, H, h, w, gap);
    if (gr.cols && gr.rows)
      candidates.push({ boxes: main.concat(place(gr.cols, gr.rows, h, w, usedW + gap, 0, !rot)), label: "Mixed (extra column turned)" });
    // leftover strip at the bottom
    const usedH = g.rows * h + (g.rows - 1) * gap;
    const restH = H - usedH - gap;
    const gb = grid(W, restH, h, w, gap);
    if (gb.cols && gb.rows)
      candidates.push({ boxes: main.concat(place(gb.cols, gb.rows, h, w, 0, usedH + gap, !rot)), label: "Mixed (extra row turned)" });
  }
  candidates.sort((a, b) => b.boxes.length - a.boxes.length);
  const best = candidates[0];
  if (!best || !best.boxes.length) return empty;
  const count = best.boxes.length;
  const usedPct = (count * p.itemW * p.itemH) / (p.sheetW * p.sheetH) * 100;
  return { count, boxes: best.boxes, boxW: bw, boxH: bh, areaW: W, areaH: H, usedPct, label: best.label };
}

/** Sheets needed for a quantity, adding wastage % (e.g. 5). */
export function sheetsNeeded(qty, ups, wastagePct = 0) {
  if (!(ups > 0) || !(qty > 0)) return 0;
  const base = Math.ceil(qty / ups);
  return Math.ceil(base * (1 + (wastagePct || 0) / 100));
}

export const INCH = 25.4;
