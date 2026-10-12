(function () {
  "use strict";

  const STORAGE_ORDER = "mcu-tracker:order";
  const STORAGE_HIDE_SEEN = "mcu-tracker:hide-seen";

  const orderSegmented = document.getElementById("order-segmented");
  const progressFill = document.getElementById("progress-fill");
  const progressLabel = document.getElementById("progress-label");
  const upNextEl = document.getElementById("up-next");
  const hideSeenBtn = document.getElementById("hide-seen-toggle");
  const orderList = document.getElementById("order-list");
  const orderNote = document.getElementById("order-note");

  const ORDERS = [
    { id: "everything", label: "Everything", note: "Every film, show, short and episode, in the order it came out, with episodes interleaved by air date (MCU or not), following your MCU Watch Order spreadsheet. Check off a row to mark that whole run of episodes." },
    { id: "release", label: "MCU Release", note: "Just the Marvel Studios films, Disney+ series, specials and shorts, in the order they were released. Tap a series to track it episode by episode." },
    { id: "timeline", label: "MCU Timeline", note: "The MCU in story order, following Disney+'s timeline. Series sit where their first season takes place; alternate-universe titles sit near the end." },
  ];

  const titlesById = {};
  TITLES.forEach((t) => (titlesById[t.id] = t));

  let seen = loadJson(STORAGE_SEEN, {});
  let order = ORDERS.some((o) => o.id === localStorage.getItem(STORAGE_ORDER))
    ? localStorage.getItem(STORAGE_ORDER)
    : "everything";
  let hideSeen = localStorage.getItem(STORAGE_HIDE_SEEN) === "1";

  function save() {
    localStorage.setItem(STORAGE_SEEN, JSON.stringify(seen));
  }

  function episodeRange(a, b) {
    return a === b ? "Episode " + a : "Episodes " + a + "–" + b;
  }

  // Every row on the page is an "entry": what to show, plus the
  // storage keys it covers ({ key, s, e } — s/e only for episodes).
  // A row counts as watched once all of its keys are seen.
  function wholeTitleEntry(item) {
    const keys = [];
    if (item.seasons) {
      item.seasons.forEach((count, sIdx) => {
        for (let e = 1; e <= count; e++) keys.push({ key: episodeKey(item.id, sIdx, e), s: sIdx, e });
      });
    } else {
      keys.push({ key: item.id });
    }
    return { domId: item.id, item, title: item.title, year: item.year, detail: "", keys, opensShow: !!item.seasons };
  }

  function segmentEntry(seg, idx) {
    const item = titlesById[seg.id];
    const extra = seg.x != null ? item.extras[seg.x] : null;
    const prefix = extra ? extraKey(item, seg.x) : item.id;
    const entry = { domId: "seg" + idx, item, title: extra ? extra.title : item.title, keys: [], detail: "" };
    entry.year = seg.y || (extra ? extra.year : item.year);
    if (extra) entry.type = extra.seasons ? "Spin-off" : "TV Movie";

    if (seg.s == null) {
      entry.keys.push({ key: prefix });
      if (extra) entry.detail = "From " + item.title;
      return entry;
    }

    const seasons = extra ? extra.seasons : item.seasons;
    const a = seg.a || 1;
    const b = seg.b || seasons[seg.s];
    for (let e = a; e <= b; e++) entry.keys.push({ key: episodeKey(prefix, seg.s, e), s: seg.s, e });

    const parts = [];
    if (seasons.length > 1) parts.push("Season " + (seg.s + 1));
    if (a !== 1 || b !== seasons[seg.s] || seasons.length === 1) parts.push(episodeRange(a, b));
    else parts.push("All " + seasons[seg.s] + " episodes");
    entry.detail = parts.join(" · ");
    return entry;
  }

  function buildEntries() {
    if (order === "everything") return WATCH_ORDER.map(segmentEntry);
    const items = TITLES.filter(isMcu);
    items.sort(order === "timeline" ? compareTimeline : compareRelease);
    return items.map(wholeTitleEntry);
  }

  function entryState(entry) {
    const seenCount = entry.keys.filter((k) => seen[k.key]).length;
    const all = seenCount === entry.keys.length;
    return { seen: all, partial: seenCount > 0 && !all, seenCount };
  }

  function setEntrySeen(entry, value) {
    entry.keys.forEach((k) => {
      if (value) seen[k.key] = true;
      else delete seen[k.key];
    });
  }

  // "S2 E5" for the first unseen episode in an entry, or "".
  function nextEpisodeLabel(entry) {
    const next = entry.keys.find((k) => !seen[k.key]);
    if (!next || next.e == null) return "";
    return "S" + (next.s + 1) + " E" + next.e;
  }

  function buildSegmented() {
    orderSegmented.innerHTML = "";
    ORDERS.forEach((o) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = o.label;
      if (o.id === order) btn.classList.add("active");
      btn.addEventListener("click", () => {
        order = o.id;
        localStorage.setItem(STORAGE_ORDER, order);
        render();
      });
      orderSegmented.appendChild(btn);
    });
  }

  function renderUpNext(entries) {
    const next = entries.find((en) => !en.item.upcoming && !entryState(en).seen);
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
      const parts = [next.type || typeLabel(next.item)];
      const nextEp = nextEpisodeLabel(next);
      if (nextEp) parts.push(nextEp);
      else if (next.detail) parts.push(next.detail);
      parts.push(next.year);
      sub.textContent = parts.join(" · ");
      upNextEl.onclick = () => {
        const el = document.getElementById("order-" + next.domId);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      };
    }
    upNextEl.appendChild(label);
    upNextEl.appendChild(title);
    upNextEl.appendChild(sub);
  }

  function render() {
    buildSegmented();
    orderNote.textContent = ORDERS.find((o) => o.id === order).note;
    hideSeenBtn.textContent = hideSeen ? "Show Watched" : "Hide Watched";

    const entries = buildEntries();
    renderUpNext(entries);

    orderList.innerHTML = "";
    let shown = 0;
    entries.forEach((entry, idx) => {
      const item = entry.item;
      const state = entryState(entry);
      if (hideSeen && state.seen) return;
      shown++;

      const row = document.createElement("li");
      row.className = "title-row" + (item.upcoming ? " upcoming" : "");
      row.id = "order-" + entry.domId;

      const num = document.createElement("span");
      num.className = "title-year order-num";
      num.textContent = idx + 1;

      const info = document.createElement("span");
      info.className = "title-info";
      const nameEl = document.createElement("div");
      nameEl.className = "title-name" + (state.seen ? " seen" : "");
      nameEl.textContent = entry.title;
      info.appendChild(nameEl);

      if (entry.detail) {
        const detailEl = document.createElement("div");
        detailEl.className = "title-progress";
        detailEl.textContent = entry.detail;
        info.appendChild(detailEl);
      }

      const meta = document.createElement("div");
      meta.className = "title-meta";
      const tag = document.createElement("span");
      const type = entry.type || typeLabel(item);
      tag.className = "type-tag type-" + type.toLowerCase().replace(/\s+/g, "-");
      tag.textContent = type;
      meta.appendChild(tag);
      meta.appendChild(
        // group is e.g. "CBS · 1978–1982" — just the network/studio here.
        document.createTextNode(
          entry.year + (item.phase ? " · Phase " + item.phase : item.group ? " · " + item.group.split(" · ")[0] : "")
        )
      );
      info.appendChild(meta);

      if (item.upcoming) {
        const upEl = document.createElement("div");
        upEl.className = "title-upcoming";
        upEl.textContent = item.upcoming;
        info.appendChild(upEl);
      } else if (entry.keys.length > 1) {
        const prog = document.createElement("div");
        prog.className = "title-progress";
        const nextEp = state.partial ? nextEpisodeLabel(entry) : "";
        prog.textContent =
          state.seenCount + " of " + entry.keys.length + " episodes seen" + (nextEp ? " · Next: " + nextEp : "");
        info.appendChild(prog);
      }

      row.appendChild(num);
      row.appendChild(info);

      if (item.upcoming) {
        const soon = document.createElement("span");
        soon.className = "soon-pill";
        soon.textContent = "Soon";
        row.appendChild(soon);
      } else {
        if (entry.opensShow) {
          const chevron = document.createElement("span");
          chevron.className = "title-chevron";
          chevron.innerHTML = chevronSvg();
          row.appendChild(chevron);
        }
        const check = document.createElement("span");
        check.className = "title-check" + (state.seen ? " checked" : state.partial ? " partial" : "");
        check.innerHTML = checkIconSvg();
        check.addEventListener("click", (ev) => {
          ev.stopPropagation();
          setEntrySeen(entry, !state.seen);
          save();
          render();
        });
        row.appendChild(check);

        // Whole series (MCU orders) open on the main page for
        // episode-by-episode tracking; every other row is one tap.
        row.addEventListener("click", () => {
          if (entry.opensShow) location.href = "index.html?open=" + encodeURIComponent(item.id);
          else check.click();
        });
      }

      orderList.appendChild(row);
    });

    if (shown === 0) {
      const li = document.createElement("li");
      li.className = "empty-state";
      li.textContent = "Nothing left to watch here.";
      orderList.appendChild(li);
    }

    const released = entries.filter((en) => !en.item.upcoming);
    const seenCount = released.filter((en) => entryState(en).seen).length;
    const pct = released.length ? Math.round((seenCount / released.length) * 100) : 0;
    progressFill.style.width = pct + "%";
    progressLabel.textContent = seenCount + " of " + released.length + " seen";
  }

  hideSeenBtn.addEventListener("click", () => {
    hideSeen = !hideSeen;
    localStorage.setItem(STORAGE_HIDE_SEEN, hideSeen ? "1" : "0");
    render();
  });

  render();
})();
