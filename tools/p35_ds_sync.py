#!/usr/bin/env python3
"""p35 — sync the design system (system/) to the prototype pages as of review 23.

Harvested markup (tools/ds-sync/harvest-2026-10-07.json, produced by tools/ds-sync/harvest.js from the
rendered pages at 1440) replaces stale specimens; new components get their own anchors and nav.json entries.
Run once, on a clean checkout of system/ — every inserted block carries data-sync="r24" and the script
refuses to run twice.  Usage: python3 tools/p35_ds_sync.py . tools/ds-sync/harvest-2026-10-07.json
"""
import json, re, sys, os
sys.path.insert(0, os.path.dirname(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "ds-sync"))
from dslib import *

ROOT = sys.argv[1]
H = json.load(open(sys.argv[2]))
P = ROOT + '/system/pages/'
pages = {n: open(P + n + '.html').read() for n in ['elements', 'modules-1', 'modules-2']}
nav = json.load(open(ROOT + '/system/nav.json'))
SYNC_ATTR = ' data-sync="r24"'
DATE = '7 Oct 2026'


if any('data-sync="r24"' in v for v in pages.values()):
    sys.exit('already synced — run on a clean checkout of system/pages and system/nav.json')


def H_(name, rows=None, hidden=True):
    return clean(H[name]['html'], max_rows=rows, keep_hidden=hidden)


def pick(h, token, n=0, outer=True):
    """outerHTML of the n-th element whose class list contains `token`."""
    pat = re.compile(r'<([a-z0-9]+)\b[^>]*\bclass="(?:[^"]*\s)?%s(?:\s[^"]*)?"' % re.escape(token))
    ms = list(pat.finditer(h))
    if len(ms) <= n: raise KeyError(token)
    st = ms[n].start()
    if re.match(r'<(img|input)\b', h[st:]): return h[st:h.index('>', st) + 1]
    return h[st:end_of(h, st)]


def drop(h, token, all_=True):
    pat = re.compile(r'<([a-z0-9]+)\b[^>]*\bclass="(?:[^"]*\s)?%s(?:\s[^"]*)?"' % re.escape(token))
    while True:
        m = pat.search(h)
        if not m: return h
        h = h[:m.start()] + h[end_of(h, m.start()):]
        if not all_: return h


def keep_first(h, token, n):
    """keep only the first n elements with class token (siblings), drop the rest."""
    pat = re.compile(r'<([a-z0-9]+)\b[^>]*\bclass="(?:[^"]*\s)?%s(?:\s[^"]*)?"' % re.escape(token))
    ms = list(pat.finditer(h))
    for m in reversed(ms[n:]):
        h = h[:m.start()] + h[end_of(h, m.start()):]
    return h


def W(h, w=None):
    return '<div style="width:%dpx;max-width:100%%">%s</div>' % (w, h) if w else h


def col(*parts, gap=16):
    return '<div style="display:flex;flex-direction:column;gap:%dpx;width:100%%">%s</div>' % (gap, ''.join(parts))


def state(label, frame, inner, live=True):
    return ('<div class="m-state"%s><div class="t-caption el-state-label">%s</div>'
            '<div class="%s m-frame%s">%s</div></div>') % (SYNC_ATTR, esc(label), frame, ' live' if live else '', inner)


def elstate(label, inner):
    return '<div class="el-state"%s><div class="t-caption el-state-label">%s</div>%s</div>' % (SYNC_ATTR, esc(label), inner)


def synced_note(text):
    return ('<div class="el-note cut cut-s"%s><div class="t-label">Synced with the prototype · %s</div>'
            '<div class="t-body-s">%s</div></div>') % (SYNC_ATTR, DATE, text)


# ---------- section-level operations ----------
def where(sid):
    for n, s in pages.items():
        if ('id="%s"' % sid) in s: return n
    raise KeyError(sid)


def sec_get(sid):
    n = where(sid); s = pages[n]; a, b = section_span(s, sid); return n, a, b


def states_container(sec):
    for tok in ('class="m-states"', 'class="el-states"', 'class="el-states-col"'):
        i = sec.find(tok)
        if i >= 0:
            st = sec.rfind('<', 0, i); return st, end_of(sec, st)
    raise KeyError('states')


def state_spans(sec):
    out = []
    for m in re.finditer(r'<div class="(m-state|el-state)"', sec):
        out.append((m.start(), end_of(sec, m.start())))
    return out


def edit(sid, fn):
    n, a, b = sec_get(sid)
    s = pages[n]
    pages[n] = s[:a] + fn(s[a:b]) + s[b:]


