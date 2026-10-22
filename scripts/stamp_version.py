#!/usr/bin/env python3
"""Stamp sw.js with a hash of every site file, so phones and PCs that
have the site saved for offline use fetch the new version after each
update. Run from the repo root (the publish workflow does this)."""
import hashlib
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SKIP_DIRS = {".git", ".github", "scripts", "tests", "node_modules"}

h = hashlib.sha256()
for dirpath, dirnames, filenames in os.walk(ROOT):
    dirnames[:] = sorted(d for d in dirnames if d not in SKIP_DIRS)
    for name in sorted(filenames):
        if name in ("sw.js", "version.json"):
            continue
        p = os.path.join(dirpath, name)
        h.update(os.path.relpath(p, ROOT).encode())
        with open(p, "rb") as f:
            h.update(f.read())
version = h.hexdigest()[:12]

sw = os.path.join(ROOT, "sw.js")
if os.path.exists(sw):
    s = open(sw, encoding="utf-8").read()
    s2 = re.sub(r'const VERSION = "[^"]*";', f'const VERSION = "{version}";', s, count=1)
    open(sw, "w", encoding="utf-8").write(s2)
    print("sw.js version:", version)
else:
    print("no sw.js yet")

# Show the build date (India time) and id in the page footer.
from datetime import datetime, timedelta, timezone
ist = datetime.now(timezone.utc) + timedelta(hours=5, minutes=30)
idx = os.path.join(ROOT, "index.html")
html = open(idx, encoding="utf-8").read()
html = re.sub(r"<span data-build-date>[^<]*</span>", f"<span data-build-date>{ist.strftime('%d %b %Y')}</span>", html)
html = re.sub(r"<span data-build-id>[^<]*</span>", f"<span data-build-id>{version[:7]}</span>", html)
open(idx, "w", encoding="utf-8").write(html)
print("footer stamped:", ist.strftime('%d %b %Y'), version[:7])

# Version file read by Ops Board: same build id as the footer.
import json
with open(os.path.join(ROOT, "version.json"), "w", encoding="utf-8") as f:
    json.dump({"service": "p9-opentools", "build": version[:7], "built_at": ist.strftime("%Y-%m-%d")}, f, indent=2)
    f.write("\n")
print("version.json stamped:", version[:7])
