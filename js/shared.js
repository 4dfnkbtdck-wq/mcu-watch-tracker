// Shared helpers for the Master List (js/master.js) — load this after
// the data files (js/data.js, js/watchorder.js) and before master.js.

const STORAGE_SEEN = "mcu-tracker:seen";

// Every checkmark lives in one flat map in STORAGE_SEEN:
//   <id>                       a film/special (no seasons) seen
//   <id>:s<season>:e<episode>  one episode of a series
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

const seen = loadJson(STORAGE_SEEN, {});

function episodeKey(prefix, seasonIdx, epNum) {
  return prefix + ":s" + seasonIdx + ":e" + epNum;
}

function extraKey(item, extraIdx) {
  return item.id + ":x" + extraIdx;
}

function getCategory(id) {
  return CATEGORIES.find((c) => c.id === id) || CATEGORIES[0];
}

// Today's local date as YYYY-MM-DD. Anything dated after it isn't out yet.
const TODAY = (function () {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
})();

const DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

function formatDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return DATE_FORMAT.format(new Date(Date.UTC(y, m - 1, d)));
}

function checkIconSvg() {
  return '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 13l4 4L19 7" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
}
