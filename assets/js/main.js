/* =========================
   MAIN.JS (completo)
   - Active nav link (desktop + sidebar)
   - Sidebar mobile/tablet
   - Dropdowns (desktop hover / mobile acordeón)
   - Smooth anchors
   - Footer year
   - Hook: setupNewsSlider() si existe
   - UX Enhancements
   - ✅ AOS (solo Inicio / Institución / Carreras)
========================= */

function setActiveNavLink() {
  const path = window.location.pathname.replace(/\/$/, "");

  // marcamos activos en ambos navs
  const links = document.querySelectorAll("#main-nav a, #sidebar-nav a, .nav a");
  links.forEach((a) => {
    const href = a.getAttribute("href");
    if (!href) return;

    const normalizedHref = href.replace(/\/$/, "");

    // home
    if (normalizedHref === "/index.html" && (path === "" || path === "/")) {
      a.classList.add("is-active");
      return;
    }

    // match exacto o endsWith (para /pages/contacto.html)
    if (normalizedHref === path || path.endsWith(normalizedHref)) {
      a.classList.add("is-active");
    }
  });
}

function setupYear() {
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
}

/* =========================
   ✅ AOS (solo 3 páginas)
========================= */
function setupAOS() {
  if (!window.AOS) return;

  const path = window.location.pathname.replace(/\/$/, "");
  const allow = new Set([
    "", "/",
    "/index.html",
    "/pages/instituto.html",
    "/pages/carreras.html",
  ]);

  if (!allow.has(path)) return;

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReduced) return;

  window.AOS.init({
    duration: 700,
    easing: "ease-out",
    once: true,
    offset: 80,
  });

  // por si header/footer se inyectan o cambia el DOM
  window.AOS.refresh();
}

/* =========================
   Sidebar (Mobile/Tablet)
========================= */
function setupMobileMenu() {
  const btn = document.querySelector(".nav-toggle");
  const sidebar = document.getElementById("sidebar");
  const overlay = document.querySelector(".sidebar-overlay");

  if (!btn || !sidebar || !overlay) return;

  const open = () => {
    sidebar.classList.add("is-open");
    overlay.classList.add("is-open");
    sidebar.setAttribute("aria-hidden", "false");
    btn.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
  };

  const close = () => {
    sidebar.classList.remove("is-open");
    overlay.classList.remove("is-open");
    sidebar.setAttribute("aria-hidden", "true");
    btn.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  };

  btn.addEventListener("click", () => {
    const isOpen = sidebar.classList.contains("is-open");
    isOpen ? close() : open();
  });

  // cerrar por overlay o botón X
  document.querySelectorAll("[data-sidebar-close]").forEach((el) => {
    el.addEventListener("click", close);
  });

  // cerrar con ESC
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });

  // ✅ CERRAR SOLO si es un link "real", NO si es un trigger de dropdown
  sidebar.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (!a) return;

    const isTrigger = a.classList.contains("nav__trigger");
    const li = a.closest(".dropdown");
    const hasMenu = li && li.querySelector(".dropdown__menu");

    // si es trigger con submenu -> NO cerrar (solo abre/cierra acordeón)
    if (isTrigger && hasMenu) return;

    // si es un link normal o un item del submenu -> cerrar
    close();
  });

  // si pasás a desktop, cerralo por si quedó abierto
  window.addEventListener("resize", () => {
    if (window.matchMedia("(min-width: 981px)").matches) close();
  });

  // por si otras funciones lo necesitan
  window.__closeSidebar = close;
}

/* =========================
   Dropdowns
   - Desktop: hover (CSS)
   - Mobile/Tablet: click acordeón (JS)
========================= */
function setupDropdownNav() {
  const navs = [
    document.getElementById("main-nav"),
    document.getElementById("sidebar-nav"),
  ].filter(Boolean);

  if (!navs.length) return;

  navs.forEach((nav) => {
    const dropdowns = Array.from(nav.querySelectorAll(".dropdown"));

    function closeAll(except = null) {
      dropdowns.forEach((d) => {
        if (d !== except) d.classList.remove("is-open");
      });
    }

    dropdowns.forEach((drop) => {
      const trigger = drop.querySelector(".nav__trigger");
      const menu = drop.querySelector(".dropdown__menu");
      if (!trigger || !menu) return;

      trigger.addEventListener("click", (e) => {
        const isMobile = window.matchMedia("(max-width: 980px)").matches;
        if (!isMobile) return; // desktop lo maneja el hover CSS

        e.preventDefault();
        e.stopPropagation();

        const willOpen = !drop.classList.contains("is-open");
        closeAll(drop);
        drop.classList.toggle("is-open", willOpen);

        if (willOpen) drop.scrollIntoView({ behavior: "smooth", block: "nearest" });
      });
    });

    // click fuera cierra (solo móvil)
    document.addEventListener("click", (e) => {
      const isMobile = window.matchMedia("(max-width: 980px)").matches;
      if (!isMobile) return;
      if (!nav.contains(e.target)) closeAll();
    });

    window.addEventListener("resize", () => closeAll());
  });
}

