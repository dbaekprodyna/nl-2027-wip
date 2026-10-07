# Changelog

## 2026-10-07 — The design system catches up with the pages

`system/` had stopped at review 15: the shell never linked
`review16.css`–`review21.css`, and every component that `site.js`
redrew after that (the WT standings columns, the stop tabs, the
compact qualification board, the month calendar, Federation Overview,
the off- and pre-season home) existed only on the pages. Specimens are
now taken from the rendered pages themselves instead of being redrawn
by hand — `tools/ds-sync/` harvests them, `tools/p35_ds_sync.py`
puts them in place.

**The shell.** It links `review16.css`–`review21.css`, `site.css` (the
page builder's own rules — `a.nav-a`, `.sr-only`, the More item, the
E-03 stroke — which harvested markup relies on) and `hero.css`, in the
same order the pages do. `.stage [class]{max-width:100%}` was erasing
the filter row's column widths; `shell.css` gives them back.

**Updated** — every specimen below now matches what the pages draw:
ctl-01 (Export), ctl-03 (stop tabs, Stats tabs), ctl-04 (labelled
select), el-02 (S is the size every page uses; the size specimens
never carried their size class; category switch with All), el-04 and
el-08 (WT columns), el-05 (mini), el-09 (legend in the table bar),
el-13 (XS, static), el-30, F-02 (season switch), F-03 (Home, More),
F-04 (el-23 breadcrumb, key-visual rule, team-page control), F-05,
S-01 (WT table, gender switch on the caption line), S-03, S-04, S-05
(`.s05-hn`), S-07 (Month / Day views), S-09 (plain type), R-01
(compact board with its own switch), R-02 (one table, filter drawer,
SEED), R-03 (WT columns), R-05 (Players and Teams tabs), E-01, E-02
(now a composition of F-04 + stop tabs + S-02), E-03 (flat grid),
E-04, E-09 (region chips), E-10 (Leading scorers), C-06 (video).
S-11 StopMatrix is marked retired (review 18).

**New** — el-33 FilterDrawer, F-07 HomeHero, E-12 FederationOverview,
E-13 NextGeneration, R-06 SeasonChampions, C-07 SignupCTA,
C-08 Winners.

Older states that record a decision (F-04 at 320, the R-01 full-width
board, the original E-02 block) are kept and labelled as such. Notes
added in this pass are headed "Synced with the prototype · 7 Oct 2026".

## 2026-09-03 — Twentieth review: one axis per column

Four of this round's twelve marks are the same mark: a table whose
heading row and whose body rows had stopped agreeing where the
columns were. They had a single cause, and it is the kind of thing
that is invisible until it is measured. `assets/review20.css`
carries the round and `tools/p30_review20.py` links it; the rest is
in `assets/site.js`, with one change each to `assets/hero-switch.js`,
`index.html` and `stop.html`.

### The columns

**Every cell in a flex row has `min-width: auto`, and that resolves
to min-content.** A heading cell's min-content is its label plus a
sort arrow; a body cell's is a flag and three letters, or two digits.
They are not the same number, so each column resolved to a slightly
different width in the head than in the body, and by the right-hand
end of thirteen columns the heading was a whole cell out of step with
the figures under it. No WT cell is allowed an automatic minimum any
more: with `min-width: 0` the stated flex-basis is what both rows
use, and the two resolve identically by construction. Measured after:
every column box is identical head to body, to the pixel.

**The second half is which edge the heading stands on.** A
right-aligned column reads down its right edge, and the sort arrow
was sitting between the label and that edge, so every heading stood
twenty pixels inboard of its own figures. The arrow goes to the left
of the label instead. (Reversing a flex row reverses its axis with
it, so the packing that puts the label on the right is `flex-start`,
not `flex-end` — worth writing down, because it looks like a typo.)

**POS lost its sort arrow.** It offered to re-sort the table by the
order the sort had just produced, and in a 44px column it pushed the
label off the centre the numbers below it stand on.

The same fix, in the shape the block needed, on **S-05 Pools**: the
three figures are 64px cells in the rows and were three free-standing
labels twelve pixels apart in the header, so W–L, PF and PA stood
over nothing in particular. The header's group now has the rows'
column widths.

**Conferences' Overview** had the same disease with different
symptoms: every cell sized itself to its own content, so no two of
the three lines put a rule in the same place. It is one grid across
the whole block now — the lines and their figure groups are
`display: contents`, so a label and its figures are items of the same
grid and every rule lands on one axis. The Teams line carries two
figures where the others carry four, so each of them spans two
columns and still ends on a column edge.

### The rest

**The hero is not a setting.** The Hero / No hero links come out of
the top bar and the `none` state goes with them; a bookmark carrying
`#hero=none` now resolves to the hero. Hero A and Hero B stay
reachable by hash, because that is how the two treatments are shown
side by side in a review.

**A card that lifts.** E-03 raised itself to elevation e1 on hover:
15% black at two pixels, drawn directly under a one-pixel grey stroke
darker than the shadow. Nothing was visible. A card under the pointer
is at e2 now — one whole step, which is what "raised" has to be to
read as raised. Both values are the design system's own.

**News photographs zoom**, the way the World Tour prototype's video
thumbnails do: the image grows inside a box that does not. A
background image cannot do this — `background-size` has nothing to
interpolate from the `cover` keyword — so a photograph that has to
move is an `<img>` in a clipping box, and one that fails to load
removes itself rather than leaving a broken-image mark where the
plain surface used to be.

**A live stop's tab keeps the live colour.** The dot went white so it
would carry on the black active tab, but the dot is the one mark on
this site that means "on air" and it is red everywhere else.

**The Schedule module is back, at the head of the stop being
played.** On Conferences it sat above a grid of eighteen and streamed
whichever one happened to be on, which is why round eighteen took it
off that page; here it has exactly one subject — this stop, the
recording that actually went out behind the play button, and the
day's games beside it. A stop that is not on has nothing to stream,
so the module is only built where it has something to say, and where
it is built it is the page's only player. Its Men / Women switch is
the page's: the podium, the pools and the bracket follow it too.

**Calendar.** The "Season calendar" sub-headline goes — the page is
titled Calendar and the two view chips say which view, so it was
naming the page a third time. The chips carry Material Symbols'
calendar_month and calendar_today, so they are told apart before they
are read. Day view arrives on a day (12 August, the day Live now
opens on) rather than on an empty strip, and Clear filter does what
it says: it widens the day back out to the whole season — 108 stops,
one accordion each — where before it emptied the page.

### Verification

18 assertions on the twelve marks, all passing, plus a column probe
that measures every heading box against its body box (13 of 13
identical) and every heading label against its column's right edge.
44 page loads across 21 URLs at 1440 and 390, including the
off-season and pre-season states and the calendar's two views, with
no JavaScript errors and no horizontal overflow.

## 2026-09-03 — Nineteenth review: where a control sits

Twelve marks from Daniel, and eleven of them are about position: a
switch that should be beside its table, a legend that should end at
the right, a timeline that should be read after the thing it
explains, a headline that should not move when a tab is clicked.
Nothing here changes what the site knows. `assets/review19.css`
carries the styling and `tools/p29_review19.py` links it; the
behaviour is in `assets/site.js`, with one line each in
`assets/review16.js` and `assets/review18.js`.

### Home

**The gender switch rides on the caption line.** It was a block of
its own between "Conference standings · after stop 3 of 6" and the
table, so it read as a second heading. Caption and switch share one
row now, bottom-aligned, ten pixels above the table — which is the
gap the caption already had, so both sides of the line stand off the
table by the same amount.

**Seed is the third column.** The Live now table gets the column the
conference table and Statistics already had, filled by the same
derived value. Thirteen columns in a 908px accordion needed the
width back: Federation, Seed and Tour pts are narrower and the stop
columns absorb the difference, so Status still ends inside the box
rather than scrolling off it — the failure this table had at twelve.

**Two ways out of an open accordion.** "View conference" goes to the
conference's Overview; "Follow this stop" goes to the stop. The
first is new and carries `.acc-conf-lnk`, because review16 relabels
the *second* link and would otherwise have renamed the one that had
just been added.

### Conferences

**Find a team and Overview stand side by side again**, six and six.
The eighteenth round stacked them at full width; seeing it, Daniel
asked for the size they were.

**The grey line over the black one is gone.** A played stop's tab
carried a 2px `--border-default` rule that sat directly on the
strip's own 1px black rule, so the strip read as two lines of
different colours. The state is already said by the label.

**The timeline moves under the conference standings.** The table
answers where the conference stands; the timeline answers how it got
there, which is the second question.

**Seed is the third column here too**, so the table a reader met in
the Live now accordion is the same table when they open the
conference.

### Stop

**The conference keeps the headline on all seven of its views.** The
page used to retitle itself "Stop 2 · Cangzhou", which made the tab
strip look like it was moving between pages rather than between
views of one. The H1 and the sub-header are the conference's now,
and what changes is stated under the strip: "STOP 1 · CANGZHOU" over
"China · 10 Aug 2026". The stream frame hangs off that block instead
of off the tabs, so it lands under the stop's name and not between
the name and the tab that chose it.

**The strip scrolls on a phone.** Seven tabs cannot share 358px —
mobile5.css gives every tab an equal share and the labels ran over
each other. review18 had already written the scrolling rule; the
mobile layer loads after it and outranked it on order alone, so it
is restated at a specificity that survives.

### Standings and Statistics

**The bar reads left to right.** "Qualification only" and Export are
both things you do to the table and stand together at the left; the
legend is what you read about it and keeps the right end. Export was
inside the legend, pushed to the far right by a margin.

**The players table gets its heading.** "Player performance" over it,
matching "Team performance" on the other tab — and the export button
follows the heading, so both halves of Statistics are laid out the
same way.

### Calendar

**A month card is a conference card.** Same E-03 shell, same grey
stroke, same drop-shadow on hover, carried on the `.sh` wrapper
because a clipped surface cannot draw a shadow on itself. The blue
fill on hover is gone; a live stop takes the brand stroke, exactly
as a live conference card does.

**Day view goes back to what it was.** The seven-column grid built
last round was a second calendar inside the calendar: Month view
already answers "what does August look like", and under the day
strip the grid only repeated the picking the strip was doing. It is
not hidden — it is not built.

**Clear filter belongs to the strip.** It undoes the region, the
search and the picked day, and the picked day is what the strip is
for, so it sits at the strip's bottom right rather than in the row of
chips above.

### Verification

24 assertions on the twelve marks, all passing. 44 page loads across
21 URLs at 1440 and 390 — including the off-season and pre-season
states and the calendar's two views — with no JavaScript errors and
no horizontal overflow.

## 2026-09-03 — Eighteenth review: what a row is

Every table on this site was built on a sentence nobody had written
down: a row is a federation. It is not. A row is a federation **in a
conference, in a gender, in an age category** — a team site — and
almost every fault in this round's brief comes from the two being
confused. `assets/review18.css` carries the round's styling and
`tools/p28_review18.py` links it; the rest is a correction to
`assets/site.js` itself, because a layer over a wrong row definition
would only have painted over it.

### Daniel's second pass

**Live now never loaded.** The skeleton was cleared from the list of
blocks it had covered — but `repeat()` clones the first accordion once
per stop, so the block that was covered is thrown away and six copies
of it are put on the page, each carrying a skeleton nobody was holding
a reference to. It is swept from the document now. (`.rv` did this in
round seven and `display:contents` in round sixteen; a clone bringing
state along is the recurring shape of the bug on this site.)

**Seeding, found.** There is no seed field in the snapshot —
tourTeams, teamRankings and qualifications are all empty collections
and no record carries the word. What the feed does carry is the thing
a seed is made of: a FIBA 3x3 ranking for 709 of the season's 711
players. A 3x3 team is ranked by the sum of its three highest-ranked
players and a conference seeds its field by that ranking, so every
team site has a seed now, derived that way rather than invented. It
is read through the same `seedOf()` as before: the day teams.json
gains a `seed`, the stated value wins and the derivation stops being
consulted.

**A conference and its stops are one page with seven views.** The tab
strip is Overview and six stops, drawn by one function on both pages.
Overview is the timeline, the standings, the leading scorers and the
photographs. A stop is never a page of its own: it is the conference,
on one of its stops, with the strip above it and its own tab marked.
The stop's title states the stop and its host, the line under it the
place and the day, and the second gender switch that stood beside it
is gone — the conference sets the gender and the answer is remembered
for the tab.

**The calendar has two views.** Month is what it opens on: every stop
as a card, grouped by the month it is played in, newest month first.
Day view is the grid and the day strip, unchanged. The link at the
right of the header, which pointed at Conferences, is gone: a
calendar does not need a way off itself.

