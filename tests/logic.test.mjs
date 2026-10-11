// Run with:  node --test tests/
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { toPaise, roundDiv, fmtPaise, roundOff } from "../assets/lib/money.js";
import { calcGST, calcInvoice, RATES } from "../assets/lib/gst.js";
import { checkGSTIN, gstinCheckChar, checkPAN, checkIFSC, checkPIN } from "../assets/lib/ids.js";
import { amountInWords, indianWords, intlWords } from "../assets/lib/words.js";
import { impose, sheetsNeeded, INCH } from "../assets/lib/impose.js";
import { evaluate } from "../assets/lib/calc.js";
import { emi, financialYear, parseDate, workingDays, addMonths, isoDate, upiLink, waLink, waNumber, waPretty, convert, LENGTH, AREA, priceFromCost } from "../assets/lib/misc.js";
import { PRINT9_CODES } from "../assets/lib/print9-codes.js";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

/* ---------------- money ---------------- */
test("toPaise parses Indian-formatted amounts exactly", () => {
  assert.equal(toPaise("1,23,456.789"), 12345679);
  assert.equal(toPaise("₹ 500"), 50000);
  assert.equal(toPaise("0.005"), 1);
  assert.equal(toPaise("0.004"), 0);
  assert.equal(toPaise("12."), 1200);
  assert.equal(toPaise(".5"), 50);
  assert.equal(toPaise("-12.5"), -1250);
  assert.ok(Number.isNaN(toPaise("abc")));
  assert.ok(Number.isNaN(toPaise("1.2.3")));
  assert.ok(Number.isNaN(toPaise("")));
  assert.equal(toPaise(1.005), 101); // float input rounded correctly
});
test("roundDiv rounds half away from zero", () => {
  assert.equal(roundDiv(5, 2), 3);
  assert.equal(roundDiv(4, 2), 2);
  assert.equal(roundDiv(-5, 2), -3);
  assert.equal(roundDiv(249997, 100), 2500);
  assert.equal(roundDiv(249949, 100), 2499);
});
test("fmtPaise uses Indian grouping", () => {
  assert.equal(fmtPaise(12345678), "1,23,456.78");
  assert.equal(fmtPaise(5), "0.05");
  assert.equal(fmtPaise(-150), "−1.50");
  assert.equal(fmtPaise(1000000000), "1,00,00,000.00");
});
test("roundOff modes", () => {
  assert.deepEqual(roundOff(118050, "nearest"), { total: 118100, roundOff: 50 });
  assert.deepEqual(roundOff(118049, "nearest"), { total: 118000, roundOff: -49 });
  assert.deepEqual(roundOff(118001, "up"), { total: 118100, roundOff: 99 });
  assert.deepEqual(roundOff(118099, "down"), { total: 118000, roundOff: -99 });
  assert.deepEqual(roundOff(118099, "off"), { total: 118099, roundOff: 0 });
});

/* ---------------- GST ---------------- */
test("GST add 18% intra-state on ₹1000", () => {
  const g = calcGST(100000, 18, { mode: "add" });
  assert.equal(g.taxable, 100000); assert.equal(g.cgst, 9000); assert.equal(g.sgst, 9000);
  assert.equal(g.igst, 0); assert.equal(g.total, 118000);
});
test("GST remove 18% from ₹1180", () => {
  const g = calcGST(118000, 18, { mode: "remove" });
  assert.equal(g.taxable, 100000); assert.equal(g.cgst, 9000); assert.equal(g.total, 118000);
});
test("GST IGST and odd rates", () => {
  assert.equal(calcGST(123456, 18, { inter: true }).igst, 22222); // 222.2208 -> 222.22
  const q = calcGST(1000000, 0.25, {});
  assert.equal(q.cgst, 1250); assert.equal(q.sgst, 1250);
  const t = calcGST(99999, 5, {}); // 999.99 @5% -> 49.9995 -> halves 24.999.. each 25.00
  assert.equal(t.cgst, 2500); assert.equal(t.total, 104999);
  const z = calcGST(50000, 0, {});
  assert.equal(z.tax, 0); assert.equal(z.total, 50000);
  const forty = calcGST(100000, 40, { inter: true });
  assert.equal(forty.igst, 40000);
});
test("GST round-off on grand total", () => {
  const g = calcGST(99999, 18, { round: "nearest" }); // 999.99 + 90.00 + 90.00 = 1179.99
  assert.equal(g.total, 117999); assert.equal(g.grand, 118000); assert.equal(g.roundOff, 1);
});

