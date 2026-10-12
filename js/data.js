// MCU Watch Tracker — title data
//
// Everything Marvel in live action: the Marvel Studios films, Disney+
// series and specials (the MCU proper), the Marvel Television shows
// (ABC, Netflix, Hulu, Freeform, FX, Fox and the older CBS/syndicated
// series), and every non-MCU live-action film (Fox's X-Men and
// Fantastic Four, Sony's Spider-Man and Spider-Man Universe, the
// pre-2008 one-offs, and the TV movies). The animated Marvel Studios
// series are included (they're in the MCU); non-MCU animation isn't.
//
// Cross-checked against the user's own MCU_Watch_Order.xlsx, which is
// also what js/watchorder.js (the "Everything" watch order) is
// generated from.
//
// Each title:
//   id       unique, stable — it's the localStorage key, so never
//            rename one once it ships or people lose their checkmarks
//   cat      which tab it lives on (see CATEGORIES)
//   title    display title
//   year     release year
//   date     US release date (MCU titles only) — orders the combined
//            Watch Order list across films, series and specials
//   t        MCU in-universe timeline position (MCU titles only).
//            Series are placed by their first season. Decimals slot a
//            title between two others without renumbering.
//   phase    MCU phase (MCU titles only)
//   seasons  episode counts, one entry per season — makes the row
//            expandable into a season/episode checklist
//   extras   tie-in pilots, TV movies and web spin-offs, checked off
//            separately: { title, year, seasons?, after?, note? } —
//            "after" is the 0-based season it's listed after when the
//            show is expanded (-1 = before season 1; default: the end)
//   group    studio / network / franchise label shown under the title
//   kind     "Short", "Special", "Digital Series" or "Animated"
//   upcoming display string for unreleased titles; they're shown but
//            can't be checked off and don't count toward progress
//   note     extra context shown under the row
//
// Within each tab, titles are listed in release order — the "Oldest
// First" / "Release Order" sort is just this array order.
//
// Corrections are just edits to the array below.

// The By Title tabs, matching the "Type" column of the spreadsheet.
// "mcu" marks a category as MCU for the Master List's MCU / Non-MCU
// filter (a title can override it with its own mcu: false).
const CATEGORIES = [
  {
    id: "film",
    name: "Films",
    short: "Film",
    mcu: true,
  },
  {
    id: "tvseries",
    name: "TV Series",
    short: "TV Series",
    mcu: true,
    note: "Marvel Studios' Disney+ series (animated ones included), plus the ABC, Netflix, Hulu and Freeform shows. Tap a show to check off individual episodes.",
  },
  {
    id: "short",
    name: "Short Films",
    short: "Short Film",
    mcu: true,
    note: "The Marvel One-Shots, the Team Thor mockumentaries, and other shorts.",
  },
  {
    id: "special",
    name: "TV Specials",
    short: "TV Special",
    mcu: true,
    note: "Marvel Studios and Marvel Television Special Presentations.",
  },
  {
    id: "digital",
    name: "Digital Series",
    short: "Digital Series",
    mcu: true,
    note: "In-universe web series. (Agents of S.H.I.E.L.D.: Slingshot is under Agents of S.H.I.E.L.D. on the TV Series tab.)",
  },
  {
    id: "ncufilm",
    name: "NCU Films",
    short: "NCU Film",
    note: "Non-MCU live-action Marvel films: the early one-offs, Fox's X-Men and Fantastic Four, Sony's Spider-Man and Spider-Man Universe films, and made-for-TV movies.",
  },
  {
    id: "ncutv",
    name: "NCU TV Series",
    short: "NCU TV Series",
    note: "Non-MCU live-action Marvel shows: Fox and FX's X-Men shows, Mutant X, Blade, and the classic CBS and Japanese series.",
  },
];

