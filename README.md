# FIBA 3x3 Nations League — Website Prototype

Interactive prototype for the FIBA 3x3 Nations League site redesign (pitch, 2026).
Static site — no build step, no dependencies. Deployed via GitHub Pages.

**Live:** https://dbaekprodyna.github.io/nl-2027-wip/
**Design system:** https://dbaekprodyna.github.io/nl-2027-wip/system/

14 screens, filled with the real 2026 season. Query-string routing:
`conference.html?id=africa-east`, `stop.html?id=africa-east-stop-1`,
`team.html?ioc=KEN`, `player.html?id=<uuid>`, `article.html?id=<slug>`.

## Structure

```
assets/
  tokens.css        colours, spacing, type, motion — mirrors Figma Variables
  base.css          reset, typography, 45° cut treatment
  elements.css      element library (buttons, fields, chips, cards …)
  modules.css       modules, one section per ID (F-02, S-01, R-02 …)
  motion.css        transitions, scroll reveal, page transitions
  interactions.css  GENERATED — hover/focus/active, copied from the specimen
                    modifier classes by tools/gen_states.py. Do not hand-edit.
  behaviour.css     hand-written interaction: cursors, open/close, clipping
  app.js            accordions, carousels, menus, selection, tooltips
system/
  index.html        guideline site — sidebar, search, anchor navigation
  nav.json          menu structure (order and names live here)
  pages/            one long page per group, every block an anchor target
  _check/           the six specimen sheets — source of truth
  assets/           docs.css (specimen chrome), shell.css (site chrome)
tools/              scripts that derive blocks/ and interactions.css
```

**Guideline site:** `system/index.html`. Four groups — Foundations, Elements,
Modules I, Modules II — each one long page with the sidebar acting as an anchor
menu. A component still has its own URL (`#elements/ctl-01-button`), so a single
component can be linked to directly. Layout is fluid down to 1280.

Templates are not in the menu: they are the prototype, linked from the sidebar
footer.

The site and the prototype load the *same* CSS. A change to a token or a
component appears in the documentation and in the screens at once.

## Editing

| Change requested | File to edit |
|---|---|
| Colour / spacing / type | `assets/tokens.css` |
| Content (teams, scores, news) | `assets/data.js` |
| Section order on a screen | that screen's `.html` |
| Header, nav or footer | `partials/` |
| Animation timing | `assets/motion.css` |

## Local preview

Partials are loaded via `fetch`, so open through a local server rather than
double-clicking the file:

```
cd fiba-nl-prototype && python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Publishing changes

GitHub Desktop → review changes → Commit to `main` → Push origin.
Live in about a minute at the same URL.

## Notes

- All pages carry `<meta name="robots" content="noindex">`. The Pages URL is
  public to anyone who has it — treat it as unlisted, not private.
- No framework, no bundler. Everything here is directly readable as a
  handover spec for the implementing development team.