// Independent reference using BigInt maths, to cross-check thousands of random cases.
function refAdd(p, bp, inter) {
  const P = BigInt(p), B = BigInt(bp);
  const rd = (a, b) => (a * 2n + b) / (b * 2n);
  if (inter) { const i = rd(P * B, 10000n); return { tax: Number(i) }; }
  const half = rd(P * B, 20000n);
  return { half: Number(half), tax: Number(half * 2n) };
}
test("GST add mode matches independent BigInt reference (20,000 random cases)", () => {
  let seed = 42; const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  for (let k = 0; k < 20000; k++) {
    const p = Math.floor(rnd() * 1e9);
    const rate = [...RATES, 12, 28][Math.floor(rnd() * 9)];
    const inter = rnd() < 0.5;
    const g = calcGST(p, rate, { inter });
    const r = refAdd(p, Math.round(rate * 100), inter);
    assert.equal(g.tax, r.tax, `p=${p} rate=${rate} inter=${inter}`);
    if (!inter) assert.equal(g.cgst, r.half);
  }
});
test("GST remove mode always adds back exactly, halves equal, within 1 paisa of exact", () => {
  let seed = 7; const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  let consistent = 0, n = 20000;
  for (let k = 0; k < n; k++) {
    const p = Math.floor(rnd() * 1e9) + 1;
    const rate = [...RATES, 12, 28][Math.floor(rnd() * 9)];
    const inter = rnd() < 0.5;
    const bp = Math.round(rate * 100);
    const g = calcGST(p, rate, { mode: "remove", inter });
    assert.equal(g.taxable + g.tax, p, "parts must add to amount");
    assert.equal(g.cgst, g.sgst);
    const exact = (p * 10000) / (10000 + bp);
    assert.ok(Math.abs(g.taxable - exact) <= 1.5, `taxable off by >1 paisa: p=${p} r=${rate}`);
    // tax should equal tax-on-taxable to within 1 paisa (rounding)
    const back = inter ? roundDiv(g.taxable * bp, 10000) : 2 * roundDiv(g.taxable * bp, 20000);
    assert.ok(Math.abs(back - g.tax) <= 2, `tax mismatch p=${p} r=${rate}`);
    if (back === g.tax) consistent++;
  }
  // An exact split exists for roughly 1/(1+rate) of amounts; otherwise a 1-paisa difference is unavoidable.
  assert.ok(consistent / n > 0.8, "tax recomputes exactly in most cases, else within 1-2 paise");
});
test("Invoice totals and rate-wise summary", () => {
  const inv = calcInvoice([
    { qty: 100, pricePaise: 250, rate: 18 },          // 250.00 -> 45.00 GST
    { qty: 2, pricePaise: 35000, rate: 5 },           // 700.00 -> 35.00
    { qty: 1, pricePaise: 11800, rate: 18, inclusive: true }, // 100 + 18
  ], { round: "nearest" });
  assert.equal(inv.taxable, 25000 + 70000 + 10000);
  assert.equal(inv.cgst, 2250 + 1750 + 900);
  assert.equal(inv.total, 105000 + 9800);
  assert.equal(inv.summary.length, 2);
  assert.equal(inv.summary.find((s) => s.rate === 18).taxable, 35000);
  assert.equal(inv.grand, 114800);
});

