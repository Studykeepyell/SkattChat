document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".taskbar button").forEach(button => {
      button.addEventListener("click", () => {
        const targetPage = button.getAttribute("data-target");
        if (targetPage) {
          window.location.href = targetPage;
        }
      });
    });
  });
  