def replace_state(sid, idx, label, inner, frame_extra=''):
    """swap the specimen of state #idx (and its label) for harvested markup; keeps the frame element."""
    def f(sec):
        sp = state_spans(sec)
        a, b = sp[idx]
        st = sec[a:b]
        fr = re.search(r'<div class="([^"]*\bm-frame\b[^"]*)"[^>]*>', st)
        frame_cls = re.sub(r'\s*\b(m-frame|live)\b', '', fr.group(1)).strip() if fr else ''
        new = state(label, frame_cls + frame_extra, inner)
        return sec[:a] + new + sec[b:]
    edit(sid, f)


def drop_state(sid, idx):
    def f(sec):
        a, b = state_spans(sec)[idx]
        return sec[:a] + sec[b:]
    edit(sid, f)


def relabel(sid, idx, label):
    def f(sec):
        a, b = state_spans(sec)[idx]
        st = sec[a:b]
        st = re.sub(r'(el-state-label">)(.*?)(</div>)', lambda m: m.group(1) + esc(label) + m.group(3), st, count=1)
        return sec[:a] + st + sec[b:]
    edit(sid, f)


def add_state(sid, html, at=None):
    """append (or insert at index) a state inside the section's states container."""
    def f(sec):
        sp = state_spans(sec)
        if at is not None and at < len(sp):
            a = sp[at][0]; return sec[:a] + html + sec[a:]
        a, b = states_container(sec)
        close = sec.rindex('</div>', a, b)
        return sec[:close] + html + sec[close:]
    edit(sid, f)


def add_note(sid, html):
    def f(sec):
        a, b = states_container(sec)
        return sec[:b] + html + sec[b:]
    edit(sid, f)


def set_purpose(sid, text_html):
    def f(sec):
        return re.sub(r'(<div class="t-body-s el-purpose">)(.*?)(</div>)', lambda m: m.group(1) + text_html + m.group(3), sec, count=1, flags=re.S)
    edit(sid, f)


def sub_in(sid, old, new, count=0):
    def f(sec):
        if old not in sec: raise KeyError('%s: %r' % (sid, old[:60]))
        return sec.replace(old, new) if not count else sec.replace(old, new, count)
    edit(sid, f)


def insert_section(after_sid, html, nav_group, item):
    n, a, b = sec_get(after_sid)
    s = pages[n]
    html = html.replace('<section class="anchor"', '<section class="anchor"' + SYNC_ATTR, 1)
    pages[n] = s[:b] + html + s[b:]
    for g in nav:
        for i, it in enumerate(g['items']):
            if it['slug'] == after_sid:
                item['sync'] = 1
                g['items'].insert(i + 1, item)
                return
    raise KeyError('nav ' + after_sid)


def new_m(sid, name, purpose, states_html, note_html=''):
    return m_section(sid, name, purpose, states_html, note_html)


def new_el(sid, name, purpose, states_html, note_html=''):
    return el_section(sid, name, purpose, states_html, note_html)


def plain_state(label, frame, inner, live=True):  # state without sync attr (inside a new section)
    return ('<div class="m-state"><div class="t-caption el-state-label">%s</div>'
            '<div class="%s m-frame%s">%s</div></div>') % (esc(label), frame, ' live' if live else '', inner)


def plain_el(label, inner):
    return '<div class="el-state"><div class="t-caption el-state-label">%s</div>%s</div>' % (esc(label), inner)


# =====================================================================================
# ELEMENTS
# =====================================================================================
tblbar = H_('stand_tblbar')
xexp = pick(tblbar, 'x-export')
add_state('ctl-01-button', elstate('variant = export — S outline with a download icon; Standings table bar and the Stats section headers', xexp))

add_state('ctl-03-tab', elstate('variant = stop tabs — conference page: Overview active, finished stops ticked, stops not yet played disabled', W(H_('tabs_conf'), 1080)))
add_state('ctl-03-tab', elstate('variant = stop tabs — stop page: the stop is the active tab, Overview goes back to the conference', W(H_('tabs_stop'), 1080)))
add_state('ctl-03-tab', elstate('variant = page tabs — Stats: Teams / Players', W(H_('st_tabs'), 420)))
add_note('ctl-03-tab', synced_note('Conference and stop pages share one tab strip (<code>.cnf-stoptabs</code>): Overview plus STOP 1–6. '
                                   'A finished stop carries <code>.cnf-tab-done</code>, a stop that has not started is <code>.tab-disabled</code> and has no link.'))