const TITLES = [
  // ---------- MCU Films ----------
  { id: "iron-man", cat: "film", title: "Iron Man", year: 2008, date: "2008-05-02", phase: 1, t: 4 },
  { id: "incredible-hulk", cat: "film", title: "The Incredible Hulk", year: 2008, date: "2008-06-13", phase: 1, t: 6 },
  { id: "iron-man-2", cat: "film", title: "Iron Man 2", year: 2010, date: "2010-05-07", phase: 1, t: 5 },
  { id: "thor", cat: "film", title: "Thor", year: 2011, date: "2011-05-06", phase: 1, t: 9 },
  { id: "captain-america-tfa", cat: "film", title: "Captain America: The First Avenger", year: 2011, date: "2011-07-22", phase: 1, t: 1 },
  { id: "avengers", cat: "film", title: "The Avengers", year: 2012, date: "2012-05-04", phase: 1, t: 10 },
  { id: "iron-man-3", cat: "film", title: "Iron Man 3", year: 2013, date: "2013-05-03", phase: 2, t: 13 },
  { id: "thor-dark-world", cat: "film", title: "Thor: The Dark World", year: 2013, date: "2013-11-08", phase: 2, t: 12 },
  { id: "captain-america-tws", cat: "film", title: "Captain America: The Winter Soldier", year: 2014, date: "2014-04-04", phase: 2, t: 15 },
  { id: "guardians", cat: "film", title: "Guardians of the Galaxy", year: 2014, date: "2014-08-01", phase: 2, t: 16 },
  { id: "age-of-ultron", cat: "film", title: "Avengers: Age of Ultron", year: 2015, date: "2015-05-01", phase: 2, t: 18 },
  { id: "ant-man", cat: "film", title: "Ant-Man", year: 2015, date: "2015-07-17", phase: 2, t: 19 },
  { id: "civil-war", cat: "film", title: "Captain America: Civil War", year: 2016, date: "2016-05-06", phase: 3, t: 20 },
  { id: "doctor-strange", cat: "film", title: "Doctor Strange", year: 2016, date: "2016-11-04", phase: 3, t: 24 },
  { id: "guardians-2", cat: "film", title: "Guardians of the Galaxy Vol. 2", year: 2017, date: "2017-05-05", phase: 3, t: 17 },
  { id: "homecoming", cat: "film", title: "Spider-Man: Homecoming", year: 2017, date: "2017-07-07", phase: 3, t: 23 },
  { id: "ragnarok", cat: "film", title: "Thor: Ragnarok", year: 2017, date: "2017-11-03", phase: 3, t: 27 },
  { id: "black-panther", cat: "film", title: "Black Panther", year: 2018, date: "2018-02-16", phase: 3, t: 22 },
  { id: "infinity-war", cat: "film", title: "Avengers: Infinity War", year: 2018, date: "2018-04-27", phase: 3, t: 30 },
  { id: "ant-man-wasp", cat: "film", title: "Ant-Man and the Wasp", year: 2018, date: "2018-07-06", phase: 3, t: 29 },
  { id: "captain-marvel", cat: "film", title: "Captain Marvel", year: 2019, date: "2019-03-08", phase: 3, t: 3 },
  { id: "endgame", cat: "film", title: "Avengers: Endgame", year: 2019, date: "2019-04-26", phase: 3, t: 31 },
  { id: "far-from-home", cat: "film", title: "Spider-Man: Far From Home", year: 2019, date: "2019-07-02", phase: 3, t: 36 },
  { id: "black-widow", cat: "film", title: "Black Widow", year: 2021, date: "2021-07-09", phase: 4, t: 21 },
  { id: "shang-chi", cat: "film", title: "Shang-Chi and the Legend of the Ten Rings", year: 2021, date: "2021-09-03", phase: 4, t: 34 },
  { id: "eternals", cat: "film", title: "Eternals", year: 2021, date: "2021-11-05", phase: 4, t: 37 },
  { id: "no-way-home", cat: "film", title: "Spider-Man: No Way Home", year: 2021, date: "2021-12-17", phase: 4, t: 38 },
  { id: "multiverse-of-madness", cat: "film", title: "Doctor Strange in the Multiverse of Madness", year: 2022, date: "2022-05-06", phase: 4, t: 39 },
  { id: "love-and-thunder", cat: "film", title: "Thor: Love and Thunder", year: 2022, date: "2022-07-08", phase: 4, t: 46 },
  { id: "wakanda-forever", cat: "film", title: "Black Panther: Wakanda Forever", year: 2022, date: "2022-11-11", phase: 4, t: 42 },
  { id: "quantumania", cat: "film", title: "Ant-Man and the Wasp: Quantumania", year: 2023, date: "2023-02-17", phase: 5, t: 49 },
  { id: "guardians-3", cat: "film", title: "Guardians of the Galaxy Vol. 3", year: 2023, date: "2023-05-05", phase: 5, t: 50 },
  { id: "the-marvels", cat: "film", title: "The Marvels", year: 2023, date: "2023-11-10", phase: 5, t: 52 },
  { id: "deadpool-wolverine", cat: "film", title: "Deadpool & Wolverine", year: 2024, date: "2024-07-26", phase: 5, t: 53 },
  { id: "brave-new-world", cat: "film", title: "Captain America: Brave New World", year: 2025, date: "2025-02-14", phase: 5, t: 55 },
  { id: "thunderbolts", cat: "film", title: "Thunderbolts*", year: 2025, date: "2025-05-02", phase: 5, t: 57 },
  { id: "fantastic-four-first-steps", cat: "film", title: "The Fantastic Four: First Steps", year: 2025, date: "2025-07-25", phase: 6, t: 61, note: "Set on Earth-828, a separate universe — listed late in timeline order since it leads into Avengers: Doomsday." },
  { id: "brand-new-day", cat: "film", title: "Spider-Man: Brand New Day", year: 2026, date: "2026-07-31", phase: 6, t: 60 },
  { id: "avengers-doomsday", cat: "film", title: "Avengers: Doomsday", year: 2026, date: "2026-12-18", phase: 6, t: 63, upcoming: "In theaters Dec 18, 2026" },
  { id: "avengers-secret-wars", cat: "film", title: "Avengers: Secret Wars", year: 2027, date: "2027-12-17", phase: 6, t: 64, upcoming: "In theaters Dec 17, 2027" },

  // ---------- MCU Series (Disney+) ----------
  { id: "eyes-of-wakanda", cat: "tvseries", kind: "Animated", title: "Eyes of Wakanda", year: 2025, date: "2025-08-01", phase: 6, t: 0.5, seasons: [4], note: "Spans centuries of Wakandan history, so it opens the timeline." },
  { id: "wandavision", cat: "tvseries", title: "WandaVision", year: 2021, date: "2021-01-15", phase: 4, t: 33, seasons: [9] },
  { id: "falcon-winter-soldier", cat: "tvseries", title: "The Falcon and the Winter Soldier", year: 2021, date: "2021-03-19", phase: 4, t: 35, seasons: [6] },
  { id: "loki", cat: "tvseries", title: "Loki", year: 2021, date: "2021-06-09", phase: 4, t: 32, seasons: [6, 6] },
  { id: "what-if", cat: "tvseries", kind: "Animated", title: "What If...?", year: 2021, date: "2021-08-11", phase: 4, t: 32.5, seasons: [9, 9, 8] },
  { id: "hawkeye", cat: "tvseries", title: "Hawkeye", year: 2021, date: "2021-11-24", phase: 4, t: 40, seasons: [6] },
  { id: "moon-knight", cat: "tvseries", title: "Moon Knight", year: 2022, date: "2022-03-30", phase: 4, t: 41, seasons: [6] },
  { id: "ms-marvel", cat: "tvseries", title: "Ms. Marvel", year: 2022, date: "2022-06-08", phase: 4, t: 45, seasons: [6] },
  { id: "i-am-groot", cat: "tvseries", kind: "Animated", title: "I Am Groot", year: 2022, date: "2022-08-10", phase: 4, t: 16.5, seasons: [5, 5] },
  { id: "she-hulk", cat: "tvseries", title: "She-Hulk: Attorney at Law", year: 2022, date: "2022-08-18", phase: 4, t: 44, seasons: [9] },
  { id: "secret-invasion", cat: "tvseries", title: "Secret Invasion", year: 2023, date: "2023-06-21", phase: 5, t: 51, seasons: [6] },
  { id: "echo", cat: "tvseries", title: "Echo", year: 2024, date: "2024-01-09", phase: 5, t: 43, seasons: [5] },
  { id: "agatha", cat: "tvseries", title: "Agatha All Along", year: 2024, date: "2024-09-18", phase: 5, t: 54, seasons: [9] },
  { id: "friendly-neighborhood-spider-man", cat: "tvseries", kind: "Animated", title: "Your Friendly Neighborhood Spider-Man", year: 2025, date: "2025-01-29", phase: 5, t: 61.5, seasons: [10], note: "Set in its own universe." },
  { id: "daredevil-born-again", cat: "tvseries", title: "Daredevil: Born Again", year: 2025, date: "2025-03-04", phase: 5, t: 56, seasons: [9, 8] },
  { id: "ironheart", cat: "tvseries", title: "Ironheart", year: 2025, date: "2025-06-24", phase: 5, t: 58, seasons: [6] },
  { id: "marvel-zombies", cat: "tvseries", kind: "Animated", title: "Marvel Zombies", year: 2025, date: "2025-09-24", phase: 6, t: 32.6, seasons: [4], note: "Spins out of What If...? season 1, episode 5." },
  { id: "wonder-man", cat: "tvseries", title: "Wonder Man", year: 2026, date: "2026-01-27", phase: 6, t: 59, seasons: [8] },
  { id: "visionquest", cat: "tvseries", title: "VisionQuest", year: 2026, date: "2026-12-01", phase: 6, t: 62, upcoming: "Coming to Disney+ late 2026" },

  // ---------- MCU Specials & Shorts ----------
  { id: "one-shot-consultant", cat: "short", kind: "Short", title: "The Consultant", year: 2011, date: "2011-09-13", phase: 1, t: 7, note: "Marvel One-Shot." },
  { id: "one-shot-thors-hammer", cat: "short", kind: "Short", title: "A Funny Thing Happened on the Way to Thor's Hammer", year: 2011, date: "2011-10-25", phase: 1, t: 8, note: "Marvel One-Shot." },
  { id: "one-shot-item-47", cat: "short", kind: "Short", title: "Item 47", year: 2012, date: "2012-09-25", phase: 1, t: 11, note: "Marvel One-Shot." },
  { id: "one-shot-agent-carter", cat: "short", kind: "Short", title: "Agent Carter", year: 2013, date: "2013-09-24", phase: 2, t: 2, note: "Marvel One-Shot — the pilot for the Agent Carter series on the Marvel TV tab." },
  { id: "one-shot-all-hail-the-king", cat: "short", kind: "Short", title: "All Hail the King", year: 2014, date: "2014-02-04", phase: 2, t: 14, note: "Marvel One-Shot." },
  { id: "whih-newsfront", cat: "digital", kind: "Digital Series", title: "WHIH Newsfront", year: 2015, date: "2015-07-02", phase: 2, t: 19.5, seasons: [5, 5], note: "In-universe news web series tied to Ant-Man and Civil War." },
  { id: "team-thor", cat: "short", kind: "Short", title: "Team Thor", year: 2016, date: "2016-09-13", phase: 3, t: 25 },
  { id: "team-thor-2", cat: "short", kind: "Short", title: "Team Thor: Part 2", year: 2017, date: "2017-02-28", phase: 3, t: 26 },
  { id: "team-darryl", cat: "short", kind: "Short", title: "Team Darryl", year: 2018, date: "2018-03-06", phase: 3, t: 28 },
  { id: "peters-to-do-list", cat: "short", kind: "Short", title: "Peter's To-Do List", year: 2019, date: "2019-10-01", phase: 3, t: 36.4, note: "Spider-Man: Far From Home home-release short." },
  { id: "daily-bugle", cat: "digital", kind: "Digital Series", title: "The Daily Bugle", year: 2019, date: "2019-10-23", phase: 3, t: 36.5, seasons: [6, 19, 4], note: "J. Jonah Jameson's in-universe web show." },
  { id: "deadpool-korg-react", cat: "short", kind: "Short", title: "Deadpool and Korg React", year: 2021, date: "2021-07-13", phase: 4, t: 38.5, note: "Promo short for Free Guy." },
  { id: "werewolf-by-night", cat: "special", kind: "Special", title: "Werewolf by Night", year: 2022, date: "2022-10-07", phase: 4, t: 47 },
  { id: "guardians-holiday-special", cat: "special", kind: "Special", title: "The Guardians of the Galaxy Holiday Special", year: 2022, date: "2022-11-25", phase: 4, t: 48 },
  { id: "punisher-one-last-kill", cat: "special", kind: "Special", title: "The Punisher: One Last Kill", year: 2026, date: "2026-05-12", phase: 6, t: 59.5, note: "Marvel Television Special Presentation, following Daredevil: Born Again season 2." },

  // ---------- Marvel Television ----------
  {
    id: "amazing-spider-man-tv", cat: "ncutv", title: "The Amazing Spider-Man", year: 1977, group: "CBS · 1977–1979", seasons: [5, 7],
    extras: [{ title: "Spider-Man (pilot movie)", year: 1977, after: -1 }],
  },
  {
    id: "incredible-hulk-tv", cat: "ncutv", title: "The Incredible Hulk", year: 1978, group: "CBS · 1978–1982", seasons: [10, 22, 23, 18, 7],
    note: "Episode counts follow the usual split; some guides fold the two pilot movies into season 1.",
    extras: [
      { title: "The Incredible Hulk (pilot movie)", year: 1977, after: -1 },
      { title: "The Return of the Incredible Hulk (pilot movie)", year: 1977, after: -1 },
      { title: "The Incredible Hulk Returns", year: 1988, note: "Reunion TV movie, with Thor." },
      { title: "The Trial of the Incredible Hulk", year: 1989, note: "Reunion TV movie, with Daredevil." },
      { title: "The Death of the Incredible Hulk", year: 1990, note: "Reunion TV movie." },
    ],
  },
  { id: "spider-man-toei", cat: "ncutv", title: "Spider-Man (Japanese series)", year: 1978, group: "Toei · 1978–1979", seasons: [41] },
  { id: "mutant-x", cat: "ncutv", title: "Mutant X", year: 2001, group: "Syndicated · 2001–2004", seasons: [22, 22, 22] },
  { id: "blade-tv", cat: "ncutv", title: "Blade: The Series", year: 2006, group: "Spike · 2006", seasons: [13] },
  {
    id: "agents-of-shield", cat: "tvseries", title: "Agents of S.H.I.E.L.D.", year: 2013, group: "ABC · 2013–2020", seasons: [22, 22, 22, 22, 22, 13, 13],
    extras: [{ title: "Agents of S.H.I.E.L.D.: Slingshot", year: 2016, seasons: [6], after: 3, note: "Six-part web series following Yo-Yo, released Dec 13, 2016, during season 4's winter break (between episodes 8 and 9)." }],
  },
  { id: "agent-carter-tv", cat: "tvseries", title: "Agent Carter", year: 2015, group: "ABC · 2015–2016", seasons: [8, 10] },
  { id: "daredevil", cat: "tvseries", title: "Daredevil", year: 2015, group: "Netflix · 2015–2018", seasons: [13, 13, 13] },
  { id: "jessica-jones", cat: "tvseries", title: "Jessica Jones", year: 2015, group: "Netflix · 2015–2019", seasons: [13, 13, 13] },
  { id: "luke-cage", cat: "tvseries", title: "Luke Cage", year: 2016, group: "Netflix · 2016–2018", seasons: [13, 13] },
  { id: "legion", cat: "ncutv", title: "Legion", year: 2017, group: "FX · 2017–2019", seasons: [8, 11, 8] },
  { id: "iron-fist", cat: "tvseries", title: "Iron Fist", year: 2017, group: "Netflix · 2017–2018", seasons: [13, 10] },
  { id: "the-defenders", cat: "tvseries", title: "The Defenders", year: 2017, group: "Netflix · 2017", seasons: [8] },
  { id: "inhumans", cat: "tvseries", title: "Inhumans", year: 2017, group: "ABC · 2017", seasons: [8] },
  { id: "the-gifted", cat: "ncutv", title: "The Gifted", year: 2017, group: "Fox · 2017–2019", seasons: [13, 16] },
  { id: "the-punisher-tv", cat: "tvseries", title: "The Punisher", year: 2017, group: "Netflix · 2017–2019", seasons: [13, 13] },
  { id: "runaways", cat: "tvseries", title: "Runaways", year: 2017, group: "Hulu · 2017–2019", seasons: [10, 13, 10] },
  { id: "cloak-and-dagger", cat: "tvseries", title: "Cloak & Dagger", year: 2018, group: "Freeform · 2018–2019", seasons: [10, 10] },
  { id: "helstrom", cat: "tvseries", title: "Helstrom", year: 2020, group: "Hulu · 2020", seasons: [10] },

  // ---------- Other Marvel Films ----------
  { id: "captain-america-1944", cat: "ncufilm", title: "Captain America (serial)", year: 1944, group: "Republic Pictures", note: "15-chapter theatrical serial — the first live-action Marvel adaptation." },
  { id: "dr-strange-1978", cat: "ncufilm", title: "Dr. Strange", year: 1978, group: "CBS TV movie" },
  { id: "captain-america-1979", cat: "ncufilm", title: "Captain America", year: 1979, group: "CBS TV movie" },
  { id: "captain-america-ii-1979", cat: "ncufilm", title: "Captain America II: Death Too Soon", year: 1979, group: "CBS TV movie" },
  { id: "howard-the-duck", cat: "ncufilm", title: "Howard the Duck", year: 1986, group: "Universal" },
  { id: "punisher-1989", cat: "ncufilm", title: "The Punisher", year: 1989, group: "New World", note: "Dolph Lundgren version." },
  { id: "captain-america-1990", cat: "ncufilm", title: "Captain America", year: 1990, group: "21st Century Film" },
  { id: "fantastic-four-1994", cat: "ncufilm", title: "The Fantastic Four", year: 1994, group: "Roger Corman", note: "Never officially released — circulates as a bootleg." },
  { id: "generation-x", cat: "ncufilm", title: "Generation X", year: 1996, group: "Fox TV movie" },
  { id: "nick-fury-1998", cat: "ncufilm", title: "Nick Fury: Agent of S.H.I.E.L.D.", year: 1998, group: "Fox TV movie", note: "David Hasselhoff as Fury." },
  { id: "blade", cat: "ncufilm", title: "Blade", year: 1998, group: "New Line" },
  { id: "x-men", cat: "ncufilm", title: "X-Men", year: 2000, group: "Fox X-Men" },
  { id: "spider-man-2002", cat: "ncufilm", title: "Spider-Man", year: 2002, group: "Sony · Raimi trilogy" },
  { id: "blade-2", cat: "ncufilm", title: "Blade II", year: 2002, group: "New Line" },
  { id: "daredevil-2003", cat: "ncufilm", title: "Daredevil", year: 2003, group: "Fox" },
  { id: "x2", cat: "ncufilm", title: "X2", year: 2003, group: "Fox X-Men" },
  { id: "hulk-2003", cat: "ncufilm", title: "Hulk", year: 2003, group: "Universal" },
  { id: "punisher-2004", cat: "ncufilm", title: "The Punisher", year: 2004, group: "Lionsgate", note: "Thomas Jane version." },
  { id: "spider-man-2", cat: "ncufilm", title: "Spider-Man 2", year: 2004, group: "Sony · Raimi trilogy" },
  { id: "blade-trinity", cat: "ncufilm", title: "Blade: Trinity", year: 2004, group: "New Line" },
  { id: "elektra", cat: "ncufilm", title: "Elektra", year: 2005, group: "Fox" },
  { id: "man-thing", cat: "ncufilm", title: "Man-Thing", year: 2005, group: "Lionsgate" },
  { id: "fantastic-four-2005", cat: "ncufilm", title: "Fantastic Four", year: 2005, group: "Fox Fantastic Four" },
  { id: "last-stand", cat: "ncufilm", title: "X-Men: The Last Stand", year: 2006, group: "Fox X-Men" },
  { id: "ghost-rider", cat: "ncufilm", title: "Ghost Rider", year: 2007, group: "Sony" },
  { id: "spider-man-3", cat: "ncufilm", title: "Spider-Man 3", year: 2007, group: "Sony · Raimi trilogy" },
  { id: "rise-of-the-silver-surfer", cat: "ncufilm", title: "Fantastic Four: Rise of the Silver Surfer", year: 2007, group: "Fox Fantastic Four" },
  { id: "punisher-war-zone", cat: "ncufilm", title: "Punisher: War Zone", year: 2008, group: "Lionsgate" },
  { id: "x-men-origins-wolverine", cat: "ncufilm", title: "X-Men Origins: Wolverine", year: 2009, group: "Fox X-Men" },
  { id: "first-class", cat: "ncufilm", title: "X-Men: First Class", year: 2011, group: "Fox X-Men" },
  { id: "spirit-of-vengeance", cat: "ncufilm", title: "Ghost Rider: Spirit of Vengeance", year: 2012, group: "Sony" },
  { id: "amazing-spider-man", cat: "ncufilm", title: "The Amazing Spider-Man", year: 2012, group: "Sony · Webb films" },
  { id: "the-wolverine", cat: "ncufilm", title: "The Wolverine", year: 2013, group: "Fox X-Men" },
  { id: "amazing-spider-man-2", cat: "ncufilm", title: "The Amazing Spider-Man 2", year: 2014, group: "Sony · Webb films" },
  { id: "days-of-future-past", cat: "ncufilm", title: "X-Men: Days of Future Past", year: 2014, group: "Fox X-Men" },
  { id: "fant4stic", cat: "ncufilm", title: "Fantastic Four", year: 2015, group: "Fox Fantastic Four", note: "The Josh Trank reboot." },
  { id: "deadpool", cat: "ncufilm", title: "Deadpool", year: 2016, group: "Fox X-Men" },
  { id: "apocalypse", cat: "ncufilm", title: "X-Men: Apocalypse", year: 2016, group: "Fox X-Men" },
  { id: "no-good-deed", cat: "short", mcu: false, kind: "Short", title: "No Good Deed", year: 2017, group: "Fox X-Men", note: "Deadpool short released alongside Logan." },
  { id: "logan", cat: "ncufilm", title: "Logan", year: 2017, group: "Fox X-Men" },
  { id: "deadpool-2", cat: "ncufilm", title: "Deadpool 2", year: 2018, group: "Fox X-Men" },
  { id: "venom", cat: "ncufilm", title: "Venom", year: 2018, group: "Sony's Spider-Man Universe" },
  { id: "dark-phoenix", cat: "ncufilm", title: "Dark Phoenix", year: 2019, group: "Fox X-Men" },
  { id: "new-mutants", cat: "ncufilm", title: "The New Mutants", year: 2020, group: "Fox X-Men" },
  { id: "venom-2", cat: "ncufilm", title: "Venom: Let There Be Carnage", year: 2021, group: "Sony's Spider-Man Universe" },
  { id: "morbius", cat: "ncufilm", title: "Morbius", year: 2022, group: "Sony's Spider-Man Universe" },
  { id: "madame-web", cat: "ncufilm", title: "Madame Web", year: 2024, group: "Sony's Spider-Man Universe" },
  { id: "venom-last-dance", cat: "ncufilm", title: "Venom: The Last Dance", year: 2024, group: "Sony's Spider-Man Universe" },
  { id: "kraven", cat: "ncufilm", title: "Kraven the Hunter", year: 2024, group: "Sony's Spider-Man Universe" },
];
