(function () {
  "use strict";

  const STORAGE_CATEGORY = "mcu-tracker:category"; // pre-multi-select: one id
  const STORAGE_CATEGORIES = "mcu-tracker:categories";
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

  // The categories currently shown — any combination, tapped on and off.
  let selectedIds = (function () {
    const ids = loadJson(STORAGE_CATEGORIES, null) || [localStorage.getItem(STORAGE_CATEGORY)];
    const valid = CATEGORIES.map((c) => c.id).filter((id) => ids.includes(id));
    return valid.length ? valid : [CATEGORIES[0].id];
  })();
  // Sort per selection: all-Marvel-Studios selections flip between
  // release and timeline order, the rest between oldest and newest first.
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

  // Timeline order is only offered on a tab where every title has a
  // timeline position (i.e. Marvel Studios titles only).
  function saveSelection() {
    localStorage.setItem(STORAGE_CATEGORIES, JSON.stringify(selectedIds));
  }

  // The current selection as one pseudo-category: { id, name, note, items }.
  function selection() {
    const cats = CATEGORIES.filter((c) => selectedIds.includes(c.id));
    return {
      id: selectedIds.join("+"),
      name: cats.length === CATEGORIES.length ? "every category" : cats.map((c) => c.name).join(" + "),
      note: cats.length === 1 ? cats[0].note : "",
      multi: cats.length > 1,
      items: TITLES.filter((t) => selectedIds.includes(t.cat)),
    };
  }

  function sortModesFor(sel) {
    return sel.items.every((t) => t.t != null) ? ["release", "timeline"] : ["oldest", "newest"];
  }

  function currentSort(sel) {
    const modes = sortModesFor(sel);
    return modes.includes(sortModes[sel.id]) ? sortModes[sel.id] : modes[0];
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

  // One pilot / TV movie / spin-off inside an expanded show.
  function buildExtra(item, extra, xIdx) {
    const key = extraKey(item, xIdx);
    const extraItem = document.createElement("div");
    extraItem.className = "season-block extra-item";

    const noteEl = extra.note ? document.createElement("div") : null;
    if (noteEl) {
      noteEl.className = "extra-note";
      noteEl.textContent = extra.note;
    }

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
      if (noteEl) extraItem.appendChild(noteEl);
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
      if (noteEl) extraItem.appendChild(noteEl);
    }
    return extraItem;
  }

  // Seasons in order, with each extra slotted in after the season its
  // "after" field names (before season 1 for -1, at the end if unset).
  function buildPanel(item) {
    const panel = document.createElement("li");
    panel.className = "seasons-panel";
    const seasons = item.seasons || [];
    const extras = item.extras || [];

    const addExtrasAfter = (pos) => {
      extras.forEach((extra, xIdx) => {
        const after = extra.after == null ? seasons.length - 1 : extra.after;
        if (after === pos) panel.appendChild(buildExtra(item, extra, xIdx));
      });
    };

    addExtrasAfter(-1);
    seasons.forEach((count, sIdx) => {
      panel.appendChild(buildSeasonBlock("Season " + (sIdx + 1), count, item.id, sIdx));
      addExtrasAfter(sIdx);
    });

    return panel;
  }

  // Category buttons toggle on and off (at least one stays on); "All"
  // turns every category on.
  function buildSegmented() {
    categorySegmented.innerHTML = "";
    const addButton = (label, active, onClick, catId) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = label;
      if (catId) btn.className = "cat-" + catId;
      if (active) btn.classList.add("active");
      btn.setAttribute("aria-pressed", String(active));
      btn.addEventListener("click", () => {
        onClick();
        saveSelection();
        render();
      });
      categorySegmented.appendChild(btn);
    };

    addButton("All", selectedIds.length === CATEGORIES.length, () => {
      selectedIds = CATEGORIES.map((c) => c.id);
    });
    CATEGORIES.forEach((cat) => {
      const on = selectedIds.includes(cat.id);
      addButton(cat.short, on, () => {
        if (on && selectedIds.length === 1) return;
        selectedIds = CATEGORIES.map((c) => c.id).filter((id) => (id === cat.id ? !on : selectedIds.includes(id)));
      }, cat.id);
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
    const cat = selection();
    const sort = currentSort(cat);
    sortToggle.textContent = SORT_LABELS[sort];

    if (cat.note) {
      categoryNote.textContent = cat.note;
      categoryNote.classList.remove("hidden");
    } else {
      categoryNote.classList.add("hidden");
    }

    let items = cat.items.slice().sort(compareRelease);
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
        "title-row" +
        (isExpanded ? " expanded" : "") +
        (isUpcoming(item) ? " upcoming" : "") +
        // With several categories showing, colour-code rows like the Master List.
        (cat.multi ? " typed-row cat-" + item.cat : "");
      row.id = "title-" + item.id;
      if (!isUpcoming(item)) {
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
      if (meta || cat.multi) {
        const metaEl = document.createElement("div");
        metaEl.className = "title-meta";
        if (cat.multi) {
          const tag = document.createElement("span");
          tag.className = "type-tag";
          tag.textContent = getCategory(item.cat).short;
          metaEl.appendChild(tag);
        }
        metaEl.appendChild(document.createTextNode(meta));
        info.appendChild(metaEl);
      }

      if (isUpcoming(item)) {
        const upEl = document.createElement("div");
        upEl.className = "title-upcoming";
        upEl.textContent = upcomingLabel(item);
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

      if (isUpcoming(item)) {
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
    const released = cat.items.filter((t) => !isUpcoming(t));
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
    const cat = selection();
    const modes = sortModesFor(cat);
    sortModes[cat.id] = modes[(modes.indexOf(currentSort(cat)) + 1) % modes.length];
    localStorage.setItem(STORAGE_SORT, JSON.stringify(sortModes));
    render();
  });

  markAllBtn.addEventListener("click", () => {
    const cat = selection();
    if (!confirm("Mark everything in " + cat.name + " as seen?")) return;
    cat.items
      .filter((t) => !isUpcoming(t))
      .forEach((t) => setTitleSeen(t, seen, true));
    save();
    render();
  });

  clearAllBtn.addEventListener("click", () => {
    const cat = selection();
    if (!confirm("Clear every checkmark in " + cat.name + "?")) return;
    cat.items.forEach((t) => setTitleSeen(t, seen, false));
    save();
    render();
  });

  // Jump straight to one title (e.g. tapping a series on MCU Order):
  // selects its tab, searches for it, expands it, and scrolls to it.
  function open(id) {
    const item = TITLES.find((t) => t.id === id);
    if (!item) return;
    if (!selectedIds.includes(item.cat)) {
      selectedIds = [item.cat];
      saveSelection();
    }
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
