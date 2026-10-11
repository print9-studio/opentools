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
        if name == "sw.js":
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