sf = H_('stand_filter')
add_state('ctl-04-input-select', elstate('variant = labelled select — filter panel on Standings (zone, conference)',
          '<div style="display:flex;gap:12px;flex-wrap:wrap">' + pick(sf, 'selwrap', 0) + pick(sf, 'selwrap', 1) + '</div>'))


def el02_fix(sec):
    # every instance in the prototype is size S; the size specimens never carried their size class
    sec = sec.replace('class="el-02-GenderSwitch-size--s el02"', 'class="el-02-GenderSwitch-size--s el02 el02-s"')
    sec = sec.replace('class="el-02-GenderSwitch-size--l el02"', 'class="el-02-GenderSwitch-size--l el02 el02-l"')
    for v in ('default', 'hover-on-women', 'focus-on-women', 'disabled', 'women-active'):
        sec = sec.replace('class="el-02-GenderSwitch--%s el02"' % v, 'class="el-02-GenderSwitch--%s el02 el02-s"' % v)
    sec = sec.replace('>S · 32</div>', '>S · 32 — default, every instance in the prototype</div>')
    sec = sec.replace('>M · 40 — default</div>', '>M · 40</div>')
    return sec


edit('el-02-genderswitch', el02_fix)
quad = pick(H_('f04_team'), 'el02-quad')
add_state('el-02-genderswitch', elstate('variant = category switch — All plus one segment per team site (team page, F-04 control slot)', quad))

qs = H_('qual_sub')
mini_q = pick(qs, 'badge-mini', 0)
mini_all = re.findall(r'<div class="el-05-StatusBadge--[a-z]+ badge badge-mini[^"]*"><span class="lbl">[^<]*</span></div>', qs)
seen, minis = set(), []
for m in mini_all:
    k = re.search(r'StatusBadge--([a-z]+)', m).group(1)
    if k not in seen: seen.add(k); minis.append(m)
add_state('el-05-statusbadge', elstate('size = mini — dense rows (R-01 compact board)', '<div style="display:flex;gap:8px">' + ''.join(minis) + '</div>'))

add_state('el-13-federationtag', elstate('size XS · code only — R-01 compact board', pick(qs, 'ftag-xs', 0)))
e03h = H_('e03')
add_state('el-13-federationtag', elstate('container = static — inside a card (E-03, S-07 month cards), not focusable on its own',
          '<div style="display:flex;gap:8px">' + pick(e03h, 'ftag-static', 0) + pick(e03h, 'ftag-static', 1) + pick(e03h, 'ftag-static', 2) + '</div>'))

add_state('el-09-legend', elstate('placement = top — in the table bar, right of Filter and Export (Standings)', '<div class="tblbar" style="width:1080px;max-width:100%">' + pick(tblbar, 'legend-top') + '</div>'))

r03 = H_('r03_sub', rows=4)
wt = pick(r03, 'wt-scroll')
add_state('el-08-tableheaderrow', elstate('variant = WT columns — POS · FEDERATION · SEED · TOUR PTS · STOP 1–6 · W% · PTS AVG · STATUS', W(wt, 1080)))
add_note('el-08-tableheaderrow', synced_note('WT tables (<code>.wt-tbl</code>) give every cell <code>min-width:0</code> so the header and body resolve to the same column boxes, '
                                             'POS is not sortable, right-aligned headers put the arrow left of the label (<code>row-reverse</code> + <code>flex-start</code>), '
                                             'and SEED is the one numeric column read left-aligned, against the federation beside it.'))
add_state('el-04-teamrow', elstate('variant = WT row — each stop stacks the placing over the points it earned; a win is bold, a stop not played is a dash', W(wt, 1080)))
add_note('el-04-teamrow', synced_note('A highlighted row (<code>.trow-hi</code>) marks itself with an inset 4px shadow, not a left border, so its cells stay on the same grid as every other row.'))

live = H_('live_sub')
add_state('el-30-calendarstrip', elstate('today — selected and live (landing page)', W(pick(live, 's03wrap'), 958)))

# el-33 FilterDrawer — new element
mf_closed = pick(tblbar, 'mfilt')
mf_chips = pick(live, 'mfilt')
fd_states = (plain_el('desktop · table bar (Standings) — the trigger is hidden and the panel sits inline: ToggleSwitch, then Export and the legend', W(tblbar, 1080)) +
             plain_el('desktop · selects (Standings) — the same panel, opened (.is-open)', W(H_('stand_filter'), 900)) +
             plain_el('desktop · chips — region filter above a list (landing page Live now, Calendar)', W(mf_chips, 900)))
