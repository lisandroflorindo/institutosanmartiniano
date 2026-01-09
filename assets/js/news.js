(function () {
  const LIST_ID = "news-list";

  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function formatDateISO(iso) {
    if (!iso) return "";
    const [y, m, d] = iso.split("-").map(Number);
    if (!y || !m || !d) return iso;
    return `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`;
  }

  function fixPath(p) {
    if (!p) return "";
    // si estás en /pages/ y viene "/assets/..." => "../assets/..."
    if (p.startsWith("/") && window.location.pathname.includes("/pages/")) return ".." + p;
    return p;
  }

  function getTag(n) {
    if (Array.isArray(n.category) && n.category.length) return String(n.category[0] || "NOVEDAD");
    if (typeof n.category === "string" && n.category.trim()) return n.category.trim();
    if (typeof n.tag === "string" && n.tag.trim()) return n.tag.trim();
    return "NOVEDAD";
  }

  function normalizeItems(json) {
    if (Array.isArray(json)) return json;
    if (json && Array.isArray(json.items)) return json.items;
    if (json && Array.isArray(json.news)) return json.news;
    return [];
  }

  async function loadNewsJson() {
    // Probamos rutas absolutas y relativas (por si el sitio está en subcarpeta)
    const candidates = [
      "/assets/data/news.json",
      "assets/data/news.json",
      "./assets/data/news.json",
      "../assets/data/news.json",
    ];

    let lastErr = null;

    for (const url of candidates) {
      try {
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) {
          lastErr = new Error(`HTTP ${res.status} en ${url}`);
          continue;
        }
        const json = await res.json();
        return { json, url };
      } catch (e) {
        lastErr = e;
      }
    }

    throw lastErr || new Error("No se pudo cargar news.json");
  }

  function attachSliderControls(row) {
    // Botones prev/next (si existen)
    document.querySelectorAll("[data-news-dir]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const dir = Number(btn.getAttribute("data-news-dir") || "1");
        const step = Math.max(320, Math.round(row.clientWidth * 0.85));
        row.scrollBy({ left: dir * step, behavior: "smooth" });
      });
    });

    // Drag mouse/touch
    let isDown = false;
    let startX = 0;
    let startScroll = 0;

    const down = (e) => {
      isDown = true;
      row.classList.add("is-dragging");
      startX = (e.touches ? e.touches[0].pageX : e.pageX);
      startScroll = row.scrollLeft;
    };

    const move = (e) => {
      if (!isDown) return;
      const x = (e.touches ? e.touches[0].pageX : e.pageX);
      const dx = x - startX;
      row.scrollLeft = startScroll - dx;
    };

    const up = () => {
      isDown = false;
      row.classList.remove("is-dragging");
    };

    row.addEventListener("mousedown", down);
    row.addEventListener("mousemove", move);
    row.addEventListener("mouseleave", up);
    row.addEventListener("mouseup", up);

    row.addEventListener("touchstart", down, { passive: true });
    row.addEventListener("touchmove", move, { passive: true });
    row.addEventListener("touchend", up);
  }

  function renderHome(items, listEl) {
    // Orden desc por date
    const sorted = items.slice().sort((a, b) => (b.date || "").localeCompare(a.date || ""));

    // Mostramos hasta 8 (ajustable)
    const show = sorted.slice(0, 8);

    if (!show.length) {
      listEl.innerHTML = `<p class="hint">Todavía no hay novedades cargadas.</p>`;
      return;
    }

    listEl.innerHTML = show
      .map((n) => {
        const title = n.title || "Novedad";
        const date = n.date || "";
        const excerpt = n.excerpt || "";
        const tag = getTag(n);
        const img = fixPath(n.image || "");

        // Tu JSON usa slug -> linkeamos a noticia por slug (y si no existe, a novedades)
        const slug = (n.slug || "").trim();
        const href = slug
          ? `/pages/noticia.html?slug=${encodeURIComponent(slug)}`
          : `/pages/novedades.html`;

        return `
          <a class="news-card" href="${escapeHtml(href)}" aria-label="${escapeHtml(title)}">
            <div class="news-card__img">
              ${img ? `<img src="${escapeHtml(img)}" alt="${escapeHtml(title)}" loading="lazy">` : ``}
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
      })
      .join("");
  }

  async function setupNewsSlider() {
    const listEl = document.getElementById(LIST_ID);
    if (!listEl) return;

    listEl.innerHTML = `<p class="hint">Cargando novedades...</p>`;

    try {
      const { json } = await loadNewsJson();
      const items = normalizeItems(json);

      renderHome(items, listEl);

      if (listEl.querySelector(".news-card")) {
        attachSliderControls(listEl);
      }
    } catch (err) {
      console.error(err);
      listEl.innerHTML = `
        <p class="hint">
          No se pudieron cargar las novedades. Revisá la ruta de <code>assets/data/news.json</code>.
        </p>
      `;
    }
  }

  // Para que main.js lo pueda llamar cuando termina include.js
  window.setupNewsSlider = setupNewsSlider;

  // Backup por si main.js no lo llama
  document.addEventListener("DOMContentLoaded", () => setupNewsSlider());
})();
