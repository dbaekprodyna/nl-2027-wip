# Developer handoff — FIBA 3x3 Nations League prototype

This is a design prototype, not production code.
Use it as a visual and structural reference.

## Links

- Prototype: https://dbaekprodyna.github.io/nl-2027-wip/
- Design system: https://dbaekprodyna.github.io/nl-2027-wip/system/
- Source code: https://github.com/dbaekprodyna/nl-2027-wip
- This version: tag `ds-2026-10-07` (see "Releases" on GitHub)

## How to read it

- **Look and markup:** use the design system. Every component shows its HTML and its states.
- **Behaviour:** see `assets/site.js`. It is prototype code only. Do not copy it into production.
- **Styles:** `assets/*.css`. The same CSS runs the prototype and the design system.

## Important

- The CSS is built in layers. Later files override earlier files
  (`tokens` → `base` → `elements` → `modules` → … → `review3`…`review23` → `mobile`…`mobile17`).
  Keep this load order if you use the files as they are. See `<head>` in `index.html`.
- The data in `assets/data/` is a snapshot of the 2026 season.
  Stops 2–6 are generated sample data, not real results.
- The page date is fixed to 12 August 2026 (`assets/season.js`), so "today" and "live" always look the same.
- Images come from the FIBA 3x3 CDN. They need an internet connection.

## Run it locally

```
python3 -m http.server 8000
```
Then open http://localhost:8000 (the design system is at `/system/`).
No build step and no dependencies.

## Questions

Daniel Baek, PRODYNA
