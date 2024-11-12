document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".taskbar button").forEach(button => {
    button.addEventListener("click", () => {
      const targetPage = button.getAttribute("data-target");
      if (targetPage) {
        window.location.href = targetPage;
      }
    });
  });

  const hamburgerMenu = document.getElementById('hamburger-menu');
  const bubbleMenu = document.getElementById('bubble-menu');

  // Toggle bubble menu on click
  hamburgerMenu.addEventListener('click', (event) => {
    event.stopPropagation(); // Prevent event from propagating to document
    bubbleMenu.classList.toggle('active');
  });

  // Hide bubble menu when clicking outside
  document.addEventListener('click', (event) => {
    if (!hamburgerMenu.contains(event.target) && !bubbleMenu.contains(event.target)) {
      bubbleMenu.classList.remove('active');
    }
  });
});
