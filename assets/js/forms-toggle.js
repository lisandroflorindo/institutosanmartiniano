document.addEventListener("DOMContentLoaded", () => {
  const tabs = document.querySelectorAll(".tab[data-form]");
  const frame = document.getElementById("form-frame");
  const openBtn = document.getElementById("open-form");

  if (!tabs.length || !frame || !openBtn) return;

  // URLs reales (embed + abrir)
  const forms = {
    energias: {
      open: "https://docs.google.com/forms/d/e/1FAIpQLSf9rY5_D3pCNBJPqRbCPKRQVd3V14_6yU6YIepqlgcVAiPd6g/viewform?usp=send_form",
      embed: "https://docs.google.com/forms/d/e/1FAIpQLSf9rY5_D3pCNBJPqRbCPKRQVd3V14_6yU6YIepqlgcVAiPd6g/viewform?embedded=true"
    },
    obras: {
      open: "https://docs.google.com/forms/d/e/1FAIpQLSdEMkqOoXI0Y-rKNj0ztkcxht5IMWfrR_ttHk0XUAUB2l-zYQ/viewform?usp=send_form",
      embed: "https://docs.google.com/forms/d/e/1FAIpQLSdEMkqOoXI0Y-rKNj0ztkcxht5IMWfrR_ttHk0XUAUB2l-zYQ/viewform?embedded=true"
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