insert_section('el-03-filterchips', new_el(
    'el-33-filterdrawer', 'el-33 FilterDrawer',
    'One wrapper for every filter on a page. On desktop the trigger is hidden and the panel is laid out in place; at phone width (mobile*.css) the panel folds behind a Filter button and opens on demand, '
    'so a page never stacks three rows of controls above its first result. The panel holds existing controls only — el-14 Chip, ctl-04 Select, ctl-08 ToggleSwitch.',
    fd_states, synced_note('Markup: <code>.mfilt &gt; button.mfilt-btn + .mfilt-panel</code>. <code>.mfilt-btn-quiet</code> is the variant used inside a table bar. '
                           'The open state is <code>.is-open</code> on the wrapper and <code>aria-expanded="true"</code> on the button.')),
    'elements', {'slug': 'el-33-filterdrawer', 'title': 'el-33 FilterDrawer', 'desc': 'One trigger for every filter on a page; the panel holds chips, selects and the toggle.'})

# =====================================================================================
# MODULES 1 — frame & schedule
# =====================================================================================
replace_state('f-02-globalheader', 1, 'with the season switch — In season / Off season / Pre season (prototype review control, desktop only)', H_('f02'))

f03i, f03c, f03s = H_('f03'), H_('f03_conf'), H_('f03_stand')
replace_state('f-03-competitionnav', 0, 'default — Conferences current', f03c)
replace_state('f-03-competitionnav', 1, 'Home current — a conference is live (red dot on Conferences)', f03i)
replace_state('f-03-competitionnav', 2, 'Standings current', f03s)
f03h = f03c.replace('<div class="f03-i" tabindex="0">Teams</div>', '<div class="f03-i f03-hover" tabindex="0">Teams</div>')
replace_state('f-03-competitionnav', 3, 'hover on Teams', f03h)
f03d = f03c.replace('<div class="f03-i" tabindex="0">Stats</div>', '<div class="f03-i f03-dis" tabindex="0">Stats</div>')
replace_state('f-03-competitionnav', 4, 'an item disabled', f03d)
add_note('f-03-competitionnav', synced_note('The bar now reads Home · Conferences · Standings · Teams · Stats · Calendar · News · About · More, with search last. '
                                            '<b>More</b> (<code>.f03-more</code>) opens F-05 MegaMenu.'))

edit('f-05-megamenu', lambda sec: sec.replace('<div class="mm-l">Home</div>', '<div class="mm-l mm-l-on">Home</div>', 1))

replace_state('f-04-subheader', 0, 'height 96 · with a control — Standings', H_('f04_stand'))
relabel('f-04-subheader', 1, 'height 320 — the original (not used in the prototype)')
replace_state('f-04-subheader', 2, 'height 96 — Calendar', H_('f04_cal'))
replace_state('f-04-subheader', 3, 'height 56 — entity pages (player)', H_('f04_player'))
replace_state('f-04-subheader', 4, 'entity variant — conference page: F-04 + ctl-03 stop tabs', col(H_('f04_conf'), H_('tabs_conf'), gap=0))
add_state('f-04-subheader', state('height 56 · with a category control — team page', 'F-04-SubHeader--team', H_('f04_team')))
add_note('f-04-subheader', synced_note('Every height now draws the breadcrumb with el-23 (<code>.crumbs</code>), a 4px key-visual rule (<code>.f04-kv</code>) and one H1 class '
                                       '(<code>.f04-h1</code>); the height is set on the block (<code>.f04-96</code>, <code>.f04-56</code>). The control slot is <code>.f04-ctl</code>.'))

# F-07 HomeHero — new module
hero_states = (plain_state('in season — 2026 lockup, the road to the U23 World Cup', 'F-07-HomeHero--live', H_('hnl_live')) +
               plain_state('off season — same band, same lockup', 'F-07-HomeHero--off', H_('hnl_off')) +
               plain_state('pre season — 2027 lockup', 'F-07-HomeHero--pre', H_('hnl_pre')))
insert_section('f-04-subheader', new_m(
    'f-07-homehero', 'F-07 HomeHero',
    'The landing page band: a finished photo plate (<code>assets/hero-bg.png</code>, 1728×384 @2x, brand tint already in the image), two key-visual '
    'fragments, and the lockup — Nations League wordmark over the strapline, with one link. 192px tall at desktop. It carries no data, so it never waits for the feed.',
    hero_states, synced_note('Layers bottom to top: gradient ground → <code>.hnl-bg</code> (z0, <code>top:-50%;height:200%</code> so it stays centred at any band height) '
                             '→ <code>.hnl-kv</code> (z1) → <code>.hnl-in</code> (z2). On the page the plate moves with a clamped parallax (never more than half the slack, '
                             'so the ground never shows); here it is static.')),
    'modules-1', {'slug': 'f-07-homehero', 'title': 'F-07 HomeHero', 'desc': 'Landing page hero band — photo plate, key-visual fragments, lockup and one link.'})


