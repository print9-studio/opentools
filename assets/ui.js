// Tiny DOM helpers shared by every tool.

export function h(tag, props, ...kids) {
  const el = document.createElement(tag);
  if (props) {
    for (const [k, v] of Object.entries(props)) {
      if (v == null || v === false) continue;
      if (k === "class") el.className = v;
      else if (k === "style" && typeof v === "object") {
        for (const [sk, sv] of Object.entries(v)) {
          if (sk.startsWith("--")) el.style.setProperty(sk, sv); else el.style[sk] = sv;
        }
      }
      else if (k === "html") el.innerHTML = v;
      else if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2), v);
      else if (k in el && k !== "list" && typeof v !== "string") el[k] = v;
      else el.setAttribute(k, v === true ? "" : v);
    }
  }
  for (const kid of kids.flat(Infinity)) {
    if (kid == null || kid === false) continue;
    el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  }
  return el;
}

/** Labelled field. */
export function field(label, control, hint) {
  return h("label", { class: "field" }, h("span", null, label), control, hint ? h("div", { class: "hint" }, hint) : null);
}

/** Numeric text input (keeps a decimal keypad on phones). */
export function numIn(props = {}) {
  return h("input", { class: "in", type: "text", inputmode: "decimal", autocomplete: "off", spellcheck: "false", ...props });
}

/** Segmented choice. options: [[value, label]]. Returns {el, get(), set(v)}. */
export function seg(options, value, onChange) {
  let cur = value;
  const el = h("div", { class: "seg", role: "group" });
  const btns = options.map(([v, label]) => {
    const b = h("button", { type: "button", "aria-pressed": String(v === cur), onclick: () => api.set(v, true) }, label);
    b.dataset.v = String(v);
    el.append(b);
    return b;
  });
  const api = {
    el,
    get: () => cur,
    set(v, fire) {
      cur = v;
      btns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.v === String(v))));
      if (fire && onChange) onChange(v);
    },
  };
  return api;
}

let toastTimer;
export function toast(msg) {
  let t = document.querySelector(".toast");
  if (!t) { t = h("div", { class: "toast", role: "status", "aria-live": "polite" }); document.body.append(t); }
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 1800);
}

export async function copy(text, label = "Copied") {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = h("textarea", { style: { position: "fixed", opacity: "0" } }, text);
    document.body.append(ta); ta.select();
    try { document.execCommand("copy"); } catch { /* ignore */ }
    ta.remove();
  }
  toast(label);
}

export const store = {
  get(k, d) { try { const v = localStorage.getItem("p9ot:" + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem("p9ot:" + k, JSON.stringify(v)); } catch { /* private mode */ } },
};

/** Key/value result table. rows: [[label, value, cls]] */
export function kv(rows) {
  return h("table", { class: "kv" }, h("tbody", null, rows.filter(Boolean).map(([a, b, cls]) => h("tr", { class: cls || null }, h("td", null, a), h("td", null, b)))));
}

export function card(title, ...kids) {
  return h("section", { class: "card" }, title ? h("h2", null, title) : null, ...kids);
}

export function status(kind, text) { return h("div", { class: "status " + kind }, text); }

export function debounce(fn, ms = 120) {
  let t;
  return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}

/** Parse a plain decimal number from text ("1,234.5" -> 1234.5); NaN if invalid. */
export function num(v) {
  const s = String(v ?? "").replace(/[,\s₹]/g, "");
  if (s === "" || !/^-?\d*\.?\d*$/.test(s) || s === "-" || s === ".") return NaN;
  return parseFloat(s);
}

/** Download a canvas as PNG. */
export function downloadCanvas(canvas, name) {
  const a = h("a", { href: canvas.toDataURL("image/png"), download: name });
  document.body.append(a); a.click(); a.remove();
}
