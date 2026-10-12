# MCU Watch Tracker

A small, dependency-free web app for tracking everything Marvel: every
**MCU film**, **Disney+ series** (animated ones included), and
**special, short, or web series**, plus the live-action **Marvel
Television** shows (ABC, Netflix, Hulu, Freeform, FX, Fox) and the
**non-MCU films** (Fox's X-Men and Fantastic Four, Sony's Spider-Man
and Spider-Man Universe, and the earlier one-offs), from Howard the
Duck (1986) on.

The list and the Master List order come from the
`MCU_Watch_Order.xlsx` spreadsheet, plus the titles released since it
was last updated (Spider-Man: Brand New Day, The Punisher: One Last
Kill) and the announced upcoming ones.

## Running it

No build step, no install. Just open `index.html` in a browser, or serve
the folder statically:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

It also works as-is on GitHub Pages (Settings → Pages → deploy from the
`main` branch, root folder).

## Installing it on your phone

It's a PWA, so there's no App Store app, but it installs and behaves
like one:

- **iPhone (Safari)**: open the site, tap Share, then **Add to Home
  Screen**.
- **Android (Chrome)**: open the site, tap the ⋮ menu, then **Add to
  Home screen** / **Install app**.

Once installed it opens full-screen with its own icon, and a service
worker caches the app so it keeps working with no signal.

## Using it

The app has three tabs along the bottom. They all live on one page, so
switching is instant and each tab remembers where you'd scrolled to;
tapping the tab you're already on scrolls back to the top.

**Master List** (the home screen) works like the spreadsheet: every
film, short, and TV episode, MCU or not, one row each, in release
order, numbered, with its release date, grouped under year headings.

- Tap a row to check it off. Tap a row's **number** to mark everything
  up to that point as watched (handy when you're starting out).
- **Everything / MCU / Non-MCU** filters the list.
- The **Up Next** card shows the first thing you haven't watched; tap
  it to jump there.
- **Hide Watched** trims the list down to what's left, and **Search**
  finds a title.

**By Title** lists each film and show once, split into the
spreadsheet's Type categories: **Film / TV Series / Short Film / TV
Special / Digital Series / NCU Film / NCU TV Series** ("NCU" = not part
of the MCU).

- Tap a series to expand it into seasons and episodes. Tap an episode
  number to check it off, or a season header to check off (or clear)
  the whole season.
- Some classic shows also list their pilot movies, reunion TV movies,
  and web spin-offs inside the expanded panel.
- **Release Order / Timeline Order** (on the tabs that are all Marvel
  Studios titles) flips between release and story order; elsewhere it's
  **Oldest / Newest First**.
- **Search** matches titles, years, phases ("phase 3"), and studios or
  networks ("netflix", "fox x-men").
- **Mark All Seen / Clear All** apply to the current tab.

**MCU Order** is just the Marvel Studios titles, one row per film or
series, in **release** or **timeline** order, with its own Up Next
card. Tapping a series opens it on By Title, expanded.

All three tabs share the same checkmarks: an episode checked off in
one place is checked off everywhere.

Upcoming titles (Avengers: Doomsday, VisionQuest, Avengers: Secret
Wars) are listed with their release window but can't be checked off
yet and don't count toward progress.

Nothing is synced anywhere. Checkmarks live only in the browser you
made them in (`localStorage`).

## Editing the list

Titles are in `js/data.js`: one `TITLES` array, with a comment at the
top explaining each field. Add a title by adding an object; fix an
episode count by editing its `seasons` array. Never change an existing
title's `id`, because that's what its checkmarks are saved under.

The Master List in `js/watchorder.js` is generated from the
spreadsheet. After editing the spreadsheet (or adding a title to
`data.js`), regenerate it:

```bash
pip install openpyxl
python3 tools/build_watchorder.py path/to/MCU_Watch_Order.xlsx
```

The script matches every spreadsheet row to a title in `data.js` and
refuses to write anything if a row doesn't match or a title is missing
from the list, listing what needs fixing (usually a new entry in its
`FILM_IDS` / `SHOW_IDS` maps). Film release dates come from `data.js`
where it has them; spreadsheet typos are corrected in its `DATE_FIXES`.

After any change to CSS or JS, bump the `?v=` numbers in `index.html`
and the matching entries and `CACHE_VERSION` in `sw.js`, or phones with
the app installed may keep the old version.