def accs(h):
    out, i = [], 0
    for m in re.finditer(r'<div class="acc cut cut-m cut-out"', h):
        out.append(h[m.start():end_of(h, m.start())])
    return out


la = accs(live)
replace_state('s-01-liveconferenceaccordion', 0, 'today, live — the first conference opens by default', col(*la, gap=12))
lp, lf = accs(H_('live_past')), accs(H_('live_future'))
replace_state('s-01-liveconferenceaccordion', 1, 'another day selected — 10 Aug: the standings after that day’s stop', col(*lp, gap=12) if lp else col(*la[1:], gap=12))
replace_state('s-01-liveconferenceaccordion', 2, 'another day selected — 15 Aug', col(*lf, gap=12) if lf else col(*la[1:], gap=12))
drop_state('s-01-liveconferenceaccordion', 3)  # old "future" state — superseded above
set_purpose('s-01-liveconferenceaccordion',
            'The landing page answer to "what is happening right now", and to "what happened on the day I just picked". Only live conferences appear by default (LP-14), '
            'there is no game list (LP-15), and each row expands in place to the conference standings in WT columns — SEED, TOUR PTS and STOP 1–6 — '
            '(LP-16). The Men / Women switch sits on the caption line of the open panel, right-aligned against the table (review 19), and the panel ends with a link '
            'to the conference page.')
add_note('s-01-liveconferenceaccordion', synced_note('Panel anatomy: <code>.acc-capline</code> (caption + <code>.acc-gslot</code> with el-02 at size S) → '
                                                     '<code>.wt-scroll &gt; .wt-tbl.acc-tbl</code> → <code>.acc-actions</code> with View conference (<code>.acc-conf-lnk</code>) '
                                                     'and Follow this stop. The table is the same renderer as R-03.'))

add_state('s-03-calendarstrip', state('today live — the live day carries a red rule (landing page, as rendered)', 'S-03-CalendarStrip--live', W(pick(live, 's03wrap'), 958)), at=0)

gm = H_('games_sub', rows=8)
replace_state('s-04-gamelist', 0, 'default — a stop page, games grouped by day', pick(gm, 'games-tbl'))

replace_state('s-05-pools', 0, 'two pools of three — six-team stop', pick(H_('s05_sub'), 's05'))
edit('s-05-pools', lambda sec: sec.replace('<div style="display:flex;gap:12px"><div class="tip-anchor"', '<div class="s05-hn"><div class="tip-anchor"'))
add_note('s-05-pools', synced_note('The header figures sit in <code>.s05-hn</code>, whose labels take the row columns’ width (64px desktop, 56px phone) and put the info icon left of the label, '
                                   'so W–L, PF and PA stand over their figures. The advancing mark is an inset shadow, not a border.'))

cm = H_('cal_month')
cm = keep_first(cm, 'cal-mgroup', 1)
cm = keep_first(cm, 'cal-sh', 8)
replace_state('s-07-seasoncalendar', 0, 'view = month — default: one card per stop, newest month first', cm)
cd = H_('cal_day')
cd = keep_first(cd, 'cal-cardwrap', 0)
cd = keep_first(cd, 'acc cut', 2)
add_state('s-07-seasoncalendar', state('view = day — S-03 strip and the chosen day’s conferences', 'S-07-SeasonCalendar--day', cd), at=1)
set_purpose('s-07-seasoncalendar',
            'The Calendar page, in two views switched by a pair of el-14 Chips. Month is the default: one card per stop, grouped by month with the latest month first; '
            'a card is the E-03 card shape and links to the stop. Day keeps S-03 CalendarStrip and lists the chosen day’s conferences as S-01 accordions.')
add_note('s-07-seasoncalendar', synced_note('Card tail: Live badge while the stop runs, the winning federation for the selected gender once it is over, “Upcoming” before. '
                                            'Live cards carry the brand stroke, exactly like E-03. Hover lifts the card (e2 on the <code>.sh</code> wrapper — a clip-path surface cannot cast its own shadow).'))

co = H_('conf_overview')
add_state('s-09-overview', state('type = plain — the Conferences page, beside Find a team (no brand stroke)', 'S-09-Overview--plain', '<div class="cnf-head" style="display:block;width:644px;max-width:100%%">%s</div>' % pick(co, 's09')), at=2)

