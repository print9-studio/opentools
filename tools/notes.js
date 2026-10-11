import { h, card, copy, store, debounce } from "../assets/ui.js";

export default function (root) {
  const ta = h("textarea", { class: "in", style: { minHeight: "50vh", fontSize: "16px" }, placeholder: "Jot down measurements, phone numbers, quotes… saved automatically on this device." });
  ta.value = store.get("notes", "");
  const info = h("div", { class: "small muted" });
  const save = debounce(() => { store.set("notes", ta.value); info.textContent = "Saved on this device · " + new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }); }, 300);
  ta.addEventListener("input", save);
  root.append(card(null, ta,
    h("div", { class: "btns" },
      h("button", { class: "btn small ghost", type: "button", onclick: () => copy(ta.value, "Notes copied") }, "Copy all"),
      h("button", { class: "btn small ghost", type: "button", onclick: () => { if (confirm("Clear all notes on this device?")) { ta.value = ""; store.set("notes", ""); } } }, "Clear")),
    info,
    h("div", { class: "note" }, "Notes stay only in this browser on this device — they are not uploaded or synced. Clearing browser data removes them.")));
  ta.focus();
}
