"""Regenerate js/watchorder.js from the MCU_Watch_Order.xlsx spreadsheet.

    python3 tools/build_watchorder.py path/to/MCU_Watch_Order.xlsx

The spreadsheet lists everything in release order, one row per film and
one row per episode (or one row per season, for shows released all at
once). This turns those rows into the "Everything" order on the Watch
Order page: runs of consecutive episodes from the same season collapse
into one segment, and every row is matched to a title id in js/data.js.

Titles in data.js that the spreadsheet doesn't have (the 1944 serial,
the 1970s CBS shows and TV movies, etc.) are merged in by date from
EXTRA_SEGMENTS below, and unreleased titles go on the end.

Needs openpyxl and node (to read js/data.js).
"""

import datetime
import json
import os
import re
import subprocess
import sys

import openpyxl

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Spreadsheet titles that don't exactly match a data.js title (or that
# match more than one), keyed by (spreadsheet title, release year).
FILM_IDS = {
    ("The Punisher", 1991): "punisher-1989",
    ("Captain America", 1992): "captain-america-1990",
    ("Spider-Man", 2002): "spider-man-2002",
    ("Daredevil", 2003): "daredevil-2003",
    ("Hulk", 2003): "hulk-2003",
    ("The Punisher", 2004): "punisher-2004",
    ("Fantastic Four", 2005): "fantastic-four-2005",
    ("Fantastic Four", 2015): "fant4stic",
    ("Agent Carter", 2013): "one-shot-agent-carter",
    ("Werewolf By Night", 2022): "werewolf-by-night",
    ("Fantastic Four: First Steps", 2025): "fantastic-four-first-steps",
}

SHOW_IDS = {
    "Mutant X": "mutant-x",
    "Blade": "blade-tv",
    "Agents of S.H.I.E.L.D.": "agents-of-shield",
    "Agent Carter": "agent-carter-tv",
    "WHIH Newsfront": "whih-newsfront",
    "Daredevil": "daredevil",
    "Jessica Jones": "jessica-jones",
    "Luke Cage": "luke-cage",
    "Iron Fist": "iron-fist",
    "The Defenders": "the-defenders",
    "The Punisher": "the-punisher-tv",
    "Legion": "legion",
    "Inhumans": "inhumans",
    "The Gifted": "the-gifted",
    "Runaways": "runaways",
    "Cloak & Dagger": "cloak-and-dagger",
    "The Daily Bugle": "daily-bugle",
    "Helstrom": "helstrom",
    "WandaVision": "wandavision",
    "The Falcon and the Winter Soldier": "falcon-winter-soldier",
    "Loki": "loki",
    "What If...?": "what-if",
    "Hawkeye": "hawkeye",
    "Moon Knight": "moon-knight",
    "Ms. Marvel": "ms-marvel",
    "I Am Groot": "i-am-groot",
    "She-Hulk: Attorney at Law": "she-hulk",
    "Secret Invasion": "secret-invasion",
    "Echo": "echo",
    "Agatha All Along": "agatha",
    "Your Friendly Neighbourhood Spider-Man": "friendly-neighborhood-spider-man",
    "Daredevil: Born Again": "daredevil-born-again",
    "Ironheart": "ironheart",
    "Eyes of Wakanda": "eyes-of-wakanda",
    "Marvel Zombies": "marvel-zombies",
    "Wonder Man": "wonder-man",
}

# Slingshot is an extra under Agents of S.H.I.E.L.D. in data.js.
EXTRA_SHOWS = {"Agents of S.H.I.E.L.D.: Slingshot": ("agents-of-shield", 0)}

# (date, segment) for data.js titles the spreadsheet doesn't list.
EXTRA_SEGMENTS = [
    ("1944-03-05", {"id": "captain-america-1944"}),
    ("1977-09-14", {"id": "amazing-spider-man-tv", "x": 0}),
    ("1977-11-04", {"id": "incredible-hulk-tv", "x": 0}),
    ("1977-11-27", {"id": "incredible-hulk-tv", "x": 1}),
    ("1978-03-10", {"id": "incredible-hulk-tv", "s": 0}),
    ("1978-04-05", {"id": "amazing-spider-man-tv", "s": 0}),
    ("1978-05-17", {"id": "spider-man-toei", "s": 0}),
    ("1978-09-05", {"id": "amazing-spider-man-tv", "s": 1}),
    ("1978-09-06", {"id": "dr-strange-1978"}),
    ("1978-09-22", {"id": "incredible-hulk-tv", "s": 1}),
    ("1979-01-19", {"id": "captain-america-1979"}),
    ("1979-09-21", {"id": "incredible-hulk-tv", "s": 2}),
    ("1979-11-23", {"id": "captain-america-ii-1979"}),
    ("1980-11-07", {"id": "incredible-hulk-tv", "s": 3}),
    ("1981-10-02", {"id": "incredible-hulk-tv", "s": 4}),
    ("1988-05-22", {"id": "incredible-hulk-tv", "x": 2}),
    ("1989-05-07", {"id": "incredible-hulk-tv", "x": 3}),
    ("1990-02-18", {"id": "incredible-hulk-tv", "x": 4}),
    ("1994-06-01", {"id": "fantastic-four-1994"}),
]

