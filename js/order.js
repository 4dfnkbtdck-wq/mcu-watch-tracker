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
    { id: "release", label: "Release", note: "Everything Marvel Studios has put out — films, Disney+ series, specials and shorts — in the order it was released." },
    { id: "timeline", label: "Timeline", note: "The MCU in story order, following Disney+'s timeline. Series sit where their first season takes place; The Fantastic Four: First Steps (a separate universe) sits just before the next Avengers." },
  ];

  let seen = loadJson(STORAGE_SEEN, {});
  let order = localStorage.getItem(STORAGE_ORDER) === "timeline" ? "timeline" : "release";
  let hideSeen = localStorage.getItem(STORAGE_HIDE_SEEN) === "1";

  function save() {
    localStorage.setItem(STORAGE_SEEN, JSON.stringify(seen));
  }

  function mcuTitles() {
    const items = TITLES.filter(isMcu);
    items.sort(order === "timeline" ? compareTimeline : compareRelease);
    return items;
  }

  function buildSegmented() {
    orderSegmented.innerHTML = "";
    ORDERS.forEach((o) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = o.label + " Order";
      if (o.id === order) btn.classList.add("active");
      btn.addEventListener("click", () => {
        order = o.id;
        localStorage.setItem(STORAGE_ORDER, order);
        render();
      });
      orderSegmented.appendChild(btn);
    });
  }

  function detailFor(item) {
    if (!item.seasons) return "";
    const next = findNextEpisode(item.seasons, item.id, seen);
    if (!next) return "";
    return item.seasons.length > 1 || next.episode > 1
      ? "Next: S" + next.season + " E" + next.episode
      : "Start with episode 1";
  }

  function renderUpNext(items) {
    const next = items.find((t) => !t.upcoming && !titleState(t, seen).seen);
    upNextEl.innerHTML = "";
    upNextEl.onclick = null;
    const label = document.createElement("div");
    label.className = "up-next-label";
    label.textContent = "Up Next";
    upNextEl.appendChild(label);

    const title = document.createElement("div");
    title.className = "up-next-title";
    const sub = document.createElement("div");
    sub.className = "up-next-sub";

    if (!next) {
      title.textContent = "You're all caught up!";
      const coming = items.find((t) => t.upcoming);
      sub.textContent = coming ? "Next up: " + coming.title + " — " + coming.upcoming : "";
    } else {
      title.textContent = next.title;
      const parts = [typeLabel(next), next.year];
      const detail = detailFor(next);
      if (detail) parts.push(detail);
      sub.textContent = parts.join(" · ");
      upNextEl.onclick = () => {
        const el = document.getElementById("order-" + next.id);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      };
    }
    upNextEl.appendChild(title);
    upNextEl.appendChild(sub);
  }

  function render() {
    buildSegmented();
    orderNote.textContent = ORDERS.find((o) => o.id === order).note;
    hideSeenBtn.textContent = hideSeen ? "Show Watched" : "Hide Watched";

    const items = mcuTitles();
    renderUpNext(items);

    orderList.innerHTML = "";
    let shown = 0;
    items.forEach((item, idx) => {
      const state = titleState(item, seen);
      if (hideSeen && state.seen) return;
      shown++;

      const row = document.createElement("li");
      row.className = "title-row" + (item.upcoming ? " upcoming" : "");
      row.id = "order-" + item.id;

      const num = document.createElement("span");
      num.className = "title-year order-num";
      num.textContent = idx + 1;

      const info = document.createElement("span");
      info.className = "title-info";
      const nameEl = document.createElement("div");
      nameEl.className = "title-name" + (state.seen ? " seen" : "");
      nameEl.textContent = item.title;
      info.appendChild(nameEl);

      const meta = document.createElement("div");
      meta.className = "title-meta";
      const tag = document.createElement("span");
      tag.className = "type-tag type-" + typeLabel(item).toLowerCase();
      tag.textContent = typeLabel(item);
      meta.appendChild(tag);
      meta.appendChild(document.createTextNode(item.year + " · Phase " + item.phase));
      info.appendChild(meta);

      if (item.upcoming) {
        const upEl = document.createElement("div");
        upEl.className = "title-upcoming";
        upEl.textContent = item.upcoming;
        info.appendChild(upEl);
      } else if (state.stats) {
        const prog = document.createElement("div");
        prog.className = "title-progress";
        const detail = detailFor(item);
        prog.textContent =
          state.stats.seen + " of " + state.stats.total + " episodes seen" + (detail && state.partial ? " · " + detail : "");
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
        if (item.seasons) {
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
          setTitleSeen(item, seen, !state.seen);
          save();
          render();
        });
        row.appendChild(check);

        // Series open on the main page for episode-by-episode
        // tracking; everything else is a single watch.
        row.addEventListener("click", () => {
          if (item.seasons) location.href = "index.html?open=" + encodeURIComponent(item.id);
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

    const released = items.filter((t) => !t.upcoming);
    const seenCount = released.filter((t) => titleState(t, seen).seen).length;
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
