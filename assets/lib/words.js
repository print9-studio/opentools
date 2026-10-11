// Amount in words — Indian (lakh/crore) and international (million) styles.

const ONES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
  "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function below100(n) {
  if (n < 20) return ONES[n];
  return TENS[Math.floor(n / 10)] + (n % 10 ? " " + ONES[n % 10] : "");
}
function below1000(n) {
  const h = Math.floor(n / 100), r = n % 100;
  return [h ? ONES[h] + " Hundred" : "", r ? below100(r) : ""].filter(Boolean).join(" ");
}

/** Whole number to words, Indian system (crore recurses: "Ten Lakh Crore"). */
export function indianWords(n) {
  n = Math.floor(Math.abs(n));
  if (n === 0) return "Zero";
  const parts = [];
  const crore = Math.floor(n / 1e7);
  n %= 1e7;
  if (crore) parts.push(indianWords(crore) + " Crore");
  const lakh = Math.floor(n / 1e5); n %= 1e5;
  if (lakh) parts.push(below100(lakh) + " Lakh");
  const thou = Math.floor(n / 1e3); n %= 1e3;
  if (thou) parts.push(below100(thou) + " Thousand");
  if (n) parts.push(below1000(n));
  return parts.join(" ");
}

/** Whole number to words, international system. */
export function intlWords(n) {
  n = Math.floor(Math.abs(n));
  if (n === 0) return "Zero";
  const scales = ["", " Thousand", " Million", " Billion", " Trillion"];
  const parts = [];
  let i = 0;
  while (n > 0 && i < scales.length) {
    const chunk = n % 1000;
    if (chunk) parts.unshift(below1000(chunk) + scales[i]);
    n = Math.floor(n / 1000); i++;
  }
  return parts.join(" ");
}

/**
 * Paise amount to invoice wording.
 * style: "indian" | "intl";  currency: true adds "Rupees … Only"
 * e.g. 123450 -> "Rupees One Thousand Two Hundred Thirty Four and Fifty Paise Only"
 */
export function amountInWords(paise, { style = "indian", currency = true } = {}) {
  if (!Number.isFinite(paise)) return "";
  const neg = paise < 0;
  paise = Math.abs(paise);
  const rupees = Math.floor(paise / 100), p = paise % 100;
  const w = style === "intl" ? intlWords : indianWords;
  let s;
  if (currency) {
    s = "Rupees " + w(rupees);
    if (p) s += " and " + below100(p) + " Paise";
    s += " Only";
  } else {
    s = w(rupees);
    if (p) s += " Point " + String(p).padStart(2, "0").split("").map((d) => (d === "0" ? "Zero" : ONES[+d])).join(" ");
  }
  return (neg ? "Minus " : "") + s;
}
