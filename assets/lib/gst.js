// GST calculations (India). Amounts in integer paise; see money.js.
import { roundDiv, rateToBp, roundOff } from "./money.js";

/** Current GST rates in force (Notification 9/2025-CT(Rate) as amended
 *  by 19/2025 and 01/2026; the 28% schedule was omitted from 1 Feb 2026). */
export const RATES = [0, 0.25, 1.5, 3, 5, 18, 40];
/** Pre-22 Sep 2025 slabs, kept for checking old invoices. */
export const OLD_RATES = [12, 28];

/**
 * Calculate GST on one amount.
 * @param {number} amountPaise  amount typed by the user, in paise
 * @param {number} rate         GST % (e.g. 18)
 * @param {object} o
 *   o.mode   "add"  = amount is before GST (exclusive)
 *            "remove" = amount already includes GST (inclusive)
 *   o.inter  true = inter-state (IGST), false = intra-state (CGST + SGST)
 *   o.round  "off" | "nearest" | "up" | "down"  (round-off of grand total)
 * @returns {{taxable, cgst, sgst, igst, tax, total, roundOff, grand, rate}}
 *
 * Rules used (same as standard Indian billing software):
 *  - CGST and SGST are always equal halves, each rounded to the paisa.
 *  - "remove": taxable value = amount x 100 / (100 + rate); if the
 *    rounded parts don't add back to the amount, the 1-paisa
 *    difference is absorbed in the taxable value so that
 *    taxable + tax = the amount typed, exactly.
 */
export function calcGST(amountPaise, rate, o = {}) {
  const { mode = "add", inter = false, round = "off" } = o;
  const bp = rateToBp(rate);
  if (!Number.isFinite(amountPaise) || !Number.isFinite(bp)) return null;
  let taxable, cgst = 0, sgst = 0, igst = 0;

  const taxOn = (base) => {
    if (inter) return { igst: roundDiv(base * bp, 10000), half: 0 };
    const half = roundDiv(base * bp, 20000);
    return { igst: 0, half };
  };

  if (mode === "remove") {
    const total = amountPaise;
    const t0 = roundDiv(total * 10000, 10000 + bp);
    // Prefer a taxable value (within ±3 paise of the exact figure) whose GST,
    // worked out normally, adds back to the amount exactly. Such a value
    // usually exists; when it doesn't, fall back to the nearest one and let
    // the GST absorb the last paisa so the parts still add up.
    let found = null;
    for (const d of [0, -1, 1, -2, 2, -3, 3]) {
      const tv = t0 + d;
      const t = taxOn(tv);
      const tax = inter ? t.igst : 2 * t.half;
      if (tv + tax === total) { found = { tv, t }; break; }
    }
    if (found) {
      taxable = found.tv;
      if (inter) igst = found.t.igst; else cgst = sgst = found.t.half;
    } else {
      taxable = t0;
      const t = taxOn(taxable);
      if (inter) igst = total - taxable;
      else { cgst = sgst = t.half; taxable = total - 2 * t.half; }
    }
  } else {
    taxable = amountPaise;
    const t = taxOn(taxable);
    if (inter) igst = t.igst; else cgst = sgst = t.half;
  }
  const tax = cgst + sgst + igst;
  const total = taxable + tax;
  const r = roundOff(total, round);
  return { rate: Number(rate), taxable, cgst, sgst, igst, tax, total, roundOff: r.roundOff, grand: r.total };
}

/**
 * Multi-line invoice. lines: [{qty, pricePaise, rate, inclusive}]
 * Line value = qty x price (rounded to paisa); GST worked per line.
 * Returns per-line results, a rate-wise summary and totals.
 */
export function calcInvoice(lines, { inter = false, round = "nearest" } = {}) {
  const out = [];
  const byRate = new Map();
  let taxable = 0, cgst = 0, sgst = 0, igst = 0;
  for (const ln of lines) {
    const qty = Number(ln.qty);
    if (!Number.isFinite(qty) || !Number.isFinite(ln.pricePaise)) { out.push(null); continue; }
    const value = Math.round(qty * ln.pricePaise);
    const r = calcGST(value, ln.rate, { mode: ln.inclusive ? "remove" : "add", inter, round: "off" });
    if (!r) { out.push(null); continue; }
    out.push(r);
    taxable += r.taxable; cgst += r.cgst; sgst += r.sgst; igst += r.igst;
    const k = String(r.rate);
    const g = byRate.get(k) || { rate: r.rate, taxable: 0, cgst: 0, sgst: 0, igst: 0 };
    g.taxable += r.taxable; g.cgst += r.cgst; g.sgst += r.sgst; g.igst += r.igst;
    byRate.set(k, g);
  }
  const tax = cgst + sgst + igst;
  const total = taxable + tax;
  const ro = roundOff(total, round);
  const summary = [...byRate.values()].sort((a, b) => a.rate - b.rate);
  return { lines: out, summary, taxable, cgst, sgst, igst, tax, total, roundOff: ro.roundOff, grand: ro.total };
}
