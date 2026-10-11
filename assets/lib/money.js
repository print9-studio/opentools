// Exact money maths for Print9 OpenTools.
// All amounts are handled as whole paise (integers), never as floating
// point rupees, so results never show errors like 0.1 + 0.2 = 0.30000004.

/** Parse a user-typed amount ("1,23,456.789", "₹ 500", "-12.5") into
 *  integer paise, rounding half-up at the third decimal. Returns NaN
 *  when the text is not a number. */
export function toPaise(input) {
  if (typeof input === "number") {
    if (!isFinite(input)) return NaN;
    input = input.toFixed(6);
  }
  let s = String(input ?? "").replace(/[₹,\s]/g, "").replace(/^rs\.?/i, "");
  if (s === "" || s === "-" || s === ".") return NaN;
  const m = /^(-?)(\d*)(?:\.(\d*))?$/.exec(s);
  if (!m) return NaN;
  const neg = m[1] === "-";
  const whole = m[2] || "0";
  const frac = (m[3] || "").padEnd(3, "0");
  let p = Number(whole) * 100 + Number(frac.slice(0, 2));
  if (Number(frac[2]) >= 5) p += 1;
  if (!Number.isSafeInteger(p)) return NaN;
  return neg ? -p : p;
}

/** Integer division rounded half away from zero. */
export function roundDiv(a, b) {
  if (b === 0) return NaN;
  const neg = (a < 0) !== (b < 0);
  a = Math.abs(a); b = Math.abs(b);
  const q = Math.floor((a * 2 + b) / (b * 2));
  return neg ? -q : q;
}

/** GST rate (e.g. 18, 0.25, 1.5) to basis points (1800, 25, 150). */
export function rateToBp(rate) {
  const bp = Math.round(Number(rate) * 100);
  return isFinite(bp) && bp >= 0 ? bp : NaN;
}

const inr2 = new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** 123456789 paise -> "12,34,567.89" (Indian digit grouping). */
export function fmtPaise(p, { symbol = false } = {}) {
  if (!isFinite(p)) return "—";
  const neg = p < 0;
  const abs = Math.abs(p);
  const s = inr2.format(Math.floor(abs / 100) + (abs % 100) / 100);
  return (neg ? "−" : "") + (symbol ? "₹" : "") + s;
}

/** Plain number formatting with Indian grouping, up to `dp` decimals. */
export function fmtNum(n, dp = 2) {
  if (!isFinite(n)) return "—";
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: dp }).format(n);
}

/** Round-off of a paise total. mode: "off" | "nearest" | "up" | "down".
 *  `to` is the rounding unit in paise (100 = ₹1). Returns {total, roundOff}. */
export function roundOff(totalPaise, mode = "nearest", to = 100) {
  if (mode === "off" || !to) return { total: totalPaise, roundOff: 0 };
  let r;
  if (mode === "up") r = Math.ceil(totalPaise / to) * to;
  else if (mode === "down") r = Math.floor(totalPaise / to) * to;
  else r = roundDiv(totalPaise, to) * to; // 50 paise and above goes up
  return { total: r, roundOff: r - totalPaise };
}