/* =========================
   Smooth scroll para anchors (#)
========================= */
function setupSmoothAnchors() {
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a[href*='#']");
    if (!a) return;

    const href = a.getAttribute("href");
    if (!href) return;

    const [urlPart, hash] = href.split("#");
    if (!hash) return;

    const samePage =
      !urlPart ||
      urlPart === window.location.pathname ||
      urlPart.endsWith(window.location.pathname);

    if (!samePage) return;

    const target = document.getElementById(hash);
    if (!target) return;

    e.preventDefault();
    target.scrollIntoView({ behavior: "smooth", block: "start" });

    if (typeof window.__closeSidebar === "function") {
      window.__closeSidebar();
    }
  });
}

function setupContactForm() {
  const form = document.getElementById("contact-form");
  if (!form) return;

  const hint = form.querySelector(".form-hint");
  const ok = form.querySelector(".contact-ok");
  const btn = form.querySelector("button[type='submit']");

  const showError = (msg) => {
    if (ok) ok.style.display = "none";
    if (hint) {
      hint.textContent = msg;
      hint.style.display = "block";
    }
  };

  const showOk = (msg) => {
    if (hint) hint.style.display = "none";
    if (ok) {
      ok.textContent = msg;
      ok.style.display = "block";
    }
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!form.checkValidity()) {
      const firstInvalid = form.querySelector(":invalid");
      if (firstInvalid) firstInvalid.focus();
      showError("Revisá los campos marcados. Faltan datos o hay un formato inválido.");
      return;
    }

    // Honeypot
    const hp = form.querySelector("input[name='website']");
    if (hp && hp.value.trim()) {
      showOk("¡Listo! Recibimos tu consulta.");
      form.reset();
      return;
    }

    const data = {
      nombre: form.nombre.value.trim(),
      apellido: form.apellido.value.trim(),
      email: form.email.value.trim(),
      mensaje: form.mensaje.value.trim(),
    };

    try {
      if (btn) {
        btn.disabled = true;
        btn.textContent = "Enviando...";
      }

      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const out = await res.json().catch(() => ({}));

      if (!res.ok) {
        showError(out.error || "No se pudo enviar. Probá de nuevo en unos segundos.");
        return;
      }

      showOk("¡Consulta enviada! Te vamos a responder a la brevedad.");
      form.reset();
    } catch (err) {
      console.error(err);
      showError("Error de conexión. Verificá internet e intentá nuevamente.");
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = "Enviar consulta";
      }
    }
  });

  form.addEventListener("input", () => {
    if (hint) hint.style.display = "none";
  });
}

/* =========================
   Init cuando se cargan componentes
========================= */
document.addEventListener("componentsLoaded", () => {
  setupMobileMenu();
  setupDropdownNav();
  setupSmoothAnchors();
  setActiveNavLink();
  setupYear();
  setupContactForm();

  // ✅ AOS (solo en las 3 páginas permitidas)
  setupAOS();

  // Home slider noticias (si existe setupNewsSlider)
  if (typeof window.setupNewsSlider === "function") {
    window.setupNewsSlider();
  }
});

