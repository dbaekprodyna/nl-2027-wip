/* ============================================================
   FIBA 3x3 Nations League — review22.js
   Twenty-second round, the behaviour — 2026-09-05.

     1  standings / stats   Export moves beside the Filter button
                            on a phone
     2  standings / stats   the Conference heading, shortened to
                            fit the phone's column width
     3  conferences         a live conference opens on its live
                            stop rather than on Overview

   Loaded after review18.js, which is what builds the Export
   button, and after review10.js, which is what shortens the
   conference names in the cells below the heading.
   ============================================================ */
(function () {
  'use strict';

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }

  var page = (document.body && document.body.dataset.page) || '';
  function phone() { return window.matchMedia('(max-width: 767px)').matches; }

  function ready(fn) {
    if (document.body.dataset.rendered) { fn(); return; }
    var t = setInterval(function () {
      if (!document.body.dataset.rendered) return;
      clearInterval(t);
      fn();
    }, 60);
    setTimeout(function () { clearInterval(t); }, 8000);
  }

  /* ---------- 1  Export beside Filter -------------------------
     mobile5.js wraps a section's filter controls in .mfilt — a
     display:contents box holding the button and the panel it
     folds open. The button is the only control on its line and
     Export was a line of its own underneath it, left-aligned
     against nothing.

     The two are put in one flex row inside that wrapper, ahead
     of the panel, so the fold still opens under both of them.
     The button keeps its own identity and its own listener:
     mobile5.js bound the click to the element, not to a
     selector, so moving it changes nothing.                  */
  function exportBesideFilter() {
    if (!phone()) return;
    var btn = $$('.mfilt-btn').filter(function (b) {
      return !b.classList.contains('mfilt-btn-quiet') &&
             b.getBoundingClientRect().width > 0;
    })[0];
    var x = $('.x-export');
    if (!btn || !x) return;
    /* The button's own parent is .mfx once this has run once, and
       reading the wrapper off it a second time is what would build
       a fresh .mfx inside the last one on every mutation. The
       wrapper is always the .mfilt above it. */
    var wrap = btn.closest('.mfilt');
    if (!wrap) return;
    var row = $(':scope > .mfx', wrap);
    if (!row) {
      row = document.createElement('div');
      row.className = 'mfx';
      wrap.insertBefore(row, btn);
      row.appendChild(btn);
    }
    if (x.parentElement !== row) row.appendChild(x);
  }

  /* ---------- 2  a heading that fits its column ---------------
     Every figure column on a phone is 60px wide, which is 52px
     of room. "CONFERENCE" is one word 66px long and cannot wrap
     out of trouble; the cells under it were shortened to their
     region codes by review10 for the same reason. The heading
     is stated at the length the column has.                  */
  function shortHeadings() {
    if (!phone()) return;
    $$('.thead > .c-conf > .t-caption').forEach(function (t) {
      if (/^conference$/i.test(t.textContent.trim())) t.textContent = 'Conf';
    });
  }

  /* ---------- 3  the conference under a federation code -------
     Statistics states a row's conference under its IOC code,
     because six stop columns leave no room for one of its own.
     review10 shortens the same names where they do have a column;
     the same list, applied here, is what lets "Americas South
     U23" stand in a 112px pinned cell. */
  var SHORT = [
    [/\bCentral\/East\b/, 'C/E'],
    [/\bWest\/Pacific\b/, 'W/PAC'],
    [/\bAmericas\b/, 'AMER'],
    [/\bAfrica\b/, 'AFR'],
    [/\bEurope\b/, 'EUR'],
    [/\bPacific\b/, 'PAC']
  ];
  function shortSubs() {
    if (!phone()) return;
    $$('.c-fed .wt-sub').forEach(function (n) {
      var was = n.textContent, now = was;
      SHORT.forEach(function (r) { now = now.replace(r[0], r[1]); });
      if (now !== was) n.textContent = now;
    });
  }

  ready(function () {
    function run() {
      try {
        if (page === 'standings.html' || page === 'stats.html') {
          exportBesideFilter();
          shortHeadings();
          shortSubs();
        }
      } catch (e) { /* never let the observer throw */ }
    }
    run();
    var host = $('.tpl-content') || document.body;
    new MutationObserver(run).observe(host, { childList: true, subtree: true });
    window.addEventListener('resize', run);
  });
})();
