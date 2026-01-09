document.addEventListener("DOMContentLoaded", () => {
  const tabs = document.querySelectorAll(".tab[data-form]");
  const frame = document.getElementById("form-frame");
  const openBtn = document.getElementById("open-form");

  if (!tabs.length || !frame || !openBtn) return;

  // URLs reales (embed + abrir)
  const forms = {
    energias: {
      open: "https://forms.gle/5PC9GdkjYw9pYnR89",
      embed: "https://forms.gle/5PC9GdkjYw9pYnR89"
    },
    obras: {
      open: "https://forms.gle/rhhfcdrEdAFLiT5e7",
      embed: "https://forms.gle/rhhfcdrEdAFLiT5e7"
    }
  };

  function setActive(key) {
    tabs.forEach(t => {
      const isActive = t.getAttribute("data-form") === key;
      t.classList.toggle("is-active", isActive);
      t.setAttribute("aria-selected", isActive ? "true" : "false");
    });

    frame.src = forms[key].embed;
    openBtn.href = forms[key].open;
  }

  tabs.forEach(btn => {
    btn.addEventListener("click", () => setActive(btn.getAttribute("data-form")));
  });

  // default
  setActive("energias");
});
