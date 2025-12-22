function showToast(message) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  document.body.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add("is-visible"));
  setTimeout(() => {
    toast.classList.remove("is-visible");
    setTimeout(() => toast.remove(), 250);
  }, 2600);
}

function handleBasicForm(formId, successMsg) {
  const form = document.getElementById(formId);
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const required = form.querySelectorAll("[required]");
    for (const input of required) {
      if (!input.value || !String(input.value).trim()) {
        input.focus();
        showToast("Por favor completá los campos obligatorios.");
        return;
      }
    }

    // Acá luego conectamos a backend/servicio (Formspree/Netlify/tu API)
    form.reset();
    showToast(successMsg);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  handleBasicForm("contact-form", "¡Mensaje enviado! Te responderemos a la brevedad.");
  handleBasicForm("preinscription-form", "¡Solicitud registrada! Nos contactaremos para continuar.");
});
