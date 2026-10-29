// Общие вещи для всех страниц: бумажный фильтр, бургер-меню, иконки.
(function () {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.REDUCED_MOTION = reduce;

  // SVG-фильтр «рваная бумага» для краёв элементов (url(#roughen) в CSS)
  const defs = document.createElement("div");
  defs.setAttribute("aria-hidden", "true");
  defs.style.cssText = "position:absolute;width:0;height:0;overflow:hidden";
  defs.innerHTML =
    '<svg width="0" height="0"><filter id="roughen" x="-5%" y="-5%" width="110%" height="110%">' +
    '<feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="3" result="n"/>' +
    '<feDisplacementMap in="SourceGraphic" in2="n" scale="3.5" xChannelSelector="R" yChannelSelector="G"/>' +
    "</filter></svg>";
  document.body.prepend(defs);

  // Бургер
  const burger = document.querySelector(".burger");
  const menu = document.getElementById("menu");
  if (burger && menu) {
    const setOpen = (open) => {
      document.documentElement.classList.toggle("menu-open", open);
      burger.setAttribute("aria-expanded", String(open));
      burger.setAttribute("aria-label", open ? "Закрыть меню" : "Открыть меню");
      menu.toggleAttribute("inert", !open);
      if (open) setTimeout(() => menu.querySelector("a")?.focus({ preventScroll: true }), 350);
    };
    menu.setAttribute("inert", "");
    burger.addEventListener("click", () => setOpen(burger.getAttribute("aria-expanded") !== "true"));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && burger.getAttribute("aria-expanded") === "true") { setOpen(false); burger.focus(); }
    });
    menu.addEventListener("click", (e) => { if (e.target.closest("a")) setOpen(false); });
  }

  window.ICON = {
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v12M6 11l6 6 6-6M5 20h14"/></svg>',
    book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 5c3-1 6-1 10 1 4-2 7-2 10-1v14c-3-1-6-1-10 1-4-2-7-2-10-1z"/><path d="M12 6v14"/></svg>',
    zoom: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4M11 8v6M8 11h6"/></svg>',
    prev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
    next: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>'
  };
  window.fillIcons = (root = document) =>
    root.querySelectorAll("[data-icon]").forEach((el) => { el.innerHTML = window.ICON[el.dataset.icon] || ""; });
  window.fillIcons();
})();
