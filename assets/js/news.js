function escapeHtml(str){
  return String(str)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
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
  if (item.slug) return `./pages/noticia.html?slug=${encodeURIComponent(item.slug)}`;
  return "./pages/novedades.html";
}


function renderHomeNews(items, container){
  const top = items.slice(0, 8); // mostrás las últimas 8 en el inicio

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
          <img src="${escapeHtml(img)}" alt="${escapeHtml(title)}" loading="lazy">
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

function setupSlider(){
  const row = document.getElementById("news-list");
  if (!row) return;

  // botones (si existen)
  document.querySelectorAll("[data-news-dir]").forEach(btn => {
    btn.addEventListener("click", () => {
      const dir = Number(btn.getAttribute("data-news-dir")) || 1;
      const card = row.querySelector(".news-card");
      const step = card ? (card.getBoundingClientRect().width + 16) : 320;
      row.scrollBy({ left: dir * step, behavior: "smooth" });
    });
  });

  // drag-to-scroll (mouse + touch)
  let isDown = false;
  let startX = 0;
  let scrollLeft = 0;

  const onDown = (e) => {
    isDown = true;
    row.classList.add("is-dragging");
    startX = (e.touches ? e.touches[0].pageX : e.pageX);
    scrollLeft = row.scrollLeft;
  };

  const onMove = (e) => {
    if (!isDown) return;
    const x = (e.touches ? e.touches[0].pageX : e.pageX);
    const walk = (x - startX);
    row.scrollLeft = scrollLeft - walk;
  };

  const onUp = () => {
    isDown = false;
    row.classList.remove("is-dragging");
  };

  row.addEventListener("mousedown", onDown);
  row.addEventListener("mousemove", onMove);
  row.addEventListener("mouseleave", onUp);
  row.addEventListener("mouseup", onUp);

  row.addEventListener("touchstart", onDown, { passive: true });
  row.addEventListener("touchmove", onMove, { passive: true });
  row.addEventListener("touchend", onUp);
}

document.addEventListener("DOMContentLoaded", async () => {
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
});
