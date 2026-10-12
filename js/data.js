// MCU Watch Tracker — title data
//
// Everything Marvel in live action: the Marvel Studios films, Disney+
// series and specials (the MCU proper), the Marvel Television shows
// (ABC, Netflix, Hulu, Freeform, FX, Fox and the older CBS/syndicated
// series), and every non-MCU live-action film (Fox's X-Men and
// Fantastic Four, Sony's Spider-Man and Spider-Man Universe, the
// pre-2008 one-offs, and the TV movies). Animated titles (What If...?,
// X-Men '97, etc.) are deliberately left out.
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
//            Series are placed by their first season.
//   phase    MCU phase (MCU titles only)
//   seasons  episode counts, one entry per season — makes the row
//            expandable into a season/episode checklist
//   extras   tie-in pilots, TV movies and web spin-offs, checked off
//            separately: { title, year, seasons?, note? }
//   group    studio / network / franchise label shown under the title
//   kind     "Short" or "Special" for one-shots and specials
//   upcoming display string for unreleased titles; they're shown but
//            can't be checked off and don't count toward progress
//   note     extra context shown under the row
//
// Within each tab, titles are listed in release order — the "Oldest
// First" / "Release Order" sort is just this array order.
//
// Corrections are just edits to the array below.

const CATEGORIES = [
  {
    id: "films",
    name: "MCU Films",
    short: "Films",
    mcu: true,
  },
  {
    id: "series",
    name: "MCU Series",
    short: "Series",
    mcu: true,
    note: "Marvel Studios' live-action Disney+ series. Tap a show to check off individual episodes.",
  },
  {
    id: "specials",
    name: "MCU Specials & Shorts",
    short: "Specials",
    mcu: true,
    note: "Marvel Studios Special Presentations, the Marvel One-Shots (found on the Phase 1–2 Blu-rays and Disney+), and the Team Thor mockumentary shorts.",
  },
  {
    id: "marveltv",
    name: "Marvel Television",
    short: "Marvel TV",
    note: "Live-action Marvel shows outside of Marvel Studios: ABC, Netflix's Defenders saga, Hulu, Freeform, FX, Fox, and the classic CBS and syndicated series. Daredevil: Born Again (on the Series tab) continues the Netflix Daredevil story.",
  },
  {
    id: "legacy",
    name: "Other Marvel Films",
    short: "Legacy",
    note: "Non-MCU live-action Marvel films: the early one-offs, Fox's X-Men and Fantastic Four, Sony's Spider-Man and Spider-Man Universe films, and made-for-TV movies.",
  },
];

