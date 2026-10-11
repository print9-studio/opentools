// GSTIN, PAN, IFSC and PIN code checks (all offline).

export const STATES = {
  "01": "Jammu & Kashmir", "02": "Himachal Pradesh", "03": "Punjab", "04": "Chandigarh",
  "05": "Uttarakhand", "06": "Haryana", "07": "Delhi", "08": "Rajasthan", "09": "Uttar Pradesh",
  "10": "Bihar", "11": "Sikkim", "12": "Arunachal Pradesh", "13": "Nagaland", "14": "Manipur",
  "15": "Mizoram", "16": "Tripura", "17": "Meghalaya", "18": "Assam", "19": "West Bengal",
  "20": "Jharkhand", "21": "Odisha", "22": "Chhattisgarh", "23": "Madhya Pradesh", "24": "Gujarat",
  "25": "Daman & Diu (old code)", "26": "Dadra & Nagar Haveli and Daman & Diu", "27": "Maharashtra",
  "28": "Andhra Pradesh (old code)", "29": "Karnataka", "30": "Goa", "31": "Lakshadweep",
  "32": "Kerala", "33": "Tamil Nadu", "34": "Puducherry", "35": "Andaman & Nicobar Islands",
  "36": "Telangana", "37": "Andhra Pradesh", "38": "Ladakh", "97": "Other Territory",
  "99": "Centre Jurisdiction",
};

export const PAN_TYPES = {
  P: "Individual (person)", C: "Company", H: "Hindu Undivided Family (HUF)",
  F: "Firm / LLP", A: "Association of Persons (AOP)", T: "Trust",
  B: "Body of Individuals (BOI)", L: "Local Authority", J: "Artificial Juridical Person",
  G: "Government",
};

const CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/** GSTN check-digit (15th character) for the first 14 characters. */
export function gstinCheckChar(first14) {
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    const v = CHARS.indexOf(first14[i]);
    if (v < 0) return null;
    const p = v * (i % 2 === 0 ? 1 : 2);
    sum += Math.floor(p / 36) + (p % 36);
  }
  return CHARS[(36 - (sum % 36)) % 36];
}

export function cleanId(s) {
  return String(s || "").toUpperCase().replace(/[^0-9A-Z]/g, "");
}

/** Validate and decode a GSTIN. Returns {ok, gstin, errors[], warnings[], ...parts}. */
export function checkGSTIN(input) {
  const g = cleanId(input);
  const r = { gstin: g, ok: false, errors: [], warnings: [] };
  if (g.length !== 15) { r.errors.push(`A GSTIN has 15 characters; this has ${g.length}.`); return r; }
  r.stateCode = g.slice(0, 2);
  r.state = STATES[r.stateCode] || null;
  r.pan = g.slice(2, 12);
  r.entityNo = g[12];
  r.z = g[13];
  r.check = g[14];
  if (!r.state) r.errors.push(`"${r.stateCode}" is not a valid state code.`);
  const standardPan = /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(r.pan);
  if (standardPan) {
    r.panType = PAN_TYPES[r.pan[3]] || null;
    if (!r.panType) r.warnings.push(`PAN 4th letter "${r.pan[3]}" is not a common taxpayer type.`);
  } else {
    // TDS deductors (TAN-based), UIN holders, non-residents etc. use other patterns.
    r.warnings.push("Characters 3–12 are not a standard PAN — this may be a special registration (TDS/TCS, UIN, non-resident). Verify on the GST portal.");
  }
  if (!/^[1-9A-Z]$/.test(r.entityNo)) r.errors.push("13th character (registration number under this PAN) must be 1–9 or A–Z.");
  if (r.z !== "Z") r.warnings.push(`14th character is usually "Z"; here it is "${r.z}" (seen only on special registrations).`);
  const expect = gstinCheckChar(g.slice(0, 14));
  r.expectedCheck = expect;
  if (expect !== r.check) r.errors.push(`Check digit is wrong: last character should be "${expect}", not "${r.check}". Likely a typo.`);
  r.ok = r.errors.length === 0;
  r.entityCount = r.ok ? (/\d/.test(r.entityNo) ? Number(r.entityNo) : CHARS.indexOf(r.entityNo)) : null;
  return r;
}

/** PAN check: AAAAA9999A, decode holder type. */
export function checkPAN(input) {
  const p = cleanId(input);
  const r = { pan: p, ok: false, errors: [], warnings: [] };
  if (p.length !== 10) { r.errors.push(`A PAN has 10 characters; this has ${p.length}.`); return r; }
  if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(p)) { r.errors.push("Format must be 5 letters, 4 digits, 1 letter (e.g. ABCDE1234F)."); return r; }
  r.type = PAN_TYPES[p[3]] || null;
  if (!r.type) r.warnings.push(`4th letter "${p[3]}" is not one of the usual PAN holder types — double-check the number.`);
  r.nameLetter = p[4];
  r.ok = r.errors.length === 0;
  return r;
}

/** IFSC: 4 letters (bank), 0, then 6 letters/digits (branch). */
export function checkIFSC(input) {
  const s = cleanId(input);
  return { ifsc: s, ok: /^[A-Z]{4}0[A-Z0-9]{6}$/.test(s), bank: s.slice(0, 4), branch: s.slice(5) };
}

export function checkPIN(input) {
  const s = String(input || "").replace(/\D/g, "");
  return { pin: s, ok: /^[1-9][0-9]{5}$/.test(s) };
}
