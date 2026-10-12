"""Regenerate js/watchorder.js (the Master List) from MCU_Watch_Order.xlsx.

    python3 tools/build_watchorder.py path/to/MCU_Watch_Order.xlsx

The spreadsheet lists everything in release order, one row per film and
one row per episode (or one row per season, for shows released all at
once). This turns it into the Master List: one row per film, short and
episode, each matched to a title id in js/data.js and carrying its
release date. Whole-season rows are expanded to one row per episode
(all on the season's release date).

Titles in data.js that the spreadsheet doesn't have are merged in from
EXTRA_SEGMENTS below (by date), and unreleased titles go on the end.

The final list is sorted by date (keeping the spreadsheet's order for
ties). Film dates come from data.js where it has one (the US release
date), then DATE_FIXES, then the spreadsheet.

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
    ("2026-05-12", {"id": "punisher-one-last-kill"}),
    ("2026-10-13", {"id": "visionquest", "s": 0, "e": 1}),
    ("2026-10-13", {"id": "visionquest", "s": 0, "e": 2}),
    ("2026-10-20", {"id": "visionquest", "s": 0, "e": 3}),
    ("2026-10-20", {"id": "visionquest", "s": 0, "e": 4}),
    ("2026-10-27", {"id": "visionquest", "s": 0, "e": 5}),
    ("2026-10-27", {"id": "visionquest", "s": 0, "e": 6}),
    ("2026-11-03", {"id": "visionquest", "s": 0, "e": 7}),
    ("2026-11-10", {"id": "visionquest", "s": 0, "e": 8}),
]

# Corrections to spreadsheet dates: film id -> date, or exact
# spreadsheet title -> date for an episode row.
DATE_FIXES = {
    "venom-last-dance": "2024-10-25",
    # Typed as 2925 in the spreadsheet.
    "Your Friendly Neighbourhood Spider-Man (Season 1) Ep. 6": "2025-02-12",
    "Your Friendly Neighbourhood Spider-Man (Season 1) Ep. 7": "2025-02-12",
    "Your Friendly Neighbourhood Spider-Man (Season 1) Ep. 8": "2025-02-12",
}

# Released after the spreadsheet's last row, or not out yet.
TAIL_SEGMENTS = [
    {"id": "brand-new-day"},
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
    rows = []  # (date, row)
    problems = []

    for sheet_row in ws.iter_rows(min_row=2, values_only=True):
        if not sheet_row or not sheet_row[0]:
            continue
        name = norm(sheet_row[0])
        date = sheet_row[1]
        date_s = date.strftime("%Y-%m-%d") if isinstance(date, datetime.datetime) else str(date)[:10]
        date_s = DATE_FIXES.get(name, date_s)
        total = sheet_row[2]

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
            if ep:
                episodes = [int(ep.group(2))]
            else:
                if total and int(total) != seasons[s_idx]:
                    problems.append("%s: spreadsheet says %s episodes, data.js %s" % (name, total, seasons[s_idx]))
                episodes = range(1, seasons[s_idx] + 1)
            for e in episodes:
                rows.append((date_s, {"id": tid, "s": s_idx, "e": e}))
            continue

        if name in EXTRA_SHOWS:
            tid, x = EXTRA_SHOWS[name]
            for e in range(1, titles[tid]["extras"][x]["seasons"][0] + 1):
                rows.append((date_s, {"id": tid, "x": x, "s": 0, "e": e}))
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
        date_s = titles[tid].get("date") or DATE_FIXES.get(tid, date_s)
        rows.append((date_s, {"id": tid}))

    rows += EXTRA_SEGMENTS
    rows += [(titles[seg["id"]]["date"], seg) for seg in TAIL_SEGMENTS]
    rows.sort(key=lambda r: r[0])  # stable: ties keep spreadsheet order
    for date_s, row in rows:
        row["d"] = date_s

    # Every title should appear somewhere, and every episode exactly once.
    seen_rows = set()
    for _, row in rows:
        key = json.dumps(row, sort_keys=True).replace(row["d"], "")
        if key in seen_rows:
            problems.append("duplicate row: " + key)
        seen_rows.add(key)
    used = {row["id"] for _, row in rows}
    for tid in titles:
        if tid not in used:
            problems.append("title not in master list: " + tid)

    if problems:
        print("\n".join(problems), file=sys.stderr)
        sys.exit(1)

    lines = [
        "// GENERATED by tools/build_watchorder.py from MCU_Watch_Order.xlsx —",
        "// edit the spreadsheet (or that script's EXTRA_SEGMENTS / DATE_FIXES)",
        "// and rerun it rather than editing this file by hand.",
        "//",
        "// The Master List: every film, short and episode in release order.",
        "// Each row is",
        "//   { id, d }            a single-watch title, released on date d",
        "//   { id, x, d }         a single-watch extra of title id",
        "//   { id, s, e, d }      episode e of season s (0-based) of title id",
        "//   { id, x, s, e, d }   the same, for an extra with seasons",
        "//   { id, s, d }         a whole season (older shows only)",
        "",
        "const MASTER_LIST = [",
    ]
    for _, row in rows:
        lines.append("  " + json.dumps(row, separators=(",", ":")) + ",")
    lines.append("];")
    lines.append("")
    with open(os.path.join(ROOT, "js", "watchorder.js"), "w") as f:
        f.write("\n".join(lines))
    print("wrote %d rows" % len(rows))


if __name__ == "__main__":
    main(sys.argv[1])
