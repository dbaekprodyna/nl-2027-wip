/* ============================================================
   FIBA 3x3 Nations League — site.js
   Fills the approved templates with the real 2026 season.

   The markup is the design, untouched. This finds each module in
   the page and rewrites its rows from assets/data/*.json, so a
   change to the design system shows up here without edits.

   Routing is by query string: conference.html?id=africa-east,
   team.html?id=<uuid>, player.html?id=<uuid>.
   ============================================================ */
(function () {
  'use strict';

  var D = {};                                   /* the loaded data  */
  var qs = new URLSearchParams(location.search);

  /* ---------- small helpers -------------------------------- */
  /* Dates in this app are calendar days, not instants. toISOString()
     converts to UTC first, so east of Greenwich local midnight lands on
     the previous UTC day and every date shifts back by one — which is
     how the landing page's calendar strip ended up padding Oceania with
     a second 17 June. Format from the local fields instead, and do day
     arithmetic on those. */
  function isoDay(d) {
    return d.getFullYear() + '-' +
           ('0' + (d.getMonth() + 1)).slice(-2) + '-' +
           ('0' + d.getDate()).slice(-2);
  }
  function shiftDay(dayISO, delta) {
    var d = new Date(dayISO + 'T00:00:00');
    d.setDate(d.getDate() + delta);
    return isoDay(d);
  }

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return [].slice.call((root || document).querySelectorAll(sel)); }

  function text(node, sel, value) {
    var el = sel ? $(sel, node) : node;
    if (el && value != null && value !== '') el.textContent = value;
    return el;
  }

  /* Repeat the first matching row once per record, then paint each. */
  function repeat(root, sel, records, paint) {
    var rows = $$(sel, root);
    if (!rows.length || !records || !records.length) return 0;
    var proto = rows[0].cloneNode(true);
    for (var i = 1; i < rows.length; i++) rows[i].remove();
    var frag = document.createDocumentFragment();
    records.forEach(function (rec, i) {
      var n = proto.cloneNode(true);
      paint(n, rec, i);
      frag.appendChild(n);
    });
    rows[0].replaceWith(frag);
    return records.length;
  }

  /* The specimen carries an inline SVG flag; swap in the real one. */
  function flag(node, ioc) {
    if (!ioc || !node) return;
    /* Never walk the whole document: a page-wide call would repaint every
       flag on the page with one country, which is what happened to the
       results table and the game log. */
    /* E-08 PlayerCard holds its flag in .pcard-flagbox rather than a
       .flag box, so the card kept whichever federation the specimen was
       built with. */
    var targets = node.classList && (node.classList.contains('flag') ||
                                     node.classList.contains('pcard-flagbox'))
      ? [node] : $$('.flag, .pcard-flagbox', node);
    targets.forEach(function (f) {
      /* Replace the flag artwork only. E-08's flag box also holds the
         IOC code, and clearing the box took the code with it. */
      $$('svg, img', f).forEach(function (n) { n.remove(); });
      var img = document.createElement('img');
      img.src = 'assets/flags/' + ioc + '.svg';
      img.alt = ioc;
      img.width = 24; img.height = 24;
      img.style.width = '100%'; img.style.height = '100%';
      img.onerror = function () { f.style.background = 'var(--surface-sunken-2)'; img.remove(); };
      f.insertBefore(img, f.firstChild);
    });
  }

  function fed(node, ioc, name) {
    flag(node, ioc);
    text(node, '.ftag-code', ioc);
    text(node, '.ftag-name', name);
  }

  /* el-23 Breadcrumb. Pages that carry an entity in the trail were
     leaving the specimen's text in place, so a team page opened from any
     federation still read "Home / Teams / Serbia" and a stop page kept
     whichever conference the specimen was built with. Every page states
     its own trail now. */
  function crumbs(items) {
    var host = $('.crumbs') || $('.f04-crumbs');
    if (!host) return;
    var sep = $('.crumb-sep', host);
    var sepHTML = sep ? sep.outerHTML : ' / ';
    host.innerHTML = items.map(function (it, i) {
      var last = i === items.length - 1;
      var span = '<span class="crumb' + (last ? ' crumb-cur' : '') + '">' +
                 (it.label || '') + '</span>';
      return (!last && it.href)
        ? '<a class="nav-a" href="' + it.href + '">' + span + '</a>'
        : span;
    }).join(sepHTML);
  }

  function link(node, href) {
    if (!href) return;
    node.setAttribute('data-href', href);
    node.addEventListener('click', function (e) {
      if (e.target.closest('a')) return;
      location.href = href;
    });
  }

  /* The snapshot repeats the city when the feed's city and region are
     the same string — "Riga, Riga". Collapse repeated segments once,
     here, rather than in every place a city is printed. */
  function cityOf(e) {
    var out = [];
    String((e && e.city) || '').split(',').forEach(function (s) {
      s = s.trim();
      if (s && out.indexOf(s) === -1) out.push(s);
    });
    return out.join(', ');
  }

  function ordinal(n) {
    if (!n) return '—';
    var s = ['th', 'st', 'nd', 'rd'], v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }

  function fmtDate(iso, opts) {
    if (!iso) return '';
    var d = new Date(iso + (iso.length === 10 ? 'T00:00:00' : ''));
    return d.toLocaleDateString('en-GB', opts || { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function img(url, w, ar) {
    if (!url) return url;
    if (url.indexOf('res.cloudinary.com') === -1) return url;
    return url.replace(/\/ar_[^/]+\/w_\d+,c_lfill\//,
                       '/ar_' + (ar || '3:2') + ',c_lfill,g_auto/w_' + (w || 960) + ',c_lfill/');
  }

  /* Paint a picture placeholder with a real photograph. */
  /* Review 20 — a news photograph zooms under the pointer, the way
     the World Tour prototype's video thumbnails do. A background
     image cannot do it: background-size does not interpolate from
     the `cover` keyword, so there is nothing to transition. A photo
     that has to move is an <img> inside a clipping box instead, and
     the box is the same box it always was. */
  function photo(node, url, zoom) {
    if (!node || !url) return;
    if (zoom) {
      node.classList.add('ph-zoom');
      var im = $('img.ph-img', node);
      if (!im) {
        im = document.createElement('img');
        im.className = 'ph-img';
        im.alt = '';
        /* A background image that 404s leaves the box empty; an <img>
           that 404s leaves a broken-image mark in it. The box is the
           fallback, so the picture takes itself out rather than
           showing that it failed. */
        im.addEventListener('error', function () { im.remove(); });
        node.insertBefore(im, node.firstChild);
      }
      if (im.getAttribute('src') !== url) im.setAttribute('src', url);
    } else {
      node.style.backgroundImage = 'url("' + url + '")';
      node.style.backgroundSize = 'cover';
      node.style.backgroundPosition = 'center';
    }
    $$('.t-caption', node).forEach(function (c) { c.style.display = 'none'; });
  }

  /* ---------- lookups -------------------------------------- */
  function conf(id) { return D.conferences.filter(function (c) { return c.id === id; })[0]; }

  /* Review 10: the federation a player represents, from the code on
     his shirt. players.json's `country` is his residence and the two
     disagree for 73 players in the season. */
  function nationOf(ioc) {
    if (!ioc || !D.teams) return '';
    var t = D.teams.filter(function (x) { return x.ioc === ioc; })[0];
    return t ? cleanTeam(t.name) : '';
  }
  function stop(slug) { return D.events.filter(function (e) { return e.slug === slug; })[0]; }
  /* Whether a stop has been played is a fact about the calendar, not
     about how far the snapshot got. Deriving it from the presence of a
     standings record made every conference read "1 of 6 stops", because
     the snapshot only walked each conference's first stop — the season
     itself is six deep almost everywhere. Date is the single source of
     truth; results fill in behind it. */
  function stopEnd(e) { return e.end || e.start; }
  function stopPlayed(e, today) {
    return !!e.start && stopEnd(e) < (today || isoDay(new Date()));
  }
  function stopLive(e, today) {
    var t = today || isoDay(new Date());
    return !!e.start && e.start <= t && stopEnd(e) >= t;
  }
  function playedStops() {
    var t = isoDay(new Date());
    return D.events.filter(function (e) { return stopPlayed(e, t); });
  }
  /* Stops of one conference, in order, and how many of them are done. */
  function stopsOfConference(id) {
    return D.events.filter(function (e) { return e.conference === id; })
                   .sort(function (a, b) { return (a.number || 0) - (b.number || 0); });
  }
  function playedCount(id, uptoISO) {
    var t = uptoISO || isoDay(new Date());
    return stopsOfConference(id).filter(function (e) { return stopPlayed(e, t); }).length;
  }
  /* Two stops in the snapshot arrive without a gender label — the
     feed's category name came through empty — so a gendered lookup
     found nothing and the conference table rendered blank. Prefer the
     labelled record, fall back to the unlabelled one. */
  function standingsFor(slug, gender) {
    var all = D.standings.filter(function (s) { return s.stop === slug; });
    if (!gender) return all[0];
    return all.filter(function (s) { return s.gender === gender; })[0] ||
           all.filter(function (s) { return !s.gender; })[0];
  }
  function teamsFor(slug, gender) {
    return D.teams.filter(function (t) {
      return t.stop === slug && (!gender || t.gender === gender);
    });
  }
  function player(id) { return D.playersById[id]; }
  function gamesFor(slug, gender) {
    return D.games.filter(function (g) {
      return g.stop === slug && (!gender || g.gender === gender);
    });
  }

  /* One game row: time, home, score, away, pool, status. */
  function paintGame(row, g) {
    var cells = $$('.cell', row);
    text(row, '.cell-time .t-data-m', (g.start || '').slice(11, 16));
    var home = $('.cell-home', row), away = $('.cell-away', row);
    /* A final whose two sides are not decided yet arrives with no IOC
       code on either team. fed() cannot repaint an empty code, so the
       row kept whichever federations the specimen was built with — the
       cell says what it is instead. */
    [[home, g.home], [away, g.away]].forEach(function (t) {
      if (!t[0]) return;
      var tag = t[0].querySelector('.ftag') || t[0];
      if (t[1].ioc) {
        tag.classList.remove('ftag-tbd');
        var fl = t[0].querySelector('.flag');
        if (fl) fl.hidden = false;
        var c0 = t[0].querySelector('.ftag-code');
        if (c0) c0.hidden = false;
        fed(t[0], t[1].ioc, t[1].name);
      } else {
        tag.classList.add('ftag-tbd');
        var fl2 = t[0].querySelector('.flag');
        if (fl2) fl2.hidden = true;
        var code = t[0].querySelector('.ftag-code');
        if (code) code.hidden = true;
        text(t[0], '.ftag-name', 'To be decided');
      }
    });
    var pts = $$('.gpts', row);
    if (pts[0]) pts[0].textContent = g.home.score != null ? g.home.score : '–';
    if (pts[1]) pts[1].textContent = g.away.score != null ? g.away.score : '–';
    if (pts.length === 2 && g.home.score != null && g.away.score != null) {
      pts[g.home.score >= g.away.score ? 1 : 0].classList.add('gdim');
      pts[g.home.score >= g.away.score ? 0 : 1].classList.remove('gdim');
    }
    text(row, '.cell-pool .t-body-s, .cell-pool .t-label', g.pool);
    var st = $('.cell-gamestatus .badge .lbl, .cell-gamestatus .t-caption', row);
    if (st) st.textContent = (g.home.score != null ? 'Final' : 'Upcoming');
    /* Box score opens the game page — the row itself too, so the whole
       line is the target rather than six words at the end of it. */
    var href = 'game.html?id=' + g.id;
    var box = $('.cell-boxscore, .c-box', row);
    if (box) {
      var l = $('.lnk', box) || box;
      l.setAttribute('role', 'link');
      link(l, href);
      text(box, '.lnk .lbl', g.home.score != null ? 'Box score' : 'Preview');
    }
    link(row, href);
    row.classList.remove('is-placeholder');
  }

  /* Twenty places at the U23 World Cup: the host takes one, nineteen
     come through the league. The feed carries no qualification flag, so
     the field is derived from tour points — the leading twelve read as
     Qualified, the next eight as Shortlisted, everyone else as Not
     qualified. Derived in one place so the landing page, the Standings
     table and the Qualification view cannot disagree. */
  var QUALIFIED = 12, FIELD = 20;

  /* A season-wide federation table, built from every stop we have.
     Tour points are the ranking measure — the column has always been
     labelled Tour Points, but it was being filled with the basketball
     points a team scored, which ranked the table by offence. */
  /* Review 18 — SEEDING, and the row a season table is made of.

     Seeding first. Alex: the seed is stated wherever a federation is
     named — Federation Overview, a team page, Standings, Statistics.
     teams.json has no `seed` field yet (Rob's data is pending), so
     every reader of the value goes through seedOf(): when the field
     lands, this one line reads it and four tables fill in at once.
     A seed belongs to a team site, not to a federation — a side
     seeded 3 in Europe-1 U23 is not seeded 3 in U21 Europe-1 — so it
     is looked up by the site and never by the IOC code alone. */
  function seedOf(site) {
    if (!site) return null;
    var v = site.seed;
    if (v == null || v === '') return null;
    var n = +v;
    return isNaN(n) ? v : n;
  }
  function siteRecord(ioc, confId, gender) {
    var g = gender || 'men';
    return D.teams.filter(function (t) {
      return t.ioc === ioc && t.conference === confId && (t.gender || 'men') === g;
    })[0] || D.teams.filter(function (t) {
      return t.ioc === ioc && t.conference === confId;
    })[0] || null;
  }
  function seedOfSite(ioc, confId, gender) {
    var rec = siteRecord(ioc, confId, gender);
    var stated = seedOf(rec);
    if (stated != null) return stated;
    return derivedSeed(ioc, confId, gender, rec);
  }

  /* Review 18 (second pass) — Daniel: "find the seeding for every
     team and put it in."

     There is no seed field to find. The snapshot's tourTeams,
     teamRankings and qualifications collections are all empty and no
     record anywhere carries the word. What it does carry is the thing
     a seed is made of: every player's FIBA 3x3 ranking points, on 709
     of the 711 players in the season. A 3x3 team is ranked by the sum
     of its three highest-ranked players and a conference seeds its
     field by that ranking — so the seed is derived here rather than
     invented, and derived per team site, because a federation's U23
     and U21 squads are different players.

     Every reader still goes through seedOf(): the moment teams.json
     gains a `seed`, the stated value wins and this stops being
     consulted. A conference whose squads carry no ranking points at
     all (two of forty-two) keeps its em dash rather than being given
     a made-up number. */
  var SEED_IDX = null;
  function squadPoints(t) {
    return (t.roster || [])
      .map(function (m) {
        var p = D.playersById && D.playersById[m.id];
        return (p && p.rankingPoints) || 0;
      })
      .sort(function (a, b) { return b - a; })
      .slice(0, 3)
      .reduce(function (a, b) { return a + b; }, 0);
  }
  function seedIndex() {
    if (SEED_IDX) return SEED_IDX;
    var by = {};
    teamSites().forEach(function (t) {
      var k = t.conference + '|' + (t.gender || 'men') + '|' + rowCat(t.conference, t.name);
      (by[k] = by[k] || []).push({ ioc: t.ioc, pts: squadPoints(t) });
    });
    SEED_IDX = {};
    Object.keys(by).forEach(function (k) {
      var rows = by[k].sort(function (a, b) { return b.pts - a.pts; });
      if (!rows.length || !rows[0].pts) return;      /* nothing to rank on */
      rows.forEach(function (r, i) { SEED_IDX[k + '|' + r.ioc] = i + 1; });
    });
    return SEED_IDX;
  }
  function derivedSeed(ioc, confId, gender, rec) {
    if (!D.teams || !D.playersById) return null;
    var cat = rowCat(confId, rec && rec.name);
    var v = seedIndex()[confId + '|' + (gender || 'men') + '|' + cat + '|' + ioc];
    return v == null ? null : v;
  }
  /* One formatter, so a missing seed reads the same everywhere and
     nobody is tempted to leave a column out until the data arrives. */
  function seedText(v) { return (v == null) ? '\u2014' : v; }

  /* A season-wide table, one row per TEAM SITE — a federation in a
     conference in a gender, which is what a stop standings row
     actually belongs to.

     It used to group by IOC code alone, and 33 of the 68 federations
     play two conferences: 26 field a U21 side as well as a U23 one,
     and 7 appear in two U23 conferences (KEN in Africa East and
     Africa North, CAN in both Americas). Their two schedules were
     added together — which is where "12 events" in a six-stop season
     came from — and the Conference column could name only whichever
     of the two the feed listed last. The row is the team site now;
     a federation total is made by adding sites up, in the one place
     that wants a federation total. */
  function siteTable(gender, opts) {
    opts = opts || {};
    /* Review 18 — the season so far, not the whole file. The snapshot
       carries results for stops that have not been played yet on the
       day the site is showing, and with every stop now a column of
       its own the contradiction is on screen: a conference reading
       "3 of 6 stops" under six filled columns. A stop counts once it
       has started; everything after today is blank. */
    var upto = opts.uptoISO || isoDay(new Date());
    var by = {};
    D.standings.forEach(function (s) {
      if (gender && s.gender && s.gender !== gender) return;
      var e = stop(s.stop);
      if (e && (!e.start || e.start > upto)) return;
      var c = conf(s.conference);
      s.rows.forEach(function (r) {
        if (!r.ioc) return;
        var g = s.gender || 'men';
        var cat = rowCat(s.conference, r.team);
        var k = r.ioc + '|' + s.conference + '|' + g + '|' + cat;
        var t = by[k] = by[k] || {
          key: k, ioc: r.ioc, team: cleanTeam(r.team),
          conference: s.conference, gender: g,
          cat: cat, confname: confLabel(c, cat), zone: regionOf(c),
          played: 0, won: 0, scored: 0, tour: 0, stops: 0, stopRank: {}
        };
        t.played += r.played || 0;
        t.won += r.won || 0;
        t.scored += r.points || 0;
        t.tour += tourPoints(r.rank);
        t.stops += 1;
        if (e && e.number) {
          t.stopRank[e.number] = { rank: r.rank || null, pts: tourPoints(r.rank) };
        }
      });
    });
    var list = Object.keys(by).map(function (k) { return by[k]; });
    if (opts.cat) list = list.filter(function (t) { return t.cat === opts.cat; });
    if (opts.conference) list = list.filter(function (t) { return t.conference === opts.conference; });
    list.forEach(function (t) {
      t.winRatio = t.played ? t.won / t.played : 0;
      t.avg = t.played ? Math.round((t.scored / t.played) * 10) / 10 : 0;
      t.seed = seedOfSite(t.ioc, t.conference, t.gender);
      t.seedSort = (t.seed == null) ? 9999 : t.seed;
      t.label = t.team + ' \u00b7 ' + t.cat + ' ' +
                (t.gender === 'women' ? 'Women' : 'Men');
    });
    /* Ranked inside its own category, because U23 and U21 are two
       competitions and a position that mixed them would mean nothing.
       Q and S are set on the U23 ladder only: the field they name is
       the U23 World Cup, which a U21 side is not playing for. */
    var ORDER = { q: 0, s: 1, n: 2 };
    ['U23', 'U21'].forEach(function (cat) {
      list.filter(function (t) { return t.cat === cat; })
          .sort(function (a, b) { return b.tour - a.tour || b.winRatio - a.winRatio; })
          .forEach(function (t, i) {
            t.rank = i + 1;
            t.catRank = (cat === 'U23') ? 0 : 1;
            t.status = (cat === 'U23')
              ? (i < QUALIFIED ? 'q' : (i < FIELD ? 's' : 'n')) : '';
            t.statusRank = ORDER[t.status] != null ? ORDER[t.status] : 3;
            /* One sortable key that says "U23 ladder, then U21
               ladder" — the table's resting order, and the one the
               Position column is counting. */
            t.order = t.catRank * 1000 + t.rank;
          });
    });
    list.sort(function (a, b) { return a.catRank - b.catRank || a.rank - b.rank; });
    return list;
  }

  /* Every site one federation fields, added up. This is the only
     place a sum across conferences is the right answer, and it is
     what a Federation Overview states. */
  function fedTotals(ioc, gender, cat) {
    var mine = siteTable(gender, cat ? { cat: cat } : null)
      .filter(function (t) { return t.ioc === ioc; });
    var tot = { ioc: ioc, sites: mine, played: 0, won: 0, scored: 0, tour: 0, stops: 0 };
    mine.forEach(function (t) {
      tot.played += t.played; tot.won += t.won;
      tot.scored += t.scored; tot.tour += t.tour; tot.stops += t.stops;
    });
    tot.winRatio = tot.played ? tot.won / tot.played : 0;
    tot.avg = tot.played ? Math.round((tot.scored / tot.played) * 10) / 10 : 0;
    tot.best = mine.slice().sort(function (a, b) { return b.tour - a.tour; })[0] || null;
    return tot;
  }

  /* federationTable() keeps its name and every caller it had; what
     changed is what a row is. Standings, Statistics, the team page
     and the qualification board all read these rows, so a
     federation's numbers cannot disagree between two pages. */
  function federationTable(gender, cat) {
    return siteTable(gender, cat ? { cat: cat } : null);
  }

  /* el-05 StatusBadge as a table marker. */
  function marker(row, code) {
    var mk = $('.cell-status .marker', row);
    if (!mk) return;
    ['q', 's', 'r', 'n'].forEach(function (c) {
      mk.classList.remove('marker-' + c, 'el-05-StatusBadge--marker-' + c);
    });
    /* Review 18 — a U21 side has no Q/S/N: the field those letters
       name is the U23 World Cup. An em dash says so; a letter would
       be an answer to a question nobody asked. */
    if (!code) {
      mk.classList.add('marker-none');
      $('.lbl', mk) ? ($('.lbl', mk).textContent = '\u2014') : (mk.textContent = '\u2014');
      return;
    }
    mk.classList.remove('marker-none');
    mk.classList.add('marker-' + code, 'el-05-StatusBadge--marker-' + code);
    text(mk, '.lbl', code.toUpperCase());
  }

  /* el-08 TableHeaderRow: the sort arrow and the cell-sorted class were
     painted into the specimen but nothing was wired, so the header
     looked like a control and behaved like a label. */
  /* Review 15 — the World Tour states a win ratio as a
     percentage and Alex asked the league to read the same way.
     One formatter, so the figure is identical on every page. */
  function pctRatio(v) {
    return (v == null || isNaN(v)) ? '\u2014' : Math.round(v * 100) + '%';
  }
  function cmp(key, dir) {
    return function (a, b) {
      var x = a[key], y = b[key];
      var r = (typeof x === 'string' || typeof y === 'string')
        ? String(x || '').localeCompare(String(y || ''))
        : (x || 0) - (y || 0);
      return r * dir;
    };
  }
  function sortable(tbl, cols, state, onSort) {
    $$('.thead .cell-sortable', tbl).forEach(function (cell) {
      var key = null, text0 = null;
      Object.keys(cols).forEach(function (c) {
        if (cell.classList.contains(c)) { key = cols[c].key; text0 = cols[c].text; }
      });
      if (!key) return;
      function paint() {
        $$('.thead .cell-sortable', tbl).forEach(function (c) {
          c.classList.remove('cell-sorted');
          var s = c.querySelector('svg');
          if (s) s.style.transform = '';
        });
        cell.classList.add('cell-sorted');
        var s = cell.querySelector('svg');
        if (s) s.style.transform = state.dir > 0 ? 'rotate(180deg)' : '';
      }
      cell.onclick = function () {
        var first = text0 ? 1 : -1;          /* names A→Z, numbers high first */
        state.dir = (state.key === key) ? -state.dir : first;
        state.key = key;
        paint();
        onSort();
      };
      if (state.key === key) paint();
    });
  }

  /* ---------- conference standings ---------------------------
     One implementation, used by the landing page accordion and by the
     conference page. Both were painting by column index, which put the
     win ratio under Pts Average and the points scored under Tour
     Points; every cell is now addressed by its own class.             */

  /* NM-01: the age category is part of the conference name and it goes
     after it. U23 is the default, so the feed names only the U21
     conferences and does it as a prefix — "U21 Europe-2" — which is
     moved to the end here. */
  function confName(c) {
    if (!c) return '';
    var m = /^U(\d\d)\s+(.+)$/.exec(c.name || '');
    return m ? m[2] + ' U' + m[1] : (c.name || '') + ' U23';
  }

  /* U23 or U21 — the age category is carried in the conference name and
     nowhere else, which is why no U23 column exists in the system. */
  function shortCat(c) { return /^U21\b/.test((c && c.name) || '') ? 'U21' : 'U23'; }

  /* Review 18 — the feed states the age category in two different
     places and shortCat() only knew one of them. Europe and Asia have
     conferences of their own for U21, named "U21 Europe-2"; Africa
     does not — its U21 sides sit inside the U23 conference and are
     marked by "(U21)" after the federation's name. Reading the
     conference alone labelled 24 African U21 rows U23 and offered
     them a place at the U23 World Cup. Read both. */
  /* Two spellings, because two regions filed it differently: Africa
     writes "Egypt (U21)" and the Americas write "Chile U21". Both are
     a suffix on the federation's name and both mean the same thing. */
  var CAT_SUFFIX = /\s*\(?\s*(U2[13])\s*\)?\s*$/i;
  function rowCat(confId, teamName) {
    var m = CAT_SUFFIX.exec(teamName || '');
    if (m) return m[1].toUpperCase();
    return /(^|-)u21(-|$)/.test(confId || '') ? 'U21' : 'U23';
  }
  /* The category is a column and a label of its own now, so it comes
     off the name it was appended to. */
  function cleanTeam(name) {
    return String(name || '').replace(CAT_SUFFIX, '').trim();
  }
  /* confName() always ends in the category the conference is named
     for; an African U21 row belongs to the same conference under the
     other category, and the label has to say so. */
  function confLabel(c, cat) {
    var base = confName(c);
    return cat ? base.replace(/\bU2[13]$/, cat) : base;
  }

  /* The feed's region field is not a region: Europe arrives as four
     separate values (Europe-1 … Europe-4) and every U21 conference
     arrives as "U21", which would collect the U21 conferences into a
     group of their own. Region is derived from the conference instead,
     so U21 Europe-2 sits under Europe with the rest of Europe — the
     way the wireframe grouped them. */
  var REGIONS = ['Europe', 'Americas', 'Africa', 'Oceania', 'AsiaPacific'];
  function regionOf(c) {
    var id = (c && c.id) || '';
    if (id.indexOf('africa') > -1) return 'Africa';
    if (id.indexOf('americas') > -1) return 'Americas';
    if (id.indexOf('europe') > -1) return 'Europe';
    if (id.indexOf('asia') > -1) return 'AsiaPacific';
    if (id.indexOf('pacific') > -1) return 'Oceania';
    return 'Other';
  }

  /* The feed carries the finishing order at each stop but no tour
     points, so the ladder is stated once, here, and nowhere else. */
  var TOUR = [100, 80, 70, 60, 50, 40, 30, 20, 10];
  function tourPoints(rank) {
    if (!rank) return 0;                     /* stop not finished yet */
    return TOUR[rank - 1] != null ? TOUR[rank - 1] : 10;
  }

  function conferenceTable(confId, gender, uptoISO) {
    /* Same rule as siteTable: a conference table states the stops
       that have started. Callers that browse a past day pass their
       own date; the rest get today. */
    var upto = uptoISO || isoDay(new Date());
    var by = {};
    D.events.forEach(function (e) {
      if (e.conference !== confId) return;
      if (!e.start || e.start > upto) return;
      var s = standingsFor(e.slug, gender);
      if (!s) return;
      s.rows.forEach(function (r) {
        if (!r.ioc) return;
        var t = by[r.ioc] = by[r.ioc] ||
          { ioc: r.ioc, team: cleanTeam(r.team), cat: rowCat(confId, r.team),
            conference: confId, gender: gender || 'men',
            played: 0, won: 0, pts: 0, tour: 0, stops: 0, stopRank: {} };
        t.played += r.played || 0;
        t.won += r.won || 0;
        t.pts += r.points || 0;
        t.tour += tourPoints(r.rank);
        t.stops += 1;
        /* Review 18 — the WT column set states every stop, so the
           finish at each one is kept here rather than looked up
           again per cell by every table that wants it. */
        if (e.number) t.stopRank[e.number] = { rank: r.rank || null, pts: tourPoints(r.rank) };
      });
    });
    var list = Object.keys(by).map(function (k) { return by[k]; });
    list.forEach(function (t) {
      t.winRatio = t.played ? t.won / t.played : 0;
      t.avg = t.played ? Math.round((t.pts / t.played) * 10) / 10 : 0;
      t.seed = seedOfSite(t.ioc, confId, gender);
      t.seedSort = (t.seed == null) ? 9999 : t.seed;
    });
    list.sort(function (a, b) { return b.tour - a.tour || b.winRatio - a.winRatio; });
    list.forEach(function (t, i) { t.rank = i + 1; });
    return list;
  }

  /* ---------- Review 18: the World Tour column set -------------
     Alex asked the league to read the way the World Tour reads:
     position, federation, tour points, then every stop with the
     finish above the points it paid, then win ratio, points average
     and status. Four tables were each drawing a different subset of
     that — the landing page accordion, the conference standings, the
     stop-by-stop matrix and the Statistics team table — so a reader
     comparing two pages was comparing two column sets.

     One builder, four callers. The federation cell keeps the flag
     and the IOC code and drops the country name: with six stop
     columns there is no room for it, and the name is on the row's
     title and one click away. */
  function wtStops(confId) {
    return stopsOfConference(confId);
  }
  /* A table that ranks across conferences cannot borrow one
     conference's stop list. Every conference runs the same six, so
     the columns are the season's stop numbers. */
  var SEASON_STOPS = null;
  function seasonStops() {
    if (SEASON_STOPS) return SEASON_STOPS;
    var max = 0;
    D.events.forEach(function (e) { if (e.number > max) max = e.number; });
    SEASON_STOPS = [];
    for (var i = 1; i <= (max || 6); i++) SEASON_STOPS.push({ number: i });
    return SEASON_STOPS;
  }
  /* A twelve-column table is wider than a conference card and wider
     than the accordion body. Boxed once, here, rather than by each
     caller remembering to. */
  function wtScroll(tbl) {
    if (!tbl || !tbl.parentNode) return tbl;
    if (tbl.parentNode.classList.contains('wt-scroll')) return tbl;
    var box = el('div', 'wt-scroll');
    tbl.parentNode.insertBefore(box, tbl);
    box.appendChild(tbl);
    return tbl;
  }
  function wtTable(host, rows, stops, opts) {
    if (!host) return 0;
    opts = opts || {};
    var showPos = opts.pos !== false;
    var showStatus = opts.status !== false;
    var showSeed = opts.seed === true;
    var showPoints = opts.points === true;
    var list = opts.limit ? rows.slice(0, opts.limit) : rows;

    function th(cls, label, num, sortKey) {
      return '<div class="' + cls + ' cell' + (num ? ' cell-num' : '') +
             (sortKey ? ' cell-sortable" role="button" tabindex="0"' : '"') + '>' +
             '<span class="t-caption" style="color:inherit">' + label + '</span>' +
             (sortKey ? SORT_SVG : '') + '</div>';
    }
    var head = '<div class="el-08-TableHeaderRow cut cut-s thead wt-head">' +
      /* Review 20 — POS carried a sort arrow, which offered to
         re-sort by the order the sort had just produced, and in a
         44px column pushed the label off the centre the numbers
         below it stand on. */
      (showPos ? th('cell-position c-pos', 'POS', 0, 0) : '') +
      th('cell-federation c-fed', 'FEDERATION', 0, 1) +
      (showSeed ? th('cell-seed c-wtseed', 'SEED', 1, 1) : '') +
      th('cell-points c-wtpts', 'TOUR PTS', 1, 1) +
      stops.map(function (e) {
        return th('cell-wtstop c-wtstop', 'STOP ' + e.number, 1);
      }).join('') +
      th('cell-winratio c-wr', 'W%', 1, 1) +
      /* Alex: the player table states total points and the team
         table did not. Tour points rank the table; these are the
         points actually scored, which is the figure the two halves
         of Statistics now share. */
      (showPoints ? th('cell-scored c-wtscored', 'POINTS', 1, 1) : '') +
      th('cell-ptsavg c-pa', 'PTS AVG', 1, 1) +
      (showStatus ? th('cell-status c-st', 'STATUS', 0, 1) : '') +
      '</div>';

    var body = list.map(function (r, i) {
      var cells = stops.map(function (e) {
        var f = r.stopRank && r.stopRank[e.number];
        if (!f || !f.rank) {
          return '<div class="cell-wtstop c-wtstop cell cell-num">' +
                 '<span class="t-data-m wt-none">—</span></div>';
        }
        return '<div class="cell-wtstop c-wtstop cell cell-num"><span class="wt-stack">' +
               '<span class="t-data-m' + (f.rank === 1 ? ' wt-first' : '') + '">' +
               ordinal(f.rank) + '</span>' +
               '<span class="t-caption wt-pts">' + f.pts + '</span></span></div>';
      }).join('');
      var st = r.status;
      return '<div class="el-04-TeamRow trow wt-row" data-ioc="' + r.ioc +
        '" data-href="team.html?ioc=' + r.ioc + '" title="' + (r.team || '') + '">' +
        (showPos ? '<div class="cell-position c-pos cell"><span class="t-data-m">' +
                   (r.rank || i + 1) + '</span></div>' : '') +
        '<div class="cell-federation c-fed cell">' +
          '<div class="el-13-FederationTag--m-both-plain ftag ftag-m cut cut-s ftag-plain">' +
          '<div class="flag flag-ring"></div><div class="ftag-txt">' +
          '<span class="ftag-code">' + r.ioc + '</span>' +
          /* Statistics ranks across conferences, so which conference
             a row belongs to is part of reading it. There is no room
             for a column of its own beside six stops, so it goes
             under the code — the same two-line stack the stop cells
             use. */
          (opts.sub ? '<span class="t-caption wt-sub">' + opts.sub(r) + '</span>' : '') +
          '</div></div></div>' +
        (showSeed ? '<div class="cell-seed c-wtseed cell cell-num"><span class="t-data-m' +
                    (r.seed == null ? ' wt-none' : '') + '">' +
                    seedText(r.seed) + '</span></div>' : '') +
        '<div class="cell-points c-wtpts cell cell-num"><span class="t-data-m">' +
          (r.tour || 0) + '</span></div>' +
        cells +
        '<div class="cell-winratio c-wr cell cell-num"><span class="t-data-m">' +
          pctRatio(r.winRatio) + '</span></div>' +
        (showPoints ? '<div class="cell-scored c-wtscored cell cell-num">' +
          '<span class="t-data-m">' + scoredOf(r) + '</span></div>' : '') +
        '<div class="cell-ptsavg c-pa cell cell-num"><span class="t-data-m">' +
          (r.avg != null ? r.avg.toFixed(1) : '—') + '</span></div>' +
        (showStatus
          ? '<div class="cell-status c-st cell">' +
            (st ? '<div class="el-05-StatusBadge--marker-' + st + ' marker marker-' + st +
                  ' cut cut-s"><span class="lbl">' + st.toUpperCase() + '</span></div>'
                : '<span class="t-data-m wt-none">—</span>') +
            '</div>'
          : '') +
        '</div>';
    }).join('');

    host.innerHTML = head + body;
    host.classList.add('wt-tbl');
    $$('.wt-row', host).forEach(function (row) {
      flag($('.flag', row), row.dataset.ioc);
      link(row, row.dataset.href);
    });
    return list.length;
  }
  /* ---- Review 18: SEED, inserted into a table that was built
     without one. The column shows before the data does: an em dash
     under a Seed heading says "this is coming", where no column at
     all says "we forgot". One insertion point, so when teams.json
     gains the field nothing else has to move. */
  function ensureSeedColumn(tbl, after) {
    if (!tbl || tbl._seed) return;
    tbl._seed = 1;
    after = after || 'cell-federation';
    var head = $('.thead', tbl);
    if (head) {
      var h = el('div', 'cell-seed cell c-wtseed cell-num cell-sortable',
                 '<span class="t-caption" style="color:inherit">Seed</span>' + SORT_SVG);
      h.setAttribute('role', 'button');
      h.setAttribute('tabindex', '0');
      var ref = $('.' + after, head);
      if (ref) ref.after(h); else head.appendChild(h);
    }
    $$('.trow', tbl).forEach(function (row) {
      if ($('.cell-seed', row)) return;
      var c = el('div', 'cell-seed cell c-wtseed cell-num',
                 '<span class="t-data-m">\u2014</span>');
      var ref2 = $('.' + after, row);
      if (ref2) ref2.after(c); else row.appendChild(c);
    });
  }
  /* siteTable calls it scored, conferenceTable calls it pts; both
     mean the points this side put on the board. */
  function scoredOf(r) {
    var v = (r.scored != null) ? r.scored : r.pts;
    return (v == null) ? '\u2014' : v;
  }
  /* The sort arrow the design system draws in el-08. */
  var SORT_SVG = '<svg fill="currentColor" height="16" viewBox="0 -960 960 960" ' +
    'width="16" xmlns="http://www.w3.org/2000/svg"><path d="M480-120 300-300l44-44 ' +
    '136 136 136-136 44 44-180 180ZM344-612l-44-44 180-180 180 180-44 44-136-136-136 ' +
    '136Z"></path></svg>';
  /* The column keys a WT table sorts on, in one place because four
     tables use them. */
  var WT_COLS = {
    'cell-position':   { key: 'rank' },
    'cell-federation': { key: 'team', text: 1 },
    'cell-seed':       { key: 'seedSort' },
    'cell-points':     { key: 'tour' },
    'cell-winratio':   { key: 'winRatio' },
    'cell-scored':     { key: 'scored' },
    'cell-ptsavg':     { key: 'avg' },
    'cell-status':     { key: 'statusRank' }
  };

  /* Q once the conference is over and this row won it — a conference
     winner qualifies. Everyone else is still in the race; S is a
     season-wide judgement and is set on the Standings page, not here. */
  function paintStandingRow(row, r, complete) {
    row.hidden = false;
    fed(row, r.ioc, cleanTeam(r.team));
    text(row, '.cell-position .t-data-m', r.rank);
    text(row, '.cell-winratio .t-data-m', pctRatio(r.winRatio));
    text(row, '.cell-ptsavg .t-data-m', r.avg.toFixed(1));
    text(row, '.cell-ep .t-data-m', r.stops);
    text(row, '.cell-points .t-data-m', r.tour);
    var mk = $('.cell-status .marker', row);
    if (mk) {
      var st = (complete && r.rank === 1 && r.tour > 0) ? 'q' : 'r';
      mk.classList.remove('marker-q', 'marker-s', 'marker-r');
      mk.classList.add('marker-' + st);
      text(mk, '.lbl', st.toUpperCase());
    }
    link(row, 'team.html?ioc=' + r.ioc);
  }

  /* ---------- controls ---------------------------------------
     The design system supplies the controls; these give them the
     behaviour. Each returns the current value and calls back when
     it changes, so a page renderer stays a single render function. */


  /* Review 11: the gender is the reader's, not the page's.
     Written by whichever switch they touch, read by every switch
     that opens after it — including the four-segment one on a team
     page. sessionStorage, because it is a reading position and not
     a preference: a new visit starts where the site starts. */
  var NL_SEX = 'nl.gender';
  function sexGet() {
    try {
      var v = window.sessionStorage.getItem(NL_SEX);
      return v === 'women' || v === 'men' ? v : '';
    } catch (e) { return ''; }
  }
  function sexSet(v) {
    try { window.sessionStorage.setItem(NL_SEX, v); } catch (e) {}
  }

  /* el-02 GenderSwitch → 'men' | 'women'. Scoped, because a page can
     carry more than one: the landing page has the switch in F-04's slot,
     one inside each live accordion and one on the qualification board,
     and a document-wide binding made them all move together. */
  function genderSwitch(onChange, root) {
    var host = root || $('.f04-ctl') || document;
    var seg = $$('.el02-seg', host);
    if (!seg.length && host !== document) seg = $$('.el02-seg', document);
    if (!seg.length) return 'men';
    var value = 'men';
    seg.forEach(function (s) {
      if (s.classList.contains('el02-on')) value = /women/i.test(s.textContent) ? 'women' : 'men';
      s.addEventListener('click', function () {
        seg.forEach(function (x) { x.classList.remove('el02-on'); });
        s.classList.add('el02-on');
        value = /women/i.test(s.textContent) ? 'women' : 'men';
        sexSet(value);
        onChange(value);
      });
    });
    /* Arriving with a choice already made: move the switch to it and
       hand the page that value, so the first paint is the right one
       and no repaint is needed. */
    var want = sexGet();
    if (want && want !== value) {
      var hit = seg.filter(function (s) {
        return (/women/i.test(s.textContent) ? 'women' : 'men') === want;
      })[0];
      if (hit) {
        seg.forEach(function (x) { x.classList.remove('el02-on'); });
        hit.classList.add('el02-on');
        value = want;
      }
    }
    return value;
  }

  /* el-03 FilterChips → the label of the selected chip */
  function chipFilter(onChange) {
    var chips = $$('.chip');
    if (!chips.length) return null;
    var value = (chips.filter(function (c) { return c.classList.contains('chip-on'); })[0] || chips[0]).textContent.trim();
    chips.forEach(function (c) {
      c.addEventListener('click', function () {
        chips.forEach(function (x) { x.classList.remove('chip-on'); });
        c.classList.add('chip-on');
        value = c.textContent.trim();
        onChange(value);
      });
    });
    return value;
  }

  /* el-11 SearchInput → live text, debounced by nothing; the sets
     here are small enough to filter on every keystroke. */
  function searchField(root, placeholder, onChange) {
    var box = $('.search', root || document);
    if (!box) return function () { return ''; };
    var txt = $('.search-txt, .search-txt-filled', box);
    var inp = $('input', box);
    if (!inp) {
      inp = document.createElement('input');
      inp.type = 'text';
      inp.className = 'search-in';
      inp.setAttribute('autocomplete', 'off');
      inp.placeholder = placeholder || 'Search';
      if (txt) txt.replaceWith(inp); else box.appendChild(inp);
    }
    /* el-11 carries a clear control at the trailing edge. It was only
       in the search overlay's markup, so the field on Teams and
       Standings had no way back to the full list except selecting the
       text by hand. */
    var clear = $('.search-clear', box);
    if (!clear) {
      clear = document.createElement('button');
      clear.type = 'button';
      clear.className = 'search-clear';
      clear.setAttribute('aria-label', 'Clear search');
      clear.innerHTML = '<svg viewBox="0 -960 960 960" width="20" height="20" fill="currentColor" aria-hidden="true">' +
        '<path d="m249-207-42-42 231-231-231-231 42-42 231 231 231-231 42 42-231 231 231 231-42 42-231-231-231 231Z"/></svg>';
      box.appendChild(clear);
    }
    function toggleClear() { clear.hidden = !inp.value.length; }
    toggleClear();
    inp.addEventListener('input', function () {
      toggleClear();
      onChange(this.value.trim().toLowerCase());
    });
    clear.addEventListener('click', function () {
      inp.value = '';
      toggleClear();
      onChange('');
      inp.focus();
    });
    return function () { return inp.value.trim().toLowerCase(); };
  }

  /* el-10 EmptyState, at the width of the block it replaces. */
  /* el-10 EmptyState, verbatim. The block was being built without the
     cut-out fill and without an icon, so it came out as a filled grey
     panel rather than the outlined one the element is specified as, and
     every module that had nothing in it looked like a different
     component. One builder, four icons, an optional action. */
  var EMPTY_ICONS = {
    clock: 'm627-287 45-45-159-160v-201h-60v225l174 181ZM480-80q-82 0-155-31.5t-127.5-86Q143-252 111.5-325T80-480q0-82 31.5-155t86-127.5Q252-817 325-848.5T480-880q82 0 155 31.5t127.5 86Q817-708 848.5-635T880-480q0 82-31.5 155t-86 127.5Q708-143 635-111.5T480-80Zm0-400Zm0 340q140 0 240-100t100-240q0-140-100-240T480-820q-140 0-240 100T140-480q0 140 100 240t240 100Z',
    info:  'M453-280h60v-240h-60v240Zm50.5-323.2q9.5-9.2 9.5-22.8 0-14.45-9.48-24.22-9.48-9.78-23.5-9.78t-23.52 9.78Q447-640.45 447-626q0 13.6 9.48 22.8 9.48 9.2 23.5 9.2t23.52-9.2ZM480.27-80q-82.74 0-155.5-31.5Q252-143 197.5-197.5t-86-127.34Q80-397.68 80-480.5t31.5-155.66Q143-709 197.5-763t127.34-85.5Q397.68-880 480.5-880t155.66 31.5Q709-817 763-763t85.5 127Q880-563 880-480.27q0 82.74-31.5 155.5Q817-252 763-197.68q-54 54.31-127 86Q563-80 480.27-80Zm.23-60Q622-140 721-239.5t99-241Q820-622 721.19-721T480-820q-141 0-240.5 98.81T140-480q0 141 99.5 240.5t241 99.5Zm-.5-340Z',
    search:'M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z',
    calendar:'M200-80q-33 0-56.5-23.5T120-160v-560q0-33 23.5-56.5T200-800h40v-80h60v80h360v-80h60v80h40q33 0 56.5 23.5T840-720v560q0 33-23.5 56.5T760-80H200Zm0-60h560v-400H200v400Zm0-460h560v-100H200v100Zm0 0v-100 100Z'
  };

  function emptyState(host, title, body, opts) {
    if (!host) return;
    opts = opts || {};
    var e = host.querySelector(':scope > .site-empty');
    if (!e) {
      e = document.createElement('div');
      host.appendChild(e);
    }
    e.className = 'site-empty empty cut cut-m cut-out';
    var icon = EMPTY_ICONS[opts.icon] || EMPTY_ICONS.clock;
    var action = '';
    if (opts.href && opts.action) {
      action = '<a class="nav-a site-empty-a" href="' + opts.href + '">' +
               '<div class="ctl-01-Button--outline-default btn cut cut-m btn-outline cut-out">' +
               '<div class="cutfill"></div><span class="lbl"></span>' +
               '<svg fill="currentColor" height="18" viewBox="0 -960 960 960" width="18" ' +
               'xmlns="http://www.w3.org/2000/svg"><path d="M686-450H160v-60h526L438-758l42-42 ' +
               '320 320-320 320-42-42 248-248Z"></path></svg></div></a>';
    }
    e.innerHTML = '<div class="cutfill"></div>' +
                  '<div class="empty-icon"><svg fill="currentColor" height="32" ' +
                  'viewBox="0 -960 960 960" width="32" xmlns="http://www.w3.org/2000/svg">' +
                  '<path d="' + icon + '"></path></svg></div>' +
                  '<div class="empty-title"></div>' +
                  '<div class="t-body-s empty-body"></div>' + action;
    e.querySelector('.empty-title').textContent = title;
    e.querySelector('.empty-body').textContent = body || '';
    if (action) e.querySelector('.site-empty-a .lbl').textContent = opts.action;
    e.hidden = false;
    return e;
  }

  /* C-03 PhotoGallery, wherever it appears. The landing page painted
     its own carousel inline; the team, conference and stop pages carry
     the same block, so the painter is shared. */
  /* C-03 PhotoGallery. The feed keys a gallery on the event it was shot
     at, not on a stop slug, so a page asking for "its" photographs was
     getting the whole archive. `scope` is a list of events; the newest
     shoot comes first. */
  function photosFor(events) {
    var want = {};
    (events || []).forEach(function (e) { if (e && e.id) want[e.id] = e; });
    var list = D.photos.filter(function (g) { return want[g.eventId]; });
    list.sort(function (a, b) {
      var ea = want[a.eventId] || {}, eb = want[b.eventId] || {};
      return String(eb.start || '').localeCompare(String(ea.start || '')) ||
             String(b.title || '').localeCompare(String(a.title || ''));
    });
    return list;
  }

  function paintPhotos(list) {
    var host = $('.car');
    var block = host && host.closest('.tpl-sub');
    /* Review 6: the gallery is in the Overview pane. It used to set
       block.hidden = false on every repaint, so changing the gender
       while the Stops tab was open pulled Photos back out of the
       hidden pane — and being the pane's last block, it landed above
       everything the Stops tab was showing. A block only un-hides
       into the pane that is actually on. */
    if (block && block.dataset.pane) {
      var onTab = $('.tab.tab-active');
      if (onTab && onTab.dataset.tab !== block.dataset.pane) return;
    }
    if (!list || !list.length) {
      /* The section used to disappear, which made the page look like it
         had been built without a gallery. It states what is missing. */
      $$('.car').forEach(function (c) { c.hidden = true; });
      if (block) {
        block.hidden = false;
        emptyState(block, 'No photographs yet',
                   'Galleries are published in the days after a stop.',
                   { icon: 'info' });
      }
      return;
    }
    if (block) {
      block.hidden = false;
      var oldp = block.querySelector(':scope > .site-empty');
      if (oldp) oldp.remove();
    }
    $$('.car').forEach(function (c) { c.hidden = false; });
    repeat(document, '.car-slide', list, function (slide, g) {
      photo(slide, g.image);
      var cap = $('.t-caption', slide);
      if (cap) { cap.style.display = ''; cap.textContent = g.title; cap.style.color = '#fff'; }
    });
  }


  /* Review 11: el-24 Avatar, with a photograph where the feed has
     one. The element ships with two beds — a checker plate for the
     empty state and a flat surface for a silhouette — and a portrait
     wants the flat one, or the checker shows through the corners of
     a cut-out. Without a portrait nothing is touched: the initials
     the caller has already written stay exactly as they are. */
  function avatarOf(av, p) {
    if (!av || !p || !p.portrait) return false;
    if (av.dataset.portrait === p.portrait) return true;
    av.dataset.portrait = p.portrait;
    av.classList.remove('av-check-bed');
    av.classList.add('av-sil-bed', 'av-photo-bed');
    var img = $('.av-photo', av);
    if (!img) {
      img = document.createElement('img');
      img.className = 'av-photo';
      img.alt = '';
      av.appendChild(img);
    }
    /* A CDN that will not answer leaves the initials rather than a
       broken-image mark, so the row never loses the player's name. */
    img.onerror = function () {
      img.remove();
      av.classList.remove('av-photo-bed');
      av.removeAttribute('data-portrait');
    };
    img.src = p.portrait;
    return true;
  }

  /* The name plate on E-08 PlayerCard is a fixed height, so a surname
     that does not fit is scaled down rather than wrapped — two lines of
     30px surname push the plate over the stat column. The steps are
     declared in modules.css as .fit-1 … .fit-5; this walks down them
     until the text fits the box it is in. Character counts are the
     fallback for a card measured before layout (hidden tab, print). */
  function fitName(el, steps, chars) {
    if (!el) return;
    for (var i = 1; i <= 5; i++) el.classList.remove('fit-' + i);
    var room = el.clientWidth;
    if (room <= 0) {
      /* Painted while still detached from the document — fall back to a
         character count, then let the deferred pass measure for real. */
      var n = (el.textContent || '').length, s = 0;
      for (var c = 0; c < chars.length; c++) if (n > chars[c]) s = c + 1;
      if (s) el.classList.add('fit-' + Math.min(s, steps));
      return;
    }
    room -= 2;
    for (var k = 0; k <= steps && el.scrollWidth > room; k++) {
      if (k) el.classList.remove('fit-' + k);
      if (k < steps) el.classList.add('fit-' + (k + 1));
    }
  }

  function fitPlayerCard(card) {

    fitName($('.pcard-last', card), 5, [9, 12, 15, 19, 23]);
    fitName($('.pcard-first', card), 3, [16, 21, 26]);
  }

  /* Re-run every card's fit pass — after fonts land and on resize, both
     of which change the measurement the first pass was based on. */
  function fitAllPlayerCards() {
    $$('.pcard').forEach(fitPlayerCard);
  }
  function scheduleFit() {
    clearTimeout(fitAllPlayerCards._t);
    fitAllPlayerCards._t = setTimeout(function () {
      requestAnimationFrame(fitAllPlayerCards);
    }, 0);
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(scheduleFit);
  window.addEventListener('resize', function () {
    clearTimeout(fitAllPlayerCards._t);
    fitAllPlayerCards._t = setTimeout(fitAllPlayerCards, 120);
  });

  /* E-08 PlayerCard, painted from a player record. */
  function paintPlayerCard(card, p, stats) {
    /* The cut-out portrait layer. A player with a real cut-out gets it;
       everyone else keeps the silhouette, which is the fallback the card
       was drawn with. The image is dropped into the same .pcard-shot
       box, so it inherits the bottom alignment and the crop. */
    /* paintPlayerCard is handed the .pcard-sh shadow wrapper, not the
       card. Layers have to go on the card itself — the wrapper is not a
       positioned box, so anything absolute appended to it lands against
       the page. */
    var face = card.classList.contains('pcard') ? card : ($('.pcard', card) || card);
    var shot = $('.pcard-shot', face);
    if (shot) {
      var img = $('.pcard-photo', shot);
      var scrim = $('.pcard-scrim', face);
      if (p.portrait) {
        if (!img) {
          img = document.createElement('img');
          img.className = 'pcard-photo';
          img.alt = '';
          shot.appendChild(img);
        }
        img.src = p.portrait;
        var sil = $('.pcard-silhouette', shot);
        if (sil) sil.hidden = true;
        /* A real portrait is opaque and can be dark exactly where the
           stat column sits. The scrim is the card's own surface faded
           in from the right, so the figures keep their contrast without
           a box being drawn round them. */
        if (!scrim) {
          scrim = document.createElement('div');
          scrim.className = 'pcard-scrim';
          face.appendChild(scrim);
        }
      } else {
        if (img) img.remove();
        if (scrim) scrim.remove();
      }
    }
    text(card, '.pcard-first', p.first);
    var last = $('.pcard-last', card);
    if (last) { last.textContent = p.last || ''; }
    text(card, '.pcard-ioc', p.ioc);
    flag(card, p.ioc);
    /* The stat column takes as many rows as it is given. Slots past
       the end of the list are removed rather than left holding the
       specimen's figures, which is what put an RPG of 1.2 on every
       card once the column went from four measures to three. */
    var slots = $$('.pcard-stat', card);
    (stats || []).forEach(function (s, i) {
      if (!slots[i]) return;
      slots[i].hidden = false;
      text(slots[i], '.pcard-k', s[0]);
      text(slots[i], '.pcard-v', s[1]);
    });
    slots.slice((stats || []).length).forEach(function (n) { n.remove(); });
    link(card, 'player.html?id=' + p.id);
    fitPlayerCard(card);
    /* Cards are painted before they are put in the document, so the pass
       above only ever sees the character count. Re-measure once the
       fragment has landed. */
    scheduleFit();
  }

  /* el-02 GenderSwitch, built from the team sites a federation actually
     fields. A federation may enter U23 only, U21 only, or both, and the
     switch has to say which — on a conference page the category is in
     the conference name, but a team page holds both categories at once.
     Two segments become four when it does. */
  function categorySwitch(host, sites, onChange) {
    var el = $('.el02', host || document);
    if (!el) return null;
    var have = {};
    sites.forEach(function (t) {
      have[rowCat(t.conference, t.name) + '|' + (t.gender || 'men')] = t;
    });
    var cats = ['U23', 'U21'].filter(function (c) {
      return have[c + '|men'] || have[c + '|women'];
    });
    var opts = [];
    cats.forEach(function (c) {
      ['men', 'women'].forEach(function (g) {
        if (!have[c + '|' + g]) return;
        opts.push({
          cat: c, gender: g,
          label: c + ' ' + (g === 'men' ? 'Men' : 'Women')
        });
      });
    });
    if (!opts.length) return null;
    /* Review 18 — "All" comes first and opens the page. A federation
       is arrived at by its IOC code (teams.html links team.html?ioc=)
       and the question that brings a reader here is "how is this
       federation doing", not "how is its U23 men's side doing". The
       four sides are the answer's parts, so they are shown together
       first and each of them is one click away. */
    if (opts.length > 1) {
      opts.unshift({ cat: 'All', gender: sexGet() || 'men', label: 'All' });
    }

    /* Which of the four opens. The reader's gender first, and U23
       ahead of U21 inside it, because U23 is the road to the World
       Cup and the one a federation is read by. A federation that
       fields no team in the gender they chose falls back to U23 in
       the one it does field, rather than to whatever came first. */
    var want = sexGet();
    function pick(list) { return list.length ? list[0] : null; }
    var current = opts[0].cat === 'All' ? opts[0] : (
      pick(opts.filter(function (o) { return o.gender === want && o.cat === 'U23'; })) ||
      pick(opts.filter(function (o) { return o.gender === want; })) ||
      pick(opts.filter(function (o) { return o.cat === 'U23'; })) ||
      opts[0]);

    var proto = $('.el02-seg', el).cloneNode(true);
    el.innerHTML = '';
    opts.forEach(function (o) {
      var seg = proto.cloneNode(true);
      seg.classList.remove('el02-on');
      text(seg, '.lbl', o.label);
      seg.onclick = function () {
        current = o;
        if (o.cat !== 'All') sexSet(o.gender);
        $$('.el02-seg', el).forEach(function (s) { s.classList.remove('el02-on'); });
        seg.classList.add('el02-on');
        onChange(o);
      };
      el.appendChild(seg);
      if (o === current) seg.classList.add('el02-on');
    });
    el.classList.toggle('el02-quad', opts.length > 2);
    el.classList.toggle('el02-five', opts.length > 4);
    /* So a card in the overview can hand the switch a category. */
    el._pick = function (cat, gender) {
      var segs = $$('.el02-seg', el);
      for (var i = 0; i < opts.length; i++) {
        if (opts[i].cat === cat && (cat === 'All' || opts[i].gender === gender)) {
          segs[i].click();
          return true;
        }
      }
      return false;
    };
    return current;
  }

  /* Review 15 — Q / S / R for one team site, read off the same
     season table the Standings page ranks with, so the letter a
     federation is given here is the letter it is given there.
     (conferences.html has a statusOf() of its own about a whole
     conference; this one is about one team site, hence the name.) */
  var STATUS_CACHE = {};
  function siteStatus(team) {
    if (!team || !team.ioc) return '';
    var g = team.gender || 'men';
    var k = g + '|' + team.ioc + '|' + (team.conference || '');
    if (STATUS_CACHE[k] != null) return STATUS_CACHE[k];
    /* Review 18 — matched on the team site, not on the IOC code. A
       federation that fields U21 as well as U23 has two answers and
       the code alone could not say which one was being asked for. */
    var rows = federationTable(g);
    var row = rows.filter(function (t) {
      return t.ioc === team.ioc && t.conference === team.conference;
    })[0] || rows.filter(function (t) { return t.ioc === team.ioc; })[0];
    return (STATUS_CACHE[k] = (row && row.status) || '');
  }

  /* ---------- Review 18: what a search is searching ----------
     "Germany" returned one row where the federation fields four
     sides, and "U21" returned nothing at all. Two causes, and the
     same one twice: the unit of a result was the federation
     (de-duplicated by IOC code), and the haystack was the name and
     the code. The unit is the team site now, and the category and
     the gender are part of what a team site is called. Neither is a
     field in teams.json — the category is carried in the conference
     name and the gender in the record — so both are derived here,
     once, for all three places that search. */
  function siteCat(t) { return rowCat(t.conference, t.name); }
  function siteLabel(t) {
    return siteCat(t) + ' ' + ((t.gender || 'men') === 'women' ? 'Women' : 'Men');
  }
  /* One entry per team site. teams.json holds one record per stop, so
     a federation appears in it up to six times per conference. */
  function teamSites() {
    if (D._sites) return D._sites;
    var seen = {}, out = [];
    D.teams.forEach(function (t) {
      if (!t.ioc) return;
      var k = t.ioc + '|' + t.conference + '|' + (t.gender || 'men') + '|' + siteCat(t);
      if (seen[k]) return;
      seen[k] = 1;
      out.push(t);
    });
    out.sort(function (a, b) {
      return cleanTeam(a.name).localeCompare(cleanTeam(b.name)) ||
             siteLabel(a).localeCompare(siteLabel(b));
    });
    return (D._sites = out);
  }
  /* Words, not one long string: "men" must not match "women", which
     a substring test on a joined haystack would do. A token matches
     on its opening — "ger" finds Germany and GER, "u21" finds the
     category — and the full name is tested as a phrase as well, so a
     two-word country still answers to the second word typed with the
     first. */
  function siteTokens(t) {
    if (t._tok) return t._tok;
    var c = conf(t.conference) || {};
    var g = (t.gender || 'men');
    var words = [];
    function add(v) {
      String(v || '').toLowerCase().split(/[^a-z0-9]+/i).forEach(function (w) {
        if (w) words.push(w);
      });
    }
    add(cleanTeam(t.name)); add(t.ioc); add(siteCat(t)); add(g);
    add(confLabel(c, siteCat(t))); add(regionOf(c));
    /* The host cities of this conference's stops: "Kigali" is a fair
       way to ask who is playing in Kigali. */
    stopsOfConference(t.conference).forEach(function (e) { add(cityOf(e)); add(e.country); });
    return (t._tok = words);
  }
  function siteMatch(t, q) {
    var w = siteTokens(t);
    for (var i = 0; i < w.length; i++) if (w[i].indexOf(q) === 0) return true;
    return ((t.name || '') + ' ' + (t.ioc || '')).toLowerCase().indexOf(q) > -1;
  }
  /* The cap was six, which one federation with four sides could fill
     on its own. Twelve, so a category search still shows a spread. */
  var SEARCH_MAX = 12;
  function searchSites(q, limit) {
    q = (q || '').trim().toLowerCase();
    if (!q) return [];
    /* Ranked, because a substring match is a real hit but a weaker
       one: "GER" is Germany's IOC code and it is also three letters
       inside "Algeria". Exact code first, then a word that starts
       with what was typed, then anything containing it. */
    return teamSites().filter(function (t) { return siteMatch(t, q); })
      .map(function (t) {
        var r = 2;
        if ((t.ioc || '').toLowerCase() === q) r = 0;
        else if (siteTokens(t).some(function (w) { return w.indexOf(q) === 0; })) r = 1;
        return { t: t, r: r };
      })
      .sort(function (a, b) { return a.r - b.r; })
      .map(function (x) { return x.t; })
      .slice(0, limit || SEARCH_MAX);
  }
  /* A result row states the side, not just the country: the category
     and the gender on the title line, the conference under it. */
  function paintSiteRow(row, t) {
    var name = cleanTeam(t.name);
    /* The overlay row states the country in the federation tag and
       has no second title slot, so the side is named on the meta
       line: "U21 Women · Europe-1 U21". */
    fed(row, t.ioc, name);
    text(row, '.e11-t', name + ' ' + siteLabel(t));
    text(row, '.e11-m',
         siteLabel(t) + ' \u00b7 ' + confLabel(conf(t.conference), siteCat(t)));
    link(row, 'team.html?ioc=' + t.ioc);
  }

  /* ---------- E-01 TeamFinder --------------------------------
     step 1 default · 2 filled in · 3 choose team site · 4 result   */
  function initFinder(f) {
    var seen = {}, feds = [];
    D.teams.forEach(function (t) {
      if (!t.ioc || seen[t.ioc]) return;
      seen[t.ioc] = 1;
      feds.push(t);
    });
    feds.sort(function (a, b) { return (a.name || '').localeCompare(b.name || ''); });

    /* The count sits in the section header now, not inside the module,
       so it is addressed from the document. */
    /* Review 18 (second pass) — the count above Find a team goes.
       "68 nations · 202 team sites this conference" is a fact about
       the database rather than an answer to the question the module
       asks, and on the Conferences page the second half of it was not
       even true of the page it sat on. */
    /* It is in the page's section header, not inside the module — the
       comment above says so, and scoping the removal to the module
       was why it kept surviving. */
    $$('.finder-count').forEach(function (n) { n.remove(); });
    $$('.finder-change, .finder-change-2', f).forEach(function (c) {
      c.style.cursor = 'pointer';
      c.addEventListener('click', function () { step(1); list(''); });
    });

    var parts = {
      search: $('[data-part="search"]', f),
      choose: $('[data-part="choose"]', f),
      result: $('[data-part="result"]', f)
    };
    function step(n) {
      f.dataset.step = n;
      parts.search.hidden = n !== 1 && n !== 2;
      parts.choose.hidden = n !== 3;
      parts.result.hidden = n !== 4;
    }

    /* ---- 2 · filled in ---- */
    var menu = $('.finder-menu', f);
    function list(q) {
      q = (q || '').trim().toLowerCase();
      [].slice.call(menu.querySelectorAll('.acm-row')).forEach(function (r) { r.remove(); });
      if (!q) { menu.hidden = true; return; }
      /* Review 18 — the candidate list is team sites, so "U21" and
         "women" find something and a federation with four sides shows
         all four. Picking one still opens step 3, which is where the
         Q/S/R markers are and where the category is confirmed. */
      var hits = searchSites(q, 8);
      menu.hidden = false;
      if (!hits.length) {
        var none = document.createElement('div');
        none.className = 'acm-row';
        none.innerHTML = '<span class="t-body-s">No team matches \u201c' + q + '\u201d.</span>';
        menu.appendChild(none);
        return;
      }
      hits.forEach(function (t) {
        var row = document.createElement('div');
        row.className = 'acm-row';
        row.innerHTML =
          '<div class="ftag ftag-m cut cut-s ftag-plain">' +
            '<div class="flag flag-ring"></div>' +
            '<div class="ftag-txt"><span class="ftag-name"></span></div></div>' +
          '<div class="t-caption acm-conf"></div>';
        flag(row, t.ioc);
        row.querySelector('.ftag-name').textContent = t.name + ' ' + siteLabel(t);
        row.querySelector('.acm-conf').textContent =
          t.ioc + ' \u00b7 ' + confName(conf(t.conference));
        row.style.cursor = 'pointer';
        row.addEventListener('click', function () { choose(t); });
        menu.appendChild(row);
      });
    }
    searchField(f, 'Search your country\u2026', list);

    /* ---- 3 · choose a team site ---- */
    var picked = null;
    function choose(t) {
      picked = t;
      flag($('.finder-picked', f), t.ioc);
      text(f, '.finder-country', cleanTeam(t.name));
      var sites = D.teams.filter(function (x) { return x.ioc === t.ioc; });
      /* Review 15 — the label was hard-coded to U23, so a federation
         that fields U21 as well was offered the same two buttons
         twice and told its U21 side was U23. The age category lives
         in the conference and nowhere else. */
      var byCat = {};
      sites.forEach(function (x) {
        var label = rowCat(x.conference, x.name) + ' ' +
                    (x.gender === 'women' ? 'Women' : 'Men');
        byCat[label] = byCat[label] || x;
      });
      var box = $('.finder-sites-list', f);
      box.innerHTML = '';
      var ORDER = ['U23 Men', 'U23 Women', 'U21 Men', 'U21 Women'];
      Object.keys(byCat).sort(function (a, b) {
        var i = ORDER.indexOf(a), j = ORDER.indexOf(b);
        return (i < 0 ? 9 : i) - (j < 0 ? 9 : j);
      }).forEach(function (label) {
        var b = document.createElement('div');
        b.className = 'btn btn-outline cut cut-s cut-out';
        b.innerHTML = '<div class="cutfill"></div><span class="lbl"></span>';
        b.querySelector('.lbl').textContent = label;
        /* Alex: "then also if Q, S or R". The marker is on the button,
           so the answer is there before a site is even chosen. */
        var mk = siteStatus(byCat[label]);
        if (mk) {
          var m = document.createElement('div');
          m.className = 'el-05-StatusBadge--marker-' + mk +
                        ' marker marker-' + mk + ' cut cut-s finder-mk';
          m.innerHTML = '<span class="lbl">' + mk.toUpperCase() + '</span>';
          b.appendChild(m);
        }
        b.addEventListener('click', function () { result(byCat[label], label); });
        box.appendChild(b);
      });
      step(3);
    }


    /* ---- 4 · result ---- */
    function result(team, label) {
      /* Review 11: picking a team site here is picking a gender, and
         the team page it links to opens on whatever was picked. */
      sexSet(team.gender || 'men');
      var st = D.standings.filter(function (s) {
        return s.stop === team.stop && s.gender === team.gender;
      })[0];
      var row = st && st.rows.filter(function (r) { return r.ioc === team.ioc; })[0];
      var c = conf(team.conference) || {};
      var played = playedCount(team.conference);

      /* Season totals for this federation, the same four figures the
         team header carries. */
      var tot = { played: 0, won: 0, points: 0, stops: 0 };
      /* Review 10: this conference's stops, not every stop in the
         season that this federation turned up at. */
      var mine = {};
      D.events.forEach(function (e2) {
        if (e2.conference === team.conference) mine[e2.slug] = 1;
      });
      D.standings.forEach(function (s2) {
        if (s2.gender !== team.gender || !mine[s2.stop]) return;
        s2.rows.forEach(function (r) {
          if (r.ioc !== team.ioc) return;
          tot.played += r.played || 0;
          tot.won += r.won || 0;
          tot.points += r.points || 0;
          tot.stops += 1;
        });
      });

      flag($('.finder-card-head', f), team.ioc);
      text(f, '.finder-cat', /women/i.test(label) ? 'Women' : 'Men');
      text(f, '.finder-team', team.ioc + ' ' + shortCat(c));
      (function () {
        var box = $('.finder-team', f) || $('.finder-card-head', f);
        var old2 = $('.finder-result-mk', f);
        if (old2) old2.remove();
        var mk = siteStatus(team);
        if (!mk || !box) return;
        var m = document.createElement('div');
        m.className = 'el-05-StatusBadge--marker-' + mk +
                      ' marker marker-' + mk + ' cut cut-s finder-result-mk';
        m.innerHTML = '<span class="lbl">' + mk.toUpperCase() + '</span>';
        box.appendChild(m);
      })();
      text(f, '.finder-pts', tot.points);
      text(f, '.finder-ratio', pctRatio(tot.played ? tot.won / tot.played : null));
      text(f, '.finder-record', tot.played ? tot.won + '\u2013' + (tot.played - tot.won) : '\u2014');
      text(f, '.finder-played', tot.stops + ' of ' + (c.stopCount || 0));
      link($('.finder-goteam', f), 'team.html?ioc=' + team.ioc);
      link($('.finder-goconf', f), 'conference.html?id=' + team.conference);
      step(4);
    }

    var browse = $('.finder-browse', f);
    if (browse) link(browse, 'teams.html');
    step(1);
  }

  /* ---------- page renderers -------------------------------- */
  var PAGES = {};

  /* One accordion open at a time. Two pages want it — Live now on the
     landing page and the season list on Conferences — so the wiring
     lives here rather than being written out twice. The shell's toggle
     runs on a delegated document listener that fires after this one,
     so the decision is taken a tick later. */
  /* Review 15 — Alex, of the table inside the live conference:
     "Not clear that this is. Look like the conference standings,
     that is ok." It is, so it says so. The caption also carries
     the stop the table stands after, which is what the head used
     to repeat next to the dots. */
  /* Review 18 — the accordion's table, boxed so the WT builder owns
     it and the caption and the links around it stay put. */
  function accTable(node) {
    var body = $('.acc-body', node);
    if (!body) return null;
    var cap = $('.acc-cap', body);
    if (cap && cap.parentNode && !cap.parentNode.classList.contains('acc-capline')) {
      var line = el('div', 'acc-capline');
      cap.replaceWith(line);
      line.appendChild(cap);
      line.appendChild(el('div', 'acc-gslot'));
    }
    var tbl = $('.acc-tbl', body);
    if (tbl) return tbl;
    var scroll = el('div', 'wt-scroll');
    tbl = el('div', 'tbl wt-tbl acc-tbl');
    scroll.appendChild(tbl);
    var head = $('.thead', body);
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
    return tbl;
  }

    /* Review 19 — an open accordion offers two ways on, in the order
       a reader wants them: the conference the standings belong to,
       then the stop being played. The second link is the one the
       markup ships and the one review16 relabels ("Follow this stop"
       / "See the last stop"); the first is added here and carries
       .acc-conf-lnk so that relabelling leaves it alone.

       repeat() clones an already-painted accordion as its template, so
       the link is looked for before it is made — otherwise every
       repaint would add another one. */
  function accLinks(node, e) {
    var acts = $('.acc-actions', node);
    if (!acts) return;
    var stopLnk = $('.lnk:not(.acc-conf-lnk)', acts);
    var confLnk = $('.acc-conf-lnk', acts);
    if (!confLnk && stopLnk) {
      confLnk = stopLnk.cloneNode(true);
      confLnk.classList.add('acc-conf-lnk');
      confLnk.removeAttribute('data-stop-href');
      acts.insertBefore(confLnk, acts.firstChild);
    }
    var href = 'conference.html?id=' + e.conference;
    if (confLnk) {
      var lbl = $('.lbl', confLnk) || confLnk;
      lbl.textContent = 'View conference';
      link(confLnk, href);
    }
    if (stopLnk) link(stopLnk, href);
  }

  function accCaption(node, c, e, all) {
    var cap = $('.acc-cap', node);
    if (!cap) return;
    var of = c.stopCount || (all || []).length;
    cap.textContent = 'Conference standings' +
      (e && e.number ? ' \u00b7 after stop ' + e.number + ' of ' + of : '');
  }

  function soloAccordions(host) {
    if (!host) return;
    var accs = $$('.acc', host);
    accs.forEach(function (a) {
      var head = $(':scope > .acc-head', a);
      if (!head || head._solo) return;
      head._solo = 1;
      head.addEventListener('click', function () {
        setTimeout(function () {
          if (a.getAttribute('data-open') !== 'true') return;
          $$('.acc', host).forEach(function (x) {
            if (x !== a && x.getAttribute('data-open') === 'true' && window.FIBA) {
              window.FIBA.closeAccordion(x);
            }
          });
        }, 0);
      });
    });
  }

  var NL_PLACE_GENDER = null, NL_PARK_GENDER = null;
  PAGES['index.html'] = function () {
    /* ---- Live now -------------------------------------------
       LP-17, and Johannes' note on the strip: only offer days that have
       something under them. The strip is built from the days that
       actually carry play, not from consecutive dates, so there is no
       empty day left to land on.

       Two independent pieces of state. `sel` is the day whose
       conferences are shown below; `win` is the first day visible in
       the strip. Clicking a day changes `sel` and nothing else, so the
       cell stays exactly where it was clicked. Prev and Next move
       `win` and leave `sel` alone — the strip travels, the selection
       does not. */
    var SLOTS = 8;
    var region = 'All';
    var days = [], sel = 0, win = 0, gender = 'men';

    function iso(d) { return isoDay(d); }

    function inRegion(e) {
      return region === 'All' || regionOf(conf(e.conference)) === region;
    }
    /* A day has something under it when a stop is being played on it —
       results if we hold them, the fixture if we do not. Filtering on
       results alone dropped every stop the snapshot has not caught up
       with, which is why the strip skipped from 17 to 20 August while
       Asia SEA was mid-conference. */
    function hasContent(e) { return !!e.slug; }
    function hasResults(e) {
      var s = standingsFor(e.slug);
      return !!(s && s.rows && s.rows.some(function (r) { return (r.played || 0) > 0; })) ||
             gamesFor(e.slug).some(function (g) { return g.home && g.home.score != null; });
    }
    function stopsOn(dateISO) {
      return D.events.filter(function (e) {
        return e.start && inRegion(e) && hasContent(e) &&
               e.start <= dateISO && (e.end || e.start) >= dateISO;
      });
    }
    /* el-30 CalendarStrip is eight equal days. A region with fewer
       playing days than that used to render a short strip — Oceania is
       one conference, so it showed six — and the module changed shape
       from filter to filter. The days a region plays come first; the
       rest of the eight are the calendar days around them, marked off
       so they read as empty rather than clickable. */
    function playDays() {
      var seen = {};
      D.events.forEach(function (e) {
        if (e.start && inRegion(e) && hasContent(e)) seen[e.start] = 1;
      });
      return Object.keys(seen).sort();
    }
    function pad(list, n) {
      if (list.length >= n) return list;
      var out = list.slice();
      var day = shiftDay;
      var guard = 0;
      while (out.length < n && guard++ < 200) {
        out.push(day(out[out.length - 1], 1));
        if (out.length < n) out.unshift(day(out[0], -1));
      }
      return out.sort();
    }
    function dayList() { return pad(playDays(), SLOTS); }
    /* Open on the most recent day that had basketball rather than on an
       empty today. */
    /* Today when a stop is on today, otherwise the most recent day that
       had one. */
    function nearest(list) {
      var t = iso(new Date()), play = {};
      playDays().forEach(function (d) { play[d] = 1; });
      for (var i = list.length - 1; i >= 0; i--) if (list[i] <= t && play[list[i]]) return i;
      for (var j = 0; j < list.length; j++) if (play[list[j]]) return j;
      return 0;
    }
    function clampWin() {
      win = days.length <= SLOTS ? 0
          : Math.max(0, Math.min(win, days.length - SLOTS));
    }
    function centre() {
      win = sel - Math.floor(SLOTS / 2) + 1;
      clampWin();
    }

    days = dayList();
    sel = nearest(days);
    centre();

    var strip = $('.s03, .s03wrap');
    var accHost = ($('.acc') || {}).parentElement;

    function drawStrip() {
      if (!strip) return;
      var view = days.slice(win, win + SLOTS);
      var play = {};
      playDays().forEach(function (d) { play[d] = 1; });
      repeat(strip, '.s03-d', view, function (cell, dISO) {
        var d = new Date(dISO + 'T00:00:00');
        cell.classList.toggle('s03-on', dISO === days[sel]);
        /* padding days are shown so the strip keeps its eight, but they
           are not offers */
        cell.classList.toggle('s03-off', !play[dISO]);
        /* The red dot means live now. Every day in the strip has play,
           so marking them all made the whole season look live. */
        cell.classList.toggle('s03-live', dISO === iso(new Date()) && !!play[dISO]);
        text(cell, '.s03-num', d.getDate());
        text(cell, '.s03-dow', d.toLocaleDateString('en-GB', { weekday: 'short' }).toUpperCase());
        text(cell, '.s03-mon', d.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase());
        cell.onclick = function () {
          if (!play[dISO]) return;
          sel = days.indexOf(dISO);
          drawStrip(); drawLive();
        };
      });
      $$('.s03nav', strip).forEach(function (b, i) {
        var back = i === 0;
        b.classList.toggle('s03nav-off',
          back ? win === 0 : win >= days.length - SLOTS);
        if (b._wired) return;
        b._wired = 1;
        b.addEventListener('click', function () { page(back ? -1 : 1); });
      });
    }

    /* The window slides a full page at a time and the movement is shown,
       so it is clear the strip travelled rather than the data changed. */
    function page(dir) {
      var was = win;
      win += dir * SLOTS;
      clampWin();
      if (win === was) return;
      drawStrip();
      var host = $('.s03', strip) || strip;
      host.classList.remove('s03-in-l', 's03-in-r');
      void host.offsetWidth;
      host.classList.add(dir > 0 ? 's03-in-r' : 's03-in-l');
    }

    function drawLive() {
      if (!accHost) return;
      var old = accHost.querySelector(':scope > .site-empty');
      if (old) old.remove();
      var dISO = days[sel];
      var evs = dISO ? stopsOn(dISO) : [];
      if (!evs.length) {
        $$('.acc', accHost).forEach(function (a) { a.hidden = true; });
        emptyState(accHost, 'Nothing on this day',
                   'Pick another date, or see every conference.',
                   { icon: 'calendar', href: 'calendar.html', action: 'Full calendar' });
        return;
      }
      $$('.acc', accHost).forEach(function (a) { a.hidden = false; });
      paintAccordions(evs.slice(0, 6), dISO);
      if (window.FIBA) window.FIBA.init(accHost);
      soloAccordions(accHost);
      if (NL_PLACE_GENDER) NL_PLACE_GENDER();
      /* a stop that is on but has no results in the feed yet */
      $$('.acc', accHost).forEach(function (a) {
        var rows = $$('.trow', a).filter(function (r) { return !r.hidden; });
        var note = $('.acc-note', a);
        if (rows.length) { if (note) note.hidden = true; return; }
        if (!note) {
          note = document.createElement('div');
          note.className = 'acc-note t-body-s';
          ($('.acc-body', a) || a).appendChild(note);
        }
        note.hidden = false;
        note.textContent = 'Results are published as the stop is played.';
      });
    }

    function paintAccordions(evs, dISO) {
      var today = iso(new Date());
      if (NL_PARK_GENDER) NL_PARK_GENDER();
      repeat(accHost, '.acc', evs, function (node, e) {
        var c = conf(e.conference) || {};
        var g = gender;
        var all = stopsOfConference(c.id);
        /* Counted off the calendar, not off the snapshot: a stop that
           has started belongs on the dots whether or not its results
           have landed yet. */
        var played = all.filter(function (x) { return x.start && x.start <= dISO; }).length;
        /* Live is a fact about today, not about the day being browsed. */
        var live = e.start <= today && (e.end || e.start) >= today;

        text(node, '.t-h3', confName(c));
        var meta = $$('.acc-head .t-body-s', node)[0];
        /* Review 15 — the head said "Kigali · Stop 5 of 6" with the
           el-06 dots printing "Stop 5 of 6" an inch to its right. The
           head keeps the place; the stop is stated once, by the dots,
           and once more by the caption over the table below. */
        if (meta) meta.textContent = e.city;
        accCaption(node, c, e, all);
        var badge = $('.acc-head .badge', node);
        if (badge) badge.hidden = !live;
        text(node, '.acc-head .t-caption',
             'Stop ' + e.number + ' of ' + (c.stopCount || all.length));
        $$('.dot', node).forEach(function (d, i) {
          d.classList.toggle('dot-done', i < played);
          d.classList.toggle('dot-live', live && i === played - 1);
        });

        var rows = conferenceTable(c.id, g, dISO);
        var complete = all.length && played >= all.length;
        /* Review 18 — the World Tour column set: position, federation,
           tour points, every stop with its finish over the points it
           paid, then win ratio, points average and status. The
           federation cell is the flag and the IOC code, because six
           stop columns leave no room for the country's name. */
        rows.forEach(function (r) {
          r.status = (complete && r.rank === 1 && r.tour > 0) ? 'q' : 'r';
        });
        var atbl = accTable(node);
        if (atbl) {
          if (!rows.length) atbl.innerHTML = '';
          else wtTable(atbl, rows, all, { limit: 6, seed: true });
        }
        accLinks(node, e);
      });
    }

    /* Review 18 — one switch still, but it rides with the table it
       changes. In the filter bar it sat above six closed accordions
       and read as a filter on all of them; at the head of the open
       one, on the same line as "Conference standings · after stop 5
       of 6", it says exactly what it governs. It is moved, never
       cloned: parked back in the filter bar before every repaint,
       because repeat() clones the first accordion and a switch left
       inside would be duplicated six times. */
    var gpark = $('.filterbar');
    gender = genderSwitch(function (g) { gender = g; drawLive(); },
                          gpark) || 'men';
    var gsw = gpark && $('.el02', gpark);

    function parkGender() { if (gsw && gpark) gpark.appendChild(gsw); }
    function placeGender() {
      if (!gsw || !accHost) return;
      var open = $$('.acc', accHost).filter(function (a) {
        return a.getAttribute('data-open') === 'true';
      })[0];
      var slot = open && $('.acc-gslot', open);
      if (slot) { if (gsw.parentNode !== slot) slot.appendChild(gsw); }
      else if (gpark && gsw.parentNode !== gpark) gpark.appendChild(gsw);
    }
    if (accHost && window.MutationObserver) {
      new MutationObserver(function () { placeGender(); })
        .observe(accHost, { attributes: true, subtree: true,
                            attributeFilter: ['data-open'] });
    }
    NL_PLACE_GENDER = placeGender;
    NL_PARK_GENDER = parkGender;

    region = chipFilter(function (r) {
      region = r;
      var keep = days[sel];
      days = dayList();
      sel = days.indexOf(keep);
      if (sel < 0) sel = nearest(days);
      centre();
      drawStrip();
      drawLive();
    }) || 'All';

    drawStrip();
    drawLive();

    /* Qualification — LP-12: only the twenty that reach the U23 World
       Cup. Position, flag, country, and a Qualified or Shortlisted
       label. The host federation takes one of the twenty places, so
       nineteen come through the league.

       The feed carries no qualification flag yet, so the split is
       derived from tour points: the leading twelve read as Qualified,
       the next eight as Shortlisted. Swap the two lines below for the
       real field once the feed provides it. */
    var QUALIFIED = 12, FIELD = 20;
    (function () {
      var board = $('.r01');
      if (!board) return;
      var gender = 'men';

      function drawBoard() {
        var list = federationTable(gender, 'U23').slice(0, FIELD);
        repeat(board, '.r01-row', list, function (row, t, i) {
          text(row, '.r01-pos .t-data-m', i + 1);
          fed(row, t.ioc, t.team);
          var confCell = $('.r01-conf', row);
          if (confCell) confCell.remove();          /* LP-12: no conference column */
          var badge = $('.badge, .marker', row);
          var qualified = i < QUALIFIED;
          if (badge) {
            badge.classList.remove('badge-q', 'badge-s', 'marker-q', 'marker-s');
            badge.classList.add(qualified ? 'badge-q' : 'badge-s');
            var lbl = $('.lbl', badge) || badge;
            lbl.textContent = qualified ? 'Qualified' : 'Shortlisted';
          }
          link(row, 'team.html?ioc=' + t.ioc);
        });
        var cut = $('.r01-cut', board);
        if (cut) {
          var note = $('.t-caption, .t-body-s', cut);
          if (note) note.textContent = 'Host federation + ' + (FIELD - 1) + ' qualifiers = ' + FIELD + ' teams';
        }
      }

      var col = board.closest('.tpl-colR');
      if (col) col.classList.add('col-3');          /* three of twelve */
      var more = col && $$('.lnk', col)[0];
      if (more) link(more, 'standings.html?view=qualification');
      gender = genderSwitch(function (g) { gender = g; drawBoard(); }, $('.r01-ctl'));
      drawBoard();
    })();

    /* News — C-02 NewsRail, layout = feature: two across, the image
       over the headline and the date. Two is the layout, not a cap that
       happens to match the feed. */
    repeat(document, '.c02-hcard, .c02-card', D.news.slice(0, 2), function (card, n) {
      text(card, '.c02-title', n.title);
      var cap = $('.t-caption', card);
      if (cap) cap.textContent = fmtDate(n.date);
      photo($('.c02-himg, .c02-img', card), img(n.thumb, 900), true);
      link(card, 'article.html?id=' + n.slug);
    });

    /* Photos — the most recent shoots of the season, newest first. */
    paintPhotos(photosFor(D.events).slice(0, 12));

    /* Find a team — E-01 TeamFinder, four steps */
    mountFinder();

    paintOverview();

  };

  /* S-09 Overview, on whichever page carries it. The landing page shows
     the conferences line alone; the Conferences page shows both. The
     figures are the same either way, so the painter is one. */
  function paintOverview() {
    var host = $('.s09');
    if (!host) return;
    var today = isoDay(new Date());
    var stopsOfC = {};
    D.events.forEach(function (e) {
      (stopsOfC[e.conference] = stopsOfC[e.conference] || []).push(e);
    });
    var finished = 0, live = 0;
    D.conferences.forEach(function (c) {
      var evs = stopsOfC[c.id] || [];
      if (evs.length && evs.every(function (e) { return stopPlayed(e, today); })) finished++;
      if (evs.some(function (e) { return stopLive(e, today); })) live++;
    });
    var totalC = D.conferences.length;
    var stopsDone = playedStops().length, stopsAll = D.events.length;
    var stopsLive = D.events.filter(function (e) { return stopLive(e, today); }).length;

    /* Review 15 — the Teams line is filled by name, and the two
       counted lines are addressed without it: adding a third line
       to the landing page would otherwise have handed it the stop
       figures, which belong to the Conferences page. */
    var lines = $$('.s09-line', host).filter(function (l) {
      return !l.classList.contains('s09-line-teams');
    });
    var seenIoc = {};
    D.teams.forEach(function (t) { if (t.ioc) seenIoc[t.ioc] = 1; });
    text(host, '.s09-kv-sites', D.teams.length);
    text(host, '.s09-kv-nations', Object.keys(seenIoc).length);
    function fill(line, vals) {
      if (!line) return;
      var kv = $$('.s09-kv', line);
      vals.forEach(function (v, i) { if (kv[i]) kv[i].textContent = v; });
      var lk = $('.s09-k-live, .s09-k-live2', line);
      if (lk) lk.hidden = !vals[3];
    }
    fill(lines[0], [totalC, finished, totalC - finished, live]);
    /* "1 live" was printed on both lines and read as two separate live
       things. It is one figure about one moment in the season, so it is
       stated once, on the first line. */
    fill(lines[1], [stopsAll, stopsDone, stopsAll - stopsDone, 0]);

    /* The bar is read in the same unit as the line above it: the
       landing page counts conferences, the Conferences page counts
       stops. Otherwise the line says "1 live" and the bar has nothing
       red in it, which is what it was doing. */
    var byConf = host.classList.contains('s09-conf');
    var total = byConf ? totalC : stopsAll;
    var done  = byConf ? finished : stopsDone;
    var now   = byConf ? live : stopsLive;
    var pctDone = total ? (done / total) * 100 : 0;
    var pctLive = total ? (now / total) * 100 : 0;

    var fillbar = $('.s09-fill', host);
    if (fillbar) {
      var target = (pctDone + pctLive).toFixed(2) + '%';
      /* First paint runs the bar out from zero, so the number is read
         as a measurement being taken. Every later repaint — the gender
         switch, a date change — just moves it, because replaying the
         run each time would read as the season restarting. */
      if (fillbar._ran) {
        fillbar.style.width = target;
      } else {
        fillbar._ran = 1;
        fillbar.style.width = '0%';
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            fillbar.classList.add('s09-fill-run');
            fillbar.style.width = target;
          });
        });
      }
    }
    var seg = $('.s09-done', host), segLive = $('.s09-live', host);
    /* Flex shares rather than widths: the two segments divide whatever
       the fill is, so a live-only season still shows red. */
    if (seg) {
      seg.hidden = !done;
      seg.style.flex = String(Math.max(pctDone, 0.001));
    }
    if (segLive) {
      segLive.hidden = !now;
      segLive.style.flex = String(Math.max(pctLive, 0.001));
    }
  }

  /* E-01 TeamFinder replaces the plain search field in whichever block
     asks for it. */
  /* Review 18 (second pass) — on the landing page Find a team was the
     last block before the news, four screens below the fold. It
     answers the first question a reader arrives with, so it goes
     directly under Overview, above Live now. */
  function finderUnderOverview() {
    var colL = $('.home-split .tpl-colL');
    var fdr = $('.finder');
    if (!colL || !fdr || !fdr.closest) return;
    var fsec = fdr.closest('.tpl-sub');
    if (!fsec || fsec.parentNode === colL) return;
    var ov = $('.s09');
    var ovSec = ov && ov.closest('.tpl-sub');
    if (ovSec && ovSec.parentNode === colL) colL.insertBefore(fsec, ovSec.nextSibling);
    else colL.insertBefore(fsec, colL.firstChild);
  }

  function mountFinder() {
    var sub = $$('.tpl-sub').filter(function (x) {
      return /find a team/i.test((x.querySelector('.t-h2') || {}).textContent || '');
    })[0];
    if (!sub) return;
    var old = $('.search', sub);
    if (!old) return;
    fetch('partials/finder.html').then(function (r) { return r.text(); })
      .then(function (html) {
        var host = document.createElement('div');
        host.innerHTML = html;
        var f = host.querySelector('.finder');
        old.replaceWith(f);
        initFinder(f);
        if ((document.body.dataset.page || '') === 'index.html') {
          try { finderUnderOverview(); } catch (e) {}
        }
        if (window.FIBA) window.FIBA.init(sub);
      });
  }

  PAGES['conferences.html'] = function () {
    mountFinder();
    paintOverview();

    var today = isoDay(new Date());
    function statusOf(c) {
      var evs = stopsOfConference(c.id);
      var played = playedCount(c.id, today);
      var live = evs.some(function (e) { return stopLive(e, today); });
      return { evs: evs, played: played, live: live,
               done: played >= evs.length && evs.length > 0 };
    }

    /* Federations in a conference: the same set in both genders, so one
       pass over the men's entries names them all. */
    function fedsOf(c) {
      var seen = {}, out = [];
      D.teams.forEach(function (t) {
        if (t.conference !== c.id || !t.ioc || seen[t.ioc]) return;
        seen[t.ioc] = 1;
        out.push(t);
      });
      out.sort(function (a, b) { return a.ioc.localeCompare(b.ioc); });
      return out;
    }

    var groups = REGIONS.map(function (r) {
      return { region: r, items: D.conferences.filter(function (c) { return regionOf(c) === r; }) };
    }).filter(function (g) { return g.items.length; });

    repeat($('.e03'), '.e03-group', groups, function (grp, g) {
      text(grp, '.e03-region', g.region);
      /* The card is wrapped in .sh: a drop-shadow on a clip-path surface
         is clipped away with the corners, so elevation has to sit on an
         unclipped layer above it. Same reason E-08 PlayerCard ships in
         .sh sh-e1. The wrapper is what repeat() paints. */
      repeat(grp, '.e03-sh', g.items, function (wrap, c) {
        var card = $('.e03-card', wrap) || wrap;
        var st = statusOf(c);
        text(card, '.e03-name', confName(c));
        var badge = $('.badge', card);
        if (badge) badge.hidden = !st.live;
        card.classList.toggle('brandstroke', st.live);
        text(card, '.e03-prog', st.played + ' of ' + st.evs.length + ' stops');
        $$('.dot', card).forEach(function (d, i) {
          d.classList.toggle('dot-done', i < st.played);
          d.classList.toggle('dot-live', st.live && i === st.played);
        });
        var feds = fedsOf(c);
        if (feds.length) {
          repeat(card, '.ftag', feds, function (tag, t) {
            /* el-13 FederationTag at size S, the filled variant — the
               plain one is a bare flag and code, which is what E-03 was
               drawing and what the card was meant to replace.
               ftag-static drops the hover and the pointer: the card is
               one target, and a tag that lit up under the cursor read as
               a second, smaller link inside it that went somewhere else. */
            tag.classList.remove('ftag-plain');
            tag.classList.add('ftag-s');
            tag.classList.add('ftag-static');
            flag(tag, t.ioc);
            text(tag, '.ftag-code', t.ioc);
            tag.title = cleanTeam(t.name);
          });
        } else {
          var box = $('.e03-feds', card);
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
                          : ('conference.html?id=' + c.id));
      });
    });
  };

  /* ---- Review 18 (second pass): one tab strip for a conference
     A conference and its six stops are one thing with seven views,
     and they were two pages with two navigations. The strip is built
     once here and drawn on both: on the conference page Overview is
     the tab you are on, on a stop page it is the way back and the
     stop you are on is marked. A stop is never a page on its own any
     more — it is always the conference, on one of its stops. */
  function confTabs(c, activeSlug) {
    var stops = stopsOfConference(c.id);
    var today = isoDay(new Date());
    var strip = el('div', 'ctl-03-Tab--default tabs cnf-stoptabs');
    var ov = el('div', 'tab' + (activeSlug ? '' : ' tab-active'),
                '<span class="cnf-tab-n">Overview</span>');
    if (activeSlug) {
      ov.setAttribute('role', 'link');
      ov.setAttribute('tabindex', '0');
      link(ov, 'conference.html?id=' + c.id);
    }
    strip.appendChild(ov);
    stops.forEach(function (e) {
      var played = stopPlayed(e, today);
      var live = stopLive(e, today);
      var here = activeSlug === e.slug;
      var t = el('div', 'tab' + (here ? ' tab-active' : '') +
                        (live ? ' cnf-tab-live' : '') +
                        (played ? ' cnf-tab-done' : '') +
                        (!played && !live ? ' tab-disabled' : ''),
                 '<span class="cnf-tab-n">STOP ' + e.number + '</span>');
      if (live) t.appendChild(el('div', 'f03-dot'));
      /* An upcoming stop has no squads and no results; it is stated
         and not offered. */
      if ((played || live) && !here) {
        t.setAttribute('role', 'link');
        t.setAttribute('tabindex', '0');
        link(t, 'stop.html?id=' + e.slug);
      } else if (!played && !live) {
        t.setAttribute('aria-disabled', 'true');
        t.title = 'Not played yet';
      }
      strip.appendChild(t);
    });
    return strip;
  }

  /* ctl-03 Tab as a pane switch. Panes are marked in the markup with
     data-pane, so adding a block to a tab is a markup change and not a
     JavaScript one. */
  function tabPanes(scope, tabsSel) {
    var tabs = $$(tabsSel + ' .tab', scope || document);
    if (!tabs.length) return;
    function show(name) {
      tabs.forEach(function (t) {
        t.classList.toggle('tab-active', t.dataset.tab === name);
      });
      $$('[data-pane]', scope || document).forEach(function (p) {
        p.hidden = p.dataset.pane !== name;
      });
    }
    tabs.forEach(function (t) { t.onclick = function () { show(t.dataset.tab); }; });
    show((tabs.filter(function (t) { return t.classList.contains('tab-active'); })[0] || tabs[0]).dataset.tab);
  }

  /* E-08 PlayerCard: tip towards the pointer. The angles are written as
     custom properties so the transform itself stays in motion.css. */
  function tiltCards(root) {
    $$('.pcard-sh', root || document).forEach(function (sh) {
      if (sh._tilt) return;
      sh._tilt = 1;
      var card = $('.pcard', sh);
      if (!card) return;
      /* The layer is added here rather than in fourteen markup files,
         so a card added anywhere later still reflects. */
      var shine = $('.pcard-shine', card);
      if (!shine) {
        shine = document.createElement('div');
        shine.className = 'pcard-shine';
        card.appendChild(shine);
      }
      sh.addEventListener('pointermove', function (ev) {
        var r = sh.getBoundingClientRect();
        var x = (ev.clientX - r.left) / r.width - 0.5;
        var y = (ev.clientY - r.top) / r.height - 0.5;
        card.style.setProperty('--tilt-y', (x * 12).toFixed(2) + 'deg');
        card.style.setProperty('--tilt-x', (-y * 8).toFixed(2) + 'deg');
        if (shine) {
          shine.style.setProperty('--shine-p', (30 + (x + 0.5) * 40).toFixed(0) + '%');
          shine.style.setProperty('--shine-a', (100 + y * 30).toFixed(0) + 'deg');
        }
      });
      sh.addEventListener('pointerleave', function () {
        card.style.setProperty('--tilt-y', '0deg');
        card.style.setProperty('--tilt-x', '0deg');
      });
    });
  }

  PAGES['conference.html'] = function () {
    var c = conf(qs.get('id')) || D.conferences[0];
    var stops = D.events.filter(function (e) { return e.conference === c.id; })
                        .sort(function (a, b) { return (a.number || 0) - (b.number || 0); });
    var played = stops.filter(function (e) { return standingsFor(e.slug); });
    var gender = 'men';

    /* Review 14 — the Stops tab opens on what is being played.
       A conference is read to find out where it is right now, so
       the tab lands on the live stop while one is on, and on the
       last stop that has taken place once the day is over.
       Played is a calendar fact, not a snapshot fact — a stop
       whose results have not been ingested has still happened,
       which is why this counts stopPlayed() and not standings. */
    function defaultStop() {
      var live = -1, last = -1;
      stops.forEach(function (e, i) {
        if (stopLive(e, today)) live = i;
        if (stopPlayed(e, today)) last = i;
      });
      if (live > -1) return live;
      if (last > -1) return last;
      return 0;   /* nothing has been played yet: the first stop is next */
    }
    var sel = defaultStop();

    $$('.f04-h1, .f04-h1-m, .f04-h1-s, .t-h1, .e02-name, .f04-title').forEach(function (n) {
      n.textContent = confName(c);
    });
    crumbs([{ label: 'Home', href: 'index.html' },
            { label: 'Conferences', href: 'conferences.html' },
            { label: confName(c) }]);

    var sub = $('.f04-idl .t-body-s');
    if (sub && stops.length) {
      var cities = [];
      stops.forEach(function (e) { var n = cityOf(e); if (n && cities.indexOf(n) === -1) cities.push(n); });
      var first = stops[0].start, last = stops[stops.length - 1].end || stops[stops.length - 1].start;
      sub.textContent = cities.slice(0, 2).join(' · ') +
        (cities.length > 2 ? ' +' + (cities.length - 2) : '') +
        ' · ' + fmtDate(first, { day: 'numeric', month: 'short' }) +
        ' – ' + fmtDate(last, { day: 'numeric', month: 'short' });
    }

    var today = isoDay(new Date());
    /* The conference is over when its last stop has been played, not
       when the snapshot has caught up with every stop's results. */
    var complete = !!stops.length && stops.every(function (e) { return stopPlayed(e, today); });

    /* ---- Overview: the standings ---- */
    function drawStandings() {
      var tbl = $$('.tbl').filter(function (x) {
        return !x.classList.contains('s11') && !x.classList.contains('games-tbl');
      })[0];
      if (!tbl) return;
      var rows = conferenceTable(c.id, gender);
      var oldT = tbl.parentElement.querySelector(':scope > .site-empty');
      if (oldT) oldT.remove();
      if (!rows.length) {
        $$('.trow', tbl).forEach(function (r) { r.hidden = true; });
        emptyState(tbl.parentElement, 'No table yet',
                   'The conference table is built from played stops.',
                   { icon: 'clock' });
        return;
      }
      /* Review 18 — the same table the landing page's Live now
         accordion draws, because a reader who opens the accordion
         and then opens the conference is reading one thing twice
         and should not have to learn two column sets to do it. */
      rows.forEach(function (r) {
        r.status = (complete && r.rank === 1 && r.tour > 0) ? 'q' : 'r';
      });
      /* Review 18 — Africa North and Africa South run U23 and U21
         sides in ONE standings table (the feed marks the U21 ones by
         a suffix on the name, and cleanTeam() takes the suffix off
         because the category is its own thing now). Where a table
         holds both, it says which is which under the code; where it
         holds one, the heading already said it. */
      var mixed = rows.some(function (r) { return r.cat !== rows[0].cat; });
      /* Review 19 — Seed is the third column here too, so the table a
         reader met in the Live now accordion is the same table when
         they open the conference. */
      var wopts = { seed: true };
      if (mixed) wopts.sub = function (r) { return r.cat; };
      wtScroll(tbl);
      wtTable(tbl, rows, stops, wopts);
      $$('.wt-row', tbl).forEach(function (row, i) {
        row.classList.toggle('trow-hi', complete && i === 0);
      });
    }

    /* ---- Overview: leading scorers ---- */
    function drawScorers() {
      var host = $('.e10-scorers');
      if (!host) return;
      var ids = {};
      D.teams.filter(function (t) {
        return t.conference === c.id && (!t.gender || t.gender === gender);
      }).forEach(function (t) {
        (t.roster || []).forEach(function (m) { ids[m.id] = t; });
      });
      var list = Object.keys(ids).map(function (id) {
        var p = player(id);
        return p ? { p: p, team: ids[id] } : null;
      }).filter(Boolean);
      /* Ordered by what they actually scored in this conference, with
         3x3 ranking points as the tie-break for players who have not
         played yet. */
      list.forEach(function (rec) { rec.t = playerTotals(rec.p.id); });
      list.sort(function (a, b) {
        return (b.t.points - a.t.points) ||
               ((b.p.rankingPoints || 0) - (a.p.rankingPoints || 0));
      });
      list = list.slice(0, 4);
      var ban = $('.ban-scorers');
      if (ban) {
        var anyPlayed = list.some(function (rec) { return rec.t.games; });
        if (anyPlayed) {
          ban.hidden = true;
        } else {
          ban.hidden = false;
          text(ban, '.ban-t', 'No games played in this conference yet');
          text(ban, '.ban-d', 'Cards are ordered by FIBA 3x3 ranking points until there are results.');
        }
      }
      var oldS = host.parentElement.querySelector(':scope > .site-empty');
      if (oldS) oldS.remove();
      if (!list.length) {
        host.hidden = true;
        emptyState(host.parentElement, 'No squads entered yet',
                   'Leading scorers appear once federations name their rosters.',
                   { icon: 'clock' });
        return;
      }
      host.hidden = false;
      repeat(host, '.pcard-sh', list, function (card, rec) {
        paintPlayerCard(card, rec.p, playerCardStats(rec.p));
      });
      tiltCards(host);
    }

    /* ---- Overview: highlights ---- */
    function drawHighlights() {
      var host = $('.cnf-kpis');
      if (!host) return;
      var games = [];
      stops.forEach(function (e) { games = games.concat(gamesFor(e.slug, gender)); });
      var scored = games.filter(function (g) { return g.home && g.home.score != null; });
      var pts = scored.reduce(function (a, g) { return a + g.home.score + g.away.score; }, 0);
      var table = conferenceTable(c.id, gender);
      var best = table.slice().sort(function (a, b) { return b.winRatio - a.winRatio; })[0];
      var v = $$('.kpi-v', host);
      if (v[0]) v[0].textContent = scored.length || '—';
      if (v[1]) v[1].textContent = best ? (best.winRatio * 100).toFixed(0) + '%' : '—';
      if (v[2]) v[2].textContent = table.length || '—';
      /* Points per game is what one team scores in a game, not what the
         two of them score between them — the figure read 31 in a
         competition where 21 wins it. */
      if (v[3]) v[3].textContent = scored.length ? (pts / (scored.length * 2)).toFixed(1) : '—';
    }

    /* ---- Stops: the selector, the matrix, the games ---- */
    /* Review 18 (second pass) — the dot rail is gone and the tab
       strip replaced it, but the S-02 timeline came up into Overview
       and still has to be painted: left unpainted it showed the
       specimen's African cities under an Asian conference. It states
       the season and no longer selects anything — the tabs do that. */
    function drawTimeline() {
      repeat($('.s02') || document, '.s02-stop, .s02-i', stops, function (node, e, i) {
        var has = stopPlayed(e, today);
        var live = stopLive(e, today);
        node.classList.toggle('s02-done', has);
        node.classList.toggle('s02-live', live);
        node.classList.remove('s02-on');
        text(node, '.s02-city, .t-label', cityOf(e));
        text(node, '.t-caption', live ? 'Live'
                                      : fmtDate(e.start, { day: 'numeric', month: 'short' }));
        if (has || live) {
          node.style.cursor = 'pointer';
          link(node, 'stop.html?id=' + e.slug);
        } else {
          node.onclick = null;
          node.style.cursor = '';
        }
      });
    }

    /* One row per federation, one column per stop — the wireframe's
       matrix, sized to however many stops this conference has. */
    /* Review 18 — Stop by stop is removed. With the WT column set on
       the conference standings, every stop is already a column there
       with the finish over the points it paid: the matrix was the
       same rows, the same stops, the same two figures, missing only
       the position and the status. Two tables that differ by two
       columns are one table and a mistake. Daniel's call, on seeing
       them stacked. */
    function drawMatrix() {
      var host = $('.s11');
      var sec = host && host.closest('.tpl-sub');
      if (sec) sec.remove(); else if (host) host.remove();
    }

    /* Picking a stop has to change something. The matrix answers how
       everyone did across the conference; this answers what happened at
       the one that is selected, and hands over to the stop page for the
       pools and the bracket. */
    function drawStop() {
      var e = stops[sel] || stops[0];
      if (!e) return;
      var s = standingsFor(e.slug, gender);
      var placed = (s ? s.rows : []).filter(function (r) { return r.rank; })
                     .slice().sort(function (a, b) { return a.rank - b.rank; }).slice(0, 3);

      text(document, '.cnf-stop-title', 'Stop ' + e.number + ' · ' + cityOf(e));
      text(document, '.cnf-stop-sub', [e.venue, fmtDate(e.start)].filter(Boolean).join(' · '));
      var live = e.start <= today && (e.end || e.start) >= today;
      var badge = $('.cnf-stop-live');
      if (badge) badge.hidden = !live;
      var lnk = $('.cnf-stop-link');
      if (lnk) lnk.setAttribute('href', 'stop.html?id=' + e.slug);
      /* Review 6: a stop that is being played, or has been, has a
         stream. It goes beside the podium rather than under it. */
      stopStream($('.cnf-stop'), e, today, '.cnf-stop-podium');

      var pod = $('.cnf-stop-podium');
      if (pod) {
        pod.innerHTML = '';
        if (!placed.length) {
          emptyState(pod, 'This stop has not been played yet',
                     'The podium and the games appear with the results.');
        } else {
          placed.forEach(function (r) {
            var box = document.createElement('div');
            box.className = 'cnf-pod cut cut-s cut-out cnf-pod-' + r.rank;
            box.innerHTML = '<div class="cutfill"></div>' +
              '<span class="cnf-pod-p">' + ordinal(r.rank) + '</span>' +
              '<div class="el-13-FederationTag--m-both-plain ftag ftag-m cut cut-s ftag-plain">' +
              '<div class="flag flag-ring"></div><div class="ftag-txt">' +
              '<span class="ftag-code">' + r.ioc + '</span>' +
              '<span class="ftag-name">' + r.team + '</span></div></div>';
            pod.appendChild(box);
            flag($('.flag', box), r.ioc);
            link(box, 'team.html?ioc=' + r.ioc);
          });
        }
      }
    }

    function drawGames() {
      /* `sel` indexes the conference's stops, not the played ones —
         reading it out of `played` showed the wrong stop's games and
         made the tab look inert. */
      var e = stops[sel] || stops[0];
      var tbl = $('.games-tbl');
      if (!tbl || !e) return;
      var gl = gamesFor(e.slug, gender);
      var day = $('.games-day .t-caption', tbl);
      if (day) day.textContent = gl.length
        ? fmtDate(e.start, { weekday: 'long', day: 'numeric', month: 'long' })
        : '';
      /* A stop with no games says so, rather than leaving ghost rows at
         45% opacity that read as a disabled table. */
      var host = tbl.parentElement;
      var old = host.querySelector(':scope > .site-empty');
      if (gl.length) {
        if (old) old.remove();
        tbl.hidden = false;
        repeat(tbl, '.trow', gl, paintGame);
      } else {
        tbl.hidden = true;
        emptyState(host, 'No games for this stop yet',
                   'The schedule and the results are published as the stop is played.',
                   { icon: 'clock' });
      }
    }

    function draw() {
      drawStandings();
      drawScorers();
      drawHighlights();
      drawTimeline();
      /* The stop detail and its game list were the Stops pane; they
         live on the stop pages now and their hosts are no longer on
         this page. */
      paintPhotos(photosFor(stops).slice(0, 12));
      if (window.FIBA) window.FIBA.init(document);
    }

    /* Review 6: the site navigation puts a pulsing dot beside
       Conferences while something is being played. Inside a
       conference the same fact belongs on the tab that holds the
       stops, so the tab strip answers "is it on now" too. */
    function markLiveTab() {
      var t = $$('.cnf-tabs .tab').filter(function (x) {
        return x.dataset.tab === 'stops';
      })[0];
      if (!t) return;
      var live = stops.some(function (e) { return stopLive(e, today); });
      var dot = $('.f03-dot', t);
      if (live && !dot) t.appendChild(el('div', 'f03-dot'));
      if (!live && dot) dot.remove();
    }

    /* ---- Review 18: the stops are tabs -----------------------
       The dot rail stated how far the conference had got but not
       where you could go, and a stop was two clicks away (open
       Stops, then pick a dot). ctl-03 Tab states the structure —
       Overview and six stops, this one is on, these have been
       played, these have not — and each stop goes to that stop.

       Overview is the tab this page is: the timeline, the standings,
       the leading scorers and the photographs. What was behind the
       Stops pane has moved to the stop pages, where it belongs. */
    function buildStopTabs() {
      var old = $('.cnf-tabs');
      if (!old) return;
      var strip = confTabs(c, null);
      strip.classList.add('cnf-tabs');
      old.replaceWith(strip);
    }

    function foldStopsPane() {
      var content = $('.tpl-content') || document.body;
      /* The timeline was inside the stop navigation, which is gone.
         It is a picture of the conference's season, so it opens
         Overview. */
      var tl = $('.s02');
      if (tl) {
        var wrap = el('div', 'tpl-sub cnf-timeline');
        wrap.setAttribute('data-pane', 'overview');
        wrap.appendChild(tl);
        /* Review 19 — Daniel: the timeline reads after the standings,
           not before them. The table answers "where does the
           conference stand"; the timeline answers "how did it get
           here", which is the second question. */
        var stbl = $$('.tbl', content).filter(function (x) {
          return !x.classList.contains('s11') &&
                 !x.classList.contains('games-tbl') &&
                 x.closest('[data-pane="overview"]');
        })[0];
        /* Review 22 — Daniel: the timeline belongs with the tab
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
        }
      }
      $$('[data-pane="stops"]', content).forEach(function (n) { n.remove(); });
      $$('[data-pane="overview"]', content).forEach(function (n) { n.hidden = false; });
    }

    genderSwitch(function (g) { gender = g; draw(); });
    foldStopsPane();
    buildStopTabs();
    draw();
  };

  PAGES['stop.html'] = function () {
    var first = stop(qs.get('id')) || playedStops()[0] || D.events[0];
    var c = conf(first.conference) || {};
    var stops = D.events.filter(function (e) { return e.conference === c.id; })
                        .sort(function (x, y) { return (x.number || 0) - (y.number || 0); });
    var sel = Math.max(0, stops.map(function (e) { return e.slug; }).indexOf(first.slug));
    var today = isoDay(new Date());
    /* The page carried an el-02 GenderSwitch that was wired to nothing:
       the podium, the pools, the bracket and the game list all read the
       men's records and the list printed both genders end to end. */
    /* Review 18 (second pass) — a stop is never a page of its own; it
       is the conference, on one of its stops. The conference's tab
       strip is drawn at the head with this stop marked, so Overview
       and the other five are one click away and a reader never leaves
       the conference they came in through.

       The gender switch that stood at the right of the title goes
       with it: the conference states the gender at its top right and
       the answer is remembered for the tab, so a second switch beside
       a stop's name was a second place to set one thing. */
    var gender = sexGet() || 'men';
    /* Review 20 — Daniel: the Schedule module comes back, at the head
       of the stop that is being played. On Conferences it sat above a
       grid of eighteen and streamed whichever one happened to be on,
       which is why round eighteen took it off that page. Here it has
       exactly one subject: this stop, the recording that actually went
       out behind the play button, and the day's games beside it. A
       stop that is not on has nothing to stream, so the module is
       built only where it has something to say. */
    var liveHere = false;
    (function () {
      var ctl = $('.f04-ctl');
      if (ctl) ctl.remove();
      var f04 = $('.f04');
      if (f04 && f04.parentNode && !$('.cnf-stoptabs')) {
        f04.parentNode.insertBefore(confTabs(c, first.slug), f04.nextSibling);
      }
      /* The dot rail, the timeline under it and the way back out are
         the tab strip's job now. */
      var nav = $('.cnf-stopnav');
      if (nav) nav.remove();
      $$('.cnf-back').forEach(function (n) { n.remove(); });
      $$('.nav-a, .lnk').forEach(function (n) {
        if (/back to stops/i.test(n.textContent || '')) {
          (n.closest('.cnf-back') || n).remove();
        }
      });
    })();

    /* Review 19 — the stop's own name, directly under the tab that
       selected it: "STOP 1 · CANGZHOU" over "China · 10 Aug 2026".
       It is built once and repainted, so switching stops moves the
       text and not the block. */
    function stopHeadline(e) {
      var tabs = $('.cnf-stoptabs');
      if (!tabs || !tabs.parentNode) return;
      var box = $('.stop-idl');
      if (!box) {
        box = el('div', 'stop-idl');
        box.innerHTML = '<h2 class="t-h2 stop-idl-t"></h2>' +
                        '<span class="t-body-s stop-idl-s"></span>';
        tabs.parentNode.insertBefore(box, tabs.nextSibling);
      }
      text(box, '.stop-idl-t', 'Stop ' + e.number + ' · ' + cityOf(e));
      text(box, '.stop-idl-s',
           [e.country, fmtDate(e.start, { day: 'numeric', month: 'short', year: 'numeric' })]
             .filter(Boolean).join(' · '));
    }

    function draw() {
      var e = stops[sel] || first;
      var pool = standingsFor(e.slug, gender) || standingsFor(e.slug);
      var gl = gamesFor(e.slug, gender);
      if (!gl.length) gl = gamesFor(e.slug);

      /* Review 19 — Daniel: the headline stays the conference across
         all seven of its views, so the tab strip changes what is under
         a title that does not move. Which stop is being read is stated
         under the strip instead, by stopHeadline(). */
      $$('.f04-h1, .f04-h1-m, .f04-h1-s, .t-h1, .f04-title').forEach(function (n) {
        n.textContent = confName(c);
      });
      crumbs([{ label: 'Home', href: 'index.html' },
              { label: 'Conferences', href: 'conferences.html' },
              { label: confName(c), href: 'conference.html?id=' + c.id },
              { label: 'Stop ' + e.number }]);
      /* The sub-header is the conference's, exactly as it reads on the
         conference page: its hosts and the span of its season. */
      var sub = $('.f04-idl .t-body-s, .f04-sub');
      if (sub && stops.length) {
        var cities = [];
        stops.forEach(function (x) {
          var nm = cityOf(x);
          if (nm && cities.indexOf(nm) === -1) cities.push(nm);
        });
        var cf = stops[0].start;
        var cl = stops[stops.length - 1].end || stops[stops.length - 1].start;
        sub.textContent = cities.slice(0, 2).join(' · ') +
          (cities.length > 2 ? ' +' + (cities.length - 2) : '') +
          ' · ' + fmtDate(cf, { day: 'numeric', month: 'short' }) +
          ' – ' + fmtDate(cl, { day: 'numeric', month: 'short' });
      }
      stopHeadline(e);

      /* the selector */
      repeat($('.stopnav') || document, '.stopnav-i', stops, function (node, x, i) {
        node.textContent = x.number;
        node.classList.toggle('stopnav-done', stopPlayed(x, today));
        node.classList.toggle('stopnav-live', stopLive(x, today));
        node.classList.toggle('stopnav-on', i === sel);
        node.onclick = function () { sel = i; draw(); };
      });
      repeat($('.s02') || document, '.s02-stop, .s02-i', stops, function (node, x, i) {
        node.classList.toggle('s02-done', stopPlayed(x, today));
        node.classList.toggle('s02-live', stopLive(x, today));
        node.classList.toggle('s02-on', i === sel);
        text(node, '.s02-city, .t-label', cityOf(x));
        text(node, '.t-caption', fmtDate(x.start, { day: 'numeric', month: 'short' }));
        node.onclick = function () { sel = i; draw(); };
      });

      /* S-08 Podium — the stop result, which is the first thing on the
         page per Alex's slide 12 */
      var podium = $('.s08');
      if (podium) {
        var placed = (pool ? pool.rows : []).filter(function (r) { return r.rank; })
          .slice().sort(function (a, b) { return a.rank - b.rank; }).slice(0, 3);
        podium.hidden = !placed.length;
        /* The three plinths are in visual order — silver, gold, bronze —
           so each one is painted by its own place rather than repeated
           from the first, which put the same federation on all three. */
        placed.forEach(function (r) {
          var step = $('.s08-' + r.rank, podium);
          if (!step) return;
          flag(step, r.ioc);
          text(step, '.team-name', r.team);
          text(step, '.s08-pos', r.rank);
        });
      }

      /* A stop that has not been played yet has no pools, no bracket
         and no podium — the draw is published with the results. Rather
         than three empty modules, the page says what is missing. */
      var hasResults = !!(pool && pool.rows && pool.rows.some(function (r) { return r.rank; }));
      $$('.tpl-sub').forEach(function (sec) {
        var t = (sec.querySelector('.t-h2') || {}).textContent || '';
        if (/pools|bracket/i.test(t)) sec.hidden = !hasResults;
      });
      var stub = $('.stop-stub');
      if (!hasResults) {
        if (!stub) {
          stub = document.createElement('div');
          stub.className = 'stop-stub tpl-sub';
          (podium ? podium.parentElement : document.querySelector('.tpl-content'))
            .insertBefore(stub, podium ? podium.nextSibling : null);
        }
        stub.hidden = false;
        emptyState(stub, 'This stop has not been played yet',
                   'Pools, bracket and the podium are published with the results. ' +
                   'The conference table above already counts every stop before it.');
      } else if (stub) {
        stub.hidden = true;
      }
      /* Review 6: the timeline says which stop; the stream says you
         can watch it. It sits under the timeline, on the left, with
         the block that is waiting for the results on the right. */
      /* The stream frame hung off the dot rail; it hangs off the tab
         strip now, which is what the rail became. */
      /* Where the Schedule module is on the page it is the stream,
         so the small frame beside the stub would be a second player
         for the same stop. */
      if (!liveHere) {
        stopStream($('.stop-idl') || $('.cnf-stoptabs'), e, today, '.stop-stub', true);
      }

      /* S-05 Pools. Two tables, and until now both of them were painted
         from the same list: every federation at the stop landed in Pool
         A and Pool B stayed on its specimen row. Which pool a team was
         actually in is in the games, not in the standings table, so the
         pool membership is read off the fixtures. */
      var poolOf = {};
      gl.forEach(function (g) {
        if (!g.poolCode) return;
        if (g.home.ioc) poolOf[g.home.ioc] = g.poolCode;
        if (g.away.ioc) poolOf[g.away.ioc] = g.poolCode;
      });
      var poolCodes = [];
      Object.keys(poolOf).forEach(function (k) {
        if (poolCodes.indexOf(poolOf[k]) === -1) poolCodes.push(poolOf[k]);
      });
      poolCodes.sort();
      var s05blocks = $$('.s05-pool');
      s05blocks.forEach(function (block, i) {
        var code = poolCodes[i];
        var rows = (pool && code)
          ? pool.rows.filter(function (r) { return poolOf[r.ioc] === code; })
          : (i === 0 && pool ? pool.rows : []);
        if (!rows.length) { block.hidden = true; return; }
        block.hidden = false;
        text(block, '.s05-h .t-h3', 'Pool ' + (code || 'A'));
        /* The number is the position in this pool, not the seeding or
           the stop rank — a Pool B table that opened at 2, 4, 6 read as
           if three rows were missing. The black rule marks who goes
           through: the pool winner when two pools cross into a final,
           the top two when the stop is a single pool. */
        var advance = poolCodes.length > 1 ? 1 : 2;
        repeat(block, '.s05-row', rows, function (row, r, i) {
          text(row, '.s05-seed', i + 1);
          fed(row, r.ioc, r.team);
          var n = $$('.s05-n', row);
          if (n[0]) n[0].textContent = r.won + '\u2013' + (r.played - r.won);
          if (n[1]) n[1].textContent = r.points;
          if (n[2]) n[2].textContent = r.avg;
          row.classList.toggle('s05-adv', i < advance);
          link(row, 'team.html?ioc=' + r.ioc);
        });
      });

      /* S-06 Bracket — final on top, third place under it when it
         exists. The snapshot carries pool games and finals only, so a
         round with no games hides rather than showing specimen scores. */
      var finals = gl.filter(function (g) { return g.round === 'F'; });
      var rounds = $$('.s06-round');
      rounds.forEach(function (rd, i) {
        var label = ($('.s06-label', rd) || {}).textContent || '';
        /* "Semi-finals" matches /final/ too, so the semi-final round was
           being handed the final and printing it a second time. Match on
           the round, not on a substring of its name. */
        var game = /third/i.test(label) ? gl.filter(function (g) { return g.round === '3P'; })[0]
                 : /semi/i.test(label)  ? gl.filter(function (g) { return g.round === 'SF'; })[0]
                 : /final/i.test(label) ? finals[0]
                 : null;
        if (!game) { rd.hidden = true; return; }
        rd.hidden = false;
        var sides = $$('.s06-side', rd);
        [game.home, game.away].forEach(function (t, k) {
          if (!sides[k]) return;
          fed(sides[k], t.ioc, cleanTeam(t.name));
          text(sides[k], '.s06-sc', t.score != null ? t.score : '–');
          sides[k].classList.toggle('s06-lose',
            game.home.score != null && t.score < Math.max(game.home.score, game.away.score));
        });
      });
      var s06 = $('.s06');
      if (s06) {
        var note = $('.t-body-s', s06);
        if (note) note.textContent = poolCodes.length > 1
          ? 'Two pools · each pool winner goes straight to the final'
          : 'One pool · the top two meet in the final';
        s06.hidden = !finals.length;
      }

      /* S-04 GameList */
      var gtbl = $('.games-tbl');
      if (gtbl) {
        var day = $('.games-day .t-caption', gtbl);
        if (day) day.textContent = gl.length
          ? fmtDate(e.start, { weekday: 'long', day: 'numeric', month: 'long' })
          : 'No games in the feed for this stop yet';
        var oldG = gtbl.parentElement.querySelector(':scope > .site-empty');
        if (oldG) oldG.remove();
        if (gl.length) {
          gtbl.hidden = false;
          repeat(gtbl, '.trow', gl, paintGame);
        } else {
          /* Ghost rows at 45% opacity read as a disabled table rather
             than as an empty one. */
          gtbl.hidden = true;
          emptyState(gtbl.parentElement, 'No games for this stop yet',
                     'The schedule is published once the draw is made.',
                     { icon: 'clock' });
        }
      }

      paintPhotos(photosFor([e]).slice(0, 12));

      var back = $('.cnf-back a');
      if (back) back.setAttribute('href', 'conference.html?id=' + c.id);

      if (window.FIBA) window.FIBA.init(document);
    }

    liveHere = stopLive(first, today);
    draw();
    if (liveHere) {
      var pageContent = $('.tpl-content');
      scheduleModule(pageContent, c.id);
      /* scheduleModule drops itself in at the head of the content; it
         belongs under the stop's name, which draw() has just written. */
      var schedWrap = $('.sched', pageContent);
      var idl = $('.stop-idl') || $('.cnf-stoptabs');
      if (schedWrap && idl && idl.parentNode === pageContent) {
        pageContent.insertBefore(schedWrap, idl.nextSibling);
      }
      /* The module brings a Men / Women switch to the page head. One
         switch, one page: it drives the podium, the pools and the
         bracket as well as the module's own list. */
      var schedSw = $('.sched-gender');
      if (schedSw) genderSwitch(function (g) { gender = g; draw(); }, schedSw);
    }
  };

  /* Competition Standings — every registered federation, ranked on how
     it has played, sortable on any column. This is the "how is my team
     doing" table; the Qualification view next door answers "who is
     going", and until now both tabs rendered the same rows. */
  /* Competition Standings and Qualification were two tabs over the same
     rows: the same federations, ranked the same way, with one column
     swapped. They are one table now, and ctl-08 ToggleSwitch cuts it
     down to the twenty places that are actually going to the World Cup.
     The Route column went with the tab — it repeated what the Status
     marker already says. */
  PAGES['standings.html'] = function () {
    var tbl = $('.tbl');
    var gender = 'men', query = '', confPick = '', zonePick = '';
    var qualOnly = new URLSearchParams(location.search).get('view') === 'qualification';
    /* Review 18 — a row is a team site now, so the table holds two
       ladders (U23 and U21) and each counts from one. Resting on
       tour points interleaved them and printed 1, 1, 2, 2 down the
       Position column; it rests on the ladder order instead, which
       is what Position is counting. */
    var state = { key: 'order', dir: 1 };
    var COLS = {
      'cell-position':   { key: 'order' },
      'cell-federation': { key: 'team', text: 1 },
      'cell-conference': { key: 'confname', text: 1 },
      'cell-seed':       { key: 'seedSort' },
      'cell-winratio':   { key: 'winRatio' },
      'cell-ptsavg':     { key: 'avg' },
      'cell-ep':         { key: 'stops' },
      'cell-points':     { key: 'tour' },
      'cell-status':     { key: 'statusRank' }
    };

    function draw() {
      /* The field is the top twenty. Search narrows what is shown of it
         and never changes who is in it. */
      var pool = federationTable(gender);
      /* The field of twenty is a U23 field — the U23 World Cup is
         what it qualifies for — so it is taken off the U23 ladder
         and not off the first twenty rows of a mixed table. */
      if (qualOnly) pool = pool.filter(function (t) {
        return t.cat === 'U23' && t.rank <= FIELD;
      });
      var list = pool.filter(function (t) {
        if (confPick && t.confname !== confPick) return false;
        if (zonePick && t.zone !== zonePick) return false;
        return !query || (t.team + ' ' + t.ioc).toLowerCase().indexOf(query) > -1;
      });
      var note = $('.ban-t'), body = $('.ban-d');
      if (note) note.textContent = qualOnly
        ? 'Twenty places \u2014 the host federation and nineteen through the league'
        : 'Places are recalculated after every conference closes';
      if (body) body.textContent = qualOnly
        ? 'Q qualified, S shortlisted, N not qualified. The field is provisional until every conference has closed.'
        : 'Because conferences finish at different times, a federation can move without playing. Tour points are the ranking measure.';
      var e = tbl.parentElement.querySelector(':scope > .site-empty');
      if (!list.length) {
        $$('.trow', tbl).forEach(function (r) { r.hidden = true; });
        emptyState(tbl.parentElement, 'No federation matches',
                   qualOnly ? 'That federation is not in the field of twenty.'
                            : 'Try a different name or IOC code.',
                   { icon: 'search' });
        return;
      }
      if (e) e.remove();
      list.sort(cmp(state.key, state.dir));
      repeat(tbl, '.trow', list, function (row, t) {
        row.hidden = false;
        fed(row, t.ioc, t.team);
        text(row, '.cell-position .t-data-m', t.rank);
        text(row, '.cell-conference .t-body-s', t.confname);
        var sc = $('.cell-seed .t-data-m', row);
        if (sc) {
          sc.textContent = seedText(t.seed);
          sc.classList.toggle('wt-none', t.seed == null);
        }
        text(row, '.cell-winratio .t-data-m', pctRatio(t.winRatio));
        text(row, '.cell-ptsavg .t-data-m', t.avg.toFixed(1));
        text(row, '.cell-ep .t-data-m', t.stops);
        text(row, '.cell-points .t-data-m', t.tour);
        marker(row, t.status);
        link(row, 'team.html?ioc=' + t.ioc);
      });
    }

    gender = genderSwitch(function (g) { gender = g; draw(); });
    searchField(document, 'Search a federation or IOC code', function (q) { query = q; draw(); });
    ensureSeedColumn(tbl);
    sortable(tbl, COLS, state, draw);

    /* ctl-04 Select, right edge of the search row: every
       conference the table can show, in alphabetical order. */
    (function () {
      var seen = {};
      federationTable('men').concat(federationTable('women')).forEach(function (t) {
        if (t.confname) seen[t.confname] = 1;
      });
      var names = Object.keys(seen).sort(function (a, b) { return a.localeCompare(b); });
      selectControl($('.selwrap[data-select="conference"]'), names,
                    function (v) { confPick = v; draw(); }, 'All conferences');
      selectControl($('.selwrap[data-select="zone"]'), REGIONS.slice(),
                    function (v) { zonePick = v; draw(); }, 'All zones');
    })();

    var tgl = $('.tgl[data-toggle="qualification"]');
    if (tgl) {
      function paintToggle() {
        tgl.classList.toggle('tgl-on', qualOnly);
        tgl.setAttribute('aria-checked', qualOnly ? 'true' : 'false');
      }
      function flip() { qualOnly = !qualOnly; paintToggle(); draw(); }
      tgl.addEventListener('click', flip);
      tgl.addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); flip(); }
      });
      paintToggle();
    }
    draw();
  };

  /* E-09 FederationDirectory. The A–Z jump bar came off: with 67
     federations the letter was rarely the thing anyone knew, and the
     region is — so the filter is a row of el-14 Chip under the search
     field, the same five regions the landing page and the wireframe
     use. The count sits under the chips because it describes what the
     filter left, not what the page is called. */
  PAGES['teams.html'] = function () {
    /* One entry per federation, but the de-duplication has to happen
       after the gender filter: a federation fields a team in both, and
       collapsing first meant whichever gender the feed listed first
       decided whether the federation appeared at all — 33 of 67. */
    var all = D.teams.filter(function (t) { return !!t.ioc; });
    all.forEach(function (t) { t.region = regionOf(conf(t.conference)); });
    all.sort(function (a, b) { return (a.name || '').localeCompare(b.name || ''); });

    var grid = $('.e09-grid') || $('.e09');
    var region = 'All', query = '', gender = 'men';

    function matches(t) {
      return (region === 'All' || t.region === region) &&
             (!query || (t.name + ' ' + t.ioc).toLowerCase().indexOf(query) > -1);
    }
    function pool() {
      var seen = {}, out = [];
      all.forEach(function (t) {
        if (t.gender && gender && t.gender !== gender) return;
        if (!matches(t) || seen[t.ioc]) return;
        seen[t.ioc] = 1;
        out.push(t);
      });
      return out;
    }

    function draw() {
      var list = pool();
      var e = grid.parentElement.querySelector(':scope > .site-empty');
      if (e) e.remove();
      var count = $('.e09-count');
      if (count) {
        count.textContent = list.length + (list.length === 1 ? ' federation' : ' federations') +
          ' · ' + all.filter(matches).length + ' teams';
      }
      if (!list.length) {
        grid.hidden = true;
        emptyState(grid.parentElement, 'No federation matches',
                   'Try another region, or clear the search.',
                   { icon: 'search' });
        return;
      }
      grid.hidden = false;
      repeat(grid, '.e09-cell', list, function (cell, t) {
        flag(cell, t.ioc);
        text(cell, '.e09-n', cleanTeam(t.name));
        text(cell, '.e09-c', t.ioc);
        link(cell, 'team.html?ioc=' + t.ioc);
      });
    }

    region = chipFilter(function (r) { region = r; draw(); }) || 'All';
    gender = genderSwitch(function (g) { gender = g; draw(); });
    searchField(document, 'Search for a federation or IOC code', function (q) { query = q; draw(); });
    draw();
  };

  PAGES['team.html'] = function () {
    var ioc = qs.get('ioc');
    var sites = D.teams.filter(function (x) { return x.ioc === (ioc || (D.teams[0] || {}).ioc); });
    var t = sites[0] || D.teams[0];
    if (!sites.length) sites = [t];

    crumbs([{ label: 'Home', href: 'index.html' },
            { label: 'Teams', href: 'teams.html' },
            { label: cleanTeam(t.name) }]);

    var tname = cleanTeam(t.name);
    var head = $('.e04-top') || $('.e04');
    if (head) { flag(head, t.ioc); text(head, '.ftag-code', t.ioc); text(head, '.ftag-name', tname); }
    $$('.f04-h1, .e04-name, .t-h1, .f04-h1-m, .f04-h1-s').forEach(function (n) { n.textContent = tname; });

    /* ---- Review 18: FEDERATION OVERVIEW ---------------------
       The page a federation is linked to is a federation's page.
       It used to open on one of its four sides and offer the other
       three behind a switch, so "how is Germany doing" had to be
       asked four times and added up by hand. team.html is promoted
       rather than replaced: teams.html already links here by IOC
       code, the crumbs already say Home / Teams / Germany, and the
       switch that chose between the sides is still the switch —
       it has gained an "All" in front, and All is where it opens.

       Nothing new is derived. The cards read the same rows the
       Standings page ranks (federationTable), the same conference
       tables the conference page draws (conferenceTable), and the
       same Q/S/R the finder puts on its buttons (siteStatus). The
       parts are el-13 FederationTag, el-05 StatusBadge and the e04
       stat row; the only new thing is the grid they sit in. */
    var ovHost = null;
    function fedOverview(show) {
      var e04 = $('.e04');
      var content = $('.tpl-content') || document.body;
      /* The per-side blocks — season journey, roster, results,
         photos — describe one team site and say nothing about a
         federation, so they stand down while All is showing. */
      $$(':scope > .tpl-sub', content).forEach(function (n) {
        if (n === ovHost) return;
        n.hidden = !!show;
      });
      var sub = $('.e04-sub');
      var act = $('.e04-act');
      if (act) act.hidden = !!show;

      if (!show) { if (ovHost) ovHost.hidden = true; return; }

      if (!ovHost) {
        ovHost = el('div', 'tpl-sub fed-ov');
        if (e04 && e04.parentNode) e04.parentNode.insertBefore(ovHost, e04.nextSibling);
        else content.insertBefore(ovHost, content.firstChild);
      }
      ovHost.hidden = false;

      /* One cell per side this federation fields. */
      var cells = teamSites().filter(function (x) { return x.ioc === t.ioc; });
      var ORDER = ['U23 Men', 'U23 Women', 'U21 Men', 'U21 Women'];
      var recs = cells.map(function (x) {
        var g = x.gender || 'men';
        var cat = rowCat(x.conference, x.name);
        var c2 = conf(x.conference) || {};
        var season = federationTable(g).filter(function (r) {
          return r.ioc === x.ioc && r.conference === x.conference && r.cat === cat;
        })[0];
        var ctab = conferenceTable(x.conference, g);
        var me = ctab.filter(function (r) { return r.ioc === x.ioc; })[0];
        var all = stopsOfConference(x.conference);
        var done = all.filter(function (e2) { return stopPlayed(e2, isoDay(new Date())); }).length;
        return {
          site: x, cat: cat, gender: g, conf: c2,
          label: cat + ' ' + (g === 'women' ? 'Women' : 'Men'),
          confname: confLabel(c2, cat),
          rank: me ? me.rank : null, field: ctab.length,
          stops: season ? season.stops : (me ? me.stops : 0),
          ofStops: all.length,
          done: done,
          tour: season ? season.tour : (me ? me.tour : 0),
          winRatio: season ? season.winRatio : (me ? me.winRatio : 0),
          seed: seedOfSite(x.ioc, x.conference, g),
          status: siteStatus({ ioc: x.ioc, gender: g, conference: x.conference })
        };
      }).sort(function (a, b) {
        var i = ORDER.indexOf(a.label), j = ORDER.indexOf(b.label);
        return (i < 0 ? 9 : i) - (j < 0 ? 9 : j);
      });

      /* Federation totals: the sum across every side, which is the
         one place a sum across conferences is the right answer. */
      var tot = { tour: 0, stops: 0, played: 0, won: 0, scored: 0 };
      recs.forEach(function (r) {
        var g = r.gender;
        var row = federationTable(g).filter(function (x2) {
          return x2.ioc === t.ioc && x2.conference === r.site.conference && x2.cat === r.cat;
        })[0];
        if (!row) return;
        tot.tour += row.tour; tot.stops += row.stops;
        tot.played += row.played; tot.won += row.won; tot.scored += row.scored;
      });
      /* Qualification is a U23 question — the field it names is the
         U23 World Cup — so the denominator is the U23 sides, not all
         four. "0 of 4" counted two sides that are not playing for it. */
      var u23 = recs.filter(function (r) { return r.cat === 'U23'; });
      var qCount = u23.filter(function (r) { return r.status === 'q'; }).length;
      var best = recs.slice().sort(function (a, b) { return b.tour - a.tour; })[0];

      if (sub) {
        var parts = $$('.t-body-m', sub);
        if (parts[0]) parts[0].textContent = recs.length +
          ' team site' + (recs.length === 1 ? '' : 's');
        if (parts[1]) parts[1].textContent = recs.map(function (r) {
          return r.confname;
        }).filter(function (v, i, a) { return a.indexOf(v) === i; }).join(' \u00b7 ');
        var badge = $('.badge', sub);
        if (badge) {
          ['q', 's', 'n'].forEach(function (x2) { badge.classList.remove('badge-' + x2); });
          badge.classList.add(qCount ? 'badge-q' : 'badge-s');
          text(badge, '.lbl', qCount
            ? qCount + ' side' + (qCount === 1 ? '' : 's') + ' qualified'
            : 'In the race');
          badge.hidden = false;
        }
      }

      /* e04's six figures, restated about the federation. */
      var FIG = [
        ['Tour Points', tot.tour],
        ['Win Ratio', pctRatio(tot.played ? tot.won / tot.played : 0)],
        ['Record', tot.won + '\u2013' + (tot.played - tot.won)],
        ['Events played', tot.stops],
        ['Team sites', recs.length],
        ['Qualified (U23)', u23.length ? (qCount + ' of ' + u23.length) : '\u2014']
      ];
      $$('.e04-stats .e04-stat').forEach(function (cell, i) {
        if (!FIG[i]) { cell.hidden = true; return; }
        cell.hidden = false;
        text(cell, '.t-caption', FIG[i][0]);
        var v = $('.e04-v', cell);
        if (v) v.textContent = FIG[i][1];
      });

      var head = '<div class="el-01-SectionHeader--default el01-wrap"><div class="el01">' +
        '<div class="el01-left"><h2 class="t-h2">Categories</h2>' +
        '<span class="t-body-s fed-ov-sub">' + recs.length +
        ' of 4 entered \u00b7 pick one to read its season</span></div></div></div>';

      var cards = ORDER.map(function (lab) {
        var r = recs.filter(function (x2) { return x2.label === lab; })[0];
        if (!r) {
          return '<div class="fed-card fed-card-off cut cut-m cut-out">' +
            '<div class="cutfill"></div>' +
            '<div class="fed-card-h"><span class="t-h3">' + lab + '</span></div>' +
            '<div class="t-body-s fed-card-none">No side entered</div></div>';
        }
        function line(k, v) {
          return '<div class="fed-line"><span class="t-caption">' + k +
                 '</span><span class="t-data-m">' + v + '</span></div>';
        }
        var mk = r.status
          ? '<div class="el-05-StatusBadge--marker-' + r.status + ' marker marker-' +
            r.status + ' cut cut-s"><span class="lbl">' + r.status.toUpperCase() +
            '</span></div>'
          : '<span class="t-data-m wt-none">\u2014</span>';
        return '<div class="fed-card cut cut-m cut-out" role="link" tabindex="0" ' +
          'data-cat="' + r.cat + '" data-gender="' + r.gender + '">' +
          '<div class="cutfill"></div>' +
          '<div class="fed-card-h"><span class="t-h3">' + lab + '</span>' + mk + '</div>' +
          '<div class="t-body-s fed-card-conf">' + r.confname + '</div>' +
          '<div class="fed-lines">' +
            line('Conference rank', r.rank ? ordinal(r.rank) + ' of ' + r.field : '\u2014') +
            line('Seed', seedText(r.seed)) +
            line('Stops played', r.stops + ' of ' + (r.ofStops || 6)) +
            line('Tour points', r.tour) +
            line('Win ratio', pctRatio(r.winRatio)) +
          '</div>' +
          '<div class="ctl-02-Link--default lnk fed-card-go"><span class="lbl">' +
          'See this season</span></div></div>';
      }).join('');

      ovHost.innerHTML = head + '<div class="fed-grid">' + cards + '</div>';
      $$('.fed-card[data-cat]', ovHost).forEach(function (card) {
        card.addEventListener('click', function () {
          var sw = $('.f04-ctl .el02') || $('.el02');
          if (sw && sw._pick) sw._pick(card.dataset.cat, card.dataset.gender);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        });
        card.addEventListener('keydown', function (ev) {
          if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); card.click(); }
        });
      });
      if (window.FIBA) window.FIBA.init(ovHost);
    }

    /* One selection drives the whole page: which of this federation's
       team sites is being read. */
    function draw(sel) {
      if (sel && sel.cat === 'All') { fedOverview(true); return; }
      fedOverview(false);
      var site = sites.filter(function (x) {
        return rowCat(x.conference, x.name) === sel.cat &&
               (x.gender || 'men') === sel.gender;
      })[0] || t;
      var c = conf(site.conference) || {};

      var sub = $('.e04-sub');
      if (sub) {
        var parts = $$('.t-body-m', sub);
        if (parts[0]) parts[0].textContent = sel.cat + ' ' + (sel.gender === 'men' ? 'Men' : 'Women');
        if (parts[1]) parts[1].textContent = confLabel(c, sel.cat);
      }

      /* Review 18 — the overview relabels e04's six figures about
         the federation; a category puts back the six it states about
         one side. */
      var CAPS = ['Tour Points', 'Win Ratio', 'Record', 'Stops played',
                  'Conference rank', 'Race position'];
      $$('.e04-stats .e04-stat').forEach(function (cell, i) {
        cell.hidden = false;
        if (CAPS[i]) text(cell, '.t-caption', CAPS[i]);
      });

      /* season totals for this team site */
      var table = conferenceTable(c.id, site.gender || sel.gender);
      var me = table.filter(function (r) { return r.ioc === site.ioc; })[0];
      var season = federationTable(site.gender || sel.gender)
                     .filter(function (r) {
                       return r.ioc === site.ioc && r.conference === c.id;
                     })[0];
      var ev = $$('.e04-v');
      if (me) {
        if (ev[0]) ev[0].textContent = me.tour;
        if (ev[1]) ev[1].textContent = pctRatio(me.winRatio);
        if (ev[2]) ev[2].textContent = me.won + '–' + (me.played - me.won);
        if (ev[3]) ev[3].textContent = me.stops;
        if (ev[4]) ev[4].textContent = me.rank;
        if (ev[5]) ev[5].textContent = season ? season.rank : '—';
      }
      var badge = $('.e04-sub .badge');
      if (badge && season) {
        var lbl = { q: 'Qualified', s: 'Shortlisted', n: 'Not qualified' }[season.status];
        ['q', 's', 'n'].forEach(function (x) { badge.classList.remove('badge-' + x); });
        if (season.status) {
          badge.classList.add('badge-' + season.status);
          text(badge, '.lbl', lbl);
          badge.hidden = false;
        } else {
          /* U21: the badge states qualification for the U23 World Cup
             and there is none to state. */
          badge.hidden = true;
        }
      }
      /* The stream is a conference-level thing (first review): only
         offer it while this conference is actually playing. */
      var wl = $('.e04-act .wl');
      if (wl) {
        var today = isoDay(new Date());
        var live = D.events.some(function (e) {
          return e.conference === c.id && e.start &&
                 e.start <= today && (e.end || e.start) >= today;
        });
        wl.hidden = !live;
      }

      /* S-10 Season journey — this conference, stop by stop */
      var stops = D.events.filter(function (e) { return e.conference === c.id; })
                          .sort(function (x, y) { return (x.number || 0) - (y.number || 0); });
      var host = $('.s10');
      if (host) {
        repeat(host, '.s10-row', stops, function (row, e) {
          var s = standingsFor(e.slug, site.gender || sel.gender);
          var mine = s && s.rows.filter(function (r) { return r.ioc === site.ioc; })[0];
          /* Two different questions: has this stop happened (calendar),
             and do we hold its result (snapshot). A played stop with no
             result yet says Played, with the figures still dashed. */
          var done = stopPlayed(e);
          var live = stopLive(e);
          var played = !!(mine && mine.rank);
          text(row, '.cell-jstop .t-data-m', e.number);
          text(row, '.cell-jhost .t-body-s', cityOf(e) + (e.country ? ', ' + e.country : ''));
          text(row, '.cell-jdate .t-body-s', fmtDate(e.start, { day: 'numeric', month: 'short' }));
          $('.cell-jplace .t-data-m', row).textContent = played ? ordinal(mine.rank) : '—';
          $('.cell-jpts .t-data-m', row).textContent = played ? tourPoints(mine.rank) : '—';
          $('.cell-jstatus .t-body-s', row).textContent =
            live ? 'Live' : (done ? 'Played' : 'Upcoming');
          row.classList.toggle('is-placeholder', !done && !live);
          link(row, 'stop.html?id=' + e.slug);
        });
      }
      var jlink = $$('.lnk').filter(function (l) { return /view conference/i.test(l.textContent); })[0];
      if (jlink) link(jlink, 'conference.html?id=' + c.id);

      /* roster: a 3x3 squad is four players at one stop, so show the
         most recent one this team site fielded */
      var recent = sites.filter(function (x) { return x.conference === site.conference && x.gender === site.gender; })
                        .sort(function (x, y) {
                          return ((stop(y.stop) || {}).start || '').localeCompare((stop(x.stop) || {}).start || '');
                        })[0] || site;
      var roster = (recent.roster || []).map(function (m) { return player(m.id); }).filter(Boolean);
      if (roster.length) {
        /* E-08's stat column states games, points and win ratio —
           the three figures the roster tile is specified with. They are
           summed from the derived box scores, so a card never shows an
           em dash where a played game exists. */
        repeat(document, '.pcard-sh', roster, function (card, p) {
          paintPlayerCard(card, p, playerCardStats(p));
        });
        tiltCards(document);
      }

      /* results for the most recent stop of this team site */
      var mineStops = stops.filter(function (e) { return gamesFor(e.slug, site.gender).length; });
      var last = mineStops[mineStops.length - 1];
      var gl = last ? gamesFor(last.slug, site.gender) : [];
      var gtbl = $('.games-tbl') ||
                 $$('.tbl').filter(function (x) { return !x.classList.contains('s10'); })[0];
      if (gtbl) {
        var oldR = gtbl.parentElement.querySelector(':scope > .site-empty');
        if (oldR) oldR.remove();
        if (gl.length) {
          gtbl.hidden = false;
          repeat(gtbl, '.trow', gl, paintGame);
        } else {
          gtbl.hidden = true;
          emptyState(gtbl.parentElement, 'No results yet',
                     'This federation has not played a stop in this category.',
                     { icon: 'clock' });
        }
      }

      paintPhotos(photosFor(stops).slice(0, 12));

      if (window.FIBA) window.FIBA.init(document);
    }

    var start = categorySwitch($('.f04-ctl') || document, sites, draw) ||
                { cat: rowCat(t.conference, t.name), gender: t.gender || 'men' };
    draw(start);
  };

  PAGES['player.html'] = function () {
    var p = player(qs.get('id')) || D.players[0];
    text(document, '.e05-first', p.first);
    text(document, '.e05-last', p.last);
    $$('.f04-h1, .f04-h1-m, .f04-h1-s, .f04-title').forEach(function (n) { n.textContent = p.name; });
    crumbs([{ label: 'Home', href: 'index.html' },
            { label: 'Teams', href: 'teams.html' },
            { label: nationOf(p.ioc) || p.country || '', href: 'team.html?ioc=' + p.ioc },
            { label: p.name }]);
    var ph = $('.e05-id') || $('.e05');
    if (ph) { flag(ph, p.ioc); text(ph, '.ftag-code', p.ioc); text(ph, '.ftag-name', nationOf(p.ioc) || p.country); }
    /* E-05's glance row is labelled Games / Points / PPG / Win ratio in
       the markup, and was being filled with age, ranking points and a
       city — three values that belong to none of those labels. */
    var glance = $$('.e05-g');
    var head = playerTotals(p.id);
    [['Games',     head.games || '—'],
     ['Points',    head.games ? head.points : '—'],
     ['PPG',       head.games ? (head.points / head.games).toFixed(1) : '—'],
     ['Win ratio', pctRatio(head.winRatio)]
    ].forEach(function (f, i) {
      if (!glance[i]) return;
      text(glance[i], '.t-caption', f[0]);
      text(glance[i], '.e05-gv', f[1]);
    });

    /* el-24 Avatar at XL. A player with a cut-out gets it; the others
       keep the checker fallback the element ships with. */
    var av = $('.e05 .av');
    if (av && p.portrait) {
      av.classList.remove('av-check-bed');
      av.classList.add('av-sil-bed');
      av.innerHTML = '<img class="av-photo" src="' + p.portrait + '" alt="">';
    }
    /* E-06 PlayerSeasonStats and E-07 GameLog, from the derived box
       scores. Both modules used to sit at 45% opacity holding the
       specimen's figures, because the snapshot has no per-game player
       statistics — but the box score is derived from the final score,
       so the season line can be summed the same way. */
    var pg = playerGames(p.id);
    var tot = playerTotals(p.id);

    (function () {
      var cells = $$('.e06-c');
      var figures = [
        ['Games played',    tot.games || '—'],
        ['Total points',    tot.games ? tot.points : '—'],
        ['Points per game', tot.games ? (tot.points / tot.games).toFixed(1) : '—'],
        ['Two-pointers',    tot.games ? tot.two : '—'],
        ['Win ratio',       pctRatio(tot.winRatio)],
        ['Free throws',     tot.games ? tot.ft : '—']
      ];
      cells.forEach(function (c, i) {
        if (!figures[i]) { c.hidden = true; return; }
        c.hidden = false;
        text(c, '.t-caption', figures[i][0]);
        text(c, '.e06-v', figures[i][1]);
      });

      /* one row per stop */
      var byStop = {}, order = [];
      pg.forEach(function (r) {
        var k = r.game.stop;
        if (!byStop[k]) { byStop[k] = { stop: stop(k) || {}, games: 0, pts: 0, won: 0 }; order.push(k); }
        byStop[k].games++;
        byStop[k].pts += r.line.pts || 0;
        if (r.won) byStop[k].won++;
      });
      var rows = order.map(function (k) { return byStop[k]; });
      var host = $('.e06-row') && $('.e06-row').parentElement;
      if (!rows.length) {
        $$('.e06-row').forEach(function (r) { r.hidden = true; });
        if (host) emptyState(host, 'No games played yet',
                             'The season line appears once this federation has played.',
                             { icon: 'clock' });
      } else {
        var old = host && host.querySelector(':scope > .site-empty');
        if (old) old.remove();
        repeat(document, '.e06-row', rows, function (row, r) {
          row.hidden = false;
          row.classList.remove('is-placeholder');
          text(row, '.e06-stop .t-label',
               'Stop ' + (r.stop.number || '') + ' · ' + cityOf(r.stop));
          var n = $$('.e06-num .t-data-m', row);
          if (n[0]) n[0].textContent = r.games;
          if (n[1]) n[1].textContent = r.pts;
          if (n[2]) n[2].textContent = (r.pts / r.games).toFixed(1);
          if (n[3]) n[3].textContent = (r.won / r.games).toFixed(2);
        });
      }
    })();

    (function () {
      var proto = $('.e07-row');
      var host = proto && proto.parentElement;
      var log = pg.slice().reverse().slice(0, 10);
      if (!log.length) {
        $$('.e07-row').forEach(function (r) { r.hidden = true; });
        if (host) emptyState(host, 'No games in the log yet',
                             'Every game this federation plays is listed here.',
                             { icon: 'clock' });
        return;
      }
      var old = host.querySelector(':scope > .site-empty');
      if (old) old.remove();
      repeat(host, '.e07-row', log, function (row, r) {
        row.hidden = false;
        row.classList.remove('is-placeholder');
        var g = r.game, opp = g[r.other];
        text(row, '.e07-date .t-body-s', fmtDate((g.start || '').slice(0, 10),
                                                 { day: 'numeric', month: 'short' }));
        text(row, '.e07-conf .t-body-s', confName(conf(g.conference)));
        var tag = $('.e07-opp .ftag', row);
        if (tag) { flag(tag, opp.ioc); text(tag, '.ftag-code', opp.ioc); text(tag, '.ftag-name', opp.name); }
        var res = $('.e07-res .res-w, .e07-res .res-l', row);
        if (res) {
          res.className = r.won ? 'res-w' : 'res-l';
          res.textContent = r.won ? 'W' : 'L';
        }
        text(row, '.e07-res .t-data-m', g[r.side].score + '\u2013' + opp.score);
        text(row, '.e07-line', r.line.pts + ' pts · ' + r.line.two + ' 2PT · ' + r.line.ft + ' FT');
        link(row, 'game.html?id=' + g.id);
      });
    })();

    /* C-03 PhotoGallery — the stops this player was actually entered at.
       Galleries are held per event, not per player, so a player page
       shows the galleries from the stops their squad appeared at, newest
       first. The block hides itself when there are none. */
    var mine = D.teams.filter(function (t) {
      return (t.roster || []).some(function (m) { return m.id === p.id; });
    });
    var evs = mine.map(function (t) { return stop(t.stop); }).filter(Boolean);
    var seen = {};
    evs = evs.filter(function (e) { if (seen[e.id]) return false; seen[e.id] = 1; return true; });
    paintPhotos(photosFor(evs).slice(0, 12));
    if (window.FIBA) window.FIBA.init(document);
  };

  /* C-06 ContentPage. The table of contents was a static list with the
     second item marked; it now drives the page and opens on the first
     section, which is the one that explains what the competition is. */
  /* C-06 ContentPage. One page with an anchor menu: the sections are
     all here, the menu scrolls to them and marks whichever one is in
     view, so a deep link from search or social lands on the right part
     of the page instead of on the top of a five-way switch. */
  PAGES['about.html'] = function () {
    var items = $$('.c06-toc-i');
    var secs = $$('.c06-sec');
    if (!items.length || !secs.length) return;

    function mark(id) {
      items.forEach(function (a) {
        a.classList.toggle('c06-toc-on', (a.getAttribute('href') || '') === '#' + id);
      });
    }
    items.forEach(function (a) {
      a.addEventListener('click', function (ev) {
        var id = (a.getAttribute('href') || '').slice(1);
        var el = document.getElementById(id);
        if (!el) return;
        ev.preventDefault();
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        history.replaceState(null, '', '#' + id);
        mark(id);
      });
    });

    /* The menu marks the highest section still inside the reading band,
       in document order — taking whichever entry reported last marked
       the section below the one that had just been jumped to. */
    var inView = {};
    var io = window.IntersectionObserver && new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { inView[e.target.id] = e.isIntersecting; });
      var first = secs.filter(function (s) { return inView[s.id]; })[0];
      if (first) mark(first.id);
    }, { rootMargin: '-120px 0px -65% 0px', threshold: 0 });
    if (io) secs.forEach(function (s) { io.observe(s); });

    var here = location.hash.slice(1);
    if (here && document.getElementById(here)) {
      document.getElementById(here).scrollIntoView();
      mark(here);
    } else {
      mark(secs[0].id);
    }
  };

  PAGES['news.html'] = function () {
    repeat(document, '.c04-row', D.news, function (row, n) {
      text(row, '.c04-t', n.title);
      var cap = $('.t-caption', row);
      if (cap) cap.textContent = fmtDate(n.date);
      photo($('.c04-img', row), img(n.thumb, 600), true);
      link(row, 'article.html?id=' + n.slug);
    });
  };

  PAGES['article.html'] = function () {
    var id = qs.get('id');
    var n = D.news.filter(function (x) { return x.slug === id; })[0] || D.news[0];
    var body = $('.c05-body');
    var h = body && (body.querySelector('.t-h2') || body.querySelector('.c05-h2'));
    if (h) h.textContent = n.title;
    var cap = body && body.querySelector('.t-caption');
    if (cap) cap.textContent = fmtDate(n.date) + ' · 3 min read';
    photo($('.c05-hero'), img(n.image, 1600, '16:9'));
  };

  /* The Calendar page is the landing page's Live now module with the
     day selection released: nothing is preselected, so every stop that
     has something under it is listed as an S-01 accordion. Picking a day
     narrows the list to that day; picking it again clears it. The month
     headings and dividers are gone — the strip already carries the
     calendar. */
  PAGES['calendar.html'] = function () {
    var SLOTS = 8;
    /* One gender for the page, set from the switch in the page head, not
       one per accordion — and a search that narrows the list the way the
       Teams page does. */
    var region = 'All', days = [], sel = -1, win = 0, gender = 'men', query = '';

    function iso(d) { return isoDay(d); }
    function inRegion(e) {
      return region === 'All' || regionOf(conf(e.conference)) === region;
    }
    /* Same rule as the landing page: a stop that is scheduled counts,
       whether or not the snapshot has caught up with its results. */
    function pool() {
      return D.events.filter(function (e) { return e.start && inRegion(e); })
                     .sort(function (a, b) { return a.start.localeCompare(b.start); });
    }
    function playDays() {
      var seen = {};
      pool().forEach(function (e) { seen[e.start] = 1; });
      return Object.keys(seen).sort();
    }
    function pad(list, n) {
      if (list.length >= n) return list;
      var out = list.slice();
      var day = shiftDay;
      var guard = 0;
      while (out.length < n && guard++ < 200) {
        out.push(day(out[out.length - 1], 1));
        if (out.length < n) out.unshift(day(out[0], -1));
      }
      return out.sort();
    }
    function dayList() { return pad(playDays(), SLOTS); }
    function clampWin() {
      win = days.length <= SLOTS ? 0 : Math.max(0, Math.min(win, days.length - SLOTS));
    }

    var strip = $('.s03, .s03wrap');
    var accHost = ($('.acc') || {}).parentElement;

    function drawStrip() {
      /* Review 18 (second pass) — the day strip is Day view's control;
         in Month view there is no day to pick. */
      if (strip) strip.hidden = (view !== 'day');
      if (view !== 'day') return;
      var window8 = days.slice(win, win + SLOTS);
      var play = {};
      playDays().forEach(function (d) { play[d] = 1; });
      repeat(strip, '.s03-d', window8, function (cell, dISO) {
        var d = new Date(dISO + 'T00:00:00');
        cell.classList.toggle('s03-on', sel >= 0 && dISO === days[sel]);
        cell.classList.toggle('s03-off', !play[dISO]);
        cell.classList.toggle('s03-live', dISO === iso(new Date()) && !!play[dISO]);
        text(cell, '.s03-num', d.getDate());
        text(cell, '.s03-dow', d.toLocaleDateString('en-GB', { weekday: 'short' }).toUpperCase());
        text(cell, '.s03-mon', d.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase());
        cell.onclick = function () {
          if (!play[dISO]) return;
          var i = days.indexOf(dISO);
          sel = (sel === i) ? -1 : i;      /* click again to see the whole season */
          drawStrip(); drawList();
        };
      });
      $$('.s03nav', strip).forEach(function (b, i) {
        var back = i === 0;
        b.classList.toggle('s03nav-off', back ? win === 0 : win >= days.length - SLOTS);
        if (b._wired) return;
        b._wired = 1;
        b.addEventListener('click', function () {
          var was = win;
          win += (back ? -1 : 1) * SLOTS;
          clampWin();
          if (win === was) return;
          drawStrip();
          var hostEl = $('.s03', strip) || strip;
          hostEl.classList.remove('s03-in-l', 's03-in-r');
          void hostEl.offsetWidth;
          hostEl.classList.add(back ? 's03-in-l' : 's03-in-r');
        });
      });
    }

    /* Review 18 (second pass) — the search reaches both views, so
       what it matches is stated once. */
    function matchQuery(e) {
      if (!query) return true;
      var c = conf(e.conference) || {};
      var feds = D.teams.filter(function (t) { return t.stop === e.slug; })
                        .map(function (t) { return t.ioc + ' ' + cleanTeam(t.name); }).join(' ');
      return (confName(c) + ' ' + cityOf(e) + ' ' + (e.country || '') + ' ' +
              'stop ' + e.number + ' ' + feds).toLowerCase().indexOf(query) > -1;
    }

    function drawList() {
      if (!accHost) return;
      var old = accHost.querySelector(':scope > .site-empty');
      if (old) old.remove();
      /* Review 18 — the list is what a picked day opens. With no day
         picked the month grid is the page, and a wall of every stop
         in the season under it was the thing that was hard to read.
         Only the accordions stand down: the section around them also
         holds the region chips and the day strip. */
      var cap = $('.cal-daycap', accHost);
      /* Review 20 — Daniel: Clear filter used to empty the page.
         Clearing a filter means seeing what it was hiding, so Day
         view with no day picked is the whole season. Day view now
         arrives on a day — 12 August, the day Live now opens on —
         and Clear filter is what widens it back out. */
      if (view !== 'day') {
        $$('.acc', accHost).forEach(function (a) { a.hidden = true; });
        if (cap) cap.hidden = true;
        return;
      }
      if (!cap) {
        cap = el('div', 'cal-daycap t-h3');
        accHost.insertBefore(cap, $('.acc', accHost));
      }
      cap.hidden = false;
      var evs = pool().filter(function (e) {
        if (!(sel < 0 || (e.start <= days[sel] && (e.end || e.start) >= days[sel]))) return false;
        return matchQuery(e);
      });
      if (!evs.length) {
        $$('.acc', accHost).forEach(function (a) { a.hidden = true; });
        emptyState(accHost, query ? 'Nothing matches that search' : 'Nothing in this region yet',
                   query ? 'Try a city, a conference or an IOC code.'
                         : 'Pick another region, or clear the day.',
                   { icon: query ? 'search' : 'calendar' });
        return;
      }
      $$('.acc', accHost).forEach(function (a) { a.hidden = false; });
      cap.textContent = (sel >= 0
        ? fmtDate(days[sel], { weekday: 'short', day: 'numeric', month: 'long' })
        : (query ? 'Search results' : 'Whole season')) + ' \u00b7 ' + evs.length +
        ' stop' + (evs.length === 1 ? '' : 's');
      var today = iso(new Date());
      repeat(accHost, '.acc', evs, function (node, e) {
        var c = conf(e.conference) || {};
        var g = gender;
        var all = stopsOfConference(c.id);
        var played = all.filter(function (x) { return x.start && x.start <= e.start; }).length;
        var live = stopLive(e, today);

        text(node, '.t-h3', confName(c));
        var meta = $$('.acc-head .t-body-s', node)[0];
        if (meta) meta.textContent = cityOf(e) + ' · ' +
          fmtDate(e.start, { day: 'numeric', month: 'short' });
        accCaption(node, c, e, all);
        var badge = $('.acc-head .badge', node);
        if (badge) badge.hidden = !live;
        text(node, '.acc-head .t-caption', 'Stop ' + e.number + ' of ' + (c.stopCount || all.length));
        $$('.dot', node).forEach(function (d, i) {
          d.classList.toggle('dot-done', i < played);
          d.classList.toggle('dot-live', live && i === played - 1);
        });

        var rows = conferenceTable(c.id, g, e.start);
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
        }
        var view = $$('.lnk, .btn', node).filter(function (l) {
          return /conference/i.test(l.textContent);
        })[0];
        if (view) link(view, 'conference.html?id=' + e.conference);
      });
      if (window.FIBA) window.FIBA.init(accHost);
      /* One open at a time: the list is the whole season here, so
         leaving them open turns the page into a wall of tables. */
      soloAccordions(accHost);
    }

    /* ---- Review 18: the month --------------------------------
       "The day list is hard to understand — a monthly view is
       better." A row of eight days answers "what is on this week"
       and nothing else; the shape of a season is months, and the
       stops in it are events with a place and a state, which is
       how fiba3x3.com states its own calendar.

       The day strip stays: it is how a day is picked, and picking
       a day is what opens the list underneath. The month grid is
       what the page opens on. Daily and Weekly are a later
       phase — this is the month, and the day list it already had. */
    var monthHost = null, monthPick = null;
    /* Review 18 (second pass) — two views, and the month is the one
       the page opens on. The grid answers "what does August look
       like"; the cards answer "what is on, and when", which is the
       question a reader brings to a calendar. Day view keeps the grid
       and the day strip exactly as they were. */
    var view = 'month';
    var cardHost = null;

    function monthsWithStops() {
      var seen = {};
      pool().forEach(function (e) { seen[e.start.slice(0, 7)] = 1; });
      return Object.keys(seen).sort();
    }
    function monthLabelOf(m) {
      var d = new Date(m + '-01T12:00:00');
      return d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    }
    /* Monday-first, which is how a European federation reads a week
       and how every other date on this site is written. */
    var DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    function winnerOf(e, g) {
      var rows = (standingsFor(e.slug, g) || {}).rows || [];
      var w = rows.filter(function (r) { return r.rank === 1; })[0];
      return w && w.ioc ? w : null;
    }

    /* Stops as cards, grouped by the month they are played in —
       the same card language as the Conferences grid, because a stop
       and a conference are the same kind of thing to click on. Only
       months that have something in them appear, and only days that
       do: an empty week is not information. */
    function drawCards() {
      if (!cardHost) return;
      cardHost.hidden = (view !== 'month');
      if (view !== 'month') return;
      var evs = pool().filter(matchQuery);
      if (!evs.length) {
        cardHost.innerHTML = '';
        emptyState(cardHost, query ? 'Nothing matches that search'
                                   : 'Nothing in this region yet',
                   query ? 'Try a city, a conference or an IOC code.'
                         : 'Pick another region.',
                   { icon: query ? 'search' : 'calendar' });
        return;
      }
      var byMonth = {};
      evs.forEach(function (e) { (byMonth[e.start.slice(0, 7)] = byMonth[e.start.slice(0, 7)] || []).push(e); });
      /* Newest month first — the season is read backwards from where
         it has got to — and, inside a month, in the order it is
         played. */
      var months = Object.keys(byMonth).sort().reverse();
      var todayISO = iso(new Date());

      cardHost.innerHTML = months.map(function (m) {
        var list = byMonth[m].slice().sort(function (a, b) { return a.start.localeCompare(b.start); });
        var cards = list.map(function (e) {
          var c = conf(e.conference) || {};
          var live = stopLive(e, todayISO);
          var played = stopPlayed(e, todayISO);
          var w = played ? winnerOf(e, gender) : null;
          var all = stopsOfConference(c.id);
          var d = new Date(e.start + 'T12:00:00');
          var day = d.toLocaleDateString('en-GB',
                      { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase();
          var tail = live
            ? '<div class="el-05-StatusBadge--live badge badge-live cut cut-s">' +
              '<span class="badge-dot"></span><span class="lbl">Live</span></div>'
            : (w ? '<div class="ftag ftag-s cut cut-s ftag-plain ftag-static cal-card-w">' +
                   '<div class="flag flag-ring"></div><div class="ftag-txt">' +
                   '<span class="ftag-code">' + w.ioc + '</span></div></div>' +
                   '<span class="t-caption cal-card-won">Winner</span>'
                 : '<span class="t-caption cal-ev-soon">' +
                   (played ? 'Result to come' : 'Upcoming') + '</span>');
          /* Review 19 — Daniel: the same card as Conferences, down to
             the hover. E-03 ships wrapped in .sh because a drop-shadow
             cannot be drawn on a clipped surface; the wrapper carries
             the elevation and the card carries the grey stroke. A live
             stop takes the brand stroke, exactly as a live conference
             card does. */
          return '<div class="sh e03-sh cal-sh">' +
            '<div class="cal-card e03-card cut cut-m cut-out' +
            (live ? ' brandstroke' : '') +
            '" role="link" tabindex="0" data-href="stop.html?id=' + e.slug +
            '" data-ioc="' + (w ? w.ioc : '') + '">' +
            '<div class="cutfill"></div>' +
            '<div class="cal-card-top"><span class="t-caption cal-card-date">' + day + '</span>' +
            '<span class="t-caption cal-card-stop">Stop ' + e.number +
            ' of ' + (c.stopCount || all.length) + '</span></div>' +
            '<div class="e03-name cal-card-name">' + confName(c) + '</div>' +
            '<div class="t-body-s cal-card-meta">' +
            [cityOf(e), e.country].filter(Boolean).join(' \u00b7 ') + '</div>' +
            '<div class="cal-card-foot">' + tail + '</div></div></div>';
        }).join('');
        return '<div class="cal-mgroup">' +
          '<div class="el-01-SectionHeader--default el01-wrap"><div class="el01">' +
          '<div class="el01-left"><h2 class="t-h2">' + monthLabelOf(m) + '</h2>' +
          '<span class="t-body-s fed-ov-sub">' + list.length +
          ' stop' + (list.length === 1 ? '' : 's') + '</span></div></div></div>' +
          '<div class="cal-cards">' + cards + '</div></div>';
      }).join('');

      $$('.cal-card', cardHost).forEach(function (card) {
        if (card.dataset.ioc) flag($('.flag', card), card.dataset.ioc);
        link(card, card.dataset.href);
      });
      if (window.FIBA) window.FIBA.init(cardHost);
    }

    function drawMonth() {
      if (!monthHost) return;
      monthHost.hidden = (view !== 'day');
      if (view !== 'day') return;
      var months = monthsWithStops();
      if (!months.length) { monthHost.hidden = true; return; }
      monthHost.hidden = false;
      if (months.indexOf(monthPick) < 0) {
        var todayM = iso(new Date()).slice(0, 7);
        monthPick = months.indexOf(todayM) > -1 ? todayM : months[months.length - 1];
      }

      var byDay = {};
      pool().forEach(function (e) { (byDay[e.start] = byDay[e.start] || []).push(e); });

      var first = new Date(monthPick + '-01T12:00:00');
      var startDow = (first.getDay() + 6) % 7;                 /* Monday = 0 */
      var gridStart = new Date(first);
      gridStart.setDate(1 - startDow);
      var todayISO = iso(new Date());

      var nav = months.map(function (m) {
        return '<div class="cal-mtab' + (m === monthPick ? ' cal-mtab-on' : '') +
               '" role="button" tabindex="0" data-m="' + m + '">' +
               new Date(m + '-01T12:00:00')
                 .toLocaleDateString('en-GB', { month: 'short' }).toUpperCase() +
               '</div>';
      }).join('');

      var cells = '';
      for (var i = 0; i < 42; i++) {
        var d = new Date(gridStart);
        d.setDate(gridStart.getDate() + i);
        var dISO = isoDay(d);
        var out = dISO.slice(0, 7) !== monthPick;
        if (out && i >= 35) continue;
        var evs = byDay[dISO] || [];
        var evHtml = evs.map(function (e) {
          var c = conf(e.conference) || {};
          var live = stopLive(e, todayISO);
          var played = stopPlayed(e, todayISO);
          var w = played ? winnerOf(e, gender) : null;
          var tail = live
            ? '<div class="el-05-StatusBadge--live badge badge-live cut cut-s">' +
              '<span class="badge-dot"></span><span class="lbl">Live</span></div>'
            : (w ? '<div class="ftag ftag-s cut cut-s ftag-plain ftag-static cal-ev-w">' +
                   '<div class="flag flag-ring"></div>' +
                   '<div class="ftag-txt"><span class="ftag-code">' + w.ioc + '</span></div></div>'
                 : '<span class="t-caption cal-ev-soon">' +
                   (played ? 'Finished' : 'Upcoming') + '</span>');
          return '<div class="cal-ev cut cut-s cut-out' +
            (live ? ' cal-ev-live' : played ? ' cal-ev-done' : ' cal-ev-next') +
            '" data-href="stop.html?id=' + e.slug + '" data-ioc="' + (w ? w.ioc : '') +
            '" role="link" tabindex="0" title="' + confName(c) + ' \u00b7 Stop ' + e.number +
            ' \u00b7 ' + cityOf(e) + '">' +
            '<div class="cutfill"></div>' +
            '<span class="cal-ev-c t-caption">' + confName(c) + '</span>' +
            '<span class="cal-ev-city t-body-s">' + cityOf(e) + ' \u00b7 Stop ' + e.number + '</span>' +
            '<span class="cal-ev-tail">' + tail + '</span></div>';
        }).join('');
        cells += '<div class="cal-cell' + (out ? ' cal-out' : '') +
          (dISO === todayISO ? ' cal-today' : '') +
          (sel >= 0 && dISO === days[sel] ? ' cal-sel' : '') +
          (evs.length ? ' cal-has' : '') + '" data-d="' + dISO + '">' +
          '<span class="cal-daynum t-caption">' + d.getDate() + '</span>' +
          evHtml + '</div>';
      }

      monthHost.innerHTML =
        '<div class="el-01-SectionHeader--default el01-wrap cal-mhead"><div class="el01">' +
        '<div class="el01-left"><h2 class="t-h3">' + monthLabelOf(monthPick) + '</h2></div>' +
        '<div class="el01-right"><div class="cal-mnav">' + nav + '</div></div></div></div>' +
        '<div class="cal-grid">' +
        DOW.map(function (w) { return '<div class="cal-dow t-caption">' + w + '</div>'; }).join('') +
        cells + '</div>';

      $$('.cal-mtab', monthHost).forEach(function (t) {
        t.addEventListener('click', function () { monthPick = t.dataset.m; drawMonth(); });
        t.addEventListener('keydown', function (ev) {
          if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); t.click(); }
        });
      });
      $$('.cal-ev', monthHost).forEach(function (c) {
        if (c.dataset.ioc) flag($('.flag', c), c.dataset.ioc);
        link(c, c.dataset.href);
      });
      /* The day number is the other control: it picks the day, which
         is what the strip and the list below already speak. */
      $$('.cal-cell.cal-has .cal-daynum', monthHost).forEach(function (n) {
        n.style.cursor = 'pointer';
        n.addEventListener('click', function (ev) {
          ev.stopPropagation();
          var dISO = n.parentElement.dataset.d;
          var i = days.indexOf(dISO);
          if (i < 0) return;
          sel = (sel === i) ? -1 : i;
          win = Math.max(0, Math.min(i - Math.floor(SLOTS / 2), Math.max(0, days.length - SLOTS)));
          clampWin();
          drawStrip(); drawList();      /* drawList redraws the month */
        });
      });
    }

    days = dayList();
    clampWin();

    /* Review 5: the page opens on All and on today, as the prototype
       does, and Clear filter is what returns the whole season. */
    function openOnToday() {
      var i = days.indexOf(iso(new Date()));
      sel = i;
      if (i > -1 && days.length > SLOTS) {
        win = Math.max(0, Math.min(i - Math.floor(SLOTS / 2), days.length - SLOTS));
      }
      clampWin();
    }
    openOnToday();

    region = chipFilter(function (r) {
      region = r; days = dayList(); sel = -1; win = 0; clampWin();
      drawStrip(); drawList();
    }) || 'All';
    gender = genderSwitch(function (g) { gender = g; drawList(); }, $('.f04-ctl')) || 'men';
    var setQuery = searchField($('.cal-find') || document,
                'Search a stop, city or federation',
                function (q) { query = q; drawList(); });

    /* The chips and the reset share one row: chips from the left,
       Clear filter at the right end, both at the chips' height. */
    (function () {
      var chips = $('.el03');
      if (!chips || chips.closest('.cal-bar')) return;
      var bar = el('div', 'cal-bar');
      chips.parentNode.insertBefore(bar, chips);
      bar.appendChild(chips);
      var b = el('button', 'cal-clear',
        '<span>Clear filter</span>' +
        '<svg fill="currentColor" height="16" viewBox="0 -960 960 960" width="16" ' +
        'aria-hidden="true"><path d="m251-160-91-91 229-229-229-229 91-91 229 229 229-229 ' +
        '91 91-229 229 229 229-91 91-229-229Z"></path></svg>');
      b.type = 'button';
      b.setAttribute('aria-label', 'Clear every filter');
      b.addEventListener('click', function () {
        region = 'All';
        sel = -1;
        win = 0;
        query = '';
        days = dayList();
        clampWin();
        $$('.chip', chips).forEach(function (c, i) {
          c.classList.toggle('chip-on', i === 0);
        });
        var inp = $('.cal-find input') || $('.search input');
        if (inp && inp.value) {
          inp.value = '';
          inp.dispatchEvent(new Event('input', { bubbles: true }));
        }
        query = '';
        drawStrip();
        drawList();
      });
      /* Review 6: it is a switched-on control, so it is only there
         while something is switched on. Every redraw re-asks whether
         the page is still narrowed; clearing it puts the page back to
         All and to the whole season and the button goes with it. */
      function syncClear() {
        /* Review 18 (second pass) — a picked day is a Day view fact.
           In Month view the calendar opens on today by default, which
           made Clear filter appear on a page with nothing filtered. */
        var dayFilter = (view === 'day') && sel >= 0;
        b.hidden = (!region || region === 'All') && !dayFilter && !query;
      }
      var _strip = drawStrip, _list = drawList;
      drawStrip = function () { _strip(); syncClear(); };
      drawList = function () { _list(); syncClear(); };
      syncClear();
      /* Review 19 — Daniel: the reset belongs to the day strip, at its
         bottom right, and not in the row of chips at the top. The row
         above keeps the chips and the view switch; this is the one
         control that undoes both. */
      if (strip && strip.parentNode) {
        var cbar = el('div', 'cal-clearbar');
        cbar.appendChild(b);
        strip.parentNode.insertBefore(cbar, strip.nextSibling);
      } else {
        bar.appendChild(b);
      }
    })();

    (function () {
      /* The section still carried the landing page's "Live now"
         heading, which is what it was copied from. On a calendar it
         is the season. */
      /* Review 20 — Daniel: the sub-headline goes. The page is
         titled Calendar, the chips say which region and the two view
         chips say which view; a second heading reading "Season
         calendar" over all of it named the page a second time. The
         header carried the block's only link out to Conferences,
         which round eighteen had already removed. */
      var h = $$('.el01 .t-h2').filter(function (n) {
        return /live now|season calendar/i.test(n.textContent || '');
      })[0];
      var hwrap = h && (h.closest('.el01-wrap') || h.closest('.el01'));
      if (hwrap) hwrap.remove();

      /* One section holds the header, the chips, the day strip and the
         accordions. Month cards go directly under the strip; the grid
         and the day's list follow, and which of the two sets is on
         screen is what the view toggle decides. */
      /* Review 19 — Daniel: Day view goes back to what it was, which
         is the Live now block on a day of the reader's choosing. The
         seven-column grid built last round was a second calendar
         inside the calendar: Month view already answers "what does
         August look like", and under the day strip it only repeated
         the picking the strip was doing. It is not hidden, it is not
         built — drawMonth() finds no host and stands down. */
      cardHost = el('div', 'cal-cardwrap');
      var firstAcc = accHost && $('.acc', accHost);
      if (firstAcc) accHost.insertBefore(cardHost, firstAcc);
      else if (accHost) accHost.appendChild(cardHost);
    })();

    /* ctl-14 Chip as a view switch, at the right of the filter row —
       where Clear filter used to sit, because it is the control that
       decides what the row below is. */
    (function () {
      var bar = $('.cal-bar');
      if (!bar) return;
      var wrap = el('div', 'cal-view');
      /* Review 20 — Material Symbols' calendar_month and
         calendar_today: a month of squares and a single day, so the
         two chips are told apart before the words are read. */
      var ICO = {
        month: '<svg class="cal-vico" fill="currentColor" height="18" width="18" ' +
          'viewBox="0 -960 960 960" aria-hidden="true"><path d="M200-80q-33 0-56.5-23.5T120-160v-560q0-33 ' +
          '23.5-56.5T200-800h40v-80h80v80h320v-80h80v80h40q33 0 56.5 23.5T840-720v560q0 33-23.5 ' +
          '56.5T760-80H200Zm0-80h560v-400H200v400Zm0-480h560v-80H200v80Zm0 0v-80 80Zm280 240q-17 ' +
          '0-28.5-11.5T440-440q0-17 11.5-28.5T480-480q17 0 28.5 11.5T520-440q0 17-11.5 28.5T480-400Zm-160 ' +
          '0q-17 0-28.5-11.5T280-440q0-17 11.5-28.5T320-480q17 0 28.5 11.5T360-440q0 17-11.5 28.5T320-400Zm320 ' +
          '0q-17 0-28.5-11.5T600-440q0-17 11.5-28.5T640-480q17 0 28.5 11.5T680-440q0 17-11.5 28.5T640-400ZM480-240q-17 ' +
          '0-28.5-11.5T440-280q0-17 11.5-28.5T480-320q17 0 28.5 11.5T520-280q0 17-11.5 28.5T480-240Zm-160 ' +
          '0q-17 0-28.5-11.5T280-280q0-17 11.5-28.5T320-320q17 0 28.5 11.5T360-280q0 17-11.5 28.5T320-240Zm320 ' +
          '0q-17 0-28.5-11.5T600-280q0-17 11.5-28.5T640-320q17 0 28.5 11.5T680-280q0 17-11.5 28.5T640-240Z"></path></svg>',
        day: '<svg class="cal-vico" fill="currentColor" height="18" width="18" ' +
          'viewBox="0 -960 960 960" aria-hidden="true"><path d="M200-80q-33 0-56.5-23.5T120-160v-560q0-33 ' +
          '23.5-56.5T200-800h40v-80h80v80h320v-80h80v80h40q33 0 56.5 23.5T840-720v560q0 33-23.5 ' +
          '56.5T760-80H200Zm0-80h560v-400H200v400Zm0-480h560v-80H200v80Zm0 0v-80 80Zm280 ' +
          '160h200v200H480v-200Z"></path></svg>'
      };
      [['month', 'Month view'], ['day', 'Day view']].forEach(function (v) {
        var b = el('div', 'el-14-Chip--m-default chip chip-m cut cut-s cut-out' +
                          (v[0] === view ? ' chip-on' : ''),
                   '<div class="cutfill"></div>' + ICO[v[0]] +
                   '<span class="lbl">' + v[1] + '</span>');
        b.setAttribute('role', 'button');
        b.setAttribute('tabindex', '0');
        b.addEventListener('click', function () {
          if (view === v[0]) return;
          view = v[0];
          $$('.chip', wrap).forEach(function (x) { x.classList.remove('chip-on'); });
          b.classList.add('chip-on');
          /* Day view is a day, so arriving at it lands on one — the
             same day Live now opens on — rather than on the whole
             season with an empty strip. */
          if (view === 'day' && sel < 0) { openOnToday(); }
          drawStrip(); drawList();
        });
        b.addEventListener('keydown', function (ev) {
          if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); b.click(); }
        });
        wrap.appendChild(b);
      });
      bar.appendChild(wrap);
    })();

    /* The region chips, the gender switch and Clear filter all reach
       the month as well as the strip and the list — one set of
       controls over one page, which is the rule this site keeps. */
    var _list0 = drawList;
    drawList = function () { _list0(); drawCards(); };

    drawStrip();
    drawList();
  };

  PAGES['stats.html'] = function () {
    var gender = 'men', confId = 'All';

    /* Which federation a player belongs to — the squads tell us. */
    var teamOf = {};
    D.teams.forEach(function (t) {
      (t.roster || []).forEach(function (m) { if (m.id) teamOf[m.id] = t; });
    });

    /* the conference filter, built from the conferences themselves */
    (function () {
      var host = $('.st-conf');
      if (!host) return;
      var proto = $('.chip', host).cloneNode(true);
      host.innerHTML = '';
      var opts = [{ id: 'All', label: 'All conferences' }].concat(
        D.conferences.map(function (c) { return { id: c.id, label: confName(c) }; }));
      opts.forEach(function (o, i) {
        var chip = proto.cloneNode(true);
        chip.classList.toggle('chip-on', i === 0);
        text(chip, '.lbl', o.label);
        chip.onclick = function () {
          confId = o.id;
          $$('.chip', host).forEach(function (x) { x.classList.remove('chip-on'); });
          chip.classList.add('chip-on');
          draw();
        };
        host.appendChild(chip);
      });
    })();

    function scope() {
      return federationTable(gender).filter(function (t) {
        return confId === 'All' || t.conference === confId;
      });
    }

    /* Review 18 — one cap, both tables. */
    var TOP_N = 30;
    /* Review 18 — the same resting order the Standings page uses:
       the U23 ladder, then the U21 ladder, each counting from one.
       Sorting the two together by tour points put a side with no
       qualification status at position 1 of a table whose last
       column is qualification status. */
    var perfSort = { key: 'order', dir: 1 };
    var playSort = { key: 'points', dir: -1 };

    function drawTeams() {
      var list = scope();

      /* Review 18 — Team Spotlight is gone. It named the federation
         scoring most per game, which is a comparison between teams
         that have played different numbers of stops in conferences
         at different points of their season: a federation one stop
         in could top it on one good day. Alex asked for tables,
         filters and export instead, and the space it took is now
         rows. The player side keeps its own. */
      var spot = $('.st-top');
      var spotSec = spot && spot.closest('.tpl-sub');
      if (spotSec) spotSec.remove();
      /* Review 18 (second pass) — Overview goes with it. Five figures
         about the filter ("604 final games, 101 teams in scope") are a
         description of the query rather than a statistic anyone came
         for, and the tables below state everything they summarised. */
      var ovSec = ($('.st-ov') || {}).closest ? $('.st-ov').closest('.tpl-sub') : null;
      if (ovSec) ovSec.remove();
      /* The second table ranked the same federations by points
         scored — one column the main table did not have. That column
         is in the main table now (TOUR PTS is the ranking measure and
         PTS AVG the rate), so the block is absorbed rather than kept. */
      var scoring = $('.st-scoring');
      var scoringSec = scoring && scoring.closest('.tpl-sub');
      if (scoringSec) scoringSec.remove();

      var tbl = $('.st-perf');
      if (!tbl) return;
      var oldF = tbl.parentElement.querySelector(':scope > .site-empty');
      if (oldF) oldF.remove();
      if (!list.length) {
        tbl.innerHTML = '';
        emptyState(tbl.parentElement, 'Nothing to rank yet',
                   'No federation in this filter has played a game.',
                   { icon: 'info' });
        return;
      }
      /* Review 18 — the same rule the player table uses: sort by the
         chosen column, then take the top thirty. It was twelve here
         and thirty there, so the two halves of the page disagreed
         about how much of the field they were showing. */
      var perf = list.slice().sort(cmp(perfSort.key, perfSort.dir));
      wtScroll(tbl);
      wtTable(tbl, perf, seasonStops(), {
        seed: true, points: true, limit: TOP_N,
        sub: function (r) { return r.confname; }
      });
      sortable(tbl, WT_COLS, perfSort, drawTeams);
    }

    function drawPlayers() {
      var host = $('[data-pane="players"] .tbl') ||
                 $$('[data-pane="players"] > div').filter(function (x) { return $('.trow', x); })[0];
      if (!host) return;
      var list = D.players.filter(function (p) {
        var t = teamOf[p.id];
        if (!t) return false;
        if (gender && t.gender && t.gender !== gender) return false;
        return confId === 'All' || t.conference === confId;
      });
      /* Review 15 — the three numeric columns were printing an em
         dash on the grounds that the snapshot has no box scores.
         It has none, but the box score is derived from the final
         score — the player page has been summing exactly this all
         along, so the table can state it too. */
      list.forEach(function (p) {
        var tt = playerTotals(p.id);
        p.games = tt.games;
        p.points = tt.games ? tt.points : 0;
        p.ppg = tt.games ? tt.points / tt.games : 0;
        p.ranking = p.rankingPoints || 0;
        p.pname = ((p.last || '') + ' ' + (p.first || '')).trim() || p.name || '';
        p.teamioc = (teamOf[p.id] || {}).ioc || p.ioc || '';
        p.confname = confName(conf((teamOf[p.id] || {}).conference));
      });
      list = list.sort(cmp(playSort.key, playSort.dir)).slice(0, TOP_N);

      var old = host.parentElement.querySelector(':scope > .site-empty');
      if (!list.length) {
        $$('.trow', host).forEach(function (r) { r.hidden = true; });
        emptyState(host.parentElement, 'Nothing to rank yet',
                   'No player is in scope for this filter.');
        return;
      }
      if (old) old.remove();
      repeat(host, '.trow', list, function (row, p, i) {
        row.hidden = false;
        var t = teamOf[p.id] || {};
        text(row, '.r05-rank .t-data-m', i + 1);
        text(row, '.r05-rank', i + 1);
        var name = $('.r05-pl .team-name', row) || $('.r05-pl', row);
        if (name) name.textContent = p.name;
        var init = $('.r05-pl .av-init', row);
        if (init) init.textContent = ((p.first || ' ')[0] + (p.last || ' ')[0]).toUpperCase();
        avatarOf($('.r05-pl .av', row), p);
        flag($('.r05-pl .flag', row), p.ioc);
        /* Team, its own column: flag, IOC code, and the federation the
           player is fielded by. */
        var tc = $('.r05-team', row);
        if (tc) {
          flag($('.flag', tc), t.ioc || p.ioc);
          text(tc, '.ftag-code', t.ioc || p.ioc);
        }
        text(row, '.c-conf .t-body-s', confName(conf(t.conference)));
        /* Games and PPG stay empty: the snapshot has no box scores. The
           middle column is relabelled to the measure we do hold rather
           than printing ranking points under a Points heading. */
        text(row, '.cell-games .t-data-m', p.games || '—');
        text(row, '.cell-points .t-data-m', p.games ? p.points : '—');
        text(row, '.cell-ppg .t-data-m', p.games ? p.ppg.toFixed(1) : '—');
        text(row, '.cell-ranking .t-data-m', p.ranking.toLocaleString());
        link(row, 'player.html?id=' + p.id);
      });
    }

    function draw() { drawTeams(); drawPlayers(); }

    /* Review 15 — "I assume sorteable by PPG, and Team and name."
       Both tables use the same el-08 sorter the Standings page has;
       each opens on the column its ranking is about. */
    var PLAY_COLS = {
      'cell-player':     { key: 'pname', text: 1 },
      'cell-team':       { key: 'teamioc', text: 1 },
      'cell-conference': { key: 'confname', text: 1 },
      'cell-games':      { key: 'games' },
      'cell-points':     { key: 'points' },
      'cell-ppg':        { key: 'ppg' },
      'cell-ranking':    { key: 'ranking' }
    };

    gender = genderSwitch(function (g) { gender = g; draw(); });
    tabPanes(document, '.st-tabs');
    /* The team table is rebuilt on every draw, so its header is new
       each time and the sorter is bound inside drawTeams(). */
    var plTbl = $('[data-pane="players"] .thead');
    if (plTbl) sortable(plTbl.parentElement, PLAY_COLS, playSort, draw);
    draw();
  };

  /* qualification.html is a redirect to standings.html?view=qualification
     — the two tables were merged behind ctl-08 ToggleSwitch. */

  /* Review 18 — search.html is the overlay, full width: initChrome
     binds this page's own .ovl to searchOverlay() and paints it on
     every keystroke, so a second renderer here would only fight it.
     What the page did need is a way in from a link — a magnifier on
     another page can now hand over a query — which is prefilled in
     initChrome, where the input actually exists. */
  PAGES['search.html'] = function () {};

  /* ---------- site chrome: mega menu and search overlay -------
     Both are documented modules (F-05 and E-11). They live in
     partials/ so a change is one file, and they are injected into
     every page rather than duplicated into fourteen.            */
  function initChrome() {
    var host = $('.tpl') || document.body;

    /* The panel hangs below the chrome, so measure it rather than
       hard-coding 98px — the corporate strip can wrap. */
    function chromeHeight() {
      var f02 = $('.f02'), f03 = $('.f03');
      return (f02 ? f02.offsetHeight : 0) + (f03 ? f03.offsetHeight : 0);
    }
    function place(el) {
      if (el) el.style.setProperty('--chrome-h', chromeHeight() + 'px');
    }
    /* Declared out here: the resize handler below runs long before the
       partials resolve, and reading them from the fetch callback's scope
       threw "mm is not defined" on every resize. */
    var mm = null, ovl = null;
    window.addEventListener('resize', function () { place(mm); place(ovl); });

    var openPanel = null, closeTimer = null;
    function open(el, on) {
      if (!el) return;
      clearTimeout(closeTimer);
      if (on) {
        if (openPanel && openPanel !== el) open(openPanel, false);
        place(el);
        el.hidden = false;
        /* one frame with the panel measured but still raised, so the
           transition has somewhere to come from */
        requestAnimationFrame(function () { el.classList.add('is-open'); });
        openPanel = el;
      } else {
        el.classList.remove('is-open');
        closeTimer = setTimeout(function () { el.hidden = true; }, 320);
        if (openPanel === el) openPanel = null;
      }
    }

    Promise.all([
      fetch('partials/megamenu.html').then(function (r) { return r.text(); }),
      fetch('partials/search.html').then(function (r) { return r.text(); })
    ]).then(function (parts) {
      var wrap = document.createElement('div');
      wrap.innerHTML = parts[0] + parts[1];
      mm = wrap.querySelector('.mm');
      ovl = wrap.querySelector('.ovl');
      if (mm) {
        mm.classList.add('site-mm');
        /* F-05 marks the current page the way F-03 does — white label
           with a white rule under it. The specimen had Standings marked
           with the gold accent, and being a partial it did that on
           every page in the site. */
        var here = (document.body.dataset.page || 'index.html').split('?')[0];
        $$('a.nav-a', mm).forEach(function (a) {
          if ((a.getAttribute('href') || '').split('?')[0] !== here) return;
          $$('.mm-l', a).forEach(function (l) { l.classList.add('mm-l-on'); });
        });
        host.appendChild(mm);
      }

      /* T · Search *is* the overlay, so use the one already on the page
         rather than stacking a second copy on top of it. */
      var onSearchPage = document.body.dataset.page === 'search.html';
      if (onSearchPage) {
        ovl = $('.ovl');
        if (ovl) ovl.hidden = false;
      } else if (ovl) {
        ovl.classList.add('site-ovl');
        host.appendChild(ovl);
      }

      /* Apple's pattern: hover opens on a mouse, tap opens on touch. */
      var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
      function trigger(el, panel) {
        if (!el) return;
        el.style.cursor = 'pointer';
        el.addEventListener('click', function (e) { e.preventDefault(); open(panel, true); });
        if (!fine) return;
        el.addEventListener('mouseenter', function () { open(panel, true); });
      }
      if (fine) {
        /* leaving both the trigger and the panel closes it */
        [mm, ovl].forEach(function (p) {
          if (!p) return;
          p.addEventListener('mouseleave', function () { open(p, false); });
        });
      }

      $$('.f03-i').forEach(function (i) {
        if (!/^more$/i.test(i.textContent.trim())) return;
        i.classList.add('f03-more');
        trigger(i.closest('a') || i, mm);
      });
      $$('.mm-close', mm).forEach(function (c) {
        c.addEventListener('click', function () { open(mm, false); });
      });

      /* the magnifier opens the search overlay */
      $$('.f03-search').forEach(function (sBtn) {
        var host2 = sBtn.closest('a') || sBtn;
        host2.style.cursor = 'pointer';
        function show(e) {
          if (e) e.preventDefault();
          open(ovl, true);
          var inp = ovl && ovl.querySelector('input');
          if (inp) setTimeout(function () { inp.focus(); }, 60);
        }
        host2.addEventListener('click', show);
        /* With one panel already open, sliding across to the other
           trigger swaps them straight away rather than closing first. */
        if (fine) host2.addEventListener('mouseenter', function () { show(); });
      });
      $$('.ovl-close', ovl).forEach(function (c) {
        c.style.cursor = 'pointer';
        c.addEventListener('click', function () {
          if (onSearchPage) { history.length > 1 ? history.back() : (location.href = 'index.html'); }
          else open(ovl, false);
        });
      });

      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') { open(mm, false); open(ovl, false); }
      });

      /* the overlay's field is a real input over real data */
      if (ovl) {
        var txt = ovl.querySelector('.search-txt, .search-txt-filled');
        if (txt) {
          var inp = document.createElement('input');
          inp.type = 'text';
          inp.className = 'search-in';
          inp.setAttribute('autocomplete', 'off');
          inp.placeholder = 'Search for a federation, player or article';
          txt.replaceWith(inp);
          inp.addEventListener('input', function () { searchOverlay(ovl, this.value); });
        }
        /* Review 18 — arriving with ?q= runs the search rather than
           showing an empty page and waiting to be typed into. */
        var q0 = (document.body.dataset.page === 'search.html')
          ? (new URLSearchParams(location.search).get('q') || '') : '';
        var inp0 = ovl && ovl.querySelector('input');
        if (q0 && inp0) inp0.value = q0;
        searchOverlay(ovl, q0);       /* empty: every group hidden */
      }
      if (window.FIBA) window.FIBA.init(host);
    });
  }

  /* Federations, players and news, filtered live. */
  function searchOverlay(ovl, q) {
    q = (q || '').trim().toLowerCase();
    var scrim = $('.ovl-scrim', ovl);
    if (!q) {
      /* An empty field lists nothing — results appear as you type. */
      if (scrim) scrim.hidden = true;
      return;
    }
    if (scrim) scrim.hidden = false;

    /* Review 18 — team sites, not federations. */
    var feds = searchSites(q, SEARCH_MAX);
    var players = D.players.filter(function (p) {
      return (p.name || '').toLowerCase().indexOf(q) > -1;
    }).slice(0, 6);
    var news = D.news.filter(function (n) {
      return (n.title || '').toLowerCase().indexOf(q) > -1;
    });

    var groups = $$('.e11-g', ovl);
    var sets = [
      { rows: feds, label: 'Teams',
        paint: function (row, t) { paintSiteRow(row, t); } },
      { rows: players, label: 'Players',
        paint: function (row, p) {
          fed(row, p.ioc, nationOf(p.ioc) || p.country);
          text(row, '.e11-t', p.name);
          text(row, '.e11-m', nationOf(p.ioc) || p.country || '');
          link(row, 'player.html?id=' + p.id);
        } },
      { rows: news, label: 'News',
        paint: function (row, n) {
          text(row, '.e11-t', n.title);
          text(row, '.e11-m', fmtDate(n.date));
          link(row, 'article.html?id=' + n.slug);
        } }
    ];
    groups.forEach(function (g, i) {
      var set = sets[i];
      if (!set) return;
      g.hidden = !set.rows.length;
      var h = $('.e11-gh', g);
      if (h) {
        text(h, '.t-h3', set.label);
        text(h, '.t-caption', set.rows.length + ' result' + (set.rows.length === 1 ? '' : 's'));
      }
      repeat(g, '.e11-row', set.rows, set.paint);
    });
  }


  /* ============================================================
     S-12 GameDetail — the page behind every Box score link.

     The feed we hold carries the result of every game and the four
     players each federation fielded, but no player statistics: the
     endpoints that hold them were not in the snapshot. Rather than ship
     an empty page, the box score, the match stats and the play-by-play
     are derived from the two things that ARE real — the final score and
     the squads — using the simplest model that can produce it: every
     point is either a two-pointer or a free throw. The derivation is
     seeded on the game id, so a game always reads the same way on every
     load, and the page says so under the box score.
     ============================================================ */

  function hashOf(str) {
    var h = 2166136261;
    for (var i = 0; i < String(str).length; i++) {
      h ^= String(str).charCodeAt(i);
      h = (h * 16777619) >>> 0;
    }
    return h >>> 0 || 1;
  }
  function rngOf(seed) {
    var s = seed >>> 0 || 1;
    return function () {
      s ^= s << 13; s >>>= 0;
      s ^= s >> 17;
      s ^= s << 5;  s >>>= 0;
      return s / 4294967296;
    };
  }

  var GAME_ROLES = ['Guard', 'Wing', 'Big'];

  /* The four players a federation fielded at this stop, in the order the
     feed lists them, with a shirt number and a role hung off the player
     id so the same player always wears the same number. */
  function gameSquad(g, side) {
    var ioc = g[side].ioc;
    if (!ioc) return [];
    /* The snapshot carries a squad list for the first stop of each
       conference only. A federation fields the same four players across
       that conference's stops, so a stop without its own roster record
       falls back to the conference's — otherwise every box score from
       stop 2 onwards came out empty. Two conferences arrive with no
       gender label at all, hence the second fallback. */
    var t = D.teams.filter(function (x) {
      return x.stop === g.stop && x.gender === g.gender && x.ioc === ioc;
    })[0] || D.teams.filter(function (x) {
      return x.conference === g.conference && x.gender === g.gender && x.ioc === ioc;
    })[0] || D.teams.filter(function (x) {
      return x.conference === g.conference && !x.gender && x.ioc === ioc;
    })[0];
    if (!t) return [];
    var used = {};
    return (t.roster || []).map(function (m, i) {
      var p = player(m.id);
      if (!p) return null;
      var n = 3 + (hashOf(m.id) % 21);
      while (used[n]) n = 3 + ((n - 2) % 21);
      used[n] = 1;
      return {
        id: m.id, first: p.first, last: p.last, name: p.name,
        captain: !!m.captain, no: n,
        role: GAME_ROLES[hashOf(m.id + 'r') % GAME_ROLES.length],
        rank: p.rankingPoints || 0,
        two: 0, ft: 0, pts: 0, order: i
      };
    }).filter(Boolean);
  }

  /* Split one team's final score into two-pointers and free throws, then
     across the squad. Weighted by 3x3 ranking points so the federation's
     best player usually leads, with a per-game wobble so it is not
     always the same name. */
  function splitScore(total, squad, rand) {
    if (!squad.length || total == null) return { two: 0, ft: 0 };
    var ft = Math.floor(rand() * Math.min(7, total + 1));
    if ((total - ft) % 2 !== 0) ft = ft > 0 ? ft - 1 : ft + 1;
    if (ft < 0) ft = 0;
    if (ft > total) ft = total % 2;
    var two = (total - ft) / 2;

    var maxRank = squad.reduce(function (a, p) { return Math.max(a, p.rank); }, 1);
    var w = squad.map(function (p) {
      return 0.55 + (p.rank / maxRank) * 1.1 + rand() * 0.8;
    });
    var sum = w.reduce(function (a, b) { return a + b; }, 0);
    function pick() {
      var r = rand() * sum, acc = 0;
      for (var i = 0; i < w.length; i++) { acc += w[i]; if (r <= acc) return i; }
      return w.length - 1;
    }
    var i;
    for (i = 0; i < two; i++) squad[pick()].two++;
    for (i = 0; i < ft;  i++) squad[pick()].ft++;
    squad.forEach(function (p) { p.pts = p.two * 2 + p.ft; });
    return { two: two, ft: ft };
  }

  /* Interleave the two teams' scores into a sequence that ends on the
     real final score. The team that is behind is likelier to score next,
     which is what produces a game that reads as a contest rather than a
     run — and it is where the lead-change count comes from. */
  function buildPlayByPlay(g, H, A, rand) {
    function bag(squad, side) {
      var out = [];
      squad.forEach(function (p) {
        var i;
        for (i = 0; i < p.two; i++) out.push({ side: side, kind: '2PT', p: p, v: 2 });
        for (i = 0; i < p.ft;  i++) out.push({ side: side, kind: 'FT',  p: p, v: 1 });
      });
      for (var k = out.length - 1; k > 0; k--) {
        var j = Math.floor(rand() * (k + 1)), t = out[k]; out[k] = out[j]; out[j] = t;
      }
      return out;
    }
    var hb = bag(H.squad, 'h'), ab = bag(A.squad, 'a');
    var evs = [], hs = 0, as = 0, leads = 0, sign = 0;
    while (hb.length || ab.length) {
      var takeHome;
      if (!ab.length) takeHome = true;
      else if (!hb.length) takeHome = false;
      else {
        var behind = hs < as ? 'h' : (as < hs ? 'a' : null);
        var pHome = behind === 'h' ? 0.62 : behind === 'a' ? 0.38 : 0.5;
        takeHome = rand() < pHome;
      }
      var ev = takeHome ? hb.pop() : ab.pop();
      if (ev.side === 'h') hs += ev.v; else as += ev.v;
      ev.hs = hs; ev.as = as;
      var ns = hs > as ? 1 : (as > hs ? -1 : 0);
      if (ns !== 0 && sign !== 0 && ns !== sign) leads++;
      if (ns !== 0) sign = ns;
      evs.push(ev);
    }
    /* One timeout each, the way a 3x3 game is played, dropped somewhere
       in the middle of the run rather than at either end. */
    ['h', 'a'].forEach(function (side) {
      if (evs.length < 6) return;
      var at = 2 + Math.floor(rand() * (evs.length - 4));
      var prev = evs[at - 1] || { hs: 0, as: 0 };
      evs.splice(at, 0, { side: side, kind: 'TIMEOUT', hs: prev.hs, as: prev.as,
                          team: side === 'h' ? g.home : g.away });
    });
    /* A 3x3 game runs ten minutes or to 21. Spread the events across the
       clock, in order, and never past full time. */
    var span = 9 * 60 + 40, t = 12;
    evs.forEach(function (ev, i) {
      var left = evs.length - i;
      t += Math.max(6, Math.round(((span - t) / left) * (0.55 + rand() * 0.9)));
      if (t > span) t = span;
      ev.t = ('0' + Math.floor(t / 60)).slice(-2) + ':' + ('0' + (t % 60)).slice(-2);
    });
    return { events: evs, leadChanges: leads };
  }

  function deriveGame(g) {
    var rand = rngOf(hashOf(g.id));
    var H = { squad: gameSquad(g, 'home') }, A = { squad: gameSquad(g, 'away') };
    var hs = g.home.score, as = g.away.score;
    if (hs == null || as == null) return { home: H, away: A, events: [], leadChanges: 0, played: false };
    var ht = splitScore(hs, H.squad, rand);
    var at = splitScore(as, A.squad, rand);
    H.two = ht.two; H.ft = ht.ft; A.two = at.two; A.ft = at.ft;
    var pbp = buildPlayByPlay(g, H, A, rand);
    return { home: H, away: A, events: pbp.events, leadChanges: pbp.leadChanges, played: true };
  }

  /* ---------- season totals for one player --------------------
     The box score is derived, not fed: deriveGame() splits a final
     score across the squad deterministically, so the same game always
     produces the same line. Summing those lines over every game a
     federation played gives a player's games, points and win ratio —
     the three figures E-08 PlayerCard states. Everything here is
     cached, because a roster grid asks for it four times at once and a
     leaderboard asks for it several hundred times.                */
  var BOX_CACHE = {}, TOTALS_CACHE = {}, FED_GAMES = null;

  function boxOf(g) {
    if (BOX_CACHE[g.id]) return BOX_CACHE[g.id];
    var rand = rngOf(hashOf(g.id));
    var H = { squad: gameSquad(g, 'home') }, A = { squad: gameSquad(g, 'away') };
    var hs = g.home.score, as = g.away.score;
    if (hs != null && as != null) {
      splitScore(hs, H.squad, rand);
      splitScore(as, A.squad, rand);
    }
    return (BOX_CACHE[g.id] = { home: H, away: A });
  }

  function fedKey(conference, gender, ioc) {
    return conference + '|' + (gender || '') + '|' + ioc;
  }
  function fedGames(conference, gender, ioc) {
    if (!FED_GAMES) {
      FED_GAMES = {};
      D.games.forEach(function (g) {
        ['home', 'away'].forEach(function (sd) {
          if (!g[sd].ioc) return;
          var k = fedKey(g.conference, g.gender, g[sd].ioc);
          (FED_GAMES[k] = FED_GAMES[k] || []).push(g);
        });
      });
    }
    return FED_GAMES[fedKey(conference, gender, ioc)] || [];
  }

  /* Every played game this player appeared in, newest last, with the
     line they put up in it. */
  var PGAMES_CACHE = {};
  function playerGames(pid) {
    if (PGAMES_CACHE[pid]) return PGAMES_CACHE[pid];
    var out = [], seen = {};
    D.teams.filter(function (t) {
      return (t.roster || []).some(function (m) { return m.id === pid; });
    }).forEach(function (t) {
      fedGames(t.conference, t.gender, t.ioc).forEach(function (g) {
        if (seen[g.id]) return;
        if (g.home.score == null || g.away.score == null) return;
        seen[g.id] = 1;
        var side = g.home.ioc === t.ioc ? 'home' : 'away';
        var other = side === 'home' ? 'away' : 'home';
        var me = boxOf(g)[side].squad.filter(function (x) { return x.id === pid; })[0];
        if (!me) return;
        out.push({ game: g, side: side, other: other, line: me,
                   won: g[side].score > g[other].score });
      });
    });
    out.sort(function (a, b) {
      return String(a.game.start || '').localeCompare(String(b.game.start || ''));
    });
    return (PGAMES_CACHE[pid] = out);
  }

  function playerTotals(pid) {
    if (TOTALS_CACHE[pid]) return TOTALS_CACHE[pid];
    var out = { games: 0, points: 0, two: 0, ft: 0, won: 0, winRatio: null };
    playerGames(pid).forEach(function (r) {
      out.games++;
      out.points += r.line.pts || 0;
      out.two += r.line.two || 0;
      out.ft += r.line.ft || 0;
      if (r.won) out.won++;
    });
    if (out.games) out.winRatio = out.won / out.games;
    return (TOTALS_CACHE[pid] = out);
  }

  /* The three figures E-08 states, formatted. */
  function playerCardStats(p) {
    var t = playerTotals(p.id);
    return [['Games', t.games || '—'],
            ['Points', t.games ? t.points : '—'],
            ['Win ratio', pctRatio(t.winRatio)]];
  }

  PAGES['game.html'] = function () {
    var qs = new URLSearchParams(location.search);
    var id = qs.get('id');
    var g = D.games.filter(function (x) { return x.id === id; })[0] || D.games[0];
    if (!g) return;

    var e = stop(g.stop) || {};
    var c = conf(g.conference) || {};
    var played = g.home.score != null && g.away.score != null;
    var live = stopLive(e);
    var homeWon = played && g.home.score > g.away.score;
    var d = deriveGame(g);

    document.title = g.home.ioc + ' v ' + g.away.ioc + ' — ' + confName(c) +
                     ' — FIBA 3x3 Nations League';

    crumbs([{ label: 'Home', href: 'index.html' },
            { label: 'Conferences', href: 'conferences.html' },
            { label: confName(c), href: 'conference.html?id=' + c.id },
            { label: 'Stop ' + (e.number || ''), href: 'stop.html?id=' + g.stop },
            { label: g.pool || g.name || 'Game' }]);

    /* ---- head ----
       One caption line in the order the headline is specified: the pool
       or round first, then when, then where, then which category. */
    var cat = shortCat(c) + ' ' + (g.gender === 'women' ? 'Women' : 'Men');
    var when = fmtDate((g.start || e.start || '').slice(0, 10),
                       { day: 'numeric', month: 'short', year: 'numeric' });
    text(document, '.gm-head',
         [g.pool || g.name, when, cityOf(e), cat].filter(Boolean).join(' · '));
    var badge = $('.gm-badge');
    if (badge) {
      var lbl = $('.lbl', badge);
      badge.className = 'badge cut cut-s gm-badge ' +
                        (live ? 'badge-live' : played ? 'badge-up' : 'badge-nq');
      if (lbl) lbl.textContent = live ? 'Live' : played ? 'Final' : 'Upcoming';
    }
    /* IOC code, flag, score : score, flag, IOC code — S-04 GameList's
       arrangement at headline size. The losing side is dimmed rather
       than marked, exactly as the game list dims it. */
    text(document, '.gm-ioc-h', g.home.ioc || '—');
    text(document, '.gm-ioc-a', g.away.ioc || '—');
    flag($('.gm-flag-h'), g.home.ioc);
    flag($('.gm-flag-a'), g.away.ioc);
    text(document, '.gm-pt-h', played ? g.home.score : '–');
    text(document, '.gm-pt-a', played ? g.away.score : '–');
    ['.gm-ioc-h', '.gm-pt-h', '.gm-ioc-a', '.gm-pt-a'].forEach(function (sel) {
      var n = $(sel);
      if (n) n.classList.toggle('gm-lost',
        played && (/-h$/.test(sel) ? !homeWon : homeWon));
    });
    var hlink = $('.gm-side-h'), alink = $('.gm-side-a');
    if (hlink && g.home.ioc) link(hlink, 'team.html?ioc=' + g.home.ioc);
    if (alink && g.away.ioc) link(alink, 'team.html?ioc=' + g.away.ioc);

    /* ---- teams ---- */
    var stopGames = gamesFor(g.stop, g.gender);
    function record(ioc) {
      var w = 0, l = 0;
      stopGames.forEach(function (x) {
        if (x.home.score == null) return;
        var mine = x.home.ioc === ioc ? x.home : x.away.ioc === ioc ? x.away : null;
        if (!mine) return;
        var other = mine === x.home ? x.away : x.home;
        if (mine.score > other.score) w++; else l++;
      });
      return w + 'W · ' + l + 'L';
    }
    [['h', g.home, homeWon], ['a', g.away, played && !homeWon]].forEach(function (t) {
      var box = $('.gm-team-' + t[0]);
      if (!box) return;
      fed(box, t[1].ioc, t[1].name);
      text(box, '.gm-team-w', record(t[1].ioc));
      box.classList.toggle('gm-team-win', !!t[2]);
      var win = $('.gm-win', box);
      if (win) win.hidden = !t[2];
      link(box, 'team.html?ioc=' + t[1].ioc);
    });

    /* ---- top scorer ---- */
    var all = d.home.squad.concat(d.away.squad).slice().sort(function (a, b) {
      return (b.pts - a.pts) || (b.rank - a.rank);
    });
    var topBlock = $('.gm-top');
    var top = all[0];
    if (topBlock) {
      if (!played || !top || !top.pts) {
        /* The section used to vanish, taking its heading with it and
           leaving the Teams column on its own at half width. */
        topBlock.hidden = true;
        emptyState(topBlock.parentElement,
                   played ? 'No scorer to name' : 'Not played yet',
                   played ? 'No player is credited with a point in this game.'
                          : 'The top scorer is published with the result.',
                   { icon: 'clock' });
      } else {
        topBlock.hidden = false;
        var oldTop = topBlock.parentElement.querySelector(':scope > .site-empty');
        if (oldTop) oldTop.remove();
        var side = d.home.squad.indexOf(top) > -1 ? g.home : g.away;
        flag($('.gm-top-flag'), side.ioc);
        /* el-24 Avatar. The box score is derived, so the squad row
           carries no portrait of its own — the player record does,
           for 442 of the 711, and the id is the way back to it. */
        var init = $('.gm-top-av .av-init');
        if (init) init.textContent = ((top.first || top.name || '').charAt(0) +
                                      (top.last || '').charAt(0)).toUpperCase();
        avatarOf($('.gm-top-av'), player(top.id) || top);
        text(topBlock, '.gm-top-n', top.name);
        text(topBlock, '.gm-top-sub', '#' + top.no + ' · ' + top.role + ' · ' + side.ioc);
        text(topBlock, '.gm-top-pts', top.pts);
        link(topBlock, 'player.html?id=' + top.id);
      }
    }

    /* ---- box score ---- */
    [['h', g.home, d.home], ['a', g.away, d.away]].forEach(function (t) {
      var head = $('.gm-boxhead-' + t[0]), tbl = $('.gm-box-' + t[0]);
      if (!head || !tbl) return;
      fed(head, t[1].ioc, t[1].name);
      text(head, '.gm-boxhead-v', played ? t[1].score : '–');
      var squad = t[2].squad.slice().sort(function (a, b) {
        return (b.pts - a.pts) || (a.order - b.order);
      });
      var oldB = tbl.parentElement.querySelector(':scope > .site-empty');
      if (oldB) oldB.remove();
      if (!squad.length) {
        tbl.hidden = true;
        emptyState(tbl.parentElement,
                   played ? 'No squad for this game' : 'Not played yet',
                   played ? 'This federation has not named a roster for this stop.'
                          : 'The box score is published with the result.',
                   { icon: played ? 'info' : 'clock' });
        return;
      }
      tbl.hidden = false;
      repeat(tbl, '.trow', squad, function (row, p) {
        row.hidden = false;
        text(row, '.cell-no .t-data-m', p.no);
        text(row, '.cell-pname .t-label', p.name + (p.captain ? ' (C)' : ''));
        text(row, '.cell-two .t-data-m', played ? p.two : '–');
        text(row, '.cell-ft .t-data-m',  played ? p.ft  : '–');
        text(row, '.cell-pts .t-data-m', played ? p.pts : '–');
        row.classList.toggle('trow-out', played && !p.pts);
        link(row, 'player.html?id=' + p.id);
      });
    });
    var note = $('.gm-note');
    if (note) note.textContent = played
      ? '2PT two-pointers · FT free throws · shirt numbers and the split between them are derived from the final score'
      : 'The box score appears once the game has been played.';

    /* ---- match stats ---- */
    var stats = [['Two-pointers', d.home.two, d.away.two],
                 ['Free throws',  d.home.ft,  d.away.ft],
                 ['Points',       g.home.score, g.away.score]];
    $$('.gm-stat').forEach(function (row, i) {
      var s2 = stats[i];
      if (!s2) { row.hidden = true; return; }
      text(row, '.gm-stat-k', s2[0]);
      text(row, '.gm-stat-h', played ? s2[1] : '–');
      text(row, '.gm-stat-a', played ? s2[2] : '–');
      $('.gm-stat-h', row).classList.toggle('gm-stat-lead', played && s2[1] < s2[2]);
      $('.gm-stat-a', row).classList.toggle('gm-stat-lead', played && s2[2] < s2[1]);
    });
    text(document, '.gm-stat-note', played
      ? (d.leadChanges === 0 ? 'No lead change in this game'
                             : d.leadChanges + ' lead change' + (d.leadChanges === 1 ? '' : 's') + ' in this game')
      : 'Tip-off ' + ((g.start || '').slice(11, 16) || 'to be confirmed'));

    /* ---- play-by-play ---- */
    var pbp = $('.gm-pbp');
    if (pbp) {
      if (!d.events.length) {
        $$('.gm-ev', pbp).forEach(function (r) { r.hidden = true; });
        emptyState(pbp.parentElement, 'No play-by-play yet',
                   'It is published with the result.',
                   { icon: 'clock' });
      } else {
        repeat(pbp, '.gm-ev', d.events, function (row, ev) {
          row.hidden = false;
          text(row, '.gm-ev-t', ev.t);
          var kind = $('.gm-ev-k', row);
          if (kind) kind.textContent = ev.kind === 'TIMEOUT' ? '' : ev.kind;
          var f = $('.flag', row);
          if (ev.kind === 'TIMEOUT') {
            if (f) f.hidden = true;
            text(row, '.gm-ev-n', 'Timeout · ' + ev.team.name);
          } else {
            if (f) { f.hidden = false; flag(f, ev.side === 'h' ? g.home.ioc : g.away.ioc); }
            text(row, '.gm-ev-n', ev.p.name);
          }
          row.classList.toggle('gm-ev-break', ev.kind === 'TIMEOUT');
          text(row, '.gm-ev-s', ev.hs + '–' + ev.as);
        });
      }
    }

    var back = $('.gm-backlink');
    if (back) {
      back.setAttribute('href', 'stop.html?id=' + g.stop);
      text(back, '.lbl', 'Back to Stop ' + (e.number || ''));
    }
  };


  /* ============================================================
     Review 3 — 2026-08-21. Everything the third review added is
     in this one block so the diff reads as one change.
     ============================================================ */

  /* FIBA's own channel. A conference that is playing shows its
     stream in place; when nothing is on air the frame says so
     rather than holding an empty player. */
  /* ============================================================
     Review 5 — 2026-08-26. Daniel's second mark-up.
     ============================================================ */
  var YT_CHANNEL = 'UC7LpyJP5fupiJu2CdzRQheg';
  var YT_STREAMS = 'https://www.youtube.com/@FIBA3x3/streams';
  /* Review 10: the last resort. A local file, so it cannot
     fail to load, and it is the band's own gradient and court
     rather than a photograph of somewhere else. */
  var POSTER_FALLBACK = 'assets/poster-nl.svg';
  /* Review 8: there is no house still any more. One stop's thumbnail
     standing in for every stop meant that every conference on the site
     showed the Asia West/Pacific frame. A stop's poster is its own
     stream's thumbnail, and a stop with no stream shows no frame — see
     hasStream below. */
  function ytThumb(id, size) {
    return 'https://i.ytimg.com/vi/' + id + '/' + (size || 'hq720') + '.jpg';
  }
  function posterOf(ev) {
    if (!ev) return POSTER_FALLBACK;
    if (ev.poster) return ev.poster;
    if (ev.video) return ytThumb(ev.video);
    if (ev.cover) return ev.cover;
    /* Review 10: a stop with no stream and no gallery of its own —
       there are twenty-five of them — used to return nothing, and an
       empty string means videoFrame draws no image and the frame is
       a grey rectangle. The conference's own newest cover is the
       closest true picture of it. */
    var sib = null;
    if (ev.conference && D.events) {
      D.events.forEach(function (x) {
        if (x.conference !== ev.conference || !x.cover) return;
        if (!sib || (x.start || '') > (sib.start || '')) sib = x;
      });
    }
    return (sib && sib.cover) || POSTER_FALLBACK;
  }


  /* Review 11: the stream on the live frame.
     A stop that is being played today and names no video of its own
     is given the league's current broadcast, so the play button on
     the conferences page opens a stream rather than an empty channel
     embed. The poster is that broadcast's own still. */
  var LIVE_FALLBACK = 'tYyPnWmBtKM';
  var LIVE_FALLBACK_POSTER =
    'https://i.ytimg.com/vi/tYyPnWmBtKM/hq720.jpg?v=6a89f088&sqp=-oaymwEnCNAFEJQ' +
    'DSFryq4qpAxkIARUAAIhCGAHYAQHiAQoIGBACGAY4AUAB&rs=AOn4CLAQpUbJhnJOdh5Z_O72TobA7v9CzA';

  function stampLiveStream() {
    var today = isoDay(new Date());
    (D.events || []).forEach(function (e) {
      if (!stopLive(e, today) || e.video) return;
      e.video = LIVE_FALLBACK;
      e.poster = LIVE_FALLBACK_POSTER;
    });
  }

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  var SELECT_HTML =
    '<div aria-expanded="false" aria-haspopup="listbox" ' +
    'class="ctl-04-Field--default fld sel cut cut-m cut-out" role="button" tabindex="0">' +
    '<div class="cutfill"></div><div class="sel-lbl">__LABEL__</div>' +
    '<svg fill="currentColor" height="20" viewBox="0 -960 960 960" width="20" ' +
    'xmlns="http://www.w3.org/2000/svg"><path d="M480-344 240-584l43-43 197 197 197-197 43 ' +
    '43-240 240Z"></path></svg></div><div class="sel-menu" hidden></div>';

  /* ---------- ctl-04 Select ----------------------------------
     The field is the trigger; the menu is a sibling, so the field
     keeps its cut corners. One item is always on. */
  function selectControl(wrap, items, onPick, allLabel) {
    if (!wrap || wrap._wired) return;
    wrap._wired = 1;
    var fld = wrap.querySelector('.fld');
    var menu = wrap.querySelector('.sel-menu');
    var lbl = wrap.querySelector('.sel-lbl');
    if (!fld || !menu || !lbl) return;

    function close() {
      menu.hidden = true;
      wrap.classList.remove('is-open');
      fld.setAttribute('aria-expanded', 'false');
    }
    function open() {
      menu.hidden = false;
      wrap.classList.add('is-open');
      fld.setAttribute('aria-expanded', 'true');
    }

    menu.innerHTML = '';
    [{ v: '', t: allLabel }].concat(items.map(function (t) {
      return typeof t === 'string' ? { v: t, t: t } : t;
    })).forEach(function (o, i) {
      var it = el('div', 'sel-item' + (i === 0 ? ' is-on' : ''), o.t);
      it.setAttribute('role', 'option');
      it.addEventListener('click', function () {
        $$('.sel-item', menu).forEach(function (x) { x.classList.remove('is-on'); });
        it.classList.add('is-on');
        lbl.textContent = o.t;
        close();
        onPick(o.v);
      });
      menu.appendChild(it);
    });
    lbl.textContent = allLabel;

    fld.addEventListener('click', function (ev) {
      ev.stopPropagation();
      if (menu.hidden) open(); else close();
    });
    fld.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter' || ev.key === ' ') {
        ev.preventDefault(); if (menu.hidden) open(); else close();
      }
      if (ev.key === 'Escape') close();
    });
    document.addEventListener('click', function (ev) {
      if (!wrap.contains(ev.target)) close();
    });
    close();
  }

  /* ---------- el-14 Chip row ---------------------------------- */
  function chipRow(labels, onPick) {
    var row = el('div', 'el-03-FilterChips--default el03 el03-s');
    labels.forEach(function (t, i) {
      var c = el('div',
        'el-14-Chip--s-default chip chip-s cut cut-s cut-out' + (i ? '' : ' chip-on'),
        '<div class="cutfill"></div><span class="lbl">' + t + '</span>');
      c.addEventListener('click', function () {
        $$('.chip', row).forEach(function (x) { x.classList.remove('chip-on'); });
        c.classList.add('chip-on');
        onPick(i ? t : '');
      });
      row.appendChild(c);
    });
    return row;
  }

  /* ---------- S-12 Schedule ----------------------------------
     Mota, third review: "when you go into a conference we need to
     show the games in the overview — the schedule, a list of the
     games, the results", and the live stream belongs at conference
     level. One module carries all four. The stream takes eight of
     twelve columns, the day's games the other four, and Schedule /
     Results are ctl-03 tabs over the same list.                  */
  function dayGames(dayISO, confId, gender) {
    return D.games.filter(function (g) {
      if (confId && g.conference !== confId) return false;
      if (gender && g.gender !== gender) return false;
      return (g.start || '').slice(0, 10) === dayISO;
    }).sort(function (a, b) { return (a.start || '') < (b.start || '') ? -1 : 1; });
  }

  function stopOn(dayISO, confId) {
    var hit = null;
    D.events.forEach(function (e) {
      if (hit || (confId && e.conference !== confId)) return;
      if (stopLive(e, dayISO)) hit = e;
    });
    return hit;
  }

  /* ---------- Review 6: one video frame -----------------------
     The schedule module built the poster-and-play facade inline.
     Two stop views want the same thing, so it is one function: the
     still, the shade, the button, and the embed that is only
     fetched once somebody asks for it.

     The production mechanism is the channel's own live embed,
     which resolves to whatever FIBA3x3 is broadcasting and needs
     no link from anyone. It renders nothing off air, which on a
     prototype is every day, so an event that names a video wins. */
  function videoFrame(ev) {
    var frame = el('div', 'sched-frame');
    var src = posterOf(ev);
    frame.innerHTML =
      (src ? '<img alt="" class="sched-poster" src="' + src + '"/>' : '') +
      '<div class="sched-shade"></div>';
    /* hq720 is the 16:9 still and it is there for every stream we
       carry, but it is not guaranteed; mqdefault always is. If even
       that fails the frame keeps its own flat surface rather than a
       broken-image mark. */
    var pimg = $('.sched-poster', frame);
    if (pimg) pimg.addEventListener('error', function () {
      if (ev && ev.video && pimg.src.indexOf('/hq720.jpg') > -1) {
        pimg.src = ytThumb(ev.video, 'mqdefault');
      } else if (pimg.src.indexOf(POSTER_FALLBACK) < 0) {
        /* A cover that 404s, or a network that will not reach
           ytimg — the house still is local and always answers. */
        pimg.src = POSTER_FALLBACK;
      } else {
        pimg.remove();
      }
    });
    var play = el('button', 'sched-play',
      '<svg fill="currentColor" viewBox="0 -960 960 960" ' +
      'xmlns="http://www.w3.org/2000/svg"><path d="M320-203v-560l440 280-440 280Z">' +
      '</path></svg>');
    play.type = 'button';
    play.setAttribute('aria-label', 'Play the stream');
    play.addEventListener('click', function () {
      frame.innerHTML =
        '<iframe allow="accelerometer; autoplay; encrypted-media; picture-in-picture" ' +
        'allowfullscreen src="' +
        (ev && ev.video
           ? 'https://www.youtube.com/embed/' + ev.video + '?autoplay=1'
           : 'https://www.youtube.com/embed/live_stream?channel=' +
             YT_CHANNEL + '&autoplay=1') +
        '" title="FIBA 3x3 Nations League"></iframe>';
    });
    frame.appendChild(play);
    return frame;
  }

  /* Review 8: a stop has a stream when a stream has been published
     against it, and not before. "It has been played, so there must be
     a recording" put an empty player — and the wrong still — on every
     stop in the season; a stop with nothing to watch now shows no
     video block at all. `day` is kept in the signature: the caller
     passes it, and a future rule may want it. */
  function hasStream(e, day) {
    return !!(e && e.video);
  }

  /* The stream on the left, whatever the view was already showing
     on the right. No stream and nothing moves: the block keeps the
     single column it had, which is what an unplayed stop shows.  */
  function stopStream(anchor, e, day, sideSel, after) {
    if (!anchor || !e) return;
    var side = $(sideSel);
    if (!side) return;
    var home = after ? anchor.parentNode : anchor;
    var split = $('.vsplit', home) ||
                (after && anchor.nextElementSibling &&
                 anchor.nextElementSibling.classList.contains('vsplit')
                   ? anchor.nextElementSibling : null);

    if (!hasStream(e, day)) {
      if (split) {
        if (split.contains(side)) home.insertBefore(side, split);
        split.remove();
      }
      return;
    }
    if (!split) {
      split = el('div', 'vsplit');
      split.appendChild(el('div', 'vsplit-v'));
      split.appendChild(el('div', 'vsplit-r'));
      if (after) home.insertBefore(split, anchor.nextSibling);
      else home.appendChild(split);
    }
    var right = $('.vsplit-r', split);
    if (side.parentNode !== right) right.appendChild(side);
    var left = $('.vsplit-v', split);
    left.innerHTML = '';
    left.appendChild(videoFrame(e));
    /* Nothing to put beside it — a hidden stub on a played stop —
       and the frame takes the width back. */
    split.classList.toggle('vsplit-solo', !!side.hidden);
  }

  function scheduleModule(host, confId) {
    var today = isoDay(new Date());
    var wrap = el('div', 'tpl-sub sched');

    /* The head states the day rather than offering seven boxes of
       them — third review, F1: the row of days becomes a filter. */
    wrap.appendChild(el('div', 'el-01-SectionHeader--default el01-wrap',
      '<div class="el01"><div class="el01-left">' +
      '<h2 class="t-h2">Schedule</h2>' +
      '<span class="sched-today"><span class="sched-livedot"></span>' +
      '<span class="sched-todaytxt"></span></span></div>' +
      '<div class="el01-right">' +
      '<div class="el-02-GenderSwitch--men el02 el02-s sched-gender">' +
      '<div class="el02-seg cut cut-s el02-on cut-out"><div class="cutfill"></div>' +
      '<span class="lbl">Men</span></div>' +
      '<div class="el02-seg cut cut-s cut-out"><div class="cutfill"></div>' +
      '<span class="lbl">Women</span></div></div>' +
      '<div class="selwrap sched-period"></div></div></div>'));

    var sex = 'men';
    var period = 'today';

    /* --- the day, stated ------------------------------------- */
    var todayBox = $('.sched-today', wrap);
    var todayTxt = $('.sched-todaytxt', wrap);
    /* Review 5: the day is stated under the conference that is
       playing rather than beside the section title, so it reads as
       "Singapore · Stop 6 · Wed 26 Aug". */
    var dayLine = '';
    (function () {
      var dt = new Date(today + 'T12:00:00');
      dayLine =
        ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dt.getDay()] + ' ' +
        dt.getDate() + ' ' +
        ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul',
         'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][dt.getMonth()];
      todayTxt.textContent = 'Today · ' + dayLine;
    })();

    /* --- the frame, with its caption above it ----------------- */
    var split = el('div', 'sched-split');
    var vid = el('div', 'sched-video');
    var side = el('div', 'sched-side');
    split.appendChild(vid);
    split.appendChild(side);
    wrap.appendChild(split);

    /* Review 6: the period select sat beside the word "Schedule".
       What it filters is the conference named under it, so it moves
       into the split, where the grid drops it to the foot of the
       caption row — level with "Singapore · Stop 6 · Wed 26 Aug". */
    var per = $('.sched-period', wrap);
    if (per) split.appendChild(per);

    /* --- Schedule and Results expand; they are not tabs ------- */
    function accBlock(title, open) {
      var b = el('div', 'sched-acc' + (open ? ' is-open' : ''),
        '<div class="sched-acc-h" role="button" tabindex="0" aria-expanded="' +
        (open ? 'true' : 'false') + '">' +
        '<span class="sched-acc-t">' + title + '</span>' +
        '<span class="sched-acc-n"></span>' +
        '<svg class="sched-acc-i" fill="currentColor" height="20" viewBox="0 -960 960 960" ' +
        'width="20" xmlns="http://www.w3.org/2000/svg">' +
        '<path d="M480-344 240-584l43-43 197 197 197-197 43 43-240 240Z"></path></svg></div>' +
        '<div class="sched-acc-b"><div class="sched-list"></div></div>');
      var h = $('.sched-acc-h', b);
      function toggle() {
        var on = b.classList.toggle('is-open');
        h.setAttribute('aria-expanded', on ? 'true' : 'false');
        /* Review 6: Schedule and Results answer the same question at
           two ends of the day. Opening one folds the other, so the
           column always shows one list rather than two or none. */
        if (on && b.parentNode) {
          $$('.sched-acc', b.parentNode).forEach(function (x) {
            if (x === b || !x.classList.contains('is-open')) return;
            x.classList.remove('is-open');
            var xh = $('.sched-acc-h', x);
            if (xh) xh.setAttribute('aria-expanded', 'false');
          });
        }
      }
      h.addEventListener('click', toggle);
      h.addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); toggle(); }
      });
      return b;
    }
    var accUp = accBlock('Schedule', true);
    var accDone = accBlock('Results', false);
    side.appendChild(accUp);
    side.appendChild(accDone);

    /* --- which games the period covers ------------------------ */
    function months() {
      var seen = {};
      D.games.forEach(function (g) {
        if (confId && g.conference !== confId) return;
        var m = (g.start || '').slice(0, 7);
        if (m) seen[m] = 1;
      });
      return Object.keys(seen).sort();
    }
    function monthLabel(m) {
      var p = m.split('-');
      return ['January', 'February', 'March', 'April', 'May', 'June', 'July',
              'August', 'September', 'October', 'November', 'December'][+p[1] - 1] +
             ' ' + p[0];
    }
    function periodGames() {
      return D.games.filter(function (g) {
        if (confId && g.conference !== confId) return false;
        if (sex && g.gender !== sex) return false;
        var d = (g.start || '').slice(0, 10);
        if (period === 'today') return d === today;
        if (period === 'all') return true;
        if (period === 'eos') return d >= today;
        return d.slice(0, 7) === period;
      }).sort(function (a, b) { return (a.start || '') < (b.start || '') ? -1 : 1; });
    }

    /* --- painting --------------------------------------------- */
    function paintVideo() {
      var ev = stopOn(today, confId);
      var isLive = !!ev;
      vid.innerHTML = '';

      var cap = el('div', 'sched-cap');
      if (ev) {
        var c = conf(ev.conference);
        cap.innerHTML =
          '<span class="sched-caphead">' +
          (isLive ? '<div class="el-05-StatusBadge--live badge badge-live cut cut-s">' +
                    '<span class="badge-dot"></span><span class="lbl">Live</span></div>' : '') +
          '<span class="sched-capname">' + (c ? confName(c) : ev.conference) +
          '</span></span>' +
          '<span class="t-body-s sched-capmeta">' + (ev.city || '') +
          ' · Stop ' + (ev.number || 1) + ' · ' + dayLine + '</span>';
        cap.style.cursor = 'pointer';
        cap.addEventListener('click', function () { location.href = 'stop.html?id=' + ev.slug; });
      } else {
        cap.innerHTML = '<span class="t-body-s sched-capmeta">No conference is playing today</span>';
      }
      vid.appendChild(cap);

      var frame = videoFrame(ev);
      if (!isLive) {
        var pl = $('.sched-play', frame);
        if (pl) pl.remove();
        frame.appendChild(el('div', 'sched-off',
          '<div class="t-h3">No game on air</div>' +
          '<div class="t-body-s">The stream opens here when a conference is playing.</div>' +
          '<a class="ctl-02-Link--default lnk" href="' + YT_STREAMS + '" ' +
          'rel="noopener" target="_blank"><span class="lbl">All streams on YouTube</span></a>'));
      }
      vid.appendChild(frame);

      todayBox.classList.toggle('is-live', isLive);
    }

    function row(g) {
      var done = g.home.score != null && g.away.score != null;
      var homeWon = done && g.home.score >= g.away.score;
      function line(t, lost) {
        return '<div class="sched-side-row' + (lost ? ' is-lost' : '') + '">' +
               '<span class="sched-ioc">' + (t.ioc || 'TBD') + '</span>' +
               '<span class="sched-sc">' + (t.score != null ? t.score : '–') +
               '</span></div>';
      }
      var when = period === 'today'
        ? (g.start || '').slice(11, 16)
        : (g.start || '').slice(8, 10) + '/' + (g.start || '').slice(5, 7);
      var n = el('div', 'sched-row',
        '<span class="sched-time">' + when + '</span>' +
        '<div class="sched-teams">' +
        line(g.home, done && !homeWon) + line(g.away, done && homeWon) + '</div>' +
        '<div class="sched-badge">' +
        '<div class="el-05-StatusBadge--up badge badge-up cut cut-s"><span class="lbl">' +
        (g.pool || g.round || '') + '</span></div></div>');
      n.addEventListener('click', function () { location.href = 'game.html?id=' + g.id; });
      return n;
    }

    function fill(block, games, empty) {
      $('.sched-acc-n', block).textContent = games.length ? games.length : '';
      var list = $('.sched-list', block);
      list.innerHTML = '';
      if (!games.length) {
        list.appendChild(el('div', 'sched-empty', empty));
        return;
      }
      games.slice(0, 60).forEach(function (g) { list.appendChild(row(g)); });
    }

    function paintList() {
      var games = periodGames();
      fill(accUp, games.filter(function (g) { return g.home.score == null; }),
           'Nothing left to play in this period.');
      fill(accDone, games.filter(function (g) { return g.home.score != null; }),
           'No results in this period yet.');
    }

    /* --- the period filter ------------------------------------ */
    var sel = $('.sched-period', wrap);
    sel.innerHTML = SELECT_HTML.replace('__LABEL__', 'Today');
    var items = [{ v: 'eos', t: 'Rest of season' }]
      .concat(months().map(function (m) { return { v: m, t: monthLabel(m) }; }))
      .concat([{ v: 'all', t: 'Full season' }]);
    selectControl(sel, items, function (v) {
      period = v || 'today';
      paintList();
    }, 'Today');

    paintVideo();
    paintList();
    host.insertBefore(wrap, host.children[1] || null);
    /* Review 5: every other sub page carries the switch at the right
       end of the headline row, so this one does too. */
    var gsw = $('.sched-gender', wrap);
    var pageCtl = $('.f04-ctl');
    if (!pageCtl) {
      var pageRow = $('.f04-row');
      if (pageRow) { pageCtl = el('div', 'f04-ctl'); pageRow.appendChild(pageCtl); }
    }
    if (gsw && pageCtl) pageCtl.appendChild(gsw);
    genderSwitch(function (g) { sex = g; paintList(); }, gsw || wrap);
  }

  /* ---------- Conferences: head split, flat grid, chips -------- */
  function reshapeConferences() {
    var content = $('.tpl-content');
    if (!content || content._r3) return;
    content._r3 = 1;

    /* Review 19 — back to six and six. Daniel, on seeing them stacked
       at full width: the two blocks answer the same question from two
       sides ("look one up" and "here is the shape of the season") and
       belong on one screen, at the size they were. */
    var subs = $$(':scope > .tpl-sub', content);
    if (subs.length >= 2) {
      var split = el('div', 'tpl-split cnf-head');
      var L = el('div', 'tpl-colL'), R = el('div', 'tpl-colR');
      content.insertBefore(split, subs[0]);
      L.appendChild(subs[0]); R.appendChild(subs[1]);
      split.appendChild(L); split.appendChild(R);
    }

    /* One grid of cards; the region is a chip now, not a heading. */
    var e03 = $('.e03');
    if (e03) {
      var grid = el('div', 'cnf-grid');
      $$('.e03-group', e03).forEach(function (g) {
        var region = (($('.e03-region', g) || {}).textContent || '').trim();
        $$('.e03-sh', g).forEach(function (card) {
          card.dataset.region = region;
          grid.appendChild(card);
        });
        g.remove();
      });
      e03.appendChild(grid);

      var region = '', order = 'live';
      function apply() {
        var cards = $$('.e03-sh', grid);
        cards.forEach(function (c) {
          c.hidden = !!region &&
            (c.dataset.region || '').toLowerCase() !== region.toLowerCase();
        });
        if (!order) return;
        function name(x) { return (($('.e03-name', x) || {}).textContent || '').trim(); }
        function live(x) { var b = $('.badge', x); return b && !b.hidden ? 0 : 1; }
        function prog(x) { return -($$('.dot-done', x).length); }
        cards.sort(function (a, b) {
          if (order === 'live') return live(a) - live(b) || name(a).localeCompare(name(b));
          if (order === 'prog') return prog(a) - prog(b) || name(a).localeCompare(name(b));
          return name(a).localeCompare(name(b));
        }).forEach(function (c) { grid.appendChild(c); });
      }

      var bar = el('div', 'cnf-bar');
      bar.appendChild(chipRow(['All', 'Europe', 'Americas', 'Africa', 'Oceania', 'AsiaPacific'],
        function (v) { region = v; apply(); }));
      var sel = el('div', 'selwrap');
      sel.innerHTML = SELECT_HTML.replace('__LABEL__', 'Live first');
      bar.appendChild(sel);
      e03.parentNode.insertBefore(bar, e03);

      selectControl(sel, [{ v: 'az', t: 'Name A–Z' },
                          { v: 'prog', t: 'Stops played' }],
                    function (v) { order = v || 'live'; apply(); }, 'Live first');
      apply();   /* live first on arrival, not only after a pick */
    }

    /* Review 18 — the Schedule block is gone from the global
       Conferences page. It is a live stream, today's games and a
       results panel: three answers about ONE conference, sitting
       above a grid of eighteen. A reader who wants a stream picks a
       conference; this page's job is to let them pick.
       (review16's confGenderHome() looks for the switch this module
       made and returns satisfied when there is none, so nothing is
       left waiting. The conference detail page still builds it —
       scheduleModule() itself is untouched.) */
  }

  /* ---------- the pages this review touches ------------------- */
  (function () {
    var prevConfs = PAGES['conferences.html'];
    PAGES['conferences.html'] = function () {
      if (prevConfs) prevConfs();
      try { reshapeConferences(); } catch (e) { console.error('conferences reshape', e); }
    };

    /* Conference detail: the legend sits on the section header's
       line rather than on a row of its own under it. */
    var prevConf = PAGES['conference.html'];
    PAGES['conference.html'] = function () {
      if (prevConf) prevConf();
      try {
        var lg = $('.legend');
        if (lg) {
          var head = $$('.el01').filter(function (h) {
            return /standings/i.test(h.textContent || '');
          })[0];
          if (head) {
            var right = $('.el01-right', head);
            if (!right) { right = el('div', 'el01-right'); head.appendChild(right); }
            right.appendChild(lg);
          }
        }
      } catch (e) { console.error('conference legend', e); }
    };

    /* Teams: the count belongs with the chips that change it. */
    var prevTeams = PAGES['teams.html'];
    PAGES['teams.html'] = function () {
      if (prevTeams) prevTeams();
      try {
        var chips = $('.tpl-sub > .el03'), count = $('.e09-count');
        if (chips && count && !chips.parentNode.classList.contains('teams-bar')) {
          var bar = el('div', 'teams-bar');
          chips.parentNode.insertBefore(bar, chips);
          bar.appendChild(chips);
          bar.appendChild(count);
        }
      } catch (e) { console.error('teams bar', e); }
    };
  })();

  /* ==========================================================
     Review 4 — 2026-08-26.
     ========================================================== */
  (function () {
    /* Home: the section header carried "All conferences" at its right.
       The review asked for it under the block, on the left, where the
       eye leaves the last row of the table. */
    function moveSectionLink(title) {
      var head = $$('.el01').filter(function (h) {
        var t = $('.t-h2', h);
        return t && t.textContent.trim().toLowerCase() === title;
      })[0];
      if (!head) return;
      var a = $('.nav-a', head);
      var sub = head.closest ? head.closest('.tpl-sub') : null;
      if (!a || !sub || sub._r4foot) return;
      sub._r4foot = 1;
      var foot = document.createElement('div');
      foot.className = 'sec-foot';
      foot.appendChild(a);
      sub.appendChild(foot);
    }

    var prev = PAGES['index.html'];
    PAGES['index.html'] = function () {
      if (prev) prev();
      try { moveSectionLink('live now'); } catch (e) { console.error('live now link', e); }
    };
  })();

  /* Review 17 — the off-calendar layers build E-08 cards of their own,
     and the card's three figures are derived in here from the box
     scores. One export rather than a second implementation that would
     drift from this one. */
  window.NL = window.NL || {};
  window.NL.paintPlayerCard = function (card, p) {
    paintPlayerCard(card, p, playerCardStats(p));
  };

  /* ---------- boot ------------------------------------------ */
  var FILES = ['conferences', 'events', 'standings', 'teams', 'players', 'news', 'photos', 'games'];

  Promise.all(FILES.map(function (f) {
    return fetch('assets/data/' + f + '.json').then(function (r) { return r.json(); });
  })).then(function (res) {
    FILES.forEach(function (f, i) { D[f] = res[i]; });
    D.playersById = {};
    D.players.forEach(function (p) { D.playersById[p.id] = p; });
    try { stampLiveStream(); } catch (e) { console.error('live stream', e); }

    var page = document.body.dataset.page || 'index.html';
    try {
      if (PAGES[page]) PAGES[page]();
    } catch (e) {
      console.error('render failed on', page, e);
    }
    try { initChrome(); } catch (e) { console.error('chrome failed', e); }
    document.body.dataset.rendered = page;
    if (window.FIBA) window.FIBA.init(document);
  }).catch(function (e) {
    console.error('data load failed', e);
  });
})();
