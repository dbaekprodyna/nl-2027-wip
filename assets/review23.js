/* ============================================================
   FIBA 3x3 Nations League — review23.js
   Twenty-third round, the behaviour — 2026-09-07.

     1  index / Live now   the Filter button moves onto the
                           section heading's line on a phone

   Loaded after review22.js, which is what puts Export beside the
   Filter button on Standings and Statistics — a different
   section, a different wrapper, and the two never meet.
   ============================================================ */
(function () {
  'use strict';

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }

  function phone() { return window.matchMedia('(max-width: 767px)').matches; }

  /* ---------- 1  Filter joins the heading ---------------------
     Daniel: the filter belongs on the heading's line, and only
     on a phone — the desktop's Live now already reads that way.

     mobile5.js wraps the control in .mfilt (display:contents)
     inside .filterbar; the button is the only thing in it with a
     size. It is appended to .el01, the section header's own flex
     row, which is `justify-content: space-between` — so the
     heading stays where it is and the button lands on the right
     edge without a rule of its own.

     The listener was bound to the element, not to a selector, so
     the fold still opens; the panel stays behind in .filterbar,
     which mobile17.css turns into display:contents so the empty
     row costs no height and the panel opens full width.

     Reversible, because the observer below runs on every mutation
     and a resize past 768px has to put it back.              */
  function liftFilter() {
    var bar = $('.filterbar');
    if (!bar) return;
    /* Read the wrapper off the button with closest(), never off
       parentElement: once the button has moved, its parent is
       .el01, and a function that trusts parentElement inside a
       MutationObserver builds a new home for it on every tick.
       (Round twenty-two froze a page that way.)               */
    var btn = $$('.mfilt-btn').filter(function (b) {
      return !b.classList.contains('mfilt-btn-quiet') &&
             (b.closest('.filterbar') === bar || b.parentElement === head());
    })[0];
    if (!btn) return;

    var h = head();
    if (!h) return;

    if (phone()) {
      if (btn.parentElement !== h) h.appendChild(btn);
      bar.classList.add('mfilt-lifted');
    } else {
      var home = $('.mfilt', bar);
      if (home && btn.parentElement !== home) home.insertBefore(btn, home.firstChild);
      bar.classList.remove('mfilt-lifted');
    }

    function head() {
      /* the .el01 row of the section the filter bar belongs to */
      var sub = bar.closest('.tpl-sub');
      return sub ? $('.el01', sub) : null;
    }
  }

  /* ---------- 2  the conference under a code, at 88px ---------
     Round twenty-two brought Statistics' conference line down to
     its region code ("Africa East U23" -> "AFR East U23") so it
     would stand in a 112px pinned cell. Round twenty-three takes
     that cell to 88px — the width of a flag and an IOC code — and
     the line has to come in with it: at 112px it was already
     being cut mid-word ("AMER SOUTH U2"), and wrapped it made
     every third row two lines taller than its neighbours.

     The zone is a single letter, which is how a conference is
     said out loud anyway — Africa East is AFR E — and the
     category stays, because Statistics ranks U23 and U21 in the
     same table and the two are told apart by nothing else here.

     Idempotent by construction: every pattern needs the long
     form, so a second pass over shortened text changes nothing.
     Runs after review22.js's own shortener, on the same node. */
  var ZONE = [
    [/\bAsia\b/, 'ASI'],
    [/ North\b/, ' N'],
    [/ South\b/, ' S'],
    [/ East\b/, ' E'],
    [/ West\b/, ' W'],
    [/ Central\b/, ' C']
  ];
  function shortSubs2() {
    if (!phone()) return;
    $$('.c-fed .wt-sub').forEach(function (n) {
      var was = n.textContent, now = was;
      ZONE.forEach(function (r) { now = now.replace(r[0], r[1]); });
      if (now !== was) n.textContent = now;
    });
  }

  function run() {
    try {
      if (page === 'index.html' || page === '') liftFilter();
      shortSubs2();
    } catch (e) { /* never let the observer throw */ }
  }

  function ready(fn) {
    var fired = false;
    function go() { if (fired) return; fired = true; fn(); }
    if (document.body && document.body.dataset.rendered) { go(); return; }
    var t = setInterval(function () {
      if (!document.body || !document.body.dataset.rendered) return;
      clearInterval(t);
      go();
    }, 60);
    setTimeout(function () { clearInterval(t); go(); }, 8000);
  }

  var page = (document.body && document.body.dataset.page) || '';
  if (page !== 'index.html' && page !== 'stats.html' && page !== '') return;

  ready(function () {
    run();
    var host = $('.tpl-content') || document.body;
    new MutationObserver(run).observe(host, { childList: true, subtree: true });
    window.addEventListener('resize', run);
  });
})();
