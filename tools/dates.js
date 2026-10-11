import { h, field, numIn, card, kv, seg, num } from "../assets/ui.js";
import { parseDate, isoDate, daysBetween, workingDays, addDays, addMonths, financialYear, WEEKDAYS } from "../assets/lib/misc.js";

const today = () => { const n = new Date(); return isoDate(new Date(Date.UTC(n.getFullYear(), n.getMonth(), n.getDate()))); };
const nice = (d) => d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

export default function (root) {
  /* between */
  const a = h("input", { class: "in", type: "date", value: today() });
  const b = h("input", { class: "in", type: "date" });
  const week = seg([["6", "Mon–Sat working (Sunday off)"], ["5", "Mon–Fri working"]], "6", runBetween);
  const out1 = h("div");
  [a, b].forEach((i) => i.addEventListener("input", runBetween));
  function runBetween() {
    out1.replaceChildren();
    const d1 = parseDate(a.value), d2 = parseDate(b.value);
    if (!d1 || !d2) return;
    const n = daysBetween(d1, d2);
    const off = week.get() === "6" ? [0] : [0, 6];
    out1.append(kv([
      ["Days between", `${Math.abs(n)} day${Math.abs(n) === 1 ? "" : "s"}${n < 0 ? " (end is before start)" : ""}`, "total"],
      ["Counting both dates", String(Math.abs(n) + 1)],
      ["Working days (both dates included)", String(workingDays(d1, d2, off))],
      ["Weeks", (Math.abs(n) / 7).toFixed(1)],
    ]));
  }

  /* add */
  const s = h("input", { class: "in", type: "date", value: today() });
  const n = numIn({ value: "30" });
  const what = seg([["days", "Days"], ["wdays", "Working days"], ["months", "Months"]], "days", runAdd);
  const out2 = h("div");
  [s, n].forEach((i) => i.addEventListener("input", runAdd));
  function runAdd() {
    out2.replaceChildren();
    const d = parseDate(s.value), k = Math.round(num(n.value));
    if (!d || !Number.isFinite(k)) return;
    let r;
    if (what.get() === "days") r = addDays(d, k);
    else if (what.get() === "months") r = addMonths(d, k);
    else {
      r = d; let left = Math.abs(k); const step = k < 0 ? -1 : 1;
      const off = week.get() === "6" ? [0] : [0, 6];
      while (left > 0) { r = addDays(r, step); if (!off.includes(r.getUTCDay())) left--; }
    }
    out2.append(kv([["Result", nice(r), "total"], ["Weekday", WEEKDAYS[r.getUTCDay()]]]));
  }

  /* fy */
  const f = h("input", { class: "in", type: "date", value: today() });
  const out3 = h("div");
  f.addEventListener("input", runFY);
  function runFY() {
    out3.replaceChildren();
    const d = parseDate(f.value);
    if (!d) return;
    const r = financialYear(d);
    const qn = ["", "Apr–Jun", "Jul–Sep", "Oct–Dec", "Jan–Mar"][r.quarter];
    out3.append(kv([
      ["Financial year", r.fy, "total"],
      ["Quarter", `Q${r.quarter} (${qn})`],
      ["Assessment year", r.ay],
      ["Weekday", WEEKDAYS[d.getUTCDay()]],
      ["Day of year", String(daysBetween(new Date(Date.UTC(d.getUTCFullYear(), 0, 1)), d) + 1)],
    ]));
  }

  root.append(
    card("Days between two dates", h("div", { class: "row" }, field("From", a), field("To", b)), week.el, out1),
    h("div", { class: "cols" },
      card("Add to a date (due dates)", field("Start date", s), field("Add (use minus to go back)", n), what.el, out2),
      card("Financial year & quarter", field("Date", f), out3)));
  runBetween(); runAdd(); runFY();
}