/* ======================================
   UX Enhancements (sin librerías)
   ✅ pero sin chocar con AOS
====================================== */
(function () {
  function initReveal() {
    // ✅ Si hay AOS en la página, NO aplicamos reveal (evita opacity:0 raro)
    if (document.querySelector("[data-aos]")) return;

    const targets = document.querySelectorAll(
      ".section, .card-media, .post-card, .news-card, .contact-card, .cta-box, .about, .post, .news-item, .panel, .card"
    );

    targets.forEach((el) => el.classList.add("reveal"));

    if (!("IntersectionObserver" in window)) {
      targets.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    targets.forEach((el) => io.observe(el));
  }

  function initTyping() {
    const els = document.querySelectorAll("[data-typing]");
    if (!els.length) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      els.forEach((el) => (el.textContent = el.getAttribute("data-typing") || el.textContent));
      return;
    }

    function runTyping(el) {
      const text = el.getAttribute("data-typing") || "";
      const speed = Number(el.getAttribute("data-typing-speed") || "35");
      el.textContent = "";
      let i = 0;

      const tick = () => {
        el.textContent = text.slice(0, i++);
        if (i <= text.length) setTimeout(tick, speed);
      };
      tick();
    }

    if (!("IntersectionObserver" in window)) {
      els.forEach(runTyping);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            runTyping(e.target);
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.4 }
    );

    els.forEach((el) => io.observe(el));
  }

  function initGalleryLightbox() {
    const galleries = document.querySelectorAll("[data-gallery]");
    if (!galleries.length) return;

    let modal = document.getElementById("gallery-modal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "gallery-modal";
      modal.className = "img-modal";
      modal.setAttribute("aria-hidden", "true");
      modal.innerHTML = `
        <div class="img-modal__backdrop" data-img-close></div>
        <div class="img-modal__dialog" role="dialog" aria-modal="true" aria-label="Imagen ampliada">
          <button class="img-modal__close" type="button" aria-label="Cerrar" data-img-close>✕</button>
          <img id="gallery-modal-src" src="" alt="">
        </div>
      `;
      document.body.appendChild(modal);

      if (!document.getElementById("gallery-modal-style")) {
        const st = document.createElement("style");
        st.id = "gallery-modal-style";
        st.textContent = `
          .img-modal{position:fixed;inset:0;display:none;z-index:9999;}
          .img-modal.is-open{display:block;}
          .img-modal__backdrop{position:absolute;inset:0;background:rgba(2,6,23,.70);}
          .img-modal__dialog{position:relative;width:min(1100px,calc(100% - 24px));margin:18px auto;background:transparent;border-radius:18px;}
          .img-modal__close{position:absolute;top:10px;right:10px;width:44px;height:44px;border-radius:14px;border:1px solid rgba(255,255,255,.25);background:rgba(2,6,23,.55);color:#fff;cursor:pointer;font-size:18px;}
          #gallery-modal-src{width:100%;height:calc(100vh - 60px);object-fit:contain;display:block;user-select:none;-webkit-user-drag:none;}
        `;
        document.head.appendChild(st);
      }

      modal.addEventListener("click", (e) => {
        if (e.target && e.target.matches("[data-img-close]")) close();
      });

      document.addEventListener("keydown", (e) => {
        if (!modal.classList.contains("is-open")) return;
        if (e.key === "Escape") close();
      });
    }

    const imgEl = modal.querySelector("#gallery-modal-src");

    function open(src, alt) {
      imgEl.src = src;
      imgEl.alt = alt || "Imagen ampliada";
      modal.classList.add("is-open");
      modal.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    }

    function close() {
      modal.classList.remove("is-open");
      modal.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    }

    galleries.forEach((g) => {
      g.querySelectorAll("img").forEach((im) => {
        im.style.cursor = "zoom-in";
        im.addEventListener("click", () => open(im.src, im.alt));
      });
    });
  }

  function initFormValidation() {
    const forms = document.querySelectorAll("form[data-validate]");
    if (!forms.length) return;

    forms.forEach((form) => {
      form.addEventListener("submit", (e) => {
        if (!form.checkValidity()) {
          e.preventDefault();
          const firstInvalid = form.querySelector(":invalid");
          if (firstInvalid) firstInvalid.focus();

          const msg = form.querySelector(".form-hint");
          if (msg) {
            msg.textContent = "Revisá los campos marcados. Faltan datos o hay un formato inválido.";
            msg.style.display = "block";
          }
        }
      });

      form.addEventListener("input", () => {
        const msg = form.querySelector(".form-hint");
        if (msg) msg.style.display = "none";
      });
    });
  }

  function initInteractiveMap() {
    const maps = document.querySelectorAll("[data-map]");
    if (!maps.length) return;

    maps.forEach((map) => {
      const overlay = map.querySelector(".map-overlay");
      const iframe = map.querySelector("iframe");
      if (!overlay || !iframe) return;

      overlay.addEventListener("click", () => {
        overlay.style.display = "none";
        iframe.style.pointerEvents = "auto";
      });

      document.addEventListener("click", (e) => {
        if (!map.contains(e.target)) {
          overlay.style.display = "flex";
          iframe.style.pointerEvents = "none";
        }
      });

      iframe.style.pointerEvents = "none";
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    initReveal();
    initTyping();
    initGalleryLightbox();
    initFormValidation();
    initInteractiveMap();
  });
})();