# Released after the spreadsheet's last row, or not out yet.
TAIL_SEGMENTS = [
    {"id": "brand-new-day"},
    {"id": "visionquest"},
    {"id": "avengers-doomsday"},
    {"id": "avengers-secret-wars"},
]


def load_titles():
    js = (
        "const fs=require('fs');"
        "eval(fs.readFileSync(process.argv[1],'utf8')+';globalThis.T=TITLES');"
        "process.stdout.write(JSON.stringify(T));"
    )
    out = subprocess.check_output(["node", "-e", js, os.path.join(ROOT, "js", "data.js")])
    return {t["id"]: t for t in json.loads(out)}


def norm(s):
    return re.sub(r"\s+", " ", str(s)).strip()


def main(xlsx_path):
    titles = load_titles()
    by_title_year = {}
    for t in titles.values():
        by_title_year.setdefault((t["title"], t["year"]), []).append(t["id"])

    ws = openpyxl.load_workbook(xlsx_path, data_only=True).active
    segments = []  # (date, segment)
    problems = []

    for row in ws.iter_rows(min_row=2, values_only=True):
        if not row or not row[0]:
            continue
        name = norm(row[0])
        date = row[1]
        date_s = date.strftime("%Y-%m-%d") if isinstance(date, datetime.datetime) else str(date)[:10]
        total = row[2]

        ep = re.match(r"^(.*?)\s*Ep\.\s*(\d+)$", name)
        base = ep.group(1) if ep else name
        season_m = re.match(r"^(.*?)\s*\(\s*Season (\d+)\)$", base)
        show = season_m.group(1) if season_m else base
        s_idx = int(season_m.group(2)) - 1 if season_m else 0

        if ep or season_m or (total and show in SHOW_IDS):
            if show not in SHOW_IDS:
                problems.append("unknown show: " + name)
                continue
            tid = SHOW_IDS[show]
            seasons = titles[tid].get("seasons") or []
            if s_idx >= len(seasons):
                problems.append("no season %d for %s" % (s_idx + 1, tid))
                continue
            a = b = int(ep.group(2)) if ep else None
            if not ep:
                a, b = 1, seasons[s_idx]
                if total and int(total) != b:
                    problems.append("%s: spreadsheet says %s episodes, data.js %s" % (name, total, b))
            prev = segments[-1][1] if segments else None
            if (
                prev
                and prev.get("id") == tid
                and prev.get("s") == s_idx
                and "x" not in prev
                and prev.get("b") == a - 1
            ):
                prev["b"] = b
            else:
                segments.append((date_s, {"id": tid, "s": s_idx, "a": a, "b": b}))
            continue

        if name in EXTRA_SHOWS:
            tid, x = EXTRA_SHOWS[name]
            count = titles[tid]["extras"][x]["seasons"][0]
            segments.append((date_s, {"id": tid, "x": x, "s": 0, "a": 1, "b": count}))
            continue

        year = int(date_s[:4])
        tid = FILM_IDS.get((name, year))
        if not tid:
            ids = by_title_year.get((name, year)) or [
                t["id"] for t in titles.values() if t["title"] == name and abs(t["year"] - year) <= 1
            ]
            if len(ids) != 1:
                problems.append("can't match film: %s (%d) -> %s" % (name, year, ids))
                continue
            tid = ids[0]
        segments.append((date_s, {"id": tid}))

    # Merge in the extra segments by date, ahead of the first later row.
    for date_s, seg in sorted(EXTRA_SEGMENTS, key=lambda e: e[0], reverse=True):
        idx = next((i for i, (d, _) in enumerate(segments) if d > date_s), len(segments))
        segments.insert(idx, (date_s, seg))
    for date_s, seg in segments:
        seg["y"] = int(date_s[:4])
    order = [seg for _, seg in segments] + TAIL_SEGMENTS

    # Every title should appear somewhere in the order.
    used = {seg["id"] for seg in order}
    for tid in titles:
        if tid not in used:
            problems.append("title not in watch order: " + tid)

    if problems:
        print("\n".join(problems), file=sys.stderr)
        sys.exit(1)

    lines = [
        "// GENERATED by tools/build_watchorder.py from MCU_Watch_Order.xlsx —",
        "// edit the spreadsheet (or that script's EXTRA_SEGMENTS) and rerun it",
        "// rather than editing this file by hand.",
        "//",
        "// The \"Everything\" watch order: every film, short and episode in",
        "// release order, interleaved by air date. Each segment is",
        "//   { id }                  a single-watch title",
        "//   { id, x }               a single-watch extra of title id",
        "//   { id, s, a?, b? }       season s (0-based) of title id, episodes",
        "//                           a..b (the whole season when omitted)",
        "//   { id, x, s, a, b }      the same, for an extra with seasons",
        "// plus y, the year that segment came out (titles' own year when absent).",
        "",
        "const WATCH_ORDER = [",
    ]
    for seg in order:
        lines.append("  " + json.dumps(seg, separators=(", ", ": ")) + ",")
    lines.append("];")
    lines.append("")
    with open(os.path.join(ROOT, "js", "watchorder.js"), "w") as f:
        f.write("\n".join(lines))
    print("wrote %d segments" % len(order))


if __name__ == "__main__":
    main(sys.argv[1])
