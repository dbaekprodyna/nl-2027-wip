#!/usr/bin/env python3
"""Twenty-second round — 2026-09-05.

  A  assets      review22.css after review21.css, mobile16.css after
                 mobile15.css, review22.js after review18.js, on every
                 page; review22.css into the design system's shell too,
                 so the S-02 specimen draws the new dot.
  B  site.js     1  the conference timeline reads above the standings
                 2  a live conference card opens on its live stop
                 3  the calendar's day accordion draws the WT table
  C  review17.js "Be first to know" reads above "Meet the next
                 generation" on the pre-season page.

Idempotent:
    python3 tools/p33_review22.py && python3 tools/bump_assets.py
"""
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAGES = [f for f in sorted(os.listdir(ROOT)) if f.endswith('.html')]


def patch(path, pairs, label):
    """All-or-nothing: a file is written only when every replacement
    in it has been made. Round twenty lost two edits to a script that
    exited half way through a file."""
    s = open(path, encoding='utf-8').read()
    o = s
    missing = []
    for old, new in pairs:
        if new in s:
            continue                      # already applied
        if old not in s:
            missing.append(old.strip().splitlines()[0][:60])
            continue
        s = s.replace(old, new, 1)
    if missing:
        print('  !! %s: not found -> %s' % (label, ' | '.join(missing)))
        return False
    if s != o:
        open(path, 'w', encoding='utf-8').write(s)
        print('  ok %s' % label)
    else:
        print('  -- %s (already applied)' % label)
    return True