/* ---------------- IDs ---------------- */
test("GSTIN check digit on a published example", () => {
  assert.equal(gstinCheckChar("27AAPFU0939F1Z"), "V");
  const r = checkGSTIN("27aapfu0939f1zv");
  assert.equal(r.ok, true); assert.equal(r.state, "Maharashtra"); assert.equal(r.pan, "AAPFU0939F");
  assert.equal(r.panType, "Firm / LLP");
});
test("GSTIN catches every single-character typo", () => {
  const good = "27AAPFU0939F1ZV";
  const CH = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let caught = 0, total = 0;
  for (let i = 0; i < 15; i++) for (const c of CH) {
    if (c === good[i]) continue;
    const bad = good.slice(0, i) + c + good.slice(i + 1);
    total++;
    if (!checkGSTIN(bad).ok) caught++;
  }
  assert.equal(caught, total);
});
test("GSTIN other errors", () => {
  assert.equal(checkGSTIN("27AAPFU0939F1Z").ok, false);
  assert.equal(checkGSTIN("00AAPFU0939F1Z" + gstinCheckChar("00AAPFU0939F1Z")).ok, false); // bad state
  const tn = "33AAPFU0939F1Z" + gstinCheckChar("33AAPFU0939F1Z");
  assert.equal(checkGSTIN(tn).ok, true); assert.equal(checkGSTIN(tn).state, "Tamil Nadu");
});
test("PAN, IFSC, PIN", () => {
  assert.equal(checkPAN("ABCPE1234F").ok, true);
  assert.equal(checkPAN("ABCPE1234F").type, "Individual (person)");
  assert.equal(checkPAN("ABCP1234F").ok, false);
  assert.equal(checkIFSC("SBIN0001234").ok, true);
  assert.equal(checkIFSC("SBIN1001234").ok, false);
  assert.equal(checkPIN("600097").ok, true);
  assert.equal(checkPIN("060097").ok, false);
});

/* ---------------- words ---------------- */
test("Amount in words — Indian", () => {
  assert.equal(amountInWords(0), "Rupees Zero Only");
  assert.equal(amountInWords(123450), "Rupees One Thousand Two Hundred Thirty Four and Fifty Paise Only");
  assert.equal(amountInWords(123456789), "Rupees Twelve Lakh Thirty Four Thousand Five Hundred Sixty Seven and Eighty Nine Paise Only");
  assert.equal(amountInWords(1e9), "Rupees One Crore Only");
  assert.equal(indianWords(1000000000), "One Hundred Crore");
  assert.equal(indianWords(1e12), "One Lakh Crore");
  assert.equal(indianWords(101), "One Hundred One");
  assert.equal(indianWords(110019), "One Lakh Ten Thousand Nineteen");
  assert.equal(amountInWords(5), "Rupees Zero and Five Paise Only");
});
test("Amount in words — international", () => {
  assert.equal(intlWords(1000000), "One Million");
  assert.equal(intlWords(1234567), "One Million Two Hundred Thirty Four Thousand Five Hundred Sixty Seven");
});

/* ---------------- imposition ---------------- */
test("Visiting cards 90×52 on 13×19 with 4mm bleed, 5mm margin = 23 up (mixed)", () => {
  // 98×60 with bleed. Rotated 60×98: 5 across (300) × 4 down (392) = 20, leftover 80.6 mm strip
  // takes 3 upright (98×60) = 23. Straight grid alone would give 21.
  const r = impose({ sheetW: 13 * INCH, sheetH: 19 * INCH, itemW: 90, itemH: 52, bleed: 4, gap: 0, margin: 5 });
  assert.equal(r.count, 23);
  assert.equal(r.boxes.filter((b) => b.rot).length, 20);
  assert.equal(impose({ sheetW: 13 * INCH, sheetH: 19 * INCH, itemW: 90, itemH: 52, bleed: 4, gap: 0, margin: 5, mixed: false }).count, 21);
});
test("Known simple layouts", () => {
  assert.equal(impose({ sheetW: 297, sheetH: 420, itemW: 148, itemH: 210, bleed: 0, gap: 0, margin: 0 }).count, 4); // A5 on A3
  assert.equal(impose({ sheetW: 320, sheetH: 450, itemW: 210, itemH: 297, bleed: 0, gap: 0, margin: 0 }).count, 2); // A4 on SRA3
  assert.equal(impose({ sheetW: 210, sheetH: 297, itemW: 300, itemH: 300, bleed: 0, gap: 0, margin: 0 }).count, 0);
  assert.equal(sheetsNeeded(1000, 21, 5), 51); // ceil(1000/21)=48 -> x1.05 = 50.4 -> 51
});
test("Imposition never overlaps and stays inside the printable area (random)", () => {
  let seed = 3; const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  for (let k = 0; k < 400; k++) {
    const p = { sheetW: 200 + rnd() * 300, sheetH: 300 + rnd() * 300, itemW: 20 + rnd() * 150, itemH: 20 + rnd() * 150, bleed: rnd() * 5, gap: rnd() < .5 ? 0 : rnd() * 4, margin: rnd() * 8 };
    const r = impose(p);
    const W = p.sheetW - 2 * p.margin, H = p.sheetH - 2 * p.margin, e = 1e-6;
    for (const b of r.boxes) assert.ok(b.x >= -e && b.y >= -e && b.x + b.w <= W + e && b.y + b.h <= H + e, "inside");
    for (let i = 0; i < r.boxes.length; i++) for (let j = i + 1; j < r.boxes.length; j++) {
      const a = r.boxes[i], b = r.boxes[j];
      const overlap = a.x < b.x + b.w - e && b.x < a.x + a.w - e && a.y < b.y + b.h - e && b.y < a.y + a.h - e;
      assert.ok(!overlap, "no overlap");
    }
  }
});

