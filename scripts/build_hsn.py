#!/usr/bin/env python3
"""
Print9 OpenTools - HSN / SAC database builder.

Converts the official GSTN "HSN Directory" Excel file
(https://tutorial.gst.gov.in/downloads/HSN_SAC.xlsx, linked from
gst.gov.in > Services > User Services > Search HSN Code >
"Download HSN Directory in Excel Format") into compact JSON files
that the website loads.

Nothing is typed in by hand: every code and description comes from
the official file. The script refuses to write output if the file
looks wrong (too few rows, missing sheets, bad codes), so a broken
download can never replace a good database.

Usage: python3 build_hsn.py <HSN_SAC.xlsx> <output_dir>
"""
import hashlib
import json
import os
import re
import sys
from datetime import datetime, timezone

from openpyxl import load_workbook

SOURCE_URL = "https://tutorial.gst.gov.in/downloads/HSN_SAC.xlsx"

# Sanity limits. The official master has roughly 20k+ HSN rows and
# 600+ SAC rows; anything far below that means a bad download.
MIN_HSN = 8000
MIN_SAC = 300


def clean_text(v):
    if v is None:
        return ""
    s = str(v).replace(" ", " ")
    s = re.sub(r"\s+", " ", s).strip()
    return s


def clean_code(v):
    """Return the code as a digit string, restoring leading zeros that
    Excel drops when a code is stored as a number (e.g. 101 -> '0101')."""
    if v is None:
        return ""
    if isinstance(v, float):
        if v != int(v):
            return ""
        v = int(v)
    s = str(v).strip().replace(" ", "").replace(".", "")
    if not s.isdigit():
        return ""
    if len(s) % 2 == 1:  # HSN/SAC codes are 2, 4, 6 or 8 digits
        s = "0" + s
    if len(s) not in (2, 4, 6, 8):
        return ""
    return s


def find_header(ws):
    """Find (row_index, code_col, desc_col, kind) in the first rows."""
    for r_idx, row in enumerate(ws.iter_rows(min_row=1, max_row=15, values_only=True), start=1):
        cells = [clean_text(c).upper() for c in row]
        code_col = desc_col = None
        kind = None
        for i, c in enumerate(cells):
            if code_col is None and re.search(r"\b(HSN|SAC)\b|HSN_|SAC_", c) and "DESC" not in c:
                code_col = i
                kind = "SAC" if "SAC" in c else "HSN"
            elif desc_col is None and "DESC" in c:
                desc_col = i
        if code_col is not None and desc_col is not None:
            return r_idx, code_col, desc_col, kind
    return None


def main():
    if len(sys.argv) != 3:
        print(__doc__)
        sys.exit(2)
    src, out_dir = sys.argv[1], sys.argv[2]
    raw = open(src, "rb").read()
    sha = hashlib.sha256(raw).hexdigest()
    os.makedirs(out_dir, exist_ok=True)
    meta_path = os.path.join(out_dir, "hsn-sac-meta.json")
    if os.path.exists(meta_path) and os.path.exists(os.path.join(out_dir, "hsn-sac.json")):
        try:
            if json.load(open(meta_path, encoding="utf-8")).get("sha256") == sha:
                print("Official file unchanged since last build - nothing to do.")
                return
        except Exception:
            pass

    wb = load_workbook(src, read_only=True, data_only=True)
    data = {"HSN": {}, "SAC": {}}
    sheets_used = []
    for ws in wb.worksheets:
        hdr = find_header(ws)
        if not hdr:
            continue
        r0, cc, dc, kind = hdr
        title = ws.title.upper()
        if "SAC" in title:
            kind = "SAC"
        elif "HSN" in title:
            kind = "HSN"
        n = 0
        for row in ws.iter_rows(min_row=r0 + 1, values_only=True):
            if row is None or len(row) <= max(cc, dc):
                continue
            code = clean_code(row[cc])
            desc = clean_text(row[dc])
            if not code or not desc:
                continue
            k = "SAC" if code.startswith("99") and kind == "SAC" else kind
            # Keep the first description seen for a code; join true duplicates.
            prev = data[k].get(code)
            if prev and desc != prev and desc not in prev:
                data[k][code] = prev + " | " + desc
            elif not prev:
                data[k][code] = desc
            n += 1
        sheets_used.append({"sheet": ws.title, "kind": kind, "rows": n})

    n_hsn, n_sac = len(data["HSN"]), len(data["SAC"])
    print(f"sheets: {sheets_used}")
    print(f"HSN codes: {n_hsn}  SAC codes: {n_sac}")

    errors = []
    if n_hsn < MIN_HSN:
        errors.append(f"too few HSN codes ({n_hsn} < {MIN_HSN})")
    if n_sac < MIN_SAC:
        errors.append(f"too few SAC codes ({n_sac} < {MIN_SAC})")
    bad_sac = [c for c in data["SAC"] if not c.startswith("99")]
    if bad_sac:
        errors.append(f"SAC codes not starting with 99: {bad_sac[:5]}")
    # Spot checks against well-known, permanent entries.
    for k, code in (("HSN", "4901"), ("HSN", "4911"), ("HSN", "4802"), ("SAC", "9989")):
        if code not in data[k]:
            errors.append(f"expected {k} {code} missing")
    if errors:
        print("REFUSING TO WRITE OUTPUT:\n  " + "\n  ".join(errors))
        sys.exit(1)

    def pack(d):
        return [[c, d[c]] for c in sorted(d, key=lambda x: (x[:2], x))]

    out = {
        "source": SOURCE_URL,
        "publisher": "GSTN (Goods and Services Tax Network), Government of India",
        "fetched_utc": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "sha256": sha,
        "counts": {"HSN": n_hsn, "SAC": n_sac},
        "hsn": pack(data["HSN"]),
        "sac": pack(data["SAC"]),
    }
    path = f"{out_dir.rstrip('/')}/hsn-sac.json"
    with open(path, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
    meta = {k: out[k] for k in ("source", "publisher", "fetched_utc", "sha256", "counts")}
    with open(f"{out_dir.rstrip('/')}/hsn-sac-meta.json", "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=1)
    print(f"wrote {path}")


if __name__ == "__main__":
    main()