Smaller marks, all Daniel's: Find a team moves under Overview on the
landing page and runs the full width on Conferences, with Overview
under it — six columns was enough for a search field but not for the
four steps the module has. The count above it ("68 nations · 202 team
sites this conference") is removed; it was a fact about the database,
and on Conferences its second half was not true of the page it sat
on. Photographs are three across the content's full width — the
slides were a fixed 464px, which came to 1408 in a 1376 column and
clipped the third while showing a sliver of the fourth. Statistics
loses Team stats spotlight and Overview outright. The Standings
export moves to the end of the legend.

### The day the site is showing

The prototype pins a date so that "live" means something. It was 26
August, chosen for a stream; the two conferences playing that day
have no standings rows in the snapshot at all, so the landing page
opened on a table of zeroes and em dashes. It is 12 August now: Asia
Central/East at Cangzhou, stop 3 of 6, and Europe-4 at Bratislava,
stop 5 of 6 — two conferences, both with a full six rows in both
genders, and Bratislava with a real stream, so the frame plays.

Moving the day exposed something the stop columns had made visible
and nobody had looked at: the snapshot carries results for stops
that have not been played yet. A conference reading "3 of 6 stops"
under six filled columns is a contradiction on the screen. The
season tables stop at today now — a stop counts once it has started,
and everything after today is blank.

### The loading state, and the way out of the file

Two things this round belong to the layer rather than to the site,
because neither is about what the site knows.

**el-26 Skeleton.** Eight JSON files are fetched at boot, and until
they land every page shows the specimen markup it was built from:
Serbia in every table, the same four player cards, a news story from
the mock. It reads as real content that then changes under the
reader. The skeleton is laid over each block and takes its geometry
from that block's own markup, so it is the same height, the same row
count and the same column positions as what replaces it. It clears
on the render signal, not on a timer. `#skeleton=hold` holds it, so
the state can be shown without throttling a network to see it.

**Export.** Alex asked for Excel. A CSV loses every number's type; a
SpreadsheetML `.xls` opens under a "the format does not match the
extension" warning, which is the first thing a federation would see.
So the `.xlsx` is written here — a stored ZIP of XML parts, about
sixty lines including a CRC table — rather than pulled off a CDN.
The rows come from the table on the screen rather than from the data
behind it, so the file and the page cannot disagree about what the
filters left, and a stop column becomes two: the finish and the
points it paid.

### The month

"The day list is hard to understand — a monthly view is better." A
row of eight days answers what is on this week and nothing else; a
season is read in months. The calendar opens on a month grid where
every stop is a card that goes to that stop's page, a finished one
carrying the federation that won it in the gender the switch is set
to. The day strip stays, because picking a day is what opens the
list underneath — and the list is only there when a day has been
picked, which is what the wall of every stop in the season was doing
wrong.

### The season table is decomposed

`federationTable()` grouped by IOC code, so a federation that plays
two conferences had its two schedules added together and reported
twelve events in a six-stop season. Three causes, not the one the
brief named: twenty-six federations field a U21 side as well as a
U23 one; seven appear in two conferences filed under the same
category; and — the one nobody had seen — **the age category is not
only in the conference name**. Europe and Asia have U21 conferences;
Africa and the Americas do not, and mark their U21 sides by a suffix
on the federation's name, in two different spellings: `Egypt (U21)`
and `Chile U21`. Twenty-four rows were being read as U23 and offered
a place at the U23 World Cup.

`siteTable()` is the season table now, one row per team site, and
`federationTable()` wraps it under its old name for its old callers.
`fedTotals()` adds sites up where a federation total is the answer
being asked for. Events played is six or fewer on every page.

U23 and U21 are two ladders, each counting from one, and Q and S are
set on the U23 ladder alone: the field those letters name is the U23
World Cup, which a U21 side is not playing for. Standings and
Statistics rest on that ladder order rather than on tour points,
because sorting the two together printed 1, 1, 2, 2 down a column
headed Position.

### One column set

Alex asked the league to read the way the World Tour reads. Four
tables were each drawing a different subset of that, so a reader
comparing two pages was comparing two column sets. `wtTable()` builds
all four — position, federation, tour points, every stop with its
finish over the points it paid, win ratio, points average, status —
and the landing page's Live now accordion, the conference standings,
the stop-by-stop matrix and the Statistics team table are now four
callers of one function.

Seeding rides in the same builder. `teams.json` has no `seed` field
yet, so the column shows an em dash: a column with a dash under it
says the data is coming, where no column says it was forgotten. Every
reader of the value goes through `seedOf()` — one line to change when
Rob's data lands.

### Search finds team sites

"Germany" returned one row where the federation fields four sides;
"U21" returned nothing at all. The unit of a result is the team site
now, and the category and the gender are part of what a side is
called. Matching is on words rather than on one joined string —
otherwise "men" matches "women" — and results rank exact IOC code
first, then a word that starts with what was typed, then anything
containing it. The overlay, the standing search page and the Find a
team finder all read the same function.

### A federation's page is about the federation

`team.html` opened on one of a federation's four sides and offered
the other three behind a switch, so "how is Germany doing" had to be
asked four times and added up by hand. The switch has gained an
**All** in front of it, and All is where the page opens: the four
sides as cards, each with its conference, its conference rank, its
seed, its stops, its tour points, its win ratio and its Q/S/R, over
a row of federation totals. A category the federation does not enter
keeps its place in the grid and says so. No new page, no new link,
no new component that the design system did not already have.

### Conferences, and the stops that leave

The Schedule block is gone from the global Conferences page: a live
stream, today's games and a results panel are three answers about one
conference, sitting above a grid of eighteen. On a conference page the
dot rail is a tab strip — six stops, stated, each one a link straight
to that stop's page — and with the stops leaving, the Overview /
Stops pair goes with them and the page is one view again.

### Statistics

Team Spotlight named the federation scoring most per game, which
compares teams at different points of different seasons: one stop in
and one good day was enough to top it. It is gone, and so is the
second table that ranked the same federations by points scored; the
space is rows, thirty of them, the same cap the player table uses.
The team table gained the total-points column the player table
already had.


## 2026-09-01 — Seventeenth review: the two off-calendar states, separated

Round sixteen built one off-season page and showed it under two
names. Daniel's mark separates them, because they are not the same
argument: out of season the page is about what was won, before the
season it is about what is coming. `assets/review17.css` (after
review16.css, before hero.css) and `assets/review17.js` (last of all)
carry both; `tools/p27_review17.py` links them, lifts the E-08
PlayerCard specimen into `index.html` as a `<template>`, exports the
card painter from `site.js` and stands review16's builder down.
Idempotent, and followed as always by `tools/bump_assets.py`.

### The state survives a link

*The F-02 season links are hidden as of this round — they read as site
navigation in the top right, and the prototype is being shown to a
client. The mechanism below is intact: the hash still names the state
and still survives a link within the tab, so `#season=off` and
`#season=pre` (and `#hero=nl` for live) show the three states. One rule
at the head of review17.css brings the switch back.*

`season.js` reads the hash first, as it always did, and now remembers
the answer for the tab. Every page carries the F-02 switch, but
`<a href="conferences.html">` drops the hash, so an off-season home
used to land on a live Conferences page. A hash that says `season=`
still decides; a hash that carries `hero=` with no `season=` is the way
back to live, because that is what the Hero / No hero links write; with
no hash at all the last stated answer stands. Those two links are on
the home page only, so the second group in F-02 gains its third
member — **In season** — and every page now has a stated way out.

### Conferences

- **The Schedule block is gone in both off-calendar states.** It is a
  live stream, a list of today's games and a results panel; out of
  season all three are empty or historic, and a block that answers
  "what is on now" with nothing is worse than no block.
- **Before the season, Overview goes too and Find a team takes the
  full width.** Overview counts finished stops, live conferences and
  season progress, and before a season starts every one of those is
  zero. Find a team is the one thing on the page that still works in
  those months, so it gets the page.
- **The Men / Women switch goes.** Round sixteen moved it from the
  page header down onto the Schedule block, on the argument that a
  control sits at the level it changes. Daniel's answer is shorter:
  on a page of eighteen conference cards it changes so little that it
  should not be offered. The element stays in the mark-up and stays
  wired — site.js reads its segments to decide which half of the draw
  the game list shows, and deleting the node takes the list with it.
  It is the offer that goes, not the machinery.

### Home > off season

- **Winners opens the page**, and "The next generation is already
  training" is gone with its milestone ladder. Out of season the first
  thing on the page is the season that just finished.
- **One photograph, one qualified team.** The feed titles a hundred
  and forty-eight galleries "Prize Ceremony" but writes only
  seventy-seven distinct frames across them, and the same nation wins
  several stops, so the raw set repeats both. The set is built from
  the other end instead: the twenty-four federations the league sends
  to the U23 World Cup — twelve men's, twelve women's — each with the
  most recent stop it won that has a gallery, skipping any frame
  already used. Twenty-four photographs, twenty-four teams, nothing
  twice. It runs in the Photos module: same carousel, same slide, same
  indicator, one bar per photograph. The "Show all 148 ceremonies"
  link is gone — there is no longer a tail to open. The slide is
  measured off the carousel viewport rather than the specimen's fixed
  464px, so three fill the content column exactly instead of cutting
  the third and showing a sliver of the fourth at the right edge.
- **2026 in numbers is S-09**, the module the in-season page opens
  with, rather than a row of tiles of its own. Season progress is
  dropped: out of season the answer is always all of it. The three
  lines share one row on a desktop — the in-season module states four
  figures a line and needs the height, this one states two and left
  two thirds of the card empty. They wrap back to stacked below 1100.
- **Find a team** moves up under it, from the foot of the page.
- **Champions becomes U23 World Cup Qualifiers**, four to a row. The
  card's outline was missing at the top left and the bottom right
  because `clip-path` takes the corner out of the border box too, so a
  `border` draws nothing along the two 45 degree edges. The card is
  now el-00 CutSurface — the element carries the line colour, a
  `.cutfill` child inset by the border width carries the surface — and
  the stroke follows the corner.
- **Watch 2026 again, Meet the next generation, the Nations League →
  U23 World Cup → World Tour → Olympics strip and Get ready for 3x3
  are gone.** The explainer is gone from the pre-season page too — the
  home page is not where the competition gets explained; About is.
- **Live now comes down under the advertising as Calendar.** Same
  block, full width, new name: out of season it is not a live block,
  it is the record of when the league played.
- **Be first to know has a field you can type in.** It had one before,
  but behaviour.css strips every `<input>` inside `.live` back to a
  transparent, colour-inheriting box, and on the near-black band that
  read as an email address printed on the page rather than as somewhere
  to put a cursor. Two classes beat `.live input`; the field is a white
  surface with a label over it.

### Home > pre season

- **The 2027 wordmark in the hero** (`assets/logo-nl-2027-hero.svg`,
  the supplied file). Same artwork height as the 2026 one, so
  `--hero-cap` keeps the lock-up on its cap height and nothing else in
  the band moves. The season chip in the header follows it.
- **S-13 Countdown, variant = default, directly under the hero, and it
  runs.** It cannot be driven by review11's ticker: that reads
  `Date.now()`, and season.js has pinned `Date.now()` to the day the
  prototype is being demonstrated on, so every figure would stand
  still. This one takes the pin as its zero and adds the wall clock
  since the page loaded, so it counts real seconds towards a date the
  rest of the site agrees with. It deliberately carries no
  `data-until`, so review11 leaves it alone.
- **Find a team** under the countdown.
- **Meet the next generation is E-08 PlayerCard**, six to a row, men
  on the first row and women on the second — the league runs two draws
  and a row each says so without a switch to press. The card is the
  four-light specimen at the small scale, cloned from a `<template>`
  in the page; a template keeps its contents out of every selector
  site.js runs across the document, which a hidden `<div>` would not.
  The three figures are painted by site.js's own exported painter,
  because they are derived from the box scores in there and a second
  implementation would drift.
- Then **Advertising** and **Be first to know**.

### Checked

Fifteen pages at 1440 and the two states at 1440 and 390: no
JavaScript errors, no horizontal overflow. The live state is
unchanged.

## 2026-08-28 — Fifteenth review: Alex's comments, the ten that were ready

From "NL more comments.pptx", the items that needed no decision from
anyone: the data was there, the module was there, and the change ends
inside it. `assets/review15.css` (desktop, after review14.css and
before hero.css), `assets/mobile15.css` (phone, last of all) and
`assets/site.js`. `tools/p25_review15.py` links the sheets, does the
mark-up, applies the site.js edits and brings the design system with
it; idempotent, and followed as always by `tools/bump_assets.py`.

### Everywhere

- **A win ratio is a percentage.** 0.83 read as a probability. One
  formatter, `pctRatio()`, so Standings, a conference table, a team
  header, a player page, Find a team and Stats all state 83%.

### Home > live conference (S-01)

- **The head says the place, and the dots say the stop.** It read
  "Kigali · Stop 5 of 6" with the el-06 dots printing "Stop 5 of 6" an
  inch to its right. The head keeps the city.
- **The table says what it is.** "Not clear that this is. Look like the
  conference standings, that is ok." It is, so a caption over it says
  so — and carries the stop it stands after, which is where the head's
  half of the repetition went.
- **Six federations, not four.** A conference is up to six teams and
  the table was cutting it at four for no reason but the specimen.

### Home and Conferences > overview (S-09)

- **A Teams line.** "We can add number of teams playing and number of
  countries." 202 team sites, 68 nations — the two figures the Find a
  team header already prints, stated in the block's own grammar. The
  painter now addresses the two counted lines by name, because a third
  line on the landing page would otherwise have been handed the stop
  figures that belong to Conferences.

### Standings

- **The rank column.** The table opened on Federation while the
  conference table beside it has led with Pos all along; the painter
  had been writing `.cell-position` into a column that did not exist.
  On a phone this also promotes the table to two pinned columns, which
  is what review10 always intended for a ranking.
- **A Zone filter.** Europe, Americas, AsiaPacific, Africa, Oceania —
  `regionOf()` already folded Europe-1..4 and the U21 conferences into
  those five for the landing page, so the field is one more ctl-04 on
  the search row.

### Conferences > Find a team

- **U21 is called U21.** The label was hard-coded to U23, so a
  federation fielding both was offered "U23 Men" twice and told its
  U21 side was U23. The age category lives in the conference name.
- **Q / S / R on every team site**, on the button and on the result
  card, read off the same season table Standings ranks with.
- The four sites are offered U23 before U21 and men before women, the
  order el-02 already builds its switch in.

### Stats

- **Teams gains PPG and a status marker, and sorts.** The row is
  painted by class now rather than by index — painting by position is
  how the win ratio ended up under Pts Average the last time a column
  moved.
- **Players gains total points, and its empty columns are filled.**
  Games and PPG had been printing an em dash on the grounds that the
  snapshot has no box scores. It has none, but the box score is derived
  from the final score — the player page has been summing exactly this
  since round ten. Both tables sort on every column.

### Conference

- **Conference highlights comes off.** Games, best win ratio,
  federations and average points are all read off the table directly
  above them.

### Still open, deliberately

`EP 12` on Standings and `GP 29` on Stats are the same fault and are
not fixed here: `federationTable()` sums a federation's U23 and U21
team sites into one row. Alex is right that six is the maximum, and
the fix is the same decision as his note on the Teams page — one row
per team site, or one row per federation with the figures split.

## 2026-08-28 — Fourteenth review: five marks

Daniel's eleventh mark-up. Four items are CSS —
`assets/review14.css` (desktop, after review13.css and before
hero.css) and `assets/mobile14.css` (phone, last of all) — and one
is behaviour, in `assets/site.js`. `tools/p24_review14.py` links
the sheets on every page, applies the site.js edit and brings the
design system shell up to date; it is idempotent and is followed
as always by `tools/bump_assets.py`.

### Home > hero

- **The brand elements go back to being measured, at 70%.** Round
  thirteen had pinned them to 128px and 104px. The round-five
  sizing returns — `side = (band - 906) / 2`, capped at the drawn
  411 and 492 — multiplied by 0.7, so at 1440 the pair is 186.9
  and 224.3 wide with the drawn ratios kept. Desktop only: both
  mobile layers load after this file.

### Every page > tabs

- **An unselected tab label is black.** ctl-03 Tab rested at
  `--text-muted` (#737373), which on a white strip reads as a
  disabled control — the Stops tab of a conference and the Players
  tab of Stats both looked switched off. The resting label goes to
  `--text-primary`; the selected tab is still a filled black block
  with a white label, so the pair is told apart by the block and
  not by two greys. `.tab-disabled` keeps its own grey, and el-02's
  segmented switch gets the same move (#525252 -> #0A0A0A). The
  phone's bottom bar is left out on purpose: it is on dark chrome.

### Player

- **The portrait is twice the size.** el-24 Avatar xl is 116px
  everywhere; on a player page the portrait is the page's subject,
  so E-05 takes it to 232 and the initials fallback follows (44 ->
  88). The element itself is unchanged — this is a module rule. On
  desktop the row centres, so the name no longer hangs off the top
  of the picture; on a phone the block stacks, because a 232
  portrait leaves 102px of a 390 screen for a name set in 40px
  Condensed.

### Conference

- **The Stops tab opens on what is being played.** The stop was
  chosen once, at load, and it was the newest one with results.
  The tab now reads the day: the live stop while one is on, the
  last stop that has taken place once it is over, and the first
  stop before the conference opens. Pressing Stops re-reads it —
  the tab is an entry point, not a place you are kept. Played is a
  calendar fact, not a snapshot fact, so this counts `stopPlayed()`
  and not `standingsFor()`.

- **"Open stop page" is a control on the desktop too.** Round
  twelve gave it the outline treatment and the right edge on a
  phone and left the desktop with an underlined caption sitting
  wherever the title left it. Same recipe, one size up (40px tall,
  14px label). The auto margin goes on the `.lnk` inside the
  anchor: `a.nav-a` is `display: contents`, so the anchor itself is
  not the flex item.

### Design system

- **The shell was two rounds behind.** `system/index.html` and the
  six `_check` pages linked up to review11.css; thirteen and
  fourteen are added. `mobile*.css` stays out, as before — the
  shell is not the prototype frame and the specimens are read at
  desktop width.

## 2026-08-27 — Thirteenth review: two marks

Daniel's tenth mark-up, two items. Both are CSS only:
`assets/review13.css` (desktop, loaded after review11.css and before
hero.css) and `assets/mobile13.css` (phone, last stylesheet of all).
`tools/p23_review13.py` links the two on every page and is idempotent,
followed as always by `tools/bump_assets.py`.

### Home > hero

- **The two brand elements get a size of their own.** Round five had
  sized them off the band — `side = (band - 906) / 2`, capped at the
  1728 drawing — which gave 267 and 320 at 1440 and made them read as
  the band's two ends. The mark gives them 128px and 104px of width,
  `height: auto`, so the drawn ratios hold: 128 x 51.2 for
  `kv-brand-1.svg` (440 x 176) and 104 x 29.7 for `kv-brand-2.svg`
  (498 x 142). They are corner marks flanking the lock now. The phone
  keeps the heights rounds eleven and twelve set for it, because both
  mobile layers load after this file.

### Phone > tab bar

- **Four pixels back at each end.** Round twelve took el-18 NavTab from
  68 to 58 to kill the black lid over the icon, and the row of five
  ended up tight against the bar's own top rule and against the home
  indicator underneath. The box goes to 66 with the icon + label + rule
  block (50) still centred, so the free space is 8 above and 8 below
  instead of 4 and 4. Bar, strip, reserve, overlay and sheet move
  together, the lesson of round twelve: strip and `.tpl` reserve 60 ->
  68, `.site-ovl` and `.mnav-sheet` inset 60 -> 68, `.f03m-sheet-body`
  72 -> 80.

- **The Conferences dot is whole at the top of its bounce.** The flat
  top was never a black object drawn over it. `.ntab` carries
  `cut cut-s`, and a clip-path clips an element's own pseudo-elements:
  at `top: 1px` the rest position of the bounce is `translateY(-45%)` =
  -1.7px, so the top 1.7px of the dot fell outside the clip and the tab
  bar's own black showed through it. The taller box moves the icon's
  top edge from 4 to 8; `top: 5px` keeps the dot landing three pixels
  into the globe exactly as before and puts the top of the bounce at
  2.3px, clear of the edge.

## 2026-08-27 — Twelfth review: the phone half, again

Daniel's ninth mark-up — the ten screenshots in `Mobile Feedbacks 2/` — plus
the two requests that came with them. All of it is in `assets/mobile12.css`
and `assets/review12.js`; `tools/p22_review12.py` links the two on every page
and is idempotent, followed as always by `tools/bump_assets.py`.

Nothing in this round reaches a desktop except the back link in the last
entry, which is new mark-up rather than a change to any: 1440 is pixel-for-
pixel what it was on every page, with the layer on and off.

### Conferences > Stops

- **Open stop page is a control, at the right edge.** Two faults in one line
  of mark-up. `.cnf-stop-link` carries `margin-left: auto`, but it is an
  `a.nav-a`, and site.css gives those `display: contents` — the flex item in
  the head row is the `.lnk` *inside* the anchor, so the auto margin was set
  on a box that takes no part in the layout, and the link sat wherever the
  stop's title left it. The margin moves to the box that is actually the flex
  item. And on a phone this is the one thing on that row you are meant to
  press, so it takes the outline treatment ctl-01 Button wears rather than an
  underlined caption — drawn the way every cut control on the site is drawn,
  the ring as the element's background and the fill on `::before`, because a
  `border` is cut away with the corner and leaves the two 45 degree edges
  blank.

- **The podium is a ranking again.** Three cut tiles wrapping in a 358px row
  came out two-and-one, which reads as a broken grid. It gets the shape the
  desktop's right-hand column already gives it: one tile a row, each the full
  width — and with a row to itself, the federation's name comes back beside
  the code.

- **A game list stopped printing the time under the home team.** Round five
  pinned the first two cells of every table; round ten took that back with a
  rule one class lighter than the one it was undoing, so for the tables round
  ten decided should pin nothing — Games, Results, Season journey — it never
  landed. Both columns were still sticky, at the default 48px offset, and the
  second was drawn on top of the first the moment the table was scrolled.
  The reset is repeated at the specificity the round five rule actually has,
  scoped to `.mstick-0`. The score cell and the two team cells beside it also
  get the width their content takes, so a flag and a two-digit score are no
  longer touching.

### Stop page

- **S-08 Podium is the desktop figure, made small.** Round eleven stacked it
  because the three plinths, each shrunk to the width of its own numeral, read
  as three broken boxes. The plinths were the fault, not the arrangement: a
  podium *is* three heights side by side. Three equal columns, each plinth the
  full width of its column, and 120/88/64 taken down to 74/56/42.

- **A stop page can get back to the list it came from.** review12.js wraps the
  el-06 StopDots rail and puts a text control at the far end of that row —
  arrow, "Back to stops overview" — pointing at `conference.html?id=…#stops`.
  The fragment is new: conference.html now opens on whichever tab the URL
  names. On a phone the dots come down to 30 so that all six and the control
  share the row; the rail keeps a scroll box with six pixels of padding, or
  the ring on the selected dot is clipped by its own overflow.

### Player, Stats, Home, chrome

- **The category chip says which team site the player is on.** E-05 ships with
  "U23 Men" written into the specimen and nothing ever replaced it, so every
  player on the site — the women included — was labelled a men's U23 player.
  It is a fact about the roster the player appears in, not about the player:
  the team site names both the category and the gender.

- **E-06's figures line up.** "Points per game" is the only label in the grid
  that wraps, so its figure started a line lower than the two beside it. The
  caption is given the height of two lines whether it needs them or not.

- **Every row in the player ranking carries a chip.** Round eleven brought
  el-24 Avatar back for the 442 players who have a photograph and left the
  other 269 with nothing, so a row without one started its name forty pixels
  left of the rows above it. The initials are what the element ships for that
  case.

- **The NL band comes down to 168.** Round eleven's 205 was measured against a
  two-line sub-head and 44px of lid; the mark puts the band's bottom edge just
  under "How it works".

- **The tab bar loses its lid, and the black strip behind it fits.** Round
  seven took el-18 NavTab from 56 to 68 and put the whole of the extra twelve
  above the icon. The icon goes to 26 and the box to 58. That is only half of
  it: round eleven paints a fixed strip in the chrome's colour behind the bar
  so the reserve at the foot of `.tpl` is never read as a white seam, and that
  strip was 76px — with the bar at 58 it stood seventeen pixels proud of it,
  which is the black area the screenshot points at. Bar, strip, reserve, sheet
  and overlay are one number now.

- **The season chip in the More sheet takes the house corner.** The last
  control on the site still drawn as a plain rectangle. The cut goes on the
  wrapper and not on the `<select>` — a select paints its own background over
  anything the parent's `::before` draws — and the ring is the sheet's own
  text at 24% rather than `--chrome-line`, which at #262626 on #171717 is a
  divider you read as a change of surface, not a box around a control.

## 2026-08-27 — Eleventh review: the key visual comes forward, and the design system catches up

Daniel's eighth mark-up. Desktop in `assets/review11.css`, the phone half in
`assets/mobile11.css`, three pieces of behaviour in `assets/review11.js`, the
prototype patches in `tools/p20_review11.py` and the design-system half in
`tools/p21_designsystem3.py` — both idempotent, both followed by
`tools/bump_assets.py`.

Round ten is not in this file; its work is in `tools/p19_review10.py`.

### Global

- **E-08 PlayerCard: the key-visual element is drawn over the portrait.**
  It was in the background layer, which is the one place on the card where it
  is never seen — the cut-out is widest exactly where the mark is drawn. It
  moves to the layer above the photograph and crosses the shoulder, and comes
  out of the background layer entirely. No markup moved: the card's stack is
  stated in CSS, next to the rest of it, and the mark keeps the .85 opacity it
  was drawn with so the face underneath is never fully covered. The anatomy
  diagram in the design system was re-cut to match — card 1 is the gradient and
  the Union mark, card 2 is the cut-out **and** the key visual.

- **The gender you choose follows you off the page.** Every top-level page
  carries an el-02 GenderSwitch and every one of them opened on Men, because
  that is the segment the specimen marks as selected; the choice was a local
  variable inside one page renderer, so any link threw it away. Choose Women on
  Home, Conferences, Teams, Calendar or Stats and every switch you meet after
  it opens on Women — including the four-segment one on a team page, which is
  built from the team sites a federation actually fields. Where a federation is
  in both, U23 is the default. `sessionStorage`, not `localStorage`: it is a
  reading position, not a preference, and a new visit starts where the site
  starts.

- **el-24 Avatar takes the player's photograph.** 442 of the season's 711
  players carry a headshot in the feed. Stats > Players and the top scorer on a
  Stop Final now use it; the other 269 keep the initials the element ships with,
  and a CDN that will not answer falls back to them rather than to a broken
  image. On a phone the chip comes back into the player column for those 442
  only — round ten hid it because "SM" beside "Santino Mazzucchelli" spends
  forty pixels saying what the column already says, which a face does not.

- **A paused carousel marks the slide you are looking at.** el-22's bar fills
  over the slide's own duration, so the bar for the slide on screen is the one
  filling. A swipe pauses the carousel first and then moves it, which left the
  slide it landed on holding an empty bar — no black anywhere in the row. A
  stopped carousel has no duration to measure, so that bar is simply full: it
  marks the position rather than the time left on it.

### Conferences

- **The live frame has a stream to play.** The frame falls back to the
  channel's own live embed when the stop it is showing names no video, and the
  channel embed renders nothing off air — which on a prototype is every day.
  Twenty-five of the season's stops carry no stream, and today's is one of them.
  A stop being played today with no stream of its own is given the league's
  current broadcast as the data loads, so the poster, `hasStream` and the embed
  all work the way they already do for the forty-nine stops that carry one.

### Standings

- **The Full standings button is gone,** desktop and phone. It sat under the
  standings table and went to the page it was on.

### Phone

- **The hero band is a fifth shorter and joins the arrival.** 256 → 205, with
  the clearances divided the way round ten divided them, and the court down a
  further one and a half times: 352 × 235 → 235 × 157. review7.js reveals the
  hero's parts and leaves the band where it is, which is right on a desktop
  where the parallax owns it; on a phone the band is the first block in a column
  of blocks and was the only one that did not rise and fade as it arrived.

- **A pinned column wins.** Round five pinned the first two cells of every table
  with `z-index: 2`; round ten took the pinning off most of them but left the
  z-index — and a z-index on a **flex item** counts even when the item is not
  positioned, because the flex spec gives it a stacking context of its own. So
  every second cell was on the same layer as the pinned first cell and later in
  document order, and therefore on top of it. That is why the conference column
  printed through the federation column and the ranking figures printed through
  the player's name. The leftovers are cleared and the cells that are actually
  pinned are lifted well clear.

- **Two pixels between two columns.** `.cell` carries 6px each side, so any two
  columns are 12px apart — as long as what is in them fits. Where it did not,
  the figure spilled out of its own box and landed against the one beside it
  ("—631,758", right-aligned numbers spilling **left**). Every column that was
  measured under its own content is given the width it needs; nothing is
  clipped, because a table on a phone scrolls and a column costs width, not
  legibility.

- **S-08 Podium is a podium again.** `width: auto` on the plinth inside a
  centred column shrank each one to the width of the numeral on it — the broken
  container under every flag. Stacked, the heights say nothing, so they go and
  the order does the work: first, second, third, top to bottom, each on a
  full-width bar, first keeping its black fill.

- **No white seam under the footer.** The tab bar is 72 tall and the page
  reserves 76 for it, with 4px of gutter down each side; scrolled to the bottom
  that read as a white band between a black footer and a black tab bar. The
  reserve is painted in the chrome's own colour, under the bar.

- **The season is in the More sheet,** level with "Nations League" and hard
  right. F-03 carries it on a desktop and the phone header had nowhere to put
  it, so a reader on a handset had no way of knowing which season they were
  looking at, let alone of leaving it.

- The Conferences dot drops one pixel closer to the globe. E-09
  FederationDirectory halves its gap — 250 cards at 24px apart is five screens
  of white space between the As and the Zs.

- **The link out of a stop was below the site footer.** `p7` appended it to
  `.tpl` rather than to `.tpl-content`, so "See updated conference table" was
  printed under the legal band on stop and game pages, outside every margin the
  page keeps. It goes where every other section-closing link goes.

### New — S-13 Countdown

The block for a page with nothing to report yet: the league between seasons, or
a sibling competition — World Tour, Women's Series — whose next stop is the
whole story of the page. Four counters, each in its own cut surface, Barlow
Condensed with tabular figures so the seconds do not shuffle the row as they
tick. Three variants: **default** on the page surface, **brand** on the NL
gradient for a hero band, **compact** as a strip inside a card. At zero the
counters are replaced by the live badge every other surface on the site uses —
a countdown that has run out is not a row of noughts. `data-until` carries the
target in ISO and `review11.js` ticks every countdown on the page.

There is no colon between the counters. One was drawn and taken out again: the
counters carry the corner cut, the cut is a clip-path, and a clip-path clips
whatever a child paints outside its own box — which is exactly where a
separator has to sit.

### Design system

`system/index.html` and the six `_check` sheets were loading `review3.css` and
`review4.css` and stopping there, so every decision taken in rounds five to
eleven was in the prototype and not in the specimens — the system was showing
the components as they were three weeks ago. They now load the same desktop
stylesheets as a page of the prototype, in the same order. `mobile*.css` is
deliberately not linked: it is written against the prototype's own page frame,
and the specimens are documented at desktop width.

## 2026-08-26 — Ninth review: the arrival slows down, the corner holds its corner

Daniel's sixth mark-up. Desktop in `assets/review9.css`, the phone half in
`assets/mobile9.css`, the links in `tools/p18_review9.py` — idempotent,
with `tools/bump_assets.py` after it. `assets/review7.js` carries the four
motion constants that are not expressible in CSS.

### Global

- **The section arrival runs at apple.com/iphone's pace.** Round seven
  built the reveal at 800ms over 28px with a 90ms beat between siblings,
  and it read as a flick rather than an arrival. It is 1100ms over 36px
  with a 130ms beat now — same curve, same stagger cap, same fade-only
  variants. The duration and the rise are custom properties set on the
  `.rv-on` gate, so the phone layer can still ask for a shorter rise
  underneath (22px there, 16px for a section headline). `review7.js`'s
  tidy-up delay goes 1500 → 2200ms to outlast the slowest arrival there
  is: 1100ms of run behind four beats of stagger.

### Mobile chrome

- **The 3x3 mark goes back to 24px.** Round seven took it down to the word
  mark's 16px cap so the bar carried one type size; as the leftmost thing
  on the bar it is what the page is recognised by, and at 16 it read as a
  footnote. The plate keeps its height and its slant and widens to hold
  it.
- **The five tab icons are drawn lighter.** They are Material Symbols
  outlines at weight 400 — an outline drawn as a *filled* shape, so there
  is no stroke on them to thin. What thins them is a stroke in the colour
  of the bar laid over the fill: it straddles every edge and takes half
  its width off each side. 22 user units on the 960 grid is 11 either
  side, which is close to the family's own step from weight 400 to 200.
  The bar is one flat colour behind every icon, the active one included,
  so the stroke has exactly one colour to be and the silhouette and the
  size are kept.
- **The Conferences dot comes down one pixel onto the globe** (`top` 3 →
  4). It is a ball bouncing on the icon, and the gap at the top of the
  bounce read as a gap rather than as flight.

### Home — the hero

- **Desktop: the top-left key visual holds the top edge.** Its parallax
  rate was 0.30, so it travelled down three tenths of the scrolled
  distance while the band travelled up all of it, and a strip of flat
  blue opened between the top of the band and the top of the artwork —
  the corner came away from its own corner. The rate is 0. The artwork is
  drawn *into* that edge, so it has to hold it; the depth in the band
  comes from the other three layers, which are unchanged.
- **Phone: the lock and "How it works" sit in the middle of the band, and
  the two corner elements are drawn half again as large** (22 → 33 and
  20 → 30 of height). The band is given the height both need — 192, with
  37 of air above and 34 below, the difference being the descender space
  the last line of type carries with it. The centring needs a floor on
  `.hnl-in` as well as on `.hnl`: the band is sized with `min-height`, and
  a percentage height inside a `min-height` resolves to auto, so `.hnl-in`
  would be exactly as tall as its own content and there would be nothing
  to be in the middle of. The court grows by the band's own share, 236 ×
  157 → 264 × 176 — it is drawn to sit *through* the band, with its own
  top and bottom rules outside it, so it has to be sized off it.

### Conference detail and Team — the player-card rails

- **A card slides all the way out now.** Round six pulled the rail's left
  edge in to the text margin so the first card lined up with the headline
  above it, and did it by starting the scroll box at 16px — which also
  stopped every later card at 16px, so a card being pushed off the screen
  parked against a strip of empty gutter instead of leaving. The rail is
  the full width of the screen again and the 16px is its own padding:
  padding inside a scroll box scrolls away with the content, so the first
  card still starts on the margin and every card can travel to the edge.
  `scroll-padding-left` brings the snap points with it.

### Fixed on the way past

- **Conference > Stops opened onto an empty column.** A pane behind a tab
  is `display: none`, so its blocks have no box: `armed()` lets them wait,
  the observer is never called for them (0 to 0), and `sweep()` skips them
  because a box of no size cannot be measured. Pressing the tab showed the
  pane with its contents still at opacity 0, and nothing ever came back
  for them. A press is the only thing that opens a pane, so a press is now
  what sends the sweep round again — captured, so a handler that stops the
  event still gets swept after. Present since round seven; it was not in
  the mark-up.

### Verified

- 15 pages × 320/360/390/430/768/1024/1100/1440 — no horizontal
  overflow, no JS errors, and no `.rv` left below full opacity after a
  page is scrolled to the end.
- Desktop no-regression by `page.route`-ing `review9.css`/`mobile9.css` to
  empty files and comparing full-page screenshots with `pixelmatch`: at
  1440 twelve of fifteen pages are pixel-identical and the three that are
  not differ only in the pulsing live dots (8–49px, each bounded to a
  6 × 8 badge dot). At 390 and 768 the difference is the header mark, the
  five tab icons, and — on the phone only — the hero band (20px taller)
  and the two rails.

## 2026-08-26 — Eighth review: the real stream behind each stop, and four alignments

Daniel's fifth mark-up. Desktop changes are in `assets/review8.css`, the
phone half in `assets/mobile8.css`, the stream table and the asset links
in `tools/p17_review8.py` — idempotent, and `tools/bump_assets.py` runs
after it. `assets/site.js` carries the two behaviour changes.

### A stop shows its own stream, or none

- **The house still is gone.** One video id (`bN9Z4Cf7YMQ`, Asia
  West/Pacific Stop 6) stood in as the poster for every stop on the site,
  so Africa East, Europe-2 and Pacific all advertised a Singapore frame.
  A stop's poster is now its own stream's thumbnail
  (`i.ytimg.com/vi/<id>/hq720.jpg`, falling back to `mqdefault` and then
  to the frame's flat surface).
- **`hasStream` asks whether a stream exists, not whether the stop has
  been played.** "It is in the past, therefore there is a recording" put
  an empty player on all 108 stops. A stop with no published stream now
  renders no video block at all, and the podium — or the waiting-for-
  results panel — takes the width back, which is what `stopStream`
  already did for an unplayed stop.
- **49 of the 108 stops carry a real id**, read off the titles of
  FIBA3x3's own uploads ("RE-LIVE | FIBA 3x3 Nations League 2026 -
  <conference> - Stop <n> | ..."). A stop whose stream could not be named
  with certainty is deliberately left empty: an absent block is right, a
  wrong video is not. U21 Europe-2 has none at all and is the clean
  demonstration of the empty case. In production this table is the
  YouTube Data API's job — the page still never calls out to render.

### Alignments

- **The hero's headline and "How it works" are eight pixels further
  apart** — `.hnl-in` gap 14 → 22. The band is 192 tall and holds 63 of
  type, so the extra comes out of the air, not out of the band.
- **Conferences: the period select ends where the meta line ends.**
  Review 6 put the field's centre on the caption's bottom padding; the
  select's foot now sits on the foot of "Singapore · Stop 6 · Wed 26
  Aug". It is moved with `translateY(-12px)` rather than a margin — a
  margin would make the field the tallest thing in the grid row and push
  the frame down ten pixels.
- **The podium flag is a whole circle again.** el-13 FederationTag is a
  cut surface and `.ftag-plain` sets its side padding to zero, so the
  flag sits flush on the tag's left edge and `clip-path` took the two
  pixels of `.flag-ring` that live outside it — the flat left side on the
  1st plate under Stops. A plain tag has no background, so its cut draws
  nothing and `clip-path: none` costs it nothing. The fix reaches every
  plain federation tag on the site: standings, stats and team rows all
  had the same clipped ring.

### Phone

- **The selected stop keeps its ring.** `.stopnav-on` is a 2px outline at
  3px offset — five pixels outside a 40px circle — and `.cnf-stopnav` is
  `overflow-x: auto`, which makes overflow-y `auto` too. With no vertical
  padding the top of the ring fell outside the scroll box. Six pixels of
  padding, six of negative margin: the ring has its room and nothing
  around the rail moves.
- **Schedule's headline and Filter share a line.** mobile5.js folds the
  period select behind a Filter button and the button stood one row under
  the word Schedule. It is taken out of flow and pinned to the top right
  of the section; the panel it opens stays at the head of the split, so
  it still drops directly under the button.

### Verified

16 pages x 360 / 390 / 430 / 768 / 1024 / 1440 — no horizontal overflow,
no JS errors. Desktop no-regression by pixel diff with `review8.css`
routed to an empty file: every page keeps its exact height, and the only
differences are the ones asked for plus the flag rings.

## 2026-08-26 — Seventh review: the page arrives, and the phone's chrome grows

Daniel's fourth mark-up. Desktop in `assets/review7.css`, the motion
itself in `assets/review7.js`, the phone half in `assets/mobile7.css`,
the asset links in `tools/p16_review7.py` — idempotent, and
`tools/bump_assets.py` runs after it. No existing file was edited.

### Sections arrive the way apple.com/iphone's do

- **Every section — and the sub-headline that names it — rises 28px and
  fades in as it crosses into the window**, the headline one beat (90ms)
  ahead of its body, on the long out-curve
  `cubic-bezier(0.32, 0.72, 0, 1)`: three quarters of the distance in the
  first quarter of the run, then a settle. One `IntersectionObserver`, a
  transform and an opacity. No scroll handler.
- **On the home page the hero is the first of these**: word mark, strap
  and link in sequence, with the two corner elements and the court
  fading in behind them.
- **Nothing can be left invisible.** Every rule is behind `.rv-on`, a
  class one inline line in `<head>` puts on `<html>` and which
  `review7.js` takes back off if it cannot do the work (no observer,
  reduced motion). A page whose script never arrives is the page it
  always was. Under that: a sweep that shows anything which reached the
  window without the observer noticing, and the observer itself showing
  anything that went past above it.
- **An arrived element gives the reveal back.** `.rv.is-in` sets the
  whole `transition` shorthand, so a `.card` or an `.acc` that kept it
  would have lost the hover transition `motion.css` gives it. The
  classes come off 1.5s after arrival.

### The home hero has depth

- **Desktop (≥901px): the band's four layers travel at their own rates**
  while the page scrolls past — corners at 0.30 and 0.22 of the scrolled
  distance, the court at 0.44, and the type at −0.16, leaving a little
  early and fading out over the band's last two thirds. Written per frame
  on `requestAnimationFrame`; at rest the inline transform comes off
  altogether, so an unscrolled hero is pixel-identical to round six's.

### The phone's chrome

- **F-03m: the 3x3 mark comes down from 24px to the word mark's 16px.**
  Two type sizes on one bar read as one mark shouting over the other.
- **el-18 NavTab: icons 20 → 30 (×1.5), the bar 57 → 69 (×1.2)**, and
  `.tpl`'s bottom room with it.
- **The active mark is the width of the tap target**, not a 24px token
  under the label: `.ntab-bar` is `width: 100%` on a tab with no side
  padding.
- **The Conferences dot is centred on the globe and bounces on it** —
  the same `dot-bounce` the live badge and the calendar strip run. The
  offset is a margin, not a translate, because the keyframes own the
  transform.

### The phone's hero

- **The strap comes up to 27.8px against `.t-h2`'s 24px.** Round six's
  12px cap had left the page's own title quieter than OVERVIEW directly
  under it. Cap 12 → 20, which is the word mark's height and, over 0.72,
  the strap's size; the band grows 104 → 140 to hold it. Below ~350px the
  strap wraps to two lines and the band grows again rather than
  overflowing.
- **The two corner elements are sized by height now, not by what is left
  of the band beside the lock** — the lock is nearly the band's width, so
  that share was gone. Height is the measurement that decides whether
  they clear the type, and it holds at every phone width.

### Verified

15 pages × 320/360/390/430/768/1024/1100/1440, each scrolled end to end:
no horizontal overflow, no JS errors, and no element left under full
opacity. Desktop no-regression by pixel diff with the layer routed to
empty files — identical but for the live dot's own blink.

## 2026-08-26 — Sixth review: the cut on a control, one pinned column, a stream at every stop

Daniel's third mark-up. Everything the round changes at desktop widths is
in `assets/review6.css`, the phone half in `assets/mobile6.css` and
`assets/mobile6.js`, and three figures that belong to the system rather
than to the round went into `base.css`, `elements.css` and `modules.css`.
`tools/p15_review6.py` applies the markup and the behaviour and is
idempotent; run `tools/bump_assets.py` after it.

### Global

- **Every video frame carries the house cut.** `.sched-frame` — now the
  one frame the schedule module and both stop views share — and the
  About page's placeholder are notched top-left and bottom-right like
  every other surface on the site.
- **ctl-03 Tab's gutter is 72px**, three times review 3's 24. The figure
  is in `elements.css`, restated in `review6.css` because review 3 wrote
  the tab's metrics on top of the element. The phone keeps 12px, where
  tabs share the width between them.
- **A cut control keeps its outline.** `clip-path` removes the corner
  from the border with everything else, so a 1px `border` drew nothing on
  the two 45 degree edges — which is why Filter and Clear filter looked
  open at both corners. The outline becomes the element's own background
  with a slightly smaller cut shape over it, the construction el-00
  CutSurface already uses. `base.css` carries it as `.cutbtn` for
  controls that cannot hold a `.cutfill` child.
- **Clear filter is a selected control**, black, and it is only on the
  page while something is filtered — clearing it puts the page back to
  All and to the whole season and the button goes with it. Setting any
  filter brings it back in the same place.
- **F-03m reads from the left** — the mark, the word mark beside it, the
  search at the far end — and carries **e1**. Both are in `modules.css`,
  so the spec sheet shows them.
- **F-04's 4px divider** was three fifths red on a phone: the artwork is
  1440 wide and its coloured end is the first 240px of it. The strip is
  squeezed horizontally, so the red end is about a third and the blue run
  takes the rest.
- **One pinned table column, not two.** Two pinned columns left 120px of
  a 358px screen for the figures the table exists to show. The header
  rule the pinned cell used to hide is back: a sortable cell has a 44px
  tap target and the header row was 40, so every cell overflowed its own
  row and painted over the border.
- **The roster and leading-scorer rails start at the text margin** and
  bleed to the right only, so the first card lines up with everything
  above it and the next one still shows at the screen edge.

### Home

- The phone hero gives back a third of its height — the same lock at a
  smaller cap height with the padding taken in to match.
- Overview's **total / finished / to go / live** are one line of four.
- Qualification's table, More and Full standings are half a step apart.
- **Live now**: Filter sits at the right end of the gender switch's own
  line. el-02's segments come down to 88px so both fit a 360 screen.
- **el-20's panel scrolls its table, not its button.** The panel held the
  standings *and* "View conference", so the link rode away with the
  table. `mobile6.js` wraps the rows in a scroller of their own.
- News headlines start at the top of their card rather than centred in
  it.

### Conferences

- **The period select drops onto the conference's own meta line** —
  level with "Singapore · Stop 6 · Wed 26 Aug" rather than beside the
  word Schedule. Stacked, it goes back above the frame it filters.
- **Schedule and Results are one control with two positions**: opening
  one folds the other.
- The region chips are 44px, so they read as the select's siblings
  instead of a smaller class of control.
- **The conference field drew as a 40px empty box on a phone.** review 3
  caps it at two of twelve columns and review 5 restated that for the
  folded panel; both beat round five's phone rule on specificity.
- **A live conference marks its Stops tab** with the navigation's own
  pulsing dot.
- **Selecting a stop shows its stream.** A stop that is being played, or
  has been, puts the frame on the left and the podium — on the stop page,
  the block waiting for the pools and the bracket — on the right. A stop
  with no stream keeps the single column it had.

### Stats

- The Players table's **Player column is fixed at 128px** — an initial
  and a short name — and anything longer ends in an ellipsis. The table
  scrolls sideways instead of pushing every figure off screen.

### About

- The anchor list is a desktop affordance; the phone drops it.

### Navigation

- **About Nations League is a link** to the page it names, without the
  arrow character.
- Every remaining external mark in the More sheet is an icon.

### Fixed

- **Photos jumped to the top of the conference detail page** after a
  gender switch. `paintPhotos` set its block's `hidden` to false on every
  repaint, so changing gender while the Stops tab was open pulled the
  gallery back out of the hidden Overview pane — and being that pane's
  last block, it landed above everything the Stops tab was showing. A
  block only un-hides into the pane that is actually on.

## 2026-08-25 — Third design review: one H1, the key visual, and a Schedule

Mota's notes from the 21 August review, plus Daniel's mark-up of the
header and the four sub pages. Everything new is in `assets/review3.css`
and one block in `site.js`; `tools/p12_review3.py` applies the markup and
is idempotent.

### Global

- **One H1.** `.f04-h1` at 40/42 Barlow Condensed 800, uppercase, in the
  key visual's blue (`#0F37FF`). The three legacy sizes and E-04's team
  name resolve to it, so a page cannot drift on its own. The page name is
  the H1 now — *Standings*, not *Nations League Standings*. The game
  page's meta line keeps its own size; the player page's H1 is `sr-only`
  because E-05 carries the name.
- **The key visual is the divider.** `NL-Sub-Header-Image.svg` sits under
  the breadcrumb on every sub page and F-04's 1px rule is gone.
- **ctl-03 Tab** goes to a 16px label on a black rule.
- **A search that is not full width is 6/12 columns**; the ctl-04 Select
  beside it is 2/12, right edge, same height.
- **Off-grid widths snapped to the grid.** 660 -> 708 (6 col), 432 -> 464
  (4 col), 318 -> 342 (3 col), 474 -> 464, 1104 -> 1074, 420 -> 464. The
  390px phone frame and the IAB ad slots are sizes set outside this
  design and were left alone. `review3.css` carries `--col-1 ... --col-12`
  as `n/12 x 100% - (24-2n)px`, so every new width is fluid.
- The guideline site links the same sheet, so documentation and screens
  cannot disagree about a tab or an H1.

### Home

- **A new hero band, on by default.** Full bleed, 192 tall, the brand
  gradient, the key visual's two elements anchored to the window's top
  left and bottom right, and the headline on the page's own 1440 column.
  The top bar switch is **Hero / No hero** — no hero is the old headline
  lockup, unchanged. Hero A and Hero B are still reachable at `#hero=a`
  and `#hero=b`.
- Overview to Live now is **40**.

### Standings

- **ctl-04 Select** on the search's row, flush right, listing every
  conference in the table A-Z and filtering it.

### Conferences

- **S-12 Schedule**, the module Mota asked for: the live stream (FIBA's
  YouTube channel, embedded, live only), a seven-day strip, and the day's
  games with **Schedule / Results** as tabs. Eight columns of stream, four
  of games.
- Find a team and Overview stand side by side, six and six.
- One flat grid of four cards to a row; the region chips do what the
  region headings used to do, with a sort select beside them.

### Conference detail / Teams

- The legend sits on the section header's line; the federation count sits
  with the chips that change it.

## 2026-08-20 (2) — Stops 2 to 6, the 76.5° cut, and one empty state

### The five stops that were not there

The snapshot walked each conference's **first** stop only. The calendar
was complete, so the Conferences page correctly said *6 of 6 stops* — and
then five of every six stop pages opened onto nothing. `tools/fill_stops.py`
now writes a deterministic fixture list for the stops the feed does not
carry: pools, a final, scores for every stop already played, and the
standings table computed from those scores. Stops still in the future get
the schedule without scores, so they read as *Upcoming* rather than as
missing. 1,164 games and 158 tables, all reproducible from the same
input — re-running the script after a snapshot refresh produces the same
season, and it never touches a stop the feed does supply.

Three things followed from having results everywhere:

- **Box scores work from stop 2 onwards.** `gameSquad()` matched a roster
  on the exact stop, and the feed names a squad at the first stop only.
  A federation fields the same four players across its conference, so the
  lookup falls back to the conference's roster.
- **E-08 PlayerCard states Games, Points and Win ratio**, summed from the
  derived box scores. The brand template asked for GP / PPG / APG / RPG;
  assists and rebounds are not recorded in this competition, and a
  per-game average over four players at one stop says very little.
- **E-06 PlayerSeasonStats and E-07 GameLog are filled.** Both were
  sitting at 45% opacity holding the specimen's figures. E-05's glance row
  was labelled Games / Points / PPG / Win ratio and was being filled with
  age, ranking points and a city.

### The stop page had a gender switch wired to nothing

The podium, the pools, the bracket and the game list all read the men's
records, and the list printed both genders end to end. Three more things
were wrong in the same module: S-05 painted every federation at the stop
into Pool A and left Pool B on its specimen row — which pool a team was
in is in the fixtures, not in the standings — the pool position column
was showing the stop rank, and `/final/i` matches *Semi-finals*, so the
semi-final round was handed the final and printed it a second time.

### 76.5°

The white lozenge behind the mark in F-03 CompetitionNav was cut at 26px
over 64px of height — 67.9° from the horizontal. Hero A tilts its slats at
**76.5°**, and F-03 sits directly under it, so the two now share one
figure: `--slant-run` in tokens.css is 1/tan(76.5°), and the clip path
reads `calc(100% - 64px * var(--slant-run))`.

### ctl-08 ToggleSwitch moves

The knob was pushed across by `margin-left: auto`, and `auto` is not an
interpolatable length, so it jumped. It is positioned now — `left` is a
length in both states — and three things animate at deliberately
different lengths: the knob travels in `dur-base`, the track fills, and
the cut-out fill under it cross-fades over `dur-slow`, because that fill
is what reads as *the value changed*.

### el-10 EmptyState, everywhere

The helper was building the block without the cut-out fill and without an
icon, so it came out as a filled grey panel rather than the outlined
element el-10 is specified as. It emits the element verbatim now, with
four icons and an optional action button — and it is used wherever a
module has nothing to show, instead of the three habits that were in the
file: hiding the section (C-03 PhotoGallery, Top scorer, leading
scorers), dimming the specimen rows to 45% (stop and team game lists,
the player page), or leaving a table of hidden rows behind a heading
(conference standings, the stop matrix, the two Stats tables, the box
score).

### The rest of the list

- **S-12 GameDetail.** The headline states the round, the date, the venue
  and the category on one line. The score lockup repeats S-04 GameList's
  own arrangement at display size — IOC code, flag, score : score, flag,
  IOC code — so a game reads the same way in the list and on its own page.
  Teams and Top scorer share a row of two equal columns, and so do the two
  halves of the box score. The top scorer carries an el-24 Avatar at M
  beside the flag, matched to it at 48.
- **F-06 SiteFooter lines up with the page.** Its four bands were padded
  `240px`, the gutter that centres a 1440 column at 1920 and nothing else.
  `--page-gutter` was defined in tokens.css for exactly this and was not
  being used anywhere; the footer uses it now, so the left edge of the
  columns sits on the left edge of the content at every width.
- **Overview states the live figure once.** It was printed on both lines
  and read as two separate live things.
- **The conference card is one target.** Its federation tags were lighting
  up under the cursor, which read as a second, smaller link inside a card
  that goes somewhere else. The rule above them is gone too.
- **The Stats overview is the wireframe's.** Final games, teams in scope,
  teams with games, active conferences, average points per game —
  recomputed against the gender switch and the conference filter. It was
  S-09, which says the same thing on every page and ignores both controls.
- **Points per game is what one team scores**, not what the two of them
  score between them. The conference highlight read 31 in a competition
  where 21 wins it.
- **Top score needs a comparable schedule.** A federation that played one
  stop and one good day was outranking one that played all six.
- **A final with no teams yet says so.** `fed()` cannot repaint an empty
  IOC code, so an undecided final kept whichever federations the specimen
  was built with.
- **Four ALG portraits.** `assets/players/` holds the first real cut-outs;
  E-08 and el-24 use them where they exist and keep the silhouette
  elsewhere.

## 2026-08-20 (1) — One selection treatment, one table, and the game page

### The 17th of June, twice

Picking Oceania on the landing page put 17 June in the strip twice. The
cause was not the strip: `pad()` extends a region's playing days outward
until it has eight, and the day-arithmetic helper formatted its result
with `toISOString()`. That converts to UTC first, so east of Greenwich
local midnight lands on the previous UTC day and every date comes back
one short — "the day after 17 June" returned 17 June. In UTC the bug is
invisible, which is why it survived. Dates in this app are calendar days,
not instants; they are formatted from the local fields now, in one place
(`isoDay`, `shiftDay`), and every `toISOString().slice(0, 10)` in the
file went with it — the same slip was deciding what "today" was on six
other pages.

### Why every conference read "1 of 6 stops"

Because *played* was being derived from the presence of a standings
record, and the snapshot only walked each conference's **first** stop.
The season is six deep almost everywhere: fifteen of the eighteen
conferences have finished, ninety-six of the hundred and eight stops have
been played. Whether a stop has happened is a fact about the calendar and
the calendar is complete in the feed, so `stopPlayed()` reads the date
and results fill in behind it. The Conferences cards, the stop dots, the
S-02 timeline, S-09 Overview, the team page's season journey and the
conference-winner test all move onto it. A stop that has been played but
whose results have not been ingested now says *Played* with its figures
still dashed, which is the honest reading of what we hold.

### ctl-03 Tab

The selected tab was a 2px rule under a grey label. It is a filled black
block with a white label now, notched on the **top-left corner only** so
it sits flush on the rule beneath the strip — the same selection
treatment as el-02 GenderSwitch, so the system has one way of saying
"this one" instead of two. An outline would be clipped away by the notch,
so the selected tab carries its focus ring inside, in white.

### ctl-08 ToggleSwitch — new

One switch for a view that filters itself. It is deliberately not a
checkbox: ctl-05 adds a value to a set, this changes what the table in
front of you *is*, and it takes effect with no apply step. Geometry
follows el-02 — outlined when off, solid black when on. Eight states.

### R-02 StandingsTable is one table

Competition Standings and Qualification were two tabs over the same rows:
the same federations, ranked the same way, with one column swapped. They
are merged, and ctl-08 cuts the table down to the twenty places that are
going. The **Route** column went with the tab — it repeated what the
Status marker already says. `qualification.html` redirects to
`standings.html?view=qualification`, so old links still land.

### el-09 Legend moved

Above its table and right-aligned, so the abbreviations are read before
the numbers rather than found afterwards, with a rule on **top only** — a
second rule underneath was fighting the table header. On Standings it
shares that rule with the new switch: one band above the table carrying
both controls that describe it.

### S-12 GameDetail — new

The page behind every **Box score** link in S-04. Johannes' wireframe
opens on a video player; there is no video module in this system, and the
league streams on YouTube, so the page opens on the result instead.
Score lockup, the two team plates with the stop record and the winner,
top scorer, box score per team, the stat comparison and the play-by-play.

The feed carries the result and the squads but no player statistics — the
endpoints that hold them were not in the snapshot. Rather than ship an
empty page, the box score, the match stats and the play-by-play are
derived from the two things that *are* real: the final score and the four
players each federation fielded. Every point is a two-pointer or a free
throw; the interleave gives the team that is behind the better chance of
scoring next, which is where the lead-change count comes from. It is
seeded on the game id, so a game always reads the same way, and the page
says so under the box score.

### E-08 PlayerCard: the surname that did not fit

`SAMBAUAIA MÁQUINA` wrapped to two lines of 30px and pushed the plate
over the stat column; `LUKENI ELISANDRO MANUEL` did the same above it.
There was a size step for this, but it lived in elements.css and lost to
the base rule in modules.css, so it had never once applied. Both names
are now measured and stepped down until they fit — five steps for the
surname, three for the given names — with a character-count fallback for
a card painted before it is in the document, and a re-measure on resize.

### Foundations · Typography

Two families and eleven styles, documented after colour: what each one
is, what it is for, and the exact weight, size, line height and tracking.

### Everything else

- **F-06** — the season selector beside the lockup is gone, desktop and
  mobile.
- **E-03** — the hover elevation was a `box-shadow` on a clipped surface,
  so it was being cut away and nothing happened. `drop-shadow` follows
  the silhouette; the cards lift to e1. The federation tags were the
  plain variant — a bare flag and code — and are now el-13 at size S.
- **Stop podium** — `.cnf-pod` is a cut-out surface, so `background` is
  the border colour. The winner tile was setting only that, leaving white
  type on a white plate. The 1st tile is filled again.
- **Home · Live now** — the per-conference gender switch inside every
  el-07 AccordionShell is gone; one switch sits in the filter bar with the
  region chips, hard right. **Qualification** — the switch moves right and
  **Full standings** moves to the foot of the board, where it belongs.
- **Stats** — Top score is the first column of the spotlight, stated as
  el-13 at size L, instead of a section of its own with a 40px country
  name. Overview is S-09, the block the other two hub pages open with.
- **Calendar** — the gender switch is in the page head at headline
  height, a search sits under it the way it does on Teams, and the
  accordions have no switches of their own.
- **Player** — C-03 PhotoGallery at the foot, from the stops the player's
  squad was entered at.
- **assets/flags/CAL.svg** — New Caledonia was 404ing on four pages.
- **initChrome** — the resize handler read `mm` and `ovl` from the fetch
  callback's scope, so every resize threw. Hoisted.
- **tools/bump_assets.py** stamped index.html and the design system only,
  which left thirteen pages serving whatever the browser had cached. It
  covers every page now.

## 2026-08-19 (5) — The selected stop, and About as one page

### On whether a clickable stop is worth anything

It was not, as built: the selector moved a highlight and nothing else,
because the Stop-by-stop matrix already answers the question the whole
tab was asking. Two readings of the brief settle it.

Alex's navigation principle from 3 August — *start at 20,000 feet and go
down a level at a time* — and Johannes' wireframe, where the STOPS tab is
the **stop detail**, not a second view of the conference. So the two
things on that tab now answer two different questions. **Stop by stop**
is the conference: every federation, every stop, one grid. **The panel
above it** is one stop: who was on the podium, that stop's games, and a
link into the full stop page for the pools and the bracket. Picking a
stop changes all of that, which is what makes picking one worth doing.

A stop with no results says so, in both places.

### Why the games looked disabled

They were placeholder rows at 45% opacity — the state the system uses
for anything the data layer has not filled — sitting under a caption
that said there were no games. Two ways of saying the same thing, one of
which reads as "disabled". The table hides now and an el-10 EmptyState
says what is missing and when it arrives.

### E-08 PlayerCard

- **The flag was drawn at 64px.** `flag()` sizes its image to fill its
  box; E-08's flag box is a 64px column holding the flag *over* the IOC
  code, so the image filled the column and pushed the code out of the
  card. The flag is drawn at its own 22px.
- **The reflection is on top.** It was inserted before the pattern, the
  key visual and the cut-out, so it was reflecting off the back of the
  card. z-index puts it over all of them, including the name plate.
- **Every card, everywhere.** The layer was added by a markup pass that
  only matched some of the specimens. It is injected when a card is
  wired instead, so a card added later still reflects.

### Global and Home

- **F-05** — the muted default was written after the selected state, so
  a rule of the same weight took the current page back to grey. Stated
  last.
- **The nations / team-sites count** is a sibling of the title, not part
  of it — it was inside the title group, where `margin-left:auto` has
  nothing to push against. Flush right on the landing page, on
  Conferences, and in the design system's E-01 specimen.

### Conferences

The count line under the headline is gone. Find a team and Overview are
each one full-width block, stacked, rather than two columns. The card
grid, its hover elevation and the size-S federation tags were already in
— the page had a broken `tpl-split` wrapper around the head that was
swallowing everything after it, so none of it rendered. The page is
rebuilt from four balanced blocks.

### S-11 StopMatrix

The stop cells and their headers are centred, so *Stop 3* sits over
*1st / 100 pts* rather than beside it.

### About

One page. It was five sections behind a switch, which meant a deep link
could only ever land on the first of them and nothing scrolled. The menu
is anchors now — it sticks, it scrolls to its section, it marks whichever
section is in view, and the URL carries the section so a link into it
works. The two sections the menu had always listed but the page never
had — **Conferences and stops**, **Age categories** — are written, from
FIBA's own competition description.

## 2026-08-19 (4) — Real dates, real cards, real photographs

### The strip was hiding the season

The day list was built from stops we hold *results* for, so every stop
the snapshot has not caught up with vanished — which is why 19, 20 and
21 August were missing while Asia SEA was mid-conference. A day counts
when a stop is **being played on it**, results or not. The landing page
now opens on 19 August with Asia SEA · Stop 3 live, and a stop with no
results yet says so inside its accordion instead of showing an empty
table.

**Eight days, always.** el-30 CalendarStrip is eight equal days, but a
region with fewer playing days rendered a short strip — Oceania is one
conference, so it drew six — and the module changed shape from filter to
filter. The region's playing days come first; the rest of the eight are
the calendar days around them, marked off so they read as empty rather
than clickable. Same rule on the Calendar page.

### Photographs are keyed on the event

The feed keys a gallery on the event it was shot at, not on a stop slug,
so `paintPhotos` was filtering on a field that does not exist and every
page got the whole archive. A page now asks for its own events' galleries,
newest shoot first — the landing page shows the season's latest, a
conference shows its own, a stop shows that stop's.

### E-08 PlayerCard

- The conference page had been given an invented card — `pcard-bg`,
  `pcard-nm`, a flag box that was not one — so none of the pattern, key
  visual, silhouette or plate rendered. It uses the real card now.
- **The flag never changed.** `flag()` looks for a `.flag` box; E-08
  holds its flag in `.pcard-flagbox`, so every card kept the federation
  the specimen was built with. It paints both now — and replaces only
  the artwork, because clearing the box was taking the IOC code with it.
- **A long surname drops a size.** Two lines of 40px pushed the plate
  over the stats; over eleven characters the card sets 22px rather than
  truncating a player's name.
- The lift, tilt and specular band now apply everywhere a card appears —
  team pages, the conference page and the design system.

### Global

- **F-05 MegaMenu** — the gap between a category heading and its first
  item is doubled, so three columns stop reading as one long list.
- **el-11 SearchInput** — the clear control uses the same plain X as the
  search overlay.
- **el-22 CarouselIndicator** — hover and focus states. Both types are
  controls; a bar jumps to its slide, so it has to say so.
- **el-note** — a note belonging to a full-bleed module sits outside
  `.m-block`, so it started at the page's left edge while every other
  note started at the column's. Same gutter now, at every width.

### Conferences

Five and five columns. Qualification tables is a ctl-02 Link, like *Or
browse all nations*. Cards lift on hover. The federations in a card are
el-13 at size S. The nations / team-sites count sits at the right of the
section header, at body size with the figures in bold.

### Conference page

The Stops tab was inert: `sel` indexes the conference's stops but the
games were read out of the *played* ones, so picking a stop showed the
wrong games or none.

### Stop page

**What Pool B should show when it is empty: nothing, and a reason.** A
stop that has not been played has no pools, no bracket and no podium —
the draw is published with the results. Rather than three empty modules,
those hide and the page says so, and points at the conference table,
which already counts every stop before it.

### Stats

- **Top scores is real, not a placeholder.** It is the federation
  scoring most per game in whatever is in scope — Republic of Korea at
  21.0 with the All-conferences filter on. It is now named the way a
  team page names one: flag, then federation, with the figure under it.
- The player cell drops the flag that sat between the initials and the
  name — the Team column carries the flag now, and two in one row read
  as two different things.
- **The black rule on the left of row one** was `.r05-pod`, the podium
  treatment from the stat-leaders specimen. A ranked list already says
  who is first. Removed.

### Calendar

Opening an accordion closes the one that was open. The list is the whole
season here, so leaving them open turns the page into a wall of tables.

### About

Opens on *What the Nations League is*, which now leads with a 16:9 slot
for the explainer film and a centred play control. The table of contents
drives the page instead of being a static list with the second item
marked.

## 2026-08-19 (3) — The live segment, the Stats page and the Calendar

### Home

- **The progress bar shows the live share in red.** Two things were
  wrong: the `.s09-live` segment was not in the markup at all, and the
  bar was measured in stops while the line above it counted conferences
  — so the line said *1 live* and the bar had nothing red in it. The bar
  is now read in the same unit as the line above it: conferences on the
  landing page, stops on the Conferences page.
- **The mega menu follows the navigation's colour logic** — muted at
  rest, white on hover, white with a rule when it is the page you are
  on. The gold accent belongs to the corporate strip.
- **R-01 QualificationBoard has its own Men / Women switch again**, under
  the title and left aligned. LP-13 asks for it by name, and the module
  is a quarter of the page wide, so the title row has no room beside the
  Full standings link. `genderSwitch()` is scoped now — the landing page
  carries three switches and a document-wide binding moved them together.

### Conferences

Find a team and Overview sit side by side under the headline. S-09 is a
full-width card on the landing page; in a 600px column its label,
figures and bar do not fit on one line, so the bar wraps under the
figures rather than pushing the page wide.

### Standings

The search field works on the Qualification tab. It narrows what is
shown of the field of twenty and never changes who is in it, so the
position column keeps the qualification place rather than the row number.

### Stats

**Teams | Players**, as ctl-03 Tab under the headline.

Teams carries: **Top scores** (the federation scoring most per game),
**Team stats spotlight** in the same six-figure row a team page uses,
**Overview** (final games, teams in scope, teams with games, active
conferences, average points per game), a **conference filter** with all
eighteen conferences plus All, and then **Team performance** and **Team
scoring** as two tables.

Players lost the metric chips — the feed holds one measure per player, so
four chips that all sorted the same list were a control that did nothing
— and gained a **Team** column with the federation's flag and IOC code.
Games and PPG stay empty because there are no box scores in the
snapshot; the column that was labelled Points is now **Ranking pts**,
which is the measure actually in it.

### Calendar

The landing page's Live now module, with the day selection released:
**nothing is preselected**, so every stop that has something under it is
listed as an S-01 accordion — sixteen of them. Picking a day narrows the
list to that day; picking it again clears it. The month headings and
dividers are gone, because the strip already is the calendar.

### On the Route column

Worth stating plainly, since it was asked: the two routes are official —
`NL - about.docx`, FIBA's own competition description, says the host and
each conference winner qualify and the rest of the field of twenty comes
from the global standings. Alex raised the same split himself on slide 17
(*"we can split between winners of conference and others"*). What is
**ours, and not signed off**, is showing it as a column, and the
provisional *Conference leader* wording for a federation that currently
tops a conference that has not finished. It belongs on Friday's list as a
proposal, not as something the client has already agreed.

## 2026-08-19 (2) — Breadcrumbs, two real tabs, and the conference pages

### Global

**Every page states its own breadcrumb.** Pages that carry an entity in
the trail were leaving the specimen's text in place, so a team page
opened from any federation still read *Home / Teams / Serbia* and a stop
page kept whichever conference the specimen was built with. There is one
writer now, and team, player, conference and stop all use it. The same
bug had the team and conference H1 stuck on the specimen's name — the H1
is `.f04-h1-m`, which was not in the selector list.

**The mega menu no longer highlights Standings on every page.** The gold
accent was baked into the partial as a stand-in for "you are here", and
being a partial it did that everywhere. Gold is a hover colour; the
current page is now marked the way F-03 marks it — white label with a
3px white rule under it — and the marking is derived from the page.

### Home

- **Overview** — the label and the figures now sit on one centre line.
- **The red dot means live now.** Every day in the strip has play, so
  marking them all made the whole season look live. Nothing is live
  today, so no dot shows, which is the truth.
- **The default day** is today when today has play, and otherwise the
  most recent day that did. That was already the behaviour; it is now
  stated in the code rather than implied.
- **el-11 SearchInput has a clear control** at the trailing edge, which
  appears as soon as there is text. It existed only in the search
  overlay's markup, so the fields on Teams and Standings had no way back
  to the full list.

### Standings — the two tabs answer different questions

They rendered the same rows, which is why splitting them read as
arbitrary. ST-03 asked the page to answer two things:

- **Competition Standings** — every registered federation ranked on how
  it has played. Win ratio, points average, stops played, tour points,
  sortable on any column.
- **Qualification** — the twenty places at the U23 World Cup and nothing
  else, in qualification order, with a **Route** column in place of Pts
  Average and EP: conference winner, conference leader, or standings.
  One unified view, per ST-09 — not a Winners column beside a Race
  column, which the call ruled out.

Also: **sorting works** (the arrow and the `cell-sorted` class were
painted in but nothing was wired); **tour points are tour points** —
the column was being filled with the basketball points a team scored,
which ranked the table by offence; the **status marker** was being
clipped off the right edge by a table pinned to 1440px inside a clamped
column, which is what made it look broken; and the legend gained
**N — not qualified**.

### Teams

el-25 AlphaIndex came off. With 67 federations the letter is rarely what
anyone knows and the region is, so the filter is a row of el-14 Chip at
size S under the search field — the same five regions the landing page
uses. The count moved under the chips, because it describes what the
filter left rather than what the page is called.

One entry per federation, but the de-duplication now happens *after* the
gender filter: a federation fields a team in both, and collapsing first
meant whichever gender the feed listed first decided whether the
federation appeared at all — 33 of 68.

### Team page

- **The switch says which category.** A federation may enter U23 only,
  U21 only, or both. Two segments become four when it does — Johannes'
  SWITCH TEAM, which was the only route to a U21 squad.
- **One H1, on the thing that is actually the page title.** F-04 keeps
  the breadcrumb and the switch; the federation name in E-04 is the H1.
- **S-10 SeasonJourney** above the roster — the conference stop by stop:
  where this federation finished, what it was worth, whether the stop has
  been played.
- **Squad → Roster.** FIBA's own term across its platform, and the
  module has been called E-10 RosterGrid all along.
- **Photos** under the results.
- E-08's card stats state age and 3x3 ranking points — what the snapshot
  holds — instead of printing ranking points under a PPG label.

### Conferences page

Find a team, then Overview with both lines, then a ghost **Qualification
tables** button through to Stats, then the grid.

**E-03 is one card per conference.** It was one card per region with the
conferences listed inside and a *View region* link that went nowhere the
card did not already go. The federations in each conference are named
with el-13 FederationTag at size S, and the region is a caption over a
group of cards. The U21 conferences sit inside their region with
everything else — the feed files them all under a "U21" region, and
region is now derived from the conference instead.

### Conference page

**Overview | Stops**, as ctl-03 Tab.

- **Overview** — the standings columns agreed on 3 August, then leading
  scorers as E-08 PlayerCard, then conference highlights, then photos.
- **Stops** — the stop selector, **S-11 StopMatrix** (one row per
  federation, one column per stop, placement over what it was worth —
  Johannes' original, and what Alex asked for on slide 9: *"Good, but
  show six stops"*), then that stop's games, then the link back to the
  conference table.
- **E-08 on hover** lifts, tips six degrees towards the pointer and
  takes a specular band across it. Off under `prefers-reduced-motion`.

Two things to flag rather than bury. **Conference highlights is the tile
row Alex marked "irrelevant / kill"** on slide 10 of the written
feedback — it is in because it was asked for again, and it sits at the
foot of the Overview tab rather than near the standings. And **leading
scorers has no box scores to rank**: the snapshot carries pool games and
finals but no player lines, so the cards are ordered by FIBA 3x3 ranking
points and say so in an el-27 banner, with points per game left empty
rather than guessed.

### Stop page

The stops are selectable and the whole page follows the selection —
title, breadcrumb, podium, pools, bracket, games, photographs.

**On where the bracket goes:** it was already in the right place. Stop
result, pools, bracket, games is the order Alex asked for on slide 14 —
final on top, third place under it. It read as missing because nothing
filled it. The snapshot holds pool games and finals only, so a round
with no games now hides instead of showing specimen scores, and the
podium is painted plinth by plinth rather than repeated from the first,
which had put the same federation in all three places.

### Also

- `width:1440px` is gone from every table. Inside a clamped column it
  pushed the last column past the viewport, which is what clipped the
  status badge and gave Stats and Player a horizontal scrollbar.
- The snapshot repeats the city when the feed's city and region match —
  "Riga, Riga". Collapsed once, in one place.

### Design system

New: **S-10 SeasonJourney**, **S-11 StopMatrix**. Updated: F-04 (control
slot), F-05 (current page), el-02 (category variants), el-09 (N marker),
el-11 (clear), el-23 (per-page trail), el-25 (no longer on Teams), E-03
(one card per conference), E-04 (the H1 lives here), E-08 (hover), E-09
(region filter), R-02 (two views). `system/_check/` and `system/pages/`
were both edited — the build scripts in `tools/` still point at an old
session path.

Scripts: `tools/p3_standings.py`, `p4_team.py`, `p5_conferences.py`,
`p6_conference.py`, `p7_stop.py`, `p8_designsystem2.py`.

## 2026-08-19 — Overview, the calendar strip, and one place for the switch

### S-09 is now Overview, and it has a type

Renamed everywhere — the module, the section header on the landing page,
the design system entry and the anchor (`#modules-1/s-09-overview`).

It also gained a **type** axis, which the four lifecycle states sit
across rather than replace:

- **conferences** — one line, and what the landing page carries.
- **conferences and stops worldwide** — two lines, and where the
  `108 Stops worldwide` counters Alex asked for on slide 8 belong.

That split is deliberate. LP-10 asks for the block to come off the
landing page; slide 8 asks for exactly those counters. Putting the
conferences line on the landing page and the full pair on the
Conferences page answers both instead of compromising between them.

The figures were also wrong: the conference line was reading the *event*
count, so it said 108 conferences. It now reads 18 conferences, how many
have finished, how many are to go, and a live count that hides itself at
zero. The bar reads stops played of stops scheduled — the finest measure
we hold — whichever line is above it.

### The strip only offers days that have something under them

LP-17, and Johannes' note on the screenshot. The strip was eight
consecutive calendar dates, most of them empty, with an EmptyState
waiting underneath. It is now built from the days that actually carry
results, so there is no empty day left to land on. "Carry results" means
a team has played: two stops arrive with a full standings record in which
everyone has played nothing, and offering those days is the thing the
note asked us to stop doing.

### The selected day stays where it was clicked

Two independent pieces of state now, where there was one. `sel` is the
day whose conferences are shown below; `win` is the first day visible in
the strip.

- Clicking a day changes `sel` and nothing else, so the cell stays in the
  slot it was clicked in. It used to re-centre the window on the clicked
  date, which threw the cell three places to the left.
- **Prev** and **Next** move `win` and leave `sel` alone. The strip
  travels, the selection does not — they used to move the selected date
  by seven days, which silently changed what was shown below.
- The movement is animated (`s03-in-l` / `s03-in-r` in motion.css), and
  the buttons dim at either end of the season.

### S-01 LiveConferenceAccordion shows real numbers

It was painting by column index — `nums[length - 2]`, `nums[length - 1]`
— so the win/loss record landed under **Pts Average** and the points
scored under **Tour Points**, and Win Ratio was never filled at all. The
conference page had the same defect one column over.

There is now one implementation for both: `conferenceTable()` aggregates
every stop of a conference played up to the selected day, and
`paintStandingRow()` addresses every cell by its own class. Tour points
are derived from the finishing order at each stop — 100 / 80 / 70 / 60 /
50 / 40 — because the feed carries the order but not the points; the
ladder is stated once, in one place. The gender switch inside the panel
is wired and scopes that conference's table.

Two stops in the snapshot arrive with no gender label, so a gendered
lookup found nothing and the table rendered blank. `standingsFor()`
prefers the labelled record and falls back to the unlabelled one.

### The accordion opens rather than appears

`display: none` became an animated height: measure, animate, release to
`auto` so a table that reflows afterwards is not clipped, and put
overflow back to visible so a tooltip near the bottom edge still shows. A
collapsed panel also drops its padding and rule — with `border-box`,
`height: 0` still left 24 + 24 + 1px standing.

### News is the feature layout, and it is two

C-02 `layout = feature` — two across, the image over the headline and the
date. It was repeating over the whole feed, so a third card appeared
whenever a third story existed.

### One place for Men / Women

Following on from yesterday: the switch is no longer a bar of its own
under the title. **F-04 SubHeader** now has an identity column on the
left — H1 with the page context under it — and a **control slot** on the
right, and the switch lives there on every page that scopes by gender.
Same coordinates on all of them.

That moved the page context line out of the right slot and under the H1,
which is what the conference page needed anyway: **Mombasa · 1 Jul – 7
Jul** now sits under **AFRICA EAST U23** instead of floating at the
opposite edge. E-04 TeamHeader gave its switch up to F-04, and its entry
in the design system says so.

### Also

- **NM-01 was only true in the markup.** The live render was resetting
  the conference H1 to the unqualified feed name — the H1 is
  `.f04-h1-m`, which was not in the selector list — so the breadcrumb
  read "Africa East" while the headline read "Africa East U23".
  `confName()` now appends the category once, in one place: U23 by
  default, and the feed's `U21 Europe-2` prefix moved to the end.
- The conference page header prints its real host cities and date span
  instead of a hardcoded Kigali.
- Stop page: title is `Stop 1 · Mombasa`, and the breadcrumb's
  conference crumb is named and linked.
- `Qualification` and `Full standings →` were overlapping in the
  quarter-width column; the action wraps under the title there.

### Files

`tools/p1_headline.py` and `tools/p2_designsystem.py` are the scripts
that made the structural edits, kept so the change is reviewable. The
design system was edited in both copies — `system/_check/` (specimen)
and `system/pages/` (published) — because the build scripts in `tools/`
still point at an old session path.

## 2026-08-18 — P0 before the 21 August review

Four things the wireframe and the client feedback agree on, and the build
did not do. Nothing here is a design proposal — each one is a written
requirement we had missed.

### Men / Women in one place

Alex's deck, slide 12: *"Men/women — Here in all pages"*. The switch was in
a different row on every screen — inside the live block on the home page,
after the search field on Standings, next to the metric chips on Stats —
and missing entirely on Teams, Conference and Stop.

It is now **el-02 in a bar of its own, directly under the page title**, at
the same coordinates on Standings, Qualification, Stats, Teams, Conference
and Stop. The new `.pgbar` eats half the 40px section rhythm so the control
reads as part of the title, not of the content below it.

Two switches stay where they are, and deliberately: the one on the team
header is a *team* switch, the same place Johannes' wireframe puts it, and
the one on the home Qualification module is what LP-13 asks for by name.
Calendar, Conferences and News carry no switch — nothing on those pages is
scoped to one gender.

### A real H1 on every page

Mota defended the headline and the breadcrumb on 3 August with SEO, WCAG
and deep-link entries from search and social; the agreement was to shrink
them, not to remove them. The page titles were markup `div`s — the site had
**no `h1` and no `h2` at all**.

`.f04-h1-m` / `.f04-h1-s` are now `h1`, section titles `.t-h2` are now `h2`.
The classes are untouched, so nothing moved by a pixel. On the home page the
wordmark carries the title, so it became the `h1` with the text next to it
for crawlers and screen readers (`.sr-only`).

### Home in the navigation

LP-01, and the first note on slide 1 of the deck: *"Missing Home for landing
page"*. The wordmark did the job, which is a convention, not an entry. There
is now an explicit **Home** item first in the bar, carrying the current-page
state on the landing page.

### Men / Women on the Conference page

CF-01 asks for it in the conference header in so many words. It is there now,
in the same bar as everywhere else.

### Files

`tools/p0_patch.py` is the script that made the change, kept so the edit is
reviewable. New CSS lives at the end of `assets/site.css`.

## 2026-08-15 — E-01 revised, B-3 and B-4

### Two that had not landed

- **Overlay alignment.** Three overlapping blocks of CSS had accumulated, and
  the last one centred the mega menu's columns instead of spreading them. One
  block now, reusing the page's own column verbatim: a clamped gutter with a
  centred 1440, so both edges line up and Close sits with the season selector.
- **Player card shadow.** Four `.pcard` rules in three files disagreed — one of
  them set `overflow: visible`, which unclipped the artwork. One rule now, in
  modules.css, so the design system shows it too. The containers carry padding,
  because an ancestor's overflow was clipping the shadow away.

### E-01 TeamFinder

Rebuilt to the wireframe: the three legacy states are gone, the future-feature
note is gone, the search icon renders, the field and the autocomplete share one
width, **Change** appears on the result as well as the chooser, and the result
carries **Tour points · Win ratio · Record · Stops played** laid out like the
team header's second row, with the two actions as ctl-01 ghost buttons.

### Navigation

- The panels are `position: absolute`, so they scroll away with the page — the
  navigation is not sticky.
- The prototype's mega menu drops the Featured column.
- **More** no longer takes the current-page underline while its panel is open.

### B-3 — Live now

A week of dates around today with a live dot on days that have basketball;
Prev and Next move a week; a day with nothing is muted and shows **el-10
EmptyState**. Region chips filter the conferences. Because the season in the
snapshot has finished, the strip opens on the last day that actually had play
rather than an empty today.

### B-4 — Conferences and Qualification

- Each conference links to its own page, shows **stops played of total** rather
  than all-black dots, and carries a **Live** badge only where a stop is
  running. The branded stroke marks a region that is playing right now.
- **qualification.html** — its own page, twenty teams, Qualified or Shortlisted,
  men / women, linked from Standings and from the home board.

### Also

- el-22 CarouselIndicator is 8px tall.

## 2026-08-15 — Find a Team, spacing, overlay alignment

### E-01 TeamFinder — four steps

Built from Johannes' wireframe and documented in the design system as four
states of one module, not four modules: **default**, **filled in**, **choose
team site**, **result**. Every part is an existing element — el-11 SearchInput,
el-15 AutocompleteMenu, el-13 FederationTag, el-06 StopDots, ctl-02 Link — so
nothing new entered the system.

On the home page it runs on real data: nation and team-site counts, live search
over all 68 federations, a team-site chooser per category, and a result card
carrying that squad's seed, standing, record, conference points and stop
progress, with links to the team and the conference. Change returns to step 1.

### Spacing and alignment

- **40px between every section**, top and bottom included.
- Mega menu and search share the page's content column, so both edges line up
  with the rest of the site and Close sits with the season selector.
- The flag in a search result was clipped by the row's own edge.
- Flags on a dark surface take a dark ring.

### Player cards

- e1 at rest everywhere, in the design system and the prototype; e2 on hover.
- On a team page the four cards hold one row and **scale together** down to
  1280 rather than wrapping.

## 2026-08-15 — Chrome corrections, Find a team, Qualification

### Navigation

- The first block sat against the navigation bar; `.tpl-content` now has top
  padding to match the rhythm below it. (The wordmark-to-nav 48px was already
  in place — the gap the screenshot marked was this one.)
- **More** changes colour on hover, not background, like the magnifier.
- The **magnifier** starts at the same muted grey as the text items and turns
  white on hover.
- With one panel open, moving the pointer to the other trigger **swaps panels
  immediately** rather than closing and reopening.
- Mega menu and search content share the page's gutters, so both edges line up
  with the rest of the site.

### Find a team — E-01 TeamFinder

Wired on the home page over all 68 federations: quick chips at rest, a live
autocomplete as you type with flag, IOC code and conference, and a no-match
message. In the design system the states are relabelled **default / filled in /
result — no match**.

### Qualification — LP-12

Rebuilt to the specification: only the twenty that reach the U23 World Cup, one
row each with position 1–20, flag, country and a **Qualified** or
**Shortlisted** label. The conference column is gone. Men / women switch. The
block is three columns of twelve, so the left column takes nine.

The feed carries no qualification flag, so the split is derived from tour
points — the leading twelve read as Qualified, the next eight as Shortlisted.
Two constants at the top of that function change it when the real field
arrives.

### Design system

- F-03m: the "header + bottom bar" state is gone, "header only" is now
  **header**.
- S-09: Season progress is wider.

## 2026-08-15 — B-1 corrections and B-2: filters

### Navigation panels

Both the mega menu and the search overlay were covering the chrome. They now
hang from **under** it — `--chrome-h` is measured at runtime rather than
hard-coded, because the corporate strip can wrap — and slide down, the way
Apple's navigation does: **hover opens on a mouse, tap opens on touch**, and on
a mouse, leaving the panel closes it. Escape and Close still work.

- The search field fills the content column.
- **Nothing is listed until something is typed.** An empty field shows no
  results at all; groups appear as the query matches.
- One focus ring, on the container. The input inside is reset with
  `appearance: none !important` — Safari's native bezel was drawing the second
  rectangle inside the ring.

### Live now

The accordion header only expands and collapses. The link out is the **View
conference** action inside the panel, and each standings row goes to that team.

### B-2 — filters and search

Four small controls in `site.js`, each returning its value and calling back on
change, so a page renderer stays one `draw()`:

| control | pages |
|---|---|
| el-02 GenderSwitch | Standings, Stats |
| el-03 FilterChips | Stats (metric), Calendar (region) |
| el-11 SearchInput | Standings, Teams, search overlay |
| el-25 AlphaIndex | Teams — click a letter to filter, click again to clear |

- **Standings** — search by name or IOC code, men / women switch.
- **Teams** — alphabet and search together; letters with no federation are
  disabled.
- **Stats** — metric chips, men / women, and the federation is now the third
  column, resolved from the squad a player appears in.
- **Calendar** — region chips over the real 108 stops, grouped by month.

When a filter empties a block, **el-10 EmptyState** takes its place at the same
width, as agreed for LP-17.

## 2026-08-15 — B-1: navigation

**F-05 MegaMenu** opens from More on every page. **E-11 search** opens from the
magnifier as a full-screen overlay whose field fills the content column, and it
searches federations, players and news as you type. Escape or Close dismisses
either.

Both live in `partials/` — extracted from the specimen sheets, so they are the
documented modules rather than a second copy — and are injected once per page
instead of being duplicated into fourteen files. Editing the menu is one file.

T · Search already *is* the overlay, so that page wires the one it has instead
of stacking a second copy; its Close goes back.

- Header — 48px between the wordmark and the navigation.
- "How it works" links to About.
- Section rhythm — `.tpl-content` now carries the same gap between every
  section *and* below the last one, so the footer no longer butts against the
  final block.

## 2026-08-14 — The inner rectangle, and 226 games that were already here

### The focus ring, root cause

Safari paints a **native bezel** inside every `<input>`, and a rounded one on
`type="search"`. `border: 0` and `outline: 0` do not remove it — only
`appearance: none` does. That bezel is the inner rectangle that has been
sitting next to the focus ring for four rounds. Chrome does not draw it, which
is why it looked correct every time I checked.

The clue was in my own diagnostics: the computed style reported
`appearance: auto` and I read past it.

Every input inside `.live` now has `appearance: none`, plus the WebKit search
decoration pseudo-elements are suppressed. The `@property` registration of the
cut lengths from the last round stays — it is a real robustness fix.

### 226 games were in snapshot 2 all along

`games.summary` held 226 games across 17 stops with pool, round, court,
tip-off and both scores. My extractor tested the wrong key and reported the
slice as empty, so two rounds of "we need another data pass" were unnecessary.

`games.json` is now built and wired: the Stop page and the Conference page show
real fixtures with real scores, winner and loser styled from the result.

A game summary carries no `eventId` — the category does — so games are joined
to their stop through `categoryId`.

### Also

- F-03m — the inline `style` on the stage was overriding the stylesheet, which
  is why `height: 848px` never took. The inline value is 848px now.
- S-09 — number-to-label spacing halved.

## 2026-08-14 — Focus ring root cause, flag and roster bugs

### The double stroke, finally

The cut is built from **untyped** custom properties, so the browser has to
substitute `calc(8px - 0.586 * 2px)` as raw text inside `polygon()`. Chrome
resolves it; other engines treat it as invalid and fall back to a **rectangle** —
which is exactly the second black stroke that kept coming back on ctl-04 and
el-11. In my browser it always looked correct, which is why three rounds of
fixes did nothing.

`--c`, `--n` and `--ic` are now registered with `@property` as `<length>`, so
they compute to real lengths before substitution, plus an `@supports` fallback.

### Two real prototype bugs

- `flag(document.body, ioc)` repainted **every** flag on the page with one
  country — the results table and the game log all showed the selected team's
  flag. `flag()` now refuses to walk the document; header calls are scoped to
  the header.
- A team's roster merged every player the federation had fielded all season, so
  Kenya showed 16 instead of 4. A 3x3 squad is four players at one stop; the
  page shows the most recent squad.

### Design system

- Foundations block titles renamed: **Grid** and **Breakpoints**.
- Notes have their padding back instead of text against the container edge.
- S-09: column gap halved, the black and red bars overlap by 8px.
- F-03m: 848px tall.
- Prototype ↗ opens in a new tab.

### Added

`MOTA-TASKLIST-STATUS.md` — all 36 tasks from the designer task list checked
against the build: 20 done, 9 pending (all interaction wiring plus the
Qualification specification), 3 blocked on game data, 2 open questions.

## 2026-08-14 — The prototype

14 screens, built from the approved templates and filled with the real season.

`tools/build_pages.py` lifts each T · block out of `04-templates.html` as a
standalone page — the markup is the design, untouched — wires the navigation
and marks the body `.live`, so every interaction the design system documents
works on the real site.

`assets/site.js` finds each module in the page and rewrites its rows from
`assets/data/*.json`. Nothing is hard-coded into the HTML, so a change to a
component in the design system shows up here with no edits.

| screen | what is real |
|---|---|
| Home | live conferences with standings, qualification board, news, photo carousel, season counts |
| Conferences | 18 conferences grouped by region |
| Conference | stop timeline, conference standings |
| Stop | venue, pools with seeds and records |
| Standings | season federation table built from every stop |
| Teams | every federation, A–Z, letters without entries disabled |
| Team | roster as player cards, season totals |
| Player | name, federation, ranking points |
| Stats | ranking leaderboard |
| News · Article | three real articles with Cloudinary images |
| Calendar | 108 stops by month |
| Search | federation results |

**Routing** is by query string — `conference.html?id=africa-east`,
`stop.html?id=africa-east-stop-1`, `team.html?ioc=KEN`, `player.html?id=<uuid>`.
No page is generated per record, so 711 players cost one file.

**Flags** are real: 230 IOC SVGs from the brand assets, swapped in by IOC code.
67 of the 68 codes in the data have one; New Caledonia (CAL) falls back to a
grey disc.

**Photographs** come straight from Cloudinary with the crop and width as URL
parameters — no images in the repo.

Game scores are still missing from the snapshot, so the fixture tables on Stop
and the game log on Player are dimmed rather than filled with invented results.

## 2026-08-14 — Real data in place

Second snapshot folded in. `assets/data/` now holds the 2026 season:

| file | records |
|---|---|
| conferences.json | 18 |
| events.json | 108 stops, 18 with venue, coordinates and registration counts |
| standings.json | 36 — 18 stops × men/women, with rank, seed, W/L, points |
| teams.json | 202 with rosters |
| players.json | 711 with age, IOC, home city, ranking points |
| news.json | 3 |
| photos.json | 401 galleries |

About 660 KB. Verified end to end: Africa East · Stop 1 in Mombasa resolves to
its venue, its men's standings (Kenya 3–0, 58 points) and South Sudan's four-man
roster with ranking points.

Missing: individual game scores. They sit behind each stop's `/games` route and
were in neither pass, so GameList and the bracket still have no real fixtures.
Everything else is real.

`tools/build_data2.py` derives men/women from the roster's gender, since the
category id alone does not say which is which.

## 2026-08-14 — Fluid containers + real data

### Containers are fluid at source, not patched in the shell

Every fixed container width in the specimen CSS — 76 of them — was rewritten
by `tools/fluidify.py` from `width: 1440px` to `width: 100%; max-width: 1440px`.
Anything under 640px is a real component size (a 342 card, a 44 button) and was
left alone. The shell no longer has to override anything, and the same change
makes the prototype responsive later.

R-01 and the other 1400-wide tables were normalised to 1440, so every table in
Modules II lines up.

Notes, purpose text and state rows wrap instead of forcing a minimum width.

### Data

`fiba-nl-2026-snapshot.json` (1.39 MB) processed into `assets/data/`:

| file | records |
|---|---|
| conferences.json | 18 |
| events.json | 108 |
| news.json | 3 |
| photos.json | 401 |

The stop slugs generated from the data match the live site's own URLs exactly
(`africa-east-stop-1`), which means a second pass can walk them directly.

Standings, teams, players and games load per stop and were not in the first
snapshot. `tools/snapshot2.js` collects them — the stop list is baked in,
ordered one-per-conference first so a short run still covers the whole season's
shape.

Images stay as Cloudinary URLs with the crop and width as parameters, so no
image folder is needed.

## 2026-08-14 — Review round 8

### Why the anchor menu stopped working

`html, body { overflow-x: hidden }` — added last round to stop the page sliding
sideways — silently turns `<body>` into a **scroll container**. `window.scrollTo()`
then moves nothing, so every anchor click did nothing. Replaced with
`overflow-x: clip`, which does the same visual job and creates no scroll
container.

### Why the right side was cut off

`.anchor { overflow-x: clip }` clipped anything wider than the pane instead of
letting it scroll. It is `overflow-x: auto` now, with symmetric padding and a
visible scrollbar, so a 1440-wide module can be scrolled to on a smaller laptop
rather than disappearing.

### What was already fixed but not yet live

Verified against the deployed site: `motion.css` and `app.js` were being served
from cache, so el-11's focus ring, el-22's fill animation, R-01's width and
E-08's shadow were all fixed in the repo and old in the browser. The version
stamps from round 7 land with this push and end that.

el-11's focus ring was checked directly in the browser and draws a single
cut-cornered stroke — correct.

### Fixes

- F-03m — the frame is `aspect-ratio: 402/874` (iPhone 17), so its height
  follows its width. Every state's header search opens the same overlay as
  "header only". "bottom bar — Conferences current" and "more — expanded menu"
  removed.
- S-05 — tooltips removed, original layout restored.

## 2026-08-14 — Review round 7 + Figma handover

### Why fixes kept "not landing"

The live site was serving a **cached** `motion.css` and `app.js` while
`elements.css` was fresh — so el-11, el-22 and the dot animation showed the old
behaviour after a push that contained the fix. `tools/bump_assets.py` now stamps
every CSS and JS link with a content hash (`?v=1a2b3c4d`), so a changed file can
never be served from cache again. Run it before committing.

### Why the sidebar slid off screen

Two causes, both fixed:

1. `.stage` carried a 1280px floor. When a sheet was wider than the pane the
   *page* scrolled sideways and took the sticky sidebar with it.
2. `scrollIntoView` scrolls horizontally as well as vertically when the target
   is wider than the viewport. Anchor jumps now move the vertical axis only.

The stage is fully fluid: every fixed 1920 / 1440 / 1400 container is a
percentage with a max-width, padding uses `clamp()`, the nav bar wraps rather
than overflowing, and only `.m-frame` / `.tpl-frame` scroll internally.

### Fixes

- R-01 — same width as its neighbours (both fluid now).
- E-08 — e1 at rest, e2 on hover, with room in the grid for the shadow.
- S-05 — the existing W–L / PF / PA headers open tooltips; the extra tooltip
  added by mistake last round is gone.
- F-03m — the frame is 390 × 848, the iPhone 17 ratio. Search opens the E-11
  result list as an overlay under the header. More opens the menu above the
  bottom bar, which stays visible, and marks itself active. Close has double the
  vertical padding.

### Figma handover

- `figma/tokens.json` — 48 tokens in W3C DTCG format, for Figma's native
  variable import.
- `figma/AGENT-PROMPTS.md` — P1–P6 in English: three variable passes, the
  component-set prompt, a layer-rename pass, and the verification step.
- `figma/README.md` — full procedure and html.to.design import settings.
- `figma-export/` — 35 files, one element each, 2–45 KB, no page furniture.

### Data

`tools/snapshot.js` — paste into the console on the live Nations League site. It
walks the site's own routes, harvests the Redux store (Immutable, so `toJS()`),
merges the records and downloads one JSON. No API key needed. Verified against
the live site: the store is populated per route, which is why the walk is
necessary.

## 2026-08-13 — Review round 6

**Root cause of the broken flags.** `.flag-ring` drew its ring with a `border`
on a `box-sizing: border-box` element, so 4px came out of the content box. At
`flag-s` (20px) that is a fifth of the artwork, and the circular `overflow`
clip cut the rest. The ring is a `box-shadow` now, drawn outside the box, and
the flag keeps its full size. Context overrides use a `--ring` variable.

**Root cause of the unstable indicator.** Restarting a CSS *transition* depends
on a style flush landing between two frames — sometimes it did, sometimes the
bar jumped straight to full. Replaced with a keyframe animation restarted by
removing the class and forcing a reflow, which is deterministic. Both the
standalone el-22 and the C-03 carousel use it.

**gen_states.py** now indexes comma groups, so `.tabs-ghost .tab-hover,
.tab-ghost-hover { … }` is reachable as either selector. It previously keyed the
whole group as one string and silently skipped it.

### Fixes

- Sidebar — the active marker is white, not red.
- ctl-03 — the ghost variant hovers to `--action-ghost-bg`, lighter than the
  standalone strip.
- el-03 / el-30 / el-05 — the live dot is a bouncing basketball: it falls,
  squashes on contact, springs back.
- el-07 — the Live demo carries the legend under its table.
- F-02 — family links stay on one line, right aligned.
- F-03m — the phone frame is 420 tall instead of 720; search is a real control
  with the NavTab hover, opening a search bar under the header; More opens the
  menu above the bottom bar and marks itself active.
- F-05 — four columns spread across the content width with auto gaps.
- F-06 — the sponsor band is full bleed again; only its contents are inset.
- S-05 — pool headers carry the tooltip.
- R-01 / R-02 — same table width as the rest; every table with markers has its
  legend.
- E-08 — cards sit on e1 and lift to e2; the grid has room for the shadow.

## 2026-08-13 — Guideline site restructured

**Anchor navigation.** Each group is now one long page and the sidebar is its
table of contents: Foundations (11), Elements (35), Modules I · Frame &
Schedule (16), Modules II · Ranking, Entity & Content (22). Modules were split
in two to keep each page under ~470 KB. Scroll position drives the sidebar
highlight. Templates left the menu entirely — they are the prototype, linked
from the sidebar footer.

**Layout is fluid, not scaled.** The transform-scale preview and the breakpoint
buttons are gone. Fixed 1920 / 1440 widths are relaxed to percentages with a
1280 floor, so the sheets genuinely reflow with the window.

**Sidebar header** is the 3x3NL wordmark plus DESIGN SYSTEM on one line; the
Copy link button is gone.

### Fixes

- ctl-07 — the red Watch live button hovers to `#B80511`. The specimen already
  had `.wl-live.wl-hover`; the generator only mapped the generic `.wl-hover`.
- ctl-04 / el-11 — the input inside the painted container was drawing its own
  focus outline on top of the container's ring. On dark chrome the select had
  no fill layer, so its white ring had nothing to sit on; the scaffold is now
  added at init.
- el-05 — the live dot pulses (badge, Watch live, calendar, nav).
- el-08 — sortable header cells have hover and focus and are keyboard reachable.
- el-07 / S-01 / R-02 / R-03 — legend carries Q, S **and R · In the race**.
- el-11 — the trailing X clears the field.
- el-22 — the 8px cut on a 4px bar left hairlines at the corners; the cut is
  scaled to the bar. The fill reset is now flushed before the animation starts,
  which was the cause of the occasional jump straight to black.
- el-30 — day cells sit in their strip context at full size; selected is a
  filled black cell like el-03.
- Modules — `.m-block-full` pads its children by 240px for the 1920 bleed; the
  shell drops that, which was the excessive left margin.
- F-02 / F-05 / F-06 — full-bleed chrome fills the pane instead of being cut at
  1920.
- F-03m — sheet is 720 tall so the whole menu fits; the redundant heading is
  gone and Close is spaced like the rows below it.
- R-04 — flags were broken again: a markup script re-lowercased `viewBox` and
  `fix_svg_case.py` had not been re-run after it. It runs after every markup
  pass now.
- S-04 — home side reads name, code, flag; away side flag, code, name.
- E-08 — card sits on e1, lifts to e2 on hover.
- C-05 — share trigger hover restored.
- `gen_states.py` stripped no comments, so a rule directly after a comment block
  was keyed with the comment text and silently skipped.

## 2026-08-13 — Review round 4 + guideline site

### Why the same bugs kept coming back

Two of my own patches were silently doing nothing.

1. A `str.replace()` that did not match (the file had `box-shadow:inset`, the
   patch looked for `box-shadow: inset`) — so the C-02 / C-04 underline fix was
   never applied, twice.
2. A shell command chained with `&&` where an earlier `rm` failed on a
   permission error, so the heredoc that appended half of interactions.css
   never ran.

Every patch now asserts that it changed something and fails loudly if not.

### Structural change: generated state rules

`assets/interactions.css` is now **generated** by `tools/gen_states.py`. Each
`.live X:hover` rule copies the declarations of its specimen modifier class
verbatim, so a documented state and the live state cannot drift. This is what
caused the wrong Outline-button and WatchLive hovers: the hand-written rule
repainted the border layer where the specimen tints the fill. Hand-written
interaction moved to `assets/behaviour.css`.

### The bracket corner, third attempt

`.cutfill` is the first DOM child of every cut container, so
`.s06-side:first-of-type` matched *it*, never the first row. Replaced with an
adjacency selector.

### Fixes

- ctl-01 / ctl-07 / ctl-04 / el-11 — hover and focus now match the specimen.
- el-06 StopDots — the interactive dot adopts the Button Filled state set.
- el-07, S-01, R-02, T · Conference, T · Standings — el-09 Legend under the
  table, flush, no top border.
- el-16 Card — flat at rest, e2 shadow on hover.
- el-21 Tooltip — the arrow is held on the anchor and hides with the bubble
  (it sits *before* the bubble, so a sibling selector could never reach it).
- el-22 — all five bars animate through the set.
- el-30 CalendarStrip — day-cell states documented: default, hover, focus,
  selected, disabled.
- S-04 GameList — targeted `.c-away` / `.c-box`, the classes this markup
  actually uses; an earlier fix aimed at `.s04-team`, which does not exist.
- S-09 — the black and red segments overlap by 4px.
- C-03 — viewer controls reuse the documented icon button; `.lb-img` no longer
  forced to 3:2, which was pushing the photo over the modal header.
- F-03m — mobile "More" sheet built, grouped as Nations League / Info /
  Competition Family, matching the reference prototype.
- T · Home — the logo link is vertically centred again (an `align-self` I added
  last round was the cause); the Live now filter defaults to All.

### Step 2 — guideline site

`system/index.html`. Sidebar, search, deep-linkable hash URLs, viewport preview,
and a stage that scales a 1920 sheet to fit the pane. **98 blocks** split out of
the six sheets by `tools/split_blocks.py` into `system/blocks/`, with
`system/nav.json` driving the menu.

To edit: content lives in the block fragment, order and names in `nav.json`,
looks in `assets/*.css`. All single-file changes.

## 2026-08-13 — Review round 3

**Root cause of the dead Live demos.** Building a demo meant stripping the
forced-state classes off a specimen. `btn-primary-hover` was deleted whole —
so the variant `btn-primary` went with it and the clone was a bare `.btn` with
no styling and nothing to hover. Same for `wl-focus-live`, which survived the
strip (the suffix is in the middle) and pinned WatchLive permanently in focus.

Stripping now *maps* a state class back to its resting class instead of
deleting it, keeping the result only when it extends a class the element
already has. All 35 demos rebuilt. A handful also get an explicit source state
(ctl-01 and ctl-07 show all three variants, el-06 the interactive stop
selector, el-13 and el-14 the dismissible variants, el-23 four levels).

**Root cause of the missing corners.** A cut container paints its 45° corners
with its own background. Any child that fills edge to edge paints straight over
them — a collapsed accordion header, the first and last row of a bracket card,
a photo tile. Those children now carry the same cut sized to the inner radius
(`--ic`). This fixes el-07, S-01, S-06 and the C-03 viewer at once.

**Root cause of the wrong underlines.** `box-shadow: inset` follows the *box*,
so a headline in a block underlined the empty space after the text. Replaced
with `text-decoration` + offset everywhere, which follows the text.

**Root cause of the sliver photos.** `.car-slide` had a fixed width but the
default `flex-shrink: 1`, so doubling the slide count squeezed them into
portrait slivers. Slides, tiles, thumbnails and the viewer image are now
`flex: 0 0 auto` with a 3:2 ratio.

**Also fixed**

- el-11 / ctl-04 — focus lived on the inner `<input>`, so the painted container
  never matched `:focus-visible`. Now `:focus-within`.
- el-19 — the caret came from whichever specimen was cloned and could already
  point up. It is replaced at init with one known chevron; rotation alone
  expresses the state.
- el-22 — the progress bar snapped back to empty once the playhead moved past
  it. It now stays filled.
- el-13 / el-14 — clicking the X removes the chip.
- el-21 — the info anchor opens and closes the tooltip.
- el-23 — the current breadcrumb is not hoverable or clickable.
- el-30 / S-03 — selected day is filled with inverse text, like every other
  selected control. T · Home's 22nd now reads as selected.
- F-06 — sponsor and social marks have default, hover and focus states.
- S-04 — the away team reads name, code, flag; Box Score is centred on the row.
- R-02 — every table using Q / S / R markers carries the legend beneath it.
- E-11 — the search field is the width of the results; the dark skeleton pulses
  in chrome grey.
- C-03 viewer — download, share and close are real controls with states.
- T · Home — Advertising is a full-width section again, left-aligned and spaced
  like every other section. It sits after the split, so collapsing Live now does
  not move it as long as Qualification is the taller column.
- T · Conference — Conference standings and Games are both 1440 wide.

## 2026-08-13 — Review round 2

**Live demos now actually work.** The demo blocks cloned each component's
*default* state, which for a field, checkbox or disclosure row is a painted
`<div>` with nothing to operate. Two changes: the demo now clones the **richest**
state (so el-19 gets its body, el-28 its menu, ctl-04 its open select), and
`assets/app.js` gained real behaviour.

- ctl-04 — a real `<input>` in the field, plus a dark select that opens, selects
  and writes the value back to the trigger.
- ctl-05 — checkbox toggles.
- el-11 — real search `<input>`.
- el-19 — disclosure rows open and close.
- el-22 — a standalone CarouselIndicator runs its own auto-advance loop.
- el-28 — share menu opens from the trigger and closes on outside click.

**More stale cut-border rules found.** The round-1 merge only promoted the fixed
version when 02-elements had it. Rule corrected to "modern wins from any file",
which repaired five more: `.c02-card`, `.lb`, `.lb-nav`, `.car-btn-dis`,
`.s03-d` — the cause of the broken corners in C-02 NewsRail, the C-03 viewer and
the T · Stop bracket.

**Fixes**

- *el-18* — the assembled 390px bar had Home pushed out of line, from a stray
  `.darkbed` wrapper round-1 put inside the bar. Unwrapped; `tabbar-dark` now
  sits on the bar itself.
- *el-20 / T · Conferences* — `.lnk` no longer stretches, so the hover underline
  is the width of the link rather than the row.
- *R-01* — the Q / S legend moved out to sit flush under the R-02 table, no top
  border, zero spacing.
- *E-08* — the keyvisual artwork had an intrinsic pixel width, so it only looked
  full-bleed on the 240 and 180 cards where it overflowed. Now 100% at all sizes.
- *E-10* — list rows hover like table rows.
- *E-11 / T · Search* — results presented on the dark chrome surface, rows hover
  with `--chrome-hover` (same as el-18).
- *C-02 / C-04 / T · Home / T · News* — one shared news interaction: card hover
  repaints the cut-aware border, headline underlines to its own width.
- *C-03 / T · Home* — twice the photos, indicator extended to match. Pause works
  and the icon swaps to Play. Previous works (the specimen shows it disabled at
  position 0; the live carousel wraps).
- *C-04 / T · News* — category filter removed.
- *T · Home* — Advertising headline removed and the slot pinned inside the right
  column under Qualification, so collapsing Live now no longer moves it.
- *T · Standings* — table fills the 1440 content width.
- *T · Article* — category chip removed; Share button has a hover state.
- *Wording* — "Find your federation" renamed to **Find a team** everywhere, so
  the E-01 section header matches the footer link. Changed in the specimen
  sheets and in `design-system/` too, so a future html.to.design import does not
  reintroduce the old label.

## 2026-08-13 — Review round 1

**Interaction model reworked.** The 57 auto-generated `:hover` pairs from the
extraction were wrong in two ways: they made the specimen sheets react to the
pointer, and several of them targeted a container instead of the item inside it
(the whole nav bar lit up instead of one nav item). All 57 were removed.

- New `assets/interactions.css` — every interactive rule is scoped to `.live`.
  Specimen state rows are frozen; only `.live` blocks respond to the pointer.
- Correct targets derived from the markup, not from the class name:
  `.f03-i` not `.f03`, `.alpha-i` not `.alpha`, `.disc-head` not `.disc`,
  `.pag-i` not `.pag`, `.el02-seg` not `.el02`.
- **35 Live demo blocks** added, one under each element in 02-elements.
- Module and template frames are live; state rows labelled hover/focus/active
  stay static.

**Fixes**

- *Foundations 06* — `.bs-box` had lost `position:relative` in the merge, so
  `.cutfill` escaped its box and the branded gradient painted as a fill instead
  of a stroke. Restored.
- *SVG case* — HTML parsers lowercase attribute names and SVG is case-sensitive,
  so `viewBox` became `viewbox` and every flag, icon and logo broke. 2,612 names
  restored; `tools/fix_svg_case.py` added and `relink2.py` hardened.
- *el-02 GenderSwitch* — segments had no border at all, so hover read as a flat
  grey rectangle. They now use the cut-aware border, and hover tints the interior
  while keeping the 45° corner.
- *el-18 NavTab* — documented on the dark chrome bar it actually sits on. Hover
  surface changed from `--action-ghost-bg` to the new `--chrome-hover` (#2E2E2E).
- *el-19 DisclosureRow* — hover moved from the whole panel to the header only.
  Dark variant uses `--chrome-hover`.
- *el-25 AlphaIndex* — hover moved from the row to the individual letter.
- *el-26 Skeleton* — loading pulse added (1.6s, reduced-motion aware).
- *F-03 CompetitionNav* — hover moved from the bar to the nav item.
- *S-03 CalendarStrip* — base day-cell states declared: today, hover, focus,
  live, disabled.
- *S-05 Pools · S-06 Bracket · R-01 QualificationBoard · Standings table* —
  whole-row hover.
- *E-03 ConferenceGrid* — underline drawn with an inset shadow so it matches the
  text width instead of spanning the flex row.
- *E-09 FederationDirectory* — hover repaints the cut-aware border layer, so the
  colour change follows the 45° corner.
- *Season status* — branded stroke rotates (12s, `@property --bs-angle`).
- *Photos* — carousel works: slides translate, indicator fills over the dwell
  time, play/pause toggles, dots are clickable.
- *Live now* — accordions work; the first opens on load, the rest stay closed.

**New files:** `assets/interactions.css`, `assets/app.js`,
`tools/fix_svg_case.py`.

**Still to confirm visually:** *el-15 AutocompleteMenu* — the two-surface hover
could not be reproduced from the code alone. A screenshot of the hover row would
pin it down.

## 2026-08-13 — CSS extraction

Stylesheets lifted out of the six `design-system/*.html` specimen sheets into a
shared, hand-editable library.

- **898 selectors** analysed across the six sheets; 810 appeared in more than one.
- **72 conflicts** found. 66 were one issue: the cut-aware border technique
  (`--of` / `--n` / `.cutfill`) had been applied to `02-elements.html` but only
  partially propagated to the module and template sheets.
- Markup was checked and found **already consistent** — every element using a
  cut-border class already carried its `.cutfill` child. So the stale CSS meant
  **46 rules were rendering the 45° border incorrectly** in the module and
  template sheets. Merging fixed them.
- Remaining 6 conflicts resolved by hand: `:root` (union, 40 variables),
  `.t-h2` (28/32 → 32/36, foundations was stale), `.lbl`, and three doc-chrome
  rules that moved to `system/assets/docs.css`.
- **57 pseudo-class pairs** generated: every `.x-hover` / `.x-focus` / `.x-active`
  specimen class now also fires as `.x:hover` / `.x:focus-visible` / `.x:active`.
  The specimen sheets and real interaction run off the same code.
- Motion tokens and `motion.css` added (transitions, scroll reveal, view
  transitions, reduced-motion).

Files: `assets/tokens.css` `base.css` `elements.css` `modules.css` `motion.css`,
`system/assets/docs.css`. Relinked specimen sheets in `system/_check/` for
visual comparison against the originals.
