document.addEventListener("DOMContentLoaded", () => {
  const buttons = document.querySelectorAll(".acc-btn");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      btn.classList.toggle("is-open");
    });
  });

  // Abrir el primero por defecto (opcional)
  const first = document.querySelector(".acc-btn");
  if (first) first.classList.add("is-open");
});
