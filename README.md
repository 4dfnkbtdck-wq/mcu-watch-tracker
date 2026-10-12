# MCU Watch Tracker

A small, dependency-free web app for tracking everything Marvel in
live action: every **MCU film**, **Disney+ series**, and **special or
short**, plus the **Marvel Television** shows (ABC, Netflix, Hulu,
Freeform, FX, Fox, and the classic CBS series) and the **non-MCU
films** (Fox's X-Men and Fantastic Four, Sony's Spider-Man and
Spider-Man Universe, the early one-offs, and the TV movies). Animated
titles are left out.

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

1. Switch between **Films / Series / Specials / Marvel TV / Legacy**
   with the segmented control at the top.
2. Tap the circle on a row to check it off. Tap a series to expand it
   into seasons and episodes: tap an episode number to check it off, or
   a season header to check off (or clear) the whole season. The circle
   shows a dash while you're partway through a show.
3. Some classic shows also list their pilot movies, reunion TV movies,
   and web spin-offs inside the expanded panel, checked off separately.
4. **Release Order / Timeline Order** (on the MCU tabs) flips between
   release order and in-universe story order. On the other tabs it's
   **Oldest First / Newest First**.
5. **Search** matches titles, years, phases ("phase 3"), and studios or
   networks ("netflix", "fox x-men").
6. **Mark All Seen / Clear All** apply to the current tab (after a
   confirmation).
7. **Watch Order** (top-right link) is the whole MCU in one list (films,
   series, and specials together) in release or timeline order, with an
   **Up Next** card showing the first thing you haven't watched (and the
   next episode, for a show you're partway through). **Hide Watched**
   trims the list down to what's left. Tapping a series there opens it
   on the main page, expanded.

Upcoming titles (Avengers: Doomsday, VisionQuest, Avengers: Secret
Wars) are listed with their release window but can't be checked off
yet and don't count toward progress.

Nothing is synced anywhere. Checkmarks live only in the browser you
made them in (`localStorage`).

## Editing the list

Everything is in `js/data.js`: one `TITLES` array, with a comment at the
top explaining each field. Add a title by adding an object; fix an
episode count by editing its `seasons` array. Never change an existing
title's `id`, because that's what its checkmarks are saved under.

After any change to CSS or JS, bump the `?v=` numbers in both HTML pages
and the matching entries and `CACHE_VERSION` in `sw.js`, or phones with
the app installed may keep the old version.