/* ---------------- calculator ---------------- */
test("Calculator expressions", () => {
  assert.equal(evaluate("2+3*4"), 14);
  assert.equal(evaluate("(2+3)×4"), 20);
  assert.equal(evaluate("200+10%"), 220);
  assert.equal(evaluate("200-10%"), 180);
  assert.equal(evaluate("200*10%"), 20);
  assert.equal(evaluate("50%"), 0.5);
  assert.equal(evaluate("0.1+0.2"), 0.3);
  assert.equal(evaluate("10÷4"), 2.5);
  assert.equal(evaluate("-5+3"), -2);
  assert.equal(evaluate("2*-3"), -6);
  assert.equal(evaluate("1,000*2"), 2000);
  assert.throws(() => evaluate("1/0"));
  assert.throws(() => evaluate("2+"));
  assert.throws(() => evaluate("alert(1)"));
});

/* ---------------- misc ---------------- */
test("EMI matches the standard formula", () => {
  const e = emi(100000, 12, 12);
  assert.equal(Math.round(e.emi * 100) / 100, 8884.88);
  assert.ok(Math.abs(e.years[0].balance) < 0.01);
  assert.equal(emi(12000, 0, 12).emi, 1000);
});
test("Financial year and dates", () => {
  assert.equal(financialYear(parseDate("2026-03-31")).fy, "FY 2025-26");
  assert.equal(financialYear(parseDate("2026-03-31")).quarter, 4);
  assert.equal(financialYear(parseDate("2026-04-01")).fy, "FY 2026-27");
  assert.equal(financialYear(parseDate("2026-04-01")).quarter, 1);
  assert.equal(financialYear(parseDate("2026-10-11")).quarter, 3);
  assert.equal(financialYear(parseDate("2026-10-11")).ay, "AY 2027-28");
  assert.equal(isoDate(addMonths(parseDate("2026-01-31"), 1)), "2026-02-28");
  // 11 Oct 2026 is a Sunday; Mon 12 - Sun 18 Oct has 6 Mon-Sat working days
  assert.equal(workingDays(parseDate("2026-10-12"), parseDate("2026-10-18"), [0]), 6);
  assert.equal(workingDays(parseDate("2026-10-12"), parseDate("2026-10-18"), [0, 6]), 5);
});
test("Units, margin, links", () => {
  assert.equal(convert(1, "in", "mm", LENGTH), 25.4);
  assert.ok(Math.abs(convert(1, "sq m", "sq ft", AREA) - 10.7639) < 1e-4);
  assert.ok(Math.abs(convert(72, "pt", "in", LENGTH) - 1) < 1e-12);
  const pm = priceFromCost(100, { wastagePct: 5, marginPct: 50 });
  assert.ok(Math.abs(pm.sp - 210) < 1e-9); assert.ok(Math.abs(pm.markupPct - 100) < 1e-9);
  assert.equal(upiLink({ vpa: "print9@okhdfcbank", name: "Print9", amountPaise: 125050, note: "Inv 45" }),
    "upi://pay?pa=print9%40okhdfcbank&pn=Print9&am=1250.50&cu=INR&tn=Inv%2045");
  assert.equal(upiLink({ vpa: "not an id" }), null);
  assert.equal(waLink("72002 73672", "Hi"), "https://wa.me/917200273672?text=Hi");
  assert.equal(waLink("+91 72002 73672"), "https://wa.me/917200273672");
  assert.equal(waLink("12"), null);
});

