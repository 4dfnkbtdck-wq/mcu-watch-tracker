// Shared helpers for reading MCU Watch Tracker data and localStorage
// state, used by all three views (js/master.js, js/app.js, js/order.js)
// — load this after the data files and before any of them.

const STORAGE_SEEN = "mcu-tracker:seen";

// Every checkmark lives in one flat map in STORAGE_SEEN:
//   <id>                       a film/special (no seasons) seen
//   <id>:s<season>:e<episode>  one episode of a series
//   <id>:x<extra>              a flat extra (pilot, TV movie)
//   <id>:x<extra>:s<s>:e<e>    one episode of an extra with seasons
// Season indexes are 0-based, episode numbers 1-based.

function loadJson(key, fallback) {
  try {
    const v = JSON.parse(localStorage.getItem(key));
    return v == null ? fallback : v;
  } catch (e) {
    return fallback;
  }
}

// The one checkmark map every view reads and writes. Views are all on
// one page, so they share this object directly; saveSeen() persists it
// and bumps seenVersion so a hidden view knows to redraw when shown.
const seen = loadJson(STORAGE_SEEN, {});
let seenVersion = 0;

function saveSeen() {
  localStorage.setItem(STORAGE_SEEN, JSON.stringify(seen));
  seenVersion++;
}

// Each view script registers itself here as { render(), ... } — see
// js/main.js, which switches between them.
const Views = {};

function episodeKey(prefix, seasonIdx, epNum) {
  return prefix + ":s" + seasonIdx + ":e" + epNum;
}

function extraKey(item, extraIdx) {
  return item.id + ":x" + extraIdx;
}

function getCategory(id) {
  return CATEGORIES.find((c) => c.id === id) || CATEGORIES[0];
}

function titlesIn(categoryId) {
  return TITLES.filter((t) => t.cat === categoryId);
}

function isMcu(item) {
  return getCategory(item.cat).mcu === true;
}

// How many of a seasons array's episodes are total / seen, where every
// episode key starts with prefix.
function seasonStats(seasons, prefix, seen) {
  let total = 0;
  let seenCount = 0;
  seasons.forEach((count, sIdx) => {
    for (let e = 1; e <= count; e++) {
      total++;
      if (seen[episodeKey(prefix, sIdx, e)]) seenCount++;
    }
  });
  return { total, seen: seenCount };
}

// Watched state of a title's main content (extras are tracked, and
// shown, separately). Returns { seen, partial, stats } — stats is the
// episode count for series, null for a single watch.
function titleState(item, seen) {
  if (item.seasons) {
    const stats = seasonStats(item.seasons, item.id, seen);
    const all = stats.total > 0 && stats.seen === stats.total;
    return { seen: all, partial: stats.seen > 0 && !all, stats };
  }
  return { seen: !!seen[item.id], partial: false, stats: null };
}

// Marks every episode (or the single watch) of a title's main content.
function setTitleSeen(item, seen, value) {
  if (item.seasons) {
    item.seasons.forEach((count, sIdx) => {
      for (let e = 1; e <= count; e++) {
        const key = episodeKey(item.id, sIdx, e);
        if (value) seen[key] = true;
        else delete seen[key];
      }
    });
  } else if (value) {
    seen[item.id] = true;
  } else {
    delete seen[item.id];
  }
}

// The first not-yet-seen episode, in watch order. Returns
// { season, episode } (1-indexed, for display) or null.
function findNextEpisode(seasons, prefix, seen) {
  for (let sIdx = 0; sIdx < seasons.length; sIdx++) {
    for (let e = 1; e <= seasons[sIdx]; e++) {
      if (!seen[episodeKey(prefix, sIdx, e)]) return { season: sIdx + 1, episode: e };
    }
  }
  return null;
}

function compareRelease(a, b) {
  if (a.date && b.date) return a.date < b.date ? -1 : a.date > b.date ? 1 : 0;
  return a.year - b.year;
}

function compareTimeline(a, b) {
  return a.t - b.t;
}

function typeLabel(item) {
  if (item.kind) return item.kind;
  if (item.seasons) return "Series";
  return "Film";
}

function checkIconSvg() {
  return '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 13l4 4L19 7" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
}

function chevronSvg() {
  return '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
}
