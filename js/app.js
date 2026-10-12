(function () {
  "use strict";

  const STORAGE_CATEGORY = "mcu-tracker:category";
  const STORAGE_SORT = "mcu-tracker:sort";
  const STORAGE_EXPANDED = "mcu-tracker:expanded";

  const categorySegmented = document.getElementById("category-segmented");
  const progressFill = document.getElementById("t-progress-fill");
  const progressLabel = document.getElementById("t-progress-label");
  const searchInput = document.getElementById("t-search");
  const sortToggle = document.getElementById("sort-toggle");
  const markAllBtn = document.getElementById("mark-all-seen");
  const clearAllBtn = document.getElementById("clear-all-seen");
  const titlesList = document.getElementById("titles-list");
  const categoryNote = document.getElementById("category-note");

  let currentCategoryId = localStorage.getItem(STORAGE_CATEGORY) || CATEGORIES[0].id;
  // Per-tab sort: MCU tabs flip between release and timeline order,
  // the others between oldest and newest first.
  let sortModes = loadJson(STORAGE_SORT, {});
  let searchTerm = "";
  let expanded = new Set(loadJson(STORAGE_EXPANDED, []));

  function save() {
    saveSeen();
  }

  function saveExpanded() {
    localStorage.setItem(STORAGE_EXPANDED, JSON.stringify(Array.from(expanded)));
  }

  function toggleKey(key) {
    if (seen[key]) delete seen[key];
    else seen[key] = true;
    save();
    render();
  }

  function sortModesFor(cat) {
    return cat.mcu ? ["release", "timeline"] : ["oldest", "newest"];
  }

  function currentSort(cat) {
    const modes = sortModesFor(cat);
    return modes.includes(sortModes[cat.id]) ? sortModes[cat.id] : modes[0];
  }

  const SORT_LABELS = {
    release: "Release Order",
    timeline: "Timeline Order",
    oldest: "Oldest First",
    newest: "Newest First",
  };

  function makeCheck(className, state) {
    const check = document.createElement("span");
    check.className = className + (state.seen ? " checked" : state.partial ? " partial" : "");
    check.innerHTML = checkIconSvg();
    return check;
  }

  // One season's header (tap to mark the whole season) plus its
  // episode-chip grid. prefix is the key prefix its episodes share —
  // the title's id, or an extra's key for a spin-off with seasons.
  function buildSeasonBlock(label, count, prefix, sIdx) {
    let seasonSeen = 0;
    for (let e = 1; e <= count; e++) {
      if (seen[episodeKey(prefix, sIdx, e)]) seasonSeen++;
    }
    const allSeen = seasonSeen === count && count > 0;

    const block = document.createElement("div");
    block.className = "season-block";

    const header = document.createElement("div");
    header.className = "season-header";
    header.setAttribute("role", "checkbox");
    header.setAttribute("aria-checked", String(allSeen));

    const textWrap = document.createElement("span");
    textWrap.className = "season-header-text";
    const title = document.createElement("span");
    title.className = "season-header-title";
    title.textContent = label;
    const countEl = document.createElement("span");
    countEl.className = "season-header-count";
    countEl.textContent = seasonSeen + " / " + count;
    textWrap.appendChild(title);
    textWrap.appendChild(countEl);

    const seasonCheck = makeCheck("title-check season-check", {
      seen: allSeen,
      partial: seasonSeen > 0 && !allSeen,
    });
    seasonCheck.title = allSeen ? "Mark season unseen" : "Mark whole season seen";

    header.appendChild(textWrap);
    header.appendChild(seasonCheck);
    header.addEventListener("click", () => {
      for (let e = 1; e <= count; e++) {
        const key = episodeKey(prefix, sIdx, e);
        if (allSeen) delete seen[key];
        else seen[key] = true;
      }
      save();
      render();
    });
    block.appendChild(header);

    const grid = document.createElement("div");
    grid.className = "episode-grid";
    for (let e = 1; e <= count; e++) {
      const key = episodeKey(prefix, sIdx, e);
      const chip = document.createElement("span");
      chip.className = "episode-chip" + (seen[key] ? " seen" : "");
      chip.textContent = e;
      chip.title = label + " · E" + e;
      chip.addEventListener("click", () => toggleKey(key));
      grid.appendChild(chip);
    }
    block.appendChild(grid);

    return block;
  }

  function buildPanel(item) {
    const panel = document.createElement("li");
    panel.className = "seasons-panel";

    if (item.seasons) {
      item.seasons.forEach((count, sIdx) => {
        panel.appendChild(buildSeasonBlock("Season " + (sIdx + 1), count, item.id, sIdx));
      });
    }

    if (item.extras && item.extras.length) {
      const extrasBlock = document.createElement("div");
      extrasBlock.className = "season-block";

      const heading = document.createElement("div");
      heading.className = "season-header-title extras-heading";
      heading.textContent = "Pilots, Movies & Spin-offs";
      extrasBlock.appendChild(heading);

      item.extras.forEach((extra, xIdx) => {
        const key = extraKey(item, xIdx);
        const extraItem = document.createElement("div");
        extraItem.className = "extra-item";

        if (extra.seasons) {
          const stats = seasonStats(extra.seasons, key, seen);
          const titleEl = document.createElement("div");
          titleEl.className = "extra-title spinoff-title";
          titleEl.textContent = extra.title + " (" + extra.year + ")";
          extraItem.appendChild(titleEl);

          const prog = document.createElement("div");
          prog.className = "extra-note";
          prog.textContent = stats.seen + " of " + stats.total + " episodes seen";
          extraItem.appendChild(prog);
          if (extra.note) {
            const noteEl = document.createElement("div");
            noteEl.className = "extra-note";
            noteEl.textContent = extra.note;
            extraItem.appendChild(noteEl);
          }
          extra.seasons.forEach((count, sIdx) => {
            const label = extra.seasons.length > 1 ? "Season " + (sIdx + 1) : "Episodes";
            extraItem.appendChild(buildSeasonBlock(label, count, key, sIdx));
          });
        } else {
          const isExtraSeen = !!seen[key];
          const row = document.createElement("div");
          row.className = "extra-row";
          row.setAttribute("role", "checkbox");
          row.setAttribute("aria-checked", String(isExtraSeen));

          const titleEl = document.createElement("span");
          titleEl.className = "extra-title" + (isExtraSeen ? " seen" : "");
          titleEl.textContent = extra.title + " (" + extra.year + ")";
          row.appendChild(titleEl);
          row.appendChild(makeCheck("title-check", { seen: isExtraSeen, partial: false }));
          row.addEventListener("click", () => toggleKey(key));
          extraItem.appendChild(row);

          if (extra.note) {
            const noteEl = document.createElement("div");
            noteEl.className = "extra-note";
            noteEl.textContent = extra.note;
            extraItem.appendChild(noteEl);
          }
        }
        extrasBlock.appendChild(extraItem);
      });
      panel.appendChild(extrasBlock);
    }

    return panel;
  }

  function buildSegmented() {
    categorySegmented.innerHTML = "";
    CATEGORIES.forEach((cat) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = cat.short;
      if (cat.id === currentCategoryId) btn.classList.add("active");
      btn.addEventListener("click", () => {
        currentCategoryId = cat.id;
        localStorage.setItem(STORAGE_CATEGORY, currentCategoryId);
        searchInput.value = "";
        searchTerm = "";
        render();
      });
      categorySegmented.appendChild(btn);
    });
  }

  function metaText(item) {
    const parts = [];
    if (item.phase) parts.push("Phase " + item.phase);
    if (item.kind) parts.push(item.kind);
    if (item.group) parts.push(item.group);
    if (item.seasons) {
      const eps = item.seasons.reduce((a, b) => a + b, 0);
      parts.push(
        (item.seasons.length > 1 ? item.seasons.length + " seasons · " : "") + eps + " episodes"
      );
    }
    return parts.join(" · ");
  }

  function render() {
    buildSegmented();
    const cat = getCategory(currentCategoryId);
    const sort = currentSort(cat);
    sortToggle.textContent = SORT_LABELS[sort];

    if (cat.note) {
      categoryNote.textContent = cat.note;
      categoryNote.classList.remove("hidden");
    } else {
      categoryNote.classList.add("hidden");
    }

    let items = titlesIn(cat.id);
    if (sort === "timeline") items.sort(compareTimeline);
    else if (sort === "newest") items.reverse();

    const term = searchTerm.trim().toLowerCase();
    if (term) {
      items = items.filter(
        (t) =>
          t.title.toLowerCase().includes(term) ||
          String(t.year).includes(term) ||
          (t.group && t.group.toLowerCase().includes(term)) ||
          (t.phase && ("phase " + t.phase).includes(term))
      );
    }

    titlesList.innerHTML = "";

    if (items.length === 0) {
      const li = document.createElement("li");
      li.className = "empty-state";
      li.textContent = "No matches.";
      titlesList.appendChild(li);
    }

    items.forEach((item) => {
      const expandable = !!(item.seasons || item.extras);
      const isExpanded = expandable && expanded.has(item.id);
      const state = titleState(item, seen);

      const row = document.createElement("li");
      row.className =
        "title-row" + (isExpanded ? " expanded" : "") + (item.upcoming ? " upcoming" : "");
      row.id = "title-" + item.id;
      if (!item.upcoming) {
        row.setAttribute("role", "checkbox");
        row.setAttribute("aria-checked", String(state.seen));
      }

      const year = document.createElement("span");
      year.className = "title-year";
      year.textContent = item.year;

      const info = document.createElement("span");
      info.className = "title-info";
      const nameEl = document.createElement("div");
      nameEl.className = "title-name" + (state.seen ? " seen" : "");
      nameEl.textContent = item.title;
      info.appendChild(nameEl);

      const meta = metaText(item);
      if (meta) {
        const metaEl = document.createElement("div");
        metaEl.className = "title-meta";
        metaEl.textContent = meta;
        info.appendChild(metaEl);
      }

      if (item.upcoming) {
        const upEl = document.createElement("div");
        upEl.className = "title-upcoming";
        upEl.textContent = item.upcoming;
        info.appendChild(upEl);
      } else if (state.stats) {
        const prog = document.createElement("div");
        prog.className = "title-progress";
        prog.textContent = state.stats.seen + " of " + state.stats.total + " episodes seen";
        info.appendChild(prog);
      }

      if (item.note) {
        const noteEl = document.createElement("div");
        noteEl.className = "title-note";
        noteEl.textContent = item.note;
        info.appendChild(noteEl);
      }

      row.appendChild(year);
      row.appendChild(info);

      if (expandable) {
        const chevron = document.createElement("span");
        chevron.className = "title-chevron";
        chevron.innerHTML = chevronSvg();
        row.appendChild(chevron);
      }

      if (item.upcoming) {
        const soon = document.createElement("span");
        soon.className = "soon-pill";
        soon.textContent = "Soon";
        row.appendChild(soon);
      } else {
        const check = makeCheck("title-check", state);
        check.addEventListener("click", (ev) => {
          ev.stopPropagation();
          setTitleSeen(item, seen, !state.seen);
          save();
          render();
        });
        row.appendChild(check);

        row.addEventListener("click", () => {
          if (!expandable) {
            check.click();
            return;
          }
          if (expanded.has(item.id)) expanded.delete(item.id);
          else expanded.add(item.id);
          saveExpanded();
          render();
        });
      }

      titlesList.appendChild(row);
      if (isExpanded) titlesList.appendChild(buildPanel(item));
    });

    updateProgress(cat);
  }

  function updateProgress(cat) {
    const released = titlesIn(cat.id).filter((t) => !t.upcoming);
    const seenCount = released.filter((t) => titleState(t, seen).seen).length;
    const pct = released.length ? Math.round((seenCount / released.length) * 100) : 0;
    progressFill.style.width = pct + "%";
    progressLabel.textContent = seenCount + " of " + released.length + " seen";
  }

  searchInput.addEventListener("input", (e) => {
    searchTerm = e.target.value;
    render();
  });

  sortToggle.addEventListener("click", () => {
    const cat = getCategory(currentCategoryId);
    const modes = sortModesFor(cat);
    sortModes[cat.id] = modes[(modes.indexOf(currentSort(cat)) + 1) % modes.length];
    localStorage.setItem(STORAGE_SORT, JSON.stringify(sortModes));
    render();
  });

  markAllBtn.addEventListener("click", () => {
    const cat = getCategory(currentCategoryId);
    if (!confirm("Mark everything in " + cat.name + " as seen?")) return;
    titlesIn(cat.id)
      .filter((t) => !t.upcoming)
      .forEach((t) => setTitleSeen(t, seen, true));
    save();
    render();
  });

  clearAllBtn.addEventListener("click", () => {
    const cat = getCategory(currentCategoryId);
    if (!confirm("Clear every checkmark in " + cat.name + "?")) return;
    titlesIn(cat.id).forEach((t) => setTitleSeen(t, seen, false));
    save();
    render();
  });

  // Jump straight to one title (e.g. tapping a series on MCU Order):
  // selects its tab, searches for it, expands it, and scrolls to it.
  function open(id) {
    const item = TITLES.find((t) => t.id === id);
    if (!item) return;
    currentCategoryId = item.cat;
    localStorage.setItem(STORAGE_CATEGORY, currentCategoryId);
    searchTerm = item.title;
    searchInput.value = searchTerm;
    if (item.seasons || item.extras) {
      expanded.add(item.id);
      saveExpanded();
    }
    render();
    const el = document.getElementById("title-" + id);
    if (el) el.scrollIntoView({ block: "center" });
  }

  Views.titles = { render, open };
})();
