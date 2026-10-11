import { h, card, copy, store, seg } from "../assets/ui.js";
import { evaluate } from "../assets/lib/calc.js";
import { fmtNum } from "../assets/lib/money.js";
import { RATES } from "../assets/lib/gst.js";

const show = (n) => (Number.isFinite(n) ? new Intl.NumberFormat("en-IN", { maximumFractionDigits: 8 }).format(n) : "Error");

export default function (root) {
  let expr = "";
  let lastResult = null;
  let tape = store.get("tape", []);
  let gstRate = store.get("calcGst", 18);

  const exprEl = h("div", { class: "calc-expr" });
  const valEl = h("div", { class: "calc-val" }, "0");
  const tapeEl = h("div", { class: "tape" });

  const rateSeg = seg(RATES.filter((r) => r > 0).map((r) => [r, r + "%"]), gstRate, (v) => { gstRate = v; store.set("calcGst", v); });

  function preview() {
    exprEl.textContent = expr.replace(/\*/g, "×").replace(/\//g, "÷");
    try { valEl.textContent = expr ? show(evaluate(expr)) : (lastResult != null ? show(lastResult) : "0"); }
    catch { valEl.textContent = expr ? show(lastResult ?? 0) : "0"; }
  }
  function drawTape() {
    tapeEl.replaceChildren(...(tape.length ? tape.slice().reverse().map((t) =>
      h("div", { title: "Tap to reuse", onclick: () => { expr = String(t.r); preview(); } },
        h("span", { class: "muted" }, t.e), h("b", null, "= " + show(t.r))))
      : [h("div", { class: "muted", style: { cursor: "default" } }, "Your calculations appear here.")]));
  }
  function push(e, r) {
    tape.push({ e, r }); tape = tape.slice(-50); store.set("tape", tape); drawTape();
  }
  function press(k) {
    if (k === "C") { expr = ""; lastResult = null; }
    else if (k === "⌫") expr = expr.slice(0, -1);
    else if (k === "=") {
      if (!expr) return;
      try { const r = evaluate(expr); push(expr.replace(/\*/g, "×").replace(/\//g, "÷"), r); lastResult = r; expr = String(r); valEl.textContent = show(r); exprEl.textContent = ""; return; }
      catch (err) { valEl.textContent = "Error"; return; }
    } else if (k === "±") {
      try { const r = evaluate(expr || "0"); expr = String(-r); } catch { /* ignore */ }
    } else if (k === "+GST" || k === "−GST") {
      try {
        const v = evaluate(expr || String(lastResult ?? 0));
        const r = k === "+GST" ? v * (1 + gstRate / 100) : v / (1 + gstRate / 100);
        const rr = Math.round(r * 100) / 100;
        push(`${show(v)} ${k === "+GST" ? "+" : "−"} GST ${gstRate}% (GST ${show(Math.abs(Math.round((rr - v) * 100) / 100))})`, rr);
        expr = String(rr); lastResult = rr;
      } catch { valEl.textContent = "Error"; return; }
    } else {
      const ops = "+-*/";
      if (ops.includes(k) && expr === "" && lastResult != null) expr = String(lastResult);
      if (ops.includes(k) && ops.includes(expr.slice(-1))) expr = expr.slice(0, -1);
      expr += k;
    }
    preview();
  }

  const K = (label, val = label, cls = "") => h("button", { type: "button", class: cls, onclick: () => press(val), "aria-label": label }, label);
  const keys = h("div", { class: "keys" },
    K("C", "C", "op"), K("⌫", "⌫", "op"), K("%", "%", "op"), K("÷", "/", "op"),
    K("7"), K("8"), K("9"), K("×", "*", "op"),
    K("4"), K("5"), K("6"), K("−", "-", "op"),
    K("1"), K("2"), K("3"), K("+", "+", "op"),
    K("±"), K("0"), K("."), K("=", "=", "eq"),
    K("+GST", "+GST", "gst"), K("−GST", "−GST", "gst"), K("(", "(", "op"), K(")", ")", "op"));

  addEventListener("keydown", onKey);
  function onKey(e) {
    if (!document.body.contains(keys)) { removeEventListener("keydown", onKey); return; }
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const map = { Enter: "=", "=": "=", Backspace: "⌫", Escape: "C", Delete: "C", x: "*", X: "*" };
    const k = map[e.key] || e.key;
    if (/^[0-9.+\-*/%()]$/.test(k) || ["=", "⌫", "C"].includes(k)) { e.preventDefault(); press(k); }
  }

  root.append(h("div", { class: "cols" },
    card(null, h("div", { class: "calc" }, h("div", { class: "calc-screen" }, exprEl, valEl), keys,
      h("div", { class: "small muted", style: { marginTop: "12px" } }, "GST key rate:"), rateSeg.el,
      h("div", { class: "btns" }, h("button", { type: "button", class: "btn small ghost", onclick: () => copy(valEl.textContent.replace(/,/g, ""), "Result copied") }, "Copy result")))),
    card("Tape",
      tapeEl,
      h("div", { class: "btns" },
        h("button", { type: "button", class: "btn small ghost", onclick: () => copy(tape.map((t) => `${t.e} = ${show(t.r)}`).join("\n"), "Tape copied") }, "Copy tape"),
        h("button", { type: "button", class: "btn small ghost", onclick: () => { tape = []; store.set("tape", tape); drawTape(); } }, "Clear tape")),
      h("div", { class: "note" }, "Tips: 200 + 10% = 220 · 200 × 10% = 20 · Keyboard works on PC (Enter = equals, Esc = clear). +GST / −GST use the rate picked below the keys."))));
  drawTape(); preview();
}

export { fmtNum };
