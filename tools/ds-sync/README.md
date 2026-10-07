# ds-sync — keep `system/` in step with the prototype pages

The design system's specimens are static HTML; the prototype pages are drawn by `assets/site.js`.
Every review round changes the pages, and nothing used to carry those changes back into `system/`.
This folder is the round trip, run in a container with Playwright (Chromium at `/opt/pw-browsers`)
and the repo served at `http://localhost:8420` (`python3 -m http.server 8420`).

1. **Audit** — what in the DS no longer looks like the page
   `node extract.js http://localhost:8420 sig.json && python3 compare.py sig.json "w,h,cursor,min-width,opacity"`
   Renders 18 page states and every DS group at 1440 and compares computed styles class by class.
   What is left after a sync is mostly states the pages are not showing at that moment
   (disabled, hover, dimmed loser, a live dot on a day nothing is live) — read it, don't chase it to zero.
2. **Harvest** — `node harvest.js spec.json harvest.json`
   Takes each component from the rendered page (after the data has landed) and strips runtime-only
   state (reveal classes, skeleton overlays, inline transforms).
3. **Apply** — `python3 ../p35_ds_sync.py <repo> harvest.json` on a clean checkout of `system/`,
   then `python3 tools/bump_assets.py`.
4. **Regression** — `node regress.js` screenshots every DS anchor before (`system_head/`, a copy of
   HEAD) and after, for a pixel diff of the sections the sync did not mean to touch.

The next sync is a new `pNN` script built the same way; `p35` is the record of the 7 Oct 2026 one.
