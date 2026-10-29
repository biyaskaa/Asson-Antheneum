// Читалка: PDF постранично, с перелистыванием и сохранением места.
(function () {
  const pdfjsLib = window.pdfjsLib || window["pdfjs-dist/build/pdf"];
  const books = window.BOOKS || [];
  const reduce = window.REDUCED_MOTION;
  const $ = (id) => document.getElementById(id);
  const desk = $("desk"), spread = $("spread"), status = $("status");
  const select = $("bookSelect"), range = $("pageRange"), out = $("pageOut");
  const prevBtn = $("prevBtn"), nextBtn = $("nextBtn"), titleEl = $("bookTitle");

  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* без сохранения */ } }
  };

  if (!pdfjsLib) { status.textContent = "Не удалось загрузить читалку. Обновите страницу."; return; }
  pdfjsLib.GlobalWorkerOptions.workerSrc = "assets/vendor/pdfjs/pdf.worker.js";

  let book = null, doc = null, page = 1, total = 1, isSpread = false, busy = false, token = 0, loadId = 0, zoom = 1;
  const zoomBtn = $("zoomBtn");

  books.forEach((b) => {
    const o = document.createElement("option");
    o.value = b.slug;
    o.textContent = `${b.krc} — ${b.author}`;
    select.appendChild(o);
  });

  function setStatus(html) { status.innerHTML = html || ""; status.hidden = !html; }

  function chooseMode() {
    isSpread = desk.clientWidth >= 1000 && desk.clientWidth / Math.max(desk.clientHeight, 1) > 1.25;
  }
  // в развороте левая страница всегда нечётная
  const norm = (n) => {
    n = Math.min(Math.max(1, n), total);
    return isSpread && n % 2 === 0 ? n - 1 : n;
  };
  const step = () => (isSpread ? 2 : 1);

  async function load(slug) {
    const id = ++loadId;
    book = books.find((b) => b.slug === slug) || books[0];
    if (!book) return;
    select.value = book.slug;
    titleEl.innerHTML = "<span></span><small></small>";
    titleEl.firstChild.textContent = book.krc;
    titleEl.lastChild.textContent = `${book.author}, «${book.ru}»`;
    document.title = `${book.krc} — читать онлайн — Asson-Antheneum`;
    store.set("asson:last", book.slug);
    const url = new URL(location.href);
    url.searchParams.set("book", book.slug);
    history.replaceState(null, "", url);

    spread.innerHTML = "";
    setStatus("Открываю книгу…");
    try {
      if (doc) { doc.destroy(); doc = null; }
      const d = await pdfjsLib.getDocument({
        url: `pdf/${book.slug}.pdf`,
        standardFontDataUrl: "assets/vendor/pdfjs/standard_fonts/"
      }).promise;
      if (id !== loadId) { d.destroy(); return; }
      doc = d;
      total = doc.numPages;
      range.max = String(total);
      if (zoom === 1) chooseMode();
      page = norm(parseInt(store.get("asson:page:" + book.slug), 10) || 1);
      setStatus("");
      await render(0);
    } catch (e) {
      if (id !== loadId) return;
      setStatus(`Не удалось открыть книгу.<br><a href="pdf/${book.slug}.pdf" download>Скачать PDF</a>`);
    }
  }

  async function drawPage(n, maxW, maxH) {
    const p = await doc.getPage(n);
    const base = p.getViewport({ scale: 1 });
    const scale = Math.min(maxW / base.width, maxH / base.height);
    const vp = p.getViewport({ scale });
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    const c = document.createElement("canvas");
    c.width = Math.floor(vp.width * dpr);
    c.height = Math.floor(vp.height * dpr);
    c.style.width = Math.floor(vp.width) + "px";
    c.style.height = Math.floor(vp.height) + "px";
    await p.render({ canvasContext: c.getContext("2d"), viewport: vp, transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : null }).promise;
    return c;
  }

  function snapshot(canvas) {
    const c = document.createElement("canvas");
    c.width = canvas.width; c.height = canvas.height;
    c.style.width = canvas.style.width; c.style.height = canvas.style.height;
    c.getContext("2d").drawImage(canvas, 0, 0);
    return c;
  }

  // dir: 1 вперёд, -1 назад, 0 без анимации
  async function render(dir) {
    if (!doc) return;
    const my = ++token;
    const fitW = desk.clientWidth - 2 * parseFloat(getComputedStyle(desk).paddingLeft);
    const availW = zoom > 1 ? Math.min(fitW * zoom, 1000) : fitW;
    const availH = zoom > 1 ? Infinity : desk.clientHeight - 24;
    const nums = isSpread ? [page, page + 1].filter((n) => n <= total) : [page];
    const perW = isSpread ? availW / 2 : availW;

    // что переворачиваем: старая правая страница (вперёд) или левая (назад)
    const oldPgs = [...spread.querySelectorAll(".pg canvas")];
    const turning = dir === 0 || reduce || zoom > 1 || !oldPgs.length ? null : dir > 0 ? oldPgs[oldPgs.length - 1] : oldPgs[0];
    let turnRect = null, snap = null;
    if (turning) {
      snap = snapshot(turning);
      const r = turning.getBoundingClientRect(), sr = spread.getBoundingClientRect();
      turnRect = { left: r.left - sr.left, width: r.width, height: r.height };
    }

    const canvases = await Promise.all(nums.map((n) => drawPage(n, perW, availH)));
    if (my !== token) return;

    spread.classList.toggle("single", nums.length === 1);
    spread.innerHTML = "";
    canvases.forEach((c, i) => {
      const pg = document.createElement("div");
      pg.className = "pg" + (nums.length === 2 ? (i === 0 ? " pg--l" : " pg--r") : "");
      pg.appendChild(c);
      spread.appendChild(pg);
    });

    if (snap && turnRect) {
      const t = document.createElement("div");
      t.className = "turn";
      t.style.width = turnRect.width + "px";
      t.style.height = turnRect.height + "px";
      // если ширина разворота изменилась, ставим лист у корешка
      const sw = spread.getBoundingClientRect().width;
      const left = isSpread ? (dir > 0 ? sw / 2 : sw / 2 - turnRect.width) : (sw - turnRect.width) / 2;
      t.style.left = left + "px";
      t.style.transformOrigin = dir > 0 ? "0 50%" : "100% 50%";
      const shade = document.createElement("div");
      shade.className = "shade";
      t.append(snap, shade);
      spread.appendChild(t);
      const endAngle = isSpread ? (dir > 0 ? -180 : 180) : dir > 0 ? -110 : 110;
      const anim = t.animate(
        [{ transform: "rotateY(0deg)", opacity: 1 }, { transform: `rotateY(${endAngle * 0.5}deg)`, opacity: 1, offset: 0.6 }, { transform: `rotateY(${endAngle}deg)`, opacity: isSpread ? 1 : 0 }],
        { duration: 650, easing: "cubic-bezier(.45,.05,.35,1)" }
      );
      shade.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 400, fill: "forwards" });
      anim.onfinish = () => t.remove();
    }

    store.set("asson:page:" + book.slug, String(page));
    updateUI();
  }

  function updateUI() {
    const last = isSpread ? Math.min(page + 1, total) : page;
    out.textContent = last !== page ? `${page}–${last} / ${total}` : `${page} / ${total}`;
    range.value = String(page);
    prevBtn.disabled = page <= 1;
    nextBtn.disabled = page + step() > total;
  }

  async function go(n, dir) {
    if (!doc || busy) return;
    const target = norm(n);
    if (target === page) { updateUI(); return; }
    busy = true;
    page = target;
    try { await render(dir); } finally { busy = false; }
  }
  const next = () => go(page + step(), 1);
  const prev = () => go(page - step(), -1);

  prevBtn.addEventListener("click", prev);
  nextBtn.addEventListener("click", next);
  $("zonePrev").addEventListener("click", prev);
  $("zoneNext").addEventListener("click", next);
  range.addEventListener("input", () => { out.textContent = `${range.value} / ${total}`; });
  range.addEventListener("change", () => { const n = parseInt(range.value, 10); go(n, n > page ? 1 : -1); });
  select.addEventListener("change", () => load(select.value));
  document.addEventListener("keydown", (e) => {
    if (e.target.closest("select, input, textarea")) return;
    if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") { e.preventDefault(); next(); }
    else if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); prev(); }
    else if (e.key === "Home") go(1, -1);
    else if (e.key === "End") go(total, 1);
  });

  // свайп на телефоне
  let sx = null, sy = null;
  desk.addEventListener("pointerdown", (e) => { if (e.pointerType !== "mouse") { sx = e.clientX; sy = e.clientY; } });
  desk.addEventListener("pointerup", (e) => {
    if (sx === null) return;
    const dx = e.clientX - sx, dy = e.clientY - sy;
    sx = null;
    if (zoom === 1 && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.3) (dx < 0 ? next : prev)();
  });

  zoomBtn.addEventListener("click", () => {
    // на телефоне — крупнее экрана с прокруткой, на компьютере — по ширине
    zoom = zoom > 1 ? 1 : desk.clientWidth < 700 ? 1.8 : 1.0001;
    const on = zoom > 1;
    // увеличение: страница по ширине экрана, дальше прокрутка вниз
    if (on) { isSpread = false; page = norm(page); } else chooseMode();
    desk.classList.toggle("zoomed", on);
    zoomBtn.setAttribute("aria-pressed", String(on));
    zoomBtn.setAttribute("aria-label", on ? "Уменьшить страницу" : "Увеличить страницу");
    render(0).then(() => { desk.scrollTop = 0; });
  });

  let rt;
  window.addEventListener("resize", () => {
    clearTimeout(rt);
    rt = setTimeout(() => { if (zoom === 1) chooseMode(); page = norm(page); render(0); }, 200);
  });

  const params = new URLSearchParams(location.search);
  load(params.get("book") || store.get("asson:last") || (books[0] && books[0].slug));
})();