const TITLES = [
  // ---------- MCU Films ----------
  { id: "iron-man", cat: "films", title: "Iron Man", year: 2008, date: "2008-05-02", phase: 1, t: 4 },
  { id: "incredible-hulk", cat: "films", title: "The Incredible Hulk", year: 2008, date: "2008-06-13", phase: 1, t: 6 },
  { id: "iron-man-2", cat: "films", title: "Iron Man 2", year: 2010, date: "2010-05-07", phase: 1, t: 5 },
  { id: "thor", cat: "films", title: "Thor", year: 2011, date: "2011-05-06", phase: 1, t: 9 },
  { id: "captain-america-tfa", cat: "films", title: "Captain America: The First Avenger", year: 2011, date: "2011-07-22", phase: 1, t: 1 },
  { id: "avengers", cat: "films", title: "The Avengers", year: 2012, date: "2012-05-04", phase: 1, t: 10 },
  { id: "iron-man-3", cat: "films", title: "Iron Man 3", year: 2013, date: "2013-05-03", phase: 2, t: 13 },
  { id: "thor-dark-world", cat: "films", title: "Thor: The Dark World", year: 2013, date: "2013-11-08", phase: 2, t: 12 },
  { id: "captain-america-tws", cat: "films", title: "Captain America: The Winter Soldier", year: 2014, date: "2014-04-04", phase: 2, t: 15 },
  { id: "guardians", cat: "films", title: "Guardians of the Galaxy", year: 2014, date: "2014-08-01", phase: 2, t: 16 },
  { id: "age-of-ultron", cat: "films", title: "Avengers: Age of Ultron", year: 2015, date: "2015-05-01", phase: 2, t: 18 },
  { id: "ant-man", cat: "films", title: "Ant-Man", year: 2015, date: "2015-07-17", phase: 2, t: 19 },
  { id: "civil-war", cat: "films", title: "Captain America: Civil War", year: 2016, date: "2016-05-06", phase: 3, t: 20 },
  { id: "doctor-strange", cat: "films", title: "Doctor Strange", year: 2016, date: "2016-11-04", phase: 3, t: 24 },
  { id: "guardians-2", cat: "films", title: "Guardians of the Galaxy Vol. 2", year: 2017, date: "2017-05-05", phase: 3, t: 17 },
  { id: "homecoming", cat: "films", title: "Spider-Man: Homecoming", year: 2017, date: "2017-07-07", phase: 3, t: 23 },
  { id: "ragnarok", cat: "films", title: "Thor: Ragnarok", year: 2017, date: "2017-11-03", phase: 3, t: 27 },
  { id: "black-panther", cat: "films", title: "Black Panther", year: 2018, date: "2018-02-16", phase: 3, t: 22 },
  { id: "infinity-war", cat: "films", title: "Avengers: Infinity War", year: 2018, date: "2018-04-27", phase: 3, t: 30 },
  { id: "ant-man-wasp", cat: "films", title: "Ant-Man and the Wasp", year: 2018, date: "2018-07-06", phase: 3, t: 29 },
  { id: "captain-marvel", cat: "films", title: "Captain Marvel", year: 2019, date: "2019-03-08", phase: 3, t: 3 },
  { id: "endgame", cat: "films", title: "Avengers: Endgame", year: 2019, date: "2019-04-26", phase: 3, t: 31 },
  { id: "far-from-home", cat: "films", title: "Spider-Man: Far From Home", year: 2019, date: "2019-07-02", phase: 3, t: 36 },
  { id: "black-widow", cat: "films", title: "Black Widow", year: 2021, date: "2021-07-09", phase: 4, t: 21 },
  { id: "shang-chi", cat: "films", title: "Shang-Chi and the Legend of the Ten Rings", year: 2021, date: "2021-09-03", phase: 4, t: 34 },
  { id: "eternals", cat: "films", title: "Eternals", year: 2021, date: "2021-11-05", phase: 4, t: 37 },
  { id: "no-way-home", cat: "films", title: "Spider-Man: No Way Home", year: 2021, date: "2021-12-17", phase: 4, t: 38 },
  { id: "multiverse-of-madness", cat: "films", title: "Doctor Strange in the Multiverse of Madness", year: 2022, date: "2022-05-06", phase: 4, t: 39 },
  { id: "love-and-thunder", cat: "films", title: "Thor: Love and Thunder", year: 2022, date: "2022-07-08", phase: 4, t: 46 },
  { id: "wakanda-forever", cat: "films", title: "Black Panther: Wakanda Forever", year: 2022, date: "2022-11-11", phase: 4, t: 42 },
  { id: "quantumania", cat: "films", title: "Ant-Man and the Wasp: Quantumania", year: 2023, date: "2023-02-17", phase: 5, t: 49 },
  { id: "guardians-3", cat: "films", title: "Guardians of the Galaxy Vol. 3", year: 2023, date: "2023-05-05", phase: 5, t: 50 },
  { id: "the-marvels", cat: "films", title: "The Marvels", year: 2023, date: "2023-11-10", phase: 5, t: 52 },
  { id: "deadpool-wolverine", cat: "films", title: "Deadpool & Wolverine", year: 2024, date: "2024-07-26", phase: 5, t: 53 },
  { id: "brave-new-world", cat: "films", title: "Captain America: Brave New World", year: 2025, date: "2025-02-14", phase: 5, t: 55 },
  { id: "thunderbolts", cat: "films", title: "Thunderbolts*", year: 2025, date: "2025-05-02", phase: 5, t: 57 },
  { id: "fantastic-four-first-steps", cat: "films", title: "The Fantastic Four: First Steps", year: 2025, date: "2025-07-25", phase: 6, t: 61, note: "Set on Earth-828, a separate universe — listed late in timeline order since it leads into Avengers: Doomsday." },
  { id: "brand-new-day", cat: "films", title: "Spider-Man: Brand New Day", year: 2026, date: "2026-07-31", phase: 6, t: 60 },
  { id: "avengers-doomsday", cat: "films", title: "Avengers: Doomsday", year: 2026, date: "2026-12-18", phase: 6, t: 63, upcoming: "In theaters Dec 18, 2026" },
  { id: "avengers-secret-wars", cat: "films", title: "Avengers: Secret Wars", year: 2027, date: "2027-12-17", phase: 6, t: 64, upcoming: "In theaters Dec 17, 2027" },

  // ---------- MCU Series (Disney+) ----------
  { id: "wandavision", cat: "series", title: "WandaVision", year: 2021, date: "2021-01-15", phase: 4, t: 33, seasons: [9] },
  { id: "falcon-winter-soldier", cat: "series", title: "The Falcon and the Winter Soldier", year: 2021, date: "2021-03-19", phase: 4, t: 35, seasons: [6] },
  { id: "loki", cat: "series", title: "Loki", year: 2021, date: "2021-06-09", phase: 4, t: 32, seasons: [6, 6] },
  { id: "hawkeye", cat: "series", title: "Hawkeye", year: 2021, date: "2021-11-24", phase: 4, t: 40, seasons: [6] },
  { id: "moon-knight", cat: "series", title: "Moon Knight", year: 2022, date: "2022-03-30", phase: 4, t: 41, seasons: [6] },
  { id: "ms-marvel", cat: "series", title: "Ms. Marvel", year: 2022, date: "2022-06-08", phase: 4, t: 45, seasons: [6] },
  { id: "she-hulk", cat: "series", title: "She-Hulk: Attorney at Law", year: 2022, date: "2022-08-18", phase: 4, t: 44, seasons: [9] },
  { id: "secret-invasion", cat: "series", title: "Secret Invasion", year: 2023, date: "2023-06-21", phase: 5, t: 51, seasons: [6] },
  { id: "echo", cat: "series", title: "Echo", year: 2024, date: "2024-01-09", phase: 5, t: 43, seasons: [5] },
  { id: "agatha", cat: "series", title: "Agatha All Along", year: 2024, date: "2024-09-18", phase: 5, t: 54, seasons: [9] },
  { id: "daredevil-born-again", cat: "series", title: "Daredevil: Born Again", year: 2025, date: "2025-03-04", phase: 5, t: 56, seasons: [9, 8] },
  { id: "ironheart", cat: "series", title: "Ironheart", year: 2025, date: "2025-06-24", phase: 5, t: 58, seasons: [6] },
  { id: "wonder-man", cat: "series", title: "Wonder Man", year: 2026, date: "2026-01-27", phase: 6, t: 59, seasons: [8] },
  { id: "visionquest", cat: "series", title: "VisionQuest", year: 2026, date: "2026-12-01", phase: 6, t: 62, upcoming: "Coming to Disney+ late 2026" },

  // ---------- MCU Specials & Shorts ----------
  { id: "one-shot-consultant", cat: "specials", kind: "Short", title: "The Consultant", year: 2011, date: "2011-09-13", phase: 1, t: 7, note: "Marvel One-Shot." },
  { id: "one-shot-thors-hammer", cat: "specials", kind: "Short", title: "A Funny Thing Happened on the Way to Thor's Hammer", year: 2011, date: "2011-10-25", phase: 1, t: 8, note: "Marvel One-Shot." },
  { id: "one-shot-item-47", cat: "specials", kind: "Short", title: "Item 47", year: 2012, date: "2012-09-25", phase: 1, t: 11, note: "Marvel One-Shot." },
  { id: "one-shot-agent-carter", cat: "specials", kind: "Short", title: "Agent Carter", year: 2013, date: "2013-09-24", phase: 2, t: 2, note: "Marvel One-Shot — the pilot for the Agent Carter series on the Marvel TV tab." },
  { id: "one-shot-all-hail-the-king", cat: "specials", kind: "Short", title: "All Hail the King", year: 2014, date: "2014-02-04", phase: 2, t: 14, note: "Marvel One-Shot." },
  { id: "team-thor", cat: "specials", kind: "Short", title: "Team Thor", year: 2016, date: "2016-09-13", phase: 3, t: 25 },
  { id: "team-thor-2", cat: "specials", kind: "Short", title: "Team Thor: Part 2", year: 2017, date: "2017-02-28", phase: 3, t: 26 },
  { id: "team-darryl", cat: "specials", kind: "Short", title: "Team Darryl", year: 2018, date: "2018-03-06", phase: 3, t: 28 },
  { id: "werewolf-by-night", cat: "specials", kind: "Special", title: "Werewolf by Night", year: 2022, date: "2022-10-07", phase: 4, t: 47 },
  { id: "guardians-holiday-special", cat: "specials", kind: "Special", title: "The Guardians of the Galaxy Holiday Special", year: 2022, date: "2022-11-25", phase: 4, t: 48 },

  // ---------- Marvel Television ----------
  {
    id: "amazing-spider-man-tv", cat: "marveltv", title: "The Amazing Spider-Man", year: 1977, group: "CBS · 1977–1979", seasons: [5, 7],
    extras: [{ title: "Spider-Man (pilot movie)", year: 1977 }],
  },
  {
    id: "incredible-hulk-tv", cat: "marveltv", title: "The Incredible Hulk", year: 1978, group: "CBS · 1978–1982", seasons: [10, 22, 23, 18, 7],
    note: "Episode counts follow the usual split; some guides fold the two pilot movies into season 1.",
    extras: [
      { title: "The Incredible Hulk (pilot movie)", year: 1977 },
      { title: "The Return of the Incredible Hulk (pilot movie)", year: 1977 },
      { title: "The Incredible Hulk Returns", year: 1988, note: "Reunion TV movie, with Thor." },
      { title: "The Trial of the Incredible Hulk", year: 1989, note: "Reunion TV movie, with Daredevil." },
      { title: "The Death of the Incredible Hulk", year: 1990, note: "Reunion TV movie." },
    ],
  },
  { id: "spider-man-toei", cat: "marveltv", title: "Spider-Man (Japanese series)", year: 1978, group: "Toei · 1978–1979", seasons: [41] },
  { id: "mutant-x", cat: "marveltv", title: "Mutant X", year: 2001, group: "Syndicated · 2001–2004", seasons: [22, 22, 22] },
  { id: "blade-tv", cat: "marveltv", title: "Blade: The Series", year: 2006, group: "Spike · 2006", seasons: [12] },
  {
    id: "agents-of-shield", cat: "marveltv", title: "Agents of S.H.I.E.L.D.", year: 2013, group: "ABC · 2013–2020", seasons: [22, 22, 22, 22, 22, 13, 13],
    extras: [{ title: "Agents of S.H.I.E.L.D.: Slingshot", year: 2016, seasons: [6], note: "Six-part web series following Yo-Yo." }],
  },
  { id: "agent-carter-tv", cat: "marveltv", title: "Agent Carter", year: 2015, group: "ABC · 2015–2016", seasons: [8, 10] },
  { id: "daredevil", cat: "marveltv", title: "Daredevil", year: 2015, group: "Netflix · 2015–2018", seasons: [13, 13, 13] },
  { id: "jessica-jones", cat: "marveltv", title: "Jessica Jones", year: 2015, group: "Netflix · 2015–2019", seasons: [13, 13, 13] },
  { id: "luke-cage", cat: "marveltv", title: "Luke Cage", year: 2016, group: "Netflix · 2016–2018", seasons: [13, 13] },
  { id: "legion", cat: "marveltv", title: "Legion", year: 2017, group: "FX · 2017–2019", seasons: [8, 11, 8] },
  { id: "iron-fist", cat: "marveltv", title: "Iron Fist", year: 2017, group: "Netflix · 2017–2018", seasons: [13, 10] },
  { id: "the-defenders", cat: "marveltv", title: "The Defenders", year: 2017, group: "Netflix · 2017", seasons: [8] },
  { id: "inhumans", cat: "marveltv", title: "Inhumans", year: 2017, group: "ABC · 2017", seasons: [8] },
  { id: "the-gifted", cat: "marveltv", title: "The Gifted", year: 2017, group: "Fox · 2017–2019", seasons: [13, 16] },
  { id: "the-punisher-tv", cat: "marveltv", title: "The Punisher", year: 2017, group: "Netflix · 2017–2019", seasons: [13, 13] },
  { id: "runaways", cat: "marveltv", title: "Runaways", year: 2017, group: "Hulu · 2017–2019", seasons: [10, 13, 10] },
  { id: "cloak-and-dagger", cat: "marveltv", title: "Cloak & Dagger", year: 2018, group: "Freeform · 2018–2019", seasons: [10, 10] },
  { id: "helstrom", cat: "marveltv", title: "Helstrom", year: 2020, group: "Hulu · 2020", seasons: [10] },

  // ---------- Other Marvel Films ----------
  { id: "captain-america-1944", cat: "legacy", title: "Captain America (serial)", year: 1944, group: "Republic Pictures", note: "15-chapter theatrical serial — the first live-action Marvel adaptation." },
  { id: "dr-strange-1978", cat: "legacy", title: "Dr. Strange", year: 1978, group: "CBS TV movie" },
  { id: "captain-america-1979", cat: "legacy", title: "Captain America", year: 1979, group: "CBS TV movie" },
  { id: "captain-america-ii-1979", cat: "legacy", title: "Captain America II: Death Too Soon", year: 1979, group: "CBS TV movie" },
  { id: "howard-the-duck", cat: "legacy", title: "Howard the Duck", year: 1986, group: "Universal" },
  { id: "punisher-1989", cat: "legacy", title: "The Punisher", year: 1989, group: "New World", note: "Dolph Lundgren version." },
  { id: "captain-america-1990", cat: "legacy", title: "Captain America", year: 1990, group: "21st Century Film" },
  { id: "fantastic-four-1994", cat: "legacy", title: "The Fantastic Four", year: 1994, group: "Roger Corman", note: "Never officially released — circulates as a bootleg." },
  { id: "generation-x", cat: "legacy", title: "Generation X", year: 1996, group: "Fox TV movie" },
  { id: "nick-fury-1998", cat: "legacy", title: "Nick Fury: Agent of S.H.I.E.L.D.", year: 1998, group: "Fox TV movie", note: "David Hasselhoff as Fury." },
  { id: "blade", cat: "legacy", title: "Blade", year: 1998, group: "New Line" },
  { id: "x-men", cat: "legacy", title: "X-Men", year: 2000, group: "Fox X-Men" },
  { id: "spider-man-2002", cat: "legacy", title: "Spider-Man", year: 2002, group: "Sony · Raimi trilogy" },
  { id: "blade-2", cat: "legacy", title: "Blade II", year: 2002, group: "New Line" },
  { id: "daredevil-2003", cat: "legacy", title: "Daredevil", year: 2003, group: "Fox" },
  { id: "x2", cat: "legacy", title: "X2", year: 2003, group: "Fox X-Men" },
  { id: "hulk-2003", cat: "legacy", title: "Hulk", year: 2003, group: "Universal" },
  { id: "punisher-2004", cat: "legacy", title: "The Punisher", year: 2004, group: "Lionsgate", note: "Thomas Jane version." },
  { id: "spider-man-2", cat: "legacy", title: "Spider-Man 2", year: 2004, group: "Sony · Raimi trilogy" },
  { id: "blade-trinity", cat: "legacy", title: "Blade: Trinity", year: 2004, group: "New Line" },
  { id: "elektra", cat: "legacy", title: "Elektra", year: 2005, group: "Fox" },
  { id: "man-thing", cat: "legacy", title: "Man-Thing", year: 2005, group: "Lionsgate" },
  { id: "fantastic-four-2005", cat: "legacy", title: "Fantastic Four", year: 2005, group: "Fox Fantastic Four" },
  { id: "last-stand", cat: "legacy", title: "X-Men: The Last Stand", year: 2006, group: "Fox X-Men" },
  { id: "ghost-rider", cat: "legacy", title: "Ghost Rider", year: 2007, group: "Sony" },
  { id: "spider-man-3", cat: "legacy", title: "Spider-Man 3", year: 2007, group: "Sony · Raimi trilogy" },
  { id: "rise-of-the-silver-surfer", cat: "legacy", title: "Fantastic Four: Rise of the Silver Surfer", year: 2007, group: "Fox Fantastic Four" },
  { id: "punisher-war-zone", cat: "legacy", title: "Punisher: War Zone", year: 2008, group: "Lionsgate" },
  { id: "x-men-origins-wolverine", cat: "legacy", title: "X-Men Origins: Wolverine", year: 2009, group: "Fox X-Men" },
  { id: "first-class", cat: "legacy", title: "X-Men: First Class", year: 2011, group: "Fox X-Men" },
  { id: "spirit-of-vengeance", cat: "legacy", title: "Ghost Rider: Spirit of Vengeance", year: 2012, group: "Sony" },
  { id: "amazing-spider-man", cat: "legacy", title: "The Amazing Spider-Man", year: 2012, group: "Sony · Webb films" },
  { id: "the-wolverine", cat: "legacy", title: "The Wolverine", year: 2013, group: "Fox X-Men" },
  { id: "amazing-spider-man-2", cat: "legacy", title: "The Amazing Spider-Man 2", year: 2014, group: "Sony · Webb films" },
  { id: "days-of-future-past", cat: "legacy", title: "X-Men: Days of Future Past", year: 2014, group: "Fox X-Men" },
  { id: "fant4stic", cat: "legacy", title: "Fantastic Four", year: 2015, group: "Fox Fantastic Four", note: "The Josh Trank reboot." },
  { id: "deadpool", cat: "legacy", title: "Deadpool", year: 2016, group: "Fox X-Men" },
  { id: "apocalypse", cat: "legacy", title: "X-Men: Apocalypse", year: 2016, group: "Fox X-Men" },
  { id: "logan", cat: "legacy", title: "Logan", year: 2017, group: "Fox X-Men" },
  { id: "deadpool-2", cat: "legacy", title: "Deadpool 2", year: 2018, group: "Fox X-Men" },
  { id: "venom", cat: "legacy", title: "Venom", year: 2018, group: "Sony's Spider-Man Universe" },
  { id: "dark-phoenix", cat: "legacy", title: "Dark Phoenix", year: 2019, group: "Fox X-Men" },
  { id: "new-mutants", cat: "legacy", title: "The New Mutants", year: 2020, group: "Fox X-Men" },
  { id: "venom-2", cat: "legacy", title: "Venom: Let There Be Carnage", year: 2021, group: "Sony's Spider-Man Universe" },
  { id: "morbius", cat: "legacy", title: "Morbius", year: 2022, group: "Sony's Spider-Man Universe" },
  { id: "madame-web", cat: "legacy", title: "Madame Web", year: 2024, group: "Sony's Spider-Man Universe" },
  { id: "venom-last-dance", cat: "legacy", title: "Venom: The Last Dance", year: 2024, group: "Sony's Spider-Man Universe" },
  { id: "kraven", cat: "legacy", title: "Kraven the Hunter", year: 2024, group: "Sony's Spider-Man Universe" },
];