_n, _a, _b = sec_get('s-11-stopmatrix')
_old = re.search(r'el-purpose">(.*?)</div>', pages[_n][_a:_b], re.S).group(1)
set_purpose('s-11-stopmatrix', '<b>Retired from the prototype in review 18 (3 Sep 2026).</b> Once the WT columns (STOP 1–6) joined the conference standings, '
            'this matrix was a subset of R-03 and the Stops tab went with it. Kept for the record. ' + _old)

# =====================================================================================
# MODULES 2 — ranking, entity, content
# =====================================================================================
r01 = drop(qs, 'el01-wrap')
replace_state('r-01-qualificationboard', 0, 'in-season — compact, landing page right column', '<div class="tpl-colR col-3" style="width:331px;max-width:100%%">%s</div>' % r01)
edit('r-01-qualificationboard', lambda sec: sec.replace('R-01 has no Men / Women control of its own.', 'R-01 had no Men / Women control of its own (superseded — see below).'))
add_note('r-01-qualificationboard', synced_note('The landing page board is the compact form (<code>.r01-compact</code>): position, el-13 at size XS (code only), el-05 at size mini. '
                                                'It now carries its own el-02 switch above the rows (<code>.r01-ctl</code>), because the landing page has no F-04 control slot, '
                                                'and ends with a link to the full table (<code>.r01-foot</code>). Twenty rows; the list is capped (<code>.is-capped</code>).'))

st = H_('stand_sub', rows=10)
replace_state('r-02-standingstable', 0, 'default — the full field, ranked and sortable; filter, export and legend in the table bar', st)
stq = H_('stand_q_sub', rows=10)
# state 4 of the original lives inside the old note (a nesting slip in the source page) — drop it,
# drop the two property demos the single table replaced, and the note that described two views.
drop_state('r-02-standingstable', 4)
drop_state('r-02-standingstable', 2)
drop_state('r-02-standingstable', 1)
edit('r-02-standingstable', lambda sec: drop(sec, 'el-note'))
add_state('r-02-standingstable', state('qualification only — ctl-08 ToggleSwitch on (in the filter drawer)', 'R-02-StandingsTable--qualification-only', stq))
add_note('r-02-standingstable', synced_note('One table, ranked by default. SEED sits next to the federation and is left-aligned. The table bar is '
                                            'el-33 FilterDrawer (zone and conference selects, Qualification only) · ctl-01 Export · el-09 Legend on top. '
                                            'U23 and U21 sites rank separately; Q / S / N markers only apply on the U23 ladder, a U21 row shows “—”.'))

replace_state('r-03-conferencestandings', 0, 'default — WT columns, legend in the section header', r03)
add_note('r-03-conferencestandings', synced_note('The conference Overview table is the WT renderer: POS · FEDERATION (flag + code; the name is the row title) · SEED · TOUR PTS · '
                                                 'STOP 1–6 · W% · PTS AVG · STATUS. Stops that have not started are dashes, never zeros.'))

replace_state('r-05-statleaderboard', 0, 'players — Stats page, Players tab', H_('stats_players', rows=10))
stt = H_('stats_teams', rows=10)
add_state('r-05-statleaderboard', state('teams — Stats page, Teams tab: WT columns plus SEED, POINTS and the conference on a second line',
                                        'R-05-StatLeaderboard--teams', col(H_('st_tabs'), H_('stats_filter'), stt, gap=24)), at=1)

fi = H_('finder')
replace_state('e-01-teamfinder', 0, 'default', fi)
edit('e-01-teamfinder', lambda sec: drop(sec, 'finder-count'))
add_note('e-01-teamfinder', synced_note('The nations / team-sites count came out (review 18b). Results are team sites, matched on word prefixes of name, IOC code and host city, up to twelve.'))

set_purpose('e-02-conferenceheader', '<b>Replaced in review 18.</b> Conference and stop pages no longer use a header block of their own: they compose F-04 SubHeader, '
            'the ctl-03 stop tabs and — on the conference Overview — S-02 StopTimeline. The two compositions are shown first; the original block follows for reference.')
add_state('e-02-conferenceheader', state('current — conference page', 'E-02-ConferenceHeader--now-conf', col(H_('f04_conf'), H_('tabs_conf'), H_('s02_conf'), gap=16)), at=0)
add_state('e-02-conferenceheader', state('current — stop page', 'E-02-ConferenceHeader--now-stop', col(H_('f04_stop'), H_('tabs_stop'), H_('stop_idl'), gap=16)), at=1)


def e03_trim(h):
    return keep_first(h, 'sh e03-sh', 6)


replace_state('e-03-conferencegrid', 0, 'default — filter drawer above a flat grid; live conferences carry the brand stroke',
              col(H_('cnf_bar'), e03_trim(H_('e03')), gap=16))
