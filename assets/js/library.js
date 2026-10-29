// Страница «Скачать»: бумажные обложки с кнопками.
(function () {
  const root = document.getElementById("covers");
  if (!root) return;
  const tilts = [-1.6, 1.2, -0.6, 1.8, -1.2, 0.8, -1.9, 1.4, -0.9];
  (window.BOOKS || []).forEach((b, i) => {
    const art = document.createElement("article");
    art.className = "cover";
    art.style.setProperty("--c", b.color);
    art.style.setProperty("--tilt", tilts[i % tilts.length] + "deg");
    art.innerHTML = `
      <span class="cover__tape" aria-hidden="true"></span>
      <a class="cover__art" href="read.html?book=${encodeURIComponent(b.slug)}" tabindex="-1" aria-hidden="true">
        <svg class="cover__motif" viewBox="0 0 100 100" aria-hidden="true">${(window.MOTIFS || {})[b.motif] || ""}</svg>
        <p class="cover__krc"></p>
        <span class="cover__author"></span>
      </a>
      <div class="cover__meta">
        <h3></h3>
        <p></p>
      </div>
      <div class="cover__actions">
        <a class="btn" href="pdf/${b.slug}.pdf" download>Скачать PDF <span data-icon="down"></span></a>
        <a class="btn btn--line" href="read.html?book=${encodeURIComponent(b.slug)}">Читать <span data-icon="book"></span></a>
      </div>`;
    art.querySelector(".cover__krc").textContent = b.krc;
    art.querySelector(".cover__author").textContent = b.author;
    art.querySelector("h3").textContent = `${b.ru} в переводе`;
    art.querySelector(".cover__meta p").textContent = `${b.pages} страниц, PDF ${b.kb} КБ`;
    root.appendChild(art);
  });
  window.fillIcons(root);
})();
