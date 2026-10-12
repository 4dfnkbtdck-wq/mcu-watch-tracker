(function () {
  "use strict";

  const STORAGE_FILTER = "mcu-tracker:master-filter";
  const STORAGE_HIDE_SEEN = "mcu-tracker:master-hide-seen";

  const filterSegmented = document.getElementById("filter-segmented");
  const progressFill = document.getElementById("progress-fill");
  const progressLabel = document.getElementById("progress-label");
  const upNextEl = document.getElementById("up-next");
  const searchInput = document.getElementById("search");
  const hideSeenBtn = document.getElementById("hide-seen-toggle");
  const masterList = document.getElementById("master-list");

  const FILTERS = [
    { id: "all", label: "Everything", test: () => true },
    { id: "mcu", label: "MCU", test: (item) => isMcu(item) },
    { id: "other", label: "Non-MCU", test: (item) => !isMcu(item) },
  ];

  const titlesById = {};
  TITLES.forEach((t) => (titlesById[t.id] = t));

  let seen = loadJson(STORAGE_SEEN, {});
  let filter = FILTERS.some((f) => f.id === localStorage.getItem(STORAGE_FILTER))
    ? localStorage.getItem(STORAGE_FILTER)
    : "all";
  let hideSeen = localStorage.getItem(STORAGE_HIDE_SEEN) === "1";
  let searchTerm = "";

  function save() {
    localStorage.setItem(STORAGE_SEEN, JSON.stringify(seen));
  }

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

  // One entry per MASTER_LIST row: what to show and the storage keys
  // it covers (one key, except a whole-season row for an older show).
  const ENTRIES = MASTER_LIST.map((row, idx) => {
    const item = titlesById[row.id];
    const extra = row.x != null ? item.extras[row.x] : null;
    const prefix = extra ? extraKey(item, row.x) : item.id;
    const seasons = extra ? extra.seasons : item.seasons;
    const entry = {
      domId: "row-" + idx,
      item,
      date: row.d,
      title: extra ? extra.title : item.title,
      detail: "",
      type: extra ? (extra.seasons ? "Spin-off" : "TV Movie") : typeLabel(item),
      keys: [],
    };

    if (row.s == null) {
      entry.keys.push(prefix);
      if (extra) entry.detail = "From " + item.title;
    } else if (row.e == null) {
      for (let e = 1; e <= seasons[row.s]; e++) entry.keys.push(episodeKey(prefix, row.s, e));
      entry.detail = "Season " + (row.s + 1) + " · all " + seasons[row.s] + " episodes";
    } else {
      entry.keys.push(episodeKey(prefix, row.s, row.e));
      entry.detail = (seasons.length > 1 ? "Season " + (row.s + 1) + " · " : "") + "Episode " + row.e;
    }
    return entry;
  });

  function isSeen(entry) {
    return entry.keys.every((k) => seen[k]);
  }

  function setSeen(entry, value) {
    entry.keys.forEach((k) => {
      if (value) seen[k] = true;
      else delete seen[k];
    });
  }

  function visibleEntries() {
    const test = FILTERS.find((f) => f.id === filter).test;
    return ENTRIES.filter((en) => test(en.item));
  }

  function buildSegmented() {
    filterSegmented.innerHTML = "";
    FILTERS.forEach((f) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = f.label;
      if (f.id === filter) btn.classList.add("active");
      btn.addEventListener("click", () => {
        filter = f.id;
        localStorage.setItem(STORAGE_FILTER, filter);
        render();
      });
      filterSegmented.appendChild(btn);
    });
  }

  function updateSummary(entries) {
    const released = entries.filter((en) => !en.item.upcoming);
    const seenCount = released.filter(isSeen).length;
    const pct = released.length ? Math.round((seenCount / released.length) * 100) : 0;
    progressFill.style.width = pct + "%";
    progressLabel.textContent = seenCount + " of " + released.length + " seen";

    const next = released.find((en) => !isSeen(en));
    upNextEl.innerHTML = "";
    upNextEl.onclick = null;
    const label = document.createElement("div");
    label.className = "up-next-label";
    label.textContent = "Up Next";
    const title = document.createElement("div");
    title.className = "up-next-title";
    const sub = document.createElement("div");
    sub.className = "up-next-sub";
    if (!next) {
      title.textContent = "You're all caught up!";
      const coming = entries.find((en) => en.item.upcoming);
      sub.textContent = coming ? "Next up: " + coming.title + " — " + coming.item.upcoming : "";
    } else {
      title.textContent = next.title;
      sub.textContent = [next.detail, formatDate(next.date)].filter(Boolean).join(" · ");
      upNextEl.onclick = () => {
        if (searchTerm) {
          searchTerm = "";
          searchInput.value = "";
          render();
        }
        const el = document.getElementById(next.domId);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      };
    }
    upNextEl.appendChild(label);
    upNextEl.appendChild(title);
    upNextEl.appendChild(sub);
  }

  function setRowState(row, check, nameEl, value) {
    check.className = "title-check" + (value ? " checked" : "");
    nameEl.className = "title-name" + (value ? " seen" : "");
    row.setAttribute("aria-checked", String(value));
  }

  function buildRow(entry, number, entries) {
    const item = entry.item;
    const value = isSeen(entry);

    const row = document.createElement("li");
    row.className = "title-row master-row" + (item.upcoming ? " upcoming" : "");
    row.id = entry.domId;

    const num = document.createElement("span");
    num.className = "title-year order-num";
    num.textContent = number;

    const info = document.createElement("span");
    info.className = "title-info";
    const nameEl = document.createElement("div");
    nameEl.className = "title-name" + (value ? " seen" : "");
    nameEl.textContent = entry.title;
    info.appendChild(nameEl);

    if (entry.detail) {
      const detailEl = document.createElement("div");
      detailEl.className = "master-detail";
      detailEl.textContent = entry.detail;
      info.appendChild(detailEl);
    }

    const meta = document.createElement("div");
    meta.className = "title-meta";
    const tag = document.createElement("span");
    tag.className = "type-tag type-" + entry.type.toLowerCase().replace(/\s+/g, "-");
    tag.textContent = entry.type;
    meta.appendChild(tag);
    const where = item.phase ? "Phase " + item.phase : item.group ? item.group.split(" · ")[0] : "";
    meta.appendChild(document.createTextNode((item.upcoming ? item.upcoming : formatDate(entry.date)) + (where ? " · " + where : "")));
    info.appendChild(meta);

    row.appendChild(num);
    row.appendChild(info);

    if (item.upcoming) {
      const soon = document.createElement("span");
      soon.className = "soon-pill";
      soon.textContent = "Soon";
      row.appendChild(soon);
      return row;
    }

    row.setAttribute("role", "checkbox");
    row.setAttribute("aria-checked", String(value));
    const check = document.createElement("span");
    check.className = "title-check" + (value ? " checked" : "");
    check.innerHTML = checkIconSvg();
    row.appendChild(check);

    row.addEventListener("click", () => {
      const now = !isSeen(entry);
      setSeen(entry, now);
      save();
      if (hideSeen && now) {
        render();
        return;
      }
      setRowState(row, check, nameEl, now);
      updateSummary(entries);
    });

    // Tap the number to mark everything up to and including this row.
    num.addEventListener("click", (ev) => {
      ev.stopPropagation();
      if (!confirm("Mark everything from #1 to #" + number + " as watched?")) return;
      entries.slice(0, number).forEach((en) => {
        if (!en.item.upcoming) setSeen(en, true);
      });
      save();
      render();
    });

    return row;
  }

  function render() {
    buildSegmented();
    hideSeenBtn.textContent = hideSeen ? "Show Watched" : "Hide Watched";

    const entries = visibleEntries();
    updateSummary(entries);

    const term = searchTerm.trim().toLowerCase();
    masterList.innerHTML = "";
    let currentYear = null;
    let currentList = null;
    let shown = 0;

    entries.forEach((entry, idx) => {
      if (hideSeen && isSeen(entry)) return;
      if (term && !entry.title.toLowerCase().includes(term) && !entry.item.title.toLowerCase().includes(term)) return;
      shown++;

      const year = entry.date.slice(0, 4);
      if (year !== currentYear) {
        currentYear = year;
        const header = document.createElement("h2");
        header.className = "year-header";
        header.textContent = year;
        masterList.appendChild(header);
        currentList = document.createElement("ul");
        currentList.className = "ios-list";
        masterList.appendChild(currentList);
      }
      currentList.appendChild(buildRow(entry, idx + 1, entries));
    });

    if (shown === 0) {
      const empty = document.createElement("p");
      empty.className = "unwatched-done empty-state";
      empty.textContent = term ? "No matches." : "Nothing left to watch here.";
      masterList.appendChild(empty);
    }
  }

  hideSeenBtn.addEventListener("click", () => {
    hideSeen = !hideSeen;
    localStorage.setItem(STORAGE_HIDE_SEEN, hideSeen ? "1" : "0");
    render();
  });

  searchInput.addEventListener("input", (e) => {
    searchTerm = e.target.value;
    render();
  });

  render();
})();
