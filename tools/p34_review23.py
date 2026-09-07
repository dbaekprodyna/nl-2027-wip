#!/usr/bin/env python3
"""Twenty-third round — 2026-09-07.

  A  assets   review23.css after review22.css, mobile17.css after
              mobile16.css, review23.js after review22.js, on every
              page; review23.css into the design system's shell too,
              so the S-02 specimen draws the smaller check and the
              S-05 specimen the inset advance mark.

Nothing else: every change in this round is a stylesheet rule or the
one script above.

Idempotent:
    python3 tools/p34_review23.py && python3 tools/bump_assets.py
"""
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAGES = [f for f in sorted(os.listdir(ROOT)) if f.endswith('.html')]

LINKS = [
    ('assets/review23.css',
     r'(<link rel="stylesheet" href="assets/review22\.css\?v=[^"]*">)',
     r'\1\n<link rel="stylesheet" href="assets/review23.css?v=1">'),
    ('assets/mobile17.css',
     r'(<link rel="stylesheet" href="assets/mobile16\.css\?v=[^"]*">)',
     r'\1\n<link rel="stylesheet" href="assets/mobile17.css?v=1">'),
    ('assets/review23.js',
     r'(<script defer src="assets/review22\.js\?v=[^"]*"></script>)',
     r'\1\n<script defer src="assets/review23.js?v=1"></script>'),
]

done = []
for f in PAGES:
    p = os.path.join(ROOT, f)
    s = open(p, encoding='utf-8').read()
    o = s
    for needle, pat, rep in LINKS:
        if needle in s:
            continue
        s2 = re.sub(pat, rep, s, count=1)
        if s2 == s:
            continue                     # this page does not carry the anchor
        s = s2
    if s != o:
        open(p, 'w', encoding='utf-8').write(s)
        done.append(f)
print('review23 assets linked into:', ', '.join(done) if done else '(already linked)')

# The design system's shell links review15 and review22; review23 is
# self-contained in the same way, so one more line lets the S-02 and
# S-05 specimens draw what the site draws.
ds = os.path.join(ROOT, 'system', 'index.html')
if os.path.exists(ds):
    s = open(ds, encoding='utf-8').read()
    if '../assets/review23.css' not in s:
        s2 = re.sub(r'(<link rel="stylesheet" href="\.\./assets/review22\.css\?v=[^"]*">)',
                    r'\1\n<link rel="stylesheet" href="../assets/review23.css?v=1">',
                    s, count=1)
        if s2 != s:
            open(ds, 'w', encoding='utf-8').write(s2)
            print('review23.css linked into the design system')
        else:
            print('  !! design system: review22 anchor not found')
    else:
        print('design system: already linked')