/* ---------------- data & files ---------------- */
test("HSN/SAC database is the official file and consistent", () => {
  const j = JSON.parse(fs.readFileSync(path.join(ROOT, "data/hsn-sac.json"), "utf8"));
  const meta = JSON.parse(fs.readFileSync(path.join(ROOT, "data/hsn-sac-meta.json"), "utf8"));
  assert.equal(j.source, "https://tutorial.gst.gov.in/downloads/HSN_SAC.xlsx");
  assert.equal(j.hsn.length, meta.counts.HSN); assert.equal(j.sac.length, meta.counts.SAC);
  assert.ok(j.hsn.length > 20000 && j.sac.length > 600);
  for (const [c, d] of j.hsn) { assert.match(c, /^\d{2}(\d{2}){0,3}$/); assert.ok(d.length > 0); }
  for (const [c] of j.sac) assert.match(c, /^99\d{0,4}$/);
  assert.equal(new Set(j.hsn.map((x) => x[0])).size, j.hsn.length, "no duplicate HSN codes");
});
test("Every Print9 quick code exists in the official list", () => {
  const j = JSON.parse(fs.readFileSync(path.join(ROOT, "data/hsn-sac.json"), "utf8"));
  const all = new Set([...j.hsn, ...j.sac].map((x) => x[0]));
  for (const x of PRINT9_CODES) assert.ok(all.has(x.code), `${x.code} (${x.item}) not in official list`);
  for (const x of PRINT9_CODES) assert.ok([0, 0.25, 1.5, 3, 5, 18, 40].includes(x.rate), `${x.code} rate ${x.rate}`);
});
test("Every file listed for offline use exists", () => {
  const sw = fs.readFileSync(path.join(ROOT, "sw.js"), "utf8");
  const list = [...sw.matchAll(/"((?:assets|tools|data)\/[^"]+|index\.html|manifest\.webmanifest)"/g)].map((m) => m[1]);
  assert.ok(list.length > 30);
  for (const f of list) assert.ok(fs.existsSync(path.join(ROOT, f)), "missing " + f);
  const tools = fs.readdirSync(path.join(ROOT, "tools"));
  for (const t of tools) assert.ok(list.includes("tools/" + t), "tool not cached offline: " + t);
});
test("Every tool in the menu has a module", async () => {
  const src = fs.readFileSync(path.join(ROOT, "assets/app.js"), "utf8");
  const ids = [...src.matchAll(/\{ id: "([\w-]+)"/g)].map((m) => m[1]);
  assert.equal(ids.length, 21);
  for (const id of ids) assert.ok(fs.existsSync(path.join(ROOT, "tools", id + ".js")), "missing tools/" + id + ".js");
});

test("WhatsApp number accepts every common way of writing an Indian mobile", () => {
  const want = "917200273672";
  for (const v of ["7200273672", "72002 73672", "+91 72002 73672", "+917200273672", "+91-72002-73672",
    "+91 (720) 027-3672", "917200273672", "07200273672", "0091 7200273672", "+91 07200273672",
    "\u202a+91 72002 73672\u202c", "Mobile: +91 72002 73672", " 72002-73672 "]) {
    assert.equal(waNumber(v), want, JSON.stringify(v));
  }
  assert.equal(waPretty(want), "+91 72002 73672");
  assert.equal(waNumber("+1 415 555 0100"), "14155550100");
  assert.equal(waNumber("+44 20 7946 0958"), "442079460958");
  assert.equal(waNumber("98400"), null);
  assert.equal(waLink("+91 72002 73672", "Order ready"), "https://wa.me/917200273672?text=Order%20ready");
});
test("GST remove mode ignores round-off and returns the exact amount entered", () => {
  const g = calcGST(99999, 18, { mode: "remove", inter: true, round: "off" });
  assert.equal(g.taxable + g.tax, 99999);
  assert.equal(g.grand, 99999);
});
