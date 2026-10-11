// Safe calculator expression evaluator (no eval). Supports + - × ÷ * / ( ) % and decimals.
// "%" after a number means "per cent of": 200 + 10% = 220, 200 × 10% = 20, 50% = 0.5.

function tokenize(s) {
  const t = [];
  s = String(s).replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-").replace(/,/g, "");
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (/\s/.test(c)) { i++; continue; }
    if (/[0-9.]/.test(c)) {
      let j = i; while (j < s.length && /[0-9.]/.test(s[j])) j++;
      const num = s.slice(i, j);
      if ((num.match(/\./g) || []).length > 1) throw new Error("bad number");
      t.push({ k: "n", v: parseFloat(num) }); i = j; continue;
    }
    if ("+-*/()%".includes(c)) { t.push({ k: c }); i++; continue; }
    throw new Error("bad char");
  }
  return t;
}

/** Evaluate; returns a number (rounded to 10 decimals to hide float noise) or throws. */
export function evaluate(expr) {
  const t = tokenize(expr);
  let p = 0;
  const peek = () => t[p], eat = (k) => (t[p] && t[p].k === k ? t[p++] : null);

  // percent applies relative to the left operand of + and -
  function expr_() {
    let left = term();
    for (;;) {
      if (eat("+")) { const r = term(true, left); left = left + r; }
      else if (eat("-")) { const r = term(true, left); left = left - r; }
      else return left;
    }
  }
  function term(afterAddSub = false, base = 0) {
    let left = factor(afterAddSub, base);
    for (;;) {
      if (eat("*")) left = left * factor(false, 0);
      else if (eat("/")) { const d = factor(false, 0); if (d === 0) throw new Error("÷ by zero"); left = left / d; }
      else return left;
    }
  }
  function factor(afterAddSub, base) {
    let v;
    if (eat("-")) return -factor(afterAddSub, base);
    if (eat("+")) return factor(afterAddSub, base);
    if (eat("(")) { v = expr_(); if (!eat(")")) throw new Error("missing )"); }
    else { const n = peek(); if (!n || n.k !== "n") throw new Error("expected number"); p++; v = n.v; }
    if (eat("%")) v = afterAddSub ? (base * v) / 100 : v / 100;
    return v;
  }
  const v = expr_();
  if (p !== t.length) throw new Error("unexpected input");
  if (!isFinite(v)) throw new Error("result too large");
  return Math.round(v * 1e10) / 1e10;
}
