async function loadComponent(selector, url) {
  const el = document.querySelector(selector);
  if (!el) return;

  const res = await fetch(url);
  if (!res.ok) {
    el.innerHTML = "<!-- Error cargando componente -->";
    return;
  }
  el.innerHTML = await res.text();
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadComponent("#site-header", "/components/header.html");
  await loadComponent("#site-footer", "/components/footer.html");
  document.dispatchEvent(new Event("componentsLoaded"));
});
