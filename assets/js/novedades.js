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

/* Convierte "/assets/..." a "../assets/..." cuando estás dentro de /pages/ */
function fixPath(p){
  if (!p) return p;
  if (p.startsWith("/") && window.location.pathname.includes("/pages/")) return ".." + p;
  return p;
}

async function loadNews() {
  const candidates = [
    "/assets/data/news.json",
    "../assets/data/news.json",
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

/* Normaliza categoría: soporta `category: []` o `tag: ""` */
function getCats(item){
  if (Array.isArray(item.category)) return item.category.filter(Boolean);
  if (typeof item.category === "string" && item.category.trim()) return [item.category.trim()];
  if (typeof item.tag === "string" && item.tag.trim()) return [item.tag.trim()];
  return ["NOVEDAD"];
}

/* ===== MODAL ===== */
function setupModal(){
  const modal = document.getElementById("news-modal");
  if (!modal) return null;

  const img = document.getElementById("modal-img");
  const title = document.getElementById("modal-title");
  const date = document.getElementById("modal-date");
  const tag = document.getElementById("modal-tag");
  const text = document.getElementById("modal-text");

  let lastFocus = null;

  function openFromData(data){
    lastFocus = document.activeElement;

    if (img) { img.src = data.image; img.alt = data.title; }
    if (title) title.textContent = data.title;
    if (date) date.textContent = formatDateISO(data.date);
    if (tag) tag.textContent = data.tag;
    if (text) text.textContent = data.text;

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    const closeBtn = modal.querySelector(".modal__close");
    if (closeBtn) closeBtn.focus();
  }

  function close(){
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
  }

  modal.addEventListener("click", (e) => {
    if (e.target && e.target.matches("[data-modal-close]")) close();
  });

  document.addEventListener("keydown", (e) => {
    if (!modal.classList.contains("is-open")) return;
    if (e.key === "Escape") close();
  });

  return { openFromData, close };
}

/* Render cards */
function renderCards(items, listEl, modalApi){
  listEl.innerHTML = items.map((n) => {
    const title = n.title || "Novedad";
    const date = n.date || "";
    const excerpt = n.excerpt || "";
    const fullText = (n.content && String(n.content).trim()) ? n.content : excerpt;

    const cats = getCats(n);
    const tag = cats[0] || "NOVEDAD";
    const img = fixPath(n.image || "");

    // guardamos data para modal
    const data = {
      title,
      date,
      tag,
      image: img,
      text: fullText
    };

    return `
      <article class="post-card">
        <div class="post-card__img">
          <img src="${escapeHtml(img)}" alt="${escapeHtml(title)}" loading="lazy">
        </div>

        <div class="post-card__body">
          <div class="post-meta">
            <div class="post-cats">
              ${cats.map(c => `<span class="post-cat">${escapeHtml(c)}</span>`).join("")}
            </div>
            <span class="post-date">${escapeHtml(formatDateISO(date))}</span>
          </div>

          <h3 class="post-title">${escapeHtml(title)}</h3>
          <p class="post-excerpt">${escapeHtml(excerpt)}</p>

          <div class="post-actions">
            <button class="post-more" type="button"
              data-open-modal="1"
              data-title="${escapeHtml(data.title)}"
              data-date="${escapeHtml(data.date)}"
              data-tag="${escapeHtml(data.tag)}"
              data-image="${escapeHtml(data.image)}"
              data-text="${escapeHtml(data.text)}"
            >Ver Más →</button>
          </div>
        </div>
      </article>
    `;
  }).join("");

  // bind modal buttons
  listEl.querySelectorAll("[data-open-modal='1']").forEach(btn => {
    btn.addEventListener("click", () => {
      if (!modalApi) return;
      modalApi.openFromData({
        title: btn.getAttribute("data-title") || "",
        date: btn.getAttribute("data-date") || "",
        tag: btn.getAttribute("data-tag") || "",
        image: btn.getAttribute("data-image") || "",
        text: btn.getAttribute("data-text") || ""
      });
    });
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  const listEl = document.getElementById("news-list");
  const searchEl = document.getElementById("news-search");
  const filterEl = document.getElementById("news-filter");
  const moreBtn = document.getElementById("news-more");
  const emptyEl = document.getElementById("news-empty");

  if (!listEl || !searchEl || !filterEl || !moreBtn) return;

  const modalApi = setupModal();
  const PER_LOAD = 4; // 2 filas por vez (2x2)

  try {
    const data = await loadNews();
    const all = (data.items || []).slice()
      .sort((a,b) => (b.date || "").localeCompare(a.date || ""));

    // cargar categorías al select
    const set = new Set();
    all.forEach(n => getCats(n).forEach(c => set.add(c)));
    Array.from(set).sort().forEach(c => {
      const opt = document.createElement("option");
      opt.value = c;
      opt.textContent = c;
      filterEl.appendChild(opt);
    });

    let visibleCount = PER_LOAD;

    function apply(resetVisible=false){
      if (resetVisible) visibleCount = PER_LOAD;

      const q = (searchEl.value || "").trim().toLowerCase();
      const f = filterEl.value;

      const filtered = all.filter(n => {
        const cats = getCats(n);
        const okCat = (f === "all") || cats.includes(f);

        const text = `${n.title||""} ${n.excerpt||""} ${n.content||""}`.toLowerCase();
        const okText = !q || text.includes(q);

        return okCat && okText;
      });

      const slice = filtered.slice(0, visibleCount);
      renderCards(slice, listEl, modalApi);

      // empty
      if (emptyEl) emptyEl.style.display = filtered.length ? "none" : "block";

      // botón cargar más
      const hasMore = filtered.length > slice.length;
      moreBtn.style.display = hasMore ? "inline-flex" : "none";
    }

    searchEl.addEventListener("input", () => apply(true));
    filterEl.addEventListener("change", () => apply(true));

    moreBtn.addEventListener("click", () => {
      visibleCount += PER_LOAD;
      apply(false);
    });

    apply(true);
  } catch (err) {
    console.error(err);
    listEl.innerHTML = `<p class="hint">No se pudieron cargar las novedades. Revisá <code>assets/data/news.json</code>.</p>`;
  }
});
