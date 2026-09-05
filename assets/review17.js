/* ============================================================
   FIBA 3x3 Nations League — review17.js
   Round seventeen. Daniel's mark on the two off-calendar states.

   Round sixteen built one off-season page and showed it twice.
   This round separates them, because they are not the same
   argument:

     off   the season is over. What is worth showing is what was
           won, by whom, and how much of it there was.
     pre   the season is coming. What is worth showing is when,
           and who is going to play in it.

   So the two states no longer share a block list. review16.js
   stands down when this file is present (window.NL17) and every
   off-calendar block is built here.

   Everything is still counted in the browser off the same JSON
   the in-season page is drawn from. Nothing here is written by
   hand except the three "how it works" paragraphs.
   ============================================================ */
(function () {
  'use strict';

  /* review16.js checks this before building its own off-season
     home. It is set at parse time, which is before either file's
     DOMContentLoaded handler runs. */
  window.NL17 = 1;

  var D = document;
  var S = window.SEASON || { mode: 'live', live: true, off: false,
                             today: '2026-08-26', milestones: [], opener: null };
  var PAGE = (D.body && D.body.dataset.page) || 'index.html';

  function $(s, r) { return (r || D).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || D).querySelectorAll(s)); }
  function el(t, c, h) {
    var n = D.createElement(t);
    if (c) n.className = c;
    if (h != null) n.innerHTML = h;
    return n;
  }
  function ready(fn) {
    if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', fn);
    else fn();
  }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  function num(n) { return Number(n || 0).toLocaleString('en-GB'); }

  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
             'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var DOW = ['Sunday', 'Monday', 'Tuesday', 'Wednesday',
             'Thursday', 'Friday', 'Saturday'];
  function dt(iso) { return new Date(iso + 'T12:00:00'); }
  function longLabel(iso) {
    var d = dt(iso);
    return DOW[d.getDay()] + ' ' + d.getDate() + ' ' + MON[d.getMonth()] + ' ' + d.getFullYear();
  }
  var ARROW =
    '<svg fill="currentColor" height="18" viewBox="0 -960 960 960" width="18" ' +
    'xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M686-450H160v-60h526' +
    'L438-758l42-42 320 320-320 320-42-42 248-248Z"></path></svg>';

  var TOUR = [100, 80, 70, 60, 50, 40, 30, 20, 10];
  function tourPoints(r) { return r ? (TOUR[r - 1] != null ? TOUR[r - 1] : 10) : 0; }

  /* The twelve places the league itself decides. site.js uses the
     same figure for the Qualification board; it is quoted rather
     than re-argued here. */
  var QUALIFIED = 12;

  /* The feed writes the age category as a prefix on `name`; the
     site states it as a suffix. site.js confName(), copied — the
     review layers cannot reach into its closure. */
  function confName(c) {
    if (!c) return '';
    var m = /^U(\d\d)\s+(.+)$/.exec(c.name || '');
    return m ? m[2] + ' U' + m[1] : (c.name || '') + ' U23';
  }
  function cityOf(e) {
    var seen = {}, out = [];
    String((e && e.city) || '').split(',').forEach(function (s) {
      s = s.trim();
      if (s && !seen[s.toLowerCase()]) { seen[s.toLowerCase()] = 1; out.push(s); }
    });
    return out.join(', ');
  }
  function flagImg(ioc) {
    return '<span class="flag flag-ring"><img alt="' + esc(ioc) +
           '" src="assets/flags/' + esc(ioc) + '.svg" width="24" height="24" ' +
           'style="width:100%;height:100%"></span>';
  }
  function go(node, href) {
    node.style.cursor = 'pointer';
    node.addEventListener('click', function () { location.href = href; });
  }

  /* A section with an el-01 header, the shape every block on the
     page already has. */
  function section(cls, title, rightHTML) {
    var s = el('div', 'tpl-sub os-sec ' + cls);
    s.appendChild(el('div', 'el-01-SectionHeader--default el01-wrap',
      '<div class="el01"><div class="el01-left"><h2 class="t-h2">' + esc(title) +
      '</h2></div><div class="el01-right">' + (rightHTML || '') + '</div></div>'));
    return s;
  }
  /* Retitle a block the page already carries, keeping whatever the
     header's right hand side holds unless something is offered. */
  function retitle(block, title, rightHTML) {
    if (!block) return;
    var h2 = $('h2', block);
    if (h2) h2.textContent = title;
    if (rightHTML == null) return;
    var row = $('.el01', block);
    if (!row) return;
    var right = $('.el01-right', row);
    if (!right) { right = el('div', 'el01-right'); row.appendChild(right); }
    right.innerHTML = rightHTML;
  }


  /* ==========================================================
     1  The federation table, as the Qualification board reads it
     ==========================================================
     Tour points over every stop the federation played, win ratio
     to separate a tie — site.js federationTable(), reproduced so
     that "qualified" means on this page exactly what it means on
     the board two blocks up in season. */
  function fedTable(standings, gender) {
    var by = {};
    standings.filter(function (s) {
      return !s.gender || s.gender === gender;
    }).forEach(function (s) {
      (s.rows || []).forEach(function (r) {
        if (!r.ioc) return;
        var t = by[r.ioc] = by[r.ioc] ||
          { ioc: r.ioc, team: r.team, played: 0, won: 0, tour: 0 };
        t.played += r.played || 0;
        t.won += r.won || 0;
        t.tour += tourPoints(r.rank);
      });
    });
    var list = Object.keys(by).map(function (k) { return by[k]; });
    list.forEach(function (t) { t.ratio = t.played ? t.won / t.played : 0; });
    list.sort(function (a, b) { return b.tour - a.tour || b.ratio - a.ratio; });
    return list;
  }

  function conferenceTable(data, confId, gender) {
    var by = {};
    data.events.filter(function (e) { return e.conference === confId; }).forEach(function (e) {
      var st = data.standings.filter(function (x) {
        return x.stop === e.slug && x.gender === gender;
      })[0];
      if (!st) return;
      (st.rows || []).forEach(function (r) {
        if (!r.ioc) return;
        var t = by[r.ioc] = by[r.ioc] ||
          { ioc: r.ioc, team: r.team, played: 0, won: 0, tour: 0, wins: 0, stops: 0 };
        t.played += r.played || 0;
        t.won += r.won || 0;
        t.tour += tourPoints(r.rank);
        t.stops += 1;
        if (r.rank === 1) t.wins += 1;
      });
    });
    var list = Object.keys(by).map(function (k) { return by[k]; });
    list.forEach(function (t) { t.ratio = t.played ? t.won / t.played : 0; });
    list.sort(function (a, b) { return b.tour - a.tour || b.ratio - a.ratio; });
    return list;
  }


  /* ==========================================================
     2  Winners — one photograph, one qualified team
     ==========================================================
     The feed titles a hundred and forty-eight galleries "Prize
     Ceremony", but it writes only seventy-seven distinct cover
     frames across them, and the same nation wins several stops.
     Shown raw, the section repeats both.

     So the set is built from the other end. Take the twenty-four
     federations the league sends to the U23 World Cup — twelve
     men's, twelve women's — and for each one find the most recent
     stop it won that has a ceremony gallery, skipping any frame
     already used. Twenty-four photographs, twenty-four different
     teams, no frame twice. */
  function winners(data) {
    var evById = {};
    data.events.forEach(function (e) { evById[e.id] = e; });

    var ceremonies = data.photos
      .filter(function (g) { return /prize ceremony/i.test(g.title || ''); })
      .map(function (g) { return { g: g, e: evById[g.eventId] }; })
      .filter(function (x) { return !!x.e && !!x.g.image; });

    /* stop + draw → the federation that won it */
    var won = {};
    data.standings.forEach(function (s) {
      var top = (s.rows || []).filter(function (r) { return r.rank === 1; })[0];
      if (top && top.ioc) won[s.stop + '|' + (s.gender || '')] = top;
    });

    var usedImage = {}, out = [];
    ['men', 'women'].forEach(function (gender) {
      fedTable(data.standings, gender).slice(0, QUALIFIED).forEach(function (t) {
        var hit = ceremonies.filter(function (x) {
          var w = won[x.e.slug + '|' + gender];
          return w && w.ioc === t.ioc && !usedImage[x.g.image];
        }).sort(function (a, b) {
          return String(b.e.start || '').localeCompare(String(a.e.start || ''));
        })[0];
        if (!hit) return;
        usedImage[hit.g.image] = 1;
        out.push({ image: hit.g.image, event: hit.e, team: t, gender: gender });
      });
    });
    return out;
  }

  /* The Photos module, re-pointed. Same carousel, same slide, same
     indicator — one bar per photograph rather than the specimen's
     ten, so the row is honest about the length of the set.

     app.js wraps the stage in a .car-viewport the first time it
     initialises a carousel and marks the element with _init. The
     wrapper is undone and the flag cleared before FIBA.init runs
     again, or the stage would be wrapped a second time. */
  function buildWinners(block, list) {
    var car = $('.car', block);
    var stage = car && $('.car-stage', car);
    if (!car || !stage || !list.length) return;

    block.hidden = false;
    block.classList.add('os-winsec');
    retitle(block, 'Winners',
      '<span class="os-scope">' + list.length +
      ' qualified teams &middot; 2026 season</span>');

    var proto = $('.car-slide', stage) || el('div', 'car-slide cut cut-m',
                                             '<span class="t-caption"></span>');
    proto = proto.cloneNode(true);
    proto.removeAttribute('style');

    var vp = car.querySelector('.car-viewport');
    if (vp && vp.contains(stage)) { vp.parentNode.insertBefore(stage, vp); vp.remove(); }
    clearInterval(car._t);
    car._init = false;

    stage.innerHTML = '';
    list.forEach(function (w) {
      var s = proto.cloneNode(true);
      s.classList.remove('rv', 'is-in');
      s.dataset.w17 = '1';
      s.style.backgroundImage = 'url("' + w.image + '")';
      s.style.backgroundSize = 'cover';
      s.style.backgroundPosition = 'center';
      var cap = $('.t-caption', s);
      if (cap) {
        cap.style.display = '';
        cap.textContent = w.team.team + ' · ' + cityOf(w.event) +
                          ' · ' + (w.gender === 'men' ? 'Men' : 'Women');
      }
      go(s, 'stop.html?id=' + w.event.slug);
      stage.appendChild(s);
    });

    var ind = $('.ind', car);
    if (ind) {
      ind.innerHTML = '';
      ind._prepped = false;
      list.forEach(function () { ind.appendChild(el('div', 'ind-d cut cut-s')); });
    }
    car.dataset.i = 0;
    if (window.FIBA && window.FIBA.init) { try { window.FIBA.init(D); } catch (e) {} }
  }


  /* ==========================================================
     3  2026 in numbers — S-09, the Overview module
     ==========================================================
     Every figure is counted here, off the files the tables are
     drawn from, so there is nothing to keep up to date. The module
     is the one the in-season page opens with; season progress is
     dropped, because out of season the answer is always all of it. */
  function numbersSection(data) {
    var played = data.games.filter(function (g) {
      return g.home && g.away && g.home.score != null && g.away.score != null;
    });
    var pts = played.reduce(function (a, g) { return a + g.home.score + g.away.score; }, 0);
    var iocs = {};
    data.teams.forEach(function (t) { if (t.ioc) iocs[t.ioc] = 1; });

    function key(v, l, cls) {
      return '<div class="s09-k"><span class="s09-kv ' + (cls || '') + '">' + v +
             '</span><span class="s09-kl">' + l + '</span></div>';
    }
    function line(lab, keys) {
      return '<div class="s09-line"><span class="s09-lab">' + lab +
             '</span><div class="s09-brk">' + keys.join('') + '</div></div>';
    }

    var s = section('os-numbers17', '2026 in numbers',
      '<span class="os-scope">2026 season &middot; men and women</span>');
    s.appendChild(el('div',
      's09 s09-nums brandstroke cut cut-m cut-out brandstroke-spin',
      '<div class="cutfill"></div><div class="s09-lines">' +
      line('Competition',
           [key(data.conferences.length, 'conferences'),
            key(data.events.length, 'stops')]) +
      line('Teams',
           [key(data.teams.length, 'team sites'),
            key(Object.keys(iocs).length, 'nations')]) +
      line('Played',
           [key(num(data.games.length), 'games'),
            key(num(pts), 'points scored')]) +
      '</div>'));
    return s;
  }


  /* ==========================================================
     4  U23 World Cup Qualifiers
     ==========================================================
     Eighteen conferences, eighteen winners, and a conference
     winner is exactly what a place at the U23 World Cup is —
     which is what the section is now called. The aggregation is
     the conference standings: tour points over the conference's
     stops, win ratio to separate a tie.

     The card is el-00 CutSurface rather than a border. clip-path
     takes the corner out of the border box too, so a `border`
     draws nothing along the two 45 degree edges — the stroke was
     missing at the top left and the bottom right for exactly that
     reason. The element carries the line colour and a .cutfill
     child inset by the border width carries the surface. */
  function qualifiersSection(data) {
    var confById = {};
    data.conferences.forEach(function (c) { confById[c.id] = c; });

    var gender = 'men';
    var s = section('os-champions', 'U23 World Cup Qualifiers',
      '<div class="el-02-GenderSwitch--men el02 el02-s os-gsw">' +
      '<div class="el02-seg cut cut-s el02-on cut-out" data-g="men" tabindex="0">' +
      '<div class="cutfill"></div><span class="lbl">Men</span></div>' +
      '<div class="el02-seg cut cut-s cut-out" data-g="women" tabindex="0">' +
      '<div class="cutfill"></div><span class="lbl">Women</span></div></div>');
    var grid = el('div', 'os-champs');
    s.appendChild(grid);

    function draw() {
      grid.innerHTML = '';
      data.conferences.forEach(function (c) {
        var top = conferenceTable(data, c.id, gender)[0];
        var stops = data.events.filter(function (e) { return e.conference === c.id; });
        var host = stops.length ? cityOf(stops[stops.length - 1]) : '';
        var head = '<span class="os-champ-c">' + esc(confName(c)) +
                   (host ? ' · ' + esc(host) : '') + '</span>';
        /* One conference has no standings in the snapshot. A card
           that says so is worth more than a grid that quietly
           comes up seventeen. */
        var body = top
          ? '<div class="os-champ-w">' + flagImg(top.ioc) +
            '<span class="os-champ-n">' + esc(top.team) + '</span></div>' +
            '<div class="os-champ-f"><span>' + top.stops + ' stops</span><span>·</span>' +
            '<span>won <span class="os-champ-sc">' + top.wins + '</span></span>' +
            '<span>·</span><span><span class="os-champ-sc">' + top.tour +
            '</span> tour points</span></div>'
          : '<div class="os-champ-w"><span class="os-champ-n os-champ-none">' +
            'Not published</span></div>' +
            '<div class="os-champ-f"><span>Results for this conference have not ' +
            'reached the feed</span></div>';
        var card = el('div', 'os-champ cut cut-s' + (top ? '' : ' os-champ-empty'),
                      '<div class="cutfill"></div>' + head + body);
        go(card, 'conference.html?id=' + c.id);
        grid.appendChild(card);
      });
    }
    $$('.os-gsw .el02-seg', s).forEach(function (seg) {
      seg.addEventListener('click', function () {
        $$('.os-gsw .el02-seg', s).forEach(function (x) { x.classList.remove('el02-on'); });
        seg.classList.add('el02-on');
        gender = seg.getAttribute('data-g');
        draw();
      });
    });
    draw();
    return s;
  }


  /* ==========================================================
     5  Be first to know
     ==========================================================
     The offer is the one thing the reader came for and could not
     find: the date. The field is a filled surface with a label
     over it, because the transparent box the round before read as
     a line of type rather than as somewhere to put a cursor. */
  function ctaSection() {
    var s = el('div', 'tpl-sub os-sec os-ctasec');
    var band = el('div', 'os-cta cut cut-m',
      '<div><div class="os-cta-t">Be first to know</div>' +
      '<div class="os-cta-d">One message when the 2027 schedule, the host cities ' +
      'and the participating teams are announced. Nothing else.</div></div>' +
      '<form class="os-cta-form" novalidate>' +
      '<label class="os-cta-lab" for="nl-notify">Your email address</label>' +
      '<div class="os-cta-row">' +
      '<input class="os-cta-in cut cut-s" id="nl-notify" type="email" ' +
      'autocomplete="email" placeholder="you@example.com" aria-label="Your email address">' +
      '<button class="os-cta-b cut cut-s" type="submit">Notify me</button>' +
      '</div></form>');
    $('form', band).addEventListener('submit', function (e) {
      e.preventDefault();
      var v = ($('.os-cta-in', band) || {}).value || '';
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.trim())) {
        var f = $('.os-cta-in', band);
        if (f) f.focus();
        var note = $('.os-cta-note', band);
        if (!note) {
          note = el('span', 'os-cta-note', 'Enter an email address and we will write once.');
          $('.os-cta-form', band).appendChild(note);
        }
        return;
      }
      $('.os-cta-form', band).innerHTML =
        '<span class="os-cta-d">Thank you — we will be in touch when the ' +
        '2027 dates are set.</span>';
    });
    s.appendChild(band);
    return s;
  }


  /* ==========================================================
     6  S-13 Countdown, running
     ==========================================================
     The specimen verbatim, variant = default. It cannot be driven
     by review11's ticker: that reads Date.now(), and season.js has
     pinned Date.now() to the day the prototype is being shown on,
     so every figure would stand still. This one takes the pin as
     its zero and adds the wall clock since the page loaded, so it
     counts real seconds towards a date the rest of the site
     agrees with. data-until is deliberately NOT used, so review11
     leaves the block alone. */
  function countdownSection(openerISO) {
    var s = el('div', 'tpl-sub os-sec os-cdsec');
    function unit(k) {
      return '<div class="s13-u cut cut-s"><span class="s13-v">&mdash;</span>' +
             '<span class="s13-k">' + k + '</span></div>';
    }
    var band = el('div', 'S-13-Countdown--default s13 cut cut-l',
      '<div class="s13-head">' +
      '<div class="s13-eyebrow"><span>Season 2027</span></div>' +
      '<div class="s13-t">Nations League returns</div>' +
      '<div class="s13-sub">Season opener &middot; ' + esc(longLabel(openerISO)) +
      '</div></div>' +
      '<div class="s13-units">' + unit('Days') + unit('Hours') +
      unit('Minutes') + unit('Seconds') + '</div>' +
      '<div class="s13-live">' +
      '<div class="el-05-StatusBadge--live badge badge-live cut cut-s">' +
      '<span class="badge-dot"></span><span class="lbl">Live</span></div>' +
      '<span class="t-body-m">The first conference is being played now</span></div>' +
      '<div class="s13-foot">' +
      '<a class="nav-a" href="calendar.html"><div class="ctl-02-Link--default lnk">' +
      '<span class="lbl">Full season calendar</span>' + ARROW + '</div></a>' +
      '<a class="nav-a" href="standings.html?view=qualification"><div class="ctl-02-Link--default lnk">' +
      '<span class="lbl">How qualification works</span>' + ARROW + '</div></a>' +
      '</div>');
    s.appendChild(band);

    var target = Date.parse(openerISO + 'T10:00:00');
    var pinned = S.now || Date.parse(S.today + 'T12:00:00');
    var perf = (window.performance && window.performance.now)
      ? window.performance.now() : null;
    var wall = new Date().getTime();

    function elapsed() {
      if (perf != null) return window.performance.now() - perf;
      /* No high resolution clock: fall back on the real Date, which
         season.js proxies only for `new Date()` with no arguments —
         a difference of two pinned readings is zero, so the wall
         clock is taken from the constructor with an argument. */
      return new Date(Date.now()).getTime() - wall;
    }
    var v = $$('.s13-v', band);
    function pad(n) { return (n < 10 ? '0' : '') + n; }
    function tick() {
      var left = Math.floor((target - (pinned + elapsed())) / 1000);
      if (left <= 0) { band.classList.add('s13-on'); return; }
      band.classList.remove('s13-on');
      if (v[0]) v[0].textContent = Math.floor(left / 86400);
      if (v[1]) v[1].textContent = pad(Math.floor(left % 86400 / 3600));
      if (v[2]) v[2].textContent = pad(Math.floor(left % 3600 / 60));
      if (v[3]) v[3].textContent = pad(left % 60);
    }
    tick();
    setInterval(tick, 1000);
    return s;
  }


  /* ==========================================================
     7  Meet the next generation — E-08 PlayerCard
     ==========================================================
     Six to a row, men on the first row and women on the second:
     the league runs two draws, and a row each says so without a
     switch to press. The card is the four-light specimen at the
     small scale, cloned from the template p27 puts in the page —
     a <template>, so its contents stay out of every selector
     site.js runs across the document.

     The three figures on the card are derived in site.js from the
     box scores, so the painting is done by site.js's own export
     rather than by a second implementation here. */
  function nextGenSection(data) {
    var tpl = D.getElementById('nl-pcard');
    if (!tpl || !tpl.content || !tpl.content.firstElementChild) return null;

    function top(gender) {
      return data.players.filter(function (p) {
        return p.gender === gender && !!p.portrait;
      }).sort(function (a, b) {
        return (b.rankingPoints || 0) - (a.rankingPoints || 0);
      }).slice(0, 6);
    }
    var men = top('male'), women = top('female');
    if (!men.length && !women.length) return null;

    var s = section('os-nextgen17', 'Meet the next generation',
      '<span class="os-scope">Top of the 2026 field &middot; ' +
      data.players.length + ' players</span>');
    var wrap = el('div', 'os-gen17');

    [['Men', men], ['Women', women]].forEach(function (pair) {
      if (!pair[1].length) return;
      var holder = el('div');
      holder.appendChild(el('div', 'os-genrow-lab', pair[0]));
      var row = el('div', 'os-genrow');
      pair[1].forEach(function (p) {
        var node = tpl.content.firstElementChild.cloneNode(true);
        var card = node.classList.contains('pcard') ? node : $('.pcard', node);
        if (card) card.classList.add('pcard-sm');
        row.appendChild(node);
        paint(node, p);
      });
      holder.appendChild(row);
      wrap.appendChild(holder);
    });
    s.appendChild(wrap);
    return s;

    /* site.js exports the painter once its own data has loaded.
       The page is built after body[data-rendered] is set, so it is
       there — but a retry costs nothing and covers a slow feed. */
    function paint(node, p) {
      var tries = 0;
      (function attempt() {
        if (window.NL && window.NL.paintPlayerCard) {
          try { window.NL.paintPlayerCard(node, p); } catch (e) {}
          return;
        }
        if (++tries < 40) setTimeout(attempt, 100);
      })();
    }
  }


  /* ==========================================================
     8  The page, assembled
     ========================================================== */
  function blocks(content) {
    function own(sel) {
      var n = $(sel, content);
      return n ? n.closest('.tpl-sub') : null;
    }
    return {
      split:    $('.home-split', content),
      overview: own('.s09'),
      live:     own('.acc'),
      qual:     own('.r01'),
      ad:       own('.ad'),
      photos:   own('.car'),
      find:     own('.search'),
      news:     own('.c02-h')
    };
  }

  function build(data) {
    var content = $('.tpl-content');
    if (!content || content._os17) return;
    content._os17 = 1;

    var b = blocks(content);
    var made = [];

    if (S.mode === 'pre') {
      /* ---- the pre-season page ----------------------------
         The hero states next season, so the wordmark is next
         season's. Then: when it starts, how to find your own
         federation in it, who is going to be playing, the
         advertising, the one thing worth signing up for, and the
         explainer a first-time reader arrives on. */
      preHero();
      made.push(countdownSection(S.opener || '2027-06-04'));
      if (b.find) made.push(b.find);
      /* Review 22 — Daniel: the sign-up reads before the players.
         A reader on a pre-season page has come for one thing, the
         date, and the offer to be told it is the page's own answer;
         the gallery is what they stay for afterwards. */
      made.push(ctaSection());
      var gen = nextGenSection(data);
      if (gen) made.push(gen);
      if (b.ad) made.push(b.ad);
      [b.split, b.photos, b.news].forEach(function (n) { if (n) n.hidden = true; });
    } else {
      /* ---- the off-season page ----------------------------
         What was won, how much of it there was, where to find
         your own federation, who goes to the World Cup, and the
         record of when the league played. */
      var list = winners(data);
      if (b.photos && list.length) { buildWinners(b.photos, list); made.push(b.photos); }
      made.push(numbersSection(data));
      if (b.find) made.push(b.find);
      made.push(qualifiersSection(data));
      if (b.ad) made.push(b.ad);
      if (b.live) {
        b.live.classList.add('os-calsec');
        retitle(b.live, 'Calendar');
        made.push(b.live);
      }
      made.push(ctaSection());
      [b.overview, b.qual, b.news].forEach(function (n) { if (n) n.hidden = true; });
      /* the two column frame goes once its last tenant has moved
         out; hidden rather than removed, so the live state is one
         reload away */
      if (b.split) b.split.hidden = true;
    }

    /* appendChild moves a node it is already holding, so this both
       places what is new and re-orders what was already there. The
       hero bands stay where they are, at the head of the content. */
    made.forEach(function (n) { if (n) content.appendChild(n); });

    if (window.FIBA && window.FIBA.init) {
      try { window.FIBA.init(content); } catch (e) {}
    }
  }

  /* ==========================================================
     9  F-02 — a way back to the season that is on
     ==========================================================
     Round sixteen offered "Off season" and "Pre season" and left
     the way back implicit: the Hero / No hero links write a hash
     with no season in it, which season.js reads as live. Those two
     links are only on the home page, and now that the state
     survives a link there has to be a stated way out of it on
     every page. So the second group gets its third member.

     review16 already listens on .f02-fam in the capture phase and
     reads data-season off whatever was clicked, so this only has
     to be the link — the behaviour is already written. */
  function seasonHome() {
    var fam = $('.f02-fam');
    if (!fam || $('.f02-season[data-season="live"]', fam)) return;
    var first = $('.f02-season', fam);
    if (!first) return;
    var a = el('a', 'f02-famlink f02-season', 'In season');
    a.setAttribute('data-season', 'live');
    a.setAttribute('href', '#hero=nl');
    fam.insertBefore(a, first);
    var on = S.mode === 'live';
    a.classList.toggle('is-on', on);
    a.setAttribute('aria-current', on ? 'true' : 'false');
  }


  /* The 2027 wordmark. Same artwork height as the 2026 file, so
     --hero-cap keeps the lock-up on its cap height and nothing
     else in the band moves. */
  function preHero() {
    var logo = $('.hnl-logo');
    if (logo) {
      logo.setAttribute('src', 'assets/logo-nl-2027-hero.svg');
      logo.setAttribute('alt', 'Nations League 2027');
      logo.setAttribute('width', '441');
    }
    var year = $('.f03-year');
    if (year) year.textContent = '2027';
    var t = D.title || '';
    D.title = t.replace('2026', '2027');
  }


  /* ---------- go ------------------------------------------- */
  var FILES = ['conferences', 'events', 'standings', 'teams', 'players', 'photos', 'games'];
  function load() {
    return Promise.all(FILES.map(function (f) {
      return fetch('assets/data/' + f + '.json').then(function (r) { return r.json(); });
    })).then(function (res) {
      var d = {};
      FILES.forEach(function (f, i) { d[f] = res[i]; });
      return d;
    });
  }

  /* site.js paints the in-season page from the same files and only
     then stamps data-rendered. Waiting on it means the Photos
     carousel is repointed after, not before, its own paint — no
     observer, no second pass, no flicker. */
  function afterSite(fn) {
    var tries = 0;
    (function poll() {
      if (D.body.dataset.rendered || ++tries > 200) return fn();
      setTimeout(poll, 50);
    })();
  }

  ready(function () {
    try { seasonHome(); } catch (e) { console.error('review17 f02', e); }

    if (PAGE !== 'index.html' || S.live) return;
    load().then(function (d) {
      afterSite(function () {
        try { build(d); } catch (e) { console.error('review17 build', e); }
      });
    }).catch(function (e) { console.error('review17 data', e); });
  });
})();
