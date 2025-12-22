async function loadNews() {
  const candidates = [
    "../assets/data/news.json",
    "/assets/data/news.json",
    "./assets/data/news.json"
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

function formatDateISO(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return `${String(d).padStart(2,"0")}/${String(m).padStart(2,"0")}/${y}`;
}

function getTag(item){
  if (Array.isArray(item.category) && item.category.length) return item.category[0];
  if (typeof item.tag === "string" && item.tag.trim()) return item.tag.trim();
  return "NOVEDAD";
}

function fixPath(p){
  if (!p) return p;
  // si viene como "/assets/..." y estás en /pages/, lo convertimos a "../assets/..."
  if (p.startsWith("/") && window.location.pathname.includes("/pages/")) return ".." + p;
  return p;
}

document.addEventListener("DOMContentLoaded", async () => {
  const postEl = document.getElementById("post");
  if (!postEl) return;

  const u = new URL(window.location.href);
  const slug = u.searchParams.get("slug") || "";

  try {
    const data = await loadNews();
    const item = (data.items || []).find(n => n.slug === slug);

    if (!item) {
      postEl.innerHTML = `
        <div class="post__body">
          <h2 class="post__title">Noticia no encontrada</h2>
          <p class="post__text">Volvé a Novedades e intentá nuevamente.</p>
        </div>
      `;
      return;
    }

    const text = (item.content && String(item.content).trim()) ? item.content : (item.excerpt || "");
    const img = fixPath(item.image || "");
    const tag = getTag(item);

    document.title = `Instituto Sanmartiniano | ${item.title}`;

    postEl.innerHTML = `
      <div class="post__img">
        <img src="${img}" alt="${item.title}" loading="lazy">
      </div>
      <div class="post__body">
        <div class="post__meta">
          <span>${formatDateISO(item.date || "")}</span>
          <span class="post__tag">${tag}</span>
        </div>
        <h1 class="post__title">${item.title || ""}</h1>
        <p class="post__text">${text}</p>
      </div>
    `;
  } catch (err) {
    console.error(err);
    postEl.innerHTML = `<div class="post__body"><p class="post__text">Error cargando la noticia.</p></div>`;
  }

  // ===== Lightbox imagen =====
    const imgBox = document.getElementById("img-modal");
    const imgBoxSrc = document.getElementById("img-modal-src");
    const postImg = postEl.querySelector(".post__img img");

    function openImg(){
    if (!imgBox || !imgBoxSrc || !postImg) return;
    imgBoxSrc.src = postImg.src;
    imgBoxSrc.alt = postImg.alt || "Imagen ampliada";
    imgBox.classList.add("is-open");
    imgBox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    }

    function closeImg(){
    if (!imgBox) return;
    imgBox.classList.remove("is-open");
    imgBox.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    }

    if (postImg) {
    postImg.addEventListener("click", openImg);
    postImg.style.cursor = "zoom-in";
    }

    if (imgBox) {
    imgBox.addEventListener("click", (e) => {
        if (e.target && e.target.matches("[data-img-close]")) closeImg();
    });
    }

    document.addEventListener("keydown", (e) => {
    if (!imgBox || !imgBox.classList.contains("is-open")) return;
    if (e.key === "Escape") closeImg();
    });

});