# ---- A  the asset links --------------------------------------------
LINKS = [
    ('assets/review22.css',
     r'(<link rel="stylesheet" href="assets/review21\.css\?v=[^"]*">)',
     r'\1\n<link rel="stylesheet" href="assets/review22.css?v=1">'),
    ('assets/mobile16.css',
     r'(<link rel="stylesheet" href="assets/mobile15\.css\?v=[^"]*">)',
     r'\1\n<link rel="stylesheet" href="assets/mobile16.css?v=1">'),
    ('assets/review22.js',
     r'(<script defer src="assets/review18\.js\?v=[^"]*"></script>)',
     r'\1\n<script defer src="assets/review22.js?v=1"></script>'),
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
print('review22 assets linked into:', ', '.join(done) if done else '(already linked)')

# the design system shell stops at review15; the timeline rules are
# self-contained, so one more link is all its specimen needs
ds = os.path.join(ROOT, 'system', 'index.html')
if os.path.exists(ds):
    s = open(ds, encoding='utf-8').read()
    if '../assets/review22.css' not in s:
        s2 = re.sub(r'(<link rel="stylesheet" href="\.\./assets/review15\.css\?v=[^"]*">)',
                    r'\1\n<link rel="stylesheet" href="../assets/review22.css?v=1">',
                    s, count=1)
        if s2 != s:
            open(ds, 'w', encoding='utf-8').write(s2)
            print('review22.css linked into the design system')
        else:
            print('  !! design system: review15 anchor not found')
    else:
        print('design system: already linked')

# ---- B  site.js ----------------------------------------------------
SITE = os.path.join(ROOT, 'assets', 'site.js')

TL_OLD = """        var after = stbl && stbl.closest('.tpl-sub');
        var firstOv = $$('[data-pane="overview"]', content)[0];
        if (after && after.parentNode) {
          after.parentNode.insertBefore(wrap, after.nextSibling);
        } else if (firstOv && firstOv.parentNode) {
          firstOv.parentNode.insertBefore(wrap, firstOv);
        } else {
          content.appendChild(wrap);
        }"""

TL_NEW = """        /* Review 22 — Daniel: the timeline belongs with the tab
           strip above it. The strip and the rail state the same six
           stops, one as somewhere to go and one as how far the
           season has got; the standings are what the pair of them
           leads into. It goes back to the head of Overview.
           .tpl-content is a 40px flex column on a desktop and a 20px
           one on a phone, so the position is most of the spacing and
           review22/mobile16 make up the rest. */
        var anchor = (stbl && stbl.closest('.tpl-sub')) ||
                     $$('[data-pane="overview"]', content)[0];
        if (anchor && anchor.parentNode) {
          anchor.parentNode.insertBefore(wrap, anchor);
        } else {
          content.appendChild(wrap);
        }"""

CARD_OLD = """          var box = $('.e03-feds', card);
          if (box) box.hidden = true;
        }
        link(wrap, 'conference.html?id=' + c.id);"""

CARD_NEW = """          var box = $('.e03-feds', card);
          if (box) box.hidden = true;
        }
        /* Review 22 — a card carrying a Live badge is an offer to
           watch what is on, and Overview is a page about the
           conference rather than the thing itself. A live card opens
           the stop that is live; its tab strip is the way back to
           Overview, so nothing is lost by starting there. */
        var liveEv = st.live && st.evs.filter(function (e) {
          return stopLive(e, today);
        })[0];
        link(wrap, liveEv ? ('stop.html?id=' + liveEv.slug)
                          : ('conference.html?id=' + c.id));"""

ACC_OLD = """    var head = $('.thead', body);
    if (head) body.insertBefore(scroll, head); else body.appendChild(scroll);
    $$('.thead, .trow', body).forEach(function (n) { tbl.appendChild(n); });
    return tbl;"""

ACC_NEW = """    var head = $('.thead', body);
    /* Review 22 — mobile6 gives an accordion on a phone a .mscroll
       of its own and puts the rows inside it, so the header is not
       always a child of the body. Home never saw this because
       site.js runs before mobile6 boots; the calendar's day list is
       painted on a click, which is long after. The insertion point
       is whichever child of the body is holding the header. */
    var anchor = head;
    while (anchor && anchor.parentNode !== body) anchor = anchor.parentNode;
    if (anchor) body.insertBefore(scroll, anchor); else body.appendChild(scroll);
    $$('.thead, .trow', body).forEach(function (n) { tbl.appendChild(n); });
    var rail = $(':scope > .mscroll', body);
    if (rail && !rail.children.length) rail.remove();
    return tbl;"""

CAL_OLD = """        var rows = conferenceTable(c.id, g, e.start);
        var complete = all.length && played >= all.length;
        if (!rows.length) {
          $$('.trow', node).forEach(function (r) { r.hidden = true; });
        } else {
          repeat(node, '.trow', rows.slice(0, 6), function (row, r) {
            paintStandingRow(row, r, complete);
          });
        }"""

CAL_NEW = """        var rows = conferenceTable(c.id, g, e.start);
        var complete = all.length && played >= all.length;
        /* Review 22 — the same table the landing page's Live now
           accordion draws, built by the same call. A reader who
           opens a day here and then opens the same conference on
           the home page was being handed two column sets for one
           thing. */
        rows.forEach(function (r) {
          r.status = (complete && r.rank === 1 && r.tour > 0) ? 'q' : 'r';
        });
        var ctbl = accTable(node);
        if (ctbl) {
          if (!rows.length) ctbl.innerHTML = '';
          else wtTable(ctbl, rows, all, { limit: 6, seed: true });
        }"""

ok = patch(SITE, [(TL_OLD, TL_NEW), (CARD_OLD, CARD_NEW), (CAL_OLD, CAL_NEW),
                  (ACC_OLD, ACC_NEW)], 'site.js')

# ---- C  review17.js ------------------------------------------------
R17 = os.path.join(ROOT, 'assets', 'review17.js')

PRE_OLD = """      var gen = nextGenSection(data);
      if (gen) made.push(gen);
      if (b.ad) made.push(b.ad);
      made.push(ctaSection());
      [b.split, b.photos, b.news].forEach(function (n) { if (n) n.hidden = true; });"""

PRE_NEW = """      /* Review 22 — Daniel: the sign-up reads before the players.
         A reader on a pre-season page has come for one thing, the
         date, and the offer to be told it is the page's own answer;
         the gallery is what they stay for afterwards. */
      made.push(ctaSection());
      var gen = nextGenSection(data);
      if (gen) made.push(gen);
      if (b.ad) made.push(b.ad);
      [b.split, b.photos, b.news].forEach(function (n) { if (n) n.hidden = true; });"""

ok = patch(R17, [(PRE_OLD, PRE_NEW)], 'review17.js') and ok

# ---- the check round twenty asked for ------------------------------
s = open(SITE, encoding='utf-8').read()
for marker in ('Review 22 — Daniel: the timeline belongs',
               'Review 22 — a card carrying a Live badge',
               'Review 22 — the same table the landing',
               'Review 22 — mobile6 gives an accordion'):
    print('  site.js marker %-46s %s' % (marker[:44] + '..',
                                         'present' if marker in s else 'MISSING'))

sys.exit(0 if ok else 1)
