function setActiveNavLink() {
  const path = window.location.pathname.replace(/\/$/, "");
  document.querySelectorAll(".nav a").forEach((a) => {
    const href = a.getAttribute("href");
    if (!href) return;

    const normalizedHref = href.replace(/\/$/, "");
    if (normalizedHref === path || (normalizedHref === "/index.html" && (path === "" || path === "/"))) {
      a.classList.add("is-active");
    }
  });
}

function setupMobileMenu() {
  const btn = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".nav");
  if (!btn || !nav) return;

  btn.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    btn.setAttribute("aria-expanded", open ? "true" : "false");
  });
}

function setupYear() {
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
}

document.addEventListener("componentsLoaded", () => {
  setupMobileMenu();
  setActiveNavLink();
  setupYear();
  setupNewsSlider();

  setupDropdownNav(); // <-- agregar
});


function setupDropdownNav() {
  const nav = document.getElementById("main-nav");
  if (!nav) return;

  const dropdowns = nav.querySelectorAll(".dropdown");

  function closeAll(except = null) {
    dropdowns.forEach(d => {
      if (d !== except) d.classList.remove("is-open");
    });
  }

  dropdowns.forEach((drop) => {
    const trigger = drop.querySelector(".nav__trigger");
    if (!trigger) return;

    trigger.addEventListener("click", (e) => {
      const isMobile = window.matchMedia("(max-width: 980px)").matches;
      if (!isMobile) return; // desktop: hover maneja todo

      // en móvil: el click abre/cierra dropdown (no navega)
      e.preventDefault();

      const willOpen = !drop.classList.contains("is-open");
      closeAll(drop);
      drop.classList.toggle("is-open", willOpen);
    });
  });

  // click fuera cierra (móvil)
  document.addEventListener("click", (e) => {
    const isMobile = window.matchMedia("(max-width: 980px)").matches;
    if (!isMobile) return;
    if (!nav.contains(e.target)) closeAll();
  });

  window.addEventListener("resize", () => closeAll());
}
