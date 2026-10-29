// Главная: бумажный остров и полка.
// Производительность: каждый слой сцены — отдельный <svg>, его фильтры считаются
// один раз, а двигается он целиком CSS-трансформом на видеокарте. Анимация
// останавливается, когда заставка не на экране или вкладка скрыта.
(function () {
  const NS = "http://www.w3.org/2000/svg";
  const reduce = window.REDUCED_MOTION;
  const books = window.BOOKS || [];
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const small = window.matchMedia("(max-width: 760px)").matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = (t) => 1 - Math.pow(1 - t, 3);
  const easeIO = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  function el(tag, attrs, parent) {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    parent && parent.appendChild(n);
    return n;
  }

  // кучевое облако: горка бумажных кругов в три тона (тень, блик по краю, тело)
  function addCloud(parent, cx, cy, w, h, pal) {
    const g = el("g", {}, parent);
    const puffs = [];
    for (let row = 0; row < 3; row++) {
      const rowW = w * (1 - row * 0.3);
      const n = 6 - row * 2 + Math.floor(rnd() * 2);
      const baseR = (h / 2.2) * (1 - row * 0.18);
      for (let i = 0; i < n; i++) {
        const fx = n === 1 ? 0.5 : i / (n - 1);
        const x = cx - rowW / 2 + fx * rowW + (rnd() - 0.5) * baseR * 0.5;
        const dome = Math.sin(fx * Math.PI);
        const y = cy - row * h * 0.28 - dome * h * 0.12 + (rnd() - 0.5) * 8;
        puffs.push([x, y, baseR * (0.65 + dome * 0.45 + rnd() * 0.2)]);
      }
    }
    el("rect", { x: cx - w / 2 - h * 0.15, y: cy, width: w + h * 0.3, height: h * 0.22, rx: h * 0.11, fill: pal[0] }, g);
    puffs.forEach(([x, y, r]) => el("circle", { cx: x - r * 0.1, cy: y + r * 0.16, r, fill: pal[0] }, g));
    puffs.forEach(([x, y, r]) => el("circle", { cx: x + r * 0.1, cy: y - r * 0.1, r: r * 0.95, fill: pal[2] }, g));
    puffs.forEach(([x, y, r]) => el("circle", { cx: x - r * 0.04, cy: y + r * 0.02, r: r * 0.93, fill: pal[1] }, g));
  }

  const letters = [];
  function buildScene() {
    const stars = document.getElementById("stars");
    for (let i = 0; i < 60; i++) {
      el("circle", { cx: (rnd() * 1800 - 100).toFixed(0), cy: (rnd() * 520 - 60).toFixed(0), r: (0.6 + rnd() * 1.6).toFixed(1), fill: "#ece6d3", opacity: (0.3 + rnd() * 0.6).toFixed(2) }, stars);
    }
    const far = document.getElementById("cloudsFar");
    [[170, 330, 380, 150], [600, 230, 260, 100], [1180, 260, 460, 160], [1540, 380, 340, 130]].forEach((c) => addCloud(far, ...c, ["#2e2842", "#5b4458", "#b97c66"]));
    const mid = document.getElementById("cloudsMid");
    [[1270, 660, 680, 380], [1540, 520, 420, 280], [120, 720, 520, 260], [1010, 450, 300, 160]].forEach((c) => addCloud(mid, ...c, ["#46303f", "#8c5a55", "#f3b47c"]));
    const near = document.getElementById("cloudsNear");
    [[100, 1080, 760, 360], [880, 1150, 900, 340], [1580, 1070, 700, 380]].forEach((c) => addCloud(near, ...c, ["#1d1a2b", "#352a3d", "#8a5a52"]));

    // буквы карачаево-балкарского алфавита кружат у книги (без фильтров — дёшево)
    const lg = document.getElementById("letters");
    const glyphs = small ? ["Къ", "Гъ", "Нг", "Ў", "Ж"] : ["Къ", "Гъ", "Нг", "Ў", "Ж", "Ч", "А", "Ё"];
    glyphs.forEach((t, i) => {
      const g = el("g", {}, lg);
      el("rect", { x: -15, y: -17, width: 34, height: 38, rx: 3, fill: "#0b0d18", opacity: ".35" }, g);
      el("rect", { x: -17, y: -20, width: 34, height: 38, rx: 3, fill: "#ece6d3" }, g);
      const tx = el("text", { y: 9, fill: "#1b2033" }, g);
      tx.textContent = t;
      letters.push({ g, a: (i / glyphs.length) * Math.PI * 2, r: 110 + (i % 3) * 30, s: 0.25 + (i % 4) * 0.06, lift: i * 12 });
    });
  }

  const hero = document.querySelector(".hero");
  const scene = document.getElementById("scene");
  let layers = [], boilFrames = [], boilIdx = 0;

  // «Запекаем» каждый слой с фильтрами в картинку: браузер растеризует её один раз,
  // и дальше сдвигает готовый битмап, не пересчитывая бумажные фильтры каждый кадр.
  function bake() {
    const defs = scene.querySelector("defs");
    const toBake = [...scene.querySelectorAll("svg.lyr, #islandArt")];
    // на узком экране сдвигаем кадр, чтобы остров стоял по центру
    if (small) {
      toBake.forEach((v) => v.setAttribute("viewBox", "-60 0 1600 1000"));
      // остров «отдаляем» через viewBox, а не масштабом слоя — так края не обрезаются
      const z = 1 / clamp((innerWidth / innerHeight) / 0.85, 0.55, 1);
      const vb = `${(740 - 800 * z).toFixed(0)} ${(600 - 600 * z).toFixed(0)} ${(1600 * z).toFixed(0)} ${(1000 * z).toFixed(0)}`;
      [scene.querySelector("#islandArt"), scene.querySelector(".frame--letters")].forEach((v) => v && v.setAttribute("viewBox", vb));
    }
    for (let i = 0; i < toBake.length; i++) {
      const svg = toBake[i];
      // у острова три кадра с разным шумом краёв — «кипящая» бумага, как в стоп-моушене
      if (svg.id === "islandArt" && !small && !reduce) {
        [1, 2].forEach((k) => {
          const v = svg.cloneNode(true);
          v.id = "";
          v.querySelector("g").setAttribute("filter", `url(#boil${k})`);
          v.setAttribute("class", "frame");
          svg.after(v);
          toBake.push(v);
        });
      }
      const clone = svg.cloneNode(true);
      clone.removeAttribute("class"); clone.removeAttribute("id"); clone.removeAttribute("aria-hidden");
      clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
      clone.insertBefore(defs.cloneNode(true), clone.firstChild);
      const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(clone)], { type: "image/svg+xml" }));
      const img = new Image();
      img.alt = "";
      img.decoding = "async";
      img.className = svg.getAttribute("class");
      for (const k in svg.dataset) img.dataset[k] = svg.dataset[k];
      img.src = url;
      svg.replaceWith(img);
    }
  }
  const island = document.getElementById("island");
  const title = document.getElementById("heroTitle");
  const chars = title ? [...title.querySelectorAll(".ch")] : [];
  const aside = document.getElementById("heroAside");

  let mx = 0, my = 0, cmx = 0, cmy = 0;
  const baseScale = 1;
  if (finePointer && !reduce) {
    window.addEventListener("pointermove", (e) => {
      mx = (e.clientX / innerWidth) * 2 - 1;
      my = (e.clientY / innerHeight) * 2 - 1;
    }, { passive: true });
  }

  let visible = true, running = false, lastStep = -1, introDone = reduce;
  const written = new Map(); // пишем стиль, только если он изменился
  const put = (n, v) => { if (written.get(n) !== v) { written.set(n, v); n.style.transform = v; } };
  const t0 = performance.now();

  function frame(now) {
    running = false;
    if (!visible || document.hidden) return;
    const t = (now - t0) / 1000;
    const step = Math.floor(t * 10); // 10 кадров/с — «бумажная» покадровость
    const stepT = step / 10;
    cmx = lerp(cmx, mx, 0.06);
    cmy = lerp(cmy, my, 0.06);
    const hh = hero.offsetHeight;
    const p = clamp(scrollY / hh);
    const pe = easeIO(p);
    // медленный облёт и покачивание — покадрово (10 к/с), поэтому видеокарта
    // перерисовывает сцену редко; плавно движется только реакция на мышь и прокрутку
    const orbit = reduce ? 0 : Math.sin(stepT * 0.18) * 0.35;

    layers.forEach(({ n, d, drift }) => {
      let x = (cmx * 34 + orbit * 22) * d;
      let y = cmy * 18 * d - pe * 340 * d * d;
      if (drift && !reduce) x += Math.sin(stepT * drift) * 26;
      if (n === island) {
        const bobY = reduce ? 0 : Math.sin(stepT * 1.3) * 7;
        const s = baseScale * (1 + pe * 0.22);
        const rot = cmx * -1.2 + orbit * 0.8 + (reduce ? 0 : Math.sin(stepT * 0.9) * 0.5);
        put(n, `translate3d(${x.toFixed(0)}px, ${(y + bobY).toFixed(0)}px, 0) rotate(${rot.toFixed(1)}deg) scale(${s.toFixed(3)})`);
      } else {
        put(n, `translate3d(${x.toFixed(0)}px, ${y.toFixed(0)}px, 0)`);
      }
    });

    if (!reduce && step !== lastStep) {
      lastStep = step;
      if (boilFrames.length > 1 && step % 2 === 0) {
        boilFrames[boilIdx].style.visibility = "hidden";
        boilIdx = (boilIdx + 1) % boilFrames.length;
        boilFrames[boilIdx].style.visibility = "visible";
      }
      letters.forEach((L, i) => {
        const a = L.a + stepT * L.s;
        const x = 816 + Math.cos(a) * L.r;
        const y = 470 - L.lift + Math.sin(a) * L.r * 0.42 - Math.abs(Math.sin(stepT * 0.7 + i)) * 26;
        const rot = Math.sin(stepT * 1.7 + i) * 18;
        L.g.setAttribute("transform", `translate(${x.toFixed(0)} ${y.toFixed(0)}) rotate(${rot.toFixed(0)}) scale(${(0.75 + 0.25 * Math.sin(a)).toFixed(2)})`);
      });
    }

    // буквы названия: вступление, затем поднимаются с разной скоростью при прокрутке
    let introLeft = false;
    chars.forEach((ch, i) => {
      const intro = introDone ? 1 : ease(clamp((t - 0.25 - i * 0.09) / 0.9));
      if (intro < 1) introLeft = true;
      const iy = (1 - intro) * 110;
      const irot = (1 - intro) * (i % 2 ? -10 : 8);
      const sy = -pe * (80 + i * 55);
      const srot = pe * (i % 2 ? 6 : -5);
      put(ch, `translate3d(0, calc(${iy.toFixed(1)}% + ${sy.toFixed(0)}px), 0) rotate(${(irot + srot).toFixed(1)}deg)`);
      if (!introDone) ch.style.opacity = intro.toFixed(3);
    });
    if (aside) {
      const ai = introDone ? 1 : ease(clamp((t - 0.9) / 0.8));
      if (ai < 1) introLeft = true;
      const op = (ai * (1 - clamp(p * 1.8))).toFixed(2);
      if (aside.style.opacity !== op) aside.style.opacity = op;
      put(aside, `translate3d(0, ${((1 - ai) * 24 - pe * 120).toFixed(0)}px, 0)`);
    }
    if (!introLeft) introDone = true;

    schedule();
  }
  function schedule() {
    if (!running && visible && !document.hidden) { running = true; requestAnimationFrame(frame); }
  }

  if (scene && hero) {
    buildScene();
    try { bake(); } catch (e) { /* если не вышло — остаются живые SVG */ }
    // кадры острова переводим в canvas: это настоящий битмап, переключать его дёшево
    const imgs = [...island.querySelectorAll("img.frame")];
    if (imgs.length > 1) {
      imgs.forEach((f, i) => { f.style.visibility = i ? "hidden" : "visible"; });
      Promise.all(imgs.map((im) => im.decode().then(() => im))).then((list) => {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const w = Math.round(island.clientWidth * dpr), h = Math.round(island.clientHeight * dpr);
        boilFrames = list.map((im, i) => {
          const c = document.createElement("canvas");
          c.width = w; c.height = h;
          c.className = "frame";
          c.getContext("2d").drawImage(im, 0, 0, w, h);
          c.style.visibility = i ? "hidden" : "visible";
          im.replaceWith(c);
          return c;
        });
      }).catch(() => { boilFrames = []; });
    }
    layers = [...scene.querySelectorAll(".lyr:not(.lyr--static)")].map((n) => ({ n, d: parseFloat(n.dataset.depth) || 0, drift: parseFloat(n.dataset.drift) || 0 }));
    new IntersectionObserver((es) => { visible = es[0].isIntersecting; schedule(); }).observe(hero);
    document.addEventListener("visibilitychange", schedule);
    schedule();
  }

  // ── Полка: ярусы, книги сами переносятся на следующую полку ──
  const row = document.getElementById("bookRow");
  if (row) {
    books.forEach((b, i) => {
      const a = document.createElement("a");
      a.className = "bk";
      a.href = "read.html?book=" + encodeURIComponent(b.slug);
      a.style.background = b.color;
      a.style.height = `calc((var(--row) - var(--plank) - 30px) * ${(0.74 + ((i * 37) % 26) / 100).toFixed(2)})`;
      a.setAttribute("aria-label", `${b.krc} — ${b.author}, «${b.ru}». Открыть в читалке`);
      a.innerHTML = '<em></em><span></span><b class="bk__tip"></b>';
      a.querySelector("em").textContent = b.pages + " с.";
      a.querySelector("span").textContent = b.krc;
      a.querySelector(".bk__tip").textContent = `${b.author}, «${b.ru}»`;
      row.appendChild(a);
    });
  }
})();
