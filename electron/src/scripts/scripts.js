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

        // Load the saved profile image on page load
        window.onload = function () {
          const savedImage = sessionStorage.getItem("profileImage");
          if (savedImage) {
            document.getElementById("taskbar-profile-img").src = savedImage;
          }
        };
  
        // Toggle bubble menu visibility
        document
          .getElementById("hamburger-menu")
          .addEventListener("click", function () {
            const bubbleMenu = document.getElementById("bubble-menu");
            bubbleMenu.classList.toggle("active");
            bubbleMenu.setAttribute(
              "aria-hidden",
              !bubbleMenu.classList.contains("active")
            );
          });
  
        // Taskbar navigation
        document
          .querySelectorAll(".taskbar button[data-target]")
          .forEach((button) => {
            button.addEventListener("click", (e) => {
              const target = e.currentTarget.getAttribute("data-target");
              window.location.href = target;
            });
          });
  
        // Toggle the emoji picker display
        document.getElementById("emoji-button").addEventListener("click", () => {
          const emojiPicker = document.getElementById("emoji-picker");
          emojiPicker.style.display =
            emojiPicker.style.display === "none" ? "block" : "none";
        });
  
        // Insert emoji into message input
        document.querySelectorAll(".emoji").forEach((emoji) => {
          emoji.addEventListener("click", () => {
            const messageInput = document.getElementById("messageInput");
            messageInput.value += emoji.textContent;
            document.getElementById("emoji-picker").style.display = "none";
          });
        });
  
        document.getElementById('darkModeButton').addEventListener('click', function() {
          document.body.classList.toggle('dark-mode'); // Save the user's preference 
          const isDarkMode = document.body.classList.contains('dark-mode'); 
          localStorage.setItem('darkMode', isDarkMode); }); // Load the user's preference on page load
        window.onload = function() { 
          const isDarkMode = JSON.parse(localStorage.getItem('darkMode')); 
          if (isDarkMode) { document.body.classList.add('dark-mode'); } 
        };
  
});