replace_state('e-03-conferencegrid', 1, 'pre-season', e03_trim(H_('e03_pre')))
add_note('e-03-conferencegrid', synced_note('The region captions went: the grid is flat and filtered by the drawer. A card is name + status, StopDots with “n of 6 stops”, '
                                            'and the federations as el-13 static tags. A card whose stop is live links straight to the stop page.'))

replace_state('e-04-teamheader', 2, 'in the race', H_('e04'))
fo = H_('fed_ov')
insert_section('e-04-teamheader', new_m(
    'e-12-federationoverview', 'E-12 FederationOverview',
    'The team page with All selected: one card per category the federation could enter — U23 Men, U23 Women, U21 Men, U21 Women — each naming its conference, '
    'its tour points and status, and linking to that team site. A category the federation did not enter keeps its place as “No side entered”, '
    'so the four cards always read in the same order.',
    plain_state('All selected — team page', 'E-12-FederationOverview--default', col(H_('f04_team'), H_('e04'), fo, gap=24)),
    synced_note('The control is el-02 in its category form (<code>.el02-quad</code>) with an <b>All</b> segment first and selected by default. '
                'E-04’s six figures switch to federation totals on All; “Qualified (U23) 0 of 2” counts U23 team sites. '
                'Cards are cut surfaces with <code>position:relative</code> — without it the <code>.cutfill</code> layers stack on the grid instead of the card.')),
    'modules-2', {'slug': 'e-12-federationoverview', 'title': 'E-12 FederationOverview', 'desc': 'Team page with All selected — one card per category, each linking to its team site.'})

ts = keep_first(H_('teams_sub'), 'e09-cell', 18)
replace_state('e-09-federationdirectory', 0, 'default', ts)
ta = keep_first(H_('teams_af'), 'e09-cell', 18)
replace_state('e-09-federationdirectory', 1, 'filtered by region — Africa', ta)

sc = H_('e10_scorers')
sc = drop(sc, 'el01-wrap')
add_state('e-10-rostergrid', state('view = leading scorers — conference Overview: the top players of the conference as E-08 cards', 'E-10-RosterGrid--scorers', sc), at=0)

replace_state('c-06-contentpage', 0, 'default — with a video section', H_('c06'))

for sid in ('c-02-newsrail', 'c-04-newslist'):
    add_note(sid, synced_note('Images are real <code>&lt;img class="ph-img"&gt;</code> inside a <code>.ph-zoom</code> frame, not backgrounds, so they can zoom on hover '
                              '(<code>scale(1.06)</code>, <code>--dur-slow</code>, <code>--ease-out</code>); a broken image removes itself instead of leaving an icon.'))

# off / pre season modules
ch = H_('champs_sub')
insert_section('r-05-statleaderboard', new_m(
    'r-06-seasonchampions', 'R-06 SeasonChampions',
    'Off season, landing page: who goes to the U23 World Cup. One card per conference with its winning federation for each gender — the block that replaces '
    'R-01 once the race is over.',
    plain_state('off season — men', 'R-06-SeasonChampions--default', drop(ch, 'el01-wrap')),
    synced_note('Cards are cut surfaces with a stroke drawn by the el-00 two-layer method (border colour as background, <code>.cutfill</code> as face), '
                'so the 45° corners keep their line. A conference without a result shows “No champion yet”.')),
    'modules-2', {'slug': 'r-06-seasonchampions', 'title': 'R-06 SeasonChampions', 'desc': 'Off-season landing block — conference winners going to the U23 World Cup.'})

gs = H_('gen_sub')
gs = drop(gs, 'el01-wrap')
gs = keep_first(gs, 'os-genrow', 1)
gs = keep_first(gs, 'os-genrow-lab', 1)
gs = keep_first(gs, 'pcard-sh', 6)
insert_section('e-10-rostergrid', new_m(
    'e-13-nextgeneration', 'E-13 NextGeneration',
    'Pre season, landing page: “Meet the next generation” — E-08 PlayerCards in a six-column row, one row per gender. It fills the space the live blocks leave '
    'empty before the first stop, with the players fans will be following.',
    plain_state('pre season — men’s row', 'E-13-NextGeneration--default', gs),
    synced_note('Cards are cloned from one E-08 template (<code>&lt;template id="nl-pcard"&gt;</code>) so the figures are filled by the same painter as everywhere else.')),
    'modules-2', {'slug': 'e-13-nextgeneration', 'title': 'E-13 NextGeneration', 'desc': 'Pre-season landing block — six E-08 player cards per gender.'})

