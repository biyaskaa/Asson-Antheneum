// Главная: бумажный остров, камера, история перевода, полка.
(function () {
  const NS = "http://www.w3.org/2000/svg";
  const reduce = window.REDUCED_MOTION;
  const books = window.BOOKS || [];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = (t) => 1 - Math.pow(1 - t, 3);
  const easeIO = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  // детерминированный «случай», чтобы облака были одинаковыми при каждой загрузке
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

  function el(tag, attrs, parent) {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    parent && parent.appendChild(n);
    return n;
  }

  const clouds = [];
  // кучевое облако: горка из бумажных кругов в три тона (тень, свет, блик)
  function addCloud(parent, cx, cy, w, h, pal, speed) {
    const g = el("g", {}, parent);
    const puffs = [];
    const rows = 3;
    for (let row = 0; row < rows; row++) {
      const rowW = w * (1 - row * 0.3);
      const n = 6 - row * 2 + Math.floor(rnd() * 2);
      const baseR = (h / 2.2) * (1 - row * 0.18);
      for (let i = 0; i < n; i++) {
        const fx = n === 1 ? 0.5 : i / (n - 1);
        const x = cx - rowW / 2 + fx * rowW + (rnd() - 0.5) * baseR * 0.5;
        const dome = Math.sin(fx * Math.PI);
        const y = cy - row * h * 0.28 - dome * h * 0.12 + (rnd() - 0.5) * 8;
        const r = baseR * (0.65 + dome * 0.45 + rnd() * 0.2);
        puffs.push([x, y, r]);
      }
    }
    // плоское основание
    el("rect", { x: cx - w / 2 - h * 0.15, y: cy, width: w + h * 0.3, height: h * 0.22, rx: h * 0.11, fill: pal[0] }, g);
    puffs.forEach(([x, y, r]) => el("circle", { cx: x - r * 0.1, cy: y + r * 0.16, r, fill: pal[0] }, g));
    puffs.forEach(([x, y, r]) => el("circle", { cx: x + r * 0.1, cy: y - r * 0.1, r: r * 0.95, fill: pal[2] }, g));
    puffs.forEach(([x, y, r]) => el("circle", { cx: x - r * 0.04, cy: y + r * 0.02, r: r * 0.93, fill: pal[1] }, g));
    clouds.push({ g, x: 0, speed, w });
  }

  function buildScene() {
    const stars = document.getElementById("stars");
    for (let i = 0; i < 70; i++) {
      el("circle", { cx: (rnd() * 1800 - 100).toFixed(0), cy: (rnd() * 520 - 60).toFixed(0), r: (0.6 + rnd() * 1.6).toFixed(1), fill: "#ece6d3", opacity: (0.3 + rnd() * 0.6).toFixed(2) }, stars);
    }
    const far = document.getElementById("cloudsFar");
    const farPal = ["#2e2842", "#5b4458", "#b97c66"];
    [[170, 330, 380, 150], [600, 230, 260, 100], [1180, 260, 460, 160], [1540, 380, 340, 130]].forEach((c, i) => addCloud(far, ...c, farPal, 0.05 + i * 0.01));
    const mid = document.getElementById("cloudsMid");
    const midPal = ["#46303f", "#8c5a55", "#f3b47c"];
    [[1270, 660, 680, 380], [1540, 520, 420, 280], [120, 720, 520, 260], [1010, 450, 300, 160]].forEach((c, i) => addCloud(mid, ...c, midPal, 0.12 + i * 0.02));
    const near = document.getElementById("cloudsNear");
    const nearPal = ["#1d1a2b", "#352a3d", "#8a5a52"];
    [[100, 1080, 760, 360], [880, 1150, 900, 340], [1580, 1070, 700, 380]].forEach((c, i) => addCloud(near, ...c, nearPal, 0.25 + i * 0.04));

    // буквы карачаево-балкарского алфавита кружат у книги
    const lg = document.getElementById("letters");
    const glyphs = ["Къ", "Гъ", "Нг", "Ў", "Ж", "Ч", "А", "Ё"];
    glyphs.forEach((t, i) => {
      const g = el("g", {}, lg);
      el("rect", { x: -17, y: -20, width: 34, height: 38, rx: 3, fill: "#ece6d3", filter: "url(#paper)" }, g);
      const tx = el("text", { y: 9, fill: "#1b2033" }, g);
      tx.textContent = t;
      letters.push({ g, a: (i / glyphs.length) * Math.PI * 2, r: 110 + (i % 3) * 30, s: 0.25 + (i % 4) * 0.06, lift: i * 12 });
    });
  }
  const letters = [];

  // ── Камера ──
  const scene = document.getElementById("scene");
  const layers = scene ? [...scene.querySelectorAll(".layer")].map((g) => ({ g, d: parseFloat(g.dataset.depth) })) : [];
  const island = document.getElementById("island");
  const bob = document.getElementById("islandBob");
  const boilNoise = document.getElementById("boilNoise");
  const title = document.getElementById("heroTitle");
  const chars = title ? [...title.querySelectorAll(".ch")] : [];
  const aside = document.getElementById("heroAside");
  const hero = document.querySelector(".hero");

  let mx = 0, my = 0, cmx = 0, cmy = 0;
  if (!reduce) {
    window.addEventListener("pointermove", (e) => {
      mx = (e.clientX / innerWidth) * 2 - 1;
      my = (e.clientY / innerHeight) * 2 - 1;
    }, { passive: true });
  }

  const t0 = performance.now();
  let lastStep = -1;

  function frame(now) {
    const t = (now - t0) / 1000;
    const step = Math.floor(t * 10); // 10 кадров/с — покадровая «бумажная» анимация
    const stepT = step / 10;

    cmx = lerp(cmx, mx, 0.06);
    cmy = lerp(cmy, my, 0.06);
    const hh = hero ? hero.offsetHeight : innerHeight;
    const p = clamp(scrollY / hh);
    const pe = easeIO(p);

    if (scrollY < hh * 1.2) {
      // камера: медленный облёт + реакция на мышь + проезд вверх при прокрутке
      const orbit = reduce ? 0 : Math.sin(t * 0.18) * 0.35;
      layers.forEach(({ g, d }) => {
        const x = (cmx * 34 + orbit * 22) * d;
        const y = cmy * 18 * d - pe * 340 * d * d;
        if (g === island) {
          const s = 1 + pe * 0.22;
          const rot = cmx * -1.2 + orbit * 0.8;
          g.setAttribute("transform", `translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${rot.toFixed(2)} 740 600) translate(740 600) scale(${s.toFixed(3)}) translate(-740 -600)`);
        } else {
          g.setAttribute("transform", `translate(${x.toFixed(2)} ${y.toFixed(2)})`);
        }
      });

      if (!reduce && step !== lastStep) {
        lastStep = step;
        // остров покачивается рывками, как вырезанный из бумаги
        if (bob) bob.setAttribute("transform", `translate(0 ${(Math.sin(stepT * 1.3) * 7).toFixed(1)}) rotate(${(Math.sin(stepT * 0.9) * 0.6).toFixed(2)} 740 600)`);
        // «кипение» краёв — новый шум каждые 2 кадра
        if (boilNoise && step % 2 === 0) boilNoise.setAttribute("seed", String(1 + ((step / 2) % 5)));
        letters.forEach((L, i) => {
          const a = L.a + stepT * L.s;
          const x = 816 + Math.cos(a) * L.r;
          const y = 470 - L.lift + Math.sin(a) * L.r * 0.42 - Math.abs(Math.sin(stepT * 0.7 + i)) * 26;
          const rot = Math.sin(stepT * 1.7 + i) * 18;
          L.g.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot.toFixed(1)}) scale(${(0.75 + 0.25 * Math.sin(a)).toFixed(2)})`);
        });
        clouds.forEach((c) => {
          c.x = Math.sin(stepT * c.speed) * 40;
          c.g.setAttribute("transform", `translate(${c.x.toFixed(1)} 0)`);
        });
      }

      // типографика участвует: буквы названия поднимаются с разной скоростью
      chars.forEach((ch, i) => {
        const intro = reduce ? 1 : ease(clamp((t - 0.25 - i * 0.09) / 0.9));
        const iy = (1 - intro) * 110;
        const irot = (1 - intro) * (i % 2 ? -10 : 8);
        const sy = -pe * (80 + i * 55);
        const srot = pe * (i % 2 ? 6 : -5);
        ch.style.transform = `translateY(calc(${iy}% + ${sy.toFixed(1)}px)) rotate(${(irot + srot).toFixed(2)}deg)`;
        ch.style.opacity = String(intro);
      });
      if (aside) {
        const ai = reduce ? 1 : ease(clamp((t - 0.9) / 0.8));
        aside.style.opacity = String(ai * (1 - clamp(p * 1.8)));
        aside.style.transform = `translateY(${((1 - ai) * 24 - pe * 120).toFixed(1)}px)`;
      }
    }

    story(now);
    requestAnimationFrame(frame);
  }

  // ── История: книга → перевод → полка ──
  const storyEl = document.getElementById("story");
  const book = document.getElementById("paperbook");
  const cover = book && book.querySelector(".paperbook__cover");
  const pageL = book && book.querySelector(".paperbook__page--l");
  const wordEl = document.getElementById("word");
  const shelfEl = document.getElementById("shelf");
  const caps = storyEl ? [...storyEl.querySelectorAll(".story__caption p")] : [];
  const bars = storyEl ? [...storyEl.querySelectorAll(".story__steps i")] : [];
  const FROM = "Белые ночи", TO = "Акъ кечеле";
  const lts = [];
  const spines = [];

  function buildStory() {
    if (!wordEl) return;
    [...FROM].forEach((ch, i) => {
      const s = document.createElement("span");
      s.className = "lt" + (ch === " " ? " sp" : "");
      s.innerHTML = "<b></b>";
      s.firstChild.textContent = ch;
      wordEl.appendChild(s);
      lts.push({ s, b: s.firstChild, from: ch, to: TO[i], flipped: false });
    });
    const order = [0, 3, 6, 1, 8, 4, 7, 2, 5];
    order.forEach((idx) => {
      const b = books[idx];
      if (!b) return;
      const sp = document.createElement("div");
      sp.className = "spine";
      sp.style.background = b.color;
      sp.style.height = 62 + ((idx * 37) % 38) + "%";
      sp.innerHTML = "<span></span>";
      sp.firstChild.textContent = b.krc;
      if (b.slug === "belye-nochi") sp.style.boxShadow = "0 0 34px 6px rgba(240,163,94,.45), inset -6px 0 10px rgba(0,0,0,.25)";
      shelfEl.appendChild(sp);
      spines.push({ sp, isNew: b.slug === "belye-nochi" });
    });
  }

  let lastCap = -1;
  function story() {
    if (!storyEl) return;
    const r = storyEl.getBoundingClientRect();
    if (r.bottom < -50 || r.top > innerHeight + 50) return;
    const total = storyEl.offsetHeight - innerHeight;
    let p = clamp(-r.top / total);
    p = Math.round(p * 120) / 120; // лёгкая покадровость при прокрутке

    // фаза 1 (0–.33): книга появляется и раскрывается
    const appear = ease(clamp(p / 0.1));
    const open = easeIO(clamp((p - 0.08) / 0.18));
    // фаза 3 (.66–1): книга закрывается и улетает на полку
    const close = easeIO(clamp((p - 0.7) / 0.1));
    const fly = easeIO(clamp((p - 0.78) / 0.12));
    const coverAngle = -180 * open * (1 - close);
    if (cover) {
      cover.style.transform = `rotateY(${coverAngle}deg)`;
      cover.style.zIndex = coverAngle < -90 ? 0 : 3;
    }
    if (pageL) pageL.style.opacity = String(open > 0.5 || close < 0.5 ? clamp(open * 2 - 1) * (1 - clamp(close * 2)) : 0);
    if (book) {
      const sc = lerp(1, 0.06, fly);
      const by = lerp(40 * (1 - appear), innerHeight * 0.3, fly);
      book.style.transform = `translate(-50%, calc(-50% + ${by}px)) scale(${sc}) rotate(${lerp(-4, 0, appear) + fly * 8}deg)`;
      book.style.opacity = String(appear * (1 - clamp((p - 0.84) / 0.05)));
    }

    // слово: буквы выпрыгивают, переворачиваются и превращаются
    const wordAppear = clamp((p - 0.2) / 0.1);
    const wordFly = easeIO(clamp((p - 0.7) / 0.14));
    if (wordEl) {
      wordEl.style.transform = `translate(-50%, calc(-50% + ${(-wordFly * 60).toFixed(1)}px)) scale(${lerp(1, 0.4, wordFly)})`;
      wordEl.style.opacity = String(1 - wordFly);
    }
    lts.forEach((L, i) => {
      const a = ease(clamp(wordAppear * 1.6 - i * 0.06));
      const ft = clamp((p - 0.38 - i * 0.022) / 0.07);
      const ang = ft * 180;
      const jump = Math.sin(ft * Math.PI) * 50;
      const flipped = ang > 90;
      if (flipped !== L.flipped) {
        L.flipped = flipped;
        L.b.textContent = flipped ? L.to : L.from;
        if (L.from !== " ") L.s.style.background = flipped ? "#f6c790" : "";
      }
      L.b.style.transform = flipped ? "scaleX(-1)" : "";
      L.s.style.transform = `translateY(${((1 - a) * 40 - jump).toFixed(1)}px) rotateY(${ang.toFixed(1)}deg) scale(${a.toFixed(3)})`;
    });

    // полка: корешки поднимаются по очереди
    const shelfIn = clamp((p - 0.76) / 0.2);
    if (shelfEl) shelfEl.style.opacity = String(clamp(shelfIn * 4));
    spines.forEach((S, i) => {
      const k = S.isNew ? clamp((p - 0.88) / 0.08) : clamp(shelfIn * 1.4 - i * 0.07);
      const e = ease(k);
      S.sp.style.transform = `translateY(${((1 - e) * 120).toFixed(1)}%) rotate(${((1 - e) * (i % 2 ? 6 : -6)).toFixed(1)}deg)`;
      S.sp.style.opacity = String(clamp(k * 3));
    });

    const cap = p < 0.34 ? 0 : p < 0.68 ? 1 : 2;
    if (cap !== lastCap) {
      lastCap = cap;
      caps.forEach((c, i) => c.classList.toggle("on", i === cap));
    }
    bars.forEach((b, i) => { b.style.transform = `scaleX(${clamp((p - i / 3) * 3)})`; });
  }

  // ── Полка-ссылки ──
  function buildShelf() {
    const row = document.getElementById("bookRow");
    if (!row) return;
    books.forEach((b, i) => {
      const a = document.createElement("a");
      a.className = "bk";
      a.href = "read.html?book=" + encodeURIComponent(b.slug);
      a.style.background = b.color;
      a.style.height = 250 + ((i * 53) % 80) + "px";
      a.style.width = 64 + ((i * 29) % 28) + "px";
      a.setAttribute("aria-label", `${b.krc} — ${b.author}, «${b.ru}». Открыть в читалке`);
      a.innerHTML = '<em></em><span></span><b class="bk__tip"></b>';
      a.querySelector("em").textContent = b.pages + " с.";
      a.querySelector("span").textContent = b.krc;
      a.querySelector(".bk__tip").textContent = `${b.author}, «${b.ru}»`;
      row.appendChild(a);
    });
  }

  if (scene) buildScene();
  buildStory();
  buildShelf();
  requestAnimationFrame(frame);
})();
