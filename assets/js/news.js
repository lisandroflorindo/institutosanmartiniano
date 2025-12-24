function escapeHtml(str){
  return String(str)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"'," &quot;")
    .replaceAll("'","&#039;");
}

function formatDateISO(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return `${String(d).padStart(2,"0")}/${String(m).padStart(2,"0")}/${y}`;
}

async function loadNews() {
  const candidates = [
    "/assets/data/news.json",
    "./assets/data/news.json",
    "assets/data/news.json"
  ];

  let lastErr = null;
  for (const url of candidates) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (res.ok) return res.json();
      lastErr = new Error(`HTTP ${res.status} en ${url}`);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error("No se pudo cargar news.json");
}

function getTag(item){
  if (item.tag && String(item.tag).trim()) return String(item.tag).trim();
  if (Array.isArray(item.category) && item.category.length) return String(item.category[0]).trim();
  if (typeof item.category === "string" && item.category.trim()) return item.category.trim();
  return "NOVEDAD";
}

function getHref(item){
  // si hay slug => página noticia individual
  if (item.slug) return `./pages/noticia.html?slug=${encodeURIComponent(item.slug)}`;
  // si no => lista de novedades
  return "./pages/novedades.html";
}

function renderHomeNews(items, container){
  const top = items.slice(0, 8);

  container.innerHTML = top.map(n => {
    const title = n.title || "Novedad";
    const excerpt = n.excerpt || "";
    const date = n.date || "";
    const tag = getTag(n);
    const img = n.image || "";
    const href = getHref(n);

    return `
      <a class="news-card" href="${escapeHtml(href)}">
        <div class="news-card__img">
          <img src="${escapeHtml(img)}" alt="${escapeHtml(title)}" loading="lazy" draggable="false">
        </div>
        <div class="news-card__body">
          <div class="news-card__meta">
            <span class="news-card__tag">${escapeHtml(tag)}</span>
            <span class="news-card__date">${escapeHtml(formatDateISO(date))}</span>
          </div>
          <h3 class="news-card__title">${escapeHtml(title)}</h3>
          <p class="news-card__text">${escapeHtml(excerpt)}</p>
          <span class="news-card__more">Ver más →</span>
        </div>
      </a>
    `;
  }).join("");
}

/* ========= Slider PRO: botones + drag + inercia + no-click al arrastrar ========= */
function setupSlider(){
  const row = document.getElementById("news-list");
  if (!row) return;

  // Botones prev/next
  document.querySelectorAll("[data-news-dir]").forEach(btn => {
    btn.addEventListener("click", () => {
      const dir = Number(btn.getAttribute("data-news-dir")) || 1;
      const card = row.querySelector(".news-card");
      const step = card ? (card.getBoundingClientRect().width + 16) : 320;
      row.scrollBy({ left: dir * step, behavior: "smooth" });
    });
  });

  // Drag (mouse + touch) con inercia
  let isDown = false;
  let startX = 0;
  let startY = 0;
  let startScrollLeft = 0;

  let lastX = 0;
  let lastTime = 0;
  let velocityX = 0;
  let raf = null;

  let hasDragged = false;
  let lockAxis = null; // "x" | "y" | null

  function now() { return performance.now(); }

  function stopInertia(){
    if (raf) cancelAnimationFrame(raf);
    raf = null;
  }

  function startInertia(){
    stopInertia();
    const decay = 0.92;         // fricción
    const minV = 0.08;          // umbral
    const step = () => {
      row.scrollLeft -= velocityX * 16; // 16ms aprox
      velocityX *= decay;
      if (Math.abs(velocityX) > minV) {
        raf = requestAnimationFrame(step);
      } else {
        raf = null;
      }
    };
    if (Math.abs(velocityX) > minV) raf = requestAnimationFrame(step);
  }

  function onDown(e){
    stopInertia();
    isDown = true;
    hasDragged = false;
    lockAxis = null;
    row.classList.add("is-dragging");

    const point = e.touches ? e.touches[0] : e;
    startX = point.pageX;
    startY = point.pageY;
    startScrollLeft = row.scrollLeft;

    lastX = startX;
    lastTime = now();
    velocityX = 0;
  }

  function onMove(e){
    if (!isDown) return;

    const point = e.touches ? e.touches[0] : e;
    const x = point.pageX;
    const y = point.pageY;

    const dx = x - startX;
    const dy = y - startY;

    // detectar eje (para no bloquear scroll vertical)
    if (!lockAxis) {
      if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
        lockAxis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      } else {
        return;
      }
    }

    if (lockAxis === "y") {
      // el usuario quiere scrollear la página, no el carrusel
      return;
    }

    // si es horizontal, prevenimos scroll vertical
    if (e.cancelable) e.preventDefault();

    hasDragged = true;
    row.scrollLeft = startScrollLeft - dx;

    // calcular velocidad (para inercia)
    const t = now();
    const dt = Math.max(1, t - lastTime);
    velocityX = (x - lastX) / dt; // px/ms
    lastX = x;
    lastTime = t;
  }

  function onUp(){
    if (!isDown) return;
    isDown = false;
    row.classList.remove("is-dragging");

    // inercia solo si realmente arrastró
    if (hasDragged) startInertia();

    // reset
    lockAxis = null;
  }

  // Evitar click cuando se arrastra (si no, abre noticia)
  row.addEventListener("click", (e) => {
    if (hasDragged) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, true);

  // Mouse
  row.addEventListener("mousedown", onDown);
  row.addEventListener("mousemove", onMove);
  row.addEventListener("mouseleave", onUp);
  row.addEventListener("mouseup", onUp);

  // Touch
  row.addEventListener("touchstart", onDown, { passive: true });
  row.addEventListener("touchmove", onMove, { passive: false }); // importante para preventDefault
  row.addEventListener("touchend", onUp);

  // Wheel horizontal (shift/trackpad) sin romper scroll
  row.addEventListener("wheel", (e) => {
    // si hay trackpad con deltaX o Shift
    if (Math.abs(e.deltaX) > 0 || e.shiftKey) {
      e.preventDefault();
      row.scrollLeft += (e.deltaX || e.deltaY);
    }
  }, { passive: false });
}

/* Exponer para main.js (cuando carga componentes) */
window.setupNewsSlider = async function setupNewsSlider(){
  const row = document.getElementById("news-list");
  if (!row) return;

  try {
    const data = await loadNews();
    const all = (data.items || []).slice()
      .sort((a,b) => (b.date || "").localeCompare(a.date || ""));

    renderHomeNews(all, row);
    setupSlider();
  } catch (err) {
    console.error(err);
    row.innerHTML = `<p class="hint">No se pudieron cargar las novedades.</p>`;
  }
};

/* Si el home carga directo sin include, también funciona */
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("news-list")) {
    window.setupNewsSlider();
  }
});
