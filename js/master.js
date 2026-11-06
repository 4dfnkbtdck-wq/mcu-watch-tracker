(function () {
  "use strict";

  const STORAGE_TYPES = "mcu-tracker:types";
  const STORAGE_HIDE_SEEN = "mcu-tracker:master-hide-seen";

  const typeChips = document.getElementById("type-chips");
  const progressFill = document.getElementById("m-progress-fill");
  const progressLabel = document.getElementById("m-progress-label");
  const upNextEl = document.getElementById("m-up-next");
  const searchInput = document.getElementById("m-search");
  const hideSeenBtn = document.getElementById("m-hide-seen");
  const masterList = document.getElementById("m-list");
  const yearBar = document.getElementById("year-bar");
  const toast = document.getElementById("toast");
  const backupBtn = document.getElementById("backup-btn");
  const restoreBtn = document.getElementById("restore-btn");
  const restoreInput = document.getElementById("restore-input");

  const titlesById = {};
  TITLES.forEach((t) => (titlesById[t.id] = t));

  const ALL_TYPES = CATEGORIES.map((c) => c.id);
  // The Types currently shown: any mix, tapped on and off (at least one stays on).
  let selectedTypes = (function () {
    const saved = loadJson(STORAGE_TYPES, ALL_TYPES);
    const valid = ALL_TYPES.filter((id) => saved.includes(id));
    return valid.length ? valid : ALL_TYPES.slice();
  })();
  let hideSeen = localStorage.getItem(STORAGE_HIDE_SEEN) === "1";
  let searchTerm = "";

  function save() {
    localStorage.setItem(STORAGE_SEEN, JSON.stringify(seen));
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
      // Upcoming per row, so a show's episodes unlock one air date at a time.
      upcoming: row.d > TODAY,
      title: extra ? extra.title : item.title,
      detail: "",
      // Colour-coding category: the title's Type, except that a spin-off
      // web series (Slingshot) counts as a Digital Series, as in the spreadsheet.
      cat: extra && extra.seasons ? getCategory("digital") : getCategory(item.cat),
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

  // ---------- Undo ----------
  // Every change goes through changeSeen(), which remembers what it
  // overwrote so the toast's Undo button can put it back.
  let undoState = null;
  let toastTimer = null;

  function changeSeen(keys, value, message) {
    const before = {};
    keys.forEach((k) => {
      if (!!seen[k] !== value) before[k] = !!seen[k];
    });
    keys.forEach((k) => {
      if (value) seen[k] = true;
      else delete seen[k];
    });
    save();
    if (Object.keys(before).length) showUndo(message, before);
  }

  function showUndo(message, before) {
    undoState = before;
    toast.innerHTML = "";
    const text = document.createElement("span");
    text.className = "toast-text";
    text.textContent = message;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "toast-undo";
    btn.textContent = "Undo";
    btn.addEventListener("click", undo);
    toast.appendChild(text);
    toast.appendChild(btn);
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(hideToast, 6000);
  }

  function hideToast() {
    toast.classList.remove("show");
    undoState = null;
  }

  function undo() {
    if (!undoState) return;
    Object.entries(undoState).forEach(([k, was]) => {
      if (was) seen[k] = true;
      else delete seen[k];
    });
    save();
    hideToast();
    render();
  }

  function isSeen(entry) {
    return entry.keys.every((k) => seen[k]);
  }

  function visibleEntries() {
    return ENTRIES.filter((en) => selectedTypes.includes(en.cat.id));
  }

  // Type chips double as the colour key and the filter. With "All" on,
  // tapping a Type shows just that Type; after that, each tap adds or
  // removes one. Removing the last one (or tapping "All") shows everything.
  function buildChips() {
    typeChips.innerHTML = "";
    const showingAll = selectedTypes.length === ALL_TYPES.length;
    const addChip = (label, active, catId, onClick) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "type-chip" + (catId ? " cat-" + catId : " all-chip") + (active ? " active" : "");
      chip.textContent = label;
      chip.setAttribute("aria-pressed", String(active));
      chip.addEventListener("click", () => {
        onClick();
        localStorage.setItem(STORAGE_TYPES, JSON.stringify(selectedTypes));
        render();
      });
      typeChips.appendChild(chip);
    };
    addChip("All", showingAll, null, () => {
      selectedTypes = ALL_TYPES.slice();
    });
    CATEGORIES.forEach((cat) => {
      const on = !showingAll && selectedTypes.includes(cat.id);
      addChip(cat.short, on, cat.id, () => {
        if (showingAll) {
          selectedTypes = [cat.id];
          return;
        }
        selectedTypes = ALL_TYPES.filter((id) => (id === cat.id ? !on : selectedTypes.includes(id)));
        if (selectedTypes.length === 0) selectedTypes = ALL_TYPES.slice();
      });
    });
  }

  function updateSummary(entries) {
    const released = entries.filter((en) => !en.upcoming);
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
      const coming = entries.find((en) => en.upcoming);
      sub.textContent = coming
        ? "Next up: " + coming.title + (coming.detail ? " · " + coming.detail : "") + " — " + formatDate(coming.date)
        : "";
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
    row.className = "title-row master-row cat-" + entry.cat.id + (entry.upcoming ? " upcoming" : "");
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
    tag.className = "type-tag";
    tag.textContent = entry.cat.short;
    meta.appendChild(tag);
    const where = item.phase ? "Phase " + item.phase : item.group ? item.group.split(" · ")[0] : "";
    meta.appendChild(document.createTextNode((entry.upcoming ? "Coming " + formatDate(entry.date) : formatDate(entry.date)) + (where ? " · " + where : "")));
    info.appendChild(meta);

    row.appendChild(num);
    row.appendChild(info);

    if (entry.upcoming) {
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
      const label = entry.title + (entry.detail ? " · " + entry.detail : "");
      changeSeen(entry.keys, now, (now ? "Watched: " : "Unwatched: ") + label);
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
      const keys = [];
      entries.slice(0, number).forEach((en) => {
        if (!en.upcoming) keys.push(...en.keys);
      });
      changeSeen(keys, true, "Marked #1–#" + number + " as watched");
      render();
    });

    return row;
  }

  function render() {
    buildChips();
    hideSeenBtn.textContent = hideSeen ? "Show Watched" : "Hide Watched";

    const entries = visibleEntries();
    updateSummary(entries);

    const term = searchTerm.trim().toLowerCase();
    masterList.innerHTML = "";
    let currentYear = null;
    let currentList = null;
    let shown = 0;
    const years = [];

    entries.forEach((entry, idx) => {
      if (hideSeen && isSeen(entry)) return;
      if (term && !entry.title.toLowerCase().includes(term) && !entry.item.title.toLowerCase().includes(term)) return;
      shown++;

      const year = entry.date.slice(0, 4);
      if (year !== currentYear) {
        currentYear = year;
        const header = document.createElement("h2");
        header.className = "year-header";
        header.id = "year-" + year;
        header.textContent = year;
        years.push(year);
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
    buildYearBar(years);
  }

  // ---------- Jump to a year ----------
  // A sticky strip of the years in the list; tap one to jump to it. The
  // year you're scrolled to is highlighted as you go.
  function buildYearBar(years) {
    yearBar.innerHTML = "";
    yearBar.hidden = years.length < 2;
    years.forEach((year) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "year-chip";
      btn.dataset.year = year;
      btn.textContent = year;
      btn.addEventListener("click", () => {
        const header = document.getElementById("year-" + year);
        if (header) header.scrollIntoView({ block: "start" });
      });
      yearBar.appendChild(btn);
    });
    updateStickyOffset();
    highlightYear();
  }

  // Keep year headers clear of the sticky navbar + year strip when jumped to.
  function updateStickyOffset() {
    const navbar = document.querySelector(".navbar");
    const navH = navbar ? navbar.offsetHeight : 0;
    yearBar.style.top = navH + "px";
    document.documentElement.style.setProperty("--sticky-offset", navH + yearBar.offsetHeight + 8 + "px");
  }

  let activeYear = null;
  function highlightYear() {
    const limit = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--sticky-offset")) || 0;
    let current = null;
    for (const header of masterList.querySelectorAll(".year-header")) {
      if (header.getBoundingClientRect().top <= limit + 4) current = header.id.slice(5);
      else break;
    }
    if (!current) {
      const first = yearBar.querySelector(".year-chip");
      current = first ? first.dataset.year : null;
    }
    if (current === activeYear && yearBar.querySelector(".year-chip.active")) return;
    activeYear = current;
    yearBar.querySelectorAll(".year-chip").forEach((chip) => {
      const on = chip.dataset.year === current;
      chip.classList.toggle("active", on);
      if (on) {
        // Scroll the strip itself (not the page) so the active year stays visible.
        const left = chip.offsetLeft - (yearBar.clientWidth - chip.offsetWidth) / 2;
        yearBar.scrollTo({ left: Math.max(0, left) });
      }
    });
  }

  let scrollQueued = false;
  window.addEventListener("scroll", () => {
    if (scrollQueued) return;
    scrollQueued = true;
    requestAnimationFrame(() => {
      scrollQueued = false;
      highlightYear();
    });
  }, { passive: true });
  window.addEventListener("resize", updateStickyOffset);

  // ---------- Backup ----------
  // "Back Up" saves every checkmark to a small file (via the share sheet
  // on iPhone, so it can go to Files, iCloud Drive, Mail...). "Restore"
  // reads one back in, replacing what's here (with Undo).
  backupBtn.addEventListener("click", async () => {
    const data = {
      app: "mcu-watch-tracker",
      version: 1,
      exported: new Date().toISOString(),
      seen: seen,
    };
    const name = "mcu-watch-tracker-backup-" + TODAY + ".json";
    const blob = new Blob([JSON.stringify(data, null, 1)], { type: "application/json" });
    const file = typeof File === "function" ? new File([blob], name, { type: "application/json" }) : null;
    if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: "MCU Watch Tracker backup" });
        return;
      } catch (e) {
        if (e && e.name === "AbortError") return; // closed the share sheet
      }
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  });

  restoreBtn.addEventListener("click", () => restoreInput.click());

  restoreInput.addEventListener("change", () => {
    const file = restoreInput.files && restoreInput.files[0];
    restoreInput.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      let incoming;
      try {
        const data = JSON.parse(reader.result);
        incoming = data && data.app === "mcu-watch-tracker" && data.seen;
        if (!incoming || typeof incoming !== "object" || Array.isArray(incoming)) throw new Error("bad");
      } catch (e) {
        alert("That file isn't an MCU Watch Tracker backup.");
        return;
      }
      const keys = Object.keys(incoming).filter((k) => incoming[k] === true);
      const current = Object.keys(seen).length;
      if (!confirm("Replace your current checkmarks (" + current + ") with the ones in this backup (" + keys.length + ")?")) return;
      const before = {};
      new Set([...Object.keys(seen), ...keys]).forEach((k) => {
        const was = !!seen[k];
        const now = incoming[k] === true;
        if (was !== now) before[k] = was;
      });
      Object.keys(seen).forEach((k) => delete seen[k]);
      keys.forEach((k) => (seen[k] = true));
      save();
      render();
      showUndo("Restored " + keys.length + (keys.length === 1 ? " checkmark" : " checkmarks") + " from backup", before);
    };
    reader.readAsText(file);
  });

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
