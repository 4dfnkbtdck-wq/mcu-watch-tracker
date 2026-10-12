// Switches between the three views (Master List, By Title, MCU Order),
// which all live on this one page — so changing tabs is instant: no
// page load, each view keeps its own scroll position, and a view is
// only redrawn if checkmarks changed elsewhere since it was last shown.
(function () {
  "use strict";

  const STORAGE_VIEW = "mcu-tracker:view";
  const VIEW_IDS = ["master", "titles", "order"];

  const state = {}; // per view: { version, scrollY } as of when it was last hidden
  let current = null;

  function show(id) {
    if (!VIEW_IDS.includes(id)) id = "master";
    if (id === current) {
      window.scrollTo(0, 0); // tapping the active tab scrolls to top, like iOS
      return;
    }

    if (current) state[current] = { version: seenVersion, scrollY: window.scrollY };

    VIEW_IDS.forEach((v) => {
      document.getElementById("view-" + v).hidden = v !== id;
      const tab = document.querySelector('.tab[data-view="' + v + '"]');
      tab.classList.toggle("active", v === id);
      if (v === id) tab.setAttribute("aria-current", "page");
      else tab.removeAttribute("aria-current");
    });

    const prev = state[id];
    if (!prev || prev.version !== seenVersion) Views[id].render();
    window.scrollTo(0, prev ? prev.scrollY : 0);

    current = id;
    localStorage.setItem(STORAGE_VIEW, id);
    history.replaceState(null, "", "#" + id);
  }

  // Used by MCU Order to open a series on By Title, expanded.
  window.openTitle = function (titleId) {
    show("titles");
    Views.titles.open(titleId);
  };

  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", (ev) => {
      ev.preventDefault();
      show(tab.dataset.view);
    });
  });

  // Old titles.html / order.html links redirect here as #titles / #order,
  // optionally with ?open=<title id>.
  const hash = location.hash.slice(1);
  const openId = new URLSearchParams(location.search).get("open");
  if (openId) {
    history.replaceState(null, "", location.pathname);
    window.openTitle(openId);
  } else {
    show(VIEW_IDS.includes(hash) ? hash : localStorage.getItem(STORAGE_VIEW) || "master");
  }
})();
