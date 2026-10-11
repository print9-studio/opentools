// Small calculators: EMI, percentages, margins, dates, units, UPI links.

/* ---------- EMI ---------- */
export function emi(principal, annualRatePct, months) {
  const P = +principal, n = Math.round(+months), r = +annualRatePct / 12 / 100;
  if (!(P > 0) || !(n > 0) || !(r >= 0)) return null;
  const e = r === 0 ? P / n : (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  // Year-wise schedule
  const years = [];
  let bal = P, yi = 0, yp = 0, mo = 0;
  for (let m = 1; m <= n; m++) {
    const int = bal * r;
    let prin = e - int;
    if (m === n) prin = bal;
    bal -= prin; yi += int; yp += prin; mo++;
    if (mo === 12 || m === n) {
      years.push({ year: years.length + 1, interest: yi, principal: yp, balance: Math.max(0, bal) });
      yi = yp = mo = 0;
    }
  }
  return { emi: e, total: e * n, interest: e * n - P, years };
}

/* ---------- Margin / markup ----------
   Margin is profit as % of SELLING price; markup is profit as % of COST. */
export function priceFromCost(cost, { wastagePct = 0, marginPct = null, markupPct = null } = {}) {
  const c = +cost * (1 + (+wastagePct || 0) / 100);
  let sp;
  if (marginPct != null && marginPct !== "") {
    const m = +marginPct;
    if (!(m < 100)) return null;
    sp = c / (1 - m / 100);
  } else {
    sp = c * (1 + (+markupPct || 0) / 100);
  }
  const profit = sp - c;
  return { cost: c, sp, profit, marginPct: sp ? (profit / sp) * 100 : 0, markupPct: c ? (profit / c) * 100 : 0 };
}
export function marginFromPrices(cost, sp) {
  cost = +cost; sp = +sp;
  const profit = sp - cost;
  return { profit, marginPct: sp ? (profit / sp) * 100 : NaN, markupPct: cost ? (profit / cost) * 100 : NaN };
}

/* ---------- Dates ---------- */
const DAY = 86400000;
export function parseDate(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || ""));
  if (!m) return null;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return isNaN(d) ? null : d;
}
export function isoDate(d) { return d.toISOString().slice(0, 10); }
export function daysBetween(a, b) { return Math.round((b - a) / DAY); }
/** Working days from a to b inclusive. weekOff: array of weekday numbers (0=Sun). */
export function workingDays(a, b, weekOff = [0]) {
  if (b < a) [a, b] = [b, a];
  let n = 0;
  for (let t = a.getTime(); t <= b.getTime(); t += DAY) if (!weekOff.includes(new Date(t).getUTCDay())) n++;
  return n;
}
export function addDays(d, n) { return new Date(d.getTime() + n * DAY); }
export function addMonths(d, n) {
  const y = d.getUTCFullYear(), m = d.getUTCMonth() + n, day = d.getUTCDate();
  const last = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  return new Date(Date.UTC(y, m, Math.min(day, last)));
}
/** Indian financial year (April–March) and quarter. */
export function financialYear(d) {
  const y = d.getUTCFullYear(), m = d.getUTCMonth();
  const start = m >= 3 ? y : y - 1;
  const q = Math.floor(((m + 9) % 12) / 3) + 1; // Apr-Jun = Q1
  return { fy: `FY ${start}-${String(start + 1).slice(-2)}`, ay: `AY ${start + 1}-${String(start + 2).slice(-2)}`, quarter: q, startYear: start };
}
export const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/* ---------- Units ---------- */
export const LENGTH = { mm: 1, cm: 10, m: 1000, in: 25.4, ft: 304.8, pt: 25.4 / 72, pica: 25.4 / 6 };
export const AREA = { "sq mm": 1, "sq cm": 100, "sq in": 645.16, "sq ft": 92903.04, "sq m": 1e6 };
export function convert(value, from, to, table) {
  return (+value * table[from]) / table[to];
}

/* ---------- UPI / WhatsApp links ---------- */
export function upiLink({ vpa, name, amountPaise, note }) {
  const v = String(vpa || "").trim();
  if (!/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(v)) return null;
  const q = [["pa", v]];
  if (name) q.push(["pn", String(name).trim()]);
  if (Number.isFinite(amountPaise) && amountPaise > 0) q.push(["am", (amountPaise / 100).toFixed(2)]);
  q.push(["cu", "INR"]);
  if (note) q.push(["tn", String(note).trim().slice(0, 80)]);
  return "upi://pay?" + q.map(([k, val]) => k + "=" + encodeURIComponent(val)).join("&");
}
/** Normalise a pasted phone number to WhatsApp's international digits.
 *  Accepts "7200273672", "72002 73672", "+91 72002 73672", "+91-7200273672",
 *  "917200273672", "07200273672", "0091 7200273672", and text copied from
 *  contacts (with hidden direction marks or words around it). */
export function waNumber(number) {
  const raw = String(number || "");
  const plus = /\+\s*\d/.test(raw);
  let n = raw.replace(/\D/g, "");
  if (n.startsWith("00")) n = n.slice(2);                 // 0091… international prefix
  else if (!plus && n.length === 11 && n[0] === "0") n = n.slice(1); // 0 + 10-digit mobile
  if (n.length === 10) n = "91" + n;                       // plain Indian mobile
  if (n.length === 13 && n.startsWith("910")) n = "91" + n.slice(3); // +91 0XXXXXXXXXX
  if (n.length < 11 || n.length > 15) return null;
  return n;
}
export function waLink(number, text) {
  const n = waNumber(number);
  if (!n) return null;
  return "https://wa.me/" + n + (text ? "?text=" + encodeURIComponent(text) : "");
}
/** "917200273672" -> "+91 72002 73672" for display. */
export function waPretty(n) {
  return n && n.length === 12 && n.startsWith("91") ? `+91 ${n.slice(2, 7)} ${n.slice(7)}` : n ? "+" + n : "";
}