cta = H_('cta_off')
insert_section('c-06-contentpage', new_m(
    'c-07-signupcta', 'C-07 SignupCTA',
    '“Be first to know” — the one ask on an off- or pre-season landing page: a headline, one line of copy and an e-mail field with a button. '
    'No other module asks for anything.',
    plain_state('default — off and pre season', 'C-07-SignupCTA--default', cta),
    synced_note('The field is a ctl-04 input inside <code>.live</code>; style it with two classes (<code>.os-cta-row .os-cta-in</code>) — '
                'behaviour.css’s <code>.live input</code> rule otherwise wins on background and colour.')),
    'modules-2', {'slug': 'c-07-signupcta', 'title': 'C-07 SignupCTA', 'desc': 'Off/pre-season e-mail sign-up block.'})

win = H_('winners_sub')
insert_section('c-07-signupcta', new_m(
    'c-08-winners', 'C-08 Winners',
    'Off season, landing page: the season told in prize-ceremony photos — one photo per federation going to the World Cup, newest stop first. '
    'It is C-03 PhotoGallery with a different set, not a component of its own.',
    plain_state('off season', 'C-08-Winners--default', drop(win, 'el01-wrap')),
    synced_note('Three slides per view from 1100px: <code>.car-slide{width:calc((100% - 16px)/3)}</code>. The indicator counts positions, not slides.')),
    'modules-2', {'slug': 'c-08-winners', 'title': 'C-08 Winners', 'desc': 'Off-season landing gallery — one prize-ceremony photo per qualified federation.'})

# ---------- write ----------
for n, s in pages.items():
    open(P + n + '.html', 'w').write(s)
for g in nav:
    for it in g['items']:
        it.pop('sync', None)
json.dump(nav, open(ROOT + '/system/nav.json', 'w'), indent=1, ensure_ascii=False)
print('ok')

# ---------- shell: link the CSS the specimens now rely on ----------
ix = ROOT + '/system/index.html'
s = open(ix).read()
# review16–21 were never linked into the DS shell (it jumped from review15 to review22)
if '../assets/review16.css' not in s:
    a = re.search(r'<link rel="stylesheet" href="\.\./assets/review15\.css[^"]*">\n', s)
    s = s[:a.end()] + ''.join('<link rel="stylesheet" href="../assets/review%d.css?v=1">\n' % n for n in range(16, 22)) + s[a.end():]
# site.css: the page builder's own rules (nav-a wrappers, .sr-only, .tpl-sub gap, f03 More/search, e03 stroke,
# e10 row, r01 row…) — harvested specimens carry that markup, so the DS loads it in the page's position
if '../assets/site.css' not in s:
    a = re.search(r'<link rel="stylesheet" href="\.\./assets/behaviour\.css[^"]*">\n', s)
    s = s[:a.end()] + '<link rel="stylesheet" href="../assets/site.css?v=1">\n' + s[a.end():]
if '../assets/hero.css' not in s:
    a = re.search(r'<link rel="stylesheet" href="\.\./assets/review23\.css[^"]*">\n', s)
    s = s[:a.end()] + '<link rel="stylesheet" href="../assets/hero.css?v=1">\n' + s[a.end():]
    open(ix, 'w').write(s)

# ---------- docs.css: specimen-only scaffolding for the hero (on the page it is gated by body.hero-nl) ----------
dc = ROOT + '/system/assets/docs.css'
s = open(dc).read()
if '/* p35 hero specimen */' not in s:
    s += """
/* p35 hero specimen — on the page .hnl only shows under body.hero-nl (review3.css); the DS has no such body class */
.m-frame .hnl {
  position: relative; display: block; width: 100%; height: var(--hero-nl-h, 192px); overflow: hidden;
  background: linear-gradient(102deg, var(--hero-from) 0%, var(--hero-to) 100%);
}
.m-frame:has(> .hnl) { padding: 0; }
"""
    open(dc, 'w').write(s)

# ---------- shell.css: give back the column widths the fluid override takes away ----------
# `.stage [class]{max-width:100%}` (0,2,0, last in the cascade) makes every fixed 1440 container fluid, but it
# also erases the column max-widths of the filter row (search = 6 columns, select = 2). Restore those two.
sh = ROOT + '/system/assets/shell.css'
s = open(sh).read()
if '/* p35 column widths */' not in s:
    s += """
/* p35 column widths — restore what `.stage [class]` overrides for the filter row */
.stage .rowsplit > .search { max-width: var(--col-6); }
.stage .selwrap { max-width: var(--col-2); }
"""
    open(sh, 'w').write(s)
