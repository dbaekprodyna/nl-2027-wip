"""Helpers to edit the design-system pages (system/pages/*.html) element-wise."""
import json, re, html as _html

TAG = re.compile(r'<(/?)(div|section|span|a|ul|li|nav|h1|h2|h3|p|button|aside|header|footer|main|label|figure|table|tr|td|th|tbody|thead)\b[^>]*?(/?)>', re.I)


def end_of(s, start):
    """index just past the element that opens at s[start] (balanced on the same tag name)."""
    m = re.match(r'<([a-zA-Z0-9]+)', s[start:])
    name = m.group(1).lower()
    pat = re.compile(r'<(/?)' + name + r'\b[^>]*?(/?)>', re.I)
    depth = 0
    for t in pat.finditer(s, start):
        if t.group(2):  # self-closing
            if depth == 0: return t.end()
            continue
        depth += -1 if t.group(1) else 1
        if depth == 0:
            return t.end()
    raise ValueError('unbalanced ' + name + ' at ' + str(start))


def find_open(s, needle, frm=0):
    """index of the '<' that opens the tag containing `needle` (a substring inside the start tag)."""
    i = s.find(needle, frm)
    if i < 0: return -1
    return s.rfind('<', 0, i)


def section_span(s, sid):
    i = find_open(s, 'id="%s"' % sid)
    if i < 0: raise KeyError(sid)
    return i, end_of(s, i)


def children(s, start, end):
    """direct child element spans of the element s[start:end]."""
    gt = s.index('>', start) + 1
    close = s.rindex('</', start, end)
    out, i = [], gt
    while True:
        j = s.find('<', i, close)
        if j < 0: break
        if s.startswith('<!--', j):
            i = s.index('-->', j) + 3; continue
        if s[j + 1] == '/': break
        e = end_of(s, j) if not re.match(r'<(img|br|input|hr|source|path)\b', s[j:]) else s.index('>', j) + 1
        out.append((j, e)); i = e
    return out


def cls_of(s, i):
    m = re.match(r'<[a-zA-Z0-9]+\b[^>]*?class="([^"]*)"', s[i:s.index('>', i) + 1])
    return m.group(1).split() if m else []


def esc(t): return _html.escape(t, quote=False)


# ---------- harvested markup → specimen markup ----------
def clean(h, max_rows=None, keep_hidden=True):
    h = h.replace('src="assets/', 'src="../assets/').replace("url(assets/", "url(../assets/").replace('url("assets/', 'url("../assets/').replace("url(&quot;assets/", "url(&quot;../assets/")
    # inert links: drop href on page links (keep the element, it carries styles)
    h = re.sub(r'(<a\b[^>]*?)\shref="[^"]*"', r'\1', h)
    h = re.sub(r'\sdata-(?:href|ioc|conf|slug|stop|idx|i)="[^"]*"', '', h)
    # page ids would collide inside the DS shell; SVG ids (clipPath, gradients) must survive
    h = re.sub(r'(<(?:div|section|span|a|button|input|h1|h2|ul|li|nav|template)\b[^>]*?)\sid="[^"]*"', r'\1', h)
    h = re.sub(r'\sstyle="cursor: pointer;"', '', h)
    h = re.sub(r'\saria-current="[^"]*"', '', h)
    if not keep_hidden:
        # remove elements carrying hidden=""
        while True:
            m = re.search(r'<([a-z0-9]+)\b[^>]*\shidden=""[^>]*>', h)
            if not m: break
            e = end_of(h, m.start()) if not re.match(r'<(img|input)\b', m.group(0)) else m.end()
            h = h[:m.start()] + h[e:]
    h = re.sub(r'\n\s*\n+', '\n', h)
    if max_rows:
        h = trim_rows(h, max_rows)
    return h


def trim_rows(h, n, row_cls='trow'):
    """keep the first n `.trow` children of every table in h."""
    out, i, kept_in = [], 0, {}
    pat = re.compile(r'<div\b[^>]*class="[^"]*\b%s\b[^"]*"' % row_cls)
    # walk tables: count rows per parent by position of parent's open tag
    pieces = []
    pos = 0
    while True:
        m = pat.search(h, pos)
        if not m: break
        st = m.start(); en = end_of(h, st)
        par = h.rfind('<div', 0, st)  # approximate: rows share a parent if contiguous
        # contiguous run detection
        key = None
        for k, (a, b, c) in list(kept_in.items()):
            if a == st: key = k
        pieces.append((st, en))
        pos = en
    # group contiguous rows (allowing whitespace between)
    groups, cur = [], []
    for st, en in pieces:
        if cur and h[cur[-1][1]:st].strip() == '':
            cur.append((st, en))
        else:
            if cur: groups.append(cur)
            cur = [(st, en)]
    if cur: groups.append(cur)
    cuts = []
    for g in groups:
        if len(g) > n:
            cuts.append((g[n][0], g[-1][1]))
    for a, b in reversed(cuts):
        h = h[:a] + h[b:]
    return h


# ---------- DS block builders ----------
def m_state(label, frame_cls, inner, style=''):
    st = ' style="%s"' % style if style else ''
    return ('<div class="m-state"><div class="t-caption el-state-label">%s</div>'
            '<div class="%s m-frame live"%s>%s</div></div>') % (esc(label), frame_cls, st, inner)


def el_state(label, inner):
    return '<div class="el-state"><div class="t-caption el-state-label">%s</div>%s</div>' % (esc(label), inner)


def note(text_html, title='Note'):
    return '<div class="el-note cut cut-s"><div class="t-label">%s</div><div class="t-body-s">%s</div></div>' % (title, text_html)


def m_section(sid, name, purpose, states_html, notes_html=''):
    return ('<section class="anchor" id="%s" data-anchor="%s"><section class="m-block">'
            '<div class="m-head"><div class="ds-name">%s</div><div class="t-body-s el-purpose">%s</div></div>'
            '<div class="m-states">%s</div>%s</section></section>') % (sid, sid, esc(name), purpose, states_html, notes_html)


def el_section(sid, name, purpose, states_html, notes_html=''):
    return ('<section class="anchor" id="%s" data-anchor="%s"><section class="el-block">\n'
            '<div class="el-head"><div class="ds-name">%s</div><div class="t-body-s el-purpose">%s</div></div>\n'
            '<div class="el-states-col"><div class="el-states">%s</div></div>%s</section></section>') % (sid, sid, esc(name), purpose, states_html, notes_html)


SYNC = 'synced-r24'  # marker so the patch is idempotent


def mark(label):
    return label
