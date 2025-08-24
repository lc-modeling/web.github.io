document.addEventListener("DOMContentLoaded", function () {
  const modal = document.getElementById("partnerModal");
  const openBtn = document.getElementById("openFormBtn");
  const closeBtn = document.getElementById("closeBtn");
  const minimizeBtn = document.getElementById("minimizeBtn");
  const maximizeBtn = document.getElementById("maximizeBtn");
  const form = document.getElementById("partnerForm");

  // Open Modal
  openBtn.addEventListener("click", () => {
    modal.style.display = "flex";
    modal.classList.remove("minimized");
    modal.querySelector(".modal-content").style.width = "";
  });

  // Close Modal
  closeBtn.addEventListener("click", () => {
    modal.style.display = "none";
  });

  // Minimize
  minimizeBtn.addEventListener("click", () => {
    modal.classList.toggle("minimized");
  });

  // Maximize
  maximizeBtn.addEventListener("click", () => {
    modal.classList.remove("minimized");
    modal.querySelector(".modal-content").style.width = "95%";
  });

  // Intercept submit to delay closing and clearing
  form.addEventListener("submit", function (e) {
    // Don't preventDefault since submission is handled elsewhere

    // Wait 2 seconds, then clear and close modal
    setTimeout(() => {
      form.reset();
      modal.style.display = "none";
    }, 1000); // 1000ms = 1 seconds
  });

  // Manual close utility
  window.closePartnerModal = function () {
    form.reset();
    modal.style.display = "none";
  };
});
